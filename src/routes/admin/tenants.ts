import { Router } from 'express';
import { AdminAuthRequest } from '../../types/express.js';
import { tenantService } from '../../services/tenantService.js';
import { verifyAdminToken } from '../../middleware/auth.js';

const router = Router();

// Create tenant
router.post('/', verifyAdminToken, async (req: AdminAuthRequest, res, next) => {
  try {
    const { slug, name, domain, subdomain, plan } = req.body;

    const tenant = await tenantService.createTenant({
      slug,
      name,
      domain,
      subdomain,
      plan,
    });

    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
});

// List tenants
router.get('/', verifyAdminToken, async (req: AdminAuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await tenantService.listTenants(limit, offset);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get tenant
router.get('/:id', verifyAdminToken, async (req: AdminAuthRequest, res, next) => {
  try {
    const tenant = await tenantService.getTenant(req.params.id);
    res.json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
});

// Update tenant
router.put('/:id', verifyAdminToken, async (req: AdminAuthRequest, res, next) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
});

// Delete tenant
router.delete('/:id', verifyAdminToken, async (req: AdminAuthRequest, res, next) => {
  try {
    await tenantService.deleteTenant(req.params.id);
    res.json({ success: true, message: 'Tenant deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
