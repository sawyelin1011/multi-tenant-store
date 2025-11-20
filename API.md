# API Documentation

Complete API reference for the MTC Platform.

## Authentication

### Admin Authentication

For super admin operations, include an admin JWT token:

```
Authorization: Bearer {admin_jwt_token}
```

### Tenant Authentication

For tenant-specific operations, include a tenant JWT token:

```
Authorization: Bearer {tenant_jwt_token}
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message (optional)"
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

## Status Codes

- `200 OK`: Successful GET/PUT/DELETE request
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists or conflict
- `500 Internal Server Error`: Server error

## Pagination

List endpoints support pagination:

```
GET /api/endpoint?page=1&limit=50
```

Response includes:

```json
{
  "success": true,
  "data": {
    "data": [ /* items */ ],
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

## Super Admin API

### Tenants

#### Create Tenant
```http
POST /api/admin/tenants
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "slug": "my-store",
  "name": "My Store",
  "domain": "mystore.example.com",
  "subdomain": "mystore",
  "plan": "pro"
}
```

Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "my-store",
    "name": "My Store",
    "domain": "mystore.example.com",
    "subdomain": "mystore",
    "status": "active",
    "plan": "pro",
    "settings": {},
    "branding": {},
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

#### List Tenants
```http
GET /api/admin/tenants?page=1&limit=50
Authorization: Bearer {admin_token}
```

Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "data": [ /* tenant objects */ ],
    "total": 25,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

#### Get Tenant
```http
GET /api/admin/tenants/{id}
Authorization: Bearer {admin_token}
```

#### Update Tenant
```http
PUT /api/admin/tenants/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Store Name",
  "plan": "enterprise",
  "status": "suspended"
}
```

#### Delete Tenant
```http
DELETE /api/admin/tenants/{id}
Authorization: Bearer {admin_token}
```

## Tenant Admin API

### Product Types

#### Create Product Type
```http
POST /api/{tenant_slug}/admin/product-types
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Game Keys",
  "slug": "game-keys",
  "icon": "🎮",
  "category": "digital-products",
  "schema": {
    "fields": [
      {
        "name": "title",
        "type": "text",
        "label": "Game Title",
        "required": true
      },
      {
        "name": "description",
        "type": "rich_text",
        "label": "Description",
        "required": false
      },
      {
        "name": "platform",
        "type": "select",
        "label": "Platform",
        "options": [
          { "value": "steam", "label": "Steam" },
          { "value": "epic", "label": "Epic Games" }
        ]
      },
      {
        "name": "game_key",
        "type": "text",
        "label": "Game Key",
        "required": true
      }
    ]
  }
}
```

Response: `201 Created`

#### List Product Types
```http
GET /api/{tenant_slug}/admin/product-types?page=1&limit=50
Authorization: Bearer {tenant_token}
```

#### Get Product Type
```http
GET /api/{tenant_slug}/admin/product-types/{id}
```

#### Update Product Type
```http
PUT /api/{tenant_slug}/admin/product-types/{id}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Game Licenses",
  "schema": { /* updated schema */ }
}
```

#### Delete Product Type
```http
DELETE /api/{tenant_slug}/admin/product-types/{id}
Authorization: Bearer {tenant_token}
```

### Products

#### Create Product
```http
POST /api/{tenant_slug}/admin/products
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "product_type_id": "uuid",
  "name": "Cyberpunk 2077",
  "slug": "cyberpunk-2077",
  "status": "draft",
  "metadata": {
    "price": 59.99,
    "currency": "USD"
  }
}
```

Response: `201 Created`

#### List Products
```http
GET /api/{tenant_slug}/admin/products?page=1&limit=50&product_type_id=uuid&status=active
Authorization: Bearer {tenant_token}
```

#### Get Product
```http
GET /api/{tenant_slug}/admin/products/{id}
```

Returns product with attributes:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "product_type_id": "uuid",
    "name": "Cyberpunk 2077",
    "slug": "cyberpunk-2077",
    "status": "active",
    "metadata": {},
    "attributes": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "attribute_key": "game_key",
        "attribute_value": "XXXX-YYYY-ZZZZ",
        "attribute_type": "text"
      }
    ],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Update Product
```http
PUT /api/{tenant_slug}/admin/products/{id}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Updated Product Name",
  "status": "active"
}
```

#### Set Product Attribute
```http
POST /api/{tenant_slug}/admin/products/{id}/attributes/{key}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "value": "XXXX-YYYY-ZZZZ",
  "type": "text"
}
```

#### Get Product Attributes
```http
GET /api/{tenant_slug}/admin/products/{id}/attributes
```

#### Delete Product
```http
DELETE /api/{tenant_slug}/admin/products/{id}
Authorization: Bearer {tenant_token}
```

### Workflows

#### Create Workflow
```http
POST /api/{tenant_slug}/admin/workflows
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Order Fulfillment",
  "entity_type": "order",
  "trigger": "on_create",
  "steps": [
    {
      "id": "step-1",
      "type": "action",
      "action": "send_email",
      "config": {
        "template": "order_confirmation"
      }
    },
    {
      "id": "step-2",
      "type": "action",
      "action": "deliver_product",
      "config": {
        "delivery_method_id": "uuid"
      }
    }
  ]
}
```

#### List Workflows
```http
GET /api/{tenant_slug}/admin/workflows?page=1&limit=50
```

#### Get Workflow
```http
GET /api/{tenant_slug}/admin/workflows/{id}
```

#### Update Workflow
```http
PUT /api/{tenant_slug}/admin/workflows/{id}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Updated Workflow Name",
  "steps": [ /* updated steps */ ]
}
```

#### Delete Workflow
```http
DELETE /api/{tenant_slug}/admin/workflows/{id}
Authorization: Bearer {tenant_token}
```

### Delivery Methods

#### Create Delivery Method
```http
POST /api/{tenant_slug}/admin/delivery-methods
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Email Delivery",
  "type": "email",
  "config": {
    "from": "noreply@store.com",
    "subject": "Your Product Keys"
  },
  "template": {
    "subject": "Your Order #{order_number}",
    "body": "Here are your product keys: {keys}"
  }
}
```

#### List Delivery Methods
```http
GET /api/{tenant_slug}/admin/delivery-methods?page=1&limit=50
```

#### Get Delivery Method
```http
GET /api/{tenant_slug}/admin/delivery-methods/{id}
```

#### Update Delivery Method
```http
PUT /api/{tenant_slug}/admin/delivery-methods/{id}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Updated Email Delivery",
  "template": { /* updated template */ }
}
```

#### Delete Delivery Method
```http
DELETE /api/{tenant_slug}/admin/delivery-methods/{id}
Authorization: Bearer {tenant_token}
```

### Plugins

#### List Available Plugins
```http
GET /api/{tenant_slug}/admin/plugins?page=1&limit=50
```

#### List Installed Plugins
```http
GET /api/{tenant_slug}/admin/plugins?page=1&limit=50&installed=true
```

#### Install Plugin
```http
POST /api/{tenant_slug}/admin/plugins/{plugin_id}/install
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "config": {
    "api_key": "sk_test_..."
  }
}
```

#### Get Installed Plugin
```http
GET /api/{tenant_slug}/admin/plugins/installed/{plugin_id}
```

#### Update Plugin Config
```http
PUT /api/{tenant_slug}/admin/plugins/{plugin_id}/config
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "api_key": "sk_test_...",
  "webhook_secret": "..."
}
```

#### Enable Plugin
```http
POST /api/{tenant_slug}/admin/plugins/{plugin_id}/enable
Authorization: Bearer {tenant_token}
```

#### Disable Plugin
```http
POST /api/{tenant_slug}/admin/plugins/{plugin_id}/disable
Authorization: Bearer {tenant_token}
```

#### Uninstall Plugin
```http
DELETE /api/{tenant_slug}/admin/plugins/{plugin_id}
Authorization: Bearer {tenant_token}
```

### Orders

#### Create Order
```http
POST /api/{tenant_slug}/admin/orders
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "user_id": "uuid",
  "status": "pending",
  "customer_data": {
    "email": "customer@example.com",
    "name": "John Doe"
  }
}
```

#### List Orders
```http
GET /api/{tenant_slug}/admin/orders?page=1&limit=50&status=completed
```

#### Get Order
```http
GET /api/{tenant_slug}/admin/orders/{id}
```

Returns order with items:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "order_number": "ORD-001",
    "status": "completed",
    "customer_data": {},
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "quantity": 1,
        "unit_price": 29.99,
        "delivery_status": "delivered"
      }
    ]
  }
}
```

#### Update Order
```http
PUT /api/{tenant_slug}/admin/orders/{id}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "status": "completed"
}
```

#### Add Order Item
```http
POST /api/{tenant_slug}/admin/orders/{id}/items
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "product_id": "uuid",
  "quantity": 1,
  "unit_price": 29.99
}
```

### Integrations

#### Create Integration
```http
POST /api/{tenant_slug}/admin/integrations
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Game Key Provider",
  "integration_type": "game_key_provider",
  "credentials": {
    "api_key": "...",
    "api_url": "https://api.provider.com"
  },
  "field_mapping": {
    "sku": "external_sku",
    "price": "external_price"
  }
}
```

#### List Integrations
```http
GET /api/{tenant_slug}/admin/integrations?page=1&limit=50
```

#### Get Integration
```http
GET /api/{tenant_slug}/admin/integrations/{id}
```

#### Update Integration
```http
PUT /api/{tenant_slug}/admin/integrations/{id}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "config": { /* updated config */ }
}
```

#### Delete Integration
```http
DELETE /api/{tenant_slug}/admin/integrations/{id}
Authorization: Bearer {tenant_token}
```

### Payment Gateways

#### Create Payment Gateway
```http
POST /api/{tenant_slug}/admin/payment-gateways
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Stripe Gateway",
  "gateway_type": "stripe",
  "credentials": {
    "api_key": "sk_test_...",
    "secret_key": "..."
  },
  "config": {
    "live_mode": false
  }
}
```

#### List Payment Gateways
```http
GET /api/{tenant_slug}/admin/payment-gateways?page=1&limit=50
```

#### Get Payment Gateway
```http
GET /api/{tenant_slug}/admin/payment-gateways/{id}
```

#### Update Payment Gateway
```http
PUT /api/{tenant_slug}/admin/payment-gateways/{id}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "config": { /* updated config */ }
}
```

#### Delete Payment Gateway
```http
DELETE /api/{tenant_slug}/admin/payment-gateways/{id}
Authorization: Bearer {tenant_token}
```

## Storefront API

### List Products
```http
GET /api/{tenant_slug}/storefront/products?page=1&limit=20
```

Returns active products only:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Product Name",
        "slug": "product-slug",
        "metadata": {},
        "attributes": []
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### Get Product
```http
GET /api/{tenant_slug}/storefront/products/{id}
```

Returns product details with type information:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "slug": "product-slug",
    "metadata": {},
    "type": {
      "id": "uuid",
      "name": "Game Keys",
      "schema": {},
      "fields": []
    },
    "attributes": []
  }
}
```

## Error Handling

### Common Errors

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed: Product name is required",
  "statusCode": 400
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "No token provided",
  "statusCode": 401
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Product not found",
  "statusCode": 404
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": "Tenant slug already exists",
  "statusCode": 409
}
```

## Rate Limiting

API endpoints are rate-limited:

- 100 requests per minute for authenticated endpoints
- 10 requests per minute for unauthenticated endpoints

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

## Webhooks

Plugins can listen to webhooks. Common webhook events:

```json
{
  "event": "order.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "tenant_id": "uuid",
  "data": {
    "order_id": "uuid",
    "customer_email": "customer@example.com",
    "total": 99.99
  }
}
```

### UI Templates

#### Get Template for Page
```http
GET /api/{tenant_slug}/admin/ui/templates/{page}?resolved=true
```

Returns the template configuration for a specific page. When `resolved=true`, includes all relationships (layout, theme, widgets with components).

Response with `resolved=true`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "page": "dashboard",
    "name": "Dashboard Page",
    "layout_id": "uuid",
    "theme_id": "uuid",
    "is_default": true,
    "override_config": {},
    "layout": {
      "id": "uuid",
      "name": "Dashboard Layout",
      "regions": [
        { "name": "header", "width": "100%" },
        { "name": "sidebar", "width": "250px" },
        { "name": "main", "width": "1fr" }
      ],
      "grid_config": { "columns": 12, "gap": "1rem" }
    },
    "theme": {
      "id": "uuid",
      "name": "Default Theme",
      "colors": {
        "primary": "#3b82f6",
        "secondary": "#8b5cf6",
        "background": "#ffffff"
      },
      "fonts": {
        "heading": "Inter, sans-serif",
        "body": "Inter, sans-serif"
      }
    },
    "widgets": [
      {
        "id": "uuid",
        "page": "dashboard",
        "region": "main",
        "position": 0,
        "props": { "title": "Total Products", "value": "42" },
        "component": {
          "id": "uuid",
          "name": "Stats Card",
          "type": "widget",
          "props_schema": {},
          "default_props": {}
        }
      }
    ]
  }
}
```

#### Create/Update Template
```http
PUT /api/{tenant_slug}/admin/ui/templates/{page}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Custom Dashboard",
  "layout_id": "uuid",
  "theme_id": "uuid",
  "is_default": true,
  "override_config": {}
}
```

#### Get Current Theme
```http
GET /api/{tenant_slug}/admin/ui/themes/current
```

Returns the active theme for the tenant, merging tenant branding (colors, fonts, logo).

#### List Themes
```http
GET /api/{tenant_slug}/admin/ui/themes
```

#### Create Theme
```http
POST /api/{tenant_slug}/admin/ui/themes
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Dark Theme",
  "slug": "dark",
  "is_default": false,
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "background": "#1f2937",
    "foreground": "#f9fafb"
  },
  "fonts": {
    "heading": "Inter, sans-serif",
    "body": "Inter, sans-serif"
  },
  "spacing": {
    "unit": "rem",
    "scale": [0, 0.25, 0.5, 1, 1.5, 2, 3, 4]
  }
}
```

#### Update Theme
```http
PUT /api/{tenant_slug}/admin/ui/themes/{themeId}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "colors": {
    "primary": "#10b981"
  }
}
```

#### List Components
```http
GET /api/{tenant_slug}/admin/ui/components?type=widget&category=dashboard
```

#### Get Component
```http
GET /api/{tenant_slug}/admin/ui/components/{componentId}
```

#### List Layouts
```http
GET /api/{tenant_slug}/admin/ui/layouts?type=page
```

#### Create Layout
```http
POST /api/{tenant_slug}/admin/ui/layouts
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "name": "Two Column Layout",
  "slug": "two-column",
  "type": "page",
  "grid_config": {
    "columns": 12,
    "gap": "1rem"
  },
  "regions": [
    { "name": "header", "width": "100%" },
    { "name": "main", "width": "8fr" },
    { "name": "aside", "width": "4fr" }
  ],
  "responsive_config": {
    "breakpoints": {
      "sm": 640,
      "md": 768,
      "lg": 1024
    }
  }
}
```

#### List Widgets
```http
GET /api/{tenant_slug}/admin/ui/widgets?page=dashboard&region=main
```

#### Create Widget
```http
POST /api/{tenant_slug}/admin/ui/widgets
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "component_id": "uuid",
  "page": "dashboard",
  "region": "main",
  "position": 0,
  "props": {
    "title": "Total Orders",
    "value": "156",
    "trend": "+23%"
  },
  "visibility_rules": {
    "roles": ["admin", "manager"]
  },
  "is_active": true
}
```

#### Update Widget
```http
PUT /api/{tenant_slug}/admin/ui/widgets/{widgetId}
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "position": 5,
  "props": {
    "title": "Updated Title"
  },
  "is_active": false
}
```

#### Delete Widget
```http
DELETE /api/{tenant_slug}/admin/ui/widgets/{widgetId}
Authorization: Bearer {tenant_token}
```

## Best Practices

1. **Always include the tenant slug in the URL**: `/api/{tenant_slug}/...`
2. **Use proper HTTP methods**: GET for retrieval, POST for creation, PUT for updates, DELETE for removal
3. **Include authentication token**: Always include the `Authorization` header for authenticated endpoints
4. **Handle pagination**: Use `page` and `limit` parameters for list endpoints
5. **Check status codes**: Always verify the HTTP status code
6. **Cache responses**: Use HTTP caching headers for better performance
7. **Implement exponential backoff**: For rate-limited endpoints

## Versioning

Current API version: `v1`

Future versions will be available at:
- `/api/v1/...` (current)
- `/api/v2/...` (future)
