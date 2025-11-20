import { describe, it, expect, beforeEach, vi } from 'vitest';
import { config } from '../../config/env.js';

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.SUPER_ADMIN_API_KEY;
    delete process.env.SUPER_ADMIN_EMAIL;
    delete process.env.SUPER_ADMIN_PASSWORD;
  });

  it('should use default values when environment variables are not set', () => {
    expect(config.superAdminApiKey).toBe('sk_test_anyvaluedemo');
    expect(config.superAdminEmail).toBe('admin@platform.example.com');
    expect(config.superAdminPassword).toBe('admin123');
  });

  it('should use environment variables when they are set', () => {
    process.env.SUPER_ADMIN_API_KEY = 'custom_api_key';
    process.env.SUPER_ADMIN_EMAIL = 'custom@example.com';
    process.env.SUPER_ADMIN_PASSWORD = 'custom_password';

    // Re-require the module to pick up new env vars
    vi.resetModules();
    const { config: newConfig } = require('../../config/env.js');

    expect(newConfig.superAdminApiKey).toBe('custom_api_key');
    expect(newConfig.superAdminEmail).toBe('custom@example.com');
    expect(newConfig.superAdminPassword).toBe('custom_password');
  });

  it('should have correct default configuration values', () => {
    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3000);
    expect(config.bcryptRounds).toBe(10);
  });
});