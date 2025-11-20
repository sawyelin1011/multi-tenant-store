# Cloudflare Workers Development Setup Guide

Complete guide to setting up local development for the Cloudflare Workers runtime with Miniflare, environment configuration, testing, and debugging.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Local Development](#local-development)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [CLI Reference](#cli-reference)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Node.js 18+ (LTS recommended)
- npm 9+
- Git
- ~500MB free disk space

### Cloudflare Account

1. Create free account at [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Get your **Account ID**: Settings → Account Details
3. Create an **API Token**: Settings → API Tokens → "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Grant permissions for D1, KV, R2

### Install Wrangler CLI

```bash
# Global installation
npm install -g wrangler

# Or use npx (no installation)
npx wrangler --version

# Verify installation
wrangler --version
# Output: wrangler 3.26.0
```

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd mtc-platform
```

### 2. Install Dependencies

```bash
npm install

# Verify build tools installed
which wrangler
which miniflare
```

### 3. Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Verifies credentials by opening browser
# Updates ~/.wrangler/config.toml with token

# Verify authentication
wrangler whoami
# Output: Account: your-account-name
```

### 4. Create Local D1 Database

```bash
# Create local development D1 database
wrangler d1 create commerce-dev --local

# Output includes database_id
# Add to wrangler.toml [env.development] section

# Initialize schema
wrangler d1 execute commerce-dev --local < src/db/migrations/001_init_schema.sql
```

### 5. Create KV Namespaces

```bash
# Create local KV namespaces for development
wrangler kv:namespace create CACHE --local
wrangler kv:namespace create SESSION --local

# Creates .wrangler/state/ directory
# Add IDs to wrangler.toml
```

### 6. Create R2 Bucket (Optional)

```bash
# Create local R2 bucket for development
wrangler r2 bucket create commerce-assets-dev --local

# Creates .wrangler/state/r2/ directory
```

### 7. Setup Environment Variables

```bash
# Copy environment template
cp .env.example.worker .env.worker

# Edit with your values
nano .env.worker

# Required variables:
# ADMIN_JWT_SECRET=your-admin-secret-key
# TENANT_JWT_SECRET=your-tenant-secret-key
# NODE_ENV=development
```

### 8. Verify Setup

```bash
# Check all tools are working
npm run build
npm run lint

# Start development server (will fail without proper config)
npm run cf:dev

# In another terminal, test:
curl http://localhost:8787/health
# Expected: { "status": "ok" }
```

## Configuration

### wrangler.toml Structure

```toml
name = "mtc-platform"
main = "src/worker.ts"
type = "service"
compatibility_date = "2024-01-01"

# Development environment (local & miniflare)
[env.development]
vars = { NODE_ENV = "development" }

[[env.development.d1_databases]]
binding = "DB"
database_name = "commerce-dev"
database_id = "your-local-db-id"

[[env.development.kv_namespaces]]
binding = "CACHE"
id = "your-local-cache-id"

[[env.development.kv_namespaces]]
binding = "SESSION"
id = "your-local-session-id"

[[env.development.r2_buckets]]
binding = "ASSETS"
bucket_name = "commerce-assets-dev"

[env.development.env]
ADMIN_JWT_SECRET = "dev-admin-secret"
TENANT_JWT_SECRET = "dev-tenant-secret"

# Staging environment
[env.staging]
# ... staging-specific config ...

# Production environment
[env.production]
# ... production-specific config ...
```

### Environment Variables

Create `.env.worker` in project root:

```bash
# Authentication
ADMIN_JWT_SECRET=your-super-admin-jwt-secret-key-min-32-chars
TENANT_JWT_SECRET=your-tenant-jwt-secret-key-min-32-chars

# Runtime
NODE_ENV=development
LOG_LEVEL=debug

# Upload limits
MAX_FILE_SIZE=104857600  # 100MB

# Database (if using PostgreSQL alongside)
DATABASE_URL=postgresql://user:password@localhost:5432/commerce_dev

# Redis (optional, for sessions)
REDIS_URL=redis://localhost:6379

# API Keys (if needed)
STRIPE_API_KEY=sk_test_xxxxx
SENDGRID_API_KEY=SG.xxxxx
```

### Secrets Management

For production secrets, use Wrangler:

```bash
# Set secrets for development (stores in .wrangler/secrets)
wrangler secret put ADMIN_JWT_SECRET --env development
wrangler secret put TENANT_JWT_SECRET --env development

# Set secrets for production (stores in Cloudflare)
wrangler secret put ADMIN_JWT_SECRET --env production
wrangler secret put TENANT_JWT_SECRET --env production

# List secrets for an environment
wrangler secret list --env development

# Delete a secret
wrangler secret delete ADMIN_JWT_SECRET --env production
```

## Local Development

### Start Development Server

```bash
# Terminal 1: Start Workers dev server
npm run cf:dev

# Output:
# ⛅ wrangler 3.26.0
# ✓ Using D1 database commerce-dev
# ✓ Using KV namespace CACHE
# ✓ Using KV namespace SESSION
# ✓ Using R2 bucket commerce-assets-dev
# ▲ [dev] GET http://localhost:8787
```

The development server runs on `http://localhost:8787` and includes:

- **Hot module reloading**: Changes automatically reflect (no restart needed)
- **Local D1 SQLite**: In `.wrangler/state/`
- **Local KV storage**: In `.wrangler/state/`
- **Local R2 storage**: In `.wrangler/state/r2/`
- **Miniflare simulation**: Close to production Workers environment

### Develop Express Alongside

```bash
# Terminal 2: Start Express for comparison
npm run dev

# Express runs on http://localhost:3000
# Workers runs on http://localhost:8787

# Compare identical API responses:
curl http://localhost:3000/api/admin/tenants
curl http://localhost:8787/api/admin/tenants
```

### File Structure for Workers Development

```
src/
├── worker.ts                    # Entry point for Workers
├── config/
│   ├── bindings.ts             # Worker bindings initialization
│   └── d1-database.ts          # D1 adapter (pg-promise-like)
├── middleware/
│   ├── worker-auth.ts          # JWT verification for Hono
│   ├── worker-tenant-resolver.ts # Tenant extraction
│   └── worker-error-handler.ts # Error handling for Hono
├── utils/
│   ├── kv-storage.ts           # KV utilities
│   ├── r2-storage.ts           # R2 utilities
│   └── worker-logger.ts        # Worker-compatible logging
├── routes/
│   ├── worker-admin.ts         # Admin routes
│   ├── worker-tenant.ts        # Tenant admin routes
│   └── worker-storefront.ts    # Storefront routes
└── services/                    # (Shared with Express)
```

### Making Changes

**Editing service code:**
```bash
# Changes to src/services/ automatically reload
# No restart needed
vim src/services/productService.ts
# Refresh browser/API client - change reflected immediately
```

**Editing route code:**
```bash
# Changes to src/routes/ automatically reload
vim src/routes/worker-tenant.ts
# Refresh browser - change reflected immediately
```

**Editing middleware:**
```bash
# Changes to src/middleware/ require restart
vim src/middleware/worker-auth.ts
# Restart: Ctrl+C and npm run cf:dev
```

**Changing wrangler.toml:**
```bash
# Changes to bindings require restart
vim wrangler.toml
# Restart: Ctrl+C and npm run cf:dev
```

## Testing

### Unit Tests with Vitest

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/services/__tests__/productService.test.ts

# Run with coverage
npm test -- --coverage

# Configuration in vitest.config.ts
```

### Integration Tests

```bash
# Test against local Workers
npm test -- --env local

# Test against staging
npm test -- --env staging

# Example test:
describe('Product API', () => {
  it('should list products for tenant', async () => {
    const response = await fetch('http://localhost:8787/api/mystore/admin/products', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();
  });
});
```

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:8787/health

# Create test tenant
curl -X POST http://localhost:8787/api/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Store",
    "slug": "test-store"
  }'

# Get tenant
curl http://localhost:8787/api/test-store/admin/product-types \
  -H "Authorization: Bearer $TENANT_TOKEN"

# Test file upload (to R2)
curl -X POST http://localhost:8787/api/test-store/admin/assets/upload \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -F "file=@/path/to/file.zip"
```

### Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test
ab -n 1000 -c 10 http://localhost:8787/health

# Install artillery for advanced load testing
npm install -g artillery

# Create load test config (artillery.yml)
config:
  target: http://localhost:8787
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"

scenarios:
  - name: "Get Products"
    flow:
      - get:
          url: /api/test-store/storefront/products

# Run test
artillery run artillery.yml
```

## Debugging

### Debug Mode

```bash
# Start with debug logging
DEBUG=* npm run cf:dev

# More verbose logging
npm run cf:dev -- --debug

# View debug output
wrangler tail --env development
```

### Chrome DevTools Debugging

```bash
# Start with inspector enabled
NODE_OPTIONS=--inspect npm run cf:dev

# Open Chrome DevTools
# chrome://inspect
# Click "Inspect" next to Worker
```

### Wrangler Logs

```bash
# View local development logs
wrangler tail --env development

# View with filtering
wrangler tail --env development | grep "error"

# View metrics
wrangler analytics --env development
```

### Database Debugging

```bash
# Connect to local D1 database
wrangler d1 execute commerce-dev --local

# Run queries interactively
SELECT * FROM tenants;
SELECT COUNT(*) FROM products WHERE tenant_id = 'xxx';

# Or execute file
wrangler d1 execute commerce-dev --local < query.sql

# Export database data
wrangler d1 execute commerce-dev --local ".dump" > backup.sql

# Inspect .wrangler/state/ directly
ls -la .wrangler/state/
file .wrangler/state/d1/ # SQLite database file
```

### Memory Profiling

```typescript
// src/middleware/debug-middleware.ts
export function debugMemory(c: Context, next: Next) {
  const before = process.memoryUsage();
  
  await next();
  
  const after = process.memoryUsage();
  const used = after.heapUsed - before.heapUsed;
  
  console.log(`Memory used: ${Math.round(used / 1024 / 1024)}MB`);
  c.res.headers.set('X-Memory-Used', `${used}`);
}
```

### CPU Profiling

```bash
# Generate CPU profile
node --prof src/worker.ts

# Process profile
node --prof-process isolate-*.log > profile.txt

# View in DevTools
# chrome://devtools/js-profiler
```

## CLI Reference

### Wrangler Commands

```bash
# Worker management
wrangler dev --env development         # Start local dev server
wrangler deploy --env production       # Deploy to production
wrangler tail --env production         # View live logs
wrangler delete --env production       # Delete Worker

# D1 Database
wrangler d1 create commerce-prod       # Create database
wrangler d1 list                        # List databases
wrangler d1 info commerce-prod         # Get database info
wrangler d1 execute commerce-prod --remote < migration.sql  # Run migrations
wrangler d1 backup create commerce-prod  # Create backup

# KV Namespaces
wrangler kv:namespace list             # List KV namespaces
wrangler kv:namespace create CACHE     # Create namespace
wrangler kv:namespace delete CACHE     # Delete namespace
wrangler kv:key list --namespace-id=x  # List keys

# R2 Buckets
wrangler r2 bucket list                # List buckets
wrangler r2 bucket create assets       # Create bucket
wrangler r2 bucket delete assets       # Delete bucket
wrangler r2 object list assets         # List objects

# Secrets
wrangler secret list --env production  # List secrets
wrangler secret put ADMIN_JWT_SECRET   # Set secret
wrangler secret delete ADMIN_JWT_SECRET # Delete secret

# Monitoring
wrangler analytics --env production    # View metrics
wrangler logs --env production         # Show logs
```

### npm Scripts

```bash
# Development
npm run cf:dev                  # Start local development server
npm run dev                     # Start Express (comparison)

# Building
npm run build                   # Compile TypeScript

# Deployment
npm run cf:deploy              # Deploy to production
npm run cf:deploy:staging      # Deploy to staging

# Code quality
npm run lint                   # Run ESLint
npm run format                 # Format with Prettier
npm test                       # Run tests

# Database
npm run migrate                # Run migrations (Express)
npm run migrate:export         # Export PostgreSQL data
npm run migrate:import         # Import to D1
```

## Troubleshooting

### Installation Issues

**Problem: "wrangler: command not found"**

```bash
# Solution 1: Install globally
npm install -g wrangler

# Solution 2: Use npx
npx wrangler --version

# Solution 3: Use local installation
./node_modules/.bin/wrangler --version
```

**Problem: "Node version too old"**

```bash
# Check version
node --version

# Install Node 18+ (using nvm)
nvm install 18
nvm use 18
```

### Miniflare Issues

**Problem: "Port 8787 already in use"**

```bash
# Solution 1: Use different port
npm run cf:dev -- --port 8788

# Solution 2: Kill process on port
lsof -ti:8787 | xargs kill -9

# Solution 3: Use different environment
# Can run multiple instances with different env ports
PORT=8788 npm run cf:dev
```

**Problem: "D1 database not found"**

```bash
# Verify database exists
wrangler d1 list

# Create if missing
wrangler d1 create commerce-dev --local

# Check wrangler.toml has correct database_id
grep database_id wrangler.toml
```

### Authentication Issues

**Problem: "Authentication required" when running wrangler**

```bash
# Re-authenticate
wrangler logout
wrangler login

# Verify authentication
wrangler whoami

# Check token location
cat ~/.wrangler/config.toml
```

**Problem: JWT token validation fails**

```bash
# Check secrets are set
wrangler secret list --env development

# Verify token matches secret
# Make sure ADMIN_JWT_SECRET and TENANT_JWT_SECRET are correct

# Generate test token
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'test', role: 'admin' },
  'dev-admin-secret',
  { expiresIn: '1h' }
);
console.log(token);
"
```

### Performance Issues

**Problem: Development server is slow**

```bash
# Check memory usage
wrangler tail --env development | grep -i memory

# Reduce logging verbosity
NODE_DEBUG="" npm run cf:dev

# Clear cache
rm -rf .wrangler/state/
npm run cf:dev
```

**Problem: Hot reload not working**

```bash
# Restart development server
npm run cf:dev

# Check file change detection
# Editor might not be triggering file system events

# Manual workaround: edit and save with delay
vim src/services/productService.ts
sleep 1 && npm run cf:dev
```

### Database Issues

**Problem: "Queries fail in Workers but work in Express"**

SQLite has subtle differences from PostgreSQL:

```typescript
// PostgreSQL - works
SELECT * FROM products WHERE tags @> '["gaming"]'

// SQLite - need different syntax
SELECT * FROM products WHERE json_array_length(tags) > 0

// Use abstraction layer (D1Adapter) to handle differences
```

**Problem: Data migration incomplete**

```bash
# Check migration status
wrangler d1 execute commerce-dev --local "SELECT COUNT(*) FROM tenants;"

# Re-run migration
wrangler d1 execute commerce-dev --local < src/db/migrations/001_init_schema.sql

# View migration errors
npm run migrate:validate -- --target d1 --verbose
```

### Debugging Crashes

**Problem: Worker crashes with cryptic error**

```bash
# Get detailed logs
wrangler tail --env development --format json | jq .

# Enable all debug output
DEBUG=* npm run cf:dev

# Check browser console for errors
# Open http://localhost:8787 in browser
# Check DevTools Console tab
```

**Problem: Memory leak in development**

```bash
# Monitor memory over time
npm run cf:dev 2>&1 | grep -i "memory\|heap"

# Force garbage collection
# Add to code: if (global.gc) global.gc();

# Run with explicit memory flag
npm run cf:dev -- --max-old-space-size=4096
```

## Next Steps

1. **Review [Plugin Development Guide](./plugin-development.md)** to build custom plugins
2. **Check [Cloudflare Migration Guide](./cloudflare-migration.md)** for deployment details
3. **Read [UI Theming Guide](./ui-theming-with-shadcn.md)** for customizing admin dashboard
4. **See [API Documentation](../API.md)** for endpoint reference

## Additional Resources

- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Miniflare GitHub](https://github.com/cloudflare/miniflare)
- [Vitest Documentation](https://vitest.dev/)
- [Hono.js Framework](https://hono.dev/)
