import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

// Mock the SuperAdminService
vi.mock('../../services/superAdminService.js', () => ({
  SuperAdminService: {
    initializeSuperAdmin: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock the userService
vi.mock('../../services/userService.js', () => ({
  userService: {
    validatePassword: vi.fn(),
  },
}));

// Mock the config
vi.mock('../../config/env.js', () => ({
  config: {
    adminJwtSecret: 'test-jwt-secret',
  },
}));

describe('Authentication API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/admin/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Email and password are required',
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const { userService } = await import('../../services/userService.js');
      (userService.validatePassword as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials',
      });
    });

    it('should return 401 for non-admin users', async () => {
      const { userService } = await import('../../services/userService.js');
      (userService.validatePassword as any).mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      });

      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'user@example.com',
          password: 'password',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials',
      });
    });

    it('should return token for valid admin credentials', async () => {
      const { userService } = await import('../../services/userService.js');
      (userService.validatePassword as any).mockResolvedValue({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'super_admin',
      });

      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'admin@example.com',
          password: 'correctpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toEqual({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'super_admin',
      });
    });
  });

  describe('POST /api/auth/admin/api-keys', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/auth/admin/api-keys')
        .send({
          name: 'Test API Key',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Authentication required',
      });
    });
  });
});