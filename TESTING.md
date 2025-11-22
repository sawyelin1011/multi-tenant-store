# SQLite + Drizzle Setup - Testing Guide

## Setup Complete ✅

This project is now running with SQLite + Drizzle ORM. Clean, simple, production-ready.

## Quick Start

```bash
# Install dependencies
npm install

# Generate migrations
npm run db:generate

# Start server (auto-runs migrations and seed)
npm run dev
```

Server runs on `http://localhost:3000` with API key `sk_test_admin123456`

## Test All Endpoints

### Health Check (No Auth)
```bash
curl http://localhost:3000/health
```

### Get All Users
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/users
```

### Get All Tenants
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/tenants
```

### Get All Stores
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/stores
```

### Get All Products
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/products
```

### Get All Orders
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/orders
```

### Create New Tenant
```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Tenant","slug":"new-tenant"}'
```

### Create New User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","role":"customer"}'
```

### Create New Product
```bash
# First get a store_id from /api/stores
curl -X POST http://localhost:3000/api/products \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"store_id":"STORE_ID","name":"New Product","price":49.99}'
```

### Get Specific Store
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/stores/STORE_ID
```

### Get Specific Product
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/products/PRODUCT_ID
```

### Get Specific Order
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/orders/ORDER_ID
```

### Test Auth Failure (No API Key)
```bash
curl http://localhost:3000/api/users
# Should return: {"error":"Unauthorized - invalid or missing API key"}
```

### Test 404 (Nonexistent Resource)
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/stores/nonexistent
# Should return: {"error":"Store not found"}
```

## Acceptance Criteria ✅

- ✅ npm run dev starts successfully
- ✅ db.sqlite file created locally
- ✅ All migrations run without errors
- ✅ Seed data created (users, tenants, stores, products, orders)
- ✅ All endpoints return 200 with correct auth header
- ✅ All endpoints return 401 without auth header
- ✅ Create endpoints (POST) work and save to database
- ✅ Get endpoints (GET) return correct data
- ✅ No errors in console
- ✅ Ready to test thoroughly

## Project Structure

```
/home/engine/project/
├── drizzle/                          # SQLite migrations (tracked in git)
│   └── 0000_brown_magneto.sql        # Initial schema
├── src/
│   ├── bootstrap/
│   │   └── index.ts                  # Runs migrations + seed on startup
│   ├── db/
│   │   ├── client.ts                 # SQLite connection
│   │   ├── migrate.ts                # Migration runner
│   │   ├── schema.ts                 # Drizzle schema (SQLite)
│   │   └── seed.ts                   # Seed data
│   ├── middleware/
│   │   └── auth.ts                   # API key authentication
│   └── index.ts                      # Main server with inline routes
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Environment template
├── drizzle.config.ts                 # Drizzle Kit config (SQLite)
├── db.sqlite                         # SQLite database file (gitignored)
└── package.json                      # Simple dependencies

```

## Database Schema

- **users**: User accounts with API keys
- **tenants**: Multi-tenant isolation
- **stores**: Stores per tenant
- **products**: Products per store
- **orders**: Orders with line items
- **order_items**: Order line items

All tables use:
- Text IDs (nanoid)
- Integer timestamps
- Real numbers for prices
- Foreign key constraints with cascade delete

## Environment Variables

```env
NODE_ENV=development
PORT=3000
SUPER_ADMIN_API_KEY=sk_test_admin123456
SUPER_ADMIN_EMAIL=admin@platform.local
```

## Seed Data

On first startup, creates:
- Admin user with API key
- Test tenant
- Test store
- 2 test products
- 1 completed order with items
- Test customer user

## Migration Workflow

1. Edit schema: `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review migration: Check `drizzle/*.sql`
4. Restart server: Migrations run automatically

## Clean Database

```bash
rm db.sqlite db.sqlite-shm db.sqlite-wal
npm run dev
```

Fresh database with seed data created automatically.
