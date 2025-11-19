import { Router } from 'express';
import productTypesRouter from './productTypes.js';
import productsRouter from './products.js';
import workflowsRouter from './workflows.js';
import deliveryMethodsRouter from './deliveryMethods.js';
import pluginsRouter from './plugins.js';
import ordersRouter from './orders.js';
import integrationsRouter from './integrations.js';
import paymentGatewaysRouter from './paymentGateways.js';

const router = Router({ mergeParams: true });

router.use('/product-types', productTypesRouter);
router.use('/products', productsRouter);
router.use('/workflows', workflowsRouter);
router.use('/delivery-methods', deliveryMethodsRouter);
router.use('/plugins', pluginsRouter);
router.use('/orders', ordersRouter);
router.use('/integrations', integrationsRouter);
router.use('/payment-gateways', paymentGatewaysRouter);

export default router;
