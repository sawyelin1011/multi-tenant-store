import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { orderService } from '../../services/orderService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// Create order
router.post('/', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.createOrder(req.tenantId!, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// List orders
router.get('/', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const filters = {
      status: req.query.status,
      user_id: req.query.user_id,
    };

    const result = await orderService.listOrders(req.tenantId!, filters, limit, offset);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get order
router.get('/:id', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.getOrder(req.tenantId!, req.params.id);
    const items = await orderService.getOrderItems(req.params.id);

    res.json({
      success: true,
      data: {
        ...order,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update order
router.put('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.updateOrder(req.tenantId!, req.params.id, req.body);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// Add order item
router.post('/:id/items', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const item = await orderService.addOrderItem(req.params.id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

export default router;
