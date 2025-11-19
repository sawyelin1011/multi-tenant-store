import { Hono } from 'hono';
import { HonoEnv } from '../types/bindings.js';
import { verifyAdminTokenWorker } from '../middleware/worker-auth.js';
import { tenantService } from '../services/tenantService.js';

export function registerAdminRoutes(app: Hono<HonoEnv>) {
  const admin = new Hono<HonoEnv>();

  // Create tenant
  admin.post('/tenants', verifyAdminTokenWorker, async (c) => {
    const { slug, name, domain, subdomain, plan } = await c.req.json();

    const tenant = await tenantService.createTenant({
      slug,
      name,
      domain,
      subdomain,
      plan,
    });

    return c.json({ success: true, data: tenant }, 201);
  });

  // List tenants
  admin.get('/tenants', verifyAdminTokenWorker, async (c) => {
    const page = parseInt(c.req.query('page') || '1') || 1;
    const limit = parseInt(c.req.query('limit') || '50') || 50;
    const offset = (page - 1) * limit;

    const result = await tenantService.listTenants(limit, offset);

    return c.json({ success: true, data: result });
  });

  // Get tenant
  admin.get('/tenants/:id', verifyAdminTokenWorker, async (c) => {
    const tenant = await tenantService.getTenant(c.req.param('id'));
    return c.json({ success: true, data: tenant });
  });

  // Update tenant
  admin.put('/tenants/:id', verifyAdminTokenWorker, async (c) => {
    const data = await c.req.json();
    const tenant = await tenantService.updateTenant(c.req.param('id'), data);
    return c.json({ success: true, data: tenant });
  });

  // Delete tenant
  admin.delete('/tenants/:id', verifyAdminTokenWorker, async (c) => {
    await tenantService.deleteTenant(c.req.param('id'));
    return c.json({ success: true, message: 'Tenant deleted' });
  });

  app.route('/api/admin', admin);
}
