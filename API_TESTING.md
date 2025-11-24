# API Testing Guide

Complete testing guide for the Multi-Tenant Commerce Platform API with curl examples.

## Setup

### Environment Variables

```bash
export BASE_URL="http://localhost:3000"
export API_KEY="sk_test_admin123456"
```

### Start Server

```bash
npm run dev
```

## Health Check

### 1. Health Check (No Auth Required)

```bash
curl -X GET ${BASE_URL}/health
```

**Expected Response:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Health check passed",
  "data": { "status": "ok" },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Users Endpoints

### 2. List Users

```bash
curl -X GET "${BASE_URL}/api/users?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Response:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Users fetched",
  "data": {
    "data": [...users],
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 3. Get User by ID

```bash
curl -X GET "${BASE_URL}/api/users/user-id" \
  -H "x-api-key: ${API_KEY}"
```

### 4. Create User

```bash
curl -X POST "${BASE_URL}/api/users" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","role":"user"}'
```

**Expected Status:** 201 Created

### 5. Update User

```bash
curl -X PUT "${BASE_URL}/api/users/user-id" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"updated@example.com","role":"admin"}'
```

**Expected Status:** 200 OK

### 6. Delete User

```bash
curl -X DELETE "${BASE_URL}/api/users/user-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

### 7. List API Keys

```bash
curl -X GET "${BASE_URL}/api/users/user-id/api-keys" \
  -H "x-api-key: ${API_KEY}"
```

### 8. Create API Key

```bash
curl -X POST "${BASE_URL}/api/users/user-id/api-keys" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name":"My API Key"}'
```

**Expected Status:** 201 Created

### 9. Revoke API Key

```bash
curl -X DELETE "${BASE_URL}/api/users/user-id/api-keys/key-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

## Tenants Endpoints

### 10. List Tenants

```bash
curl -X GET "${BASE_URL}/api/tenants?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

### 11. Get Tenant by ID

```bash
curl -X GET "${BASE_URL}/api/tenants/tenant-id" \
  -H "x-api-key: ${API_KEY}"
```

### 12. Create Tenant

```bash
curl -X POST "${BASE_URL}/api/tenants" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Tenant","slug":"new-tenant"}'
```

**Expected Status:** 201 Created

### 13. Update Tenant

```bash
curl -X PUT "${BASE_URL}/api/tenants/tenant-id" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Tenant","slug":"updated-tenant"}'
```

### 14. Delete Tenant

```bash
curl -X DELETE "${BASE_URL}/api/tenants/tenant-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

### 15. Get Tenant Config

```bash
curl -X GET "${BASE_URL}/api/tenants/tenant-id/config" \
  -H "x-api-key: ${API_KEY}"
```

### 16. Update Tenant Config

```bash
curl -X PUT "${BASE_URL}/api/tenants/tenant-id/config" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","language":"en"}'
```

### 17. Get Tenant Usage

```bash
curl -X GET "${BASE_URL}/api/tenants/tenant-id/usage" \
  -H "x-api-key: ${API_KEY}"
```

### 18. List Tenant Members

```bash
curl -X GET "${BASE_URL}/api/tenants/tenant-id/members" \
  -H "x-api-key: ${API_KEY}"
```

### 19. Add Tenant Member

```bash
curl -X POST "${BASE_URL}/api/tenants/tenant-id/members" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user-id","role":"admin"}'
```

### 20. Remove Tenant Member

```bash
curl -X DELETE "${BASE_URL}/api/tenants/tenant-id/members/user-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

## Stores Endpoints

### 21. List Stores

```bash
curl -X GET "${BASE_URL}/api/stores?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

### 22. Get Store by ID

```bash
curl -X GET "${BASE_URL}/api/stores/store-id" \
  -H "x-api-key: ${API_KEY}"
```

### 23. Create Store

```bash
curl -X POST "${BASE_URL}/api/stores" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"tenant-id","name":"New Store","type":"digital"}'
```

**Expected Status:** 201 Created

### 24. Update Store

```bash
curl -X PUT "${BASE_URL}/api/stores/store-id" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Store","type":"hybrid"}'
```

### 25. Delete Store

```bash
curl -X DELETE "${BASE_URL}/api/stores/store-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

### 26. Get Store Config

```bash
curl -X GET "${BASE_URL}/api/stores/store-id/config" \
  -H "x-api-key: ${API_KEY}"
```

### 27. Update Store Config

```bash
curl -X PUT "${BASE_URL}/api/stores/store-id/config" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"currency":"USD","timezone":"UTC"}'
```

### 28. Get Store Stats

```bash
curl -X GET "${BASE_URL}/api/stores/store-id/stats" \
  -H "x-api-key: ${API_KEY}"
```

### 29. Get Store Settings

```bash
curl -X GET "${BASE_URL}/api/stores/store-id/settings" \
  -H "x-api-key: ${API_KEY}"
```

### 30. Update Store Settings

```bash
curl -X PUT "${BASE_URL}/api/stores/store-id/settings" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"tax_rate":0.08}'
```

## Products Endpoints

### 31. List Products

```bash
curl -X GET "${BASE_URL}/api/products?limit=20&offset=0&store_id=store-id" \
  -H "x-api-key: ${API_KEY}"
```

### 32. Get Product by ID

```bash
curl -X GET "${BASE_URL}/api/products/product-id" \
  -H "x-api-key: ${API_KEY}"
```

### 33. Create Product

```bash
curl -X POST "${BASE_URL}/api/products" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id":"store-id",
    "name":"New Product",
    "price":99.99,
    "sku":"SKU-123",
    "type":"digital"
  }'
```

**Expected Status:** 201 Created

### 34. Update Product

```bash
curl -X PUT "${BASE_URL}/api/products/product-id" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Product","price":149.99}'
```

### 35. Delete Product

```bash
curl -X DELETE "${BASE_URL}/api/products/product-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

### 36. List Product Variants

```bash
curl -X GET "${BASE_URL}/api/products/product-id/variants" \
  -H "x-api-key: ${API_KEY}"
```

### 37. Add Product Variant

```bash
curl -X POST "${BASE_URL}/api/products/product-id/variants" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"color":"red","size":"large"}'
```

**Expected Status:** 201 Created

### 38. Delete Product Variant

```bash
curl -X DELETE "${BASE_URL}/api/products/product-id/variants/variant-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

### 39. Update Product Status

```bash
curl -X PATCH "${BASE_URL}/api/products/product-id/status" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'
```

### 40. Get Store Products

```bash
curl -X GET "${BASE_URL}/api/products/store/store-id?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

### 41. Bulk Create Products

```bash
curl -X POST "${BASE_URL}/api/products/bulk" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {"store_id":"store-id","name":"Product 1","price":99.99},
      {"store_id":"store-id","name":"Product 2","price":199.99}
    ]
  }'
```

**Expected Status:** 201 Created

### 42. Bulk Delete Products

```bash
curl -X DELETE "${BASE_URL}/api/products/bulk" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"product_ids":["prod-1","prod-2"]}'
```

## Orders Endpoints

### 43. List Orders

```bash
curl -X GET "${BASE_URL}/api/orders?limit=20&offset=0&store_id=store-id" \
  -H "x-api-key: ${API_KEY}"
```

### 44. Get Order by ID

```bash
curl -X GET "${BASE_URL}/api/orders/order-id" \
  -H "x-api-key: ${API_KEY}"
```

### 45. Create Order

```bash
curl -X POST "${BASE_URL}/api/orders" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id":"store-id",
    "user_id":"user-id",
    "total":199.99,
    "status":"pending"
  }'
```

**Expected Status:** 201 Created

### 46. Update Order

```bash
curl -X PUT "${BASE_URL}/api/orders/order-id" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"total":249.99,"status":"processing"}'
```

### 47. Delete Order

```bash
curl -X DELETE "${BASE_URL}/api/orders/order-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

### 48. List Order Items

```bash
curl -X GET "${BASE_URL}/api/orders/order-id/items" \
  -H "x-api-key: ${API_KEY}"
```

### 49. Add Order Item

```bash
curl -X POST "${BASE_URL}/api/orders/order-id/items" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"product-id","quantity":2,"price":99.99}'
```

**Expected Status:** 201 Created

### 50. Remove Order Item

```bash
curl -X DELETE "${BASE_URL}/api/orders/order-id/items/item-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

### 51. Update Order Status

```bash
curl -X PATCH "${BASE_URL}/api/orders/order-id/status" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

### 52. Get Order Timeline

```bash
curl -X GET "${BASE_URL}/api/orders/order-id/timeline" \
  -H "x-api-key: ${API_KEY}"
```

### 53. Add Order Note

```bash
curl -X POST "${BASE_URL}/api/orders/order-id/notes" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"note":"Order is ready to ship"}'
```

**Expected Status:** 201 Created

### 54. Get Store Orders

```bash
curl -X GET "${BASE_URL}/api/orders/store/store-id?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

### 55. Get User Orders

```bash
curl -X GET "${BASE_URL}/api/orders/user/user-id?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

### 56. Refund Order

```bash
curl -X POST "${BASE_URL}/api/orders/order-id/refund" \
  -H "x-api-key: ${API_KEY}"
```

### 57. Update Order Shipping

```bash
curl -X PATCH "${BASE_URL}/api/orders/order-id/shipping" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_info": {
      "carrier":"FedEx",
      "tracking_number":"123456789"
    }
  }'
```

## Inventory Endpoints

### 58. List Inventory

```bash
curl -X GET "${BASE_URL}/api/inventory?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

### 59. Get Product Inventory

```bash
curl -X GET "${BASE_URL}/api/inventory/product-id" \
  -H "x-api-key: ${API_KEY}"
```

### 60. Update Inventory

```bash
curl -X PUT "${BASE_URL}/api/inventory/product-id" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"stock":100}'
```

### 61. Adjust Stock

```bash
curl -X PATCH "${BASE_URL}/api/inventory/product-id/stock" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"adjustment":10}'
```

### 62. Get Inventory History

```bash
curl -X GET "${BASE_URL}/api/inventory/product-id/history" \
  -H "x-api-key: ${API_KEY}"
```

### 63. Sync Inventory

```bash
curl -X POST "${BASE_URL}/api/inventory/sync" \
  -H "x-api-key: ${API_KEY}"
```

## Payments Endpoints

### 64. List Payments

```bash
curl -X GET "${BASE_URL}/api/payments?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

### 65. Get Payment by ID

```bash
curl -X GET "${BASE_URL}/api/payments/payment-id" \
  -H "x-api-key: ${API_KEY}"
```

### 66. Create Payment

```bash
curl -X POST "${BASE_URL}/api/payments" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount":99.99,
    "order_id":"order-id",
    "method":"card"
  }'
```

**Expected Status:** 201 Created

### 67. Get Payment Receipt

```bash
curl -X GET "${BASE_URL}/api/payments/payment-id/receipt" \
  -H "x-api-key: ${API_KEY}"
```

### 68. Refund Payment

```bash
curl -X POST "${BASE_URL}/api/payments/payment-id/refund" \
  -H "x-api-key: ${API_KEY}"
```

### 69. Get Order Payments

```bash
curl -X GET "${BASE_URL}/api/payments/order/order-id" \
  -H "x-api-key: ${API_KEY}"
```

### 70. Update Payment Status

```bash
curl -X PATCH "${BASE_URL}/api/payments/payment-id/status" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

## Reports & Analytics Endpoints

### 71. Get Sales Report

```bash
curl -X GET "${BASE_URL}/api/reports/sales" \
  -H "x-api-key: ${API_KEY}"
```

### 72. Get Products Report

```bash
curl -X GET "${BASE_URL}/api/reports/products" \
  -H "x-api-key: ${API_KEY}"
```

### 73. Get Customers Report

```bash
curl -X GET "${BASE_URL}/api/reports/customers" \
  -H "x-api-key: ${API_KEY}"
```

### 74. Get Revenue Report

```bash
curl -X GET "${BASE_URL}/api/reports/revenue" \
  -H "x-api-key: ${API_KEY}"
```

### 75. Get Inventory Report

```bash
curl -X GET "${BASE_URL}/api/reports/inventory" \
  -H "x-api-key: ${API_KEY}"
```

### 76. Get Dashboard Metrics

```bash
curl -X GET "${BASE_URL}/api/analytics/dashboard" \
  -H "x-api-key: ${API_KEY}"
```

### 77. Get Analytics Trends

```bash
curl -X GET "${BASE_URL}/api/analytics/trends" \
  -H "x-api-key: ${API_KEY}"
```

## Webhooks Endpoints

### 78. List Webhooks

```bash
curl -X GET "${BASE_URL}/api/webhooks?limit=20&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

### 79. Create Webhook

```bash
curl -X POST "${BASE_URL}/api/webhooks" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://example.com/webhook",
    "events":["order.created","order.updated"]
  }'
```

**Expected Status:** 201 Created

### 80. Update Webhook

```bash
curl -X PUT "${BASE_URL}/api/webhooks/webhook-id" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://example.com/webhook-updated",
    "events":["order.created"]
  }'
```

### 81. Delete Webhook

```bash
curl -X DELETE "${BASE_URL}/api/webhooks/webhook-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Status:** 204 No Content

### 82. Get Webhook Logs

```bash
curl -X GET "${BASE_URL}/api/webhooks/webhook-id/logs" \
  -H "x-api-key: ${API_KEY}"
```

### 83. Test Webhook

```bash
curl -X POST "${BASE_URL}/api/webhooks/webhook-id/test" \
  -H "x-api-key: ${API_KEY}"
```

## Settings & Configuration Endpoints

### 84. Get Global Settings

```bash
curl -X GET "${BASE_URL}/api/settings" \
  -H "x-api-key: ${API_KEY}"
```

### 85. Update Global Settings

```bash
curl -X PUT "${BASE_URL}/api/settings" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","language":"en"}'
```

### 86. Get Email Settings

```bash
curl -X GET "${BASE_URL}/api/settings/email" \
  -H "x-api-key: ${API_KEY}"
```

### 87. Update Email Settings

```bash
curl -X PUT "${BASE_URL}/api/settings/email" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"smtp_host":"smtp.gmail.com","from":"noreply@example.com"}'
```

### 88. Get Payment Settings

```bash
curl -X GET "${BASE_URL}/api/settings/payment" \
  -H "x-api-key: ${API_KEY}"
```

### 89. Update Payment Settings

```bash
curl -X PUT "${BASE_URL}/api/settings/payment" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"provider":"stripe","mode":"test"}'
```

### 90. Get Shipping Settings

```bash
curl -X GET "${BASE_URL}/api/settings/shipping" \
  -H "x-api-key: ${API_KEY}"
```

### 91. Update Shipping Settings

```bash
curl -X PUT "${BASE_URL}/api/settings/shipping" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"provider":"fedex","default_service":"standard"}'
```

## Error Handling Tests

### Missing API Key

```bash
curl -X GET "${BASE_URL}/api/users"
```

**Expected Response (401):**
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Unauthorized - invalid or missing API key",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Invalid API Key

```bash
curl -X GET "${BASE_URL}/api/users" \
  -H "x-api-key: invalid_key"
```

**Expected Response (401):** Same as above

### Resource Not Found

```bash
curl -X GET "${BASE_URL}/api/users/nonexistent-id" \
  -H "x-api-key: ${API_KEY}"
```

**Expected Response (404):**
```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "message": "User not found",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Validation Error

```bash
curl -X POST "${BASE_URL}/api/users" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","role":"user"}'
```

**Expected Response (400):**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Duplicate Resource

```bash
curl -X POST "${BASE_URL}/api/users" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com","role":"user"}'
```

(After creating once)

**Expected Response (409):**
```json
{
  "success": false,
  "code": "EMAIL_EXISTS",
  "message": "Email existing@example.com already exists",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Pagination

All list endpoints support pagination with `limit` and `offset` parameters:

```bash
curl -X GET "${BASE_URL}/api/users?limit=10&offset=0" \
  -H "x-api-key: ${API_KEY}"
```

**Response includes:**
- `data`: Array of items
- `total`: Total count
- `limit`: Items per page
- `offset`: Current offset
- `hasMore`: Boolean indicating if more items exist

## Testing Workflow

1. **Create test data:**
   ```bash
   TENANT=$(curl -s -X POST "${BASE_URL}/api/tenants" \
     -H "x-api-key: ${API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Tenant","slug":"test-tenant"}' | jq -r '.data.id')
   
   STORE=$(curl -s -X POST "${BASE_URL}/api/stores" \
     -H "x-api-key: ${API_KEY}" \
     -H "Content-Type: application/json" \
     -d "{\"tenant_id\":\"${TENANT}\",\"name\":\"Test Store\",\"type\":\"digital\"}" | jq -r '.data.id')
   ```

2. **Test CRUD operations:**
   - POST - Create with 201 status
   - GET - Retrieve with 200 status
   - PUT - Update with 200 status
   - DELETE - Delete with 204 status
   - PATCH - Partial update with 200 status

3. **Test error handling:**
   - Missing auth header → 401
   - Invalid auth → 401
   - Missing resource → 404
   - Invalid input → 400
   - Duplicate resource → 409

4. **Test pagination:**
   - Create multiple items
   - Test `limit` and `offset` parameters
   - Verify `hasMore` flag

## Performance Tips

- Use pagination to limit response size
- Cache frequently accessed data
- Use appropriate HTTP methods (GET for read, POST for create, etc.)
- Include only necessary fields in responses
