import { Hono } from 'hono';
import { HonoEnv } from '../types/bindings.js';
import { resolveTenantWorker } from '../middleware/worker-tenant-resolver.js';
import { optionalTenantTokenWorker } from '../middleware/worker-auth.js';
import { productService } from '../services/productService.js';
import { productTypeService } from '../services/productTypeService.js';

export function registerStorefrontRoutes(app: Hono<HonoEnv>) {
  const storefront = new Hono<HonoEnv>();

  const products = new Hono<HonoEnv>();

  // List products
  products.get('/', resolveTenantWorker, optionalTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const page = parseInt(c.req.query('page') || '1') || 1;
    const limit = parseInt(c.req.query('limit') || '20') || 20;
    const offset = (page - 1) * limit;

    const filters = {
      product_type_id: c.req.query('product_type_id'),
      status: 'active',
    };

    const result = await productService.listProducts(tenantId, filters, limit, offset);

    const data = result.data.filter((p: any) => p.status !== 'draft');

    return c.json({
      success: true,
      data: {
        ...result,
        data,
      },
    });
  });

  // Get single product
  products.get('/:id', resolveTenantWorker, optionalTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const productId = c.req.param('id');

    const product = await productService.getProduct(tenantId, productId);

    if (product.status === 'draft') {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    const attributes = await productService.getAttributes(product.id);
    const productType = await productTypeService.getProductType(tenantId, product.product_type_id);

    return c.json({
      success: true,
      data: {
        ...product,
        type: productType,
        attributes,
      },
    });
  });

  storefront.route('/products', products);
  app.route('/api/:tenant_slug/storefront', storefront);
}
