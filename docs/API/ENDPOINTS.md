# Complete API Endpoints Documentation

Multi-Tenant Commerce Platform - Comprehensive API Reference

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints except `/health` require the `x-api-key` header:

```
x-api-key: sk_test_admin123456
```

## Response Format

All responses follow a consistent format:

```json
{
  "success": true/false,
  "code": "SUCCESS|ERROR_CODE",
  "message": "Descriptive message",
  "data": {...},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Status Codes

- `200`: OK - Successful GET/PUT/PATCH
- `201`: Created - Successful POST
- `204`: No Content - Successful DELETE
- `400`: Bad Request - Validation error
- `401`: Unauthorized - Missing/invalid API key
- `404`: Not Found - Resource not found
- `409`: Conflict - Duplicate resource
- `500`: Internal Server Error

## Pagination

List endpoints support pagination with `limit` and `offset` query parameters:

- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

Response includes: `data`, `total`, `limit`, `offset`, `hasMore`

---

## Health Check

### GET /health

Check if the API is running (no authentication required).

**Response:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Health check passed",
  "data": {"status": "ok"},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Users Endpoints

### GET /api/users

List all users with pagination.

**Query Parameters:**
- `limit`: Number of users (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [...users],
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### GET /api/users/:id

Get a specific user by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "user",
    "api_key": "sk_...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/users

Create a new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "role": "user"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "newuser@example.com",
    "role": "user",
    "api_key": "sk_..."
  }
}
```

### PUT /api/users/:id

Update an existing user.

**Request:**
```json
{
  "email": "updated@example.com",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "updated@example.com",
    "role": "admin",
    "api_key": "sk_...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/users/:id

Delete a user.

**Response (204):** No content

### GET /api/users/:id/api-keys

List API keys for a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "key-123",
      "key": "sk_...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/users/:id/api-keys

Create a new API key for a user.

**Request:**
```json
{
  "name": "My API Key"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "key-123",
    "key": "sk_...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/users/:id/api-keys/:keyId

Revoke an API key.

**Response (204):** No content

---

## Tenants Endpoints

### GET /api/tenants

List all tenants.

**Query Parameters:**
- `limit`: Number of tenants (default: 20)
- `offset`: Pagination offset (default: 0)

### GET /api/tenants/:id

Get a specific tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tenant-123",
    "name": "My Tenant",
    "slug": "my-tenant",
    "config": "{}",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/tenants

Create a new tenant.

**Request:**
```json
{
  "name": "New Tenant",
  "slug": "new-tenant"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "tenant-123",
    "name": "New Tenant",
    "slug": "new-tenant"
  }
}
```

### PUT /api/tenants/:id

Update a tenant.

**Request:**
```json
{
  "name": "Updated Tenant",
  "slug": "updated-tenant",
  "config": {"theme": "dark"}
}
```

### DELETE /api/tenants/:id

Delete a tenant.

**Response (204):** No content

### GET /api/tenants/:id/config

Get tenant configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "light",
    "language": "en"
  }
}
```

### PUT /api/tenants/:id/config

Update tenant configuration.

**Request:**
```json
{
  "theme": "dark",
  "language": "en"
}
```

### GET /api/tenants/:id/usage

Get tenant usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "stores": 2,
    "products": 50,
    "orders": 100,
    "total_revenue": 9999.99
  }
}
```

### GET /api/tenants/:id/members

List tenant members.

### POST /api/tenants/:id/members

Add a member to tenant.

**Request:**
```json
{
  "user_id": "user-123",
  "role": "admin"
}
```

### DELETE /api/tenants/:id/members/:userId

Remove a member from tenant.

**Response (204):** No content

---

## Stores Endpoints

### GET /api/stores

List all stores.

**Query Parameters:**
- `limit`: Number of stores (default: 20)
- `offset`: Pagination offset (default: 0)

### GET /api/stores/:id

Get a specific store.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "store-123",
    "tenant_id": "tenant-123",
    "name": "My Store",
    "type": "digital",
    "config": "{}",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/stores

Create a new store.

**Request:**
```json
{
  "tenant_id": "tenant-123",
  "name": "New Store",
  "type": "digital"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "store-123",
    "tenant_id": "tenant-123",
    "name": "New Store",
    "type": "digital"
  }
}
```

### PUT /api/stores/:id

Update a store.

**Request:**
```json
{
  "name": "Updated Store",
  "type": "hybrid"
}
```

### DELETE /api/stores/:id

Delete a store.

**Response (204):** No content

### GET /api/stores/:id/config

Get store configuration.

### PUT /api/stores/:id/config

Update store configuration.

### GET /api/stores/:id/stats

Get store statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "products": 50,
    "orders": 100,
    "revenue": 9999.99
  }
}
```

### GET /api/stores/:id/settings

Get store settings.

### PUT /api/stores/:id/settings

Update store settings.

---

## Products Endpoints

### GET /api/products

List all products.

**Query Parameters:**
- `limit`: Number of products (default: 20)
- `offset`: Pagination offset (default: 0)
- `store_id`: Filter by store (optional)

### GET /api/products/:id

Get a specific product.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod-123",
    "store_id": "store-123",
    "name": "Product Name",
    "sku": "SKU-123",
    "price": 99.99,
    "description": "Product description",
    "type": "digital",
    "status": "active",
    "attributes": "{}",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/products

Create a new product.

**Request:**
```json
{
  "store_id": "store-123",
  "name": "New Product",
  "price": 99.99,
  "sku": "SKU-123",
  "description": "Product description",
  "type": "digital"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "prod-123",
    "store_id": "store-123",
    "name": "New Product",
    "price": 99.99,
    "sku": "SKU-123",
    "type": "digital"
  }
}
```

### PUT /api/products/:id

Update a product.

**Request:**
```json
{
  "name": "Updated Product",
  "price": 149.99
}
```

### DELETE /api/products/:id

Delete a product.

**Response (204):** No content

### GET /api/products/:id/variants

List product variants.

**Response:**
```json
{
  "success": true,
  "data": {
    "variants": [
      {"color": "red", "size": "large"}
    ]
  }
}
```

### POST /api/products/:id/variants

Add a product variant.

**Request:**
```json
{
  "color": "red",
  "size": "large"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "var-123",
    "color": "red",
    "size": "large"
  }
}
```

### DELETE /api/products/:id/variants/:variantId

Delete a product variant.

**Response (204):** No content

### PATCH /api/products/:id/status

Update product status.

**Request:**
```json
{
  "status": "active"
}
```

**Allowed values:** `active`, `inactive`, `draft`

### GET /api/products/store/:storeId

Get all products for a store.

### POST /api/products/bulk

Create multiple products.

**Request:**
```json
{
  "products": [
    {"store_id": "store-123", "name": "Product 1", "price": 99.99},
    {"store_id": "store-123", "name": "Product 2", "price": 199.99}
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "created": [...]
  }
}
```

### DELETE /api/products/bulk

Delete multiple products.

**Request:**
```json
{
  "product_ids": ["prod-1", "prod-2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": 2
  }
}
```

---

## Orders Endpoints

### GET /api/orders

List all orders.

**Query Parameters:**
- `limit`: Number of orders (default: 20)
- `offset`: Pagination offset (default: 0)
- `store_id`: Filter by store (optional)

### GET /api/orders/:id

Get a specific order.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "store_id": "store-123",
    "user_id": "user-123",
    "total": 199.99,
    "status": "pending",
    "items": [...],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/orders

Create a new order.

**Request:**
```json
{
  "store_id": "store-123",
  "user_id": "user-123",
  "total": 199.99,
  "status": "pending"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "store_id": "store-123",
    "user_id": "user-123",
    "total": 199.99,
    "status": "pending",
    "items": []
  }
}
```

### PUT /api/orders/:id

Update an order.

**Request:**
```json
{
  "total": 249.99,
  "status": "processing"
}
```

### DELETE /api/orders/:id

Delete an order.

**Response (204):** No content

### GET /api/orders/:id/items

Get order items.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 2
  }
}
```

### POST /api/orders/:id/items

Add item to order.

**Request:**
```json
{
  "product_id": "prod-123",
  "quantity": 2,
  "price": 99.99
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "item-123",
    "product_id": "prod-123",
    "quantity": 2,
    "price": 99.99
  }
}
```

### DELETE /api/orders/:id/items/:itemId

Remove item from order.

**Response (204):** No content

### PATCH /api/orders/:id/status

Update order status.

**Request:**
```json
{
  "status": "completed"
}
```

**Allowed values:** `pending`, `processing`, `completed`, `cancelled`

### GET /api/orders/:id/timeline

Get order timeline/history.

**Response:**
```json
{
  "success": true,
  "data": [
    {"event": "order_created", "timestamp": "...", "status": "pending"},
    {"event": "order_status_updated", "timestamp": "...", "status": "processing"}
  ]
}
```

### POST /api/orders/:id/notes

Add note to order.

**Request:**
```json
{
  "note": "Order is ready to ship"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "note-123",
    "note": "Order is ready to ship",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/orders/store/:storeId

Get orders for a store.

### GET /api/orders/user/:userId

Get orders for a user.

### POST /api/orders/:id/refund

Refund an order.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "refund_amount": 199.99,
    "status": "refunded"
  }
}
```

### PATCH /api/orders/:id/shipping

Update order shipping info.

**Request:**
```json
{
  "shipping_info": {
    "carrier": "FedEx",
    "tracking_number": "123456789"
  }
}
```

---

## Inventory Endpoints

### GET /api/inventory

List inventory.

**Query Parameters:**
- `limit`: Number of items (default: 20)
- `offset`: Pagination offset (default: 0)

### GET /api/inventory/:productId

Get product inventory.

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": "prod-123",
    "stock": 50,
    "status": "in_stock",
    "last_updated": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/inventory/:productId

Update inventory.

**Request:**
```json
{
  "stock": 100
}
```

### PATCH /api/inventory/:productId/stock

Adjust stock level.

**Request:**
```json
{
  "adjustment": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": "prod-123",
    "adjustment": 10,
    "new_stock": 60
  }
}
```

### GET /api/inventory/:productId/history

Get inventory history.

**Response:**
```json
{
  "success": true,
  "data": [
    {"event": "stock_adjusted", "timestamp": "...", "quantity": 50}
  ]
}
```

### POST /api/inventory/sync

Sync inventory.

**Response:**
```json
{
  "success": true,
  "data": {
    "synced_at": "2024-01-01T00:00:00Z",
    "items_synced": 10
  }
}
```

---

## Payments Endpoints

### GET /api/payments

List payments.

**Query Parameters:**
- `limit`: Number of payments (default: 20)
- `offset`: Pagination offset (default: 0)

### GET /api/payments/:id

Get a payment.

### POST /api/payments

Create a payment.

**Request:**
```json
{
  "amount": 99.99,
  "order_id": "order-123",
  "method": "card"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "pay-123",
    "amount": 99.99,
    "order_id": "order-123",
    "method": "card",
    "status": "pending"
  }
}
```

### GET /api/payments/:id/receipt

Get payment receipt.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pay-123",
    "receipt_number": "RCP-...",
    "url": "/receipts/file.pdf"
  }
}
```

### POST /api/payments/:id/refund

Refund a payment.

### GET /api/payments/order/:orderId

Get payments for an order.

### PATCH /api/payments/:id/status

Update payment status.

**Request:**
```json
{
  "status": "completed"
}
```

---

## Reports & Analytics Endpoints

### GET /api/reports/sales

Get sales report.

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "total_sales": 9999.99,
    "orders": 100,
    "average_order_value": 99.99
  }
}
```

### GET /api/reports/products

Get products report.

### GET /api/reports/customers

Get customers report.

### GET /api/reports/revenue

Get revenue report.

### GET /api/reports/inventory

Get inventory report.

### GET /api/analytics/dashboard

Get dashboard metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": 9999.99,
    "orders": 100,
    "customers": 50,
    "products": 200
  }
}
```

### GET /api/analytics/trends

Get analytics trends.

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {"date": "2024-01-01", "revenue": 100, "orders": 5},
      {"date": "2024-01-02", "revenue": 150, "orders": 7}
    ]
  }
}
```

---

## Webhooks Endpoints

### GET /api/webhooks

List webhooks.

**Query Parameters:**
- `limit`: Number of webhooks (default: 20)
- `offset`: Pagination offset (default: 0)

### POST /api/webhooks

Create a webhook.

**Request:**
```json
{
  "url": "https://example.com/webhook",
  "events": ["order.created", "order.updated"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "hook-123",
    "url": "https://example.com/webhook",
    "events": ["order.created", "order.updated"],
    "active": true
  }
}
```

### PUT /api/webhooks/:id

Update a webhook.

### DELETE /api/webhooks/:id

Delete a webhook.

**Response (204):** No content

### GET /api/webhooks/:id/logs

Get webhook logs.

### POST /api/webhooks/:id/test

Test a webhook.

---

## Settings & Configuration Endpoints

### GET /api/settings

Get global settings.

### PUT /api/settings

Update global settings.

### GET /api/settings/email

Get email settings.

### PUT /api/settings/email

Update email settings.

### GET /api/settings/payment

Get payment settings.

### PUT /api/settings/payment

Update payment settings.

### GET /api/settings/shipping

Get shipping settings.

### PUT /api/settings/shipping

Update shipping settings.

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| SUCCESS | 200 | Successful request |
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid API key |
| USER_NOT_FOUND | 404 | User not found |
| TENANT_NOT_FOUND | 404 | Tenant not found |
| STORE_NOT_FOUND | 404 | Store not found |
| PRODUCT_NOT_FOUND | 404 | Product not found |
| ORDER_NOT_FOUND | 404 | Order not found |
| ORDER_ITEM_NOT_FOUND | 404 | Order item not found |
| EMAIL_EXISTS | 409 | Email already exists |
| SLUG_EXISTS | 409 | Slug already exists |
| SKU_EXISTS | 409 | SKU already exists |
| STORE_EXISTS | 409 | Store already exists |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limiting

- Default: 100 requests per 60 seconds
- Limits apply per IP address

## Best Practices

1. **Always include authentication header** for protected endpoints
2. **Use pagination** for list endpoints to improve performance
3. **Handle errors gracefully** with appropriate retry logic
4. **Use appropriate HTTP methods**: GET (read), POST (create), PUT (update), DELETE (delete), PATCH (partial update)
5. **Validate input** before sending requests
6. **Use IDs from responses** for subsequent requests
7. **Cache responses** when appropriate
8. **Implement exponential backoff** for retries
