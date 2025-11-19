# Drizzle D1 Migration Guide

This document outlines the migration from PostgreSQL/pg-promise to Drizzle ORM on Cloudflare D1.

## Overview

The migration provides:
- **Drizzle ORM** as the primary query builder for SQLite D1 compatibility
- **Tenant-scoped queries** for enforcing row-level isolation
- **JSON field support** with automatic serialization/deserialization
- **EAV pattern** for product attributes and variants (preserved)
- **Migration utilities** for PostgreSQL → D1 data transfer
- **Workers-specific database configuration** via D1 bindings

## Architecture

### Database Layer

**Express Runtime** (Production with PostgreSQL):
- `src/config/database.ts` - pg-promise connection
- Services use traditional SQL queries with pg-promise API

**Cloudflare Workers Runtime** (D1/SQLite):
- `src/config/worker-database.ts` - Drizzle + D1 initialization
- `src/db/schema.ts` - Complete Drizzle schema with relations
- Services use Drizzle query builder

### Services

All services have **Drizzle-enabled versions**:

```
src/services/
├── drizzle-tenant-service.ts
├── drizzle-product-service.ts
├── drizzle-product-type-service.ts
├── drizzle-plugin-service.ts
├── drizzle-order-service.ts
├── drizzle-workflow-service.ts
├── drizzle-delivery-service.ts
├── drizzle-payment-service.ts
└── drizzle-integration-service.ts
```

Each service provides:
- CRUD operations with tenant isolation
- JSON field parsing/serialization
- Pagination helpers
- Error handling (same as pg-promise versions)

## Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `drizzle-orm` - ORM layer
- `drizzle-kit` - Migration generator & CLI
- `better-sqlite3` - SQLite driver for local development

### 2. Configure Environment

Create `.env.worker` for Workers development:

```env
DB_FILE_NAME=./local.db
NODE_ENV=development
ADMIN_JWT_SECRET=dev-secret
TENANT_JWT_SECRET=dev-secret
```

### 3. Generate Initial Migrations

```bash
npm run db:generate
```

This creates migration files in `drizzle/migrations/`.

### 4. Apply Migrations Locally

For local development with better-sqlite3:

```bash
npm run db:migrate:local
```

For Cloudflare Workers environments:

```bash
# Development
npm run db:migrate:worker

# Staging
npm run db:migrate:worker:staging

# Production
npm run db:migrate:worker:prod
```

## Schema

The Drizzle schema is fully defined in `src/db/schema.ts` with:

- **18 tables** matching PostgreSQL schema
- **SQLite-specific types** (TEXT for JSON, REAL for decimals)
- **Automatic timestamps** using SQL expressions
- **Foreign key relationships** with cascade delete
- **Indexes** for tenant_id and common queries
- **Relations** for eager loading support

### Key Tables

#### Core Multi-Tenant
- `tenants` - Tenant configuration, settings, branding
- `tenant_users` - User access control per tenant

#### Products (EAV Pattern)
- `product_types` - Dynamic schema definitions
- `products` - Product records
- `product_attributes` - EAV attributes (flexible)
- `product_variants` - SKU-based variants

#### Plugins
- `plugins` - Global plugin registry
- `tenant_plugins` - Per-tenant plugin installation
- `plugin_hooks` - Hook handlers with priority

#### Orders & Payments
- `orders` - Order records with JSONB data
- `order_items` - Line items
- `payment_gateways` - Payment gateway config
- `payment_transactions` - Transaction records

#### Workflows & Delivery
- `workflows` - Workflow definitions
- `workflow_executions` - Execution tracking
- `delivery_methods` - Delivery configuration
- `deliveries` - Delivery records

#### Integrations & Pricing
- `integrations` - External service integrations
- `integration_syncs` - Sync tracking
- `pricing_rules` - Pricing configuration
- `user_roles` - Role-based access

## Usage in Worker Routes

### Initialize Database in Worker

```typescript
import { initWorkerDb } from './config/worker-database.js';
import { drizzleTenantService } from './services/drizzle-tenant-service.js';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Initialize Drizzle with D1 binding
    initWorkerDb(env.DB);

    // Use services
    const tenant = await drizzleTenantService.getTenantBySlug('my-store');
    // ... handle request
  },
};
```

### Example: Creating a Product (Tenant-Scoped)

```typescript
import { drizzleProductService } from './services/drizzle-product-service.js';

async function createProduct(tenantId: string) {
  const product = await drizzleProductService.createProduct(tenantId, {
    product_type_id: 'type-123',
    name: 'Premium Course',
    slug: 'premium-course',
    metadata: {
      description: 'An advanced course',
      rating: 4.5,
    },
  });

  return product;
}
```

### Example: Querying with Filters

```typescript
const { data, total, page, pages } = await drizzleProductService.listProducts(
  tenantId,
  { status: 'published', product_type_id: 'course' },
  limit = 20,
  offset = 0
);
```

### Example: EAV Operations

```typescript
// Set custom attribute
await drizzleProductService.setAttribute(
  productId,
  'course_duration_hours',
  120,
  'number'
);

// Get all attributes
const attrs = await drizzleProductService.getAttributes(productId);

// Get specific attribute
const duration = await drizzleProductService.getAttribute(productId, 'course_duration_hours');
```

## Data Migration: PostgreSQL → D1

For existing customers with PostgreSQL data:

### 1. Export Data from PostgreSQL

```bash
export SOURCE_DB_URL="postgresql://user:pass@host/dbname"
export TARGET_DB_FILE="./migrated.db"

npm run db:migrate:postgres-to-d1
```

The migration script:
1. **Connects to PostgreSQL** using the connection string
2. **Exports all tables** in batches (100 records/batch)
3. **Transforms JSON fields** for SQLite compatibility
4. **Imports into target database** using Drizzle
5. **Validates data integrity** with record counts
6. **Generates a migration report** with success/error details

### 2. Verify Migration

The script outputs a summary table:

```
Migration Summary:
─────────────────────────────────────
table              | sourceCount | targetCount | status   | message
────────────────────────────────────
tenants            | 5          | 5           | success  | Migration successful
products           | 152        | 152         | success  | Migration successful
product_attributes | 48         | 48          | success  | Migration successful
orders             | 1234       | 1234        | success  | Migration successful
...
─────────────────────────────────────
```

### 3. Deploy to Workers

Once verified locally:

```bash
# Build the worker code
npm run build

# Deploy with migrated data
npm run cf:deploy
```

## JSON Field Handling

All JSON-storing fields are automatically handled by the Drizzle services:

**On Write:**
```typescript
// Automatically serialized to JSON string
await drizzleProductService.createProduct(tenantId, {
  metadata: { key: 'value', nested: { data: 123 } }, // Object → JSON string
});
```

**On Read:**
```typescript
const product = await drizzleProductService.getProduct(tenantId, id);
// Automatically parsed
console.log(product.metadata); // { key: 'value', nested: { data: 123 } }
```

## Tenant Isolation

All services enforce `tenant_id` filtering:

```typescript
// The following queries are automatically scoped to tenantId
const products = await drizzleProductService.listProducts(tenantId);
const product = await drizzleProductService.getProduct(tenantId, productId);
const updated = await drizzleProductService.updateProduct(tenantId, productId, data);
```

**Row-Level Security** is enforced at the application layer - all services include tenant_id in WHERE clauses.

## Pagination

All list methods support pagination:

```typescript
const { data, total, page, limit, pages } = await service.listItems(
  tenantId,
  filters,
  limit = 50,      // Items per page
  offset = 0        // Skip N records
);
```

Returns:
- `data` - Array of records for current page
- `total` - Total count across all pages
- `page` - Current page number (1-indexed)
- `limit` - Items per page
- `pages` - Total number of pages

## Performance Notes

### SQLite (D1) Limitations

- **No JSONB operators** - JSON is stored as TEXT, no native operators
- **Slower complex joins** - Prefer denormalization for frequently-queried data
- **30-second timeout** - Workers have hard limit; avoid long transactions
- **Concurrent writes** - SQLite is single-writer; consider read replicas

### Best Practices

1. **Batch operations** - Insert/update in batches of 100-1000
2. **Minimize JSON depth** - Keep JSON structures flat
3. **Index frequently-searched fields** - Add indexes beyond tenant_id
4. **Denormalize when needed** - Store computed values separately
5. **Use pagination** - Always paginate list queries

## Testing

### Run Tests

```bash
npm test
```

Tests should use:
- Drizzle-based services exclusively
- Mocked database responses or test databases
- Tenant-scoped fixtures

### Mock Database for Tests

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/db/schema';

const testDb = new Database(':memory:');
const drizzleDb = drizzle(testDb, { schema });
// Use drizzleDb in tests
```

## Migration Status

### ✅ Completed

- [x] Drizzle schema definition (all 18 tables)
- [x] Worker database factory
- [x] All service implementations (9 services)
- [x] JSON field serialization/deserialization
- [x] Tenant-scoped query helpers
- [x] Pagination support
- [x] Data migration utility (PostgreSQL → D1)
- [x] npm scripts for migrations
- [x] Error handling & validation

### 🔄 In Progress

- Gradual service adoption (Express runtime still uses pg-promise)
- Test coverage for Drizzle services

### 📋 Future

- Migration complete when all services use Drizzle
- Consider full cutover date for PostgreSQL support

## Troubleshooting

### "Database not initialized"
Ensure `initWorkerDb(env.DB)` is called before services:

```typescript
export default {
  async fetch(request: Request, env: Env) {
    initWorkerDb(env.DB);
    // Now services will work
  },
};
```

### "Column not found" errors
Check:
1. Migrations have been applied with `npm run db:migrate:local`
2. Schema matches table names in migrations
3. Use camelCase in code, snake_case in database

### JSON parsing errors
Ensure JSON fields are properly parsed:

```typescript
// ✅ Correct
const settings = typeof data.settings === 'string' 
  ? JSON.parse(data.settings) 
  : data.settings;

// ✅ Services handle this automatically
const tenant = await drizzleTenantService.getTenant(id);
console.log(tenant.settings); // Already parsed object
```

### Foreign key constraint errors
D1 foreign keys work differently than PostgreSQL:
- Use cascading deletes for safety
- Check foreign key is present before operations
- Consider soft deletes for reference data

## Support

For issues or questions:
1. Check this guide first
2. Review `src/db/schema.ts` for table structure
3. Review `src/services/drizzle-*.ts` for service patterns
4. Check Drizzle documentation: https://orm.drizzle.team/

## References

- Drizzle ORM: https://orm.drizzle.team/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- SQLite Documentation: https://www.sqlite.org/
