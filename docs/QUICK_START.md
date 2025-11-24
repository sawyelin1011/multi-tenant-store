# Quick Start Guide

Get your MTC Platform running in minutes with this comprehensive quick start guide. Whether you're a store owner, plugin developer, or platform operator, this guide will get you up and running quickly.

## 🚀 5-Minute Quick Start

### Option 1: Local Express Development (Simplest)

```bash
# Clone and install
git clone <repository>
cd mtc-platform
npm install

# Setup environment
cp .env.example .env
npm run db:generate
npm run db:migrate

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
npx wrangler login

# Start local Workers development
npm run cf:dev

# API is ready at http://localhost:8787
curl http://localhost:8787/health
```

## 🎯 Choose Your Path

### 👥 For Store Owners & End Users

**Your Goal**: Set up your store and start selling digital products

**Quick Steps**:
1. **[Setup Your First Store](#setup-your-first-store)** - 5 minutes
2. **[Create Your First Product](#create-your-first-product)** - 3 minutes
3. **[Install Essential Plugins](#install-essential-plugins)** - 10 minutes
4. **[Configure Payment Gateway](#configure-payment-gateway)** - 5 minutes

**Total Time**: ~30 minutes to a fully functional store

### 🔌 For Plugin Developers

**Your Goal**: Build custom functionality for the platform

**Quick Steps**:
1. **[Development Setup](#development-setup)** - 10 minutes
2. **[Create Your First Plugin](#create-your-first-plugin)** - 15 minutes
3. **[Test Plugin Locally](#test-plugin-locally)** - 5 minutes
4. **[Package for Distribution](#package-for-distribution)** - 10 minutes

**Total Time**: ~40 minutes to first working plugin

### 🏗️ For Platform Operators

**Your Goal**: Deploy and manage the platform infrastructure

**Quick Steps**:
1. **[Local Development Setup](#local-development-setup)** - 15 minutes
2. **[Configure Multi-Tenant Setup](#configure-multi-tenant-setup)** - 10 minutes
3. **[Deploy to Staging](#deploy-to-staging)** - 20 minutes
4. **[Setup Monitoring](#setup-monitoring)** - 15 minutes

**Total Time**: ~1 hour to staging deployment

---

## 🏪 Setup Your First Store

### Step 1: Create a Tenant

```bash
# Using API key authentication
curl -X POST http://localhost:3000/api/tenants \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Digital Store",
    "slug": "my-digital-store",
    "domain": "my-store.example.com"
  }'
```

**Response**:
```json
{
  "success": true,
  "code": "TENANT_CREATED",
  "message": "Tenant created successfully",
  "data": {
    "id": "tenant_abc123",
    "name": "My Digital Store",
    "slug": "my-digital-store",
    "domain": "my-store.example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Step 2: Create a Store

```bash
# Replace TENANT_ID with the ID from step 1
curl -X POST http://localhost:3000/api/stores \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant_abc123",
    "name": "Main Store",
    "type": "digital",
    "currency": "USD"
  }'
```

### Step 3: Create Admin User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@my-store.example.com",
    "role": "admin"
  }'
```

## 📦 Create Your First Product

### Step 1: Define Product Type

```bash
curl -X POST http://localhost:3000/api/product-types \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "store_xyz789",
    "slug": "digital-download",
    "name": "Digital Download",
    "schema": {
      "fields": [
        {
          "name": "title",
          "type": "text",
          "label": "Product Title",
          "required": true
        },
        {
          "name": "description",
          "type": "richtext",
          "label": "Description"
        },
        {
          "name": "price",
          "type": "number",
          "label": "Price (USD)",
          "required": true
        },
        {
          "name": "download_files",
          "type": "file",
          "label": "Download Files"
        }
      ]
    }
  }'
```

### Step 2: Create Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "store_xyz789",
    "product_type_id": "ptype_def456",
    "name": "My First Digital Product",
    "slug": "my-first-digital-product",
    "price": 29.99,
    "data": {
      "title": "My First Digital Product",
      "description": "An amazing digital product that helps you succeed",
      "download_files": [
        {
          "name": "product-guide.pdf",
          "url": "https://storage.example.com/guide.pdf",
          "size": 2048576
        }
      ]
    },
    "status": "active"
  }'
```

## 🔌 Install Essential Plugins

### Install Stripe Payment Gateway

```bash
curl -X POST http://localhost:3000/api/stores/store_xyz789/plugins/stripe/install \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.0.0",
    "config": {
      "publishable_key": "pk_test_...",
      "secret_key": "sk_test_...",
      "webhook_secret": "whsec_..."
    }
  }'
```

### Install Email Notification Plugin

```bash
curl -X POST http://localhost:3000/api/stores/store_xyz789/plugins/email/install \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.5.0",
    "config": {
      "provider": "sendgrid",
      "api_key": "SG.xxxxx",
      "from_email": "noreply@my-store.example.com",
      "from_name": "My Digital Store"
    }
  }'
```

## 💳 Configure Payment Gateway

### Test Your Setup

```bash
# Create a test order
curl -X POST http://localhost:3000/api/orders \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "store_xyz789",
    "customer_email": "customer@example.com",
    "items": [
      {
        "product_id": "prod_abc123",
        "quantity": 1,
        "price": 29.99
      }
    ],
    "total": 29.99,
    "currency": "USD"
  }'
```

### Process Payment

```bash
# Process payment via Stripe
curl -X POST http://localhost:3000/api/orders/order_def456/pay \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "stripe",
    "payment_token": "tok_test_..."
  }'
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd mtc-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Database Setup

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with test data (optional)
npm run db:seed
```

### Start Development

```bash
# Express development
npm run dev

# Workers development
npm run cf:dev

# Both simultaneously (different terminals)
npm run dev    # Terminal 1 (port 3000)
npm run cf:dev # Terminal 2 (port 8787)
```

## 🔌 Create Your First Plugin

### Plugin Structure

```bash
mkdir my-awesome-plugin
cd my-awesome-plugin

# Create plugin manifest
cat > plugin.json << 'EOF'
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "An awesome plugin for MTC Platform",
  "author": "Your Name",
  "license": "MIT",
  "main": "src/index.js",
  "hooks": [
    "product.created",
    "order.completed"
  ],
  "permissions": [
    "read:products",
    "read:orders"
  ]
}
EOF

# Create basic plugin code
mkdir -p src/hooks
cat > src/hooks/product-created.js << 'EOF'
export default async function productCreated(product, context) {
  console.log(`New product created: ${product.name}`);
  
  // Send notification, update external system, etc.
  await context.services.email.send({
    to: 'admin@example.com',
    subject: 'New Product Created',
    body: `Product ${product.name} has been created.`
  });
}
EOF
```

### Test Plugin Locally

```bash
# Install plugin in development mode
npm run plugin:install ./my-awesome-plugin

# Restart development server
npm run dev

# Test plugin functionality
curl -X POST http://localhost:3000/api/products \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"store_id": "test", "name": "Test Product"}'
```

## 🚀 Deploy to Staging

### Option 1: Express Deployment

```bash
# Build for production
npm run build

# Deploy to your server
scp -r dist/ user@server:/var/www/mtc-platform/
scp package*.json user@server:/var/www/mtc-platform/
ssh user@server 'cd /var/www/mtc-platform && npm ci --production'
```

### Option 2: Cloudflare Workers

```bash
# Deploy to Workers
npm run cf:deploy

# For production environment
npm run cf:deploy -- --env production
```

## 📊 Setup Monitoring

### Express Monitoring

```bash
# Install monitoring dependencies
npm install @sentry/node

# Add to .env
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

### Workers Monitoring

```bash
# View real-time logs
npx wrangler tail

# View production logs
npx wrangler tail --env production
```

## 🔍 Troubleshooting

### Common Issues

#### "Port 3000 is already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

#### "Database connection failed"
```bash
# Check SQLite file exists
ls -la db.sqlite

# Recreate database
rm db.sqlite
npm run db:migrate
npm run db:seed
```

#### "Authentication failed"
```bash
# Check API key
echo $SUPER_ADMIN_API_KEY

# Generate new key
node -e "console.log('sk_test_' + Math.random().toString(36).substr(2, 9))"
```

#### "Plugin installation failed"
```bash
# Check plugin structure
ls -la my-awesome-plugin/

# Validate plugin.json
cat my-awesome-plugin/plugin.json | jq .

# Check logs for errors
npm run dev 2>&1 | grep -i error
```

### Health Checks

```bash
# Express health
curl http://localhost:3000/health

# Workers health
curl http://localhost:8787/health

# Database connectivity
curl -H "x-api-key: $SUPER_ADMIN_API_KEY" \
  http://localhost:3000/api/health/db
```

## 📚 Next Steps

### For Store Owners
- [Store Templates Guide](./TEMPLATES/STORE_TEMPLATES.md) - Customize your store appearance
- [Product Templates Guide](./TEMPLATES/PRODUCT_TEMPLATES.md) - Create product templates
- [API Reference](./API/README.md) - Learn advanced API usage

### For Plugin Developers
- [Plugin Development Guide](./PLUGINS/DEVELOPMENT_GUIDE.md) - Advanced plugin development
- [Plugin API Reference](./PLUGINS/API_REFERENCE.md) - Complete API documentation
- [Plugin Examples](./PLUGINS/EXAMPLES.md) - Real-world plugin examples

### For Platform Operators
- [Deployment Guide](./DEPLOYMENT/PRODUCTION.md) - Production deployment
- [Security Guidelines](./DEVELOPMENT/SECURITY.md) - Security best practices
- [Monitoring Guide](./DEPLOYMENT/README.md) - Monitoring and observability

## 🆘 Getting Help

1. **Documentation**: Check relevant sections in this docs
2. **Examples**: See `examples/` directory for code samples
3. **Community**: Check GitHub Issues and Discussions
4. **Support**: Review troubleshooting section above

## 🎯 Success Checklist

- [ ] Platform running locally (Express or Workers)
- [ ] First tenant created
- [ ] First store created
- [ ] First product created
- [ ] Payment gateway configured
- [ ] Test order processed successfully
- [ ] Basic monitoring setup
- [ ] Backup strategy defined

**Expected Time to Complete**: 30-60 minutes  
**Support Level**: Full documentation and examples provided

---

**Ready to dive deeper?** Check out the [full documentation](./README.md) for comprehensive guides on all aspects of the MTC Platform.