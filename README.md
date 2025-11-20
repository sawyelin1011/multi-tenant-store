# Digital Commerce Platform

A flexible, multi-tenant digital commerce platform supporting ANY type of digital products (games, software, courses, ebooks, SaaS, subscriptions, NFTs, etc.) with complete store isolation and plugin architecture.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (auto-creates super admin)
npm run dev

# In another terminal, seed demo data via API
npm run seed

# Run all tests
npm run test:all
```

The platform will be available at `http://localhost:3000` with:
- **Super Admin**: admin@platform.example.com / admin123
- **API Key**: sk_test_anyvaluedemo
- **Demo Tenants**: gamestore, ebookstore, courseplatform

## 🧪 Testing & Quality

This project is **production-ready** with comprehensive testing and code quality tools:

### Testing Suite
- **Unit Tests**: `npm run test` - Core functionality testing
- **Integration Tests**: `npm run test:integration` - API endpoint testing  
- **API Tests**: `npm run test:api` - All 28+ endpoints with X-API-Key auth
- **E2E Tests**: `npm run test:e2e` - Full user workflows with Playwright
- **Coverage**: `npm run test:coverage` - >80% code coverage target

### Code Quality
- **Linting**: `npm run lint` - Biome linter (zero warnings)
- **Formatting**: `npm run format` - Biome formatter (consistent code style)
- **Type Checking**: `npm run type-check` - TypeScript strict mode
- **All Checks**: `npm run test:all` - Run linting, tests, and E2E together

### Seeding & Demo Data
- **Seed Script**: `npm run seed` - Creates 3 demo tenants with products via API
- **Idempotent**: Safe to run multiple times
- **API Authenticated**: Uses X-API-Key header with configured key
- **Comprehensive**: Games, ebooks, courses with realistic sample data

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

4. **Start development server (Express)**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Cloudflare Workers Deployment

The platform supports deployment to Cloudflare Workers using Hono for a serverless, edge-computing runtime.

#### Prerequisites for Workers
- Cloudflare account with Workers enabled
- Wrangler CLI (`npm install -g wrangler` or use `npx wrangler`)

#### Local Development with Workers

1. **Configure Wrangler**
Update `wrangler.toml` with your Cloudflare account details:
```toml
account_id = "your-account-id"
```

2. **Start local Worker development**
```bash
npm run cf:dev
```

This uses Miniflare for local development. The API will be available at `http://localhost:8787`

#### Bindings Setup

The Worker runtime uses Cloudflare bindings for:
- **D1**: SQLite database (replaces PostgreSQL)
- **KV**: Cache and session storage namespaces
- **R2**: Asset and file storage bucket
- **Env Secrets**: API keys and JWT secrets

All bindings are defined in `wrangler.toml` with environment-specific configurations.

#### Deployment

Deploy to Cloudflare Workers:
```bash
# Deploy to production
npm run cf:deploy

# Deploy to staging
npm run cf:deploy:staging
```

#### Database Migration for D1

For Workers deployment, use the D1 database instead of PostgreSQL:
```bash
wrangler d1 execute commerce-prod --remote < src/db/migrations/001_init_schema.sql
```

#### Environment Configurations

**Development** (`cf:dev`)
- Local Miniflare runtime
- Dev namespace bindings
- Development secrets from wrangler.toml

**Staging** (`cf:deploy:staging`)
- Cloudflare staging environment
- Staging D1 database
- Staging KV and R2 bindings

**Production** (`cf:deploy`)
- Cloudflare production environment
- Production D1 database
- Production KV and R2 bindings

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

## Postman Collection

A ready-to-use Postman collection is available at [postman-collection.json](./postman-collection.json) in the project root. It covers every major API surface area (super admin, tenant admin, storefront, and health) with sample payloads, headers, and query parameters so you can start testing immediately.

### Import instructions

1. Download the file or copy its absolute path.
2. In Postman choose **Import → Upload Files** and select `postman-collection.json`.
3. After the collection loads, open the **Variables** tab and adjust the defaults for your environment.

The collection defines helpful variables such as `base_url` (defaults to `http://localhost:3000`), `api_key`, `admin_token`, `tenant_token`, `tenant_id`, `tenant_slug`, `product_type_id`, `product_id`, and `order_id`. Update them with real values before sending requests. Checkout examples also demonstrate passing `X-API-Key` headers for storefront flows.

### Quick start testing flow

1. Run the ❤️ **Health Check** request to verify the API is reachable.
2. Use 🔐 **Super Admin Auth → Admin Login** (or set the `admin_token` variable) to obtain a JWT.
3. Generate an API key if you plan to exercise storefront checkout calls.
4. Create or list tenants via 🏢 **Super Admin Tenants** and capture the resulting `tenant_id` / `tenant_slug`.
5. Switch to tenant-scoped folders (Products, Product Types, Orders, Plugins) after setting a valid `tenant_token`.
6. Finish by testing 🛍️ **Storefront Public** and 🛒 **Cart & Checkout** flows to simulate a shopper experience.

This workflow mirrors how most teams stand up a tenant, seed catalog data, and walk through checkout end-to-end.

## Development

The platform supports dual runtime development: Node.js (Express) and Cloudflare Workers (Hono).

📖 **For detailed development instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md)**

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL (for Express development)
- Cloudflare account (for Workers deployment)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Environment configuration:**

For local Express development:
```bash
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection
```

For Workers development:
```bash
# Configure wrangler.toml with your Cloudflare credentials
wrangler auth login
```

### Development Scripts

#### Express (Node.js) Development
```bash
# Start Express server (port 3000)
npm run dev

# Start with file watching
npm run dev:watch

# Build for production
npm run build

# Start production server
npm start
```

#### Cloudflare Workers Development
```bash
# Start Workers dev server with Miniflare (port 8787)
npm run cf:dev

# Build Workers bundle
npm run cf:build

# Deploy to staging
npm run cf:deploy:staging

# Deploy to production
npm run cf:deploy
```

#### Dual Runtime Development
```bash
# Run both Express and Workers concurrently
npm run dev:both
```

#### Database Operations
```bash
# Generate Drizzle migrations
npm run db:generate

# Apply migrations to local PostgreSQL
npm run migrate

# Apply migrations to D1 (development)
npm run db:migrate:worker

# Apply migrations to D1 (staging)
npm run db:migrate:worker:staging

# Apply migrations to D1 (production)
npm run db:migrate:worker:prod

# Migrate PostgreSQL to D1 (one-time export)
npm run db:migrate:postgres-to-d1
```

### Port Configuration

- **Express Server**: `http://localhost:3000`
- **Workers Server**: `http://localhost:8787`

### Environment Detection

The application automatically detects the runtime:

```typescript
import { isCloudflareWorker, runtime } from './config/env.js';

// runtime === 'node' || runtime === 'worker'
// isCloudflareWorker === true/false
```

### TypeScript Configuration

The project uses a unified `tsconfig.json` compatible with both runtimes:
- Target: ES2022
- Module: ESNext
- Module Resolution: Bundler
- Types: Node.js + Cloudflare Workers

### Troubleshooting

#### Common Issues

1. **ts-node deprecation warnings:**
   - Fixed by using `tsx` instead of `ts-node/esm` loader
   - Use `npm run dev` or `npm run dev:watch`

2. **fs.Stats deprecation:**
   - Suppressed with `NODE_OPTIONS="--no-deprecation"` in .env.local

3. **Module resolution errors:**
   - Ensure `type: "module"` in package.json
   - Use `.js` extensions in imports

4. **Workers D1 database not found:**
   - Run `wrangler d1 create commerce-dev`
   - Update database_id in wrangler.toml

5. **Concurrent development conflicts:**
   - Express uses port 3000, Workers uses port 8787
   - Use different terminal windows for each runtime

### Development Workflow

1. **Feature Development:**
   - Start with Express (`npm run dev:watch`) for rapid iteration
   - Test with Workers (`npm run cf:dev`) before deployment
   - Use `npm run dev:both` to run both simultaneously

2. **Database Changes:**
   - Update Drizzle schema in `src/db/schema.ts`
   - Generate migrations: `npm run db:generate`
   - Apply to both runtimes as needed

3. **Testing:**
   - Run unit tests: `npm test`
   - Lint code: `npm run lint`
   - Format code: `npm run format`

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

## 🔑 API Key Configuration

The platform supports API key authentication for automation and external integrations:

### Environment Variables

```bash
# .env.example
SUPER_ADMIN_API_KEY=sk_test_anyvaluedemo
SUPER_ADMIN_EMAIL=admin@platform.example.com
SUPER_ADMIN_PASSWORD=admin123
```

### API Key Usage

```bash
# Using X-API-Key header
curl -X POST "http://localhost:3000/api/admin/tenants" \
  -H "X-API-Key: sk_test_anyvaluedemo" \
  -H "Content-Type: application/json" \
  -d '{"slug": "my-store", "name": "My Store"}'
```

### Super Admin Auto-Initialization

On startup, the platform automatically:
1. Checks if super admin user exists
2. Creates with configured email/password if not exists
3. Sets/updates API key from environment
4. Logs initialization status

### Default Credentials

- **Email**: admin@platform.example.com
- **Password**: admin123  
- **API Key**: sk_test_anyvaluedemo

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
