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
