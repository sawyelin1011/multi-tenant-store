# Quick Start Guide - MTC Platform

Get started with the MTC Platform in 5 minutes!

## Prerequisites

- Node.js 18+
- npm 9+
- Cloudflare Account (for production)
- Git configured with SSH keys

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

Minimum configuration:
```env
PORT=3000
NODE_ENV=development
SUPER_ADMIN_API_KEY=sk_test_admin123456
SQLITE_DB=db.sqlite
```

## 3. Run Locally

### Option A: Express Server (Recommended for Development)

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### Option B: Cloudflare Workers (Local Simulation)

```bash
npm run dev:worker
```

### Option C: Docker

```bash
docker-compose up
```

## 4. Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### List Users (with API Key)
```bash
curl -H "x-api-key: sk_test_admin123456" \
  http://localhost:3000/api/users
```

## 5. Run Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

## Build

### Build for All Targets
```bash
npm run build:all
```

### Build Only for Node.js
```bash
npm run build:node
```

### Build Only for Cloudflare Workers
```bash
npm run build:worker
```

## Deploy to Production

### Prerequisites
1. Cloudflare account with Workers
2. GitHub secrets configured:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

### Automatic Deployment
- Push to `develop` → Deploys to development
- Push to `main` → Deploys to production

### Manual Deployment
```bash
npm run deploy:production
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Express application |
| `src/worker/index.ts` | Cloudflare Workers entry |
| `wrangler.toml` | Workers configuration |
| `package.json` | Dependencies and scripts |
| `.env.example` | Environment template |
| `CLOUDFLARE_WORKERS_SETUP.md` | Detailed setup guide |
| `TESTING_GUIDE.md` | Testing documentation |
| `DEPLOYMENT_GUIDE.md` | Deployment instructions |

## Available Scripts

```bash
# Development
npm run dev              # Start Express server
npm run dev:worker      # Start Wrangler local

# Building
npm run build           # Build all
npm run build:node      # Build Node only
npm run build:worker    # Build Workers only

# Testing
npm run test            # All tests
npm run test:unit       # Unit tests
npm run test:e2e        # E2E tests
npm run test:watch      # Watch mode

# Deployment
npm run deploy          # Deploy to production
npm run deploy:dev      # Deploy to development
npm run deploy:staging  # Deploy to staging

# Utilities
npm run type-check      # TypeScript check
npm run lint            # Linting
npm run format          # Format code
npm run migrate         # Run migrations
npm run clean           # Clean build files
```

## Common Tasks

### Create a New Migration

```bash
# Update schema in src/db/schema.ts
npm run db:generate
npm run migrate
```

### Seed the Database

```bash
npm run seed
```

### Check API Endpoints

All 91+ endpoints documented in:
- `API_TESTING.md` - curl examples for all endpoints
- `docs/API/ENDPOINTS.md` - detailed endpoint reference
- `postman-collection-comprehensive.json` - Postman collection

### View Logs

```bash
# Express server
npm run dev

# Workers (production)
wrangler tail --env production
```

## Environment Variables

Key variables (see `.env.example` for complete list):

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `SUPER_ADMIN_API_KEY` | Admin API key | `sk_test_admin123456` |
| `SQLITE_DB` | Database file | `db.sqlite` |
| `CF_API_TOKEN` | Cloudflare API token | (from Cloudflare dashboard) |
| `CF_ACCOUNT_ID` | Cloudflare account ID | (from Cloudflare dashboard) |

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Lock Issues
```bash
# Remove database files
rm db.sqlite db.sqlite-shm db.sqlite-wal

# Re-run migrations
npm run migrate
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm run build:all
```

### Tests Failing
```bash
# Check dependencies
npm install

# Check Node version
node --version

# Run with more verbose output
npm run test:unit -- --reporter=verbose
```

## Documentation

For detailed information, see:

1. **Setup**: `CLOUDFLARE_WORKERS_SETUP.md` - Complete Cloudflare Workers setup
2. **Testing**: `TESTING_GUIDE.md` - How to write and run tests
3. **Deployment**: `DEPLOYMENT_GUIDE.md` - Production deployment steps
4. **Architecture**: `ARCHITECTURE.md` - System design and components
5. **API Testing**: `API_TESTING.md` - curl examples for all endpoints
6. **Checklist**: `DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification

## Need Help?

1. Check the documentation files listed above
2. Review GitHub Issues: `https://github.com/your-org/mtc-platform/issues`
3. Check Cloudflare docs: `https://developers.cloudflare.com/workers/`
4. Run tests to verify setup: `npm run test`

## What's Next?

1. ✅ Local development: `npm run dev`
2. ✅ Run tests: `npm run test`
3. ✅ Read API docs: `API_TESTING.md`
4. ✅ Test an endpoint: See "Test the API" section above
5. ✅ Deploy: Follow `DEPLOYMENT_GUIDE.md`

---

**Happy coding! 🚀**
