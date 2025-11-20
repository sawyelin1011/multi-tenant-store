import { getWorkerDb } from '../config/worker-database.js';
import { plugins, tenantPlugins } from '../db/schema.js';
import { Plugin, TenantPlugin } from '../types/index.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzlePluginService {
  async registerPlugin(data: {
    name: string;
    slug: string;
    version?: string;
    author?: string;
    description?: string;
    manifest: Record<string, any>;
    is_official?: boolean;
  }): Promise<Plugin> {
    const db = getWorkerDb();

    const existing = await db.query.plugins.findFirst({
      where: eq(plugins.slug, data.slug),
    });

    if (existing) {
      throw new ConflictError('Plugin slug already exists');
    }

    const [plugin] = await db
      .insert(plugins)
      .values({
        name: data.name,
        slug: data.slug,
        version: data.version || '1.0.0',
        author: data.author,
        description: data.description,
        manifest: JSON.stringify(data.manifest),
        is_official: data.is_official || false,
        status: 'available',
      })
      .returning();

    return this.parsePlugin(plugin);
  }

  async getPlugin(id: string): Promise<Plugin> {
    const db = getWorkerDb();

    const plugin = await db.query.plugins.findFirst({
      where: eq(plugins.id, id),
    });

    if (!plugin) {
      throw new NotFoundError('Plugin not found');
    }

    return this.parsePlugin(plugin);
  }

  async listPlugins(limit: number = 50, offset: number = 0) {
    const db = getWorkerDb();

    const data = await db.query.plugins.findMany({
      orderBy: (p) => desc(p.created_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: plugins.id })
      .from(plugins);

    const total = countResult.length;

    return {
      data: data.map((p) => this.parsePlugin(p)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async installPlugin(
    tenantId: string,
    pluginId: string,
    config: Record<string, any> = {}
  ): Promise<TenantPlugin> {
    const db = getWorkerDb();

    const existing = await db.query.tenantPlugins.findFirst({
      where: and(eq(tenantPlugins.tenant_id, tenantId), eq(tenantPlugins.plugin_id, pluginId)),
    });

    if (existing) {
      throw new ConflictError('Plugin already installed');
    }

    const [tenantPlugin] = await db
      .insert(tenantPlugins)
      .values({
        tenant_id: tenantId,
        plugin_id: pluginId,
        status: 'inactive',
        config: JSON.stringify(config),
      })
      .returning();

    return this.parseTenantPlugin(tenantPlugin);
  }

  async getTenantPlugin(tenantId: string, pluginId: string): Promise<TenantPlugin> {
    const db = getWorkerDb();

    const tenantPlugin = await db.query.tenantPlugins.findFirst({
      where: and(eq(tenantPlugins.tenant_id, tenantId), eq(tenantPlugins.plugin_id, pluginId)),
    });

    if (!tenantPlugin) {
      throw new NotFoundError('Plugin not installed');
    }

    return this.parseTenantPlugin(tenantPlugin);
  }

  async listTenantPlugins(tenantId: string, limit: number = 50, offset: number = 0) {
    const db = getWorkerDb();

    const data = await db.query.tenantPlugins.findMany({
      where: eq(tenantPlugins.tenant_id, tenantId),
      with: {
        plugin: true,
      },
      orderBy: (tp) => desc(tp.installed_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: tenantPlugins.id })
      .from(tenantPlugins)
      .where(eq(tenantPlugins.tenant_id, tenantId));

    const total = countResult.length;

    return {
      data: data.map((tp) => this.parseTenantPlugin(tp)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updatePluginConfig(
    tenantId: string,
    pluginId: string,
    config: Record<string, any>
  ): Promise<TenantPlugin> {
    const db = getWorkerDb();

    const [tenantPlugin] = await db
      .update(tenantPlugins)
      .set({
        config: JSON.stringify(config),
      })
      .where(and(eq(tenantPlugins.tenant_id, tenantId), eq(tenantPlugins.plugin_id, pluginId)))
      .returning();

    return this.parseTenantPlugin(tenantPlugin);
  }

  async enablePlugin(tenantId: string, pluginId: string): Promise<TenantPlugin> {
    const db = getWorkerDb();

    const [tenantPlugin] = await db
      .update(tenantPlugins)
      .set({
        status: 'active',
      })
      .where(and(eq(tenantPlugins.tenant_id, tenantId), eq(tenantPlugins.plugin_id, pluginId)))
      .returning();

    return this.parseTenantPlugin(tenantPlugin);
  }

  async disablePlugin(tenantId: string, pluginId: string): Promise<TenantPlugin> {
    const db = getWorkerDb();

    const [tenantPlugin] = await db
      .update(tenantPlugins)
      .set({
        status: 'inactive',
      })
      .where(and(eq(tenantPlugins.tenant_id, tenantId), eq(tenantPlugins.plugin_id, pluginId)))
      .returning();

    return this.parseTenantPlugin(tenantPlugin);
  }

  async uninstallPlugin(tenantId: string, pluginId: string): Promise<void> {
    const db = getWorkerDb();

    await db
      .delete(tenantPlugins)
      .where(and(eq(tenantPlugins.tenant_id, tenantId), eq(tenantPlugins.plugin_id, pluginId)));
  }

  private parsePlugin(plugin: any): Plugin {
    return {
      ...plugin,
      manifest: typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest,
    };
  }

  private parseTenantPlugin(tp: any): TenantPlugin {
    return {
      ...tp,
      config: typeof tp.config === 'string' ? JSON.parse(tp.config) : tp.config,
    };
  }
}

export const drizzlePluginService = new DrizzlePluginService();
