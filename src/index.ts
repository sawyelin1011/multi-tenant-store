import 'dotenv/config';
import express from 'express';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { bootstrap } from './bootstrap/index.js';
import { db } from './db/client.js';
import { order_items, orders, products, stores, tenants, users } from './db/schema.js';
import { authMiddleware } from './middleware/auth.js';
import { corsMiddleware, rateLimitMiddleware, sanitizeInput, securityHeaders } from './middleware/security.js';
import { ApiError, errorResponse, successResponse } from './utils/response.js';
import { logger } from './utils/logger.js';
import { clearCache, getCache, setCache } from './utils/cache.js';
import {
  createOrderItemSchema,
  createOrderSchema,
  createProductSchema,
  createStoreSchema,
  createTenantSchema,
  createUserSchema,
  paginationSchema,
  updateOrderItemSchema,
  updateOrderSchema,
  updateProductSchema,
  updateStoreSchema,
  updateTenantSchema,
  updateUserSchema,
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

// ============ HEALTH CHECK ============

app.get(
  '/health',
  handle((_req, res) => {
    res.json(successResponse({ status: 'ok' }, 'Health check passed'));
  })
);

// ============ AUTHENTICATION ============

app.use('/api', authMiddleware);

// ============ USERS ENDPOINTS ============

app.get(
  '/api/users',
  handle((req, res) => {
    const { limit, offset } = validate(paginationSchema, req.query);
    const cacheKey = `users:list:${limit}:${offset}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(successResponse(cached, 'Users fetched (cache)'));
    }

    const allUsers = db.select().from(users).all();
    const total = allUsers.length;
    const paginatedUsers = allUsers.slice(offset, offset + limit);
    const response = {
      data: paginatedUsers,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };

    setCache(cacheKey, response, 30000);
    res.json(successResponse(response, 'Users fetched'));
  })
);

app.get(
  '/api/users/:id',
  handle((req, res) => {
    const user = db.select().from(users).where(eq(users.id, req.params.id)).get();

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json(successResponse(user, 'User fetched'));
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
    const apiKey = `sk_${nanoid(32)}`;
    db.insert(users)
      .values({
        id,
        email,
        role: payload.role,
        api_key: apiKey,
      })
      .run();

    clearCache();
    logger('info', 'User created', { id, email });
    res.status(201).json(successResponse({ id, email, role: payload.role, api_key: apiKey }, 'User created'));
  })
);

app.put(
  '/api/users/:id',
  handle((req, res) => {
    const user = db.select().from(users).where(eq(users.id, req.params.id)).get();
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const payload = validate(updateUserSchema, req.body);

    if (payload.email) {
      const email = payload.email.trim().toLowerCase();
      const existing = db.select().from(users).where(eq(users.email, email)).get();
      if (existing && existing.id !== req.params.id) {
        throw new ApiError(409, 'EMAIL_EXISTS', `Email ${email} already exists`);
      }
      user.email = email;
    }

    if (payload.role) {
      user.role = payload.role;
    }

    db.update(users).set(user).where(eq(users.id, req.params.id)).run();

    clearCache();
    logger('info', 'User updated', { id: req.params.id });
    res.json(successResponse(user, 'User updated'));
  })
);

app.delete(
  '/api/users/:id',
  handle((req, res) => {
    const user = db.select().from(users).where(eq(users.id, req.params.id)).get();
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    db.delete(users).where(eq(users.id, req.params.id)).run();

    clearCache();
    logger('info', 'User deleted', { id: req.params.id });
    res.status(204).send();
  })
);

app.get(
  '/api/users/:id/api-keys',
  handle((req, res) => {
    const user = db.select().from(users).where(eq(users.id, req.params.id)).get();
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const apiKeys = user.api_key ? [{ id: nanoid(), key: user.api_key, created_at: user.created_at }] : [];
    res.json(successResponse(apiKeys, 'API keys fetched'));
  })
);

app.post(
  '/api/users/:id/api-keys',
  handle((req, res) => {
    const user = db.select().from(users).where(eq(users.id, req.params.id)).get();
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const apiKey = `sk_${nanoid(32)}`;
    db.update(users).set({ api_key: apiKey }).where(eq(users.id, req.params.id)).run();

    clearCache();
    logger('info', 'API key created', { id: req.params.id });
    res.status(201).json(successResponse({ id: nanoid(), key: apiKey, created_at: new Date().toISOString() }, 'API key created'));
  })
);

app.delete(
  '/api/users/:id/api-keys/:keyId',
  handle((req, res) => {
    const user = db.select().from(users).where(eq(users.id, req.params.id)).get();
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    db.update(users).set({ api_key: null }).where(eq(users.id, req.params.id)).run();

    clearCache();
    logger('info', 'API key revoked', { id: req.params.id });
    res.status(204).send();
  })
);

// ============ TENANTS ENDPOINTS ============

app.get(
  '/api/tenants',
  handle((req, res) => {
    const { limit, offset } = validate(paginationSchema, req.query);
    const cacheKey = `tenants:list:${limit}:${offset}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(successResponse(cached, 'Tenants fetched (cache)'));
    }

    const allTenants = db.select().from(tenants).all();
    const total = allTenants.length;
    const paginatedTenants = allTenants.slice(offset, offset + limit);
    const response = {
      data: paginatedTenants,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };

    setCache(cacheKey, response, 30000);
    res.json(successResponse(response, 'Tenants fetched'));
  })
);

app.get(
  '/api/tenants/:id',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    res.json(successResponse(tenant, 'Tenant fetched'));
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
    db.insert(tenants).values({ id, name, slug, config: '{}' }).run();

    clearCache();
    logger('info', 'Tenant created', { id, slug });
    res.status(201).json(successResponse({ id, name, slug }, 'Tenant created'));
  })
);

app.put(
  '/api/tenants/:id',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    const payload = validate(updateTenantSchema, req.body);

    if (payload.name) {
      tenant.name = payload.name.trim();
    }

    if (payload.slug) {
      const slug = sanitizeInput(payload.slug).toLowerCase();
      const existing = db.select().from(tenants).where(eq(tenants.slug, slug)).get();
      if (existing && existing.id !== req.params.id) {
        throw new ApiError(409, 'SLUG_EXISTS', `Tenant slug ${slug} already exists`);
      }
      tenant.slug = slug;
    }

    if (payload.config) {
      tenant.config = JSON.stringify(payload.config);
    }

    db.update(tenants).set(tenant).where(eq(tenants.id, req.params.id)).run();

    clearCache();
    logger('info', 'Tenant updated', { id: req.params.id });
    res.json(successResponse(tenant, 'Tenant updated'));
  })
);

app.delete(
  '/api/tenants/:id',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    db.delete(tenants).where(eq(tenants.id, req.params.id)).run();

    clearCache();
    logger('info', 'Tenant deleted', { id: req.params.id });
    res.status(204).send();
  })
);

app.get(
  '/api/tenants/:id/config',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    const config = JSON.parse(tenant.config || '{}');
    res.json(successResponse(config, 'Tenant config fetched'));
  })
);

app.put(
  '/api/tenants/:id/config',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    tenant.config = JSON.stringify(req.body || {});
    db.update(tenants).set(tenant).where(eq(tenants.id, req.params.id)).run();

    clearCache();
    logger('info', 'Tenant config updated', { id: req.params.id });
    res.json(successResponse(JSON.parse(tenant.config), 'Tenant config updated'));
  })
);

app.get(
  '/api/tenants/:id/usage',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    const tenantStores = db.select().from(stores).where(eq(stores.tenant_id, req.params.id)).all();
    const storeIds = tenantStores.map((s) => s.id);
    const allProducts = db.select().from(products).all();
    const tenantProducts = allProducts.filter((p) => storeIds.includes(p.store_id));

    const usage = {
      stores: tenantStores.length,
      products: tenantProducts.length,
      orders: 0,
      total_revenue: 0,
    };

    res.json(successResponse(usage, 'Tenant usage fetched'));
  })
);

app.get(
  '/api/tenants/:id/members',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    res.json(successResponse({ data: [], total: 0 }, 'Tenant members fetched'));
  })
);

app.post(
  '/api/tenants/:id/members',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    res.status(201).json(successResponse({ user_id: req.body.user_id, role: req.body.role || 'member' }, 'Member added'));
  })
);

app.delete(
  '/api/tenants/:id/members/:userId',
  handle((req, res) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.params.id)).get();
    if (!tenant) {
      throw new ApiError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
    }

    logger('info', 'Tenant member removed', { id: req.params.id, userId: req.params.userId });
    res.status(204).send();
  })
);

// ============ STORES ENDPOINTS ============

app.get(
  '/api/stores',
  handle((req, res) => {
    const { limit, offset } = validate(paginationSchema, req.query);
    const cacheKey = `stores:list:${limit}:${offset}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(successResponse(cached, 'Stores fetched (cache)'));
    }

    const allStores = db.select().from(stores).all();
    const total = allStores.length;
    const paginatedStores = allStores.slice(offset, offset + limit);
    const response = {
      data: paginatedStores,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };

    setCache(cacheKey, response, 30000);
    res.json(successResponse(response, 'Stores fetched'));
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
      .values({ id, tenant_id: payload.tenant_id, name: storeName, type: payload.type, config: '{}' })
      .run();

    clearCache();
    logger('info', 'Store created', { id, tenant_id: payload.tenant_id });
    res
      .status(201)
      .json(successResponse({ id, tenant_id: payload.tenant_id, name: storeName, type: payload.type }, 'Store created'));
  })
);

app.put(
  '/api/stores/:id',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    const payload = validate(updateStoreSchema, req.body);

    if (payload.name) {
      store.name = payload.name.trim();
    }

    if (payload.type) {
      store.type = payload.type;
    }

    if (payload.config) {
      store.config = JSON.stringify(payload.config);
    }

    db.update(stores).set(store).where(eq(stores.id, req.params.id)).run();

    clearCache();
    logger('info', 'Store updated', { id: req.params.id });
    res.json(successResponse(store, 'Store updated'));
  })
);

app.delete(
  '/api/stores/:id',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    db.delete(stores).where(eq(stores.id, req.params.id)).run();

    clearCache();
    logger('info', 'Store deleted', { id: req.params.id });
    res.status(204).send();
  })
);

app.get(
  '/api/stores/:id/config',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    const config = JSON.parse(store.config || '{}');
    res.json(successResponse(config, 'Store config fetched'));
  })
);

app.put(
  '/api/stores/:id/config',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    store.config = JSON.stringify(req.body || {});
    db.update(stores).set(store).where(eq(stores.id, req.params.id)).run();

    clearCache();
    logger('info', 'Store config updated', { id: req.params.id });
    res.json(successResponse(JSON.parse(store.config), 'Store config updated'));
  })
);

app.get(
  '/api/stores/:id/stats',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    const storeProducts = db.select().from(products).where(eq(products.store_id, req.params.id)).all();
    const storeOrders = db.select().from(orders).where(eq(orders.store_id, req.params.id)).all();

    const stats = {
      products: storeProducts.length,
      orders: storeOrders.length,
      revenue: storeOrders.reduce((sum, order) => sum + (order.total || 0), 0),
    };

    res.json(successResponse(stats, 'Store stats fetched'));
  })
);

app.get(
  '/api/stores/:id/settings',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    const settings = JSON.parse(store.config || '{}');
    res.json(successResponse(settings, 'Store settings fetched'));
  })
);

app.put(
  '/api/stores/:id/settings',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    store.config = JSON.stringify(req.body || {});
    db.update(stores).set(store).where(eq(stores.id, req.params.id)).run();

    clearCache();
    logger('info', 'Store settings updated', { id: req.params.id });
    res.json(successResponse(JSON.parse(store.config), 'Store settings updated'));
  })
);

// ============ PRODUCTS ENDPOINTS ============

app.get(
  '/api/products',
  handle((req, res) => {
    const { limit, offset } = validate(paginationSchema, req.query);
    const store_id = (req.query.store_id as string) || null;

    const cacheKey = `products:list:${limit}:${offset}:${store_id || 'all'}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(successResponse(cached, 'Products fetched (cache)'));
    }

    let allProducts = db.select().from(products).all();
    if (store_id) {
      allProducts = allProducts.filter((p) => p.store_id === store_id);
    }

    const total = allProducts.length;
    const paginatedProducts = allProducts.slice(offset, offset + limit);
    const response = {
      data: paginatedProducts,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };

    setCache(cacheKey, response, 30000);
    res.json(successResponse(response, 'Products fetched'));
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
        status: 'active',
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

app.put(
  '/api/products/:id',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.id)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const payload = validate(updateProductSchema, req.body);

    if (payload.name) {
      product.name = payload.name.trim();
    }

    if (payload.price !== undefined) {
      product.price = payload.price;
    }

    if (payload.description !== undefined) {
      product.description = payload.description;
    }

    if (payload.sku) {
      product.sku = payload.sku;
    }

    if (payload.type) {
      product.type = payload.type;
    }

    if (payload.status) {
      product.status = payload.status;
    }

    db.update(products).set(product).where(eq(products.id, req.params.id)).run();

    clearCache();
    logger('info', 'Product updated', { id: req.params.id });
    res.json(successResponse(product, 'Product updated'));
  })
);

app.delete(
  '/api/products/:id',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.id)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    db.delete(products).where(eq(products.id, req.params.id)).run();

    clearCache();
    logger('info', 'Product deleted', { id: req.params.id });
    res.status(204).send();
  })
);

app.get(
  '/api/products/:id/variants',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.id)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const attributes = JSON.parse(product.attributes || '{}');
    res.json(successResponse({ variants: Object.keys(attributes).length > 0 ? [attributes] : [] }, 'Product variants fetched'));
  })
);

app.post(
  '/api/products/:id/variants',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.id)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const variant = {
      id: nanoid(),
      ...req.body,
    };

    const attributes = JSON.parse(product.attributes || '{}');
    attributes[variant.id] = variant;
    product.attributes = JSON.stringify(attributes);

    db.update(products).set(product).where(eq(products.id, req.params.id)).run();

    clearCache();
    logger('info', 'Product variant added', { id: req.params.id });
    res.status(201).json(successResponse(variant, 'Product variant added'));
  })
);

app.delete(
  '/api/products/:id/variants/:variantId',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.id)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const attributes = JSON.parse(product.attributes || '{}');
    delete attributes[req.params.variantId];
    product.attributes = JSON.stringify(attributes);

    db.update(products).set(product).where(eq(products.id, req.params.id)).run();

    clearCache();
    logger('info', 'Product variant deleted', { id: req.params.id });
    res.status(204).send();
  })
);

app.patch(
  '/api/products/:id/status',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.id)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const { status } = req.body;
    if (!status || !['active', 'inactive', 'draft'].includes(status)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid status');
    }

    product.status = status;
    db.update(products).set(product).where(eq(products.id, req.params.id)).run();

    clearCache();
    logger('info', 'Product status updated', { id: req.params.id, status });
    res.json(successResponse(product, 'Product status updated'));
  })
);

app.get(
  '/api/products/store/:storeId',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.storeId)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    const { limit, offset } = validate(paginationSchema, req.query);
    const storeProducts = db.select().from(products).where(eq(products.store_id, req.params.storeId)).all();
    const total = storeProducts.length;
    const paginatedProducts = storeProducts.slice(offset, offset + limit);

    res.json(
      successResponse(
        { data: paginatedProducts, total, limit, offset, hasMore: offset + limit < total },
        'Store products fetched'
      )
    );
  })
);

app.post(
  '/api/products/bulk',
  handle((req, res) => {
    const { products: productsToCreate } = req.body;
    if (!Array.isArray(productsToCreate)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Products must be an array');
    }

    const created = [];
    for (const productData of productsToCreate) {
      const payload = validate(createProductSchema, productData);
      const id = nanoid();

      db.insert(products)
        .values({
          id,
          store_id: payload.store_id,
          name: payload.name.trim(),
          sku: payload.sku,
          price: payload.price,
          description: payload.description,
          type: payload.type,
        })
        .run();

      created.push({ id, ...payload });
    }

    clearCache();
    logger('info', 'Bulk products created', { count: created.length });
    res.status(201).json(successResponse({ created }, 'Bulk products created'));
  })
);

app.delete(
  '/api/products/bulk',
  handle((req, res) => {
    const { product_ids } = req.body;
    if (!Array.isArray(product_ids)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Product IDs must be an array');
    }

    let deleted = 0;
    for (const id of product_ids) {
      const product = db.select().from(products).where(eq(products.id, id)).get();
      if (product) {
        db.delete(products).where(eq(products.id, id)).run();
        deleted++;
      }
    }

    clearCache();
    logger('info', 'Bulk products deleted', { count: deleted });
    res.json(successResponse({ deleted }, 'Bulk products deleted'));
  })
);

// ============ ORDERS ENDPOINTS ============

app.get(
  '/api/orders',
  handle((req, res) => {
    const { limit, offset } = validate(paginationSchema, req.query);
    const store_id = (req.query.store_id as string) || null;

    const cacheKey = `orders:list:${limit}:${offset}:${store_id || 'all'}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(successResponse(cached, 'Orders fetched (cache)'));
    }

    let allOrders = db.select().from(orders).all();
    if (store_id) {
      allOrders = allOrders.filter((o) => o.store_id === store_id);
    }

    const total = allOrders.length;
    const paginatedOrders = allOrders.slice(offset, offset + limit);
    const response = {
      data: paginatedOrders,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };

    setCache(cacheKey, response, 30000);
    res.json(successResponse(response, 'Orders fetched'));
  })
);

app.get(
  '/api/orders/:id',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();

    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const items = db.select().from(order_items).where(eq(order_items.order_id, req.params.id)).all();

    res.json(successResponse({ ...order, items }, 'Order fetched'));
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
        { id, store_id: payload.store_id, user_id: payload.user_id, total: payload.total, status: payload.status, items: [] },
        'Order created'
      )
    );
  })
);

app.put(
  '/api/orders/:id',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const payload = validate(updateOrderSchema, req.body);

    if (payload.status) {
      order.status = payload.status;
    }

    if (payload.total !== undefined) {
      order.total = payload.total;
    }

    db.update(orders).set(order).where(eq(orders.id, req.params.id)).run();

    clearCache();
    logger('info', 'Order updated', { id: req.params.id });
    res.json(successResponse(order, 'Order updated'));
  })
);

app.delete(
  '/api/orders/:id',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    db.delete(orders).where(eq(orders.id, req.params.id)).run();

    clearCache();
    logger('info', 'Order deleted', { id: req.params.id });
    res.status(204).send();
  })
);

app.get(
  '/api/orders/:id/items',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const items = db.select().from(order_items).where(eq(order_items.order_id, req.params.id)).all();

    res.json(successResponse({ items, total: items.length }, 'Order items fetched'));
  })
);

app.post(
  '/api/orders/:id/items',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const payload = validate(createOrderItemSchema, req.body);

    const product = db.select().from(products).where(eq(products.id, payload.product_id)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const itemId = nanoid();
    db.insert(order_items)
      .values({
        id: itemId,
        order_id: req.params.id,
        product_id: payload.product_id,
        quantity: payload.quantity,
        price: payload.price,
      })
      .run();

    clearCache();
    logger('info', 'Order item added', { order_id: req.params.id });
    res.status(201).json(successResponse({ id: itemId, ...payload }, 'Order item added'));
  })
);

app.delete(
  '/api/orders/:id/items/:itemId',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const item = db.select().from(order_items).where(eq(order_items.id, req.params.itemId)).get();
    if (!item) {
      throw new ApiError(404, 'ORDER_ITEM_NOT_FOUND', 'Order item not found');
    }

    db.delete(order_items).where(eq(order_items.id, req.params.itemId)).run();

    clearCache();
    logger('info', 'Order item deleted', { order_id: req.params.id });
    res.status(204).send();
  })
);

app.patch(
  '/api/orders/:id/status',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const { status } = req.body;
    if (!status || !['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid status');
    }

    order.status = status;
    db.update(orders).set(order).where(eq(orders.id, req.params.id)).run();

    clearCache();
    logger('info', 'Order status updated', { id: req.params.id, status });
    res.json(successResponse(order, 'Order status updated'));
  })
);

app.get(
  '/api/orders/:id/timeline',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const timeline = [
      { event: 'order_created', timestamp: order.created_at, status: 'pending' },
      { event: 'order_status_updated', timestamp: new Date(), status: order.status },
    ];

    res.json(successResponse(timeline, 'Order timeline fetched'));
  })
);

app.post(
  '/api/orders/:id/notes',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const { note } = req.body;
    if (!note) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Note required');
    }

    res.status(201).json(successResponse({ id: nanoid(), note, created_at: new Date().toISOString() }, 'Order note added'));
  })
);

app.get(
  '/api/orders/store/:storeId',
  handle((req, res) => {
    const store = db.select().from(stores).where(eq(stores.id, req.params.storeId)).get();
    if (!store) {
      throw new ApiError(404, 'STORE_NOT_FOUND', 'Store not found');
    }

    const { limit, offset } = validate(paginationSchema, req.query);
    const storeOrders = db.select().from(orders).where(eq(orders.store_id, req.params.storeId)).all();
    const total = storeOrders.length;
    const paginatedOrders = storeOrders.slice(offset, offset + limit);

    res.json(
      successResponse(
        { data: paginatedOrders, total, limit, offset, hasMore: offset + limit < total },
        'Store orders fetched'
      )
    );
  })
);

app.get(
  '/api/orders/user/:userId',
  handle((req, res) => {
    const user = db.select().from(users).where(eq(users.id, req.params.userId)).get();
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const { limit, offset } = validate(paginationSchema, req.query);
    const userOrders = db.select().from(orders).where(eq(orders.user_id, req.params.userId)).all();
    const total = userOrders.length;
    const paginatedOrders = userOrders.slice(offset, offset + limit);

    res.json(
      successResponse(
        { data: paginatedOrders, total, limit, offset, hasMore: offset + limit < total },
        'User orders fetched'
      )
    );
  })
);

app.post(
  '/api/orders/:id/refund',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    order.status = 'cancelled';
    db.update(orders).set(order).where(eq(orders.id, req.params.id)).run();

    clearCache();
    logger('info', 'Order refunded', { id: req.params.id });
    res.json(successResponse({ id: order.id, refund_amount: order.total, status: 'refunded' }, 'Order refunded'));
  })
);

app.patch(
  '/api/orders/:id/shipping',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const { shipping_info } = req.body;
    if (!shipping_info) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Shipping info required');
    }

    logger('info', 'Order shipping updated', { id: req.params.id });
    res.json(successResponse({ id: order.id, shipping_info }, 'Order shipping updated'));
  })
);

// ============ INVENTORY ENDPOINTS ============

app.get(
  '/api/inventory',
  handle((req, res) => {
    const { limit, offset } = validate(paginationSchema, req.query);
    const allProducts = db.select().from(products).all();
    const total = allProducts.length;
    const paginatedInventory = allProducts.slice(offset, offset + limit).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: Math.floor(Math.random() * 100),
      status: 'in_stock',
    }));

    res.json(
      successResponse(
        { data: paginatedInventory, total, limit, offset, hasMore: offset + limit < total },
        'Inventory fetched'
      )
    );
  })
);

app.get(
  '/api/inventory/:productId',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.productId)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    res.json(
      successResponse(
        { product_id: product.id, stock: 50, status: 'in_stock', last_updated: new Date().toISOString() },
        'Product inventory fetched'
      )
    );
  })
);

app.put(
  '/api/inventory/:productId',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.productId)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const { stock } = req.body;
    if (stock === undefined) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Stock required');
    }

    logger('info', 'Inventory updated', { product_id: req.params.productId, stock });
    res.json(successResponse({ product_id: product.id, stock, updated_at: new Date().toISOString() }, 'Inventory updated'));
  })
);

app.patch(
  '/api/inventory/:productId/stock',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.productId)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const { adjustment } = req.body;
    if (adjustment === undefined) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Adjustment required');
    }

    logger('info', 'Stock adjusted', { product_id: req.params.productId, adjustment });
    res.json(successResponse({ product_id: product.id, adjustment, new_stock: 50 + adjustment }, 'Stock adjusted'));
  })
);

app.get(
  '/api/inventory/:productId/history',
  handle((req, res) => {
    const product = db.select().from(products).where(eq(products.id, req.params.productId)).get();
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const history = [{ event: 'stock_adjusted', timestamp: new Date().toISOString(), quantity: 50 }];

    res.json(successResponse(history, 'Inventory history fetched'));
  })
);

app.post(
  '/api/inventory/sync',
  handle((req, res) => {
    logger('info', 'Inventory sync started');
    res.json(successResponse({ synced_at: new Date().toISOString(), items_synced: 0 }, 'Inventory sync completed'));
  })
);

// ============ PAYMENTS ENDPOINTS ============

app.get(
  '/api/payments',
  handle((req, res) => {
    const { limit, offset } = validate(paginationSchema, req.query);
    const allPayments = [];
    const total = 0;

    res.json(
      successResponse(
        { data: allPayments, total, limit, offset, hasMore: false },
        'Payments fetched'
      )
    );
  })
);

app.get(
  '/api/payments/:id',
  handle((req, res) => {
    res.json(
      successResponse(
        { id: req.params.id, amount: 99.99, status: 'completed', created_at: new Date().toISOString() },
        'Payment fetched'
      )
    );
  })
);

app.post(
  '/api/payments',
  handle((req, res) => {
    const { amount, order_id, method } = req.body;
    if (!amount || !order_id) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Amount and order_id required');
    }

    logger('info', 'Payment created', { order_id, amount });
    res.status(201).json(
      successResponse({ id: nanoid(), amount, order_id, method, status: 'pending' }, 'Payment created')
    );
  })
);

app.get(
  '/api/payments/:id/receipt',
  handle((req, res) => {
    res.json(
      successResponse(
        { id: req.params.id, receipt_number: `RCP-${req.params.id.substring(0, 8)}`, url: '/receipts/file.pdf' },
        'Payment receipt fetched'
      )
    );
  })
);

app.post(
  '/api/payments/:id/refund',
  handle((req, res) => {
    logger('info', 'Payment refunded', { id: req.params.id });
    res.json(successResponse({ id: req.params.id, refund_status: 'completed', refund_amount: 99.99 }, 'Payment refunded'));
  })
);

app.get(
  '/api/payments/order/:orderId',
  handle((req, res) => {
    const order = db.select().from(orders).where(eq(orders.id, req.params.orderId)).get();
    if (!order) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    res.json(successResponse({ payments: [] }, 'Order payments fetched'));
  })
);

app.patch(
  '/api/payments/:id/status',
  handle((req, res) => {
    const { status } = req.body;
    if (!status) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Status required');
    }

    logger('info', 'Payment status updated', { id: req.params.id, status });
    res.json(successResponse({ id: req.params.id, status }, 'Payment status updated'));
  })
);

// ============ REPORTS/ANALYTICS ENDPOINTS ============

app.get(
  '/api/reports/sales',
  handle((_req, res) => {
    res.json(
      successResponse(
        {
          period: 'monthly',
          total_sales: 9999.99,
          orders: 100,
          average_order_value: 99.99,
        },
        'Sales report fetched'
      )
    );
  })
);

app.get(
  '/api/reports/products',
  handle((_req, res) => {
    res.json(
      successResponse(
        {
          top_products: [{ id: '1', name: 'Product', sales: 500 }],
          total_products: 50,
        },
        'Products report fetched'
      )
    );
  })
);

app.get(
  '/api/reports/customers',
  handle((_req, res) => {
    res.json(
      successResponse(
        {
          total_customers: 100,
          new_customers: 10,
          repeat_customers: 90,
        },
        'Customers report fetched'
      )
    );
  })
);

app.get(
  '/api/reports/revenue',
  handle((_req, res) => {
    res.json(
      successResponse(
        {
          gross_revenue: 9999.99,
          refunds: 100.00,
          net_revenue: 9899.99,
        },
        'Revenue report fetched'
      )
    );
  })
);

app.get(
  '/api/reports/inventory',
  handle((_req, res) => {
    res.json(
      successResponse(
        {
          total_items: 1000,
          in_stock: 950,
          low_stock: 50,
          out_of_stock: 0,
        },
        'Inventory report fetched'
      )
    );
  })
);

app.get(
  '/api/analytics/dashboard',
  handle((_req, res) => {
    res.json(
      successResponse(
        {
          revenue: 9999.99,
          orders: 100,
          customers: 50,
          products: 200,
        },
        'Dashboard metrics fetched'
      )
    );
  })
);

app.get(
  '/api/analytics/trends',
  handle((_req, res) => {
    res.json(
      successResponse(
        {
          trends: [
            { date: '2024-01-01', revenue: 100, orders: 5 },
            { date: '2024-01-02', revenue: 150, orders: 7 },
          ],
        },
        'Trends fetched'
      )
    );
  })
);

// ============ WEBHOOKS ENDPOINTS ============

app.get(
  '/api/webhooks',
  handle((req, res) => {
    const { limit, offset } = validate(paginationSchema, req.query);
    res.json(successResponse({ data: [], total: 0, limit, offset, hasMore: false }, 'Webhooks fetched'));
  })
);

app.post(
  '/api/webhooks',
  handle((req, res) => {
    const { url, events } = req.body;
    if (!url || !events) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'URL and events required');
    }

    logger('info', 'Webhook created', { url });
    res.status(201).json(successResponse({ id: nanoid(), url, events, active: true }, 'Webhook created'));
  })
);

app.put(
  '/api/webhooks/:id',
  handle((req, res) => {
    const { url, events } = req.body;

    logger('info', 'Webhook updated', { id: req.params.id });
    res.json(successResponse({ id: req.params.id, url, events, active: true }, 'Webhook updated'));
  })
);

app.delete(
  '/api/webhooks/:id',
  handle((req, res) => {
    logger('info', 'Webhook deleted', { id: req.params.id });
    res.status(204).send();
  })
);

app.get(
  '/api/webhooks/:id/logs',
  handle((req, res) => {
    res.json(successResponse({ logs: [] }, 'Webhook logs fetched'));
  })
);

app.post(
  '/api/webhooks/:id/test',
  handle((req, res) => {
    logger('info', 'Webhook test sent', { id: req.params.id });
    res.json(successResponse({ test_sent: true, status: 'success' }, 'Webhook test sent'));
  })
);

// ============ SETTINGS/CONFIG ENDPOINTS ============

app.get(
  '/api/settings',
  handle((_req, res) => {
    res.json(successResponse({ theme: 'light', language: 'en' }, 'Settings fetched'));
  })
);

app.put(
  '/api/settings',
  handle((req, res) => {
    logger('info', 'Settings updated');
    res.json(successResponse(req.body, 'Settings updated'));
  })
);

app.get(
  '/api/settings/email',
  handle((_req, res) => {
    res.json(successResponse({ smtp_host: 'smtp.example.com', from: 'noreply@example.com' }, 'Email settings fetched'));
  })
);

app.put(
  '/api/settings/email',
  handle((req, res) => {
    logger('info', 'Email settings updated');
    res.json(successResponse(req.body, 'Email settings updated'));
  })
);

app.get(
  '/api/settings/payment',
  handle((_req, res) => {
    res.json(successResponse({ provider: 'stripe', mode: 'test' }, 'Payment settings fetched'));
  })
);

app.put(
  '/api/settings/payment',
  handle((req, res) => {
    logger('info', 'Payment settings updated');
    res.json(successResponse(req.body, 'Payment settings updated'));
  })
);

app.get(
  '/api/settings/shipping',
  handle((_req, res) => {
    res.json(successResponse({ provider: 'fedex', default_service: 'standard' }, 'Shipping settings fetched'));
  })
);

app.put(
  '/api/settings/shipping',
  handle((req, res) => {
    logger('info', 'Shipping settings updated');
    res.json(successResponse(req.body, 'Shipping settings updated'));
  })
);

// ============ ERROR HANDLER ============

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
