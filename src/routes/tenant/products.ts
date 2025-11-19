import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { productService } from '../../services/productService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// Create product
router.post('/', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { product_type_id, name, slug, status, metadata } = req.body;

    const product = await productService.createProduct(req.tenantId!, {
      product_type_id,
      name,
      slug,
      status,
      metadata,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// List products
router.get('/', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const filters = {
      product_type_id: req.query.product_type_id,
      status: req.query.status,
    };

    const result = await productService.listProducts(req.tenantId!, filters, limit, offset);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get product
router.get('/:id', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const product = await productService.getProduct(req.tenantId!, req.params.id);
    const attributes = await productService.getAttributes(product.id);

    res.json({
      success: true,
      data: {
        ...product,
        attributes,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, slug, status, metadata } = req.body;

    const product = await productService.updateProduct(req.tenantId!, req.params.id, {
      name,
      slug,
      status,
      metadata,
    });

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// Set product attribute
router.post('/:id/attributes/:key', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { value, type } = req.body;

    const attribute = await productService.setAttribute(
      req.params.id,
      req.params.key,
      value,
      type
    );

    res.json({ success: true, data: attribute });
  } catch (error) {
    next(error);
  }
});

// Get product attributes
router.get('/:id/attributes', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const attributes = await productService.getAttributes(req.params.id);
    res.json({ success: true, data: attributes });
  } catch (error) {
    next(error);
  }
});

// Delete product
router.delete('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    await productService.deleteProduct(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
