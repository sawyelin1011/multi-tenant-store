import { Hono, Context } from 'hono';
import { HonoEnv } from '../types/bindings.js';
import { resolveTenantWorker } from '../middleware/worker-tenant-resolver.js';
import { optionalTenantTokenWorker } from '../middleware/worker-auth.js';
import { drizzleProductService } from '../services/drizzle-product-service.js';
import { drizzleProductTypeService } from '../services/drizzle-product-type-service.js';

export function registerStorefrontRoutes(app: Hono<HonoEnv>) {
  const storefront = new Hono<HonoEnv>();

  // Helper to get tenantId with type assertion
  const getTenantId = (c: Context<HonoEnv>): string => {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      throw new Error('Tenant ID not found in context');
    }
    return tenantId;
  };

  const products = new Hono<HonoEnv>();

  // List products
  products.get('/', resolveTenantWorker, optionalTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const page = parseInt(c.req.query('page') || '1') || 1;
    const limit = parseInt(c.req.query('limit') || '20') || 20;
    const offset = (page - 1) * limit;

    const filters = {
      product_type_id: c.req.query('product_type_id'),
      status: 'active',
    };

    const result = await drizzleProductService.listProducts(tenantId, filters, limit, offset);

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
    const tenantId = getTenantId(c);
    const productId = c.req.param('id');

    const product = await drizzleProductService.getProduct(tenantId, productId);

    if (product.status === 'draft') {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    const attributes = await drizzleProductService.getAttributes(product.id);
    const productType = await drizzleProductTypeService.getProductType(tenantId, product.product_type_id);

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
