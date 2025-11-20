import { describe, it, expect } from 'vitest';
import { 
  createPlugin, 
  createPaymentPlugin, 
  createAuthPlugin, 
  createEmailPlugin,
  createAnalyticsPlugin,
  validatePluginManifest,
  HookRegistry,
  HookExecutor,
  HookDefinitions,
} from '../src/index.js';

describe('Plugin SDK', () => {
  describe('Plugin Builder', () => {
    it('should create a basic plugin manifest', () => {
      const manifest = createPlugin('Test Plugin', 'test-plugin')
        .version('1.0.0')
        .description('A test plugin')
        .author('Test Author')
        .category('utility')
        .build();

      expect(manifest.name).toBe('Test Plugin');
      expect(manifest.slug).toBe('test-plugin');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.description).toBe('A test plugin');
      expect(manifest.author).toBe('Test Author');
      expect(manifest.category).toBe('utility');
    });

    it('should create a payment plugin manifest', () => {
      const manifest = createPaymentPlugin('Stripe Gateway', 'stripe-gateway')
        .version('1.0.0')
        .description('Stripe payment integration')
        .hook('before_payment_process', 'src/hooks/beforePayment.ts')
        .apiEndpoint('POST', '/process', 'src/api/process.ts')
        .setting('api_key', {
          type: 'string',
          label: 'API Key',
          required: true,
          sensitive: true,
        })
        .build();

      expect(manifest.category).toBe('payment');
      expect(manifest.hooks).toHaveLength(1);
      expect(manifest.hooks![0].name).toBe('before_payment_process');
      expect(manifest.api_endpoints).toHaveLength(1);
      expect(manifest.api_endpoints![0].method).toBe('POST');
      expect(manifest.settings_schema).toHaveProperty('api_key');
    });

    it('should create an auth plugin manifest', () => {
      const manifest = createAuthPlugin('Google OAuth', 'google-oauth')
        .oauth('google')
        .oauth('facebook')
        .build();

      expect(manifest.category).toBe('auth');
      expect(manifest.settings_schema).toHaveProperty('google_client_id');
      expect(manifest.settings_schema).toHaveProperty('google_client_secret');
      expect(manifest.settings_schema).toHaveProperty('facebook_client_id');
      expect(manifest.settings_schema).toHaveProperty('facebook_client_secret');
    });

    it('should create an email plugin manifest', () => {
      const manifest = createEmailPlugin('SMTP Mailer', 'smtp-mailer')
        .smtp()
        .build();

      expect(manifest.category).toBe('email');
      expect(manifest.settings_schema).toHaveProperty('smtp_host');
      expect(manifest.settings_schema).toHaveProperty('smtp_port');
      expect(manifest.settings_schema).toHaveProperty('smtp_user');
      expect(manifest.settings_schema).toHaveProperty('smtp_password');
    });

    it('should create an analytics plugin manifest', () => {
      const manifest = createAnalyticsPlugin('Google Analytics', 'google-analytics')
        .dashboard('Revenue', 'revenue-widget', 'src/components/RevenueChart.tsx')
        .build();

      expect(manifest.category).toBe('analytics');
      expect(manifest.admin_ui?.widgets).toHaveLength(1);
      expect(manifest.admin_ui?.widgets![0].id).toBe('revenue-widget');
    });

    it('should validate plugin manifest', () => {
      const manifest = createPlugin('Valid Plugin', 'valid-plugin')
        .version('1.0.0')
        .description('A valid plugin')
        .author('Test Author')
        .category('utility')
        .build();

      const validation = validatePluginManifest(manifest);
      expect(validation).toEqual(manifest);
    });

    it('should reject invalid plugin manifest', () => {
      const invalidManifest = {
        name: '',
        slug: 'invalid',
        // Missing required fields
      };

      expect(() => validatePluginManifest(invalidManifest)).toThrow();
    });
  });

  describe('Hook Registry', () => {
    beforeEach(() => {
      HookRegistry.clearHooks();
    });

    it('should register and retrieve hooks', () => {
      const handler = async (data: any) => data;
      
      HookRegistry.registerHook('test_hook', handler, 100);
      const hooks = HookRegistry.getHooks('test_hook');
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].handler).toBe(handler);
      expect(hooks[0].priority).toBe(100);
    });

    it('should sort hooks by priority', () => {
      const handler1 = async (data: any) => data;
      const handler2 = async (data: any) => data;
      const handler3 = async (data: any) => data;
      
      HookRegistry.registerHook('test_hook', handler1, 50);
      HookRegistry.registerHook('test_hook', handler2, 100);
      HookRegistry.registerHook('test_hook', handler3, 25);
      
      const hooks = HookRegistry.getHooks('test_hook');
      
      expect(hooks).toHaveLength(3);
      expect(hooks[0].priority).toBe(25);
      expect(hooks[1].priority).toBe(50);
      expect(hooks[2].priority).toBe(100);
    });

    it('should unregister hooks', () => {
      const handler = async (data: any) => data;
      
      HookRegistry.registerHook('test_hook', handler);
      expect(HookRegistry.getHooks('test_hook')).toHaveLength(1);
      
      HookRegistry.unregisterHook('test_hook', handler);
      expect(HookRegistry.getHooks('test_hook')).toHaveLength(0);
    });

    it('should clear all hooks', () => {
      const handler = async (data: any) => data;
      
      HookRegistry.registerHook('test_hook1', handler);
      HookRegistry.registerHook('test_hook2', handler);
      expect(HookRegistry.getHooks('test_hook1')).toHaveLength(1);
      expect(HookRegistry.getHooks('test_hook2')).toHaveLength(1);
      
      HookRegistry.clearHooks();
      expect(HookRegistry.getHooks('test_hook1')).toHaveLength(0);
      expect(HookRegistry.getHooks('test_hook2')).toHaveLength(0);
    });

    it('should clear specific hooks', () => {
      const handler = async (data: any) => data;
      
      HookRegistry.registerHook('test_hook1', handler);
      HookRegistry.registerHook('test_hook2', handler);
      
      HookRegistry.clearHooks('test_hook1');
      expect(HookRegistry.getHooks('test_hook1')).toHaveLength(0);
      expect(HookRegistry.getHooks('test_hook2')).toHaveLength(1);
    });
  });

  describe('Hook Executor', () => {
    beforeEach(() => {
      HookRegistry.clearHooks();
    });

    it('should execute hooks and return results', async () => {
      const handler1 = async (data: any) => ({ ...data, modified: true });
      const handler2 = async (data: any) => ({ ...data, processed: true });
      
      HookRegistry.registerHook('test_hook', handler1, 10);
      HookRegistry.registerHook('test_hook', handler2, 20);
      
      const results = await HookExecutor.executeHook('test_hook', { test: true });
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ test: true, modified: true });
      expect(results[1]).toEqual({ test: true, processed: true });
    });

    it('should handle hook execution errors gracefully', async () => {
      const handler1 = async (data: any) => ({ ...data, success: true });
      const handler2 = async (data: any) => {
        throw new Error('Hook failed');
      };
      const handler3 = async (data: any) => ({ ...data, completed: true });
      
      HookRegistry.registerHook('test_hook', handler1);
      HookRegistry.registerHook('test_hook', handler2);
      HookRegistry.registerHook('test_hook', handler3);
      
      const results = await HookExecutor.executeHook('test_hook', { test: true });
      
      expect(results).toHaveLength(2); // Only successful hooks return results
      expect(results[0]).toEqual({ test: true, success: true });
      expect(results[1]).toEqual({ test: true, completed: true });
    });

    it('should execute hooks with filter', async () => {
      const handler1 = async (data: any) => ({ ...data, type: 'success' });
      const handler2 = async (data: any) => ({ ...data, type: 'error' });
      const handler3 = async (data: any) => ({ ...data, type: 'success' });
      
      HookRegistry.registerHook('test_hook', handler1);
      HookRegistry.registerHook('test_hook', handler2);
      HookRegistry.registerHook('test_hook', handler3);
      
      const results = await HookExecutor.executeHookWithFilter(
        'test_hook',
        { test: true },
        (result) => result.type === 'success'
      );
      
      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('success');
      expect(results[1].type).toBe('success');
    });

    it('should execute hooks with transform', async () => {
      const handler1 = async (data: any) => ({ success: true, data: 'result1' });
      const handler2 = async (data: any) => ({ success: true, data: 'result2' });
      
      HookRegistry.registerHook('test_hook', handler1);
      HookRegistry.registerHook('test_hook', handler2);
      
      const results = await HookExecutor.executeHookWithTransform(
        'test_hook',
        { test: true },
        (result) => result.data
      );
      
      expect(results).toHaveLength(2);
      expect(results[0]).toBe('result1');
      expect(results[1]).toBe('result2');
    });

    it('should execute hooks until condition is met', async () => {
      const handler1 = async (data: any) => ({ stop: false, data: 'result1' });
      const handler2 = async (data: any) => ({ stop: false, data: 'result2' });
      const handler3 = async (data: any) => ({ stop: true, data: 'result3' });
      const handler4 = async (data: any) => ({ stop: false, data: 'result4' });
      
      HookRegistry.registerHook('test_hook', handler1, 10);
      HookRegistry.registerHook('test_hook', handler2, 20);
      HookRegistry.registerHook('test_hook', handler3, 30);
      HookRegistry.registerHook('test_hook', handler4, 40);
      
      const result = await HookExecutor.executeHookUntil(
        'test_hook',
        { test: true },
        (result) => result.stop
      );
      
      expect(result).toEqual({ stop: true, data: 'result3' });
    });
  });

  describe('Hook Definitions', () => {
    it('should contain all required hook definitions', () => {
      // Product hooks
      expect(HookDefinitions.BEFORE_PRODUCT_CREATE).toBe('before_product_create');
      expect(HookDefinitions.AFTER_PRODUCT_CREATE).toBe('after_product_create');
      
      // Order hooks
      expect(HookDefinitions.BEFORE_ORDER_CREATE).toBe('before_order_create');
      expect(HookDefinitions.AFTER_ORDER_COMPLETE).toBe('after_order_complete');
      
      // Payment hooks
      expect(HookDefinitions.BEFORE_PAYMENT_PROCESS).toBe('before_payment_process');
      expect(HookDefinitions.AFTER_PAYMENT_SUCCESS).toBe('after_payment_success');
      
      // Auth hooks
      expect(HookDefinitions.BEFORE_AUTHENTICATE).toBe('before_authenticate');
      expect(HookDefinitions.AFTER_AUTHENTICATE).toBe('after_authenticate');
      
      // System hooks
      expect(HookDefinitions.PLUGIN_INSTALLED).toBe('plugin_installed');
      expect(HookDefinitions.PLUGIN_ERROR).toBe('plugin_error');
    });
  });

  describe('Plugin Manifest Validation', () => {
    it('should validate complete manifest', () => {
      const manifest = createPlugin('Complete Plugin', 'complete-plugin')
        .version('1.0.0')
        .description('A complete plugin with all fields')
        .author('Test Author')
        .homepage('https://example.com')
        .repository('https://github.com/example/plugin')
        .license('MIT')
        .platformVersion('1.0.0')
        .category('payment')
        .tags(['payment', 'gateway'])
        .dependency('core-utils', '^1.0.0')
        .hook('before_payment_process', 'src/hooks/beforePayment.ts', 50)
        .apiEndpoint('POST', '/process', 'src/api/process.ts')
        .settingsComponent('src/admin/Settings.tsx')
        .menuItem('Plugin Settings', '/plugin', {
          component: 'src/admin/Page.tsx',
          icon: 'settings',
        })
        .widget('plugin-widget', 'src/admin/Widget.tsx', 'analytics')
        .migration('1.0.0', 'Initial migration', 'migrations/001_initial.sql')
        .permission('plugin.manage', 'Manage plugin settings')
        .setting('api_key', {
          type: 'string',
          label: 'API Key',
          required: true,
          sensitive: true,
        })
        .installScript('scripts/install.ts')
        .uninstallScript('scripts/uninstall.ts')
        .activateScript('scripts/activate.ts')
        .deactivateScript('scripts/deactivate.ts')
        .runtime({
          memoryMB: 256,
          timeoutMs: 60000,
          cpuUnits: 2,
        })
        .scheduledTask('cleanup', '0 2 * * *', 'src/tasks/cleanup.ts')
        .webhook('payment.success', 'src/webhooks/paymentSuccess.ts')
        .i18n('en', ['en', 'es', 'fr'])
        .healthCheck({
          endpoint: '/health',
          interval: '5m',
          timeout: 10000,
        })
        .build();

      const validation = validatePluginManifest(manifest);
      expect(validation.name).toBe('Complete Plugin');
      expect(validation.slug).toBe('complete-plugin');
      expect(validation.hooks).toHaveLength(1);
      expect(validation.api_endpoints).toHaveLength(1);
      expect(validation.admin_ui?.menu_items).toHaveLength(1);
      expect(validation.admin_ui?.widgets).toHaveLength(1);
      expect(validation.database_migrations).toHaveLength(1);
      expect(validation.permissions).toHaveLength(1);
      expect(validation.settings_schema).toHaveProperty('api_key');
      expect(validation.scheduled_tasks).toHaveLength(1);
      expect(validation.webhooks).toHaveLength(1);
    });

    it('should reject manifest with invalid category', () => {
      const manifest = createPlugin('Invalid Plugin', 'invalid-plugin')
        .category('invalid-category' as any)
        .build();

      expect(() => validatePluginManifest(manifest)).toThrow();
    });

    it('should reject manifest with invalid version', () => {
      const manifest = createPlugin('Invalid Plugin', 'invalid-plugin')
        .version('invalid-version')
        .build();

      expect(() => validatePluginManifest(manifest)).toThrow();
    });

    it('should reject manifest with invalid slug', () => {
      const manifest = createPlugin('Invalid Plugin', 'Invalid_Slug')
        .build();

      expect(() => validatePluginManifest(manifest)).toThrow();
    });
  });

  describe('Plugin Types', () => {
    it('should support all plugin categories', () => {
      expect(() => createPlugin('Test', 'test').category('cms').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('auth').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('payment').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('delivery').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('email').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('analytics').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('integration').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('ui').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('workflow').build()).not.toThrow();
      expect(() => createPlugin('Test', 'test').category('utility').build()).not.toThrow();
    });

    it('should validate setting schemas', () => {
      const manifest = createPlugin('Test Plugin', 'test-plugin')
        .setting('string_field', {
          type: 'string',
          label: 'String Field',
          required: true,
        })
        .setting('number_field', {
          type: 'number',
          label: 'Number Field',
          default: 10,
          validation: { min: 1, max: 100 },
        })
        .setting('boolean_field', {
          type: 'boolean',
          label: 'Boolean Field',
          default: true,
        })
        .setting('select_field', {
          type: 'select',
          label: 'Select Field',
          options: ['option1', 'option2', 'option3'],
        })
        .build();

      const validation = validatePluginManifest(manifest);
      
      expect(validation.settings_schema).toHaveProperty('string_field');
      expect(validation.settings_schema).toHaveProperty('number_field');
      expect(validation.settings_schema).toHaveProperty('boolean_field');
      expect(validation.settings_schema).toHaveProperty('select_field');
      
      expect(validation.settings_schema.string_field.type).toBe('string');
      expect(validation.settings_schema.number_field.type).toBe('number');
      expect(validation.settings_schema.boolean_field.type).toBe('boolean');
      expect(validation.settings_schema.select_field.type).toBe('select');
    });
  });
});