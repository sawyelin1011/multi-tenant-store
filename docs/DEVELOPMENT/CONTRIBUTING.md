# Contributing to MTC Platform

Thank you for your interest in contributing to the Multi-Tenant Commerce Platform! This guide will help you get started with contributing to the platform.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Testing Guide](#testing-guide)
3. [Code Standards](#code-standards)
4. [Pull Request Process](#pull-request-process)
5. [Development Workflow](#development-workflow)
6. [Testing Requirements](#testing-requirements)
7. [Documentation](#documentation)

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd mtc-platform

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Generate and run migrations
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

The server runs on `http://localhost:3000` with API key `sk_test_admin123456`

### Development Scripts

- `npm run dev` - Start Express development server
- `npm run cf:dev` - Start Cloudflare Workers development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Run linting
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations

## Testing Guide

### Quick Test All Endpoints

#### Health Check (No Auth)
```bash
curl http://localhost:3000/health
```

#### Get All Users
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/users
```

#### Get All Tenants
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/tenants
```

#### Get All Stores
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/stores
```

#### Get All Products
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/products
```

#### Get All Orders
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/orders
```

### Create Operations

#### Create New Tenant
```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Tenant","slug":"new-tenant"}'
```

#### Create New User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","role":"customer"}'
```

#### Create New Product
```bash
# First get a store_id from /api/stores
curl -X POST http://localhost:3000/api/products \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"store_id":"STORE_ID","name":"New Product","price":49.99}'
```

### Error Handling Tests

#### Test Auth Failure (No API Key)
```bash
curl http://localhost:3000/api/users
# Should return: {"error":"Unauthorized - invalid or missing API key"}
```

#### Test 404 (Nonexistent Resource)
```bash
curl -H "x-api-key: sk_test_admin123456" http://localhost:3000/api/stores/nonexistent
# Should return: {"error":"Store not found"}
```

### Acceptance Criteria ✅

All contributions must meet these criteria:

- ✅ `npm run dev` starts successfully
- ✅ `db.sqlite` file created locally
- ✅ All migrations run without errors
- ✅ Seed data created (users, tenants, stores, products, orders)
- ✅ All endpoints return 200 with correct auth header
- ✅ All endpoints return 401 without auth header
- ✅ Create endpoints (POST) work and save to database
- ✅ Get endpoints (GET) return correct data
- ✅ No errors in console
- ✅ Ready to test thoroughly

### Test Database Reset

```bash
rm db.sqlite db.sqlite-shm db.sqlite-wal
npm run dev
```

Fresh database with seed data created automatically.

## Code Standards

### TypeScript

- Use strict TypeScript mode
- Provide proper types for all functions
- Use interfaces for complex objects
- Avoid `any` type when possible

### Code Style

- Use 2 spaces for indentation
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Add JSDoc comments for public functions

### Database

- Use Drizzle ORM for all database operations
- Follow naming conventions: snake_case for tables, camelCase for code
- Include proper foreign key constraints
- Add indexes for frequently queried columns

### API Design

- Use RESTful conventions
- Return consistent response format
- Include proper HTTP status codes
- Validate all input data

## Pull Request Process

### Before Submitting

1. **Create a feature branch** from `main`
2. **Write tests** for new functionality
3. **Update documentation** if needed
4. **Run full test suite** locally
5. **Ensure all checks pass**

### PR Requirements

- Clear description of changes
- Link to relevant issues
- Test cases included
- Documentation updated
- All CI checks passing

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Development Workflow

### 1. Pick an Issue

- Check GitHub Issues for open items
- Comment on issue you want to work on
- Assign it to yourself (if possible)

### 2. Create Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Develop

```bash
# Make your changes
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve issue #123"
```

### 4. Test

```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Manual testing
npm run dev
# Test your changes manually
```

### 5. Submit PR

```bash
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

## Testing Requirements

### Unit Tests

- Write unit tests for new functions
- Test edge cases and error conditions
- Aim for >80% code coverage
- Use descriptive test names

### Integration Tests

- Test API endpoints
- Test database operations
- Test plugin hooks
- Test authentication

### Manual Testing

- Test new features end-to-end
- Test with different user roles
- Test error scenarios
- Test performance impact

### Test Database

Use test database for all tests:

```typescript
// In test files
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const testDb = new Database(':memory:');
const testDbClient = drizzle(testDb, { schema });
```

## Documentation

### When to Update Documentation

- Adding new API endpoints
- Changing database schema
- Adding new configuration options
- Modifying plugin hooks
- Changing deployment procedures

### Documentation Types

- **API Documentation**: Update in `docs/API/`
- **Development Guides**: Update in `docs/DEVELOPMENT/`
- **User Guides**: Update in `docs/QUICK_START.md`
- **Plugin Documentation**: Update in `docs/PLUGINS/`

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add step-by-step instructions
- Include troubleshooting tips
- Update table of contents

## Database Schema Changes

### Making Schema Changes

1. **Update Schema**: Edit `src/db/schema.ts`
2. **Generate Migration**: `npm run db:generate`
3. **Review Migration**: Check `drizzle/*.sql`
4. **Test Migration**: `npm run db:migrate`
5. **Update Tests**: Update test fixtures

### Migration Guidelines

- Use descriptive migration names
- Include rollback procedures
- Test with existing data
- Document breaking changes

## Plugin Development

### Plugin Structure

```
my-plugin/
├── plugin.json          # Plugin manifest
├── src/
│   ├── hooks/           # Hook implementations
│   ├── routes/          # Custom API routes
│   └── ui/              # Admin UI components
├── tests/               # Plugin tests
└── README.md            # Plugin documentation
```

### Plugin Guidelines

- Follow plugin manifest specification
- Implement required hooks properly
- Handle errors gracefully
- Include comprehensive tests
- Provide clear documentation

## Security Considerations

### Code Security

- Validate all input data
- Sanitize user inputs
- Use parameterized queries
- Implement proper authentication
- Handle sensitive data properly

### API Security

- Use HTTPS in production
- Implement rate limiting
- Validate API keys
- Log security events
- Use proper HTTP headers

## Performance Guidelines

### Database Performance

- Use appropriate indexes
- Avoid N+1 queries
- Use pagination for large datasets
- Optimize complex queries
- Monitor query performance

### API Performance

- Implement caching where appropriate
- Use compression for responses
- Optimize JSON payloads
- Monitor response times
- Use connection pooling

## Release Process

### Version Bumping

Use semantic versioning:
- **Patch**: `x.x.1` - Bug fixes
- **Minor**: `x.1.x` - New features
- **Major**: `1.x.x` - Breaking changes

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number updated
- [ ] Git tag created
- [ ] Release notes written

## Getting Help

### Resources

- **Documentation**: [docs/README.md](../README.md)
- **API Reference**: [API/README.md](../API/README.md)
- **Architecture**: [DEVELOPMENT/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Examples**: `examples/` directory

### Community

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Code Reviews**: Learn from other contributors

### Contact Maintainers

- Tag maintainers in issues for urgent matters
- Use security@company.com for security issues
- Join our Discord/Slack for real-time help

## Recognition

Contributors are recognized in:

- `CONTRIBUTORS.md` file
- GitHub release notes
- Project documentation
- Annual contributor highlights

Thank you for contributing to the MTC Platform! 🚀