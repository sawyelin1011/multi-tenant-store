# Digital Commerce Platform - Architecture Documentation

## System Overview

The Digital Commerce Platform is a flexible, multi-tenant digital commerce solution that supports ANY type of digital products through a combination of:

1. **Multi-Tenant Architecture** - Complete data isolation with shared infrastructure
2. **Plugin System** - Extensible hooks for all major events
3. **Zero Hardcoding** - Database-driven configuration for all entities
4. **Dynamic Product Types** - Define product types on-the-fly with custom fields
5. **EAV Pattern** - Entity-Attribute-Value for flexible product attributes

## Core Principles

### 1. Multi-Tenancy
Every operation is scoped to a tenant:
- Tenant resolution from URL slug or domain
- Row-level security through tenant_id filtering
- Separate settings, branding, and plugins per tenant
- Admin per store + Super admin for platform

### 2. Zero Hardcoding
Everything configurable via API/UI:
- Product types defined in `product_types` table with JSON schema
- Workflows stored as JSON with step definitions
- Delivery methods with configurable templates
- Pricing rules with flexible conditions
- All settings in JSONB fields

### 3. Plugin Architecture
Extensibility through:
- **Hooks**: before/after events for products, orders, payments, etc.
- **API Endpoints**: Plugins can register custom endpoints
- **Admin UI**: Custom React components for plugin settings
- **Database**: Plugins can add migrations
- **Manifest-Based**: All plugin metadata in plugin.json

### 4. Dynamic Product Types
Product types stored as JSON schemas:
```json
{
  "fields": [
    {
      "name": "title",
      "type": "text",
      "label": "Product Title",
      "required": true,
      "validation": { "minLength": 3, "maxLength": 255 }
    },
    {
      "name": "platform",
      "type": "select",
      "options": [
        { "value": "steam", "label": "Steam" },
        { "value": "epic", "label": "Epic Games" }
      ]
    }
  ]
}
```

### 5. EAV Pattern
For flexible attributes:
- `products` table: Core product data
- `product_attributes` table: Key-value pairs for custom fields
- `product_variants` table: Product variants with own attributes

## Database Design

### Multi-Tenant Core
```
tenants
├── id (UUID)
├── slug (unique, URL-friendly)
├── name
├── domain (custom domain)
├── subdomain (multi-domain support)
├── status (active/suspended/deleted)
├── plan (free/basic/pro/enterprise)
├── settings (JSONB - all store config)
├── branding (JSONB - colors, logos, fonts)

tenant_users
├── tenant_id
├── user_id
├── role
├── permissions (JSONB)
```

### Product System
```
product_types (define structure)
├── tenant_id
├── slug
├── schema (JSONB - field definitions)
├── ui_config (JSONB - admin form layout)
├── workflows (JSONB - default workflows)

products (instances)
├── tenant_id
├── product_type_id
├── name, slug, status
├── metadata (JSONB - base fields)

product_attributes (EAV pattern)
├── product_id
├── attribute_key
├── attribute_value (JSONB)
├── attribute_type

product_variants
├── product_id
├── sku
├── attributes (JSONB)
├── price_data (JSONB)
├── inventory_data (JSONB)
├── delivery_data (JSONB)
```

### Plugin System
```
plugins (available plugins)
├── slug, name, version
├── manifest (JSONB - hooks, endpoints, permissions)
├── status (available/installed/active/deprecated)

tenant_plugins (per-tenant installation)
├── tenant_id
├── plugin_id
├── status (active/inactive)
├── config (JSONB - plugin settings)

plugin_hooks (hook registrations)
├── plugin_id
├── hook_name
├── handler_function
├── priority
```

### Workflow System
```
workflows
├── tenant_id
├── name
├── entity_type (order, product, user)
├── trigger (on_create, on_update, on_status_change, scheduled)
├── steps (JSONB array - step definitions)

workflow_executions (execution tracking)
├── workflow_id
├── entity_id
├── status (pending, running, completed, failed)
├── execution_data (JSONB - runtime context)
```

### Delivery System
```
delivery_methods
├── tenant_id
├── type (email, webhook, file, manual, plugin)
├── config (JSONB - method-specific config)
├── template (JSONB - message/payload template)

deliveries (delivery tracking)
├── order_id
├── order_item_id
├── delivery_method_id
├── status (pending, processing, delivered, failed)
├── delivery_data (JSONB - keys, links, etc.)
├── error_log (JSONB - error tracking)
```

### Pricing System
```
pricing_rules
├── entity_type (product, category, global)
├── rule_type (role_based, quantity, time_based, subscription)
├── conditions (JSONB - when to apply)
├── price_modifier (JSONB - how to modify)
├── priority

user_roles
├── tenant_id
├── name, slug
├── permissions (JSONB)
├── pricing_tier
```

### Orders
```
orders
├── tenant_id
├── user_id
├── order_number
├── status
├── items_data (JSONB - denormalized for performance)
├── pricing_data (JSONB - price breakdown)
├── payment_data (JSONB - payment details)
├── customer_data (JSONB - customer info)

order_items
├── order_id
├── product_id
├── variant_id
├── quantity
├── unit_price
├── delivery_status
```

## API Architecture

### Routing Structure
```
/api/admin
  /tenants                    - Super admin tenant management

/api/{tenant_slug}/admin
  /product-types              - Product type management
  /products                   - Product CRUD
  /workflows                  - Workflow builder
  /delivery-methods           - Delivery configuration
  /plugins                    - Plugin management
  /orders                     - Order management
  /integrations              - Integration management
  /payment-gateways          - Payment gateway configuration

/api/{tenant_slug}/storefront
  /products                   - Customer product listing
  
/api/{tenant_slug}/plugins
  /{plugin_name}/hooks/{hook_name}  - Plugin endpoints
  /{plugin_name}/webhook            - Webhook endpoints
```

### Request/Response Format
```json
{
  "success": true,
  "data": { /* actual response data */ },
  "message": "Optional success message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### Authentication
- **Admin**: JWT with admin user claims
- **Tenant**: JWT with user claims + tenant_id
- **Public**: No auth needed for storefront product listing

### Tenant Resolution
1. Extract tenant_slug from URL params
2. Query `tenants` table by slug
3. Verify status = 'active'
4. Attach tenant object to request
5. Use tenant_id for all subsequent queries

## Service Layer

### TenantService
- CRUD operations on tenants
- Settings management
- Branding configuration

### ProductTypeService
- Create/manage product type definitions
- Schema validation
- UI configuration

### ProductService
- Product CRUD
- EAV attribute management
- Product variants

### PluginService
- Plugin installation/uninstallation
- Configuration management
- Activation/deactivation

### WorkflowService
- Workflow CRUD
- Workflow execution tracking
- Step management

### DeliveryService
- Delivery method CRUD
- Template management
- Delivery tracking

### OrderService
- Order CRUD
- Order item management
- Order tracking

### IntegrationService
- Integration CRUD
- Field mapping
- Webhook configuration

### PaymentService
- Payment gateway CRUD
- Credential management
- Transaction tracking

## Middleware Stack

### 1. Security
```typescript
helmet()              // Security headers
cors()               // CORS configuration
express.json()       // JSON parsing with size limits
```

### 2. Tenant Resolution
```typescript
resolveTenant()              // From URL slug
resolveTenantByDomain()      // From domain header
```

### 3. Authentication
```typescript
verifyAdminToken()           // Admin JWT verification
verifyTenantToken()          // Tenant JWT verification
optionalTenantToken()        // Optional auth (storefront)
```

### 4. Error Handling
```typescript
errorHandler()              // Centralized error handling
```

## Error Handling

### Error Classes
```typescript
AppError(statusCode, message)           // Base error
ValidationError(message)                // 400
NotFoundError(message)                  // 404
UnauthorizedError(message)              // 401
ForbiddenError(message)                 // 403
ConflictError(message)                  // 409
```

### Error Flow
1. Middleware/Route throws error
2. Express catches it via express-async-errors
3. errorHandler middleware processes it
4. Sends standardized JSON response

## Plugin System Architecture

### Plugin Lifecycle
1. **Registration**: Plugin manifest loaded
2. **Installation**: Plugin installed to tenant
3. **Activation**: Plugin hooks registered
4. **Execution**: Hooks called at appropriate times
5. **Deactivation**: Plugin hooks unregistered

### Hook System
```typescript
// Hook signature
export default async function hookName(ctx: PluginContext, data: any) {
  // Can modify data (before hooks) or trigger actions (after hooks)
  return data;  // Before hooks return modified data
  // After hooks don't return, just trigger actions
}
```

### Hook Execution
- Hooks stored with priority (lower = earlier execution)
- Multiple plugins can hook same event
- Executed in order of priority
- After hooks: executed asynchronously
- Before hooks: must complete before proceeding

### Plugin Context
```typescript
interface PluginContext {
  store: Tenant
  tenantId: string
  plugin: TenantPlugin
  db: DatabaseAccess
  events: EventEmitter
  http: HttpClient
  email: EmailService
  cache: CacheService
  queue: JobQueue
  plugins: PluginManager
  logger: Logger
}
```

## Data Flow Examples

### Creating a Product
1. Client POSTs to `/api/{tenant}/admin/products`
2. JWT verified, tenant resolved
3. ProductService.createProduct() called
4. Product inserted into products table
5. Product attributes set (EAV pattern)
6. before_product_create hook called
7. Product returned to client

### Processing a Payment
1. Client requests payment processing
2. before_payment_process hook called
3. Stripe plugin receives hook, validates payment
4. Stripe payment intent created
5. Client completes payment
6. Webhook received from Stripe
7. after_payment_success hook called
8. Order status updated
9. Delivery workflow triggered
10. Email delivery method sends keys

### Executing a Workflow
1. Trigger event occurs (e.g., order.created)
2. Workflow fetched from database
3. Execution created (workflow_executions)
4. Steps executed sequentially
5. Conditions evaluated for branching
6. Actions executed (email, webhook, etc.)
7. Execution status updated
8. Completed/failed marked

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Load balancer distributes requests
- Database connection pooling (PgBounce)
- Session storage in Redis (can be added)

### Vertical Scaling
- Database indexes on hot columns
- JSONB fields indexed efficiently
- Connection pool tuning
- Query optimization

### Caching
- Redis integration ready
- Session caching
- Query result caching
- Plugin output caching

### Performance Optimization
- Database indexes on:
  - tenant_id (every query)
  - slug fields (lookups)
  - status fields (filtering)
  - created_at (sorting)
- JSONB operators for efficient queries
- Pagination for large result sets

## Security Architecture

### Tenant Isolation
- Every query filters by tenant_id
- Cannot cross-tenant operations
- Row-level security ready

### Authentication
- JWT tokens (no session state)
- Separate secrets for admin/tenant
- Token expiration enforced

### Authorization
- Role-based permissions
- Permission checks in middleware
- Plugin permission system

### Data Protection
- Credentials encrypted (can be added)
- HTTPS required in production
- SQL injection prevention (parameterized)
- CORS configured

## Integration Points

### Third-Party Services
- **Payment Gateways**: Stripe, PayPal, etc.
- **Email Services**: SendGrid, Mailgun, etc.
- **Storage**: AWS S3, Google Cloud Storage
- **Analytics**: Segment, Mixpanel
- **CRM**: Salesforce, HubSpot

### External APIs
- Webhooks from payment providers
- Sync from product providers
- Push to fulfillment services

### Custom Integrations
- Field mapping for data transformation
- Webhook configuration per integration
- Sync scheduling (cron expressions)
- Error handling and retry logic

## Deployment Architecture

### Development
- Local PostgreSQL
- Node dev server (with reload)
- TypeScript compilation on-the-fly

### Production
- Docker container
- Managed PostgreSQL (RDS, Cloud SQL)
- Load balancer (ALB, nginx)
- Redis for caching
- CDN for static assets
- SSL/TLS termination

### Monitoring
- Application logs
- Database query logs
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Uptime monitoring

## Future Extensibility

### Ready For
- Event sourcing (audit trail)
- Messaging queue (Bull, RabbitMQ)
- Real-time updates (WebSockets)
- Batch jobs (background workers)
- Machine learning (recommendations)
- Analytics (reporting engine)
- Mobile APIs (native apps)
- GraphQL layer
- API versioning

### Potential Enhancements
- Role-based access control (RBAC)
- Audit logging
- Multi-language support (i18n)
- A/B testing framework
- Content management system
- Marketing automation
- Subscription management
- Affiliate system
