# API Documentation

Welcome to the API documentation for the MTC Platform. This section contains comprehensive API references and guides for integrating with the platform.

## 📚 API Documentation

### [REST API Reference](./REST_API.md)
Complete REST API documentation including:
- Authentication methods
- All available endpoints
- Request/response formats
- Error handling
- Rate limiting
- Examples and use cases

### [GraphQL API](./GRAPHQL_API.md)
GraphQL API documentation (coming soon):
- Schema reference
- Query examples
- Mutation examples
- Subscriptions
- Real-time updates

## 🚀 Quick Start

### Authentication

The API uses API key authentication for all endpoints:

```bash
# Include API key in headers
curl -H "x-api-key: sk_test_admin123456" \
  http://localhost:3000/api/users
```

### Basic API Call

```bash
# Health check (no auth required)
curl http://localhost:3000/health

# Get all users (auth required)
curl -H "x-api-key: sk_test_admin123456" \
  http://localhost:3000/api/users
```

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Authentication Methods

### API Key Authentication

Used for most administrative operations:

```bash
curl -H "x-api-key: sk_test_admin123456" \
  http://localhost:3000/api/tenants
```

### JWT Authentication (Future)

Will be used for tenant-specific operations:

```bash
curl -H "Authorization: Bearer {jwt_token}" \
  http://localhost:3000/api/my-store/products
```

## 📋 API Endpoints Overview

### Core Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/api/users` | List all users | Yes |
| POST | `/api/users` | Create user | Yes |
| GET | `/api/tenants` | List all tenants | Yes |
| POST | `/api/tenants` | Create tenant | Yes |
| GET | `/api/stores` | List all stores | Yes |
| POST | `/api/stores` | Create store | Yes |
| GET | `/api/products` | List all products | Yes |
| POST | `/api/products` | Create product | Yes |
| GET | `/api/orders` | List all orders | Yes |
| POST | `/api/orders` | Create order | Yes |

### Resource Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stores/:id` | Get specific store | Yes |
| GET | `/api/products/:id` | Get specific product | Yes |
| GET | `/api/orders/:id` | Get specific order | Yes |

## 🔧 Development Tools

### Postman Collection

A comprehensive Postman collection is available in the repository root:

```bash
# Import the collection
postman_collection.json
```

The collection includes:
- All API endpoints
- Pre-configured authentication
- Sample request bodies
- Environment variables

### cURL Examples

All documentation includes ready-to-use cURL examples:

```bash
# Create a new tenant
curl -X POST http://localhost:3000/api/tenants \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "slug": "my-store",
    "domain": "my-store.example.com"
  }'
```

### SDK Examples

Language-specific SDKs (coming soon):

```javascript
// JavaScript/Node.js
import { MTCClient } from '@mtc-platform/sdk';

const client = new MTCClient({
  apiKey: 'sk_test_admin123456',
  baseURL: 'http://localhost:3000'
});

const tenants = await client.tenants.list();
```

```python
# Python
from mtc_platform import MTCClient

client = MTCClient(
    api_key='sk_test_admin123456',
    base_url='http://localhost:3000'
)

tenants = client.tenants.list()
```

## 📊 API Usage Examples

### Multi-Tenant Setup

```bash
# 1. Create a tenant
curl -X POST http://localhost:3000/api/tenants \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Store","slug":"demo-store"}'

# 2. Create a store for the tenant
curl -X POST http://localhost:3000/api/stores \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant_123",
    "name": "Main Store",
    "type": "digital"
  }'

# 3. Create a product
curl -X POST http://localhost:3000/api/products \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "store_456",
    "name": "Digital Product",
    "price": 29.99
  }'
```

### Order Management

```bash
# Create an order
curl -X POST http://localhost:3000/api/orders \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "store_456",
    "customer_email": "customer@example.com",
    "items": [
      {
        "product_id": "product_789",
        "quantity": 1,
        "price": 29.99
      }
    ],
    "total": 29.99
  }'

# Get order details
curl -H "x-api-key: sk_test_admin123456" \
  http://localhost:3000/api/orders/order_123
```

## 🚨 Error Handling

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `UNAUTHORIZED` | Missing or invalid auth | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource already exists | 409 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

### Error Response Format

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Email is required and must be valid",
  "details": {
    "field": "email",
    "value": "",
    "constraint": "required"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📈 Rate Limiting

### Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Health checks | 1000/hour | Per IP |
| Auth endpoints | 10/minute | Per IP |
| Read operations | 100/minute | Per API key |
| Write operations | 50/minute | Per API key |

### Rate Limit Headers

```bash
curl -I http://localhost:3000/api/users

# Response headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## 🔍 API Testing

### Unit Testing

```typescript
import request from 'supertest';
import app from '../src/index';

describe('Users API', () => {
  it('should create user successfully', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('x-api-key', process.env.SUPER_ADMIN_API_KEY)
      .send({
        email: 'test@example.com',
        role: 'customer'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('test@example.com');
  });
});
```

### Integration Testing

```bash
# Test all endpoints with scripts
npm run test:api

# Test specific endpoint
npm run test:api -- --endpoint users
```

## 🌐 API Versions

### Versioning Strategy

The API uses URL path versioning:

```
/api/v1/users    # Version 1 (current)
/api/v2/users    # Version 2 (future)
```

### Backward Compatibility

- Current version: v1
- Breaking changes require new version
- Old versions supported for 12 months
- Deprecation notices sent 3 months before removal

## 🔒 Security Considerations

### API Key Security

- Use strong, randomly generated API keys
- Rotate API keys regularly
- Never commit API keys to version control
- Use different keys for different environments

### HTTPS Requirements

- All production API calls must use HTTPS
- TLS 1.2+ required
- Certificate validation enforced
- HSTS headers included

### Input Validation

All inputs are validated using Zod schemas:

```typescript
const createUserSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(['customer', 'tenant_admin', 'super_admin'])
});
```

## 📚 Additional Resources

### Documentation

- [Quick Start Guide](../QUICK_START.md) - Get started quickly
- [Development Guide](../DEVELOPMENT/README.md) - Development setup
- [Security Guide](../DEVELOPMENT/SECURITY.md) - Security best practices

### Tools and Libraries

- [Postman Collection](../../postman_collection.json) - Ready-to-use API collection
- [OpenAPI Specification](./openapi.yaml) - Machine-readable API spec (coming soon)
- [SDKs](./sdks/) - Official SDKs (coming soon)

### Community

- **GitHub Issues**: Report API bugs and request features
- **API Discussions**: Ask questions about API usage
- **Stack Overflow**: Use `mtc-platform` tag

## 🚀 Getting Help

### Common Issues

1. **Authentication Failures**: Check API key format and headers
2. **Validation Errors**: Review request body against schemas
3. **Rate Limiting**: Implement exponential backoff
4. **CORS Issues**: Configure allowed origins properly

### Support Channels

- **Documentation**: Check this documentation first
- **GitHub Issues**: For bug reports and feature requests
- **Email Support**: api-support@company.com
- **Community Forum**: developer.community.mtc-platform.com

### Feedback

We welcome feedback on the API:
- **Usability**: Is the API easy to use?
- **Documentation**: Is the documentation clear?
- **Features**: What endpoints would you like to see?
- **Performance**: Are response times acceptable?

---

**API Version**: v1.0.0  
**Last Updated**: 2024-11-24  
**Base URL**: `http://localhost:3000` (development) / `https://api.mtc-platform.com` (production)

For the most up-to-date API information, always check the [REST API Reference](./REST_API.md).