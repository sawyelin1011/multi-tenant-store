import { Hono } from 'hono';
import { z } from 'zod';
import { getWorkerDb } from '../../config/worker-database.js';
import { plugins, tenantPlugins } from '../../db/schema.js';
import { PluginManager } from '../../plugins/index.js';
import { eq, and, desc, like } from 'drizzle-orm';
import { HonoEnv } from '../../types/bindings.js';

const app = new Hono<HonoEnv>();

// Initialize plugin manager
const pluginManager = new PluginManager();

// Validation schemas
const InstallPluginSchema = z.object({
  config: z.record(z.any()).optional(),
});

const UpdateConfigSchema = z.object({
  config: z.record(z.any()),
});

// List all available plugins
app.get('/available', async (c) => {
  try {
    const db = getWorkerDb();
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const category = c.req.query('category');
    const search = c.req.query('search');

    let query = db.select().from(plugins);
    
    // Apply filters
    if (category) {
      // This would need to be implemented with JSON column filtering
      // For now, we'll fetch all and filter in memory
    }
    
    if (search) {
      query = query.where(
        like(plugins.name, `%${search}%`)
      );
    }

    const data = await query
      .orderBy(desc(plugins.created_at))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: plugins.id }).from(plugins);
    const total = countResult.length;

    // Parse manifests and filter by category if needed
    let filteredData = data.map(plugin => ({
      ...plugin,
      manifest: typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest,
    }));

    if (category) {
      filteredData = filteredData.filter(plugin => 
        plugin.manifest.category === category
      );
    }

    return c.json({
      success: true,
      data: filteredData,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error listing available plugins:', error);
    return c.json({
      success: false,
      error: 'Failed to list available plugins',
    }, 500);
  }
});

// List tenant plugins
app.get('/installed', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const db = getWorkerDb();
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const status = c.req.query('status');

    let whereCondition: any = eq(tenantPlugins.tenant_id, tenantId);
    
    if (status) {
      whereCondition = and(
        whereCondition,
        eq(tenantPlugins.status, status)
      );
    }

    const data = await db
      .select({
        tenantPlugin: tenantPlugins,
        plugin: plugins,
      })
      .from(tenantPlugins)
      .leftJoin(plugins, eq(tenantPlugins.plugin_id, plugins.id))
      .where(whereCondition)
      .orderBy(desc(tenantPlugins.installed_at))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: tenantPlugins.id })
      .from(tenantPlugins)
      .where(eq(tenantPlugins.tenant_id, tenantId));
    
    const total = countResult.length;

    const formattedData = data.map(item => ({
      id: item.tenantPlugin.id,
      plugin_id: item.tenantPlugin.plugin_id,
      status: item.tenantPlugin.status,
      config: typeof item.tenantPlugin.config === 'string' ? JSON.parse(item.tenantPlugin.config) : item.tenantPlugin.config,
      installed_at: item.tenantPlugin.installed_at,
      plugin: item.plugin ? {
        ...item.plugin,
        manifest: typeof item.plugin.manifest === 'string' ? JSON.parse(item.plugin.manifest) : item.plugin.manifest,
      } : null,
    }));

    return c.json({
      success: true,
      data: formattedData,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error listing installed plugins:', error);
    return c.json({
      success: false,
      error: 'Failed to list installed plugins',
    }, 500);
  }
});

// Get plugin details
app.get('/:pluginSlug', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const pluginSlug = c.req.param('pluginSlug');

    const db = getWorkerDb();
    
    // Get plugin details
    const plugin = await db.query.plugins.findFirst({
      where: eq(plugins.slug, pluginSlug),
    });

    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found',
      }, 404);
    }

    // Get tenant plugin info if installed
    const tenantPlugin = await db.query.tenantPlugins.findFirst({
      where: and(
        eq(tenantPlugins.tenant_id, tenantId),
        eq(tenantPlugins.plugin_id, plugin.id)
      ),
    });

    const pluginInfo = {
      ...plugin,
      manifest: typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest,
      installed: !!tenantPlugin,
      status: tenantPlugin?.status || 'not_installed',
      config: tenantPlugin ? (typeof tenantPlugin.config === 'string' ? JSON.parse(tenantPlugin.config) : tenantPlugin.config) : null,
      installed_at: tenantPlugin?.installed_at,
    };

    return c.json({
      success: true,
      data: pluginInfo,
    });

  } catch (error) {
    console.error('Error getting plugin details:', error);
    return c.json({
      success: false,
      error: 'Failed to get plugin details',
    }, 500);
  }
});

// Install plugin
app.post('/:pluginSlug/install', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const pluginSlug = c.req.param('pluginSlug');
    const body = await c.req.json();
    const { config } = InstallPluginSchema.parse(body);

    const db = getWorkerDb();
    
    // Check if plugin exists
    const plugin = await db.query.plugins.findFirst({
      where: eq(plugins.slug, pluginSlug),
    });

    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found',
      }, 404);
    }

    // Check if already installed
    const existingTenantPlugin = await db.query.tenantPlugins.findFirst({
      where: and(
        eq(tenantPlugins.tenant_id, tenantId),
        eq(tenantPlugins.plugin_id, plugin.id)
      ),
    });

    if (existingTenantPlugin) {
      return c.json({
        success: false,
        error: 'Plugin is already installed',
      }, 409);
    }

    // Install plugin using plugin manager
    await pluginManager.installPlugin(tenantId, pluginSlug, config || {});

    return c.json({
      success: true,
      message: 'Plugin installed successfully',
    });

  } catch (error) {
    console.error('Error installing plugin:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to install plugin',
    }, 500);
  }
});

// Activate plugin
app.post('/:pluginSlug/activate', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const pluginSlug = c.req.param('pluginSlug');

    // Activate plugin using plugin manager
    await pluginManager.activatePlugin(tenantId, pluginSlug);

    return c.json({
      success: true,
      message: 'Plugin activated successfully',
    });

  } catch (error) {
    console.error('Error activating plugin:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate plugin',
    }, 500);
  }
});

// Deactivate plugin
app.post('/:pluginSlug/deactivate', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const pluginSlug = c.req.param('pluginSlug');

    // Deactivate plugin using plugin manager
    await pluginManager.deactivatePlugin(tenantId, pluginSlug);

    return c.json({
      success: true,
      message: 'Plugin deactivated successfully',
    });

  } catch (error) {
    console.error('Error deactivating plugin:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate plugin',
    }, 500);
  }
});

// Uninstall plugin
app.delete('/:pluginSlug', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const pluginSlug = c.req.param('pluginSlug');

    // Uninstall plugin using plugin manager
    await pluginManager.uninstallPlugin(tenantId, pluginSlug);

    return c.json({
      success: true,
      message: 'Plugin uninstalled successfully',
    });

  } catch (error) {
    console.error('Error uninstalling plugin:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to uninstall plugin',
    }, 500);
  }
});

// Update plugin configuration
app.put('/:pluginSlug/config', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const pluginSlug = c.req.param('pluginSlug');
    const body = await c.req.json();
    const { config } = UpdateConfigSchema.parse(body);

    const db = getWorkerDb();
    
    // Get plugin
    const plugin = await db.query.plugins.findFirst({
      where: eq(plugins.slug, pluginSlug),
    });

    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found',
      }, 404);
    }

    // Update tenant plugin config
    await db
      .update(tenantPlugins)
      .set({
        config: JSON.stringify(config),
        updated_at: new Date().toISOString(),
      })
      .where(
        and(
          eq(tenantPlugins.tenant_id, tenantId),
          eq(tenantPlugins.plugin_id, plugin.id)
        )
      );

    return c.json({
      success: true,
      message: 'Plugin configuration updated successfully',
    });

  } catch (error) {
    console.error('Error updating plugin config:', error);
    return c.json({
      success: false,
      error: 'Failed to update plugin configuration',
    }, 500);
  }
});

// Get plugin configuration
app.get('/:pluginSlug/config', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const pluginSlug = c.req.param('pluginSlug');

    const db = getWorkerDb();
    
    // Get plugin
    const plugin = await db.query.plugins.findFirst({
      where: eq(plugins.slug, pluginSlug),
    });

    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found',
      }, 404);
    }

    // Get tenant plugin config
    const tenantPlugin = await db.query.tenantPlugins.findFirst({
      where: and(
        eq(tenantPlugins.tenant_id, tenantId),
        eq(tenantPlugins.plugin_id, plugin.id)
      ),
    });

    if (!tenantPlugin) {
      return c.json({
        success: false,
        error: 'Plugin is not installed',
      }, 404);
    }

    const pluginManifest = typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest;
    const config = typeof tenantPlugin.config === 'string' ? JSON.parse(tenantPlugin.config) : tenantPlugin.config;

    return c.json({
      success: true,
      data: {
        schema: pluginManifest.settings_schema || {},
        config: config || {},
      },
    });

  } catch (error) {
    console.error('Error getting plugin config:', error);
    return c.json({
      success: false,
      error: 'Failed to get plugin configuration',
    }, 500);
  }
});

// Get plugin dependencies
app.get('/:pluginSlug/dependencies', async (c) => {
  try {
    const pluginSlug = c.req.param('pluginSlug');

    // Check dependencies using plugin manager
    const resolution = pluginManager.checkDependencies(pluginSlug);

    return c.json({
      success: true,
      data: resolution,
    });

  } catch (error) {
    console.error('Error checking plugin dependencies:', error);
    return c.json({
      success: false,
      error: 'Failed to check plugin dependencies',
    }, 500);
  }
});

// Get plugin health status
app.get('/:pluginSlug/health', async (c) => {
  try {
    const tenantId = c.get('tenantId')!;
    const pluginSlug = c.req.param('pluginSlug');

    // Get plugin info including health
    const pluginInfo = await pluginManager.getPluginInfo(pluginSlug);

    if (!pluginInfo) {
      return c.json({
        success: false,
        error: 'Plugin not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        slug: pluginInfo.slug,
        healthStatus: pluginInfo.healthStatus,
        lastHealthCheck: pluginInfo.lastHealthCheck,
        resourceUsage: pluginInfo.resourceUsage,
        installed: pluginInfo.installed,
        active: pluginInfo.active,
      },
    });

  } catch (error) {
    console.error('Error getting plugin health:', error);
    return c.json({
      success: false,
      error: 'Failed to get plugin health status',
    }, 500);
  }
});

// Get dependency graph
app.get('/graph/dependencies', async (c) => {
  try {
    // Get dependency graph from plugin manager
    const graph = pluginManager.getDependencyGraph();

    return c.json({
      success: true,
      data: graph,
    });

  } catch (error) {
    console.error('Error getting dependency graph:', error);
    return c.json({
      success: false,
      error: 'Failed to get dependency graph',
    }, 500);
  }
});

export default app;