import 'dotenv/config';
import express from 'express';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { bootstrap } from './bootstrap/index.js';
import { db } from './db/client.js';
import { orders, products, stores, tenants, users } from './db/schema.js';
import { authMiddleware } from './middleware/auth.js';
import { corsMiddleware, rateLimitMiddleware, sanitizeInput, securityHeaders } from './middleware/security.js';
import { ApiError, errorResponse, successResponse } from './utils/response.js';
import { logger } from './utils/logger.js';
import { clearCache, getCache, setCache } from './utils/cache.js';
import {
  createOrderSchema,
  createProductSchema,
  createStoreSchema,
  createTenantSchema,
  createUserSchema,
  validate,
} from './utils/validators.js';

const app = express();
app.use(express.json());
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(rateLimitMiddleware(60000, 100));

const handle = (
  handler: (req: express.Request, res: express.Response, next: express.NextFunction) => void | Promise<void>
) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const result = handler(req, res, next);
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).catch(next);
      }
    } catch (error) {
      next(error);
    }
  };
};

app.get(
  '/health',
  handle((_req, res) => {
    res.json(successResponse({ status: 'ok' }, 'Health check passed'));
  })
);

app.use('/api', authMiddleware);

app.get(
  '/api/users',
  handle((_req, res) => {
    const cacheKey = 'users:all';
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(successResponse(cached, 'Users fetched (cache)'));
    }

    const allUsers = db.select().from(users).all();
    setCache(cacheKey, allUsers, 30000);
    res.json(successResponse(allUsers, 'Users fetched'));
  })
);

app.post(
  '/api/users',
  handle((req, res) => {
    const payload = validate(createUserSchema, req.body);
    const email = payload.email.trim().toLowerCase();

    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      throw new ApiError(409, 'EMAIL_EXISTS', `Email ${email} already exists`);
    }

    const id = nanoid();
    db.insert(users)
      .values({
        id,
        email,
        role: payload.role,
      })
      .run();

    clearCache();
    logger('info', 'User created', { id, email });
    res.status(201).json(successResponse({ id, email, role: payload.role }, 'User created'));
  })
);

app.get(
  '/api/tenants',
  handle((_req, res) => {
    const cacheKey = 'tenants:all';
    const cached = getCache(cacheKey);

    if (cached) {
      return res.json(successResponse(cached, 'Tenants fetched (cache)'));
    }

    const allTenants = db.select().from(tenants).all();
    setCache(cacheKey, allTenants, 30000);
    res.json(successResponse(allTenants, 'Tenants fetched'));
  })
);

app.post(
  '/api/tenants',
  handle((req, res) => {
    const payload = validate(createTenantSchema, req.body);
    const slug = sanitizeInput(payload.slug).toLowerCase();
    const name = payload.name.trim();

    if (!name) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Name required');
    }

    const existing = db.select().from(tenants).where(eq(tenants.slug, slug)).get();
    if (existing) {
      throw new ApiError(409, 'SLUG_EXISTS', `Tenant slug ${slug} already exists`);
    }

    const id = nanoid();
    db.insert(tenants)
      .values({ id, name, slug })
      .run();

    clearCache();
    logger('info', 'Tenant created', { id, slug });
    res.status(201).json(successResponse({ id, name, slug }, 'Tenant created'));
  })
);

app.get(
  '/api/stores',
  handle((_req, res) => {
    const cacheKey = 'stores:all';
    const cached = getCache(cacheKey);

    if (cached) {
      return res.json(successResponse(cached, 'Stores fetched (cache)'));
    }

    const allStores = db.select().from(stores).all();
    setCache(cacheKey, allStores, 30000);
    res.json(successResponse(allStores, 'Stores fetched'));
  })
);

app.get(
  '/api/stores/:id',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();

    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    res.json(successResponse(store, 'Store fetched'));
  })
);

app.post(
  '/api/stores',
  handle((req, res) => {
    const payload = validate(createStoreSchema, req.body);
    const storeName = payload.name.trim();

    if (!storeName) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Name required');
    }

    const tenantRecord = db.select().from(tenants).where(eq(tenants.id, payload.tenant_id)).get();
    if (!tenantRecord) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    const existing = db
      .select()
      .from(stores)
      .where(and(eq(stores.tenant_id, payload.tenant_id), eq(stores.name, storeName)))
      .get();

    if (existing) {
      throw new ApiError(409, 'STORE_EXISTS', 'Store already exists for this tenant');
    }

    const id = nanoid();
    db.insert(stores)
      .values({ id, tenant_id: payload.tenant_id, name: storeName, type: payload.type })
      .run();

    clearCache();
    logger('info', 'Store created', { id, tenant_id: payload.tenant_id });
    res.status(201).json(
      successResponse({ id, tenant_id: payload.tenant_id, name: storeName, type: payload.type }, 'Store created')
    );
  })
);

app.get(
  '/api/products',
  handle((_req, res) => {
    const cacheKey = 'products:all';
    const cached = getCache(cacheKey);

    if (cached) {
      return res.json(successResponse(cached, 'Products fetched (cache)'));
    }

    const allProducts = db.select().from(products).all();
    setCache(cacheKey, allProducts, 30000);
    res.json(successResponse(allProducts, 'Products fetched'));
  })
);

app.get(
  '/api/products/:id',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.id)).get();

    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    res.json(successResponse(product, 'Product fetched'));
  })
);

app.post(
  '/api/products',
  handle((req, res) => {
    const payload = validate(createProductSchema, req.body);
    const productName = payload.name.trim();

    if (!productName) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Name required');
    }

    const storeRecord = db.select().from(stores).where(eq(stores.id, payload.store_id)).get();
    if (!storeRecord) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    if (payload.sku) {
      const existingSku = db.select().from(products).where(eq(products.sku, payload.sku)).get();
      if (existingSku) {
        throw new ApiError(409, 'SKU_EXISTS', `Product SKU ${payload.sku} already exists`);
      }
    }

    const id = nanoid();
    db.insert(products)
      .values({
        id,
        store_id: payload.store_id,
        name: productName,
        sku: payload.sku,
        price: payload.price,
        description: payload.description,
        type: payload.type,
      })
      .run();

    clearCache();
    logger('info', 'Product created', { id, store_id: payload.store_id });
    res.status(201).json(
      successResponse(
        {
          id,
          store_id: payload.store_id,
          name: productName,
          sku: payload.sku,
          price: payload.price,
          description: payload.description,
          type: payload.type,
        },
        'Product created'
      )
    );
  })
);

app.get(
  '/api/orders',
  handle((_req, res) => {
    const cacheKey = 'orders:all';
    const cached = getCache(cacheKey);

    if (cached) {
      return res.json(successResponse(cached, 'Orders fetched (cache)'));
    }

    const allOrders = db.select().from(orders).all();
    setCache(cacheKey, allOrders, 30000);
    res.json(successResponse(allOrders, 'Orders fetched'));
  })
);

app.get(
  '/api/orders/:id',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();

    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    res.json(successResponse(order, 'Order fetched'));
  })
);

app.post(
  '/api/orders',
  handle((req, res) => {
    const payload = validate(createOrderSchema, req.body);

    const storeRecord = db.select().from(stores).where(eq(stores.id, payload.store_id)).get();
    if (!storeRecord) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    if (payload.user_id) {
      const userRecord = db.select().from(users).where(eq(users.id, payload.user_id)).get();
      if (!userRecord) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }
    }

    const id = nanoid();
    db.insert(orders)
      .values({
        id,
        store_id: payload.store_id,
        user_id: payload.user_id,
        total: payload.total,
        status: payload.status,
      })
      .run();

    clearCache();
    logger('info', 'Order created', { id, store_id: payload.store_id });
    res.status(201).json(
      successResponse(
        { id, store_id: payload.store_id, user_id: payload.user_id, total: payload.total, status: payload.status },
        'Order created'
      )
    );
  })
);

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(errorResponse(err.statusCode, err.code, err.message));
  }

  logger('error', 'Unhandled error', { message: err?.message, stack: err?.stack });
  res.status(500).json(errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred'));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      logger('info', 'Server started', { port: PORT });
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📚 API Key: ${process.env.SUPER_ADMIN_API_KEY || 'sk_test_admin123456'}`);
    });
  })
  .catch((error) => {
    logger('error', 'Failed to bootstrap', { error: error.message });
    console.error('Failed to bootstrap:', error);
    process.exit(1);
  });

export default app;
