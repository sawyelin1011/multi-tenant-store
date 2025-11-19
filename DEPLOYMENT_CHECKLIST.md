# Cloudflare Workers Deployment Checklist

This checklist helps you deploy the Digital Commerce Platform to Cloudflare Workers after the scaffolding implementation.

## Pre-Deployment Setup

### 1. Cloudflare Account Setup
- [ ] Create Cloudflare account at https://dash.cloudflare.com
- [ ] Enable Workers (free tier available)
- [ ] Note your account ID (Settings > Account > Account ID)
- [ ] Create API token with Workers permissions

### 2. Update wrangler.toml
```bash
# Add your account ID
account_id = "your-account-id"

# Update environment routes if needed
[env.staging]
routes = [{ pattern = "staging.yourdomain.com/*", zone_name = "yourdomain.com" }]

[env.production]
routes = [{ pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }]
```

### 3. Configure Secrets
```bash
# For development
wrangler secret put ADMIN_JWT_SECRET --env development
wrangler secret put TENANT_JWT_SECRET --env development

# For staging
wrangler secret put ADMIN_JWT_SECRET --env staging
wrangler secret put TENANT_JWT_SECRET --env staging

# For production
wrangler secret put ADMIN_JWT_SECRET --env production
wrangler secret put TENANT_JWT_SECRET --env production
```

## Database Setup

### 1. Create D1 Databases
```bash
# Create development database
wrangler d1 create commerce-dev

# Create staging database
wrangler d1 create commerce-staging

# Create production database
wrangler d1 create commerce-prod
```

### 2. Update wrangler.toml with Database IDs
After creation, update the `database_id` values in wrangler.toml:
```toml
[[env.development.d1_databases]]
binding = "DB"
database_name = "commerce-dev"
database_id = "<database_id_from_output>"
```

### 3. Initialize Database Schema
```bash
# Development
wrangler d1 execute commerce-dev --local < src/db/migrations/001_init_schema.sql

# Staging (when ready)
wrangler d1 execute commerce-staging --remote < src/db/migrations/001_init_schema.sql

# Production (when ready)
wrangler d1 execute commerce-prod --remote < src/db/migrations/001_init_schema.sql
```

### 4. Migrate Data (if from PostgreSQL)
```bash
# Export from PostgreSQL
pg_dump --data-only postgres://user:pass@host/dbname > data.sql

# Import to D1 (convert SQL syntax if needed)
wrangler d1 execute commerce-prod --remote < data.sql
```

## KV Namespace Setup

### 1. Create KV Namespaces
```bash
# Development
wrangler kv:namespace create "CACHE" --preview
wrangler kv:namespace create "SESSION" --preview

# Production
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "SESSION"

# Staging
wrangler kv:namespace create "CACHE" --env staging
wrangler kv:namespace create "SESSION" --env staging
```

### 2. Update wrangler.toml with Namespace IDs
```toml
[[env.production.kv_namespaces]]
binding = "CACHE"
id = "<namespace_id>"

[[env.production.kv_namespaces]]
binding = "SESSION"
id = "<namespace_id>"
```

## R2 Bucket Setup

### 1. Create R2 Buckets
```bash
# Development
wrangler r2 bucket create commerce-assets-dev

# Staging
wrangler r2 bucket create commerce-assets-staging

# Production
wrangler r2 bucket create commerce-assets-prod
```

### 2. Update wrangler.toml with Bucket Names
```toml
[[env.production.r2_buckets]]
binding = "ASSETS"
bucket_name = "commerce-assets-prod"
```

### 3. Configure CORS (if needed for direct access)
```bash
wrangler r2 bucket cors set commerce-assets-prod --file cors-config.json
```

## Local Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Build TypeScript
```bash
npm run build
```

### 3. Start Local Development
```bash
npm run cf:dev

# API available at http://localhost:8787
```

### 4. Test Endpoints
```bash
# Health check
curl http://localhost:8787/health

# Admin routes (requires token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/admin/tenants

# Storefront routes (public)
curl http://localhost:8787/api/test-tenant/storefront/products
```

### 5. Verify Database Connectivity
- [ ] KV read/write operations working
- [ ] D1 queries executing
- [ ] R2 file operations working
- [ ] Error handling correct

## Staging Deployment

### 1. Build and Deploy
```bash
npm run build
npm run cf:deploy:staging
```

### 2. Monitor Deployment
```bash
wrangler tail --env staging
```

### 3. Test Staging
```bash
# Test health check
curl https://staging.yourdomain.com/health

# Test API endpoints
curl -H "Authorization: Bearer $TOKEN" https://staging.yourdomain.com/api/admin/tenants
```

### 4. Load Testing
- [ ] Run load tests on staging
- [ ] Monitor Workers metrics
- [ ] Check D1 query performance
- [ ] Verify error handling

## Production Deployment

### 1. Pre-Production Checks
- [ ] All tests passing
- [ ] Staging environment stable
- [ ] Database backups created
- [ ] Rollback plan documented
- [ ] Team notified

### 2. Build and Deploy
```bash
npm run build
npm run cf:deploy
```

### 3. Monitor Deployment
```bash
wrangler tail --env production
```

### 4. Verify Production
```bash
# Test critical endpoints
curl https://api.yourdomain.com/health
curl -H "Authorization: Bearer $TOKEN" https://api.yourdomain.com/api/admin/tenants

# Monitor logs and metrics
# Check Cloudflare Dashboard > Workers > Metrics
```

### 5. Post-Deployment
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify data integrity
- [ ] Enable alerts if not already
- [ ] Document any issues

## Rollback Procedure

If issues occur post-deployment:

### 1. Immediate Rollback
```bash
# Revert to previous version
git checkout HEAD~1 src/worker.ts src/routes/ src/middleware/
npm run build
npm run cf:deploy --env production
```

### 2. Check Deployment Status
```bash
wrangler deployments list --env production
```

### 3. Revert to Previous Deployment
```bash
wrangler rollback --env production
```

## Performance Optimization

### 1. Enable Caching
Configure cache headers in responses:
```typescript
c.header('Cache-Control', 'public, max-age=3600');
```

### 2. Optimize Database Queries
- Use indexes on frequently queried columns
- Batch operations where possible
- Monitor slow queries in logs

### 3. Monitor Metrics
- CPU time per request
- Response times
- Error rates
- Cache hit ratios

### 4. Scale Resources
- D1 can handle growing data
- KV automatically scales
- R2 pricing scales with usage

## Troubleshooting

### Database Connection Errors
```bash
# Test D1 connection
wrangler d1 execute commerce-prod --remote "SELECT 1"

# Check bindings in wrangler.toml
# Verify database_id is correct
```

### KV Issues
```bash
# List KV namespaces
wrangler kv:namespace list

# Check KV binding names match code
# Ensure CACHE and SESSION namespaces exist
```

### R2 Upload Failures
```bash
# Test R2 connection
echo "test" | wrangler r2 object put commerce-assets-prod/test.txt --path /dev/stdin

# Verify ASSETS binding exists
# Check bucket permissions
```

### Timeout Issues
- Reduce request processing time
- Implement streaming for large responses
- Use batch operations
- Check for infinite loops

### Memory Issues
- Worker memory limit: 128MB
- Monitor built bundle size
- Minimize dependencies
- Use streaming for large payloads

## Monitoring & Alerts

### 1. Set Up Alerts
- [ ] Configure error alerts in Cloudflare
- [ ] Set up uptime monitoring
- [ ] Enable log streaming to external service

### 2. Monitor Metrics
- [ ] Error rate (target: < 0.1%)
- [ ] Response time (target: < 100ms p99)
- [ ] Request volume
- [ ] Cache hit ratio

### 3. Log Aggregation
```bash
# Stream logs to stdout
wrangler tail --env production

# Save logs to file
wrangler tail --env production > logs.txt
```

## Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] API tokens rotated regularly
- [ ] CORS properly configured
- [ ] Rate limiting implemented (if needed)
- [ ] Input validation on all routes
- [ ] SQL injection prevention (parameterized queries)
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] DDoS protection enabled (Cloudflare)

## Success Criteria

✅ All items below should be completed before marking deployment successful:

- [ ] Health endpoint returns 200
- [ ] Admin routes require valid token
- [ ] Tenant routes resolve correctly
- [ ] Products can be listed and fetched
- [ ] Database operations working
- [ ] File uploads working
- [ ] Cache operations working
- [ ] Error handling correct
- [ ] Response times acceptable (< 500ms)
- [ ] Error rate negligible (< 0.1%)
- [ ] Monitoring and alerts active
- [ ] Documentation updated
- [ ] Team trained on new platform

## Post-Deployment Tasks

### 1. Documentation
- [ ] Update API documentation
- [ ] Document any configuration changes
- [ ] Create runbooks for common operations
- [ ] Record deployment details

### 2. Training
- [ ] Train team on Workers platform
- [ ] Document monitoring procedures
- [ ] Create troubleshooting guides
- [ ] Record video tutorials if applicable

### 3. Optimization
- [ ] Review performance metrics
- [ ] Identify bottlenecks
- [ ] Implement optimizations
- [ ] Re-test after changes

### 4. Maintenance
- [ ] Plan regular backups
- [ ] Schedule database maintenance
- [ ] Monitor and rotate logs
- [ ] Keep dependencies updated

## Support & Resources

- **Hono Docs**: https://hono.dev/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **D1 Documentation**: https://developers.cloudflare.com/d1/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/
- **KV Storage**: https://developers.cloudflare.com/workers/runtime-apis/kv/
- **R2 Storage**: https://developers.cloudflare.com/r2/

---

**Last Updated**: 2024
**Status**: Ready for Deployment
**Version**: 1.0.0
