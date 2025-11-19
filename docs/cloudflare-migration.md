# Cloudflare Workers Migration Guide

A comprehensive guide to migrating from Express.js + PostgreSQL to Cloudflare Workers + D1 SQLite, covering architecture, performance considerations, and data migration strategies.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Comparison](#architecture-comparison)
3. [Migration Path](#migration-path)
4. [Performance Considerations](#performance-considerations)
5. [Data Migration Utility](#data-migration-utility)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

## Overview

The Digital Commerce Platform now supports dual runtimes:

- **Express.js**: Traditional Node.js runtime for local development and self-hosted deployments
- **Cloudflare Workers**: Serverless edge computing for global, low-latency production deployments

Both runtimes expose identical API surfaces and can coexist during migration, allowing gradual adoption of Workers technology.

### Why Migrate to Workers?

**Advantages:**
- ✅ Global edge deployment (latency reduction)
- ✅ Instant cold starts (no startup time)
- ✅ Automatic scaling (pay-per-request pricing)
- ✅ Zero infrastructure management
- ✅ Built-in DDoS protection and caching

**Trade-offs:**
- ⚠️ 30-second maximum request timeout
- ⚠️ Limited CPU time per request
- ⚠️ Memory constraints
- ⚠️ SQLite limitations compared to PostgreSQL

## Architecture Comparison

### Express Runtime Stack

```
┌─────────────────────────────────────┐
│      Client (Browser/API)           │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   Express.js HTTP Server            │
│   (src/index.ts)                    │
├─────────────────────────────────────┤
│  Express Middleware & Routes        │
│  - CORS, Security Headers           │
│  - JWT Authentication               │
│  - Tenant Resolution                │
│  - Error Handling                   │
├─────────────────────────────────────┤
│  Services (Business Logic)          │
│  - TenantService                    │
│  - ProductService                   │
│  - OrderService                     │
│  - PluginService                    │
├─────────────────────────────────────┤
│  Data Access Layer                  │
│  - pg-promise                       │
│  - Query builders                   │
│  - Connection pooling               │
├─────────────────────────────────────┤
│  External Services                  │
│  - Redis (caching)                  │
│  - AWS S3 (file storage)            │
│  - PostgreSQL (primary database)    │
└─────────────────────────────────────┘
```

### Workers Runtime Stack

```
┌─────────────────────────────────────┐
│      Client (Browser/API)           │
│      (via Cloudflare Edge)          │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   Cloudflare Worker                 │
│   (src/worker.ts via Hono)          │
├─────────────────────────────────────┤
│  Hono Framework & Routes            │
│  - CORS, Security Headers           │
│  - JWT Authentication               │
│  - Tenant Resolution                │
│  - Error Handling                   │
├─────────────────────────────────────┤
│  Services (Business Logic)          │
│  - Identical to Express layer       │
│  - Database abstraction through     │
│    D1Adapter (pg-promise-like API)  │
├─────────────────────────────────────┤
│  Cloudflare Bindings                │
│  - D1 (SQLite)                      │
│  - KV (caching & sessions)          │
│  - R2 (file storage)                │
│  - Environment secrets              │
└─────────────────────────────────────┘
```

### Technology Mapping

| Layer | Express | Workers |
|-------|---------|---------|
| **HTTP Server** | Express.js | Hono.js |
| **Database** | PostgreSQL + pg-promise | D1 SQLite + D1Adapter |
| **Cache** | Redis (optional) | Cloudflare KV |
| **Sessions** | In-memory or Redis | KV with TTL |
| **File Storage** | Local FS or AWS S3 | Cloudflare R2 |
| **Configuration** | .env file | wrangler.toml + secrets |
| **Logging** | console + logger | Worker console |
| **Authentication** | JWT middleware | Hono JWT middleware |

## Migration Path

### Phase 1: Parallel Development

Run both runtimes simultaneously during development:

```bash
# Terminal 1: Express development
npm run dev
# API at http://localhost:3000

# Terminal 2: Workers development
npm run cf:dev
# API at http://localhost:8787
```

Both runtimes share:
- Identical service layer (`src/services/`)
- Identical business logic
- Same database schema
- Same API responses

### Phase 2: Database Migration (PostgreSQL → D1)

#### Step 1: Create D1 Database

```bash
# Create a new D1 database
wrangler d1 create commerce-prod

# Output will show database_id to add to wrangler.toml
```

#### Step 2: Initialize Schema

```bash
# Execute schema migration on D1
wrangler d1 execute commerce-prod --remote < src/db/migrations/001_init_schema.sql
```

#### Step 3: Migrate Data (if needed)

The platform includes a data migration utility for moving data from PostgreSQL to D1:

```bash
# Export data from PostgreSQL
npm run migrate:export -- --source postgres --output data.json

# Import data to D1
npm run migrate:import -- --target d1 --input data.json
```

See [Data Migration Utility](#data-migration-utility) for detailed options.

#### Step 4: Verify Data

```bash
# Connect to D1 database
wrangler d1 execute commerce-prod --remote "SELECT COUNT(*) FROM tenants;"

# Compare with PostgreSQL
psql -U postgres -d mydb -c "SELECT COUNT(*) FROM tenants;"
```

### Phase 3: KV & R2 Setup

#### KV Namespaces (Cache & Sessions)

```bash
# Create CACHE namespace
wrangler kv:namespace create "CACHE"

# Create SESSION namespace
wrangler kv:namespace create "SESSION"

# Update wrangler.toml with the returned IDs
```

#### R2 Bucket (File Storage)

```bash
# Create R2 bucket
wrangler r2 bucket create commerce-assets-prod

# Update wrangler.toml binding
```

### Phase 4: Environment Configuration

#### Update wrangler.toml

```toml
[env.production]
vars = { NODE_ENV = "production" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "commerce-prod"
database_id = "XXXX-XXXX-XXXX"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "kv-cache-id"

[[env.production.kv_namespaces]]
binding = "SESSION"
id = "kv-session-id"

[[env.production.r2_buckets]]
binding = "ASSETS"
bucket_name = "commerce-assets-prod"

[env.production.env]
ADMIN_JWT_SECRET = "your-secret-key"
TENANT_JWT_SECRET = "your-secret-key"
```

#### Set Secrets

```bash
# Use Wrangler to set secrets (won't be in wrangler.toml)
wrangler secret put ADMIN_JWT_SECRET --env production
wrangler secret put TENANT_JWT_SECRET --env production
```

### Phase 5: Deploy to Production

```bash
# Deploy Workers with all bindings
npm run cf:deploy

# Verify deployment
curl https://your-domain.com/health
```

## Performance Considerations

### Request Timeout Limit (30 seconds)

The most critical constraint: Workers requests must complete within 30 seconds.

**Operations to optimize:**
- ✅ Simple CRUD operations
- ✅ Single product/order lookups
- ✅ Tenant list pagination
- ⚠️ Bulk imports/exports (may timeout)
- ⚠️ Complex workflow executions (may timeout)
- ❌ Large file uploads (use multipart/chunked)

**Optimization strategies:**

```typescript
// 1. Use pagination for large result sets
const products = await db.query(
  'SELECT * FROM products WHERE tenant_id = $1 LIMIT $2 OFFSET $3',
  [tenantId, 100, offset]
);

// 2. Defer heavy operations to async jobs
// Instead of: await ctx.plugins.executeAllHooks();
// Do this: await ctx.queue.schedule('execute-hooks', hookData);

// 3. Stream large responses
app.get('/products/export', async (c) => {
  return c.body(streamLargeDataset(), { headers: { 'Content-Type': 'application/json' } });
});

// 4. Use KV for long-lived operations
await kv.put(`operation-${id}`, JSON.stringify({ status: 'pending' }));
// Client polls: GET /api/operations/{id}
// Return: { status: 'pending|processing|completed|failed' }
```

### Memory Constraints

Workers have limited memory (~128 MB shared across all components).

**Best practices:**
- Stream large files instead of loading into memory
- Process data in chunks
- Use KV for temporary storage
- Implement garbage collection strategies

```typescript
// Bad: Loads entire dataset into memory
async function exportAllProducts(tenantId: string) {
  const products = await db.query('SELECT * FROM products WHERE tenant_id = $1', [tenantId]);
  return JSON.stringify(products); // May exceed memory
}

// Good: Stream response
async function exportAllProducts(tenantId: string) {
  return c.body(
    (async function* () {
      let offset = 0;
      while (true) {
        const batch = await db.query(
          'SELECT * FROM products WHERE tenant_id = $1 LIMIT 100 OFFSET $2',
          [tenantId, offset]
        );
        if (batch.length === 0) break;
        for (const product of batch) {
          yield JSON.stringify(product) + '\n';
        }
        offset += 100;
      }
    })()
  );
}
```

### CPU Time Limits

Workers have limited CPU time (~50ms per request on average).

**Optimization tips:**
- Avoid complex computations (crypto, image processing)
- Use native database queries instead of post-processing
- Cache computed results in KV
- Offload heavy tasks to external services

```typescript
// Avoid: Complex in-memory processing
const products = await getProducts();
const filtered = products
  .filter(p => complexValidation(p))
  .map(p => ({
    ...p,
    price: calculateDynamicPrice(p)
  }))
  .sort((a, b) => complexSort(a, b));

// Better: Push logic to database
const products = await db.query(`
  SELECT * FROM products
  WHERE tenant_id = $1
    AND validation_field = true
    AND calculated_price > $2
  ORDER BY priority DESC
  LIMIT 100
`);
```

### D1 SQLite Differences

SQLite has some differences from PostgreSQL that may affect queries:

**Common differences:**

| Feature | PostgreSQL | SQLite |
|---------|------------|--------|
| **JSON functions** | `jsonb_extract_path` | `json_extract` |
| **Array operations** | Native arrays | Need workarounds |
| **Date functions** | `CURRENT_TIMESTAMP` | `datetime('now')` |
| **Schemas** | Supported | Not directly supported |
| **Large objects** | `pg_largeobject` | Limited support |
| **AUTO_INCREMENT** | `SERIAL` | `AUTOINCREMENT` |

**Migration helper:**

```typescript
// Use D1Adapter to abstract differences
// src/config/d1-database.ts provides pg-promise-like API

// Works identically:
await db.any('SELECT * FROM products WHERE tenant_id = $1', [tenantId]);

// Adapter handles:
// - Parameter conversion ($1 → ?)
// - Result formatting
// - Connection pooling
```

### KV Consistency Model

Cloudflare KV uses eventual consistency, not strong consistency.

**Important implications:**

```typescript
// Risk: KV may not immediately return written values
await kv.put('user-cache', JSON.stringify(user));
const cached = await kv.get('user-cache'); // May be null initially

// Solution: For critical operations, use database
const user = await db.one('SELECT * FROM users WHERE id = $1', [userId]);

// KV is best for:
// - Sessions (eventual consistency acceptable)
// - Cache (misses serve from DB)
// - Temporary state
```

### Global Edge Distribution

**Advantages:**
- Requests served from edge closest to user
- Reduced latency
- Automatic geographic routing

**Considerations:**
- D1 database is centralized (in specific region)
- Network hops to DB increase latency
- Use KV for frequently accessed data
- Implement aggressive caching strategies

**Latency optimization:**

```typescript
// 1. Cache tenant config at edge
const tenantConfig = await kv.get(`tenant-config-${tenantSlug}`);
if (!tenantConfig) {
  const config = await db.one('SELECT * FROM tenants WHERE slug = $1', [tenantSlug]);
  await kv.put(`tenant-config-${tenantSlug}`, JSON.stringify(config), {
    expirationTtl: 3600 // 1 hour
  });
}

// 2. Use KV for session data
const session = await kv.get(`session-${sessionId}`);

// 3. Batch database queries
const results = await Promise.all([
  db.one('SELECT * FROM tenants WHERE id = $1', [tenantId]),
  db.any('SELECT * FROM products WHERE tenant_id = $1', [tenantId])
]);
```

## Data Migration Utility

The platform includes comprehensive data migration tools for moving between runtimes and databases.

### Migration Architecture

```
PostgreSQL ──> Migration Utility ──> D1 SQLite
                (npm run migrate:*)
                - Extract schema
                - Export data
                - Transform data types
                - Handle relationships
                - Create indices
```

### Export from PostgreSQL

```bash
# Export all data to JSON format
npm run migrate:export -- \
  --source postgres \
  --output data.json \
  --tenant-id abc123 \
  --include-timestamps

# Options:
# --source postgres        Database source
# --output data.json       Output file
# --tenant-id abc123       Export specific tenant (optional)
# --include-timestamps     Include created_at/updated_at
# --exclude-schema         Skip schema export
# --chunk-size 1000        Batch size for large tables
```

### Import to D1

```bash
# Import data from JSON to D1
npm run migrate:import -- \
  --target d1 \
  --input data.json \
  --skip-duplicates

# Options:
# --target d1              Database target
# --input data.json        Input file
# --skip-duplicates        Skip conflicting records
# --validate               Validate data before import
# --transaction-size 100   Batch size for transactions
```

### Data Transformation

Some data types require transformation between PostgreSQL and SQLite:

```typescript
// src/db/migrations/transform.ts
const transformations = {
  // UUID strings remain same
  uuid: (val) => val,
  
  // JSONB becomes TEXT with JSON
  jsonb: (val) => JSON.stringify(val),
  
  // Arrays become JSON arrays
  array: (val) => JSON.stringify(val),
  
  // Timestamps are ISO strings
  timestamp: (val) => val.toISOString(),
  
  // Booleans (SQLite uses 0/1)
  boolean: (val) => val ? 1 : 0,
  
  // Custom transformations per table
  tenant_users: (row) => ({
    ...row,
    permissions: JSON.stringify(row.permissions)
  })
};
```

### Verify Migration

```bash
# Count records
wrangler d1 execute commerce-prod --remote "SELECT COUNT(*) FROM products;"

# Compare schemas
npm run migrate:verify -- --source postgres --target d1

# Validate data integrity
npm run migrate:validate -- --target d1 --check-relationships
```

### Rollback Strategy

If migration fails, rollback carefully:

```bash
# Option 1: Keep PostgreSQL as fallback
# Update environment to point back to PostgreSQL:
# DB_HOST=localhost DB_NAME=mydb npm run dev

# Option 2: Recreate D1 from scratch
wrangler d1 delete commerce-prod
wrangler d1 create commerce-prod
npm run migrate:import -- --target d1 --input data.json --retry 3
```

## Deployment

### Prerequisites

1. Cloudflare account with Workers enabled
2. Wrangler CLI installed: `npm install -g wrangler`
3. D1 database created and configured
4. KV namespaces created and referenced
5. R2 bucket created (for file storage)

### Local Development

```bash
# Start local Workers development
npm run cf:dev

# Runs Miniflare with:
# - Local D1 SQLite database
# - Local KV namespaces
# - Local R2 storage
# - Hot module reloading

# API available at http://localhost:8787

# Test endpoints
curl http://localhost:8787/health
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/admin/tenants
```

### Staging Deployment

```bash
# Deploy to staging environment
npm run cf:deploy:staging

# Staging configuration from wrangler.toml:
# [env.staging]
# routes = [{ pattern = "staging.example.com/*", zone_name = "example.com" }]

# Test staging
curl https://staging.example.com/health
```

### Production Deployment

```bash
# Deploy to production environment
npm run cf:deploy

# Production configuration from wrangler.toml:
# [env.production]
# routes = [{ pattern = "api.example.com/*", zone_name = "example.com" }]

# Verify production
curl https://api.example.com/health

# Monitor logs
wrangler tail --env production

# View real-time metrics
wrangler analytics --env production
```

### Deployment Checklist

- [ ] All migrations applied to D1: `wrangler d1 execute commerce-prod --remote < src/db/migrations/001_init_schema.sql`
- [ ] KV namespaces created: `wrangler kv:namespace list`
- [ ] R2 bucket created: `wrangler r2 bucket list`
- [ ] Secrets set: `wrangler secret list --env production`
- [ ] wrangler.toml updated with correct IDs
- [ ] Environment variables configured
- [ ] Tests passing: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `tsc --noEmit`

## Troubleshooting

### D1 Connection Issues

**Problem: "D1 not initialized" error**

```
Error: D1 database not found in bindings
```

**Solution:**
1. Verify `wrangler.toml` has D1 binding:
   ```toml
   [[env.development.d1_databases]]
   binding = "DB"
   database_name = "commerce-dev"
   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```
2. Check `src/worker.ts` properly accesses `c.env.DB`
3. Run `wrangler d1 list` to verify database exists

**Problem: "database_id is required" error**

**Solution:**
```bash
# Get the database ID
wrangler d1 info commerce-dev

# Add to wrangler.toml
database_id = "XXXXXXXX"
```

### KV Namespace Issues

**Problem: "KV namespace binding not found" error**

**Solution:**
1. Create namespaces:
   ```bash
   wrangler kv:namespace create CACHE --env development
   wrangler kv:namespace create SESSION --env development
   ```
2. Add to `wrangler.toml`:
   ```toml
   [[env.development.kv_namespaces]]
   binding = "CACHE"
   id = "kv-id"
   ```
3. Verify in `src/types/bindings.ts`:
   ```typescript
   interface Bindings {
     CACHE: KVNamespace;
     SESSION: KVNamespace;
   }
   ```

### Request Timeout (30 seconds)

**Problem: "Worker exceeded CPU time limit" or request takes too long**

**Solutions:**
1. **Paginate results:**
   ```typescript
   // Instead of fetching all products
   const products = await db.any('SELECT * FROM products WHERE tenant_id = $1', [tenantId]);
   
   // Fetch with pagination
   const products = await db.any(
     'SELECT * FROM products WHERE tenant_id = $1 LIMIT $2 OFFSET $3',
     [tenantId, 100, 0]
   );
   ```

2. **Move to background jobs:**
   ```typescript
   // Instead of processing synchronously
   // Use KV to track async operations
   const operationId = crypto.randomUUID();
   await kv.put(`operation-${operationId}`, JSON.stringify({ status: 'pending' }));
   ctx.executionContext.waitUntil(processAsync(operationId));
   return c.json({ operationId, status: 'pending' });
   ```

3. **Optimize database queries:**
   - Add indices to frequently filtered columns
   - Use EXPLAIN to analyze query plans
   - Denormalize if necessary

### Memory Issues

**Problem: "Worker out of memory" or slow performance**

**Solutions:**
1. **Stream large responses:**
   ```typescript
   app.get('/export', async (c) => {
     return c.body(generateLargeStream());
   });
   ```

2. **Process in chunks:**
   ```typescript
   for (let i = 0; i < items.length; i += 1000) {
     const batch = items.slice(i, i + 1000);
     await processBatch(batch);
   }
   ```

3. **Use KV for caching:**
   ```typescript
   const cached = await kv.get('large-data');
   if (!cached) {
     const data = await computeExpensiveData();
     await kv.put('large-data', JSON.stringify(data), { expirationTtl: 3600 });
   }
   ```

### Data Migration Errors

**Problem: "Data validation failed" during migration**

```bash
# Debug migration
npm run migrate:validate -- --target d1 --verbose

# Check for relationship violations
npm run migrate:validate -- --target d1 --check-relationships

# See specific errors
npm run migrate:validate -- --target d1 --detailed-errors
```

### Performance in Production

**Monitor with Wrangler:**
```bash
# View real-time logs
wrangler tail --env production --format json | jq .

# Monitor specific routes
wrangler tail --env production | grep "/api/admin/products"

# Check error rate
wrangler tail --env production --status error
```

## Next Steps

1. **Review [Cloudflare Dev Setup Guide](./cloudflare-dev-setup.md)** for local development workflow
2. **Read [Plugin Development Guide](./plugin-development.md)** for extending functionality
3. **Check [UI Theming Guide](./ui-theming-with-shadcn.md)** for admin dashboard customization
4. **Refer to main [README.md](../README.md)** for general platform overview
5. **See [API Documentation](../API.md)** for endpoint details

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Hono.js Framework](https://hono.dev/)
- [KV Storage API](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [R2 Storage API](https://developers.cloudflare.com/r2/)
