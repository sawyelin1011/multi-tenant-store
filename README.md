# Multi-Tenant Commerce Platform API

A lightweight, production-ready multi-tenant commerce API built with **Express**, **SQLite + Drizzle ORM**, and hardened with validation, observability, and security controls. The project now ships with consistent responses, Zod validation, structured logging, caching, Cloudflare Workers compatibility, and a ready-to-import Postman collection.

---

## Documentation

📚 **Comprehensive documentation is now available in the [docs/](./docs/) folder:**

- **[Quick Start Guide](./docs/QUICK_START.md)** - Get running in 5 minutes
- **[Documentation Overview](./docs/README.md)** - Complete documentation index
- **[Development Guides](./docs/DEVELOPMENT/README.md)** - For platform contributors
- **[API Documentation](./docs/API/README.md)** - Complete API reference
- **[Plugin Development](./docs/PLUGINS/README.md)** - Build custom functionality
- **[Templates Guide](./docs/TEMPLATES/README.md)** - Customize store appearance
- **[Deployment Guides](./docs/DEPLOYMENT/README.md)** - Production deployment

### Quick Links

| Audience | Start Here | Key Resources |
|----------|------------|----------------|
| **New Users** | [Quick Start](./docs/QUICK_START.md) | Setup guides, basic usage |
| **Developers** | [Development Setup](./docs/DEVELOPMENT/SETUP.md) | Architecture, contributing |
| **API Users** | [API Reference](./docs/API/REST_API.md) | Complete API documentation |
| **Plugin Devs** | [Plugin Guide](./docs/PLUGINS/DEVELOPMENT_GUIDE.md) | Plugin development |
| **DevOps** | [Deployment Guide](./docs/DEPLOYMENT/PRODUCTION.md) | Production deployment |

---

## Table of Contents
1. [Features](#features)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Environment Configuration](#environment-configuration)
5. [Running Locally](#running-locally)
6. [API Overview](#api-overview)
7. [Error Handling](#error-handling)
8. [Postman Collection](#postman-collection)
9. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
10. [Security Guidelines](#security-guidelines)
11. [Performance Notes](#performance-notes)
12. [Logging & Monitoring](#logging--monitoring)

---

## Features
- ✅ **Consistent API responses** via `successResponse` / `errorResponse`
- ✅ **Zod validation** on every write endpoint with descriptive errors
- ✅ **ApiError utility** for first-class HTTP exceptions
- ✅ **Security middleware** (CORS, security headers, rate limiting, input sanitization)
- ✅ **In-memory response cache** for hot GET endpoints
- ✅ **Structured logger** with adjustable log level
- ✅ **Cloudflare Workers entry** + simplified Wrangler config
- ✅ **Postman collection** covering health, users, tenants, stores, products, and orders
- ✅ **Environment-driven configuration** for DB path, auth, origins, and logging levels

---

## Requirements
- Node.js **18+**
- npm **9+**

Everything else (SQLite, better-sqlite3, Drizzle) is bundled locally—no managed database setup required.

---

## Installation
```bash
# Install dependencies
git clone <repo>
cd mtc-platform
npm install
```

---

## Environment Configuration
Copy `.env.example` to `.env` (or export variables using your preferred secrets manager):

```bash
cp .env.example .env
```

Available variables:

| Variable | Description | Default |
| --- | --- | --- |
| `SQLITE_DB` | Path to SQLite database file | `db.sqlite` |
| `SUPER_ADMIN_API_KEY` | API key required via `x-api-key` header | `sk_test_changehere` |
| `SUPER_ADMIN_EMAIL` | Informational admin email | `admin@platform.local` |
| `ALLOWED_ORIGINS` | Comma-separated list for CORS | `http://localhost:3000` |
| `PORT` | Express port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `LOG_LEVEL` | `debug`, `info`, `warn`, or `error` | `info` |
| `CF_API_TOKEN` | Cloudflare API token (Workers deploys) | _required for deploy_ |
| `CF_ACCOUNT_ID` | Cloudflare account id | _required for deploy_ |

> The Express server automatically creates/updates the SQLite database on startup by running migrations + seed data via `src/bootstrap`.

---

## Running Locally
```bash
# 1. Generate and run latest migrations (optional when using bootstrap)
npm run db:generate
npm run db:migrate

# 2. Start the API (runs migrations + seeds on bootstrap)
npm run dev
```

Example startup output:
```
✅ Server running on http://localhost:3000
📚 API Key: sk_test_admin123456
```

To call authenticated routes:
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/users
```

---

## API Overview
All responses share the following contract:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Description",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Health
- `GET /health` → No auth required (used by Cloudflare Workers + uptime monitors)

### Users
- `GET /api/users` – List all users
- `POST /api/users` – `{ "email": "user@example.com", "role": "user" }`

### Tenants
- `GET /api/tenants`
- `POST /api/tenants` – `{ "name": "Demo", "slug": "demo" }`

### Stores
- `GET /api/stores`
- `GET /api/stores/:id`
- `POST /api/stores` – `{ "tenant_id": "...", "name": "Store", "type": "digital" }`

### Products
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` – `{ "store_id": "...", "name": "Product", "price": 99.99 }`

### Orders
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders` – `{ "store_id": "...", "total": 199.99, "status": "pending" }`

The Zod schemas live in `src/utils/validators.ts`. Any invalid payload produces:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Price must be positive",
  "timestamp": "..."
}
```

---

## Error Handling
Global handler lives at the bottom of `src/index.ts`:
- `ApiError` → respected status code + code + message
- All other errors → logged + `500 INTERNAL_ERROR`
- Stack traces returned only while `NODE_ENV=development`

Example duplicate email response:
```json
{
  "success": false,
  "code": "EMAIL_EXISTS",
  "message": "Email demo@site.com already exists",
  "timestamp": "..."
}
```

---

## Postman Collection
`postman_collection.json` in the repo root includes ready-to-run folders for Health, Users, Tenants, Stores, Products, and Orders.

### Import Instructions
1. Open Postman → **Import**
2. Select `postman_collection.json`
3. Set collection variables:
   - `base_url` (defaults to `http://localhost:3000`)
   - `API_KEY` (defaults to `sk_test_admin123456`)
   - `TENANT_ID` / `STORE_ID` / `PRODUCT_ID` / `ORDER_ID` / `USER_ID` (use IDs returned from previous calls)
4. Send the **Health Check** request, then work through the folders.

Every request already includes the required `x-api-key` header and sample bodies. Update the ID variables before calling `/:id` endpoints to avoid `404 Not Found` responses.

---

## Cloudflare Workers Deployment
The project ships with a dedicated Worker entry (`src/worker.ts`) and simplified Wrangler config.

### Wrangler Setup
```toml
name = "mtc-api"
main = "src/worker.ts"
compatibility_date = "2024-01-01"
type = "service"

[env.production]
vars = { ENVIRONMENT = "production" }
```

### Local Development
```bash
# Authenticate once
npx wrangler login

# Start the worker
npx wrangler dev
```
(Use `wrangler dev --env production` to simulate prod vars.)

### Deploy
```bash
# Deploy using the defaults in wrangler.toml
npx wrangler deploy
```

The worker provides:
- `GET /health` – same response format as Express
- `GET /api/users` – guarded by `x-api-key`
- Easily extended with additional router handlers; swap SQLite for Cloudflare D1 in production.

---

## Security Guidelines
1. **API Key Enforcement** – All `/api/*` routes pass through `authMiddleware` which throws `ApiError` on mismatch.
2. **Rate Limiting** – Simple in-memory limiter (100 requests/minute/IP) returns `429 RATE_LIMITED`.
3. **Security Headers** – HSTS, XSS protection, frame denial, and MIME sniff prevention are applied globally.
4. **CORS** – Locked down to `ALLOWED_ORIGINS`; preflight requests answered automatically.
5. **Input Sanitization** – `sanitizeInput` strips angle brackets + trims + bounds slug input before persistence.
6. **Environment Separation** – Use unique `SUPER_ADMIN_API_KEY` per environment; never commit real secrets.

---

## Performance Notes
- **Caching** – Frequently accessed list endpoints (`users`, `tenants`, `stores`, `products`, `orders`) cache results for 30 seconds. Mutations clear the cache map.
- **Drizzle + SQLite** – Synchronous driver keeps latency extremely low for single-node deployments.
- **Lightweight Middleware** – No extra serialization layers; Express handlers remain synchronous.
- **Cloudflare Worker** – Router-first design allows edge deployment for health checks and lightweight reads.

To tune caching, adjust TTL in `setCache` or replace with Redis/Cloudflare KV as needed.

---

## Logging & Monitoring
`src/utils/logger.ts` outputs structured JSON with:
```json
{
  "timestamp": "2024-01-02T01:23:45.678Z",
  "level": "INFO",
  "env": "development",
  "message": "User created",
  "data": { "id": "123" }
}
```
- Control verbosity using `LOG_LEVEL` (default `info`).
- Errors automatically include `message` + `stack` in structured output for log aggregators.

Integrate with tools like Datadog, Loki, or Cloudflare Logpush by tailing STDOUT.

---

## Next Steps
- Extend validators for PUT/PATCH flows as you add new routes
- Swap in persistent caching (Redis/Memcached/Workers KV) when scaling beyond a single node
- Wire D1 bindings inside `src/worker.ts` for full edge deployment
- Import the Postman collection and adapt payloads for your tenants/stores

Happy building! 🚀
