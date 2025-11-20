import { test, expect } from '@playwright/test';

test.describe('Super Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the health check to ensure server is running
    await page.goto('/health');
    await expect(page.locator('body')).toContainText('ok');
  });

  test('should allow login with valid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/admin/login', {
      data: {
        email: 'admin@platform.example.com',
        password: 'admin123',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
    expect(data.data.user.email).toBe('admin@platform.example.com');
  });

  test('should reject login with invalid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/admin/login', {
      data: {
        email: 'admin@platform.example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('should allow API key authentication for tenant creation', async ({ request }) => {
    const response = await request.post('/api/admin/tenants', {
      headers: {
        'X-API-Key': 'sk_test_anyvaluedemo',
      },
      data: {
        slug: 'e2e-test-tenant',
        name: 'E2E Test Tenant',
        subdomain: 'e2e-test',
        plan: 'basic',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.slug).toBe('e2e-test-tenant');
  });

  test('should reject requests with invalid API key', async ({ request }) => {
    const response = await request.post('/api/admin/tenants', {
      headers: {
        'X-API-Key': 'invalid-api-key',
      },
      data: {
        slug: 'test-tenant',
        name: 'Test Tenant',
      },
    });

    expect(response.status()).toBe(401);
  });
});