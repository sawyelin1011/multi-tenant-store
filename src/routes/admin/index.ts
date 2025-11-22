import { Router } from 'express';
import tenantsRouter from './tenants.js';
import usersRouter from './users.js';
import productsRouter from './products.js';

const router = Router();

router.use('/tenants', tenantsRouter);
router.use('/users', usersRouter);
router.use('/products', productsRouter);

export default router;
