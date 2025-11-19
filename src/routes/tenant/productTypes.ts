import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { productTypeService } from '../../services/productTypeService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// Create product type
router.post('/', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, slug, icon, category, schema } = req.body;

    const productType = await productTypeService.createProductType(req.tenantId!, {
      name,
      slug,
      icon,
      category,
      schema,
    });

    res.status(201).json({ success: true, data: productType });
  } catch (error) {
    next(error);
  }
});

// List product types
router.get('/', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await productTypeService.listProductTypes(req.tenantId!, limit, offset);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get product type
router.get('/:id', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const productType = await productTypeService.getProductType(req.tenantId!, req.params.id);
    res.json({ success: true, data: productType });
  } catch (error) {
    next(error);
  }
});

// Update product type
router.put('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const productType = await productTypeService.updateProductType(
      req.tenantId!,
      req.params.id,
      req.body
    );
    res.json({ success: true, data: productType });
  } catch (error) {
    next(error);
  }
});

// Delete product type
router.delete('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    await productTypeService.deleteProductType(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Product type deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
