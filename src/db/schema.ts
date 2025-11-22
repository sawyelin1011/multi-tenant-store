import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash'),
  api_key: text('api_key').unique(),
  role: text('role').default('user'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  config: text('config').default('{}'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').default('digital'),
  config: text('config').default('{}'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  store_id: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku'),
  price: real('price'),
  description: text('description'),
  type: text('type').default('digital'),
  attributes: text('attributes').default('{}'),
  status: text('status').default('active'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  store_id: text('store_id')
    .notNull()
    .references(() => stores.id),
  user_id: text('user_id').references(() => users.id),
  items: text('items').default('[]'),
  total: real('total'),
  status: text('status').default('pending'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const order_items = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  order_id: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  product_id: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
});

export const tenantsRelations = relations(tenants, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  tenant: one(tenants, { fields: [stores.tenant_id], references: [tenants.id] }),
  products: many(products),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.store_id], references: [stores.id] }),
  order_items: many(order_items),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.store_id], references: [stores.id] }),
  user: one(users, { fields: [orders.user_id], references: [users.id] }),
  items: many(order_items),
}));

export const order_itemsRelations = relations(order_items, ({ one }) => ({
  order: one(orders, { fields: [order_items.order_id], references: [orders.id] }),
  product: one(products, { fields: [order_items.product_id], references: [products.id] }),
}));
