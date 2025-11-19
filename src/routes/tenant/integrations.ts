import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { integrationService } from '../../services/integrationService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// Create integration
router.post('/', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const integration = await integrationService.createIntegration(req.tenantId!, req.body);
    res.status(201).json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
});

// List integrations
router.get('/', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await integrationService.listIntegrations(req.tenantId!, limit, offset);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get integration
router.get('/:id', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const integration = await integrationService.getIntegration(req.tenantId!, req.params.id);
    res.json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
});

// Update integration
router.put('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const integration = await integrationService.updateIntegration(req.tenantId!, req.params.id, req.body);
    res.json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
});

// Delete integration
router.delete('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    await integrationService.deleteIntegration(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Integration deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
