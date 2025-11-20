import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuperAdminService } from '../services/superAdminService.js';
import { userService } from '../services/userService.js';

// Mock the userService
vi.mock('../services/userService.js', () => ({
  userService: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

// Mock the config
vi.mock('../config/env.js', () => ({
  config: {
    superAdminEmail: 'admin@platform.example.com',
    superAdminPassword: 'admin123',
    superAdminApiKey: 'sk_test_anyvaluedemo',
  },
}));

describe('SuperAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the initialized flag
    (SuperAdminService as any).initialized = false;
  });

  it('should create super admin if it does not exist', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@platform.example.com',
      role: 'super_admin',
      api_key: 'sk_test_anyvaluedemo',
    };

    (userService.getUserByEmail as any).mockResolvedValue(null);
    (userService.createUser as any).mockResolvedValue(mockUser);

    await SuperAdminService.initializeSuperAdmin();

    expect(userService.getUserByEmail).toHaveBeenCalledWith('admin@platform.example.com');
    expect(userService.createUser).toHaveBeenCalledWith({
      email: 'admin@platform.example.com',
      password: 'admin123',
      role: 'super_admin',
      api_key: 'sk_test_anyvaluedemo',
    });
  });

  it('should not create super admin if it already exists with same API key', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@platform.example.com',
      role: 'super_admin',
      api_key: 'sk_test_anyvaluedemo',
    };

    (userService.getUserByEmail as any).mockResolvedValue(mockUser);

    await SuperAdminService.initializeSuperAdmin();

    expect(userService.getUserByEmail).toHaveBeenCalledWith('admin@platform.example.com');
    expect(userService.createUser).not.toHaveBeenCalled();
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('should update API key if super admin exists with different key', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@platform.example.com',
      role: 'super_admin',
      api_key: 'old_api_key',
    };

    (userService.getUserByEmail as any).mockResolvedValue(mockUser);
    (userService.updateUser as any).mockResolvedValue({ ...mockUser, api_key: 'sk_test_anyvaluedemo' });

    await SuperAdminService.initializeSuperAdmin();

    expect(userService.getUserByEmail).toHaveBeenCalledWith('admin@platform.example.com');
    expect(userService.updateUser).toHaveBeenCalledWith('user-123', {
      api_key: 'sk_test_anyvaluedemo',
    });
  });

  it('should return the correct API key', () => {
    expect(SuperAdminService.getApiKey()).toBe('sk_test_anyvaluedemo');
  });

  it('should return the correct super admin email', () => {
    expect(SuperAdminService.getSuperAdminEmail()).toBe('admin@platform.example.com');
  });

  it('should validate API key correctly', async () => {
    expect(await SuperAdminService.validateSuperAdminApiKey('sk_test_anyvaluedemo')).toBe(true);
    expect(await SuperAdminService.validateSuperAdminApiKey('wrong_key')).toBe(false);
  });

  it('should not initialize twice', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@platform.example.com',
      role: 'super_admin',
      api_key: 'sk_test_anyvaluedemo',
    };

    (userService.getUserByEmail as any).mockResolvedValue(mockUser);

    await SuperAdminService.initializeSuperAdmin();
    await SuperAdminService.initializeSuperAdmin(); // Second call

    // Should only be called once
    expect(userService.getUserByEmail).toHaveBeenCalledTimes(1);
  });
});