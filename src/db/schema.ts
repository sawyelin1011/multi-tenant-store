import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// Multi-Tenant Core Tables

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    email: text('email').unique().notNull(),
    password_hash: text('password_hash').notNull(),
    role: text('role').default('user'),
    api_key: text('api_key'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    apiKeyIdx: index('idx_users_api_key').on(table.api_key),
  })
);

export const tenants = sqliteTable(
  'tenants',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    slug: text('slug').unique().notNull(),
    name: text('name').notNull(),
    domain: text('domain'),
    subdomain: text('subdomain'),
    status: text('status').default('active'),
    plan: text('plan').default('basic'),
    settings: text('settings').default('{}'),
    branding: text('branding').default('{}'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    slugIdx: index('idx_tenants_slug').on(table.slug),
    domainIdx: index('idx_tenants_domain').on(table.domain),
  })
);

export const tenantUsers = sqliteTable(
  'tenant_users',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    user_id: text('user_id').notNull(),
    role: text('role').notNull(),
    permissions: text('permissions').default('{}'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_tenant_users_tenant_id').on(table.tenant_id),
    userIdIdx: index('idx_tenant_users_user_id').on(table.user_id),
  })
);

// Dynamic Product System

export const productTypes = sqliteTable(
  'product_types',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    icon: text('icon'),
    category: text('category'),
    schema: text('schema').notNull().default('{}'),
    ui_config: text('ui_config').default('{}'),
    validation_rules: text('validation_rules').default('{}'),
    workflows: text('workflows').default('{}'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_product_types_tenant_id').on(table.tenant_id),
    tenantSlugUq: unique('uq_product_types_tenant_slug').on(table.tenant_id, table.slug),
  })
);

export const fieldTypes = sqliteTable(
  'field_types',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    name: text('name').unique().notNull(),
    component: text('component'),
    validation_schema: text('validation_schema').default('{}'),
    is_system: integer('is_system', { mode: 'boolean' }).default(false),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  }
);

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    product_type_id: text('product_type_id')
      .notNull()
      .references(() => productTypes.id),
    name: text('name').notNull(),
    slug: text('slug'),
    status: text('status').default('draft'),
    metadata: text('metadata').default('{}'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_products_tenant_id').on(table.tenant_id),
    productTypeIdIdx: index('idx_products_product_type_id').on(table.product_type_id),
    tenantSlugUq: unique('uq_products_tenant_slug').on(table.tenant_id, table.slug),
  })
);

export const productAttributes = sqliteTable(
  'product_attributes',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    product_id: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    attribute_key: text('attribute_key').notNull(),
    attribute_value: text('attribute_value'),
    attribute_type: text('attribute_type'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    productIdIdx: index('idx_product_attributes_product_id').on(table.product_id),
    productKeyUq: unique('uq_product_attributes_key').on(table.product_id, table.attribute_key),
  })
);

export const productVariants = sqliteTable(
  'product_variants',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    product_id: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').unique().notNull(),
    attributes: text('attributes').default('{}'),
    price_data: text('price_data').default('{}'),
    inventory_data: text('inventory_data').default('{}'),
    delivery_data: text('delivery_data').default('{}'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    productIdIdx: index('idx_product_variants_product_id').on(table.product_id),
  })
);

// Plugin System

export const plugins = sqliteTable(
  'plugins',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    name: text('name').unique().notNull(),
    slug: text('slug').unique().notNull(),
    version: text('version'),
    author: text('author'),
    description: text('description'),
    manifest: text('manifest').default('{}'),
    status: text('status').default('available'),
    is_official: integer('is_official', { mode: 'boolean' }).default(false),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  }
);

export const apiKeys = sqliteTable(
  'api_keys',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    name: text('name').notNull(),
    key_hash: text('key_hash').notNull().unique(),
    key_prefix: text('key_prefix').notNull(),
    permissions: text('permissions').default('[]'), // JSON array of permissions
    tenant_id: text('tenant_id'), // null for super admin keys
    user_id: text('user_id'), // null for system keys
    expires_at: text('expires_at'), // null for non-expiring keys
    last_used_at: text('last_used_at'),
    usage_count: integer('usage_count').default(0),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    keyHashIdx: index('idx_api_keys_key_hash').on(table.key_hash),
    tenantIdIdx: index('idx_api_keys_tenant_id').on(table.tenant_id),
    userIdIdx: index('idx_api_keys_user_id').on(table.user_id),
  })
);

export const tenantPlugins = sqliteTable(
  'tenant_plugins',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    plugin_id: text('plugin_id')
      .notNull()
      .references(() => plugins.id),
    status: text('status').default('inactive'),
    config: text('config').default('{}'),
    installed_at: text('installed_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_tenant_plugins_tenant_id').on(table.tenant_id),
    tenantPluginUq: unique('uq_tenant_plugin').on(table.tenant_id, table.plugin_id),
  })
);

export const pluginHooks = sqliteTable(
  'plugin_hooks',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    plugin_id: text('plugin_id')
      .notNull()
      .references(() => plugins.id, { onDelete: 'cascade' }),
    hook_name: text('hook_name').notNull(),
    handler_function: text('handler_function'),
    priority: integer('priority').default(100),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pluginIdIdx: index('idx_plugin_hooks_plugin_id').on(table.plugin_id),
  })
);

// Workflow System

export const workflows = sqliteTable(
  'workflows',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    entity_type: text('entity_type'),
    trigger: text('trigger'),
    steps: text('steps').default('[]'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_workflows_tenant_id').on(table.tenant_id),
  })
);

export const workflowExecutions = sqliteTable(
  'workflow_executions',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    workflow_id: text('workflow_id')
      .notNull()
      .references(() => workflows.id),
    entity_id: text('entity_id'),
    status: text('status').default('pending'),
    current_step: integer('current_step'),
    execution_data: text('execution_data').default('{}'),
    started_at: text('started_at'),
    completed_at: text('completed_at'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    workflowIdIdx: index('idx_workflow_executions_workflow_id').on(table.workflow_id),
    statusIdx: index('idx_workflow_executions_status').on(table.status),
  })
);

// Delivery System

export const deliveryMethods = sqliteTable(
  'delivery_methods',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type'),
    config: text('config').default('{}'),
    template: text('template').default('{}'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_delivery_methods_tenant_id').on(table.tenant_id),
  })
);

export const deliveries = sqliteTable(
  'deliveries',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    order_id: text('order_id'),
    order_item_id: text('order_item_id'),
    delivery_method_id: text('delivery_method_id').references(() => deliveryMethods.id),
    status: text('status').default('pending'),
    delivery_data: text('delivery_data').default('{}'),
    attempts: integer('attempts').default(0),
    delivered_at: text('delivered_at'),
    error_log: text('error_log').default('{}'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_deliveries_tenant_id').on(table.tenant_id),
    orderIdIdx: index('idx_deliveries_order_id').on(table.order_id),
  })
);

// Flexible Pricing

export const pricingRules = sqliteTable(
  'pricing_rules',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    entity_type: text('entity_type'),
    entity_id: text('entity_id'),
    rule_type: text('rule_type'),
    conditions: text('conditions').default('{}'),
    price_modifier: text('price_modifier').default('{}'),
    priority: integer('priority').default(100),
    active_from: text('active_from'),
    active_until: text('active_until'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_pricing_rules_tenant_id').on(table.tenant_id),
  })
);

export const userRoles = sqliteTable(
  'user_roles',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    permissions: text('permissions').default('{}'),
    pricing_tier: text('pricing_tier'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_user_roles_tenant_id').on(table.tenant_id),
    tenantSlugUq: unique('uq_user_roles_tenant_slug').on(table.tenant_id, table.slug),
  })
);

// Orders & Transactions

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    user_id: text('user_id'),
    order_number: text('order_number'),
    status: text('status').default('pending'),
    items_data: text('items_data').default('{}'),
    pricing_data: text('pricing_data').default('{}'),
    payment_data: text('payment_data').default('{}'),
    customer_data: text('customer_data').default('{}'),
    metadata: text('metadata').default('{}'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_orders_tenant_id').on(table.tenant_id),
    userIdIdx: index('idx_orders_user_id').on(table.user_id),
    statusIdx: index('idx_orders_status').on(table.status),
    tenantOrderNumUq: unique('uq_orders_tenant_number').on(table.tenant_id, table.order_number),
  })
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    order_id: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    product_id: text('product_id').references(() => products.id),
    variant_id: text('variant_id'),
    quantity: integer('quantity'),
    unit_price: real('unit_price'),
    item_data: text('item_data').default('{}'),
    delivery_status: text('delivery_status').default('pending'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orderIdIdx: index('idx_order_items_order_id').on(table.order_id),
    productIdIdx: index('idx_order_items_product_id').on(table.product_id),
  })
);

// Payment Gateway Abstraction

export const paymentGateways = sqliteTable(
  'payment_gateways',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    gateway_type: text('gateway_type'),
    credentials: text('credentials'),
    config: text('config').default('{}'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_payment_gateways_tenant_id').on(table.tenant_id),
  })
);

export const paymentTransactions = sqliteTable(
  'payment_transactions',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    order_id: text('order_id').references(() => orders.id),
    gateway_id: text('gateway_id').references(() => paymentGateways.id),
    transaction_id: text('transaction_id'),
    amount: real('amount'),
    status: text('status'),
    gateway_response: text('gateway_response').default('{}'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_payment_transactions_tenant_id').on(table.tenant_id),
    orderIdIdx: index('idx_payment_transactions_order_id').on(table.order_id),
  })
);

// Integration System

export const integrations = sqliteTable(
  'integrations',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    integration_type: text('integration_type'),
    credentials: text('credentials'),
    field_mapping: text('field_mapping').default('{}'),
    sync_config: text('sync_config').default('{}'),
    webhook_config: text('webhook_config').default('{}'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    tenantIdIdx: index('idx_integrations_tenant_id').on(table.tenant_id),
  })
);

export const integrationSyncs = sqliteTable(
  'integration_syncs',
  {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    integration_id: text('integration_id')
      .notNull()
      .references(() => integrations.id),
    sync_type: text('sync_type'),
    status: text('status').default('pending'),
    synced_data: text('synced_data').default('{}'),
    errors: text('errors').default('{}'),
    started_at: text('started_at'),
    completed_at: text('completed_at'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    integrationIdIdx: index('idx_integration_syncs_integration_id').on(table.integration_id),
  })
);

// Migrations tracking

export const schemaMigrations = sqliteTable('schema_migrations', {
  version: integer('version').primaryKey(),
  name: text('name').notNull(),
  executed_at: text('executed_at').default(sql`CURRENT_TIMESTAMP`),
});

// Relationships for Drizzle queries

export const tenantRelations = relations(tenants, ({ many }) => ({
  tenantUsers: many(tenantUsers),
  productTypes: many(productTypes),
  products: many(products),
  tenantPlugins: many(tenantPlugins),
  workflows: many(workflows),
  deliveryMethods: many(deliveryMethods),
  deliveries: many(deliveries),
  pricingRules: many(pricingRules),
  userRoles: many(userRoles),
  orders: many(orders),
  paymentGateways: many(paymentGateways),
  paymentTransactions: many(paymentTransactions),
  integrations: many(integrations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tenantUsers: many(tenantUsers),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantUsers.tenant_id], references: [tenants.id] }),
  user: one(users, { fields: [tenantUsers.user_id], references: [users.id] }),
}));

export const productTypeRelations = relations(productTypes, ({ one, many }) => ({
  tenant: one(tenants, { fields: [productTypes.tenant_id], references: [tenants.id] }),
  products: many(products),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, { fields: [products.tenant_id], references: [tenants.id] }),
  productType: one(productTypes, { fields: [products.product_type_id], references: [productTypes.id] }),
  productAttributes: many(productAttributes),
  productVariants: many(productVariants),
}));

export const productAttributesRelations = relations(productAttributes, ({ one }) => ({
  product: one(products, { fields: [productAttributes.product_id], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.product_id], references: [products.id] }),
}));

export const fieldTypesRelations = relations(fieldTypes, () => ({}));

export const pluginRelations = relations(plugins, ({ many }) => ({
  tenantPlugins: many(tenantPlugins),
  pluginHooks: many(pluginHooks),
}));

export const tenantPluginsRelations = relations(tenantPlugins, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantPlugins.tenant_id], references: [tenants.id] }),
  plugin: one(plugins, { fields: [tenantPlugins.plugin_id], references: [plugins.id] }),
}));

export const pluginHooksRelations = relations(pluginHooks, ({ one }) => ({
  plugin: one(plugins, { fields: [pluginHooks.plugin_id], references: [plugins.id] }),
}));

export const workflowRelations = relations(workflows, ({ one, many }) => ({
  tenant: one(tenants, { fields: [workflows.tenant_id], references: [tenants.id] }),
  workflowExecutions: many(workflowExecutions),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one }) => ({
  workflow: one(workflows, { fields: [workflowExecutions.workflow_id], references: [workflows.id] }),
}));

export const deliveryMethodsRelations = relations(deliveryMethods, ({ one, many }) => ({
  tenant: one(tenants, { fields: [deliveryMethods.tenant_id], references: [tenants.id] }),
  deliveries: many(deliveries),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  tenant: one(tenants, { fields: [deliveries.tenant_id], references: [tenants.id] }),
  deliveryMethod: one(deliveryMethods, { fields: [deliveries.delivery_method_id], references: [deliveryMethods.id] }),
}));

export const pricingRulesRelations = relations(pricingRules, ({ one }) => ({
  tenant: one(tenants, { fields: [pricingRules.tenant_id], references: [tenants.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  tenant: one(tenants, { fields: [userRoles.tenant_id], references: [tenants.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenant_id], references: [tenants.id] }),
  orderItems: many(orderItems),
  paymentTransactions: many(paymentTransactions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.order_id], references: [orders.id] }),
  product: one(products, { fields: [orderItems.product_id], references: [products.id] }),
}));

export const paymentGatewaysRelations = relations(paymentGateways, ({ one, many }) => ({
  tenant: one(tenants, { fields: [paymentGateways.tenant_id], references: [tenants.id] }),
  paymentTransactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  tenant: one(tenants, { fields: [paymentTransactions.tenant_id], references: [tenants.id] }),
  order: one(orders, { fields: [paymentTransactions.order_id], references: [orders.id] }),
  paymentGateway: one(paymentGateways, { fields: [paymentTransactions.gateway_id], references: [paymentGateways.id] }),
}));

export const integrationsRelations = relations(integrations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [integrations.tenant_id], references: [tenants.id] }),
  integrationSyncs: many(integrationSyncs),
}));

export const integrationSyncsRelations = relations(integrationSyncs, ({ one }) => ({
  integration: one(integrations, { fields: [integrationSyncs.integration_id], references: [integrations.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, { fields: [apiKeys.tenant_id], references: [tenants.id] }),
}));
