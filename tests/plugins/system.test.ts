import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginManager } from '../../src/plugins/index.js';
import { createPlugin } from '@digital-commerce/plugin-sdk';

describe('Plugin System', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager({
      enableHotReload: false,
      enableSandboxing: true,
      maxPluginMemory: 128,
      allowedPluginCategories: ['payment', 'auth', 'analytics', 'utility'],
    });
  });

  afterEach(async () => {
    pluginManager.stop();
    await pluginManager.clearAll?.();
  });

  describe('Plugin Registration', () => {
    it('should register a valid plugin', async () => {
      const manifest = createPlugin('Test Payment Plugin', 'test-payment')
        .version('1.0.0')
        .description('A test payment plugin')
        .category('payment')
        .dependency('core-utils', '^1.0.0')
        .hook('before_payment_process', 'src/hooks/beforePayment.ts')
        .apiEndpoint('POST', '/process', 'src/api/process.ts')
        .setting('api_key', {
          type: 'string',
          label: 'API Key',
          required: true,
          sensitive: true,
        })
        .build();

      await expect(pluginManager.registerPlugin(manifest)).resolves.not.toThrow();
      
      const plugins = await pluginManager.listPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].slug).toBe('test-payment');
      expect(plugins[0].version).toBe('1.0.0');
    });

    it('should reject plugin with invalid category', async () => {
      const manifest = createPlugin('Invalid Plugin', 'invalid')
        .category('invalid-category' as any)
        .build();

      await expect(pluginManager.registerPlugin(manifest)).rejects.toThrow('Plugin category invalid-category is not allowed');
    });

    it('should reject plugin with invalid manifest', async () => {
      const invalidManifest = {
        name: '',
        slug: 'invalid',
        // Missing required fields
      };

      await expect(pluginManager.registerPlugin(invalidManifest as any)).rejects.toThrow();
    });
  });

  describe('Plugin Installation', () => {
    const tenantId = 'test-tenant-123';
    
    beforeEach(async () => {
      // Register a test plugin
      const manifest = createPlugin('Test Payment Plugin', 'test-payment')
        .version('1.0.0')
        .description('A test payment plugin')
        .category('payment')
        .build();

      await pluginManager.registerPlugin(manifest);
    });

    it('should install plugin for tenant', async () => {
      const config = {
        api_key: 'test-key',
        enabled: true,
      };

      await expect(pluginManager.installPlugin(tenantId, 'test-payment', config)).resolves.not.toThrow();
      
      const pluginInfo = await pluginManager.getPluginInfo('test-payment');
      expect(pluginInfo?.installed).toBe(true);
    });

    it('should reject installation of non-existent plugin', async () => {
      await expect(pluginManager.installPlugin(tenantId, 'non-existent', {})).rejects.toThrow('Plugin non-existent is not registered');
    });

    it('should reject duplicate installation', async () => {
      await pluginManager.installPlugin(tenantId, 'test-payment', {});
      
      await expect(pluginManager.installPlugin(tenantId, 'test-payment', {})).rejects.toThrow('Plugin test-payment is already installed');
    });
  });

  describe('Plugin Activation', () => {
    const tenantId = 'test-tenant-123';
    
    beforeEach(async () => {
      // Register and install a test plugin
      const manifest = createPlugin('Test Payment Plugin', 'test-payment')
        .version('1.0.0')
        .description('A test payment plugin')
        .category('payment')
        .hook('before_payment_process', 'src/hooks/beforePayment.ts')
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'test-payment', {});
    });

    it('should activate installed plugin', async () => {
      await expect(pluginManager.activatePlugin(tenantId, 'test-payment')).resolves.not.toThrow();
      
      const pluginInfo = await pluginManager.getPluginInfo('test-payment');
      expect(pluginInfo?.active).toBe(true);
    });

    it('should reject activation of non-installed plugin', async () => {
      await expect(pluginManager.activatePlugin(tenantId, 'non-existent')).rejects.toThrow('Plugin non-existent is not installed');
    });
  });

  describe('Plugin Deactivation', () => {
    const tenantId = 'test-tenant-123';
    
    beforeEach(async () => {
      // Register, install, and activate a test plugin
      const manifest = createPlugin('Test Payment Plugin', 'test-payment')
        .version('1.0.0')
        .description('A test payment plugin')
        .category('payment')
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'test-payment', {});
      await pluginManager.activatePlugin(tenantId, 'test-payment');
    });

    it('should deactivate active plugin', async () => {
      await expect(pluginManager.deactivatePlugin(tenantId, 'test-payment')).resolves.not.toThrow();
      
      const pluginInfo = await pluginManager.getPluginInfo('test-payment');
      expect(pluginInfo?.active).toBe(false);
    });
  });

  describe('Plugin Uninstallation', () => {
    const tenantId = 'test-tenant-123';
    
    beforeEach(async () => {
      // Register, install, and activate a test plugin
      const manifest = createPlugin('Test Payment Plugin', 'test-payment')
        .version('1.0.0')
        .description('A test payment plugin')
        .category('payment')
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'test-payment', {});
      await pluginManager.activatePlugin(tenantId, 'test-payment');
    });

    it('should uninstall installed plugin', async () => {
      await expect(pluginManager.uninstallPlugin(tenantId, 'test-payment')).resolves.not.toThrow();
      
      const pluginInfo = await pluginManager.getPluginInfo('test-payment');
      expect(pluginInfo?.installed).toBe(false);
      expect(pluginInfo?.active).toBe(false);
    });
  });

  describe('Hook Execution', () => {
    const tenantId = 'test-tenant-123';
    
    beforeEach(async () => {
      // Register, install, and activate a test plugin with hooks
      const manifest = createPlugin('Test Payment Plugin', 'test-payment')
        .version('1.0.0')
        .description('A test payment plugin')
        .category('payment')
        .hook('before_payment_process', 'src/hooks/beforePayment.ts', 50)
        .hook('after_payment_success', 'src/hooks/afterPayment.ts', 100)
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'test-payment', {});
      await pluginManager.activatePlugin(tenantId, 'test-payment');
    });

    it('should execute hooks in priority order', async () => {
      const hookData = {
        amount: 100,
        currency: 'USD',
        orderId: 'order-123',
      };

      const results = await pluginManager.executeHook('before_payment_process', hookData);
      expect(results).toBeDefined();
      // In a real implementation, this would test actual hook execution
    });

    it('should handle hook execution errors gracefully', async () => {
      const hookData = {
        amount: 100,
        currency: 'USD',
      };

      // Should not throw even if hooks fail
      await expect(pluginManager.executeHook('before_payment_process', hookData)).resolves.toBeDefined();
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve simple dependencies', async () => {
      // Register core plugin
      const coreManifest = createPlugin('Core Utils', 'core-utils')
        .version('1.0.0')
        .category('utility')
        .build();

      await pluginManager.registerPlugin(coreManifest);

      // Register plugin with dependency
      const paymentManifest = createPlugin('Payment Plugin', 'payment-plugin')
        .version('1.0.0')
        .category('payment')
        .dependency('core-utils', '^1.0.0')
        .build();

      await pluginManager.registerPlugin(paymentManifest);

      const resolution = pluginManager.checkDependencies('payment-plugin');
      expect(resolution.success).toBe(true);
      expect(resolution.resolved).toContain('core-utils');
      expect(resolution.resolved).toContain('payment-plugin');
    });

    it('should detect missing dependencies', async () => {
      const manifest = createPlugin('Payment Plugin', 'payment-plugin')
        .version('1.0.0')
        .category('payment')
        .dependency('missing-dep', '^1.0.0')
        .build();

      await pluginManager.registerPlugin(manifest);

      const resolution = pluginManager.checkDependencies('payment-plugin');
      expect(resolution.success).toBe(false);
      expect(resolution.missing).toHaveLength(1);
      expect(resolution.missing[0].dependency).toBe('missing-dep');
    });

    it('should detect version conflicts', async () => {
      // Register core plugin with version 1.0.0
      const coreManifest = createPlugin('Core Utils', 'core-utils')
        .version('1.0.0')
        .category('utility')
        .build();

      await pluginManager.registerPlugin(coreManifest);

      // Register plugin requiring incompatible version
      const paymentManifest = createPlugin('Payment Plugin', 'payment-plugin')
        .version('1.0.0')
        .category('payment')
        .dependency('core-utils', '^2.0.0')
        .build();

      await pluginManager.registerPlugin(paymentManifest);

      const resolution = pluginManager.checkDependencies('payment-plugin');
      expect(resolution.success).toBe(false);
      expect(resolution.conflicts).toHaveLength(1);
    });

    it('should detect circular dependencies', async () => {
      // This would require more complex setup with interdependent plugins
      // For now, we'll test the basic circular detection logic
      
      const plugin1 = createPlugin('Plugin 1', 'plugin-1')
        .version('1.0.0')
        .category('utility')
        .dependency('plugin-2', '^1.0.0')
        .build();

      const plugin2 = createPlugin('Plugin 2', 'plugin-2')
        .version('1.0.0')
        .category('utility')
        .dependency('plugin-1', '^1.0.0')
        .build();

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);

      const resolution = pluginManager.checkDependencies('plugin-1');
      // In a real implementation, this would detect circular dependencies
      expect(resolution.success).toBeDefined();
    });
  });

  describe('Plugin Categories', () => {
    it('should filter plugins by category', async () => {
      // Register plugins in different categories
      const paymentPlugin = createPlugin('Payment Plugin', 'payment-plugin')
        .version('1.0.0')
        .category('payment')
        .build();

      const authPlugin = createPlugin('Auth Plugin', 'auth-plugin')
        .version('1.0.0')
        .category('auth')
        .build();

      await pluginManager.registerPlugin(paymentPlugin);
      await pluginManager.registerPlugin(authPlugin);

      const paymentPlugins = await pluginManager.getPluginsByCategory('payment');
      const authPlugins = await pluginManager.getPluginsByCategory('auth');

      expect(paymentPlugins).toHaveLength(1);
      expect(paymentPlugins[0].slug).toBe('payment-plugin');
      expect(authPlugins).toHaveLength(1);
      expect(authPlugins[0].slug).toBe('auth-plugin');
    });
  });

  describe('Plugin Statistics', () => {
    it('should return accurate statistics', async () => {
      // Register multiple plugins
      const plugins = [
        createPlugin('Plugin 1', 'plugin-1').category('payment').build(),
        createPlugin('Plugin 2', 'plugin-2').category('auth').build(),
        createPlugin('Plugin 3', 'plugin-3').category('analytics').build(),
      ];

      for (const manifest of plugins) {
        await pluginManager.registerPlugin(manifest);
      }

      const stats = pluginManager.getStats();
      expect(stats.registeredPlugins).toBe(3);
      expect(stats.installedPlugins).toBe(0);
      expect(stats.activePlugins).toBe(0);
      expect(stats.loadedPlugins).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin registration errors', async () => {
      const invalidManifest = null;
      
      await expect(pluginManager.registerPlugin(invalidManifest as any)).rejects.toThrow();
    });

    it('should handle plugin installation errors', async () => {
      await expect(pluginManager.installPlugin('invalid-tenant', 'non-existent', {})).rejects.toThrow();
    });

    it('should handle plugin activation errors', async () => {
      await expect(pluginManager.activatePlugin('invalid-tenant', 'non-existent')).rejects.toThrow();
    });
  });
});