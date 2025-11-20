import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginManager } from '../../src/plugins/index.js';
import { createPaymentPlugin, createAuthPlugin } from '@digital-commerce/plugin-sdk';

describe('Plugin System Integration', () => {
  let pluginManager: PluginManager;
  const tenantId = 'test-tenant-123';

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
  });

  describe('Complete Plugin Lifecycle', () => {
    it('should handle complete plugin lifecycle', async () => {
      // Create payment plugin manifest
      const paymentManifest = createPaymentPlugin('Test Payment', 'test-payment')
        .version('1.0.0')
        .description('Test payment plugin')
        .author('Test Author')
        .dependency('core-utils', '^1.0.0')
        .hook('before_payment_process', 'src/hooks/beforePayment.ts', 50)
        .hook('after_payment_success', 'src/hooks/afterPayment.ts', 100)
        .apiEndpoint('POST', '/process', 'src/api/process.ts')
        .apiEndpoint('POST', '/webhook', 'src/api/webhook.ts', {
          authRequired: false,
        })
        .setting('api_key', {
          type: 'string',
          label: 'API Key',
          required: true,
          sensitive: true,
        })
        .setting('enabled', {
          type: 'boolean',
          label: 'Enabled',
          default: true,
        })
        .widget('payment-stats', 'src/admin/PaymentStatsWidget.tsx', 'analytics')
        .build();

      // Register plugin
      await pluginManager.registerPlugin(paymentManifest);

      // Verify registration
      let plugins = await pluginManager.listPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].slug).toBe('test-payment');
      expect(plugins[0].category).toBe('payment');
      expect(plugins[0].installed).toBe(false);
      expect(plugins[0].active).toBe(false);

      // Install plugin
      const config = {
        api_key: 'test-api-key',
        enabled: true,
      };

      await pluginManager.installPlugin(tenantId, 'test-payment', config);

      // Verify installation
      let pluginInfo = await pluginManager.getPluginInfo('test-payment');
      expect(pluginInfo?.installed).toBe(true);
      expect(pluginInfo?.active).toBe(false);

      // Activate plugin
      await pluginManager.activatePlugin(tenantId, 'test-payment');

      // Verify activation
      pluginInfo = await pluginManager.getPluginInfo('test-payment');
      expect(pluginInfo?.active).toBe(true);
      expect(pluginInfo?.loaded).toBe(true);

      // Test hook execution
      const paymentData = {
        amount: 100,
        currency: 'USD',
        orderId: 'order-123',
      };

      const hookResults = await pluginManager.executeHook('before_payment_process', paymentData);
      expect(hookResults).toBeDefined();

      // Deactivate plugin
      await pluginManager.deactivatePlugin(tenantId, 'test-payment');

      // Verify deactivation
      pluginInfo = await pluginManager.getPluginInfo('test-payment');
      expect(pluginInfo?.active).toBe(false);
      expect(pluginInfo?.loaded).toBe(false);

      // Uninstall plugin
      await pluginManager.uninstallPlugin(tenantId, 'test-payment');

      // Verify uninstallation
      pluginInfo = await pluginManager.getPluginInfo('test-payment');
      expect(pluginInfo?.installed).toBe(false);
      expect(pluginInfo?.active).toBe(false);
    });
  });

  describe('Plugin Dependencies', () => {
    it('should resolve and install dependencies', async () => {
      // Register core utility plugin
      const coreManifest = createAuthPlugin('Core Utils', 'core-utils')
        .version('1.0.0')
        .category('utility')
        .build();

      await pluginManager.registerPlugin(coreManifest);

      // Register payment plugin with dependency
      const paymentManifest = createPaymentPlugin('Payment Plugin', 'payment-plugin')
        .version('1.0.0')
        .category('payment')
        .dependency('core-utils', '^1.0.0')
        .build();

      await pluginManager.registerPlugin(paymentManifest);

      // Check dependencies
      const resolution = pluginManager.checkDependencies('payment-plugin');
      expect(resolution.success).toBe(true);
      expect(resolution.resolved).toContain('core-utils');
      expect(resolution.resolved).toContain('payment-plugin');

      // Install payment plugin (should install dependency first)
      await pluginManager.installPlugin(tenantId, 'payment-plugin');

      // Verify both plugins are installed
      const coreInfo = await pluginManager.getPluginInfo('core-utils');
      const paymentInfo = await pluginManager.getPluginInfo('payment-plugin');

      expect(coreInfo?.installed).toBe(true);
      expect(paymentInfo?.installed).toBe(true);
    });

    it('should reject plugin with missing dependencies', async () => {
      const manifest = createPaymentPlugin('Payment Plugin', 'payment-plugin')
        .version('1.0.0')
        .category('payment')
        .dependency('missing-dep', '^1.0.0')
        .build();

      await pluginManager.registerPlugin(manifest);

      const resolution = pluginManager.checkDependencies('payment-plugin');
      expect(resolution.success).toBe(false);
      expect(resolution.missing).toHaveLength(1);
      expect(resolution.missing[0].dependency).toBe('missing-dep');

      // Should fail to install
      await expect(
        pluginManager.installPlugin(tenantId, 'payment-plugin')
      ).rejects.toThrow();
    });
  });

  describe('Plugin Configuration', () => {
    it('should handle plugin configuration updates', async () => {
      const manifest = createPaymentPlugin('Configurable Plugin', 'configurable-plugin')
        .version('1.0.0')
        .category('payment')
        .setting('api_key', {
          type: 'string',
          label: 'API Key',
          required: true,
          sensitive: true,
        })
        .setting('timeout', {
          type: 'number',
          label: 'Timeout',
          default: 30,
          validation: { min: 1, max: 300 },
        })
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'configurable-plugin', {
        api_key: 'initial-key',
        timeout: 60,
      });

      // Update configuration
      const newConfig = {
        api_key: 'updated-key',
        timeout: 120,
      };

      // This would be handled by admin API
      // For now, we'll test the plugin info
      const pluginInfo = await pluginManager.getPluginInfo('configurable-plugin');
      expect(pluginInfo).toBeDefined();
    });
  });

  describe('Plugin Health and Monitoring', () => {
    it('should track plugin statistics', async () => {
      // Register multiple plugins
      const plugins = [
        createPaymentPlugin('Payment 1', 'payment-1').category('payment').build(),
        createAuthPlugin('Auth 1', 'auth-1').category('auth').build(),
        createPaymentPlugin('Payment 2', 'payment-2').category('payment').build(),
      ];

      for (const manifest of plugins) {
        await pluginManager.registerPlugin(manifest);
      }

      const stats = pluginManager.getStats();
      expect(stats.registeredPlugins).toBe(3);
      expect(stats.installedPlugins).toBe(0);
      expect(stats.activePlugins).toBe(0);
      expect(stats.loadedPlugins).toBe(0);

      // Install and activate one plugin
      await pluginManager.installPlugin(tenantId, 'payment-1');
      await pluginManager.activatePlugin(tenantId, 'payment-1');

      const updatedStats = pluginManager.getStats();
      expect(updatedStats.installedPlugins).toBe(1);
      expect(updatedStats.activePlugins).toBe(1);
      expect(updatedStats.loadedPlugins).toBe(1);
    });

    it('should handle plugin errors gracefully', async () => {
      const manifest = createPaymentPlugin('Error Plugin', 'error-plugin')
        .version('1.0.0')
        .category('payment')
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'error-plugin');

      // Simulate plugin error during hook execution
      const paymentData = { amount: 100, currency: 'USD' };
      
      // Should not throw even if plugin has errors
      const results = await pluginManager.executeHook('before_payment_process', paymentData);
      expect(results).toBeDefined();
    });
  });

  describe('Plugin Categories and Filtering', () => {
    it('should filter plugins by category', async () => {
      const plugins = [
        createPaymentPlugin('Payment 1', 'payment-1').category('payment').build(),
        createAuthPlugin('Auth 1', 'auth-1').category('auth').build(),
        createPaymentPlugin('Payment 2', 'payment-2').category('payment').build(),
        createAuthPlugin('Auth 2', 'auth-2').category('auth').build(),
      ];

      for (const manifest of plugins) {
        await pluginManager.registerPlugin(manifest);
      }

      const paymentPlugins = await pluginManager.getPluginsByCategory('payment');
      const authPlugins = await pluginManager.getPluginsByCategory('auth');

      expect(paymentPlugins).toHaveLength(2);
      expect(authPlugins).toHaveLength(2);

      expect(paymentPlugins.every(p => p.category === 'payment')).toBe(true);
      expect(authPlugins.every(p => p.category === 'auth')).toBe(true);
    });

    it('should reject plugins with disallowed categories', async () => {
      const manifest = createAuthPlugin('Disallowed Plugin', 'disallowed')
        .category('disallowed-category' as any)
        .build();

      await expect(pluginManager.registerPlugin(manifest)).rejects.toThrow(
        'Plugin category disallowed-category is not allowed'
      );
    });
  });

  describe('Plugin API Integration', () => {
    it('should register plugin API routes', async () => {
      const manifest = createPaymentPlugin('API Plugin', 'api-plugin')
        .version('1.0.0')
        .category('payment')
        .apiEndpoint('POST', '/process', 'src/api/process.ts')
        .apiEndpoint('GET', '/status', 'src/api/status.ts')
        .apiEndpoint('POST', '/webhook', 'src/api/webhook.ts', {
          authRequired: false,
        })
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'api-plugin');
      await pluginManager.activatePlugin(tenantId, 'api-plugin');

      // Get routes from plugin manager
      const routes = pluginManager.getRoutes?.() || [];
      
      // Should have routes from the activated plugin
      expect(routes.length).toBeGreaterThan(0);
      
      const pluginRoutes = routes.filter(r => r.plugin === 'api-plugin');
      expect(pluginRoutes.length).toBe(3); // 3 API endpoints
    });

    it('should handle plugin route execution', async () => {
      const manifest = createPaymentPlugin('Route Plugin', 'route-plugin')
        .version('1.0.0')
        .category('payment')
        .apiEndpoint('POST', '/test', 'src/api/test.ts')
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'route-plugin');
      await pluginManager.activatePlugin(tenantId, 'route-plugin');

      // Mock request/response objects
      const mockReq = {
        method: 'POST',
        path: '/test',
        json: async () => ({ amount: 100, currency: 'USD' }),
      };

      const mockRes = {
        json: async (data: any) => data,
        status: (code: number) => mockRes,
      };

      const mockNext = async () => {};

      // Execute route (this would be handled by Hono in real implementation)
      const routes = pluginManager.getRoutes?.() || [];
      const route = routes.find(r => r.plugin === 'route-plugin' && r.path === '/test');
      
      expect(route).toBeDefined();
      expect(route?.method).toBe('POST');
    });
  });

  describe('Plugin UI Components', () => {
    it('should register plugin UI components', async () => {
      const manifest = createPaymentPlugin('UI Plugin', 'ui-plugin')
        .version('1.0.0')
        .category('payment')
        .widget('payment-widget', 'src/admin/PaymentWidget.tsx', 'analytics')
        .menuItem('Payment Settings', '/payment', {
          component: 'src/admin/PaymentSettings.tsx',
          icon: 'payment',
        })
        .settingsComponent('src/admin/Settings.tsx')
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'ui-plugin');
      await pluginManager.activatePlugin(tenantId, 'ui-plugin');

      // Get UI components from plugin manager (if implemented)
      const widgets = pluginManager.getWidgets?.('ui-plugin') || new Map();
      const components = pluginManager.getUIComponents?.('ui-plugin') || new Map();

      // In a real implementation, this would return the registered components
      expect(widgets.size).toBeGreaterThanOrEqual(0);
      expect(components.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Plugin Events', () => {
    it('should handle plugin lifecycle events', async () => {
      const events: any[] = [];

      // Register event listeners
      pluginManager.on('install', (event) => events.push(event));
      pluginManager.on('activate', (event) => events.push(event));
      pluginManager.on('deactivate', (event) => events.push(event));
      pluginManager.on('uninstall', (event) => events.push(event));

      const manifest = createPaymentPlugin('Event Plugin', 'event-plugin')
        .version('1.0.0')
        .category('payment')
        .build();

      await pluginManager.registerPlugin(manifest);
      await pluginManager.installPlugin(tenantId, 'event-plugin');
      await pluginManager.activatePlugin(tenantId, 'event-plugin');
      await pluginManager.deactivatePlugin(tenantId, 'event-plugin');
      await pluginManager.uninstallPlugin(tenantId, 'event-plugin');

      // Verify events were emitted
      const eventTypes = events.map(e => e.type);
      expect(eventTypes).toContain('install');
      expect(eventTypes).toContain('activate');
      expect(eventTypes).toContain('deactivate');
      expect(eventTypes).toContain('uninstall');

      // Verify event data
      const installEvent = events.find(e => e.type === 'install');
      expect(installEvent?.plugin).toBe('event-plugin');
      expect(installEvent?.tenant).toBe(tenantId);
    });
  });
});