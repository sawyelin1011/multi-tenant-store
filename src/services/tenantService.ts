import { db } from '../db/client.js';
import { tenants } from '../db/schema.js';
import { Tenant } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { eq, desc, SQL, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class TenantService {
  async createTenant(data: {
    slug: string;
    name: string;
    domain?: string;
    subdomain?: string;
    plan?: string;
  }): Promise<Tenant> {
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.slug, data.slug),
    });

    if (existing) {
      throw new ConflictError('Tenant slug already exists');
    }

    const tenant = await db.insert(tenants).values({
      id: uuidv4(),
      slug: data.slug,
      name: data.name,
      domain: data.domain,
      subdomain: data.subdomain,
      plan: (data.plan || 'basic') as 'basic' | 'premium' | 'enterprise',
      status: 'active' as 'active' | 'inactive' | 'suspended',
      settings: '{}',
      branding: '{}',
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();

    return tenant[0] as any as Tenant;
  }

  async getTenant(id: string): Promise<Tenant> {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return tenant as any as Tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return tenant as any as Tenant;
  }

  async listTenants(limit: number = 50, offset: number = 0) {
    const data = await db.query.tenants.findMany({
      orderBy: desc(tenants.created_at),
      limit,
      offset,
    });

    // Count total - get all records to count (Drizzle limitation with PostgreSQL)
    const allRecords = await db.query.tenants.findMany();
    const total = allRecords.length;

    return {
      data: data as any as Tenant[],
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.domain) updates.domain = data.domain;
    if (data.subdomain) updates.subdomain = data.subdomain;
    if (data.plan) updates.plan = data.plan;
    if (data.status) updates.status = data.status;
    if (data.settings) updates.settings = JSON.stringify(data.settings);
    if (data.branding) updates.branding = JSON.stringify(data.branding);
    updates.updated_at = new Date();

    const result = await db.update(tenants)
      .set(updates)
      .where(eq(tenants.id, id))
      .returning();

    return result[0] as any as Tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  async updateSettings(tenantId: string, settings: Record<string, any>): Promise<Tenant> {
    const result = await db.update(tenants)
      .set({
        settings: JSON.stringify(settings),
        updated_at: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return result[0] as any as Tenant;
  }

  async updateBranding(tenantId: string, branding: Record<string, any>): Promise<Tenant> {
    const result = await db.update(tenants)
      .set({
        branding: JSON.stringify(branding),
        updated_at: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return result[0] as any as Tenant;
  }
}

export const tenantService = new TenantService();
