# Digital Commerce Platform

A flexible, multi-tenant digital commerce platform supporting ANY type of digital products (games, software, courses, ebooks, SaaS, subscriptions, NFTs, etc.) with complete store isolation and plugin architecture.

## Features

### 🏢 Multi-Tenant Architecture
- Each tenant = separate store with own domain/subdomain
- Complete data isolation per tenant
- Shared infrastructure, isolated data
- Tenant-level settings, branding, and plugins
- Central admin + per-store admin dashboard

### 🔌 Plugin Architecture
- Hook system for before/after events
- Extend API endpoints, Admin UI, Storefront, Database schema
- Support for custom payment gateways and delivery methods
- Plugin manifest with dependencies and hooks
- Plugin marketplace integration
- Hot-reload capabilities
- Sandboxed plugin execution

### 📦 Zero Hardcoding
- ALL product types defined in database as JSON schemas
- ALL settings configurable via UI
- ALL workflows customizable
- ALL UI elements configurable
- Entity-Attribute-Value (EAV) pattern for extensibility

### 🛒 Digital Product Support
- Support for any type of digital products
- Flexible product types with custom fields
- Variant management with own attributes
- Dynamic pricing rules (role-based, quantity, time-based, subscription)
- Inventory tracking (optional)

### 🔄 Workflow Engine
- Visual workflow builder
- Support for order, fulfillment, and refund workflows
- Customizable workflow steps and conditions
- Workflow execution tracking and history

### 📦 Delivery System
- Multiple delivery methods: Email, API Webhook, Download, Manual, Plugin-based
- Configurable delivery per product type
- Template-based delivery configuration
- Delivery status tracking

### 💳 Payment Gateway Abstraction
- Support for multiple payment gateways
- Secure credential storage
- Payment transaction tracking
- Plugin-based custom payment methods

### 🔗 Integration System
- Connect to any external service
- Field mapping and transformation
- Sync configuration and scheduling
- Webhook integration support

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # Database setup
│   └── env.ts        # Environment config
├── db/
│   ├── migrations/   # Database migrations
│   └── migrate.ts    # Migration runner
├── types/            # TypeScript types
├── utils/            # Utility functions
├── middleware/       # Express middleware
├── services/         # Business logic
│   ├── tenantService.ts
│   ├── productService.ts
│   ├── productTypeService.ts
│   ├── pluginService.ts
│   ├── workflowService.ts
│   ├── deliveryService.ts
│   ├── orderService.ts
│   ├── integrationService.ts
│   └── paymentService.ts
├── routes/           # API routes
│   ├── admin/        # Super admin routes
│   ├── tenant/       # Tenant admin routes
│   └── storefront/   # Customer-facing routes
└── index.ts          # Main application entry
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Installation

1. **Clone the repository**
```bash
git clone <repo>
cd digital-commerce-platform
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database URL and secrets
```

3. **Setup database**
```bash
npm run migrate
```

4. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

### Health Check
```
GET /health
```

### Super Admin Routes
```
POST   /api/admin/tenants                  # Create tenant
GET    /api/admin/tenants                  # List all tenants
PUT    /api/admin/tenants/:id              # Update tenant
DELETE /api/admin/tenants/:id              # Delete tenant
```

### Tenant Admin Routes (Product Types)
```
POST   /api/{tenant_slug}/admin/product-types      # Create product type
GET    /api/{tenant_slug}/admin/product-types      # List product types
GET    /api/{tenant_slug}/admin/product-types/:id  # Get product type
PUT    /api/{tenant_slug}/admin/product-types/:id  # Update product type
DELETE /api/{tenant_slug}/admin/product-types/:id  # Delete product type
```

### Tenant Admin Routes (Products)
```
POST   /api/{tenant_slug}/admin/products                    # Create product
GET    /api/{tenant_slug}/admin/products                    # List products
GET    /api/{tenant_slug}/admin/products/:id                # Get product
PUT    /api/{tenant_slug}/admin/products/:id                # Update product
POST   /api/{tenant_slug}/admin/products/:id/attributes/:key  # Set attribute
GET    /api/{tenant_slug}/admin/products/:id/attributes     # Get attributes
DELETE /api/{tenant_slug}/admin/products/:id                # Delete product
```

### Tenant Admin Routes (Workflows)
```
POST   /api/{tenant_slug}/admin/workflows      # Create workflow
GET    /api/{tenant_slug}/admin/workflows      # List workflows
GET    /api/{tenant_slug}/admin/workflows/:id  # Get workflow
PUT    /api/{tenant_slug}/admin/workflows/:id  # Update workflow
DELETE /api/{tenant_slug}/admin/workflows/:id  # Delete workflow
```

### Tenant Admin Routes (Delivery Methods)
```
POST   /api/{tenant_slug}/admin/delivery-methods      # Create delivery method
GET    /api/{tenant_slug}/admin/delivery-methods      # List delivery methods
GET    /api/{tenant_slug}/admin/delivery-methods/:id  # Get delivery method
PUT    /api/{tenant_slug}/admin/delivery-methods/:id  # Update delivery method
DELETE /api/{tenant_slug}/admin/delivery-methods/:id  # Delete delivery method
```

### Tenant Admin Routes (Plugins)
```
GET    /api/{tenant_slug}/admin/plugins                    # List plugins
POST   /api/{tenant_slug}/admin/plugins/:plugin_id/install # Install plugin
GET    /api/{tenant_slug}/admin/plugins/installed/:plugin_id # Get installed plugin
PUT    /api/{tenant_slug}/admin/plugins/:plugin_id/config  # Update plugin config
POST   /api/{tenant_slug}/admin/plugins/:plugin_id/enable  # Enable plugin
POST   /api/{tenant_slug}/admin/plugins/:plugin_id/disable # Disable plugin
DELETE /api/{tenant_slug}/admin/plugins/:plugin_id         # Uninstall plugin
```

### Tenant Admin Routes (Orders)
```
POST   /api/{tenant_slug}/admin/orders        # Create order
GET    /api/{tenant_slug}/admin/orders        # List orders
GET    /api/{tenant_slug}/admin/orders/:id    # Get order
PUT    /api/{tenant_slug}/admin/orders/:id    # Update order
POST   /api/{tenant_slug}/admin/orders/:id/items # Add order item
```

### Tenant Admin Routes (Integrations)
```
POST   /api/{tenant_slug}/admin/integrations        # Create integration
GET    /api/{tenant_slug}/admin/integrations        # List integrations
GET    /api/{tenant_slug}/admin/integrations/:id    # Get integration
PUT    /api/{tenant_slug}/admin/integrations/:id    # Update integration
DELETE /api/{tenant_slug}/admin/integrations/:id    # Delete integration
```

### Tenant Admin Routes (Payment Gateways)
```
POST   /api/{tenant_slug}/admin/payment-gateways      # Create payment gateway
GET    /api/{tenant_slug}/admin/payment-gateways      # List payment gateways
GET    /api/{tenant_slug}/admin/payment-gateways/:id  # Get payment gateway
PUT    /api/{tenant_slug}/admin/payment-gateways/:id  # Update payment gateway
DELETE /api/{tenant_slug}/admin/payment-gateways/:id  # Delete payment gateway
```

### Storefront Routes
```
GET /api/{tenant_slug}/storefront/products       # List products
GET /api/{tenant_slug}/storefront/products/:id   # Get product
```

## Database Schema

The platform uses PostgreSQL with a comprehensive schema supporting:

- **Multi-Tenant Core**: Tenants, Tenant Users
- **Dynamic Product System**: Product Types, Products, Product Attributes, Product Variants
- **Plugin System**: Plugins, Tenant Plugins, Plugin Hooks
- **Workflow System**: Workflows, Workflow Executions
- **Delivery System**: Delivery Methods, Deliveries
- **Pricing**: Pricing Rules, User Roles
- **Orders & Transactions**: Orders, Order Items
- **Payments**: Payment Gateways, Payment Transactions
- **Integrations**: Integrations, Integration Syncs

See `src/db/migrations/001_init_schema.sql` for full schema details.

## Plugin Development

### Plugin Manifest Structure

Create a `plugin.json` in your plugin root:

```json
{
  "name": "My Plugin",
  "slug": "my-plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Plugin description",
  "compatibility": [">=1.0.0"],
  "hooks": [
    {
      "name": "before_product_create",
      "handler": "src/hooks/beforeProductCreate.js",
      "priority": 10
    }
  ],
  "api_endpoints": [
    {
      "method": "POST",
      "path": "/custom-action",
      "handler": "src/api/customAction.js",
      "auth_required": true
    }
  ],
  "admin_ui": {
    "settings_component": "src/admin/Settings.jsx",
    "menu_items": [
      {
        "label": "My Plugin",
        "path": "/my-plugin",
        "component": "src/admin/Dashboard.jsx"
      }
    ]
  },
  "database_migrations": ["migrations/001_create_tables.sql"],
  "permissions": ["my_plugin.manage", "my_plugin.view"],
  "settings_schema": {
    "api_key": {
      "type": "string",
      "label": "API Key",
      "required": true
    }
  }
}
```

### Available Hooks

**Product Hooks:**
- `before_product_create`
- `after_product_create`
- `before_product_update`
- `after_product_update`
- `before_product_delete`

**Order Hooks:**
- `before_order_create`
- `after_order_create`
- `before_order_update`
- `after_order_update`
- `order_status_changed`

**Payment Hooks:**
- `before_payment_process`
- `after_payment_success`
- `after_payment_failed`

**Delivery Hooks:**
- `before_delivery`
- `after_delivery`

**User Hooks:**
- `user_registered`
- `user_login`
- `user_logout`

**Cart Hooks:**
- `cart_item_added`
- `cart_item_removed`
- `before_checkout`

**Custom Hooks:**
- `schedule_{cron_expression}`
- `webhook_received`
- `api_request`

### Plugin API

Plugins receive a context object with these methods:

```typescript
// Access store context
const store = await ctx.getStore();

// Database access
const products = await ctx.db.products.findMany();

// Call other plugins
const result = await ctx.plugins.call('other-plugin', 'method', args);

// Emit events
await ctx.events.emit('custom_event', data);

// Schedule jobs
await ctx.queue.add('my-job', data, { delay: 3600 });

// Cache operations
await ctx.cache.set('key', value, ttl);

// HTTP requests
const response = await ctx.http.get('https://api.example.com');

// Send email
await ctx.email.send({
  to: 'user@example.com',
  template: 'order_confirmation',
  data: { order }
});
```

## Product Type Schema

Define custom fields for each product type:

```json
{
  "fields": [
    {
      "name": "title",
      "type": "text",
      "label": "Title",
      "required": true,
      "validation": {
        "minLength": 3,
        "maxLength": 255
      }
    },
    {
      "name": "description",
      "type": "rich_text",
      "label": "Description",
      "required": false
    },
    {
      "name": "category",
      "type": "select",
      "label": "Category",
      "options": [
        { "value": "action", "label": "Action Games" },
        { "value": "puzzle", "label": "Puzzle Games" }
      ]
    },
    {
      "name": "files",
      "type": "file",
      "label": "Download Files",
      "fileTypes": ["zip", "exe"],
      "maxSize": 1073741824
    }
  ]
}
```

## Authentication

The platform supports two types of authentication:

1. **Admin Token**: For super admin operations
```bash
Authorization: Bearer <admin_jwt_token>
```

2. **Tenant Token**: For tenant-specific operations
```bash
Authorization: Bearer <tenant_jwt_token>
```

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: digital_commerce
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/digital_commerce
      ADMIN_JWT_SECRET: your-secret
      TENANT_JWT_SECRET: your-secret
    depends_on:
      - postgres
    volumes:
      - ./plugins:/app/plugins

volumes:
  postgres_data:
```

## Performance Considerations

- Database indexes on frequently queried fields (tenant_id, slug, status)
- Connection pooling with pg-promise (max 30 connections)
- JSONB fields for flexible schema
- Row-level security can be implemented per tenant
- Caching layer ready for Redis integration

## Security

- JWT-based authentication
- Bcrypt password hashing (10 rounds)
- CORS and Helmet middleware enabled
- JSON size limit (10MB)
- SQL injection prevention via parameterized queries
- Encrypted credential storage for integrations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT

## Support

For support, email support@example.com or open an issue on GitHub.
