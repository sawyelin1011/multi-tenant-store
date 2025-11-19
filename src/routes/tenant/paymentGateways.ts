import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { paymentService } from '../../services/paymentService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// Create payment gateway
router.post('/', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const gateway = await paymentService.createPaymentGateway(req.tenantId!, req.body);
    res.status(201).json({ success: true, data: gateway });
  } catch (error) {
    next(error);
  }
});

// List payment gateways
router.get('/', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await paymentService.listPaymentGateways(req.tenantId!, limit, offset);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get payment gateway
router.get('/:id', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const gateway = await paymentService.getPaymentGateway(req.tenantId!, req.params.id);
    res.json({ success: true, data: gateway });
  } catch (error) {
    next(error);
  }
});

// Update payment gateway
router.put('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const gateway = await paymentService.updatePaymentGateway(req.tenantId!, req.params.id, req.body);
    res.json({ success: true, data: gateway });
  } catch (error) {
    next(error);
  }
});

// Delete payment gateway
router.delete('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    await paymentService.deletePaymentGateway(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Payment gateway deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
