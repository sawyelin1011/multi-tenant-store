# Cloudflare Workers Setup Guide

Complete setup guide for deploying the MTC Platform to Cloudflare Workers with D1, KV, and R2.

## Quick Start

### 1. Install Wrangler
```bash
npm install -g wrangler
```

### 2. Authenticate
```bash
wrangler login
```

### 3. Create Services
```bash
# D1 Database
wrangler d1 create mtc_dev

# KV Namespaces
wrangler kv:namespace create "CACHE" --preview
wrangler kv:namespace create "SESSIONS" --preview

# R2 Buckets
wrangler r2 bucket create mtc-uploads-dev
```

### 4. Update Configuration
Update `wrangler.toml` with your resource IDs from the output above.

### 5. Deploy
```bash
npm run deploy:dev
```

## Project Configuration

### wrangler.toml Structure

```toml
name = "mtc-platform"
main = "src/worker/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

# Build Configuration
[build]
command = "npm run build:worker"
cwd = "./."

[build.upload]
format = "service-worker"
main = "./dist/worker/index.js"

# Triggers
[triggers]
crons = ["0 2 * * *"]  # Daily cleanup
```

### Multiple Environments

The `wrangler.toml` defines three environments:

#### Development (Local Testing)
```bash
npm run dev:worker --env development
```

#### Staging (Pre-Production)
```bash
npm run deploy:staging --env staging
```

#### Production (Live)
```bash
npm run deploy:production --env production
```

Each environment has its own:
- D1 database instance
- KV namespaces (CACHE, SESSIONS)
- R2 bucket
- Environment variables

## Service Configuration

### D1 Database

**What is D1?**
Serverless SQL database based on SQLite, running at Cloudflare's edge.

**Setup:**
```bash
# Create database
wrangler d1 create mtc_dev

# Get database ID from output
# Update wrangler.toml:
# [env.development.d1_databases]
# DB = { database_id = "YOUR_ID" }

# Run migrations
npm run migrate

# Query database
wrangler d1 execute mtc_dev "SELECT * FROM users LIMIT 10"
```

**Usage in Workers:**
```typescript
const db = new D1Client(env.DB);
const users = await db.query('SELECT * FROM users');
```

### KV Namespace

**What is KV?**
Distributed key-value store for caching and session management.

**Setup:**
```bash
# Create namespaces
wrangler kv:namespace create "CACHE" --preview
wrangler kv:namespace create "SESSIONS" --preview

# Get IDs and add to wrangler.toml:
# [env.development.kv_namespaces]
# CACHE = { binding = "CACHE", id = "...", preview_id = "..." }
# SESSIONS = { binding = "SESSIONS", id = "...", preview_id = "..." }
```

**Usage in Workers:**
```typescript
const cache = new KVCache(env.CACHE);
await cache.set('key', value, 3600);  // TTL 1 hour
const value = await cache.get('key');
```

**Features:**
- Automatic expiration (TTL)
- Metadata storage
- Global distribution
- Strong consistency

### R2 Bucket

**What is R2?**
S3-compatible object storage for file uploads and assets.

**Setup:**
```bash
# Create bucket
wrangler r2 bucket create mtc-uploads-dev

# Add to wrangler.toml:
# [env.development.r2_buckets]
# UPLOADS = { binding = "UPLOADS", bucket_name = "mtc-uploads-dev" }
```

**Usage in Workers:**
```typescript
const storage = new R2Storage(env.UPLOADS);
await storage.upload('path/to/file', data, metadata);
const file = await storage.download('path/to/file');
```

**Features:**
- S3-compatible API
- 1 GB per bucket maximum (standard)
- Lifecycle policies
- Versioning available

## Development Workflow

### Local Development

```bash
# Start Express server
npm run dev

# In another terminal, start Workers locally
npm run dev:worker
```

### Testing Changes

**Unit Tests:**
```bash
npm run test:unit
```

**E2E Tests:**
```bash
npm run test:e2e
```

**Full Test Suite:**
```bash
npm run test
```

### Building for Deployment

**Build Everything:**
```bash
npm run build:all
```

**Build Only Workers:**
```bash
npm run build:worker
```

**Build Only Node.js:**
```bash
npm run build:node
```

## Environment Variables

### Managing Secrets

Variables defined in `wrangler.toml` [vars] section are available in code as `env.VARIABLE_NAME`.

**For production secrets:**
1. Don't commit secrets to git
2. Use Cloudflare Dashboard → Workers → Settings → Variables
3. Or use wrangler to set variables

**Set Variable:**
```bash
wrangler secret put SUPER_ADMIN_API_KEY --env production
```

**Environment Variables Available:**
```typescript
interface CloudflareEnv {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  UPLOADS: R2Bucket;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
}
```

## Migrations

### Create Migration

```bash
# Generate migration from schema
npm run db:generate
```

### Run Migrations Locally

```bash
npm run migrate
```

### Run Migrations in Production

```bash
# Apply to D1 (production)
npm run migrate:d1 --env production
```

### Check Migration Status

```bash
# View migrations
wrangler d1 migrations list mtc_prod --env production

# Query database to verify
wrangler d1 execute mtc_prod "SELECT * FROM migrations;"
```

## Deployment

### Manual Deployment

**Development:**
```bash
npm run deploy:dev
```

**Staging:**
```bash
npm run deploy:staging
```

**Production:**
```bash
npm run deploy:production
```

### Automatic Deployment (CI/CD)

Deployments are triggered automatically:
- Push to `develop` → Deploy to development
- Push to `staging` → Deploy to staging
- Push to `main` → Deploy to production

See `.github/workflows/deploy.yml` for CI/CD configuration.

### Verify Deployment

```bash
# Check if worker is deployed
wrangler tail --env production

# Test API endpoint
curl https://api.mtc.io/health

# Check D1 status
wrangler d1 info mtc_prod
```

## Monitoring

### View Logs

```bash
# Real-time logs
wrangler tail

# Production logs
wrangler tail --env production
```

### Dashboard Metrics

1. Go to Cloudflare Dashboard
2. Workers → Your Worker → Metrics
3. View requests, errors, CPU time

### Error Tracking

**Check Error Logs:**
```bash
wrangler tail --env production 2>&1 | grep -i error
```

**Monitor Error Rate:**
- Go to Cloudflare Dashboard
- Workers → Metrics → Error Rate
- Set up alerts for >1% error rate

## Troubleshooting

### Cannot Authenticate with Wrangler
```bash
# Re-authenticate
wrangler logout
wrangler login
```

### D1 Database Connection Error
```bash
# Verify database ID in wrangler.toml is correct
wrangler d1 info <database-id>

# Check migrations
wrangler d1 migrations list <database-id>
```

### KV Not Working
```bash
# List namespaces
wrangler kv:namespace list

# Verify namespace IDs in wrangler.toml
# Preview ID is for `wrangler dev` (local)
# ID is for production
```

### R2 Bucket Not Found
```bash
# List buckets
wrangler r2 bucket list

# Check bucket name in wrangler.toml
```

### Workers Not Deploying
```bash
# Check for build errors
npm run build:worker

# Verify wrangler.toml syntax
wrangler publish --dry-run

# Check account ID
wrangler whoami
```

### High CPU Usage
- Profile code with `console.time()` / `console.timeEnd()`
- Optimize database queries
- Enable caching for expensive operations
- Check for infinite loops

### Performance Issues
```bash
# Check CPU time in Metrics
# > 5000ms CPU indicates need for optimization

# Profile request
wrangler tail --format json | grep '"cpu"'
```

## Advanced Topics

### Custom Domains

In `wrangler.toml`:
```toml
[env.production]
routes = [
  { pattern = "api.mtc.io/*", zone_name = "mtc.io" }
]
```

Then in Cloudflare Dashboard:
1. DNS → Add record for api.mtc.io
2. Workers → Set route

### Database Backups

```bash
# Export data
wrangler d1 execute mtc_prod "SELECT * FROM users;" > backup.sql

# Restore data
wrangler d1 execute mtc_prod < backup.sql
```

### Scheduled Triggers

In `wrangler.toml`:
```toml
[triggers]
crons = ["0 2 * * *"]  # 2 AM UTC daily
```

Handles cleanup, maintenance tasks automatically.

### Rate Limiting

Configured in middleware:
```typescript
app.use(rateLimitMiddleware(60000, 100)); // 100 requests per minute
```

## Performance Optimization

### Database Optimization
- Create indexes on frequently queried fields
- Use prepared statements
- Batch operations where possible

### KV Optimization
- Set appropriate TTLs
- Use consistent key patterns
- Monitor namespace usage

### R2 Optimization
- Enable CDN caching
- Use lifecycle policies for old objects
- Consider compression for text

### Workers Optimization
- Minimize CPU time (<500ms target)
- Cache responses aggressively
- Use edge computing for processing

## Security Best Practices

1. **API Keys**
   - Rotate regularly
   - Use strong random keys
   - Don't commit to git

2. **Database**
   - Use parameterized queries (Drizzle ORM)
   - Enable encryption at rest
   - Regular backups

3. **File Upload**
   - Validate file types
   - Limit file sizes
   - Scan for malware

4. **Rate Limiting**
   - Enable on all endpoints
   - Stricter limits for mutations
   - IP-based limiting

5. **CORS**
   - Whitelist specific origins
   - Avoid `*` in production
   - Set specific methods

## Cost Optimization

### D1
- Stored data billed per GB
- Read operations: First 1M free
- Write operations: First 100k free

### KV
- Read operations: First 10M free
- Write operations: First 1M free
- Namespace limit: 20 free

### R2
- Storage: $0.015/GB
- API requests included
- Download: $0.02/GB

### Workers
- First 100,000 requests/day free
- CPU time included
- Pay per request above free tier

**Cost Reduction Tips:**
- Use KV TTLs to limit stored data
- Archive old data from R2
- Cache responses in KV
- Optimize database queries

## Resources

- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)

## Support & Community

- [Cloudflare Community](https://community.cloudflare.com/c/workers/)
- [GitHub Issues](https://github.com/your-org/mtc-platform/issues)
- [Cloudflare Status](https://www.cloudflarestatus.com/)

---

**Last Updated**: 2024-01-01
