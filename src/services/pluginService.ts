import { db } from '../config/database.js';
import { Plugin, TenantPlugin } from '../types/index.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export class PluginService {
  async registerPlugin(data: {
    name: string;
    slug: string;
    version?: string;
    author?: string;
    description?: string;
    manifest: Record<string, any>;
    is_official?: boolean;
  }): Promise<Plugin> {
    const existing = await db.oneOrNone('SELECT id FROM plugins WHERE slug = $1', [data.slug]);

    if (existing) {
      throw new ConflictError('Plugin slug already exists');
    }

    const plugin = await db.one(
      `INSERT INTO plugins (name, slug, version, author, description, manifest, is_official, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.version || '1.0.0',
        data.author,
        data.description,
        JSON.stringify(data.manifest),
        data.is_official || false,
        'available',
      ]
    );

    return plugin;
  }

  async getPlugin(id: string): Promise<Plugin> {
    const plugin = await db.oneOrNone('SELECT * FROM plugins WHERE id = $1', [id]);

    if (!plugin) {
      throw new NotFoundError('Plugin not found');
    }

    return plugin;
  }

  async listPlugins(limit: number = 50, offset: number = 0) {
    const data = await db.manyOrNone(
      'SELECT * FROM plugins ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const [{ count }] = await db.one('SELECT COUNT(*) as count FROM plugins');

    return {
      data,
      total: parseInt(count, 10),
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(parseInt(count, 10) / limit),
    };
  }

  async installPlugin(tenantId: string, pluginId: string, config: Record<string, any> = {}): Promise<TenantPlugin> {
    const existing = await db.oneOrNone(
      'SELECT id FROM tenant_plugins WHERE tenant_id = $1 AND plugin_id = $2',
      [tenantId, pluginId]
    );

    if (existing) {
      throw new ConflictError('Plugin already installed');
    }

    const tenantPlugin = await db.one(
      `INSERT INTO tenant_plugins (tenant_id, plugin_id, status, config)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, pluginId, 'inactive', JSON.stringify(config)]
    );

    return tenantPlugin;
  }

  async getTenantPlugin(tenantId: string, pluginId: string): Promise<TenantPlugin> {
    const tenantPlugin = await db.oneOrNone(
      'SELECT * FROM tenant_plugins WHERE tenant_id = $1 AND plugin_id = $2',
      [tenantId, pluginId]
    );

    if (!tenantPlugin) {
      throw new NotFoundError('Plugin not installed');
    }

    return tenantPlugin;
  }

  async listTenantPlugins(tenantId: string, limit: number = 50, offset: number = 0) {
    const data = await db.manyOrNone(
      'SELECT tp.*, p.name, p.slug, p.version, p.manifest FROM tenant_plugins tp JOIN plugins p ON tp.plugin_id = p.id WHERE tp.tenant_id = $1 ORDER BY tp.installed_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );

    const [{ count }] = await db.one(
      'SELECT COUNT(*) as count FROM tenant_plugins WHERE tenant_id = $1',
      [tenantId]
    );

    return {
      data,
      total: parseInt(count, 10),
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(parseInt(count, 10) / limit),
    };
  }

  async updatePluginConfig(tenantId: string, pluginId: string, config: Record<string, any>): Promise<TenantPlugin> {
    const tenantPlugin = await db.one(
      `UPDATE tenant_plugins 
       SET config = $3, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1 AND plugin_id = $2
       RETURNING *`,
      [tenantId, pluginId, JSON.stringify(config)]
    );

    return tenantPlugin;
  }

  async enablePlugin(tenantId: string, pluginId: string): Promise<TenantPlugin> {
    const tenantPlugin = await db.one(
      `UPDATE tenant_plugins 
       SET status = $3
       WHERE tenant_id = $1 AND plugin_id = $2
       RETURNING *`,
      [tenantId, pluginId, 'active']
    );

    return tenantPlugin;
  }

  async disablePlugin(tenantId: string, pluginId: string): Promise<TenantPlugin> {
    const tenantPlugin = await db.one(
      `UPDATE tenant_plugins 
       SET status = $3
       WHERE tenant_id = $1 AND plugin_id = $2
       RETURNING *`,
      [tenantId, pluginId, 'inactive']
    );

    return tenantPlugin;
  }

  async uninstallPlugin(tenantId: string, pluginId: string): Promise<void> {
    await db.none(
      'DELETE FROM tenant_plugins WHERE tenant_id = $1 AND plugin_id = $2',
      [tenantId, pluginId]
    );
  }
}

export const pluginService = new PluginService();
