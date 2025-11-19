import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { productService } from '../../services/productService.js';
import { productTypeService } from '../../services/productTypeService.js';
import { optionalTenantToken, resolveTenant } from '../../middleware/index.js';

const router = Router({ mergeParams: true });

// List products
router.get('/', resolveTenant, optionalTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const filters = {
      product_type_id: req.query.product_type_id,
      status: 'active',
    };

    const result = await productService.listProducts(req.tenantId!, filters, limit, offset);

    // Filter out draft products
    const data = result.data.filter(p => p.status !== 'draft');

    res.json({
      success: true,
      data: {
        ...result,
        data,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single product
router.get('/:id', resolveTenant, optionalTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const product = await productService.getProduct(req.tenantId!, req.params.id);

    if (product.status === 'draft') {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const attributes = await productService.getAttributes(product.id);
    const productType = await productTypeService.getProductType(req.tenantId!, product.product_type_id);

    res.json({
      success: true,
      data: {
        ...product,
        type: productType,
        attributes,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
