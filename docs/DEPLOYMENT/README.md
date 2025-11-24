# Deployment Documentation

Welcome to the deployment documentation for MTC Platform. This section contains comprehensive guides for deploying the platform to various environments.

## 📚 Deployment Guides

### [Production Deployment](./PRODUCTION.md)
Complete production deployment guide:
- Environment setup
- Database configuration
- Security considerations
- Performance optimization
- Monitoring and logging
- Backup and recovery

### [Cloudflare Workers Deployment](./CLOUDFLARE_WORKERS.md)
Deploy to Cloudflare Workers edge platform:
- Workers configuration
- D1 database setup
- KV storage configuration
- Environment variables
- Performance optimization
- Edge-specific considerations

### [Deployment Checklist](./CHECKLIST.md)
Pre-deployment verification checklist:
- Security review
- Performance testing
- Configuration validation
- Backup procedures
- Monitoring setup
- Documentation updates

## 🚀 Deployment Options

### Option 1: Traditional Cloud Deployment

Deploy to traditional cloud providers (AWS, GCP, Azure):

```bash
# Build for production
npm run build

# Deploy to your cloud provider
# Example: AWS ECS
docker build -t mtc-platform .
docker push your-registry/mtc-platform
```

**Pros:**
- Full control over infrastructure
- Familiar deployment patterns
- Wide range of services
- Established tooling

**Cons:**
- Higher operational overhead
- Manual scaling
- Regional limitations
- Higher costs at scale

### Option 2: Cloudflare Workers

Deploy to Cloudflare Workers edge platform:

```bash
# Deploy to Workers
npm run cf:deploy

# Deploy to production
npm run cf:deploy -- --env production
```

**Pros:**
- Global edge deployment
- Auto-scaling
- Pay-per-request pricing
- Built-in DDoS protection

**Cons:**
- Runtime limitations
- Vendor lock-in
- Smaller ecosystem
- Limited database options

### Option 3: Hybrid Approach

Combine both deployment methods:

- **Workers**: Public APIs, static content
- **Traditional**: Admin interfaces, background jobs
- **Database**: Multi-region setup
- **CDN**: Global content delivery

## 🔧 Environment Configuration

### Development Environment

```env
NODE_ENV=development
PORT=3000
DB_TYPE=sqlite
DB_PATH=./dev.db
SUPER_ADMIN_API_KEY=sk_test_dev_key
LOG_LEVEL=debug
```

### Staging Environment

```env
NODE_ENV=staging
PORT=3000
DB_TYPE=postgres
DATABASE_URL=postgresql://user:pass@staging-db:5432/mtc_staging
SUPER_ADMIN_API_KEY=sk_test_staging_key
LOG_LEVEL=info
ALLOWED_ORIGINS=https://staging.mtc-platform.com
```

### Production Environment

```env
NODE_ENV=production
PORT=3000
DB_TYPE=postgres
DATABASE_URL=postgresql://user:secure_pass@prod-db:5432/mtc_production
SUPER_ADMIN_API_KEY=sk_live_prod_key
LOG_LEVEL=warn
ALLOWED_ORIGINS=https://mtc-platform.com
```

## 📊 Deployment Architecture

### Traditional Architecture

```
Internet
    ↓
Load Balancer (HTTPS)
    ↓
Web Servers (Node.js)
    ↓
Application Layer
    ↓
Database Layer (PostgreSQL)
    ↓
Storage Layer (S3)
```

### Cloudflare Workers Architecture

```
Internet
    ↓
Cloudflare Edge (Global)
    ↓
Workers Runtime
    ↓
D1 Database (SQLite)
    ↓
KV Storage
    ↓
R2 Storage
```

### Hybrid Architecture

```
Internet
    ↓
┌─────────────────┬─────────────────┐
│   Workers      │   Traditional  │
│   (Public API) │  (Admin UI)   │
└─────────────────┴─────────────────┘
    ↓                    ↓
D1 + KV            PostgreSQL + S3
    ↓                    ↓
    └─────── Monitoring ────────┘
```

## 🔒 Security Configuration

### SSL/TLS Setup

```nginx
# Nginx configuration
server {
    listen 443 ssl http2;
    server_name mtc-platform.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Firewall Rules

```bash
# Example UFW rules
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 3000/tcp  # Direct access to app
ufw enable
```

### Security Headers

```typescript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

## 📈 Performance Optimization

### Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_users_email ON users(email);

-- Partition large tables
CREATE TABLE orders_2024 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Caching Strategy

```typescript
// Redis caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedData(key: string) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFromDatabase(key);
  await redis.setex(key, 300, JSON.stringify(data));
  return data;
}
```

### CDN Configuration

```javascript
// Cloudflare Workers KV caching
export default {
  async fetch(request, env) {
    const cacheKey = new Request(request.url, request);
    const cached = await caches.default.match(cacheKey);
    
    if (cached) return cached;
    
    const response = await handleRequest(request);
    response.headers.set('Cache-Control', 'public, max-age=300');
    
    return response;
  }
};
```

## 🔍 Monitoring and Logging

### Application Monitoring

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabase(),
    cache: await checkCache()
  };
  
  res.json(health);
});
```

### Error Tracking

```typescript
// Sentry integration
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Log Aggregation

```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          npm ci
          npm run build
          npm run deploy:prod
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SUPER_ADMIN_API_KEY: ${{ secrets.SUPER_ADMIN_API_KEY }}
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mtc
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=mtc
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### Database Connection Failed

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check network connectivity
telnet db-hostname 5432

# Verify credentials
echo $DATABASE_URL
```

#### Out of Memory Errors

```bash
# Check memory usage
free -h
docker stats

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Optimize memory usage
npm run build:optimize
```

#### High CPU Usage

```bash
# Check CPU usage
top
htop

# Profile Node.js application
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

### Performance Issues

#### Slow Database Queries

```sql
-- Identify slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM products WHERE tenant_id = 'xxx';
```

#### High Response Times

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/users

# Monitor with tools
npm run monitor:performance
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Backup procedures tested
- [ ] Rollback plan ready

### Deployment

- [ ] Maintenance mode enabled
- [ ] Database migrations applied
- [ ] New version deployed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Maintenance mode disabled

### Post-Deployment

- [ ] Functionality testing
- [ ] Performance monitoring
- [ ] Error rate monitoring
- [ ] User feedback collection
- [ ] Documentation updates
- [ ] Team notification

## 📚 Additional Resources

### Documentation

- [Production Guide](./PRODUCTION.md) - Detailed production deployment
- [Cloudflare Workers Guide](./CLOUDFLARE_WORKERS.md) - Edge deployment
- [Security Guide](../DEVELOPMENT/SECURITY.md) - Security best practices

### Tools and Services

- **Monitoring**: Datadog, New Relic, Sentry
- **Logging**: ELK Stack, LogDNA, Papertrail
- **CI/CD**: GitHub Actions, GitLab CI, Jenkins
- **Infrastructure**: AWS, GCP, Azure, DigitalOcean

### Community

- **GitHub Discussions**: Deployment discussions
- **Stack Overflow**: Tag questions with `mtc-platform`
- **Discord/Slack**: Real-time deployment help

## 🤝 Getting Help

### Common Questions

1. **Which deployment option should I choose?**
   - Traditional: Full control, familiar stack
   - Workers: Global edge, auto-scaling
   - Hybrid: Best of both worlds

2. **How do I handle database migrations?**
   - Use the built-in migration system
   - Test migrations on staging first
   - Have rollback procedures ready

3. **What about SSL certificates?**
   - Use Let's Encrypt for free certificates
   - Cloudflare provides SSL automatically
   - Consider certificate management services

### Support Channels

- **Documentation**: Check these guides first
- **GitHub Issues**: Report deployment issues
- **Community Forum**: Ask deployment questions
- **Email Support**: deploy-support@company.com

---

**Deployment Documentation Version**: 3.0.0  
**Last Updated**: 2024-11-24  
**Platform Compatibility**: v1.0.0+

For specific deployment instructions, see the detailed guides above.