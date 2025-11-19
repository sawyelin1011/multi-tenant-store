import { db } from '../config/database.js';
import { Tenant } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export class TenantService {
  async createTenant(data: {
    slug: string;
    name: string;
    domain?: string;
    subdomain?: string;
    plan?: string;
  }): Promise<Tenant> {
    const existing = await db.oneOrNone('SELECT id FROM tenants WHERE slug = $1', [data.slug]);

    if (existing) {
      throw new ConflictError('Tenant slug already exists');
    }

    const tenant = await db.one(
      `INSERT INTO tenants (slug, name, domain, subdomain, plan, status, settings, branding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.slug,
        data.name,
        data.domain,
        data.subdomain,
        data.plan || 'basic',
        'active',
        '{}',
        '{}',
      ]
    );

    return tenant;
  }

  async getTenant(id: string): Promise<Tenant> {
    const tenant = await db.oneOrNone('SELECT * FROM tenants WHERE id = $1', [id]);

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await db.oneOrNone('SELECT * FROM tenants WHERE slug = $1', [slug]);

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return tenant;
  }

  async listTenants(limit: number = 50, offset: number = 0) {
    const data = await db.manyOrNone('SELECT * FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2', [
      limit,
      offset,
    ]);

    const [{ count }] = await db.one('SELECT COUNT(*) as count FROM tenants');

    return {
      data,
      total: parseInt(count, 10),
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(parseInt(count, 10) / limit),
    };
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await db.one(
      `UPDATE tenants 
       SET name = COALESCE($2, name),
           domain = COALESCE($3, domain),
           subdomain = COALESCE($4, subdomain),
           plan = COALESCE($5, plan),
           status = COALESCE($6, status),
           settings = COALESCE($7, settings),
           branding = COALESCE($8, branding),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.name,
        data.domain,
        data.subdomain,
        data.plan,
        data.status,
        data.settings ? JSON.stringify(data.settings) : null,
        data.branding ? JSON.stringify(data.branding) : null,
      ]
    );

    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    await db.none('DELETE FROM tenants WHERE id = $1', [id]);
  }

  async updateSettings(tenantId: string, settings: Record<string, any>): Promise<Tenant> {
    const tenant = await db.one(
      `UPDATE tenants 
       SET settings = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [tenantId, JSON.stringify(settings)]
    );

    return tenant;
  }

  async updateBranding(tenantId: string, branding: Record<string, any>): Promise<Tenant> {
    const tenant = await db.one(
      `UPDATE tenants 
       SET branding = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [tenantId, JSON.stringify(branding)]
    );

    return tenant;
  }
}

export const tenantService = new TenantService();
