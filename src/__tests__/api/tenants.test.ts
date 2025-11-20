import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

// Mock the tenantService
vi.mock('../../services/tenantService.js', () => ({
  tenantService: {
    createTenant: vi.fn(),
    listTenants: vi.fn(),
    getTenant: vi.fn(),
    updateTenant: vi.fn(),
    deleteTenant: vi.fn(),
  },
}));

// Mock SuperAdminService
vi.mock('../../services/superAdminService.js', () => ({
  SuperAdminService: {
    initializeSuperAdmin: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Admin Tenants API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/tenants', () => {
    it('should create a tenant with API key authentication', async () => {
      const mockTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        domain: 'test.example.com',
        subdomain: 'test',
        plan: 'basic',
      };

      const { tenantService } = await import('../../services/tenantService.js');
      (tenantService.createTenant as any).mockResolvedValue(mockTenant);

      const response = await request(app)
        .post('/api/admin/tenants')
        .set('X-API-Key', 'sk_test_anyvaluedemo')
        .send({
          slug: 'test-tenant',
          name: 'Test Tenant',
          domain: 'test.example.com',
          subdomain: 'test',
          plan: 'basic',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTenant);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/admin/tenants')
        .send({
          slug: 'test-tenant',
          name: 'Test Tenant',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid API key', async () => {
      const response = await request(app)
        .post('/api/admin/tenants')
        .set('X-API-Key', 'invalid-key')
        .send({
          slug: 'test-tenant',
          name: 'Test Tenant',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/tenants', () => {
    it('should list tenants with API key authentication', async () => {
      const mockTenants = {
        data: [
          {
            id: 'tenant-1',
            slug: 'tenant-1',
            name: 'Tenant 1',
          },
          {
            id: 'tenant-2',
            slug: 'tenant-2',
            name: 'Tenant 2',
          },
        ],
        total: 2,
      };

      const { tenantService } = await import('../../services/tenantService.js');
      (tenantService.listTenants as any).mockResolvedValue(mockTenants);

      const response = await request(app)
        .get('/api/admin/tenants')
        .set('X-API-Key', 'sk_test_anyvaluedemo');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTenants);
    });
  });

  describe('GET /api/admin/tenants/:id', () => {
    it('should get a tenant with API key authentication', async () => {
      const mockTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
      };

      const { tenantService } = await import('../../services/tenantService.js');
      (tenantService.getTenant as any).mockResolvedValue(mockTenant);

      const response = await request(app)
        .get('/api/admin/tenants/tenant-123')
        .set('X-API-Key', 'sk_test_anyvaluedemo');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTenant);
    });
  });

  describe('PUT /api/admin/tenants/:id', () => {
    it('should update a tenant with API key authentication', async () => {
      const mockTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Updated Test Tenant',
      };

      const { tenantService } = await import('../../services/tenantService.js');
      (tenantService.updateTenant as any).mockResolvedValue(mockTenant);

      const response = await request(app)
        .put('/api/admin/tenants/tenant-123')
        .set('X-API-Key', 'sk_test_anyvaluedemo')
        .send({
          name: 'Updated Test Tenant',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTenant);
    });
  });

  describe('DELETE /api/admin/tenants/:id', () => {
    it('should delete a tenant with API key authentication', async () => {
      const { tenantService } = await import('../../services/tenantService.js');
      (tenantService.deleteTenant as any).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/admin/tenants/tenant-123')
        .set('X-API-Key', 'sk_test_anyvaluedemo');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tenant deleted');
    });
  });
});