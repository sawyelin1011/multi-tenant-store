# Database Migration System Guide

## Overview

This platform now includes a comprehensive database migration system that supports both **PostgreSQL** (for Express backend) and **SQLite** (for Cloudflare Workers D1) with automatic migration on startup.

## Features

✅ **Auto-migration on startup** - Migrations run automatically when `DB_AUTO_MIGRATE=true`  
✅ **PostgreSQL support** - Full support for Express backend  
✅ **SQLite support** - Full support for Cloudflare Workers (D1) and local development  
✅ **Migration tracking** - All migrations tracked in `schema_migrations` table  
✅ **Idempotent** - Safe to run multiple times  
✅ **SQL syntax adaptation** - Automatically converts PostgreSQL SQL to SQLite-compatible SQL  
✅ **Super admin initialization** - Auto-creates super admin user on first run  

## Database Configuration

### Environment Variables

```env
# Database Type Selection
DB_TYPE=postgres              # postgres or sqlite
DB_AUTO_MIGRATE=true          # Auto-run migrations on startup

# PostgreSQL Configuration (DB_TYPE=postgres)
DATABASE_URL=postgresql://user:pass@localhost:5432/db_name

# SQLite Configuration (DB_TYPE=sqlite)
DB_PATH=./local.db            # Path to SQLite database file
```

### Express Backend (PostgreSQL)

```env
NODE_ENV=development
DB_TYPE=postgres
DATABASE_URL=postgresql://localhost/digital_commerce
DB_AUTO_MIGRATE=true
```

### Cloudflare Workers (SQLite D1)

```env
DB_TYPE=sqlite
DB_PATH=./local.db
DB_AUTO_MIGRATE=true
```

## Migration Files

Migration files are located in `src/db/migrations/` and follow this naming convention:

```
000_create_users.sql
001_init_schema.sql
002_ui_templates.sql
```

The numeric prefix determines execution order. Migration files should use **PostgreSQL syntax** - they will be automatically converted to SQLite syntax when `DB_TYPE=sqlite`.

### SQL Syntax Conversions

The migration runner automatically converts PostgreSQL syntax to SQLite:

| PostgreSQL | SQLite |
|------------|--------|
| `UUID` | `TEXT` |
| `TIMESTAMP` | `DATETIME` |
| `JSONB` | `TEXT` |
| `BIGINT` | `INTEGER` |
| `BOOLEAN` | `INTEGER` |
| `DECIMAL(19,4)` | `REAL` |
| `CURRENT_TIMESTAMP` | `(datetime('now'))` |
| `DEFAULT true` | `DEFAULT 1` |
| `DEFAULT false` | `DEFAULT 0` |
| `DEFAULT gen_random_uuid()` | (removed - not supported) |

## NPM Scripts

### Migration Commands

```bash
# Run pending migrations
npm run db:migrate:up

# Rollback last migration
npm run db:migrate:down

# Check migration status
npm run db:migrate:status

# Legacy commands (still work)
npm run migrate              # Same as db:migrate:up
npm run migrate:down         # Same as db:migrate:down
```

### Example Output

```bash
$ npm run db:migrate:status

Migration Status:

Database Type: sqlite
Total Migrations: 3
Executed: 2
Pending: 1

✓ 000_create_users.sql
✓ 001_init_schema.sql
○ 002_ui_templates.sql
```

## Auto-Migration on Startup

When `DB_AUTO_MIGRATE=true` (default in development), migrations run automatically on application startup:

```bash
$ npm run dev

🚀 Bootstrapping application...

🔄 Running database migrations...
✓ Migration 0: 000_create_users
✓ Migration 1: 001_init_schema
✓ Migration 2: 002_ui_templates
✓ Ran 3 migration(s)

🔧 Creating super admin user...
✅ Super admin created: admin@platform.example.com
🔑 API Key: sk_test_anyvaluedemo

✅ Bootstrap complete

🚀 Server running on http://localhost:3000
Environment: development
```

### Disabling Auto-Migration

For production, disable auto-migration and run migrations manually:

```env
DB_AUTO_MIGRATE=false
```

Then run migrations via CI/CD:

```bash
npm run db:migrate:up
```

## Super Admin Initialization

The bootstrap process automatically creates a super admin user on first run:

- **Email**: Set via `SUPER_ADMIN_EMAIL` env var (default: `admin@platform.example.com`)
- **Password**: Set via `SUPER_ADMIN_PASSWORD` env var (default: `admin123`)
- **API Key**: Set via `SUPER_ADMIN_API_KEY` env var (default: `sk_test_anyvaluedemo`)

The super admin user is created in the `users` table and has role `super_admin`.

### Error Handling

If migrations haven't run yet or the `users` table doesn't exist, the bootstrap process will:

1. Log a warning message
2. Skip super admin creation
3. Continue server startup
4. Not crash the application

This ensures the app can start even if migrations fail.

## Creating New Migrations

1. Create a new SQL file in `src/db/migrations/`:

```bash
# Example: 003_add_payments.sql
```

2. Write your migration using **PostgreSQL syntax**:

```sql
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(19, 4) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_status ON payments(status);
```

3. The migration will be automatically converted to SQLite syntax when running with `DB_TYPE=sqlite`.

4. Run the migration:

```bash
npm run db:migrate:up
```

## Migration Tracking

All executed migrations are tracked in the `schema_migrations` table:

### PostgreSQL

```sql
CREATE TABLE schema_migrations (
  version BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SQLite

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at DATETIME DEFAULT (datetime('now'))
);
```

## TypeScript Build Configuration

The project uses independent TypeScript configurations per package:

- **Root `tsconfig.json`**: Compiles `src/` only, excludes `packages/`
- **Package configs**: Each package has its own `tsconfig.json` with independent `rootDir` and `outDir`
- **Build order**: `config` → `plugin-sdk` → `admin-cli` → `admin`

### Build Commands

```bash
# Build all packages
npm run build:all

# Build main backend
npm run build

# Build individual packages
npm run build:config
npm run build:sdk
npm run build:cli
npm run build:admin
```

## Testing

### Test SQLite Migrations

```bash
# Set up SQLite database
export DB_TYPE=sqlite
export DB_PATH=./test.db

# Run migrations
npm run db:migrate:up

# Check status
npm run db:migrate:status

# Start app with auto-migration
npm run dev
```

### Test PostgreSQL Migrations

```bash
# Set up PostgreSQL database
export DB_TYPE=postgres
export DATABASE_URL=postgresql://localhost/test_db

# Run migrations
npm run db:migrate:up

# Check status
npm run db:migrate:status

# Start app with auto-migration
npm run dev
```

## Troubleshooting

### "relation users does not exist"

This error means migrations haven't run yet. Solution:

```bash
npm run db:migrate:up
```

Or enable auto-migration:

```bash
export DB_AUTO_MIGRATE=true
npm run dev
```

### Migration Syntax Errors with SQLite

If you encounter SQL syntax errors with SQLite, check that your migration:

1. Uses standard SQL that can be converted
2. Doesn't use PostgreSQL-specific features that SQLite doesn't support
3. Has proper semicolons between statements

### TypeScript Build Errors

If you encounter TypeScript build errors about files outside `rootDir`:

1. Make sure root `tsconfig.json` excludes `packages/` directory
2. Build packages first: `npm run build:all`
3. Root tsconfig points to built `.d.ts` files in `packages/*/dist/`

## Architecture

### Bootstrap Process

1. `src/bootstrap/database.ts` - Runs migrations if `DB_AUTO_MIGRATE=true`
2. `src/bootstrap/init-super-admin.ts` - Creates super admin if not exists
3. `src/bootstrap/index.ts` - Orchestrates the bootstrap sequence
4. `src/index.ts` - Calls bootstrap before starting Express server

### Migration Runner

`src/db/migrate.ts` includes:

- **DatabaseAdapter interface** - Abstract database operations
- **PostgresAdapter** - PostgreSQL implementation using pg-promise
- **SQLiteAdapter** - SQLite implementation using better-sqlite3
- **SQL adaptation** - Converts PostgreSQL syntax to SQLite
- **Transaction support** - Wraps migrations in transactions
- **Error handling** - Rolls back on failure

### Database Adapters

```typescript
interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}
```

Implementations:
- **PostgresAdapter**: Uses `pg-promise` for PostgreSQL
- **SQLiteAdapter**: Uses `better-sqlite3` for SQLite

## Migration Strategy

### Development
- Use `DB_AUTO_MIGRATE=true`
- Migrations run automatically on startup
- Fast iteration and testing

### Staging
- Use `DB_AUTO_MIGRATE=true` or `false` (your choice)
- Can run migrations via CI/CD or on startup

### Production
- Use `DB_AUTO_MIGRATE=false`
- Run migrations via CI/CD before deployment
- Ensure migrations complete before deploying new code

## Future Enhancements

Possible future improvements:

- [ ] Rollback/down migrations with SQL files
- [ ] Migration seeds for test data
- [ ] Schema comparison and drift detection
- [ ] Migration dry-run mode
- [ ] Migration locking for concurrent deployments
- [ ] Support for other databases (MySQL, MariaDB, etc.)

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [pg-promise Documentation](https://github.com/vitaly-t/pg-promise)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

---

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
─────────────────────────────────────
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
