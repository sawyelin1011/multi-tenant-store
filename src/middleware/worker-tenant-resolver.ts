import { Context, Next } from 'hono';
import { HonoEnv } from '../types/bindings.js';
import { NotFoundError } from '../utils/errors.js';
import { D1Adapter } from '../config/d1-database.js';

export async function resolveTenantWorker(c: Context<HonoEnv>, next: Next) {
  try {
    const tenantSlug = c.req.param('tenant_slug');

    if (!tenantSlug) {
      throw new NotFoundError('Tenant not found');
    }

    const db = new D1Adapter(c.env.DB);
    const tenant = await db.oneOrNone(
      'SELECT * FROM tenants WHERE slug = ? AND status = ?',
      [tenantSlug, 'active']
    );

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    c.set('tenant', tenant);
    c.set('tenantId', (tenant as any).id);
    await next();
  } catch (error) {
    throw error;
  }
}

export async function resolveTenantByDomainWorker(c: Context<HonoEnv>, next: Next) {
  try {
    const host = c.req.header('host');
    if (!host) {
      throw new NotFoundError('Tenant not found');
    }

    const db = new D1Adapter(c.env.DB);
    let tenant;

    tenant = await db.oneOrNone(
      'SELECT * FROM tenants WHERE domain = ? AND status = ?',
      [host, 'active']
    );

    if (!tenant) {
      const subdomain = host.split('.')[0];
      tenant = await db.oneOrNone(
        'SELECT * FROM tenants WHERE subdomain = ? AND status = ?',
        [subdomain, 'active']
      );
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    c.set('tenant', tenant);
    c.set('tenantId', (tenant as any).id);
    await next();
  } catch (error) {
    throw error;
  }
}
