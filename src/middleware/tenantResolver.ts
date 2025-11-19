import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { AuthRequest } from '../types/express.js';

export async function resolveTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { tenant_slug } = req.params;

    if (!tenant_slug) {
      throw new NotFoundError('Tenant not found');
    }

    const tenant = await db.oneOrNone(
      'SELECT * FROM tenants WHERE slug = $1 AND status = $2',
      [tenant_slug, 'active']
    );

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
}

export async function resolveTenantByDomain(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const host = req.get('host');
    if (!host) {
      throw new NotFoundError('Tenant not found');
    }

    let tenant;

    // Try domain first
    tenant = await db.oneOrNone(
      'SELECT * FROM tenants WHERE domain = $1 AND status = $2',
      [host, 'active']
    );

    if (!tenant) {
      // Try subdomain
      const subdomain = host.split('.')[0];
      tenant = await db.oneOrNone(
        'SELECT * FROM tenants WHERE subdomain = $1 AND status = $2',
        [subdomain, 'active']
      );
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
}
