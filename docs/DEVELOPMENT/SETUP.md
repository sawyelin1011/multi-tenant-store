# Development Guide

This guide covers the dual runtime development setup for the MTC Platform.

## Architecture Overview

The platform supports two runtime environments:

1. **Node.js + Express**: Traditional server-side runtime with PostgreSQL
2. **Cloudflare Workers + Hono**: Edge runtime with D1, KV, and R2

Both runtimes share the same TypeScript codebase and business logic, with runtime-specific adaptations.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Express Development (Node.js)
```bash
# Copy environment configuration
cp .env.example .env.local

# Start development server
npm run dev
```

### 3. Workers Development (Cloudflare)
```bash
# Authenticate with Cloudflare
wrangler auth login

# Create D1 database
wrangler d1 create commerce-dev

# Update wrangler.toml with the returned database_id

# Start Workers development
npm run cf:dev
```

## Development Scripts

### Express Scripts
- `npm run dev` - Start Express server with tsx
- `npm run dev:watch` - Start with file watching
- `npm run build` - Build for production
- `npm start` - Start production server

### Workers Scripts
- `npm run cf:dev` - Start Miniflare development server
- `npm run cf:build` - Build Workers bundle
- `npm run cf:deploy` - Deploy to production
- `npm run cf:deploy:staging` - Deploy to staging

### Database Scripts
- `npm run db:generate` - Generate Drizzle migrations
- `npm run migrate` - Apply PostgreSQL migrations
- `npm run db:migrate:worker` - Apply D1 migrations
- `npm run db:migrate:local` - Local D1 setup

### Dual Runtime
- `npm run dev:both` - Run both Express and Workers concurrently

## Port Configuration

- **Express Server**: http://localhost:3000
- **Workers Server**: http://localhost:8787

## Environment Configuration

### Express (.env.local)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/digital_commerce
ADMIN_JWT_SECRET=your-secret
TENANT_JWT_SECRET=your-secret
NODE_OPTIONS="--no-deprecation"
```

### Workers (wrangler.toml)
```toml
[env.development]
vars = { NODE_ENV = "development", CF_ENVIRONMENT = "development" }
port = 8787
```

## TypeScript Configuration

The project uses a unified `tsconfig.json` compatible with both runtimes:

- **Target**: ES2022 (modern JavaScript features)
- **Module**: ESNext (native ES modules)
- **Module Resolution**: Bundler (compatible with both runtimes)
- **Types**: Node.js + Cloudflare Workers

## Runtime Detection

The application automatically detects the runtime environment:

```typescript
import { isCloudflareWorker, runtime } from './config/env.js';

if (runtime === 'node') {
  // Node.js/Express specific code
  const express = require('express');
} else {
  // Workers/Hono specific code
  const { Hono } = require('hono');
}
```

## Database Differences

### Express (PostgreSQL)
- Uses pg-promise for database operations
- Full JSONB support with advanced operators
- Connection pooling and transactions
- Traditional relational database features

### Workers (D1/SQLite)
- Uses Drizzle ORM for type-safe queries
- JSON stored as TEXT with manual parsing
- No connection pooling (single connection)
- SQLite limitations (no complex JSON operators)

## Code Organization

### Shared Code
- `src/services/` - Business logic (Express versions)
- `src/services/drizzle-*-service.ts` - Workers versions
- `src/db/schema.ts` - Database schema (Drizzle)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

### Runtime-Specific
- `src/index.ts` - Express entry point
- `src/worker.ts` - Workers entry point
- `src/config/database.ts` - PostgreSQL config
- `src/config/worker-database.ts` - D1 config

## Development Workflow

### 1. Feature Development
```bash
# Start Express for rapid development
npm run dev:watch

# Make changes to business logic
# Test with both runtimes
npm run cf:dev
```

### 2. Database Changes
```bash
# Update schema in src/db/schema.ts
npm run db:generate

# Apply to PostgreSQL (Express)
npm run migrate

# Apply to D1 (Workers)
npm run db:migrate:worker
```

### 3. Testing
```bash
# Run unit tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Migration Between Runtimes

### From Express to Workers
1. Update service calls to use Drizzle versions
2. Replace pg-promise queries with Drizzle queries
3. Handle JSON field differences (TEXT vs JSONB)
4. Update environment configuration
5. Test with Miniflare before deployment

### Data Migration
```bash
# Export from PostgreSQL to D1
npm run db:migrate:postgres-to-d1
```

## Common Issues

### ts-node Deprecation
**Problem**: `ts-node/esm` loader deprecation warnings
**Solution**: Use `tsx` instead of `ts-node`
```bash
npm run dev  # Uses tsx automatically
```

### fs.Stats Deprecation
**Problem**: fs.Stats constructor warnings
**Solution**: Add to .env.local
```env
NODE_OPTIONS="--no-deprecation"
```

### Module Resolution
**Problem**: Import errors with .js extensions
**Solution**: Ensure imports use .js extensions
```typescript
import { config } from './config/env.js';  // Correct
import { config } from './config/env';     // Incorrect
```

### Workers D1 Database
**Problem**: D1 database not found
**Solution**: Create database and update wrangler.toml
```bash
wrangler d1 create commerce-dev
# Update database_id in wrangler.toml
```

## Performance Considerations

### Express
- Use connection pooling (max 30 connections)
- Implement Redis caching for frequent queries
- Optimize JSONB queries with indexes

### Workers
- Minimize D1 query complexity
- Use KV for caching frequently accessed data
- Batch operations when possible
- Consider denormalization for complex queries

## Deployment

### Express Production
```bash
npm run build
npm start
```

### Workers Production
```bash
npm run cf:build
npm run cf:deploy
```

## Debugging

### Express Debugging
```bash
# Start with Node.js debugging
node --inspect dist/index.js
```

### Workers Debugging
```bash
# Start Miniflare with debugging
wrangler dev --env development --log-level debug
```

## Environment Variables Reference

### Common Variables
- `NODE_ENV` - Environment (development/staging/production)
- `ADMIN_JWT_SECRET` - Admin authentication secret
- `TENANT_JWT_SECRET` - Tenant authentication secret
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 10)
- `MAX_FILE_SIZE` - Maximum file upload size (default: 100MB)

### Express Specific
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (optional)
- `PLUGIN_DIR` - Plugin directory path
- `FILE_UPLOAD_DIR` - File upload directory

### Workers Specific
- `CF_ENVIRONMENT` - Cloudflare environment
- D1, KV, and R2 bindings configured in wrangler.toml

## Plugin Development

Plugins work in both runtimes with runtime-specific adaptations:

```typescript
// Plugin manifest
{
  "name": "my-plugin",
  "version": "1.0.0",
  "runtimes": ["node", "worker"],
  "hooks": ["before-order-create", "after-payment"]
}
```

## Testing Strategy

### Unit Tests
- Test business logic independently
- Mock database operations
- Test both runtime adapters

### Integration Tests
- Test API endpoints
- Test database operations
- Test plugin integration

### E2E Tests
- Test complete workflows
- Test both runtimes
- Test deployment scenarios
