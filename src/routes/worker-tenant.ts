import { Hono } from 'hono';
import { HonoEnv } from '../types/bindings.js';
import { resolveTenantWorker } from '../middleware/worker-tenant-resolver.js';
import { verifyTenantTokenWorker } from '../middleware/worker-auth.js';
import { productService } from '../services/productService.js';
import { productTypeService } from '../services/productTypeService.js';
import { workflowService } from '../services/workflowService.js';
import { deliveryService } from '../services/deliveryService.js';
import { pluginService } from '../services/pluginService.js';
import { orderService } from '../services/orderService.js';
import { integrationService } from '../services/integrationService.js';
import { paymentService } from '../services/paymentService.js';

export function registerTenantRoutes(app: Hono<HonoEnv>) {
  const tenant = new Hono<HonoEnv>();

  // Product Types
  const productTypes = new Hono<HonoEnv>();

  productTypes.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();

    const productType = await productTypeService.createProductType(tenantId, body);
    return c.json({ success: true, data: productType }, 201);
  });

  productTypes.get('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const result = await productTypeService.listProductTypes(tenantId);
    return c.json({ success: true, data: result });
  });

  productTypes.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const productType = await productTypeService.getProductType(tenantId, c.req.param('id'));
    return c.json({ success: true, data: productType });
  });

  productTypes.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const productType = await productTypeService.updateProductType(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: productType });
  });

  productTypes.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    await productTypeService.deleteProductType(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Product type deleted' });
  });

  // Products
  const products = new Hono<HonoEnv>();

  products.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const { product_type_id, name, slug, status, metadata } = await c.req.json();

    const product = await productService.createProduct(tenantId, {
      product_type_id,
      name,
      slug,
      status,
      metadata,
    });

    return c.json({ success: true, data: product }, 201);
  });

  products.get('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const page = parseInt(c.req.query('page') || '1') || 1;
    const limit = parseInt(c.req.query('limit') || '50') || 50;
    const offset = (page - 1) * limit;

    const filters = {
      product_type_id: c.req.query('product_type_id'),
      status: c.req.query('status'),
    };

    const result = await productService.listProducts(tenantId, filters, limit, offset);
    return c.json({ success: true, data: result });
  });

  products.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const product = await productService.getProduct(tenantId, c.req.param('id'));
    const attributes = await productService.getAttributes(product.id);

    return c.json({
      success: true,
      data: {
        ...product,
        attributes,
      },
    });
  });

  products.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const { name, slug, status, metadata } = await c.req.json();

    const product = await productService.updateProduct(tenantId, c.req.param('id'), {
      name,
      slug,
      status,
      metadata,
    });

    return c.json({ success: true, data: product });
  });

  products.post('/:id/attributes/:key', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const { value, type } = await c.req.json();

    const attribute = await productService.setAttribute(
      c.req.param('id'),
      c.req.param('key'),
      value,
      type
    );

    return c.json({ success: true, data: attribute });
  });

  products.get('/:id/attributes', resolveTenantWorker, async (c) => {
    const attributes = await productService.getAttributes(c.req.param('id'));
    return c.json({ success: true, data: attributes });
  });

  products.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    await productService.deleteProduct(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Product deleted' });
  });

  // Workflows
  const workflows = new Hono<HonoEnv>();

  workflows.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();

    const workflow = await workflowService.createWorkflow(tenantId, body);
    return c.json({ success: true, data: workflow }, 201);
  });

  workflows.get('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const result = await workflowService.listWorkflows(tenantId);
    return c.json({ success: true, data: result });
  });

  workflows.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const workflow = await workflowService.getWorkflow(tenantId, c.req.param('id'));
    return c.json({ success: true, data: workflow });
  });

  workflows.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const workflow = await workflowService.updateWorkflow(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: workflow });
  });

  workflows.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    await workflowService.deleteWorkflow(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Workflow deleted' });
  });

  // Delivery Methods
  const deliveryMethods = new Hono<HonoEnv>();

  deliveryMethods.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();

    const method = await deliveryService.createDeliveryMethod(tenantId, body);
    return c.json({ success: true, data: method }, 201);
  });

  deliveryMethods.get('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const result = await deliveryService.listDeliveryMethods(tenantId);
    return c.json({ success: true, data: result });
  });

  deliveryMethods.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const method = await deliveryService.getDeliveryMethod(tenantId, c.req.param('id'));
    return c.json({ success: true, data: method });
  });

  deliveryMethods.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const method = await deliveryService.updateDeliveryMethod(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: method });
  });

  deliveryMethods.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    await deliveryService.deleteDeliveryMethod(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Delivery method deleted' });
  });

  // Plugins
  const plugins = new Hono<HonoEnv>();

  plugins.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const { plugin_id, config } = await c.req.json();

    const result = await pluginService.installPlugin(tenantId, plugin_id, config);
    return c.json({ success: true, data: result }, 201);
  });

  plugins.get('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const result = await pluginService.listTenantPlugins(tenantId);
    return c.json({ success: true, data: result });
  });

  plugins.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const plugin = await pluginService.getTenantPlugin(tenantId, c.req.param('id'));
    return c.json({ success: true, data: plugin });
  });

  plugins.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const plugin = await pluginService.updateTenantPluginConfig(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: plugin });
  });

  plugins.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    await pluginService.uninstallPlugin(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Plugin uninstalled' });
  });

  // Orders
  const orders = new Hono<HonoEnv>();

  orders.post('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();

    const order = await orderService.createOrder(tenantId, body);
    return c.json({ success: true, data: order }, 201);
  });

  orders.get('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const page = parseInt(c.req.query('page') || '1') || 1;
    const limit = parseInt(c.req.query('limit') || '50') || 50;
    const offset = (page - 1) * limit;

    const result = await orderService.listOrders(tenantId, limit, offset);
    return c.json({ success: true, data: result });
  });

  orders.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const order = await orderService.getOrder(tenantId, c.req.param('id'));
    return c.json({ success: true, data: order });
  });

  // Integrations
  const integrations = new Hono<HonoEnv>();

  integrations.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();

    const integration = await integrationService.createIntegration(tenantId, body);
    return c.json({ success: true, data: integration }, 201);
  });

  integrations.get('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const result = await integrationService.listIntegrations(tenantId);
    return c.json({ success: true, data: result });
  });

  integrations.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const integration = await integrationService.getIntegration(tenantId, c.req.param('id'));
    return c.json({ success: true, data: integration });
  });

  integrations.put('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const integration = await integrationService.updateIntegration(tenantId, c.req.param('id'), body);
    return c.json({ success: true, data: integration });
  });

  integrations.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    await integrationService.deleteIntegration(tenantId, c.req.param('id'));
    return c.json({ success: true, message: 'Integration deleted' });
  });

  // Payment Gateways
  const paymentGateways = new Hono<HonoEnv>();

  paymentGateways.post('/', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();

    const gateway = await paymentService.configurePaymentGateway(tenantId, body);
    return c.json({ success: true, data: gateway }, 201);
  });

  paymentGateways.get('/', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const result = await paymentService.listPaymentGateways(tenantId);
    return c.json({ success: true, data: result });
  });

  paymentGateways.get('/:id', resolveTenantWorker, async (c) => {
    const tenantId = c.get('tenantId');
    const gateway = await paymentService.getPaymentGateway(tenantId, c.req.param('id'));
    return c.json({ success: true, data: gateway });
  });

  paymentGateways.delete('/:id', resolveTenantWorker, verifyTenantTokenWorker, async (c) => {
    const tenantId = c.get('tenantId');
    await paymentService.removePaymentGateway(tenantId, c.req.param('id'));
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
