# Architecture Overview

## System Design

The MTC Platform is a production-ready, multi-tenant digital commerce platform with dual deployment architecture supporting both Node.js and Cloudflare Workers.

### Deployment Models

```
┌─────────────────────────────────────────────────────────┐
│         MTC Platform - Multi-Deployment Architecture     │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  Shared Codebase (TypeScript)             │
│                                                           │
│  ├── src/index.ts           (Express Application)        │
│  ├── src/worker/index.ts    (Cloudflare Workers)         │
│  ├── src/db/               (Database Layer)               │
│  ├── src/utils/            (Utilities & Services)         │
│  └── src/middleware/       (Express Middleware)           │
└──────────────────────────────────────────────────────────┘
         │                                  │
         ▼                                  ▼
    ┌─────────────┐              ┌──────────────────┐
    │  Node.js    │              │ Cloudflare       │
    │  Express    │              │ Workers          │
    │             │              │                  │
    │ - SQLite    │              │ - D1 Database    │
    │ - Local Dev │              │ - KV Cache       │
    │ - Docker    │              │ - R2 Storage     │
    │ - Local API │              │ - Edge Computing │
    └─────────────┘              └──────────────────┘
         │                              │
         ▼                              ▼
    ┌─────────────┐              ┌──────────────────┐
    │  localhost  │              │  api.mtc.io      │
    │  :3000      │              │  (Production)    │
    └─────────────┘              └──────────────────┘
```

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18+ (Local) + Cloudflare Workers (Edge)
- **Language**: TypeScript 5.3+
- **Framework**: Express.js (Node) + Itty-Router (Workers)
- **Database**: SQLite (Local) + D1 (Workers)
- **ORM**: Drizzle ORM (Type-safe SQL)
- **Build**: TypeScript Compiler + Wrangler

### Storage & Services
- **Cache**: Node.js Memory (Local) + KV (Workers)
- **File Storage**: Local Filesystem (Dev) + R2 (Production)
- **Authentication**: API Key (x-api-key header)
- **Validation**: Zod Schema Validation

### Development & Testing
- **Testing**: Vitest (Unit) + Playwright (E2E)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## Project Structure

```
mtc-platform/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD Pipeline
├── src/
│   ├── index.ts                    # Express Application Entry
│   ├── worker.ts                   # Legacy Worker (deprecated)
│   ├── worker/
│   │   └── index.ts                # Cloudflare Workers Entry
│   ├── bootstrap/                  # Application Startup
│   │   ├── index.ts
│   │   └── db.ts
│   ├── db/
│   │   ├── client.ts               # Database Client (SQLite)
│   │   ├── d1.ts                   # D1 Client & Types
│   │   ├── migrations-d1.ts        # D1 Migrations
│   │   ├── schema.ts               # Drizzle ORM Schema
│   │   ├── migrate.ts              # Migration Runner
│   │   └── seed.ts                 # Database Seeding
│   ├── middleware/
│   │   ├── auth.ts                 # API Key Authentication
│   │   ├── error-handler.ts        # Express Error Handler
│   │   └── security.ts             # Security Headers, CORS, Rate Limiting
│   ├── utils/
│   │   ├── response.ts             # Response Formatting
│   │   ├── validators.ts           # Zod Schemas
│   │   ├── logger.ts               # Logging Utility
│   │   ├── cache.ts                # Node.js Cache
│   │   ├── cache-kv.ts             # KV Cache Layer
│   │   └── r2-upload.ts            # R2 Storage Client
│   ├── services/                   # Business Logic
│   ├── types/                      # TypeScript Types
│   └── __tests__/                  # Unit Tests
├── tests/                          # Test Utilities
├── e2e/                            # Playwright E2E Tests
├── packages/                       # Monorepo Packages
│   ├── admin/
│   ├── admin-cli/
│   ├── config/
│   └── plugin-sdk/
├── scripts/
│   └── update-versions.sh          # Dependency Update Script
├── docs/
│   └── API/                        # API Documentation
├── .env.example                    # Environment Template
├── .gitignore                      # Git Ignore Rules
├── package.json                    # Dependencies & Scripts
├── tsconfig.json                   # TypeScript Config
├── vitest.config.ts                # Vitest Config
├── playwright.config.ts            # Playwright Config
├── wrangler.toml                   # Cloudflare Config
├── Dockerfile                      # Docker Build
├── docker-compose.yml              # Docker Compose
├── build.config.ts                 # Build Configuration
├── TESTING_GUIDE.md                # Testing Documentation
├── DEPLOYMENT_GUIDE.md             # Deployment Instructions
├── DEPLOYMENT_CHECKLIST.md         # Pre-deployment Checklist
└── ARCHITECTURE.md                 # This File
```

## Data Flow

### Request Processing

```
┌──────────────┐
│ HTTP Request │
└──────┬───────┘
       │
       ▼
┌────────────────────────────┐
│ CORS & Security Headers    │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Rate Limiting              │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Authentication (API Key)   │ ─────► Validate x-api-key header
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Input Validation (Zod)     │ ─────► Validate Request Body
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Route Handler              │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Check Cache (KV/Memory)    │ ─────► Cache Hit: Return
└──────┬──────────────────────┘        │
       │ Cache Miss             │
       ▼                        ▼
┌────────────────────────────┐
│ Database Query             │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Process Response           │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Cache Response (KV/Memory) │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Format & Return Response   │
└──────────────────────────────┘
```

## API Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  code: string;           // SUCCESS, ERROR_CODE, etc.
  message: string;        // Human-readable message
  data?: T;              // Response payload
  timestamp: string;     // ISO 8601 timestamp
  errors?: ValidationError[]; // For validation errors
}

// Error Response
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}

// Success Response
{
  "success": true,
  "code": "SUCCESS",
  "message": "Users fetched",
  "data": {
    "data": [...],
    "limit": 20,
    "offset": 0,
    "total": 100,
    "hasMore": true
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Database Architecture

### Schema Design

```sql
Users
  ├── id (PK)
  ├── email (UNIQUE)
  ├── password_hash
  ├── api_key (UNIQUE)
  └── role

Tenants
  ├── id (PK)
  ├── name
  ├── slug (UNIQUE)
  └── config (JSON)

Stores (tenant_id FK)
  ├── id (PK)
  ├── tenant_id (FK → Tenants)
  ├── name
  └── config (JSON)

Products (store_id FK)
  ├── id (PK)
  ├── store_id (FK → Stores)
  ├── name
  ├── sku
  ├── price
  └── status

Orders (store_id FK, user_id FK)
  ├── id (PK)
  ├── store_id (FK → Stores)
  ├── user_id (FK → Users)
  ├── items (JSON)
  ├── total
  └── status

OrderItems
  ├── id (PK)
  ├── order_id (FK → Orders)
  ├── product_id (FK → Products)
  └── quantity
```

### Migration Strategy

```
Development
  └── SQLite (db.sqlite)
       └── Local Migrations (Drizzle Kit)

Production
  └── Cloudflare D1
       └── Remote Migrations (wrangler d1)
```

## Caching Strategy

### Multi-Level Cache

```
Request
  │
  ▼
Edge Cache (Cloudflare Cache)
  │ Miss
  ▼
Worker KV Cache (TTL: 1 hour)
  │ Miss
  ▼
Node.js Memory Cache (TTL: 30 min)
  │ Miss
  ▼
Database Query
  │
  ▼
Populate Caches & Return
```

### Cache Keys

```
Format: resource:action:parameters

Examples:
- users:list:20:0         (Users listing, page 1)
- users:detail:123        (Specific user)
- stores:stats:456        (Store statistics)
- products:search:xyz     (Product search results)
```

## Security Architecture

### Authentication Flow

```
Client Request
  │
  ├─ Header: x-api-key
  │
  ▼
Middleware: authMiddleware
  │
  ├─ Extract API Key
  ├─ Query Database
  ├─ Validate User
  │
  ▼
Request Handler (if valid)
```

### Input Validation

```
Request Body
  │
  ▼
Zod Schema Validation
  │
  ├─ Type Checking
  ├─ Format Validation
  ├─ Custom Rules
  │
  ├─ Valid → Continue
  └─ Invalid → 400 Bad Request
```

### Security Headers

```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

## File Storage Architecture

### Local Development
```
project/
├── uploads/              (gitignored)
│   ├── users/
│   ├── products/
│   └── orders/
```

### Production (Cloudflare R2)
```
mtc-uploads/
├── users/
│   └── {tenant-id}/{user-id}/{file-id}
├── products/
│   └── {tenant-id}/{store-id}/{product-id}/{file-id}
└── orders/
    └── {tenant-id}/{store-id}/{order-id}/{file-id}
```

## Environment Configurations

### Development
- SQLite database
- In-memory caching
- Local file storage
- Debug logging
- No rate limiting

### Staging
- D1 database
- KV caching
- R2 storage
- Info logging
- Rate limiting enabled

### Production
- D1 database (replicated)
- KV caching (distributed)
- R2 storage (CDN)
- Warn logging
- Rate limiting (strict)

## Scaling Considerations

### Horizontal Scaling
- Cloudflare Workers automatically scales
- D1 replication for read scaling
- KV distributed globally

### Vertical Scaling
- Increase database compute tier
- Increase storage limits
- Monitor CPU/memory usage

### Performance Optimization
- Database indexes on query fields
- Cache frequently accessed data
- Compress API responses
- Enable gzip compression

## Monitoring & Observability

### Metrics Tracked
- Request count & latency
- Error rates & types
- Database query performance
- Cache hit/miss ratio
- Storage usage (D1, R2)
- CPU & memory usage

### Logging
- Access logs (all requests)
- Error logs (errors & warnings)
- Application logs (business logic)
- Audit logs (user actions)

### Alerting
- High error rate (>1%)
- Slow response times (>1s)
- Database issues
- Storage quota warnings

## CI/CD Pipeline

```
Git Push (develop/main)
  │
  ▼
GitHub Actions Triggered
  │
  ├─ Install Dependencies
  ├─ Type Check
  ├─ Build
  ├─ Unit Tests
  ├─ E2E Tests
  │
  ├─ Success
  │  │
  │  ▼
  │ Deploy to Staging (develop)
  │ Deploy to Production (main)
  │
  └─ Failure
     │
     ▼
    Notify & Block
```

## Disaster Recovery

### Backup Strategy
- Daily automated D1 snapshots
- Point-in-time recovery (24 hours)
- R2 object versioning enabled

### Recovery Procedures
```
Data Loss
  │
  ├─ Restore from D1 snapshot
  ├─ Verify data integrity
  └─ Promote to production

Worker Failure
  │
  ├─ Automatic failover
  ├─ Rollback to previous version
  └─ Notify team
```

## Performance Baselines

### Target Metrics
- Health check: <50ms
- List endpoints: <100ms
- Create endpoints: <200ms
- Complex queries: <500ms
- File upload: <1s per MB

### SLA
- 99.9% uptime
- <100ms p99 latency
- <1% error rate

## Future Enhancements

- [ ] GraphQL API endpoint
- [ ] WebSocket support
- [ ] Real-time notifications
- [ ] Advanced search (Elasticsearch)
- [ ] Analytics dashboard
- [ ] Plugin marketplace
- [ ] Custom domains per tenant
- [ ] Advanced audit logging

---

**Version**: 1.0.0
**Last Updated**: 2024-01-01
