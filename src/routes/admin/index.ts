import { Router } from 'express';
import tenantsRouter from './tenants.js';

const router = Router();

router.use('/tenants', tenantsRouter);

export default router;
