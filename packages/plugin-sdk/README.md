# Digital Commerce Platform - Plugin SDK

A comprehensive SDK for developing plugins for the Digital Commerce Platform. Built with TypeScript, provides type-safe plugin development with a Medusa-like architecture.

## Installation

```bash
npm install @digital-commerce/plugin-sdk
```

## Quick Start

### Create a Payment Plugin

```typescript
import { createPaymentPlugin, PluginContext } from '@digital-commerce/plugin-sdk';

export default class StripePaymentPlugin {
  name = 'Stripe Payment Gateway';
  version = '1.0.0';
  category = 'payment' as const;

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('Initializing Stripe Payment Gateway');
  }

  async processPayment(context: PluginContext, paymentData: any): Promise<any> {
    context.logger.info('Processing payment', { paymentData });
    
    // Your payment processing logic here
    return {
      success: true,
      transactionId: 'txn_' + Date.now(),
      status: 'completed',
    };
  }
}

// Create the manifest
const manifest = createPaymentPlugin('Stripe Gateway', 'stripe-gateway')
  .version('1.0.0')
  .description('Stripe payment gateway integration')
  .author('Your Name')
  .hook('before_payment_process', 'src/hooks/beforePayment.ts')
  .apiEndpoint('POST', '/process-payment', 'src/api/process.ts')
  .webhook('/webhooks/stripe')
  .setting('api_key', {
    type: 'string',
    label: 'API Key',
    required: true,
    sensitive: true,
  })
  .build();

export { manifest };
```

### Create an Auth Plugin

```typescript
import { createAuthPlugin, PluginContext } from '@digital-commerce/plugin-sdk';

export default class GoogleAuthPlugin {
  name = 'Google OAuth';
  version = '1.0.0';
  category = 'auth' as const;

  async authenticate(context: PluginContext, credentials: any): Promise<any> {
    context.logger.info('Authenticating with Google');
    
    // Your authentication logic here
    return {
      user: { id: 'user_123', email: credentials.email },
      token: 'jwt_token_here',
    };
  }
}

const manifest = createAuthPlugin('Google OAuth', 'google-oauth')
  .oauth('google', {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
  .apiEndpoint('GET', '/auth/google', 'src/api/oauth.ts')
  .build();

export { manifest };
```

## Plugin Types

### Base Plugin

All plugins extend the base plugin interface:

```typescript
interface BasePlugin {
  name: string;
  version: string;
  initialize?(context: PluginContext): Promise<void>;
  destroy?(context: PluginContext): Promise<void>;
}
```

### Payment Plugin

```typescript
interface PaymentPlugin extends BasePlugin {
  category: 'payment';
  processPayment(context: PluginContext, paymentData: PaymentData): Promise<PaymentResult>;
  capturePayment?(context: PluginContext, transactionId: string): Promise<any>;
  refundPayment?(context: PluginContext, transactionId: string, amount?: number): Promise<any>;
  handleWebhook?(context: PluginContext, event: string, data: any): Promise<void>;
}
```

### Auth Plugin

```typescript
interface AuthPlugin extends BasePlugin {
  category: 'auth';
  authenticate(context: PluginContext, credentials: any): Promise<AuthResult>;
  authorize?(context: PluginContext, user: any, resource: string, action: string): Promise<boolean>;
  refreshToken?(context: PluginContext, token: string): Promise<string>;
  logout?(context: PluginContext, token: string): Promise<void>;
}
```

### Email Plugin

```typescript
interface EmailPlugin extends BasePlugin {
  category: 'email';
  sendEmail(context: PluginContext, emailData: EmailData): Promise<EmailResult>;
  getTemplate?(context: PluginContext, templateName: string): Promise<string>;
  renderTemplate?(context: PluginContext, template: string, data: Record<string, any>): Promise<string>;
}
```

### Analytics Plugin

```typescript
interface AnalyticsPlugin extends BasePlugin {
  category: 'analytics';
  trackEvent(context: PluginContext, eventData: EventData): Promise<void>;
  trackPageView?(context: PluginContext, pageData: PageData): Promise<void>;
  getMetrics?(context: PluginContext, query: MetricsQuery): Promise<MetricsResult>;
  getDashboard?(context: PluginContext, dashboardId: string): Promise<DashboardData>;
}
```

## Plugin Builder API

The SDK provides fluent builders for creating plugin manifests:

### Basic Builder

```typescript
import { createPlugin } from '@digital-commerce/plugin-sdk';

const manifest = createPlugin('My Plugin', 'my-plugin')
  .version('1.0.0')
  .description('My awesome plugin')
  .author('Your Name')
  .homepage('https://github.com/yourname/my-plugin')
  .repository('https://github.com/yourname/my-plugin')
  .license('MIT')
  .category('utility')
  .tags(['utility', 'awesome'])
  .dependency('core-utils', '^1.0.0')
  .peerDependency('another-plugin', '^2.0.0')
  .build();
```

### Adding Hooks

```typescript
const manifest = createPlugin('My Plugin', 'my-plugin')
  .hook('before_product_create', 'src/hooks/beforeProductCreate.ts', 50)
  .hook('after_order_complete', 'src/hooks/afterOrderComplete.ts', 100)
  .build();
```

### Adding API Endpoints

```typescript
const manifest = createPlugin('My Plugin', 'my-plugin')
  .apiEndpoint('POST', '/webhook', 'src/api/webhook.ts', {
    authRequired: false,
    rateLimit: { requests: 100, window: '1m' },
    middleware: ['src/middleware/rateLimit.ts'],
  })
  .apiEndpoint('GET', '/data', 'src/api/getData.ts')
  .build();
```

### Adding Admin UI Components

```typescript
const manifest = createPlugin('My Plugin', 'my-plugin')
  .settingsComponent('src/admin/Settings.tsx')
  .menuItem('My Plugin', '/my-plugin', {
    component: 'src/admin/Dashboard.tsx',
    icon: 'plugin',
    order: 100,
    permissions: ['my-plugin.view'],
  })
  .widget('my-widget', 'src/admin/widgets/MyWidget.tsx', 'analytics', {
    order: 50,
    permissions: ['analytics.view'],
  })
  .build();
```

### Adding Configuration

```typescript
const manifest = createPlugin('My Plugin', 'my-plugin')
  .setting('api_key', {
    type: 'string',
    label: 'API Key',
    required: true,
    sensitive: true,
    group: 'API Configuration',
  })
  .setting('enabled', {
    type: 'boolean',
    label: 'Enabled',
    default: true,
    group: 'General',
  })
  .setting('timeout', {
    type: 'number',
    label: 'Timeout (seconds)',
    default: 30,
    validation: { min: 1, max: 300 },
    group: 'Advanced',
  })
  .build();
```

### Adding Scheduled Tasks

```typescript
const manifest = createPlugin('My Plugin', 'my-plugin')
  .scheduledTask('cleanup', '0 2 * * *', 'src/tasks/cleanup.ts')
  .scheduledTask('sync', '*/15 * * * *', 'src/tasks/sync.ts', false) // disabled
  .build();
```

## Hook System

### Available Hooks

- **Product**: `before_product_create`, `after_product_create`, `before_product_update`, `after_product_update`
- **Order**: `before_order_create`, `after_order_create`, `before_order_complete`, `after_order_complete`
- **Payment**: `before_payment_process`, `after_payment_success`, `after_payment_failure`
- **User**: `before_user_create`, `after_user_create`, `user_login`, `user_logout`
- **Auth**: `before_authenticate`, `after_authenticate`, `authentication_failed`
- **Email**: `before_email_send`, `after_email_send`, `email_failed`
- **Analytics**: `event_tracked`, `page_viewed`, `metrics_collected`

### Hook Implementation

```typescript
import { HookHandler, PluginContext, PaymentHookData } from '@digital-commerce/plugin-sdk';

const handler: HookHandler<PaymentHookData> = async (context: PluginContext, data) => {
  // Your hook logic here
  context.logger.info('Processing payment hook', { paymentId: data.payment.id });
  
  // Modify data if needed
  data.payment.metadata = {
    ...data.payment.metadata,
    processed_by: 'my-plugin',
  };
  
  return data.payment;
};

export default handler;
```

### Hook Decorator

```typescript
import { Hook, HookDefinitions } from '@digital-commerce/plugin-sdk';

export default class MyPlugin {
  @Hook(HookDefinitions.BEFORE_PAYMENT_PROCESS, 50)
  async beforePaymentProcess(context: PluginContext, data: any) {
    // Hook implementation
  }
}
```

## UI Components

### Registering Components

```typescript
import { createComponent, createWidget, createMenuItem } from '@digital-commerce/plugin-sdk';

// Register a component
createComponent('my-component', 'My Component')
  .description('A custom component')
  .component(MyReactComponent)
  .props({ theme: 'dark' })
  .register();

// Register a widget
createWidget('revenue-chart', 'Revenue Chart')
  .component(RevenueChartWidget)
  .dashboard('analytics')
  .order(100)
  .permissions(['analytics.view'])
  .register();

// Register a menu item
createMenuItem('My Plugin', '/my-plugin')
  .component(MyPluginPage)
  .icon('plugin')
  .order(100)
  .permissions(['my-plugin.view'])
  .register();
```

### shadcn/ui Components

```typescript
import { ShadcnComponents } from '@digital-commerce/plugin-sdk';

// Create a form with shadcn components
const formSchema = {
  fields: [
    ShadcnComponents.input('name', 'Name', {
      required: true,
      placeholder: 'Enter your name',
    }),
    ShadcnComponents.select('role', 'Role', ['admin', 'user'], {
      required: true,
    }),
    ShadcnComponents.checkbox('enabled', 'Enabled', {
      default: true,
    }),
  ],
};

// Create a data table
const tableConfig = ShadcnComponents.table('users', 'Users', [
  {
    key: 'name',
    title: 'Name',
    type: 'text',
    sortable: true,
  },
  {
    key: 'email',
    title: 'Email',
    type: 'text',
    filterable: true,
  },
  {
    key: 'actions',
    title: 'Actions',
    type: 'action',
    actions: [
      { label: 'Edit', action: 'edit' },
      { label: 'Delete', action: 'delete', dangerous: true },
    ],
  },
]);
```

## Plugin Context

Plugins receive a secure context with access to platform services:

```typescript
interface PluginContext {
  // Tenant and plugin information
  tenant: TenantInfo;
  plugin: PluginInfo;

  // Database (tenant-scoped)
  db: DatabaseAccess;

  // Cache (tenant-scoped)
  cache: CacheAccess;

  // Storage (tenant-scoped)
  storage: StorageAccess;

  // HTTP client
  http: HttpClient;

  // Event system
  events: EventEmitter;

  // Logging
  logger: Logger;

  // Plugin communication
  plugins: PluginManager;

  // Background tasks
  tasks: TaskManager;

  // Utilities
  utils: Utils;

  // UI component registry
  ui: UIRegistry;
}
```

## Example: Complete Payment Plugin

```typescript
import { createPaymentPlugin, PluginContext } from '@digital-commerce/plugin-sdk';

export default class StripePaymentPlugin {
  name = 'Stripe Payment Gateway';
  version = '1.0.0';
  category = 'payment' as const;

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('Initializing Stripe Payment Gateway');
    
    // Validate configuration
    if (!context.plugin.config.api_key) {
      throw new Error('Stripe API key is required');
    }

    // Initialize Stripe client
    const stripe = await import('stripe');
    this.stripe = new stripe.default(context.plugin.config.api_key);
  }

  async processPayment(context: PluginContext, paymentData: any): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100),
        currency: paymentData.currency.toLowerCase(),
        metadata: {
          order_id: paymentData.orderId,
          tenant_id: context.tenant.id,
        },
      });

      // Cache payment for webhook processing
      await context.cache.set(
        `payment:${paymentIntent.id}`,
        { orderId: paymentData.orderId },
        3600
      );

      return {
        success: true,
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      };

    } catch (error) {
      context.logger.error('Payment processing failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleWebhook(context: PluginContext, event: string, data: any): Promise<void> {
    switch (event) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(context, data);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(context, data);
        break;
    }
  }

  private async handlePaymentSuccess(context: PluginContext, paymentIntent: any): Promise<void> {
    const cached = await context.cache.get(`payment:${paymentIntent.id}`);
    
    if (cached && cached.orderId) {
      // Update order status
      await context.db.query(
        'UPDATE orders SET status = $1 WHERE id = $2 AND tenant_id = $3',
        ['completed', cached.orderId, context.tenant.id]
      );

      // Emit success event
      await context.events.emit('payment_success', {
        orderId: cached.orderId,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
      });

      // Clear cache
      await context.cache.delete(`payment:${paymentIntent.id}`);
    }
  }
}

const manifest = createPaymentPlugin('Stripe Gateway', 'stripe-gateway')
  .version('1.0.0')
  .description('Stripe payment gateway integration')
  .author('Your Name')
  .hook('before_payment_process', 'src/hooks/beforePayment.ts')
  .hook('after_payment_success', 'src/hooks/afterPayment.ts')
  .apiEndpoint('POST', '/process-payment', 'src/api/process.ts')
  .apiEndpoint('POST', '/webhook', 'src/api/webhook.ts', {
    authRequired: false,
  })
  .webhook('payment_intent.succeeded', 'src/webhooks/paymentSuccess.ts')
  .webhook('payment_intent.payment_failed', 'src/webhooks/paymentFailure.ts')
  .setting('api_key', {
    type: 'string',
    label: 'Stripe API Key',
    required: true,
    sensitive: true,
  })
  .setting('webhook_secret', {
    type: 'string',
    label: 'Webhook Secret',
    required: true,
    sensitive: true,
  })
  .setting('test_mode', {
    type: 'boolean',
    label: 'Test Mode',
    default: true,
  })
  .widget('stripe-revenue', 'src/admin/widgets/RevenueWidget.tsx', 'analytics')
  .build();

export { manifest };
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## Best Practices

1. **Type Safety**: Use TypeScript interfaces for all data structures
2. **Error Handling**: Implement proper error handling and logging
3. **Validation**: Validate all inputs and configuration
4. **Security**: Use secure defaults and sanitize data
5. **Performance**: Minimize database queries and use caching
6. **Testing**: Write comprehensive tests for all functionality
7. **Documentation**: Document all configuration options and hooks

## Support

- [Documentation](https://docs.digital-commerce.com)
- [Examples](https://github.com/digital-commerce/examples)
- [Community](https://discord.gg/digital-commerce)
- [Issues](https://github.com/digital-commerce/sdk/issues)

## License

MIT License - see LICENSE file for details.