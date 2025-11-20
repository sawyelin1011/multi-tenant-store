export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  subdomain?: string;
  status: 'active' | 'suspended' | 'deleted';
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  settings: Record<string, any>;
  branding: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  permissions: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ProductType {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  icon?: string;
  category?: string;
  schema: Record<string, any>;
  ui_config: Record<string, any>;
  validation_rules: Record<string, any>;
  workflows: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  tenant_id: string;
  product_type_id: string;
  name: string;
  slug?: string;
  status: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  attribute_key: string;
  attribute_value: any;
  attribute_type: string;
  created_at: Date;
  updated_at: Date;
}

export interface Plugin {
  id: string;
  name: string;
  slug: string;
  version?: string;
  author?: string;
  description?: string;
  manifest: Record<string, any>;
  status: 'available' | 'installed' | 'active' | 'deprecated';
  is_official: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TenantPlugin {
  id: string;
  tenant_id: string;
  plugin_id: string;
  status: 'active' | 'inactive';
  config: Record<string, any>;
  installed_at: Date;
}

export interface Workflow {
  id: string;
  tenant_id: string;
  name: string;
  entity_type?: string;
  trigger?: string;
  steps: any[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryMethod {
  id: string;
  tenant_id: string;
  name: string;
  type: 'email' | 'webhook' | 'file' | 'manual' | 'plugin';
  config: Record<string, any>;
  template: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  tenant_id: string;
  user_id?: string;
  order_number?: string;
  status: string;
  items_data: Record<string, any>;
  pricing_data: Record<string, any>;
  payment_data: Record<string, any>;
  customer_data: Record<string, any>;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  item_data: Record<string, any>;
  delivery_status: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Re-export UI types
export * from './ui.js';
