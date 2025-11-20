import { test, expect } from '@playwright/test';

test.describe('Tenant Management', () => {
  const API_KEY = 'sk_test_anyvaluedemo';
  let tenantId: string;

  test.beforeEach(async ({ request }) => {
    // Create a test tenant for each test
    const response = await request.post('/api/admin/tenants', {
      headers: {
        'X-API-Key': API_KEY,
      },
      data: {
        slug: `test-tenant-${Date.now()}`,
        name: 'Test Tenant',
        subdomain: `test-${Date.now()}`,
        plan: 'basic',
      },
    });

    const data = await response.json();
    tenantId = data.data.id;
  });

  test('should create a new tenant', async ({ request }) => {
    const response = await request.post('/api/admin/tenants', {
      headers: {
        'X-API-Key': API_KEY,
      },
      data: {
        slug: 'new-test-tenant',
        name: 'New Test Tenant',
        subdomain: 'new-test',
        plan: 'professional',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.slug).toBe('new-test-tenant');
    expect(data.data.plan).toBe('professional');
  });

  test('should list all tenants', async ({ request }) => {
    const response = await request.get('/api/admin/tenants', {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.data)).toBe(true);
  });

  test('should get a specific tenant', async ({ request }) => {
    const response = await request.get(`/api/admin/tenants/${tenantId}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(tenantId);
  });

  test('should update a tenant', async ({ request }) => {
    const response = await request.put(`/api/admin/tenants/${tenantId}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
      data: {
        name: 'Updated Test Tenant',
        plan: 'premium',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Updated Test Tenant');
    expect(data.data.plan).toBe('premium');
  });

  test('should delete a tenant', async ({ request }) => {
    const response = await request.delete(`/api/admin/tenants/${tenantId}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Tenant deleted');
  });

  test('should return 404 for non-existent tenant', async ({ request }) => {
    const response = await request.get('/api/admin/tenants/non-existent-id', {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    expect(response.status()).toBe(404);
  });
});