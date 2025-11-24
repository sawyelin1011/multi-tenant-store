# Development Documentation

Welcome to the development documentation for the MTC Platform. This section contains comprehensive guides for developers working on the platform's core functionality.

## 📚 Development Guides

### [Architecture](./ARCHITECTURE.md)
Complete system architecture documentation including:
- Multi-tenant architecture patterns
- Plugin system design
- Database schema and relationships
- API design principles
- Security architecture

### [Setup Guide](./SETUP.md)
Development environment setup for both runtimes:
- Local Express development
- Cloudflare Workers development
- Database configuration
- Environment variables
- Development tools

### [Database Guide](./DATABASE.md)
Comprehensive database documentation:
- Migration system
- Drizzle ORM usage
- PostgreSQL and SQLite support
- Data migration utilities
- Performance optimization

### [Contributing Guide](./CONTRIBUTING.md)
How to contribute to the platform:
- Development workflow
- Code standards and conventions
- Testing requirements
- Pull request process
- Documentation guidelines

### [Security Guidelines](./SECURITY.md)
Security best practices and requirements:
- Authentication and authorization
- API security measures
- Database security
- Plugin security
- Incident response

## 🏗️ Project Structure

```
src/
├── bootstrap/              # Application bootstrap
│   └── index.ts           # Migration and seed runner
├── db/                    # Database layer
│   ├── client.ts          # Database connection
│   ├── migrate.ts         # Migration runner
│   ├── schema.ts          # Drizzle schema
│   └── seed.ts            # Seed data
├── middleware/            # Express middleware
│   └── auth.ts            # Authentication middleware
├── services/              # Business logic layer
│   ├── tenant-service.ts
│   ├── product-service.ts
│   ├── order-service.ts
│   └── ...
├── routes/                # API route handlers
│   ├── tenants.ts
│   ├── products.ts
│   └── ...
├── utils/                 # Utility functions
│   ├── validators.ts      # Zod validation schemas
│   ├── logger.ts          # Structured logging
│   └── cache.ts           # Caching utilities
├── worker.ts              # Cloudflare Workers entry
└── index.ts               # Express server entry
```

## 🚀 Development Workflow

### 1. Local Development Setup

```bash
# Clone and install
git clone <repository>
cd mtc-platform
npm install

# Setup environment
cp .env.example .env
npm run db:generate
npm run db:migrate

# Start development
npm run dev
```

### 2. Dual Runtime Development

The platform supports two development environments:

**Express (Traditional)**:
- PostgreSQL database
- Full Node.js ecosystem
- Traditional debugging tools
- Hot reloading with nodemon

**Cloudflare Workers (Edge)**:
- SQLite/D1 database
- Edge computing benefits
- Serverless deployment
- Local development with Wrangler

### 3. Database Development

```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Reset database
rm db.sqlite
npm run db:migrate
npm run db:seed
```

### 4. Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- services/tenant-service.test.ts
```

## 🔧 Development Tools

### Required Tools

- **Node.js 18+**: Runtime environment
- **npm 9+**: Package manager
- **Git**: Version control
- **VS Code**: Recommended IDE

### Recommended VS Code Extensions

- **TypeScript Importer**: Auto imports
- **Prisma**: Database tooling (for schema visualization)
- **Thunder Client**: API testing
- **GitLens**: Git integration
- **ESLint**: Code linting

### Database Tools

- **SQLite Browser**: For local SQLite inspection
- **pgAdmin**: For PostgreSQL management
- **DBeaver**: Universal database tool

## 📝 Code Standards

### TypeScript Standards

- Use strict TypeScript configuration
- Provide explicit return types for functions
- Use interfaces for object shapes
- Prefer `const` over `let` when possible

### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'john';
function getUserById() {}

// Classes and interfaces: PascalCase
class UserService {}
interface UserConfig {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Files: kebab-case
// user-service.ts
// tenant-management.ts
```

### Error Handling

Use the ApiError utility for consistent error handling:

```typescript
import { ApiError } from '../utils/errors';

// Throw specific errors
throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');

// Handle errors consistently
try {
  const user = await userService.getUser(id);
  return user;
} catch (error) {
  if (error instanceof ApiError) {
    throw error;
  }
  throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to get user');
}
```

### Database Patterns

Use Drizzle ORM for all database operations:

```typescript
// Select with filtering
const users = await db
  .select()
  .from(users)
  .where(eq(users.tenantId, tenantId))
  .limit(20);

// Insert with validation
const newUser = await db
  .insert(users)
  .values({
    id: generateId(),
    email: validatedEmail,
    tenantId,
    createdAt: new Date()
  })
  .returning();
```

## 🧪 Testing Strategy

### Test Organization

```
tests/
├── unit/                   # Unit tests
│   ├── services/
│   ├── utils/
│   └── middleware/
├── integration/            # Integration tests
│   ├── api/
│   └── database/
├── e2e/                   # End-to-end tests
└── fixtures/              # Test data
```

### Test Examples

**Unit Test**:
```typescript
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const userData = { email: 'test@example.com', role: 'customer' };
    const user = await userService.createUser(tenantId, userData);
    
    expect(user.email).toBe(userData.email);
    expect(user.id).toBeDefined();
  });
});
```

**Integration Test**:
```typescript
describe('User API', () => {
  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('x-api-key', apiKey)
      .send({ email: 'test@example.com', role: 'customer' })
      .expect(201);
      
    expect(response.body.data.email).toBe('test@example.com');
  });
});
```

## 🔄 Database Migrations

### Creating Migrations

1. Update `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/`
4. Apply migration: `npm run db:migrate`

### Migration Best Practices

- Use descriptive migration names
- Include rollback procedures
- Test with existing data
- Document breaking changes

### Example Migration

```sql
-- Migration: 0001_add_user_roles.sql
CREATE TABLE user_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  permissions TEXT NOT NULL, -- JSON array
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Insert default roles
INSERT INTO user_roles (id, name, permissions) VALUES
  ('role_admin', 'admin', '["*"]'),
  ('role_user', 'user', '["read:own"]'),
  ('role_guest', 'guest', '["read:public"]');
```

## 🔌 Plugin Development

### Plugin Structure

```
my-plugin/
├── plugin.json            # Plugin manifest
├── src/
│   ├── hooks/            # Hook implementations
│   ├── routes/           # Custom API routes
│   └── ui/               # Admin UI components
├── tests/                # Plugin tests
└── README.md             # Plugin documentation
```

### Hook Examples

```typescript
// src/hooks/product-created.ts
export default async function productCreated(product, context) {
  // Send notification
  await context.services.email.send({
    to: context.tenant.adminEmail,
    subject: `New Product: ${product.name}`,
    body: `Product ${product.name} has been created.`
  });
  
  // Update external system
  await context.services.api.post('/webhooks/product', {
    event: 'product.created',
    data: product
  });
}
```

## 📊 Performance Considerations

### Database Optimization

- Use appropriate indexes
- Implement pagination
- Cache frequently accessed data
- Monitor query performance

### API Performance

- Implement response caching
- Use compression
- Optimize JSON payloads
- Monitor response times

### Memory Management

- Avoid memory leaks
- Use connection pooling
- Implement proper cleanup
- Monitor memory usage

## 🚨 Common Issues

### Database Connection Issues

```bash
# Check SQLite file permissions
ls -la db.sqlite

# Recreate database
rm db.sqlite
npm run db:migrate
npm run db:seed
```

### Migration Issues

```bash
# Check migration status
npm run db:migrate:status

# Rollback migration (if needed)
npm run db:migrate:rollback
```

### Development Server Issues

```bash
# Check port availability
lsof -ti:3000

# Kill process on port
lsof -ti:3000 | xargs kill -9

# Start with different port
PORT=3001 npm run dev
```

## 📚 Learning Resources

### Internal Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design overview
- [Setup Guide](./SETUP.md) - Environment setup
- [Database Guide](./DATABASE.md) - Database operations
- [Security Guide](./SECURITY.md) - Security best practices

### External Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

### Community

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Discord/Slack**: Real-time chat with other developers

## 🎯 Development Goals

### Current Focus

- [ ] Improve test coverage to 90%+
- [ ] Implement comprehensive monitoring
- [ ] Add performance benchmarks
- [ ] Enhance plugin system capabilities

### Future Plans

- [ ] GraphQL API support
- [ ] Advanced caching strategies
- [ ] Microservices architecture
- [ ] Machine learning integrations

## 🤝 Getting Started

1. **Read the Architecture Guide** to understand system design
2. **Follow the Setup Guide** to configure your development environment
3. **Review the Contributing Guide** to understand the development workflow
4. **Join our Community** to connect with other developers

Happy coding! 🚀