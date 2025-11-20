import { Hono, Context } from 'hono';
import { HonoEnv } from '../types/bindings.js';
import { resolveTenantWorker } from '../middleware/worker-tenant-resolver.js';
import { verifyTenantTokenWorker } from '../middleware/worker-auth.js';
import { drizzleProductService } from '../services/drizzle-product-service.js';
import { drizzleProductTypeService } from '../services/drizzle-product-type-service.js';
import { drizzleWorkflowService } from '../services/drizzle-workflow-service.js';
import { drizzleDeliveryService } from '../services/drizzle-delivery-service.js';
import { drizzlePluginService } from '../services/drizzle-plugin-service.js';
import { drizzleOrderService } from '../services/drizzle-order-service.js';
import { drizzleIntegrationService } from '../services/drizzle-integration-service.js';
import { drizzlePaymentService } from '../services/drizzle-payment-service.js';

export function registerTenantRoutes(app: Hono<HonoEnv>) {
  const tenant = new Hono<HonoEnv>();

  // Helper to get tenantId with type assertion
  const getTenantId = (c: Context<HonoEnv>) => {
    const tenantId = getTenantId(c);
    if (!tenantId) {
      throw new Error('Tenant ID not found in context');
    }
    return tenantId;
  };

  // Product Types
  const productTypes = new Hono<HonoEnv>();

  productTypes.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();

    const productType = await drizzleProductTypeService.createProductType(tenantId, body);
    return c.json({ success: true, data: productType }, 201);
  });

  productTypes.get('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const result = await drizzleProductTypeService.listProductTypes(tenantId);
    return c.json({ success: true, data: result });
  });

  productTypes.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const productType = await drizzleProductTypeService.getProductType(tenantId, c.req.param('id'));
    return c.json({ success: true, data: productType });
  });

  productTypes.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();
    const productType = await drizzleProductTypeService.updateProductType(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: productType });
  });

  productTypes.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    await drizzleProductTypeService.deleteProductType(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Product type deleted' });
  });

  // Products
  const products = new Hono<HonoEnv>();

  products.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const { product_type_id, name, slug, status, metadata } = await c.req.json();

    const product = await drizzleProductService.createProduct(tenantId, {
      product_type_id,
      name,
      slug,
      status,
      metadata,
    });

    return c.json({ success: true, data: product }, 201);
  });

  products.get('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const page = parseInt(c.req.query('page') || '1') || 1;
    const limit = parseInt(c.req.query('limit') || '50') || 50;
    const offset = (page - 1) * limit;

    const filters = {
      product_type_id: c.req.query('product_type_id'),
      status: c.req.query('status'),
    };

    const result = await drizzleProductService.listProducts(tenantId, filters, limit, offset);
    return c.json({ success: true, data: result });
  });

  products.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const product = await drizzleProductService.getProduct(tenantId, c.req.param('id'));
    const attributes = await drizzleProductService.getAttributes(product.id);

    return c.json({
      success: true,
      data: {
        ...product,
        attributes,
      },
    });
  });

  products.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const { name, slug, status, metadata } = await c.req.json();

    const product = await drizzleProductService.updateProduct(tenantId, c.req.param('id'), {
      name,
      slug,
      status,
      metadata,
    });

    return c.json({ success: true, data: product });
  });

  products.post('/:id/attributes/:key', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const { value, type } = await c.req.json();

    const attribute = await drizzleProductService.setAttribute(
      c.req.param('id'),
      c.req.param('key'),
      value,
      type
    );

    return c.json({ success: true, data: attribute });
  });

  products.get('/:id/attributes', resolveTenantWorker, async (c) => {
    const attributes = await drizzleProductService.getAttributes(c.req.param('id'));
    return c.json({ success: true, data: attributes });
  });

  products.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    await drizzleProductService.deleteProduct(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Product deleted' });
  });

  // Workflows
  const workflows = new Hono<HonoEnv>();

  workflows.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();

    const workflow = await drizzleWorkflowService.createWorkflow(tenantId, body);
    return c.json({ success: true, data: workflow }, 201);
  });

  workflows.get('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const result = await drizzleWorkflowService.listWorkflows(tenantId);
    return c.json({ success: true, data: result });
  });

  workflows.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const workflow = await drizzleWorkflowService.getWorkflow(tenantId, c.req.param('id'));
    return c.json({ success: true, data: workflow });
  });

  workflows.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();
    const workflow = await drizzleWorkflowService.updateWorkflow(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: workflow });
  });

  workflows.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    await drizzleWorkflowService.deleteWorkflow(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Workflow deleted' });
  });

  // Delivery Methods
  const deliveryMethods = new Hono<HonoEnv>();

  deliveryMethods.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();

    const method = await drizzleDeliveryService.createDeliveryMethod(tenantId, body);
    return c.json({ success: true, data: method }, 201);
  });

  deliveryMethods.get('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const result = await drizzleDeliveryService.listDeliveryMethods(tenantId);
    return c.json({ success: true, data: result });
  });

  deliveryMethods.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const method = await drizzleDeliveryService.getDeliveryMethod(tenantId, c.req.param('id'));
    return c.json({ success: true, data: method });
  });

  deliveryMethods.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();
    const method = await drizzleDeliveryService.updateDeliveryMethod(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: method });
  });

  deliveryMethods.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    await drizzleDeliveryService.deleteDeliveryMethod(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Delivery method deleted' });
  });

  // Plugins
  const plugins = new Hono<HonoEnv>();

  plugins.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const { plugin_id, config } = await c.req.json();

    const result = await drizzlePluginService.installPlugin(tenantId, plugin_id, config);
    return c.json({ success: true, data: result }, 201);
  });

  plugins.get('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const result = await drizzlePluginService.listTenantPlugins(tenantId);
    return c.json({ success: true, data: result });
  });

  plugins.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const plugin = await drizzlePluginService.getTenantPlugin(tenantId, c.req.param('id'));
    return c.json({ success: true, data: plugin });
  });

  plugins.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();
    const plugin = await drizzlePluginService.updateTenantPluginConfig(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: plugin });
  });

  plugins.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    await drizzlePluginService.uninstallPlugin(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Plugin uninstalled' });
  });

  // Orders
  const orders = new Hono<HonoEnv>();

  orders.post('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();

    const order = await drizzleOrderService.createOrder(tenantId, body);
    return c.json({ success: true, data: order }, 201);
  });

  orders.get('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const page = parseInt(c.req.query('page') || '1') || 1;
    const limit = parseInt(c.req.query('limit') || '50') || 50;
    const offset = (page - 1) * limit;

    const result = await drizzleOrderService.listOrders(tenantId, limit, offset);
    return c.json({ success: true, data: result });
  });

  orders.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const order = await drizzleOrderService.getOrder(tenantId, c.req.param('id'));
    return c.json({ success: true, data: order });
  });

  // Integrations
  const integrations = new Hono<HonoEnv>();

  integrations.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();

    const integration = await drizzleIntegrationService.createIntegration(tenantId, body);
    return c.json({ success: true, data: integration }, 201);
  });

  integrations.get('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const result = await drizzleIntegrationService.listIntegrations(tenantId);
    return c.json({ success: true, data: result });
  });

  integrations.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const integration = await drizzleIntegrationService.getIntegration(tenantId, c.req.param('id'));
    return c.json({ success: true, data: integration });
  });

  integrations.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();
    const integration = await drizzleIntegrationService.updateIntegration(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: integration });
  });

  integrations.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    await drizzleIntegrationService.deleteIntegration(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Integration deleted' });
  });

  // Payment Gateways
  const paymentGateways = new Hono<HonoEnv>();

  paymentGateways.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    const body = await c.req.json();

    const gateway = await drizzlePaymentService.createPaymentGateway(tenantId, body);
    return c.json({ success: true, data: gateway }, 201);
  });

  paymentGateways.get('/', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const result = await drizzlePaymentService.listPaymentGateways(tenantId);
    return c.json({ success: true, data: result });
  });

  paymentGateways.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = getTenantId(c);
    const gateway = await drizzlePaymentService.getPaymentGateway(tenantId, c.req.param('id'));
    return c.json({ success: true, data: gateway });
  });

  paymentGateways.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = getTenantId(c);
    await drizzlePaymentService.deletePaymentGateway(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Payment gateway removed' });
  });

  // Mount all routes
  tenant.route('/product-types', productTypes);
  tenant.route('/products', products);
  tenant.route('/workflows', workflows);
  tenant.route('/delivery-methods', deliveryMethods);
  tenant.route('/plugins', plugins);
  tenant.route('/orders', orders);
  tenant.route('/integrations', integrations);
  tenant.route('/payment-gateways', paymentGateways);

  app.route('/api/:tenant_slug/admin', tenant);
}
