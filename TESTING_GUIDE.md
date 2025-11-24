# Testing Guide

Comprehensive guide for testing the MTC Platform with dual deployment (Node.js + Cloudflare Workers).

## Quick Start

### 1. Run All Tests
```bash
npm run test
```

### 2. Run Unit Tests Only
```bash
npm run test:unit
```

### 3. Run E2E Tests Only
```bash
npm run test:e2e
```

### 4. Watch Mode (Unit Tests)
```bash
npm run test:watch
```

### 5. UI Mode (Interactive)
```bash
npm run test:ui
```

## Testing Environments

### Local Node.js Development
```bash
npm run dev
```

Starts Express server at `http://localhost:3000`

### Cloudflare Workers Local
```bash
npm run dev:worker
```

Runs Wrangler local development environment with D1, KV, R2 simulation

## Unit Testing with Vitest

### Configuration
- **Config File**: `vitest.config.ts`
- **Test Files**: `src/**/__tests__/**/*.test.ts` or `src/**/*.test.ts`
- **Coverage**: v8 provider with HTML reports in `coverage/`
- **Environment**: Node.js

### Running Unit Tests

```bash
# Run all tests
npm run test:unit

# Run specific test file
npm run test:unit -- src/utils/__tests__/validators.test.ts

# Run tests matching pattern
npm run test:unit -- --grep "user"

# Run with coverage
npm run test:unit -- --coverage

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

### Writing Unit Tests

Example test structure:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { someFunction } from '../utils/helpers';

describe('Helper Utils', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    const result = someFunction({ foo: 'bar' });
    expect(result).toBe('expected');
  });

  it('should handle errors', () => {
    expect(() => someFunction(null)).toThrow();
  });
});
```

## E2E Testing with Playwright

### Configuration
- **Config File**: `playwright.config.ts`
- **Test Directory**: `e2e/`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Reports**: HTML report in `playwright-report/`

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e e2e/health.spec.ts

# Run with specific browser
npm run test:e2e -- --project=chromium

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run with debug mode
npm run test:e2e -- --debug

# Generate HTML report
npm run test:e2e -- --reporter=html
```

### Writing E2E Tests

Example E2E test:
```typescript
import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check endpoint', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('ok');
  });

  test('GET /api/users with authentication', async ({ request }) => {
    const response = await request.get('/api/users', {
      headers: {
        'x-api-key': 'sk_test_admin123456',
      },
    });
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data.data)).toBe(true);
  });

  test('POST /api/users with invalid data', async ({ request }) => {
    const response = await request.post('/api/users', {
      headers: {
        'x-api-key': 'sk_test_admin123456',
        'Content-Type': 'application/json',
      },
      data: { email: 'invalid' },
    });
    expect(response.status()).toBe(400);
  });
});
```

## Coverage Reports

### Generate Coverage Report
```bash
npm run test:unit -- --coverage
```

### View Coverage Report
```bash
open coverage/index.html
```

### Coverage Thresholds
```
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%
```

## CI/CD Testing

Tests run automatically on:
- **Push to `develop` branch**: Unit tests only
- **Push to `main` branch**: All tests (unit + E2E)
- **Pull requests**: Unit tests

### GitHub Actions Workflow
See `.github/workflows/deploy.yml` for complete workflow configuration.

## Testing Cloudflare Workers

### Local D1 Database
```bash
# Start local D1 with test data
wrangler d1 create --preview mtc_test

# Run migrations
npm run migrate
```

### Local KV Namespace
```bash
# Wrangler automatically simulates KV in local mode
npm run dev:worker
```

### Testing with Wrangler
```bash
# Development environment
npm run dev:worker --env development

# Staging environment
npm run dev:worker --env staging
```

## Manual Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### List Users (with API Key)
```bash
curl -H "x-api-key: sk_test_admin123456" \
  http://localhost:3000/api/users
```

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "role": "user"
  }'
```

### Pagination
```bash
curl -H "x-api-key: sk_test_admin123456" \
  "http://localhost:3000/api/users?limit=10&offset=0"
```

## Docker Testing

### Build and Test Docker Image
```bash
# Build
docker build -t mtc-platform:latest .

# Test
docker run -p 3000:3000 -e SUPER_ADMIN_API_KEY=sk_test_admin123456 mtc-platform:latest
```

### Docker Compose
```bash
# Start services
docker-compose up

# Run tests
docker-compose exec app npm run test

# Stop services
docker-compose down
```

## Performance Testing

### Measure Response Times
```bash
# Time a health check
time curl http://localhost:3000/health

# Load test with Apache Bench
ab -n 100 -c 10 http://localhost:3000/health
```

### Memory Profiling
```bash
# Start with inspector
node --inspect-brk dist/index.js

# Connect DevTools: chrome://inspect
```

## Debugging

### Debug Unit Tests
```bash
npm run test:watch -- --grep "specific test"
```

### Debug E2E Tests
```bash
npm run test:e2e -- --debug
```

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm run dev
```

### VS Code Debug Configuration
Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:watch"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## Continuous Integration

### Pre-commit Hooks (Optional)
```bash
npm run type-check
npm run lint
```

### Pre-push Hooks
```bash
npm run test:unit
npm run build:all
```

## Test Environment Variables

Use `.env.test` for test-specific environment:
```env
NODE_ENV=test
PORT=3001
SUPER_ADMIN_API_KEY=sk_test_admin123456
SQLITE_DB=db.test.sqlite
LOG_LEVEL=silent
```

## Troubleshooting

### Tests Timeout
```bash
# Increase timeout
npm run test:e2e -- --timeout=60000
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Reset database
rm db.sqlite db.sqlite-shm db.sqlite-wal

# Re-run migrations
npm run migrate
```

### Playwright Browser Issues
```bash
# Install missing dependencies
npx playwright install

# Update browsers
npx playwright install --with-deps
```

## Best Practices

1. **Write tests as you code** - TDD approach
2. **Keep tests isolated** - No dependencies between tests
3. **Use descriptive test names** - What, not how
4. **Test edge cases** - Errors, empty data, boundaries
5. **Mock external services** - Don't hit real APIs in tests
6. **Keep tests fast** - Optimize queries and fixtures
7. **Monitor coverage** - Aim for >80% coverage
8. **Review test output** - Check both pass and fail scenarios

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Snapshot Guide](https://jestjs.io/docs/snapshot-testing)
