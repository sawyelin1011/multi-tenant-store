import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { deliveryService } from '../../services/deliveryService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// Create delivery method
router.post('/', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, type, config, template } = req.body;

    const method = await deliveryService.createDeliveryMethod(req.tenantId!, {
      name,
      type,
      config,
      template,
    });

    res.status(201).json({ success: true, data: method });
  } catch (error) {
    next(error);
  }
});

// List delivery methods
router.get('/', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await deliveryService.listDeliveryMethods(req.tenantId!, limit, offset);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get delivery method
router.get('/:id', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const method = await deliveryService.getDeliveryMethod(req.tenantId!, req.params.id);
    res.json({ success: true, data: method });
  } catch (error) {
    next(error);
  }
});

// Update delivery method
router.put('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const method = await deliveryService.updateDeliveryMethod(req.tenantId!, req.params.id, req.body);
    res.json({ success: true, data: method });
  } catch (error) {
    next(error);
  }
});

// Delete delivery method
router.delete('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    await deliveryService.deleteDeliveryMethod(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Delivery method deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
