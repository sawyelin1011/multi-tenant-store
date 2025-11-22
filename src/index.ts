import 'dotenv/config';
import express from 'express';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { bootstrap } from './bootstrap/index.js';
import { db } from './db/client.js';
import { orders, products, stores, tenants, users } from './db/schema.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', authMiddleware);

app.get('/api/users', (_req, res) => {
  const allUsers = db.select().from(users).all();
  res.json(allUsers);
});

app.post('/api/users', (req, res) => {
  const { email, role } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const id = nanoid();
  db.insert(users)
    .values({
      id,
      email,
      role: role || 'user',
    })
    .run();

  res.status(201).json({ id, email, role: role || 'user' });
});

app.get('/api/tenants', (_req, res) => {
  const allTenants = db.select().from(tenants).all();
  res.json(allTenants);
});

app.post('/api/tenants', (req, res) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug required' });
  }

  const id = nanoid();
  db.insert(tenants)
    .values({ id, name, slug })
    .run();

  res.status(201).json({ id, name, slug });
});

app.get('/api/stores', (_req, res) => {
  const allStores = db.select().from(stores).all();
  res.json(allStores);
});

app.get('/api/stores/:id', (req, res) => {
  const store = db.select().from(stores).where(eq(stores.id, req.params.id)).get();

  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }

  res.json(store);
});

app.get('/api/products', (_req, res) => {
  const allProducts = db.select().from(products).all();
  res.json(allProducts);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.select().from(products).where(eq(products.id, req.params.id)).get();

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { store_id, name, price } = req.body;

  if (!store_id || !name || price === undefined) {
    return res.status(400).json({ error: 'store_id, name, and price required' });
  }

  const id = nanoid();
  db.insert(products)
    .values({ id, store_id, name, price })
    .run();

  res.status(201).json({ id, store_id, name, price });
});

app.get('/api/orders', (_req, res) => {
  const allOrders = db.select().from(orders).all();
  res.json(allOrders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.select().from(orders).where(eq(orders.id, req.params.id)).get();

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err?.message || err);
  res.status(err?.status || 500).json({ error: err?.message || 'Internal Server Error' });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📚 API Key: ${process.env.SUPER_ADMIN_API_KEY || 'sk_test_admin123456'}`);
      console.log(`\nTest endpoints with: curl -H "x-api-key: YOUR_KEY" http://localhost:${PORT}/api/users`);
    });
  })
  .catch((error) => {
    console.error('Failed to bootstrap:', error);
    process.exit(1);
  });

export default app;
