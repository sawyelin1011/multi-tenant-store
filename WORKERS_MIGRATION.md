# Cloudflare Workers Migration Guide

This document describes the migration of the Digital Commerce Platform from Express.js to Cloudflare Workers with Hono.

## Overview

The platform now supports both:
1. **Express.js** - Traditional Node.js runtime (dev/self-hosted)
2. **Cloudflare Workers** - Serverless edge computing runtime (production)

This dual support allows for gradual migration and testing while maintaining compatibility with existing deployments.

## Architecture

### Express Runtime
- Entry point: `src/index.ts`
- Server: Express.js
- Database: PostgreSQL
- Cache: Redis (optional)
- File Storage: Local filesystem or S3

### Workers Runtime
- Entry point: `src/worker.ts`
- Server: Hono.js
- Database: Cloudflare D1 (SQLite)
- Cache: Cloudflare KV
- File Storage: Cloudflare R2

## Key Components

### 1. Bindings Contract (`src/types/bindings.ts`)

Defines typed contracts for Cloudflare Worker bindings:
```typescript
interface Bindings {
  DB: D1Database;           // SQLite database
  CACHE: KVNamespace;       // Cache storage
  SESSION: KVNamespace;     // Session storage
  ASSETS: R2Bucket;         // File storage
  ADMIN_JWT_SECRET: string; // Admin JWT secret
  TENANT_JWT_SECRET: string; // Tenant JWT secret
}
```

### 2. Configuration (`src/config/bindings.ts`, `src/config/d1-database.ts`)

- `bindings.ts`: Manages Worker bindings initialization
- `d1-database.ts`: D1Adapter provides pg-promise-like API for D1 database

### 3. Middleware

New Worker-compatible middleware:
- `src/middleware/worker-auth.ts` - JWT verification for Hono
- `src/middleware/worker-tenant-resolver.ts` - Tenant resolution from URL
- `src/middleware/worker-error-handler.ts` - Error handling for Workers

### 4. Resource Adapters

- `src/utils/kv-storage.ts` - KV namespace utilities (SessionStore, CacheStore)
- `src/utils/r2-storage.ts` - R2 bucket utilities (AssetStore)
- `src/utils/worker-logger.ts` - Worker-compatible logging

### 5. Routes

New Worker route files:
- `src/routes/worker-admin.ts` - Admin routes (tenant management)
- `src/routes/worker-tenant.ts` - Tenant admin routes (products, workflows, etc.)
- `src/routes/worker-storefront.ts` - Storefront routes (public product listing)

### 6. Worker Entry Point (`src/worker.ts`)

Main Hono application that:
- Initializes bindings
- Registers middleware (CORS, security headers, logger)
- Mounts all route handlers
- Handles errors globally
- Exports fetch handler for Workers runtime

## Configuration Files

### wrangler.toml

Defines Cloudflare Workers configuration with three environments:

```toml
# Development
[env.development]
vars = { NODE_ENV = "development" }
[[env.development.d1_databases]]
binding = "DB"
database_name = "commerce-dev"

# Staging
[env.staging]
routes = [{ pattern = "staging.example.com/*", zone_name = "example.com" }]

# Production
[env.production]
routes = [{ pattern = "api.example.com/*", zone_name = "example.com" }]
```

Each environment includes:
- D1 database binding
- KV namespaces (CACHE, SESSION)
- R2 bucket (ASSETS)
- Environment variables (secrets)

## Development Workflow

### Local Express Development
```bash
# Start Express server
npm run dev
# API available at http://localhost:3000
```

### Local Workers Development
```bash
# Start Miniflare
npm run cf:dev
# API available at http://localhost:8787
```

### Building
```bash
# Compile TypeScript
npm run build
# Output: dist/
```

## Deployment

### Deploy to Staging
```bash
npm run cf:deploy:staging
```

### Deploy to Production
```bash
npm run cf:deploy
```

### Database Migrations

For Workers deployment with D1:
```bash
# Execute migration on remote D1
wrangler d1 execute commerce-prod --remote < src/db/migrations/001_init_schema.sql

# Or create locally first
wrangler d1 execute commerce-prod --local < src/db/migrations/001_init_schema.sql
```

## API Compatibility

Both runtimes provide identical API surfaces:

### Health Check
```
GET /health
```

### Admin Routes
```
POST   /api/admin/tenants
GET    /api/admin/tenants
GET    /api/admin/tenants/:id
PUT    /api/admin/tenants/:id
DELETE /api/admin/tenants/:id
```

### Tenant Admin Routes
```
POST   /api/{tenant_slug}/admin/product-types
GET    /api/{tenant_slug}/admin/product-types
GET    /api/{tenant_slug}/admin/product-types/:id
PUT    /api/{tenant_slug}/admin/product-types/:id
DELETE /api/{tenant_slug}/admin/product-types/:id

POST   /api/{tenant_slug}/admin/products
GET    /api/{tenant_slug}/admin/products
... (and all other tenant admin endpoints)
```

### Storefront Routes
```
GET /api/{tenant_slug}/storefront/products
GET /api/{tenant_slug}/storefront/products/:id
```

## Database Migration Path

### From PostgreSQL to D1

1. **Create D1 database**
```bash
wrangler d1 create commerce-prod
```

2. **Initialize schema**
```bash
wrangler d1 execute commerce-prod --remote < src/db/migrations/001_init_schema.sql
```

3. **Migrate data** (if needed)
```bash
# Export from PostgreSQL
pg_dump --data-only mydb > data.sql

# Import to D1 (convert syntax if needed)
wrangler d1 execute commerce-prod --remote < data.sql
```

4. **Update connection strings**
- Remove PostgreSQL connection string
- Update services to use D1Adapter

## Breaking Changes

1. **Database**: PostgreSQL → SQLite D1
   - SQL syntax differences (minor)
   - Some functions may not be available
   - Recommend testing queries

2. **File Storage**: Local filesystem / S3 → R2
   - Different API
   - No directory traversal
   - Flat key structure

3. **Caching**: Redis → KV
   - Different API
   - Key expiration vs TTL
   - Eventual consistency

4. **Sessions**: Session storage → KV
   - Session format may need adjustment
   - TTL-based cleanup

## Performance Considerations

### Workers Advantages
- Global edge deployment (low latency)
- Instant cold starts
- Auto-scaling
- Pay per request

### Workers Limitations
- 30-second request timeout
- Large file uploads may need chunking
- Limited CPU time per request
- SQLite query complexity limits

## Monitoring & Debugging

### Local Development
```bash
# View Wrangler logs
wrangler tail

# Debug mode
npm run cf:dev -- --debug
```

### Remote Monitoring
```bash
# View live logs from Cloudflare Workers
wrangler tail --env production
```

## Testing

### Local Testing
```bash
# Test health endpoint
curl http://localhost:8787/health

# Test admin routes
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/admin/tenants
```

### Production Parity Testing
```bash
# Test staging deployment
curl https://staging.example.com/health
```

## Troubleshooting

### D1 Connection Issues
- Verify database_id in wrangler.toml
- Check binding name matches code (DB)
- Ensure D1 database is in same account

### KV Namespace Issues
- Verify namespace ID matches
- Check binding names (CACHE, SESSION)
- Ensure namespaces exist in account

### R2 Bucket Issues
- Verify bucket exists in account
- Check CORS settings if frontend access needed
- Ensure binding name matches (ASSETS)

### Timeout Issues
- Reduce request processing time
- Implement request streaming
- Use batch operations where possible

## Future Enhancements

1. **Durable Objects** - For stateful operations (sessions, locks)
2. **Queue** - For async job processing
3. **Email Routing** - For email-based workflows
4. **Analytics Engine** - For metrics collection
5. **Hyperdrive** - For persistent database connections

## Support & Resources

- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
