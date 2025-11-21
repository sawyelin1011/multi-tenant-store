-- Multi-Tenant Core Tables

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  subdomain VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  plan VARCHAR(50) DEFAULT 'basic',
  settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);

-- Dynamic Product System

CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  icon VARCHAR(255),
  category VARCHAR(255),
  schema JSONB NOT NULL DEFAULT '{}',
  ui_config JSONB DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  workflows JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_types_tenant_id ON product_types(tenant_id);

CREATE TABLE IF NOT EXISTS field_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  component VARCHAR(255),
  validation_schema JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_type_id UUID NOT NULL REFERENCES product_types(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type_id ON products(product_type_id);

CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_key VARCHAR(255) NOT NULL,
  attribute_value JSONB,
  attribute_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, attribute_key)
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(255) UNIQUE NOT NULL,
  attributes JSONB DEFAULT '{}',
  price_data JSONB DEFAULT '{}',
  inventory_data JSONB DEFAULT '{}',
  delivery_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Plugin System

CREATE TABLE IF NOT EXISTS plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  version VARCHAR(50),
  author VARCHAR(255),
  description TEXT,
  manifest JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'available',
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plugin_id UUID NOT NULL REFERENCES plugins(id),
  status VARCHAR(50) DEFAULT 'inactive',
  config JSONB DEFAULT '{}',
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, plugin_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_plugins_tenant_id ON tenant_plugins(tenant_id);

CREATE TABLE IF NOT EXISTS plugin_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  hook_name VARCHAR(255) NOT NULL,
  handler_function TEXT,
  priority INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plugin_hooks_plugin_id ON plugin_hooks(plugin_id);

-- Workflow System

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),
  trigger VARCHAR(255),
  steps JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  entity_id UUID,
  status VARCHAR(50) DEFAULT 'pending',
  current_step INTEGER,
  execution_data JSONB DEFAULT '{}',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

-- Delivery System

CREATE TABLE IF NOT EXISTS delivery_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  config JSONB DEFAULT '{}',
  template JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_methods_tenant_id ON delivery_methods(tenant_id);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID,
  order_item_id UUID,
  delivery_method_id UUID REFERENCES delivery_methods(id),
  status VARCHAR(50) DEFAULT 'pending',
  delivery_data JSONB DEFAULT '{}',
  attempts INTEGER DEFAULT 0,
  delivered_at TIMESTAMP,
  error_log JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_id ON deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);

-- Flexible Pricing

CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50),
  entity_id UUID,
  rule_type VARCHAR(50),
  conditions JSONB DEFAULT '{}',
  price_modifier JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 100,
  active_from TIMESTAMP,
  active_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_tenant_id ON pricing_rules(tenant_id);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  permissions JSONB DEFAULT '{}',
  pricing_tier VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);

-- Orders & Transactions

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,
  order_number VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  items_data JSONB DEFAULT '{}',
  pricing_data JSONB DEFAULT '{}',
  payment_data JSONB DEFAULT '{}',
  customer_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID,
  quantity INTEGER,
  unit_price DECIMAL(19, 4),
  item_data JSONB DEFAULT '{}',
  delivery_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Payment Gateway Abstraction

CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  gateway_type VARCHAR(50),
  credentials JSONB,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_gateways_tenant_id ON payment_gateways(tenant_id);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  gateway_id UUID REFERENCES payment_gateways(id),
  transaction_id VARCHAR(255),
  amount DECIMAL(19, 4),
  status VARCHAR(50),
  gateway_response JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);

-- Integration System

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  integration_type VARCHAR(50),
  credentials JSONB,
  field_mapping JSONB DEFAULT '{}',
  sync_config JSONB DEFAULT '{}',
  webhook_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON integrations(tenant_id);

CREATE TABLE IF NOT EXISTS integration_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id),
  sync_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  synced_data JSONB DEFAULT '{}',
  errors JSONB DEFAULT '{}',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integration_syncs_integration_id ON integration_syncs(integration_id);

-- Migrations tracking

CREATE TABLE IF NOT EXISTS schema_migrations (
  version BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
