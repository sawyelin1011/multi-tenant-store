import { getWorkerDb, withWorkerTenantId } from '../config/worker-database.js';
import { tenants } from '../db/schema.js';
import { Tenant } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { eq, and } from 'drizzle-orm';

export class DrizzleTenantService {
  async createTenant(data: {
    slug: string;
    name: string;
    domain?: string;
    subdomain?: string;
    plan?: string;
  }): Promise<Tenant> {
    const db = getWorkerDb();
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.slug, data.slug),
    });

    if (existing) {
      throw new ConflictError('Tenant slug already exists');
    }

    const [tenant] = await db
      .insert(tenants)
      .values({
        slug: data.slug,
        name: data.name,
        domain: data.domain,
        subdomain: data.subdomain,
        plan: data.plan || 'basic',
        status: 'active',
        settings: '{}',
        branding: '{}',
      })
      .returning();

    return this.parseTenant(tenant);
  }

  async getTenant(id: string): Promise<Tenant> {
    const db = getWorkerDb();
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return this.parseTenant(tenant);
  }

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const db = getWorkerDb();
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return this.parseTenant(tenant);
  }

  async listTenants(limit: number = 50, offset: number = 0) {
    const db = getWorkerDb();

    const data = await db.query.tenants.findMany({
      orderBy: (t) => t.created_at,
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: tenants.id })
      .from(tenants);

    const total = countResult.length;

    return {
      data: data.map((t) => this.parseTenant(t)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const db = getWorkerDb();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.domain !== undefined) updateData.domain = data.domain;
    if (data.subdomain !== undefined) updateData.subdomain = data.subdomain;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.settings !== undefined) updateData.settings = JSON.stringify(data.settings);
    if (data.branding !== undefined) updateData.branding = JSON.stringify(data.branding);
    updateData.updated_at = new Date().toISOString();

    const [tenant] = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, id))
      .returning();

    return this.parseTenant(tenant);
  }

  async deleteTenant(id: string): Promise<void> {
    const db = getWorkerDb();
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  async updateSettings(tenantId: string, settings: Record<string, any>): Promise<Tenant> {
    const db = getWorkerDb();

    const [tenant] = await db
      .update(tenants)
      .set({
        settings: JSON.stringify(settings),
        updated_at: new Date().toISOString(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return this.parseTenant(tenant);
  }

  async updateBranding(tenantId: string, branding: Record<string, any>): Promise<Tenant> {
    const db = getWorkerDb();

    const [tenant] = await db
      .update(tenants)
      .set({
        branding: JSON.stringify(branding),
        updated_at: new Date().toISOString(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return this.parseTenant(tenant);
  }

  private parseTenant(tenant: any): Tenant {
    return {
      ...tenant,
      settings: typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings,
      branding: typeof tenant.branding === 'string' ? JSON.parse(tenant.branding) : tenant.branding,
    };
  }
}

export const drizzleTenantService = new DrizzleTenantService();
