# Plugin Platform Overhaul

This document describes the comprehensive plugin platform overhaul that transforms the Digital Commerce Platform into a Medusa-like architecture with a robust plugin system.

## Overview

The new plugin system provides:

- **Medusa-like Architecture**: Plugin-based extensibility with dependency management
- **Workers Runtime**: Safe sandboxed execution in Cloudflare Workers
- **Plugin SDK**: Developer-friendly API for creating plugins
- **Admin CLI**: Command-line tools for plugin development and management
- **Reference Plugins**: Production-ready starter plugins
- **Comprehensive Testing**: Full test coverage for plugin system

## Architecture

### Core Components

#### 1. Plugin Module (`src/plugins/`)

- **Manifest Schema** (`manifest.ts`): Zod-validated plugin manifests with comprehensive metadata
- **Dependency Resolver** (`dependency-resolver.ts`): Topological sorting and conflict detection
- **Lifecycle Manager** (`lifecycle.ts`): Plugin installation, activation, deactivation, uninstallation
- **Dynamic Loader** (`loader.ts`): Runtime plugin loading with sandboxing
- **Context System** (`context.ts`): Secure per-tenant plugin contexts with D1, KV, R2 access

#### 2. Plugin SDK (`packages/plugin-sdk/`)

- **Type Definitions**: Complete TypeScript interfaces for all plugin types
- **Plugin Builder**: Fluent API for creating plugin manifests
- **Hook System**: Type-safe hook registration and execution
- **UI Components**: shadcn-compatible component registration
- **Validation Schemas**: Runtime validation for plugin data

#### 3. Admin CLI (`packages/admin-cli/`)

- **Plugin Scaffolding**: Generate boilerplate for different plugin types
- **Hook Management**: Add hooks to existing plugins
- **Validation Tools**: Validate plugin manifests and code
- **Installation Commands**: Install/uninstall plugins from CLI

#### 4. Reference Plugins (`examples/plugins/`)

- **Stripe Payment**: Complete payment gateway implementation
- **Google OAuth**: Authentication provider
- **Analytics Dashboard**: shadcn-based analytics with charts
- **Email Service**: SMTP email provider
- **CMS Integration**: Headless CMS integration

## Plugin Categories

### Payment Plugins
```typescript
interface PaymentPlugin extends BasePlugin {
  processPayment(context: PluginContext, paymentData: PaymentData): Promise<PaymentResult>;
  capturePayment(context: PluginContext, transactionId: string): Promise<any>;
  refundPayment(context: PluginContext, transactionId: string, amount?: number): Promise<any>;
  handleWebhook(context: PluginContext, event: string, data: any): Promise<void>;
}
```

### Auth Plugins
```typescript
interface AuthPlugin extends BasePlugin {
  authenticate(context: PluginContext, credentials: any): Promise<AuthResult>;
  authorize(context: PluginContext, user: any, resource: string, action: string): Promise<boolean>;
  refreshToken(context: PluginContext, token: string): Promise<string>;
}
```

### Analytics Plugins
```typescript
interface AnalyticsPlugin extends BasePlugin {
  trackEvent(context: PluginContext, eventData: EventData): Promise<void>;
  getMetrics(context: PluginContext, query: MetricsQuery): Promise<MetricsResult>;
  getDashboard(context: PluginContext, dashboardId: string): Promise<DashboardData>;
}
```

## Plugin Manifest

Comprehensive manifest with validation:

```json
{
  "name": "Stripe Payment Gateway",
  "slug": "stripe-gateway",
  "version": "1.0.0",
  "category": "payment",
  "dependencies": [
    { "name": "core-utils", "version": "^1.0.0" }
  ],
  "hooks": [
    {
      "name": "before_payment_process",
      "handler": "src/hooks/beforePaymentProcess.ts",
      "priority": 100
    }
  ],
  "api_endpoints": [
    {
      "method": "POST",
      "path": "/process-payment",
      "handler": "src/api/processPayment.ts",
      "auth_required": true
    }
  ],
  "admin_ui": {
    "settings_component": "src/admin/Settings.tsx",
    "widgets": [
      {
        "id": "stripe-revenue",
        "component": "src/admin/RevenueWidget.tsx",
        "dashboard": "analytics"
      }
    ]
  },
  "settings_schema": {
    "api_key": {
      "type": "string",
      "label": "API Key",
      "required": true,
      "sensitive": true
    }
  }
}
```

## Hook System

### Available Hooks

- **Product Hooks**: `before_product_create`, `after_product_create`, `before_product_update`, `after_product_update`
- **Order Hooks**: `before_order_create`, `after_order_create`, `before_order_complete`, `after_order_complete`
- **Payment Hooks**: `before_payment_process`, `after_payment_success`, `after_payment_failure`
- **User Hooks**: `before_user_create`, `after_user_create`, `user_login`, `user_logout`
- **Auth Hooks**: `before_authenticate`, `after_authenticate`, `authentication_failed`
- **System Hooks**: `plugin_installed`, `plugin_activated`, `plugin_error`

### Hook Implementation

```typescript
import { HookHandler, PluginContext, PaymentHookData } from '@digital-commerce/plugin-sdk';

const handler: HookHandler<PaymentHookData> = async (context: PluginContext, data) => {
  // Add metadata to payment
  data.payment.metadata = {
    ...data.payment.metadata,
    processed_by: 'my-plugin',
    timestamp: new Date().toISOString(),
  };

  // Validate payment
  if (data.payment.amount < 0.50) {
    throw new Error('Minimum payment is $0.50');
  }

  return data.payment;
};

export default handler;
```

## Plugin Development

### Using the Plugin Builder

```typescript
import { createPaymentPlugin } from '@digital-commerce/plugin-sdk';

const manifest = createPaymentPlugin('Stripe Gateway', 'stripe-gateway')
  .version('1.0.0')
  .description('Stripe payment integration')
  .author('Your Name')
  .dependency('core-utils', '^1.0.0')
  .hook('before_payment_process', 'src/hooks/beforePayment.ts')
  .apiEndpoint('POST', '/process', 'src/api/process.ts')
  .webhook('/webhooks/stripe')
  .setting('api_key', {
    type: 'string',
    label: 'API Key',
    required: true,
    sensitive: true,
  })
  .build();
```

### CLI Scaffolding

```bash
# Scaffold a new payment plugin
admin-cli scaffold payment stripe-gateway --author "Your Name"

# Add a hook to existing plugin
admin-cli add-hook before_payment_create ./plugins/stripe-gateway

# Validate plugin
admin-cli validate ./plugins/stripe-gateway

# Install plugin
admin-cli install stripe-gateway --tenant tenant-123
```

## Plugin Context

Plugins receive a secure context with access to:

```typescript
interface PluginContext {
  // Tenant information
  tenant: {
    id: string;
    slug: string;
    name: string;
    settings: Record<string, any>;
  };
  
  // Plugin information
  plugin: {
    id: string;
    slug: string;
    manifest: PluginManifest;
    config: Record<string, any>;
  };

  // Database access (tenant-scoped)
  db: {
    query: (sql: string, params?: any[]) => Promise<any[]>;
    one: (sql: string, params?: any[]) => Promise<any>;
    transaction: (callback: (db: any) => Promise<any>) => Promise<any>;
  };

  // Cache access (tenant-scoped)
  cache: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, ttl?: number) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };

  // Storage access (tenant-scoped)
  storage: {
    upload: (key: string, data: ArrayBuffer, metadata?: Record<string, string>) => Promise<string>;
    download: (key: string) => Promise<ArrayBuffer>;
    delete: (key: string) => Promise<void>;
  };

  // HTTP client
  http: {
    get: (url: string, options?: RequestInit) => Promise<Response>;
    post: (url: string, data?: any, options?: RequestInit) => Promise<Response>;
  };

  // Event system
  events: {
    emit: (event: string, data: any) => Promise<void>;
    on: (event: string, handler: (data: any) => Promise<void>) => void;
  };

  // Logging
  logger: {
    debug: (message: string, meta?: Record<string, any>) => void;
    info: (message: string, meta?: Record<string, any>) => void;
    warn: (message: string, meta?: Record<string, any>) => void;
    error: (message: string, error?: Error, meta?: Record<string, any>) => void;
  };
}
```

## Security Features

### Sandboxing
- Memory limits per plugin
- Execution timeouts
- Network access restrictions
- Tenant data isolation

### Permissions
- Plugin-specific permissions
- Role-based access control
- API endpoint protection

### Validation
- Manifest schema validation
- Configuration validation
- Input sanitization

## Admin API

### Plugin Management Endpoints

```
GET    /api/admin/plugins/available     # List available plugins
GET    /api/admin/plugins/installed     # List installed plugins
GET    /api/admin/plugins/:slug         # Get plugin details
POST   /api/admin/plugins/:slug/install # Install plugin
POST   /api/admin/plugins/:slug/activate # Activate plugin
POST   /api/admin/plugins/:slug/deactivate # Deactivate plugin
DELETE /api/admin/plugins/:slug         # Uninstall plugin
PUT    /api/admin/plugins/:slug/config # Update configuration
GET    /api/admin/plugins/:slug/config # Get configuration
GET    /api/admin/plugins/:slug/dependencies # Check dependencies
GET    /api/admin/plugins/:slug/health # Get health status
GET    /api/admin/plugins/graph/dependencies # Get dependency graph
```

## Testing

### Unit Tests
```typescript
describe('Plugin System', () => {
  it('should register valid plugin', async () => {
    const manifest = createPlugin('Test Plugin', 'test')
      .category('payment')
      .build();
    
    await pluginManager.registerPlugin(manifest);
    
    const plugins = await pluginManager.listPlugins();
    expect(plugins).toContainEqual(
      expect.objectContaining({ slug: 'test' })
    );
  });
});
```

### Integration Tests
```typescript
describe('Plugin Integration', () => {
  it('should execute hooks in order', async () => {
    const results = await pluginManager.executeHook('before_payment', paymentData);
    expect(results).toHaveLength(2);
    expect(results[0].priority).toBeLessThan(results[1].priority);
  });
});
```

## Performance Considerations

### Workers Runtime
- 30-second execution limits
- 128MB memory limits
- Cold start optimization
- Efficient D1 queries

### Plugin Optimization
- Lazy loading of plugin components
- Efficient hook execution
- Minimal database queries
- Proper cache usage

## Migration Guide

### From Legacy System
1. Export existing plugin configurations
2. Update manifest format
3. Implement new hook system
4. Migrate database tables
5. Update admin UI
6. Test plugin functionality

### Plugin Updates
1. Update plugin dependencies
2. Migrate configuration schema
3. Update hook handlers
4. Test with new SDK
5. Deploy updated plugin

## Best Practices

### Plugin Development
1. Use the Plugin Builder API
2. Implement proper error handling
3. Add comprehensive logging
4. Write tests for hooks
5. Document configuration options

### Security
1. Validate all inputs
2. Use secure defaults
3. Implement proper permissions
4. Sanitize outputs
5. Monitor resource usage

### Performance
1. Minimize database queries
2. Use caching effectively
3. Implement proper timeouts
4. Avoid blocking operations
5. Monitor memory usage

## Troubleshooting

### Common Issues

1. **Plugin Installation Fails**
   - Check manifest validation
   - Verify dependencies
   - Check permissions

2. **Hook Not Executing**
   - Verify hook registration
   - Check priority settings
   - Confirm plugin activation

3. **Performance Issues**
   - Monitor memory usage
   - Check execution times
   - Review database queries

### Debug Tools

```bash
# Validate plugin manifest
admin-cli validate ./plugins/my-plugin

# Check dependencies
admin-cli dependencies my-plugin

# Monitor plugin performance
curl /api/admin/plugins/my-plugin/health
```

## Future Enhancements

### Planned Features
1. Plugin marketplace
2. Version management
3. Automatic updates
4. Advanced analytics
5. Plugin composition

### Roadmap
- **Q1 2024**: Core plugin system
- **Q2 2024**: Plugin marketplace
- **Q3 2024**: Advanced features
- **Q4 2024**: Performance optimization

## Support

### Documentation
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
- [API Reference](./API.md)
- [Examples](./examples/plugins/)

### Community
- GitHub Discussions
- Discord Server
- Stack Overflow Tag

### Support
- Issue Tracker
- Email Support
- Enterprise Support