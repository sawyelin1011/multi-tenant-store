# Deployment Guide

Complete guide for deploying the MTC Platform to Cloudflare Workers with D1, KV, and R2.

## Prerequisites

1. **Cloudflare Account** with Paid Plan (for Workers)
2. **Node.js 18+** installed locally
3. **npm 9+** installed
4. **Git** configured with SSH keys
5. **Wrangler CLI** (`npm install -g wrangler`)

## Local Setup

### 1. Clone Repository
```bash
git clone git@github.com:your-org/mtc-platform.git
cd mtc-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

### 4. Build Locally
```bash
npm run build:all
```

### 5. Run Locally
```bash
# Node.js server
npm run dev

# Or Cloudflare Workers
npm run dev:worker
```

## Cloudflare Account Setup

### 1. Create Cloudflare D1 Database

```bash
# Login to Cloudflare
wrangler login

# Create development database
wrangler d1 create mtc_dev

# Create staging database
wrangler d1 create mtc_staging

# Create production database
wrangler d1 create mtc_prod
```

Record the database IDs and update `wrangler.toml`:
```toml
[env.development.d1_databases]
DB = { database_id = "YOUR_DEV_ID", database_name = "mtc_dev" }
```

### 2. Create KV Namespaces

```bash
# Development
wrangler kv:namespace create "CACHE" --preview
wrangler kv:namespace create "SESSIONS" --preview

# Staging
wrangler kv:namespace create "CACHE" --env staging --preview
wrangler kv:namespace create "SESSIONS" --env staging --preview

# Production
wrangler kv:namespace create "CACHE" --env production
wrangler kv:namespace create "SESSIONS" --env production
```

Record namespace IDs and update `wrangler.toml`.

### 3. Create R2 Buckets

```bash
# Development
wrangler r2 bucket create mtc-uploads-dev

# Staging
wrangler r2 bucket create mtc-uploads-staging

# Production
wrangler r2 bucket create mtc-uploads
```

Update `wrangler.toml` with bucket names.

### 4. Configure Domain

In Cloudflare Dashboard:
1. Go to Workers Routes
2. Add routes for your domains:
   - Dev: `api.dev.local/*`
   - Staging: `api.staging.mtc.local/*`
   - Production: `api.mtc.io/*`

## Database Migrations

### 1. Run Migrations Locally

```bash
# Create/update SQLite database
npm run migrate
```

### 2. Deploy Migrations to D1

```bash
# Development
npm run migrate:d1 --env development

# Staging
npm run migrate:d1 --env staging

# Production
npm run migrate:d1 --env production
```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

```
CLOUDFLARE_API_TOKEN: <your-api-token>
CLOUDFLARE_ACCOUNT_ID: <your-account-id>
```

To get these:
1. Go to Cloudflare Dashboard → Profile → API Tokens
2. Create token with Workers Admin Read, Write permissions
3. Also get Account ID from Workers dashboard

## Deployment Process

### 1. Development Deployment

Automatic on push to `develop` branch:
```bash
# Or manually
npm run deploy:dev
```

### 2. Staging Deployment

Manual trigger or push to `staging` branch:
```bash
npm run deploy:staging
```

### 3. Production Deployment

Automatic on push to `main` branch with tests:
```bash
# Manual
npm run deploy:production
```

## Manual Deployment Steps

### Build
```bash
npm run build:all
```

### Test
```bash
npm run test
```

### Deploy to Specific Environment
```bash
# Development
wrangler deploy --env development

# Staging
wrangler deploy --env staging

# Production
wrangler deploy --env production
```

## Environment Configuration

### Development Environment

`.wrangler.toml` for local development:
```toml
[env.development]
name = "mtc-platform-dev"
vars = { ENVIRONMENT = "development", LOG_LEVEL = "debug" }

[env.development.d1_databases]
DB = { database_id = "dev-id", database_name = "mtc_dev" }

[env.development.kv_namespaces]
CACHE = { binding = "CACHE", id = "dev-cache-id", preview_id = "dev-cache-preview" }
```

### Environment Variables

Set via Cloudflare Dashboard or `wrangler.toml`:

**Development:**
```
ENVIRONMENT=development
LOG_LEVEL=debug
SUPER_ADMIN_API_KEY=sk_test_admin123456
```

**Staging:**
```
ENVIRONMENT=staging
LOG_LEVEL=info
SUPER_ADMIN_API_KEY=<random-key>
```

**Production:**
```
ENVIRONMENT=production
LOG_LEVEL=warn
SUPER_ADMIN_API_KEY=<random-key>
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://api.mtc.io/health
```

Should return:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Health check passed",
  "data": { "status": "ok" }
}
```

### 2. API Test
```bash
curl -H "x-api-key: your-api-key" \
  https://api.mtc.io/api/users
```

### 3. Database Connectivity
Check Cloudflare Dashboard → D1 → Database → Query Editor

### 4. KV Verification
```bash
# Check KV data in Dashboard
# Storage & Databases → KV
```

### 5. R2 Verification
```bash
# Check files uploaded
# Storage & Databases → R2
```

## Monitoring & Logs

### Wrangler Logs
```bash
# Real-time logs
wrangler tail

# For specific environment
wrangler tail --env production
```

### Cloudflare Dashboard
1. Workers → Your Worker → Logs
2. View real-time logs and errors

### Performance Metrics
1. Workers → Metrics
2. Track requests, errors, CPU time

## Rollback

### Rollback to Previous Version

```bash
# Get previous deployment
wrangler deployments list

# Rollback
wrangler rollback

# Or manual deployment of specific commit
git checkout <previous-commit>
npm run deploy:production
```

## Scaling & Performance

### D1 Database Optimization
- Create indexes on frequently queried fields
- Monitor query performance in Dashboard
- Consider replication for high-traffic

### KV Optimization
- Set appropriate TTLs (expires)
- Use consistent key patterns
- Monitor KV requests in Dashboard

### R2 Optimization
- Enable Cloudflare CDN caching
- Set lifecycle rules for old objects
- Monitor egress costs

## Security Checklist

- [ ] SSL/TLS enabled on all domains
- [ ] API keys rotated in production
- [ ] Rate limiting configured
- [ ] CORS headers validated
- [ ] Input validation enabled
- [ ] Database backups enabled
- [ ] Secrets not in version control
- [ ] Access logs enabled
- [ ] DDoS protection enabled

## Troubleshooting

### Deployment Fails
```bash
# Check build
npm run build:all

# Verify wrangler.toml
wrangler publish --dry-run

# Check authentication
wrangler whoami
```

### Database Connection Error
```bash
# Verify D1 database ID in wrangler.toml
wrangler d1 info <database-id>

# Check migrations
wrangler d1 migrations list
```

### KV Errors
```bash
# List namespaces
wrangler kv:namespace list

# Get namespace info
wrangler kv:namespace list --preview
```

### High Latency
- Check database indexes
- Monitor CPU usage in Dashboard
- Enable caching for frequently accessed data
- Consider edge caching

### Out of Memory
- Check for memory leaks in code
- Optimize database queries
- Reduce batch sizes
- Monitor Workers dashboard metrics

## Cost Optimization

### D1 Database
- Use appropriate storage tier
- Monitor stored bytes
- Clean up old data with lifecycle policies

### KV Storage
- Set reasonable TTLs
- Clean up expired entries
- Monitor stored items

### R2 Storage
- Monitor object count
- Set lifecycle policies for old uploads
- Use CDN caching

### Workers
- Monitor execution time (CPU)
- Optimize code for speed
- Cache responses where possible

## Scheduled Maintenance

### Daily (Automatic)
- Cache cleanup via scheduled trigger (2 AM UTC)
- Database optimization

### Weekly (Manual)
```bash
# Check database integrity
wrangler d1 execute mtc_prod "PRAGMA integrity_check;"

# Analyze database
wrangler d1 execute mtc_prod "ANALYZE;"
```

### Monthly (Manual)
- Review and rotate API keys
- Audit access logs
- Review cost reports
- Update dependencies

## Disaster Recovery

### Backup Strategy
1. Daily automated D1 backups
2. R2 objects with versioning
3. Git repository as code backup

### Restore from Backup
```bash
# Restore D1 from backup
wrangler d1 restore <database-id> <timestamp>

# Restore R2 object version
# Via Dashboard: Storage → R2 → Object versions
```

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)

## Support

For issues:
1. Check Cloudflare Status Page
2. Review Worker Logs
3. Check GitHub Issues
4. Contact Cloudflare Support

---

**Last Updated:** 2024-01-01
