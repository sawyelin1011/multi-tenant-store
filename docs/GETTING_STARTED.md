# Getting Started with Digital Commerce Platform

Complete beginner's guide to setting up and using the Digital Commerce Platform with both Express.js and Cloudflare Workers support.

## Quick Start (5 minutes)

### Option 1: Local Express Development (Simplest)

```bash
# Clone and install
git clone <repository>
cd digital-commerce-platform
npm install

# Setup database
cp .env.example .env
npm run migrate

# Start development server
npm run dev

# API is ready at http://localhost:3000
curl http://localhost:3000/health
```

### Option 2: Cloudflare Workers Development

```bash
# Install dependencies
npm install

# Authenticate with Cloudflare
wrangler login

# Start local Workers development
npm run cf:dev

# API is ready at http://localhost:8787
curl http://localhost:8787/health
```

## Documentation Guide

Choose your path based on your needs:

### 👨‍💻 For Developers

**Getting Started:**
1. [Cloudflare Dev Setup Guide](./cloudflare-dev-setup.md) - Local development with Workers
2. [README.md](../README.md) - Project overview and features

**Building & Deploying:**
1. [Cloudflare Migration Guide](./cloudflare-migration.md) - Complete Workers migration path
2. [API.md](../API.md) - REST API reference
3. [ARCHITECTURE.md](../ARCHITECTURE.md) - System design and patterns

**Extending with Code:**
1. [Plugin Development Guide](./plugin-development.md) - Create custom functionality
2. [PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md) - Plugin system details

### 🎨 For UI/UX Designers

**Theming & Components:**
1. [UI Theming with shadcn/ui](./ui-theming-with-shadcn.md) - Dashboard customization
2. [shadcn/ui Documentation](https://ui.shadcn.com/) - Component reference

**Admin Dashboard:**
- Located in `src/admin-ui/` (if included)
- Uses React + shadcn/ui components
- Fully customizable per tenant

### 🏗️ For DevOps/Infrastructure

**Deployment:**
1. [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification
2. [Deployment Guide](../DEPLOYMENT.md) - Production deployment steps
3. [Cloudflare Migration Guide](./cloudflare-migration.md#deployment) - Workers deployment

**Infrastructure:**
- Express: Docker containers, traditional cloud
- Workers: Cloudflare platform (serverless)
- Database: PostgreSQL (Express) or D1 SQLite (Workers)
- Storage: S3/local (Express) or R2 (Workers)

### 📊 For Operations/Business

**Managing the Platform:**
- Admin Dashboard at `/api/admin/` endpoints
- Tenant management and configuration
- Plugin management and settings
- Order and payment tracking
- Integration management

## Learning Path

### Beginner (Week 1)

**Day 1-2:**
- [ ] Read [README.md](../README.md) overview
- [ ] Understand multi-tenant architecture
- [ ] Learn about plugin system

**Day 3-4:**
- [ ] Setup local Express development
- [ ] Create test tenant
- [ ] Explore API endpoints
- [ ] Review sample data

**Day 5-7:**
- [ ] Try Cloudflare Workers setup
- [ ] Compare Express vs Workers
- [ ] Read [Cloudflare Migration Guide](./cloudflare-migration.md)

### Intermediate (Week 2-3)

**Week 2:**
- [ ] Build first custom plugin
- [ ] Follow [Plugin Development Guide](./plugin-development.md)
- [ ] Check [example plugin](../examples/stripe-plugin/)
- [ ] Create plugin manifest
- [ ] Implement plugin hooks

**Week 3:**
- [ ] Create plugin UI components
- [ ] Learn shadcn/ui in [UI Guide](./ui-theming-with-shadcn.md)
- [ ] Customize admin dashboard
- [ ] Test plugin locally

### Advanced (Week 4+)

**Topics:**
- [ ] Multi-database support (PostgreSQL + D1)
- [ ] Performance optimization for Workers
- [ ] Data migration utilities
- [ ] Advanced plugin patterns
- [ ] Custom workflow builders
- [ ] Integration development

## Architecture Overview

### What is This Platform?

A **multi-tenant digital commerce platform** that lets you:

✅ **Create multiple independent stores** (tenants) on one platform
✅ **Support any digital product type** (games, software, courses, etc.)
✅ **Extend with plugins** without modifying core code
✅ **Deploy globally** with Cloudflare Workers edge computing
✅ **Manage everything from API** or admin dashboard

### Core Concepts

#### 1. Multi-Tenancy

Each store is completely isolated:

```
Platform
├── Store A (mystore.com)
│   ├── Products
│   ├── Orders
│   ├── Customers
│   └── Plugins
├── Store B (yourstore.com)
│   ├── Products
│   ├── Orders
│   ├── Customers
│   └── Plugins
└── Store C (theirstore.com)
```

Every query is filtered by `tenant_id` for complete isolation.

#### 2. Plugin System

Extend functionality without touching core code:

```
Product Created Event
    ↓
Plugin A: Validates product
Plugin B: Sends webhook
Plugin C: Generates SKU
    ↓
Product Saved
```

#### 3. Flexible Product Types

Define custom fields for different product types:

```
Product Type: Video Game
├── Title (text)
├── Description (rich text)
├── Genre (select: action, puzzle, etc.)
└── Download Files (file upload)

Product Type: Online Course
├── Title (text)
├── Description (rich text)
├── Instructor (text)
├── Duration Hours (number)
└── Video URL (url)
```

#### 4. Dual Runtime Support

Run on **Express (traditional)** or **Workers (edge)**:

```
Express Runtime          Workers Runtime
├── PostgreSQL          ├── D1 SQLite
├── Redis              ├── KV Cache
└── S3 Storage         └── R2 Storage

Same API Endpoints
Same Business Logic
Different Infrastructure
```

## Common Tasks

### Create a New Tenant

**Via API:**
```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "slug": "my-store",
    "domain": "mystore.example.com"
  }'
```

**Via Admin UI:**
1. Go to Admin → Tenants
2. Click "New Tenant"
3. Fill in name and domain
4. Click "Create"

### Create a Product Type

**Via API:**
```bash
curl -X POST http://localhost:3000/api/my-store/admin/product-types \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "digital-product",
    "schema": {
      "fields": [
        {
          "name": "title",
          "type": "text",
          "label": "Product Title",
          "required": true
        },
        {
          "name": "files",
          "type": "file",
          "label": "Download Files"
        }
      ]
    }
  }'
```

### Install a Plugin

**Via API:**
```bash
curl -X POST http://localhost:3000/api/my-store/admin/plugins/stripe/install \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -d '{"version": "2.0.0"}'
```

**Via Admin UI:**
1. Go to Store Admin → Plugins
2. Find "Stripe Payment Gateway"
3. Click "Install"
4. Configure settings
5. Click "Enable"

### Build a Custom Plugin

1. Create plugin structure:
```bash
mkdir my-plugin
cd my-plugin
npm init -y
```

2. Create `plugin.json` manifest
3. Implement hooks in `src/hooks/`
4. Create UI in `src/admin/`
5. Package and publish

See [Plugin Development Guide](./plugin-development.md) for full details.

## Next Steps

### For New Users
1. **Set up local development** using [Cloudflare Dev Setup](./cloudflare-dev-setup.md)
2. **Create a test tenant** via API or admin UI
3. **Explore API endpoints** in [API Documentation](../API.md)
4. **Try a sample plugin** from [examples/stripe-plugin](../examples/stripe-plugin/)

### For Developers
1. **Read the architecture** in [ARCHITECTURE.md](../ARCHITECTURE.md)
2. **Build a custom plugin** following [Plugin Development Guide](./plugin-development.md)
3. **Understand performance** in [Cloudflare Migration Guide](./cloudflare-migration.md#performance-considerations)

### For DevOps Teams
1. **Plan deployment** with [Deployment Guide](../DEPLOYMENT.md)
2. **Setup staging environment** following [Cloudflare Dev Setup](./cloudflare-dev-setup.md#configuration)
3. **Configure monitoring** with [Wrangler tail](./cloudflare-dev-setup.md#wrangler-logs)

### For Designers
1. **Learn shadcn/ui** components in [UI Theming Guide](./ui-theming-with-shadcn.md)
2. **Customize dashboard colors** with CSS variables
3. **Create plugin UI components** following component patterns

## Troubleshooting

### "Port 3000 is already in use"
```bash
# Use different port
PORT=3001 npm run dev

# Or kill the process on port 3000
lsof -ti:3000 | xargs kill -9
```

### "Database connection failed"
```bash
# Check PostgreSQL is running
psql -h localhost -U postgres

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### "Authentication failed"
```bash
# Check JWT secrets are set
echo $ADMIN_JWT_SECRET

# Generate test token
node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.sign({role:'admin'}, 'dev-admin-secret'));
"
```

### "Workers deployment failed"
```bash
# Verify Cloudflare authentication
wrangler whoami

# Check wrangler.toml bindings
grep -A 3 "d1_databases" wrangler.toml

# See deployment logs
wrangler tail --env production
```

## Support Resources

### Documentation
- [README.md](../README.md) - Project overview
- [API.md](../API.md) - Complete API reference
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
- [PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md) - Plugin API details

### Guides
- [Cloudflare Migration Guide](./cloudflare-migration.md) - Express to Workers migration
- [Cloudflare Dev Setup](./cloudflare-dev-setup.md) - Local development guide
- [Plugin Development Guide](./plugin-development.md) - Build custom plugins
- [UI Theming with shadcn/ui](./ui-theming-with-shadcn.md) - Dashboard customization

### Code Examples
- [Stripe Plugin Example](../examples/stripe-plugin/) - Full plugin implementation
- [src/services/](../src/services/) - Service layer implementation
- [src/routes/](../src/routes/) - API route examples

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [Hono.js Framework](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## FAQ

**Q: Can I run Express and Workers simultaneously?**
A: Yes! Different ports (3000 vs 8787). Good for development and testing.

**Q: Do I have to migrate from Express to Workers?**
A: No. Keep Express or switch to Workers anytime. Both runtimes are fully supported.

**Q: Can I share plugins between Express and Workers?**
A: Yes! Plugin code is runtime-agnostic. Same hooks work on both.

**Q: What's the maximum file size I can upload?**
A: Configure via `MAX_FILE_SIZE` env var (default 100MB).

**Q: How many tenants can I have?**
A: Unlimited. Each tenant has complete data isolation.

**Q: Can I customize the admin dashboard?**
A: Yes! Use shadcn/ui components to theme. See [UI Guide](./ui-theming-with-shadcn.md).

**Q: What payment gateways are supported?**
A: Any! Use plugin system to add Stripe, PayPal, Paddle, etc.

**Q: Can I export customer data?**
A: Yes. Use data migration utility or API endpoints with pagination.

## Getting Help

1. **Check documentation** - Most answers in docs
2. **Search examples** - See [examples/stripe-plugin](../examples/stripe-plugin/)
3. **Review tests** - Test files show usage patterns
4. **Check error messages** - Descriptive error responses
5. **Read logs** - `npm run cf:dev` shows real-time logs

## What's Next?

Once you're familiar with basics:

1. **Build your first plugin** - 1-2 hours
2. **Deploy to staging** - 30 minutes
3. **Deploy to production** - 1 hour
4. **Create custom workflows** - As needed
5. **Add integrations** - Payment gateways, email, etc.

**Expected time to first production deployment: 1-2 days**

Ready to begin? Start with [Cloudflare Dev Setup Guide](./cloudflare-dev-setup.md)!
