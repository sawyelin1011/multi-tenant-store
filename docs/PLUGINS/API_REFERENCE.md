# Plugin Development Guide

This guide covers how to develop plugins for the MTC Platform.

## Plugin Structure

A plugin should have the following structure:

```
my-plugin/
├── plugin.json
├── package.json
├── src/
│   ├── hooks/
│   │   ├── beforeProductCreate.ts
│   │   └── afterOrderComplete.ts
│   ├── api/
│   │   └── customAction.ts
│   ├── admin/
│   │   ├── Settings.tsx
│   │   └── Dashboard.tsx
│   └── index.ts
├── migrations/
│   └── 001_create_tables.sql
└── README.md
```

## Plugin Manifest (plugin.json)

The plugin manifest defines metadata and configuration:

```json
{
  "name": "Stripe Payment Gateway",
  "slug": "stripe-gateway",
  "version": "1.0.0",
  "author": "Platform Team",
  "description": "Stripe payment gateway integration",
  "compatibility": [">=1.0.0"],
  
  "hooks": [
    {
      "name": "before_payment_process",
      "handler": "src/hooks/beforePaymentProcess.ts",
      "priority": 10
    },
    {
      "name": "after_payment_success",
      "handler": "src/hooks/afterPaymentSuccess.ts",
      "priority": 5
    }
  ],

  "api_endpoints": [
    {
      "method": "POST",
      "path": "/process-payment",
      "handler": "src/api/processPayment.ts",
      "auth_required": true
    },
    {
      "method": "POST",
      "path": "/webhook",
      "handler": "src/api/webhook.ts",
      "auth_required": false
    }
  ],

  "admin_ui": {
    "settings_component": "src/admin/Settings.tsx",
    "menu_items": [
      {
        "label": "Stripe Settings",
        "path": "/stripe",
        "component": "src/admin/Dashboard.tsx",
        "icon": "settings"
      }
    ]
  },

  "database_migrations": [
    "migrations/001_create_stripe_tables.sql"
  ],

  "permissions": [
    "stripe.manage",
    "stripe.view",
    "stripe.webhook"
  ],

  "settings_schema": {
    "api_key": {
      "type": "string",
      "label": "Stripe API Key",
      "required": true,
      "sensitive": true,
      "help": "Your Stripe secret API key"
    },
    "webhook_secret": {
      "type": "string",
      "label": "Webhook Signing Secret",
      "required": true,
      "sensitive": true
    },
    "enabled": {
      "type": "boolean",
      "label": "Enable Stripe",
      "default": true
    },
    "test_mode": {
      "type": "boolean",
      "label": "Test Mode",
      "default": true
    }
  }
}
```

## Hook Implementation

### Product Hooks

```typescript
// src/hooks/beforeProductCreate.ts
export default async function beforeProductCreate(ctx: PluginContext, data: any) {
  // Validate product data
  if (!data.name) {
    throw new Error('Product name is required');
  }

  // Modify product data
  data.sku = `${ctx.store.slug}-${Date.now()}`;

  return data;
}
```

```typescript
// src/hooks/afterOrderComplete.ts
export default async function afterOrderComplete(ctx: PluginContext, order: any) {
  // Send webhook to external service
  await ctx.http.post('https://webhook.example.com/order', {
    orderId: order.id,
    amount: order.pricing_data.total,
    customer: order.customer_data
  });

  // Send email notification
  await ctx.email.send({
    to: order.customer_data.email,
    template: 'order_completed',
    data: { order }
  });

  // Log activity
  console.log(`Order ${order.id} completed and notified`);
}
```

### Payment Hooks

```typescript
// src/hooks/beforePaymentProcess.ts
export default async function beforePaymentProcess(ctx: PluginContext, payment: any) {
  const config = ctx.plugin.config;

  // Validate payment amount
  if (payment.amount < 0.5) {
    throw new Error('Minimum payment is $0.50');
  }

  // Add gateway-specific metadata
  payment.gateway_metadata = {
    idempotency_key: `${payment.id}-${Date.now()}`,
    test_mode: config.test_mode
  };

  return payment;
}
```

### Delivery Hooks

```typescript
// src/hooks/beforeDelivery.ts
export default async function beforeDelivery(ctx: PluginContext, delivery: any) {
  // Generate download link
  if (delivery.delivery_method.type === 'file') {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    delivery.delivery_data.download_link = await ctx.cache.generateToken(
      `download-${delivery.id}`,
      { expiresAt }
    );
  }

  return delivery;
}
```

## API Endpoints

Plugins can define custom API endpoints:

```typescript
// src/api/processPayment.ts
import { Request, Response, NextFunction } from 'express';

export default async function processPayment(
  ctx: PluginContext,
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { amount, currency, customer } = req.body;
    const config = ctx.plugin.config;

    // Call Stripe API
    const response = await ctx.http.post('https://api.stripe.com/v1/payment_intents', {
      amount: Math.round(amount * 100),
      currency,
      customer,
      idempotency_key: req.body.idempotency_key
    }, {
      auth: {
        username: config.api_key,
        password: ''
      }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    next(error);
  }
}
```

```typescript
// src/api/webhook.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export default async function webhook(
  ctx: PluginContext,
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const config = ctx.plugin.config;
    const signature = req.headers['stripe-signature'] as string;
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', config.webhook_secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    // Handle webhook event
    const event = req.body;
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(ctx, event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(ctx, event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
}

async function handlePaymentSuccess(ctx: PluginContext, paymentIntent: any) {
  // Update order status
  const order = await ctx.db.query(
    'UPDATE orders SET status = $1 WHERE payment_data->\'stripe_id\' = $2 RETURNING *',
    ['completed', paymentIntent.id]
  );

  // Trigger order completion workflow
  await ctx.events.emit('payment_success', { order, paymentIntent });
}

async function handlePaymentFailed(ctx: PluginContext, paymentIntent: any) {
  // Update order status
  const order = await ctx.db.query(
    'UPDATE orders SET status = $1 WHERE payment_data->\'stripe_id\' = $2 RETURNING *',
    ['failed', paymentIntent.id]
  );

  // Emit event
  await ctx.events.emit('payment_failed', { order, paymentIntent });
}
```

## Admin UI Components

### Settings Component

```typescript
// src/admin/Settings.tsx
import React, { useState } from 'react';

interface PluginSettings {
  api_key: string;
  webhook_secret: string;
  test_mode: boolean;
  enabled: boolean;
}

export default function StripeSettings() {
  const [settings, setSettings] = useState<PluginSettings>({
    api_key: '',
    webhook_secret: '',
    test_mode: true,
    enabled: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    const response = await fetch('/api/{tenant}/admin/plugins/stripe-gateway/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    if (response.ok) {
      console.log('Settings saved');
    }
  };

  return (
    <div className="plugin-settings">
      <h2>Stripe Payment Gateway Settings</h2>
      
      <div className="form-group">
        <label htmlFor="api_key">API Key</label>
        <input
          id="api_key"
          name="api_key"
          type="password"
          value={settings.api_key}
          onChange={handleChange}
          placeholder="sk_test_..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="webhook_secret">Webhook Signing Secret</label>
        <input
          id="webhook_secret"
          name="webhook_secret"
          type="password"
          value={settings.webhook_secret}
          onChange={handleChange}
          placeholder="whsec_..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="test_mode">
          <input
            id="test_mode"
            name="test_mode"
            type="checkbox"
            checked={settings.test_mode}
            onChange={handleChange}
          />
          Test Mode
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="enabled">
          <input
            id="enabled"
            name="enabled"
            type="checkbox"
            checked={settings.enabled}
            onChange={handleChange}
          />
          Enabled
        </label>
      </div>

      <button onClick={handleSave} className="btn btn-primary">
        Save Settings
      </button>
    </div>
  );
}
```

## Database Migrations

Plugins can define database migrations:

```sql
-- migrations/001_create_stripe_tables.sql

CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(19, 4) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stripe_payments_tenant_id ON stripe_payments(tenant_id);
CREATE INDEX idx_stripe_payments_order_id ON stripe_payments(order_id);
CREATE INDEX idx_stripe_payments_stripe_id ON stripe_payments(stripe_payment_intent_id);
```

## Plugin Context API

The `PluginContext` object provided to hooks has these methods:

```typescript
interface PluginContext {
  // Store information
  store: Tenant;
  tenantId: string;
  plugin: TenantPlugin;
  
  // Database access
  db: DatabaseAccess;
  
  // Event system
  events: EventEmitter;
  
  // HTTP utilities
  http: HttpClient;
  
  // Email service
  email: EmailService;
  
  // Caching
  cache: CacheService;
  
  // Job queue
  queue: JobQueue;
  
  // Plugin communication
  plugins: PluginManager;
  
  // Utilities
  crypto: CryptoUtils;
  logger: Logger;
}
```

## Testing Plugins

Create tests for your plugin:

```typescript
// src/__tests__/beforePaymentProcess.test.ts
import beforePaymentProcess from '../hooks/beforePaymentProcess';

describe('beforePaymentProcess', () => {
  it('should validate payment amount', async () => {
    const ctx = {
      plugin: {
        config: {
          test_mode: true,
          min_amount: 0.5
        }
      }
    };

    const payment = {
      id: '123',
      amount: 0.25
    };

    await expect(beforePaymentProcess(ctx as any, payment)).rejects.toThrow(
      'Minimum payment is $0.50'
    );
  });

  it('should add idempotency key', async () => {
    const ctx = {
      plugin: {
        config: { test_mode: true }
      }
    };

    const payment = {
      id: '123',
      amount: 10
    };

    const result = await beforePaymentProcess(ctx as any, payment);

    expect(result.gateway_metadata).toBeDefined();
    expect(result.gateway_metadata.idempotency_key).toBeDefined();
  });
});
```

## Publishing Plugins

To publish your plugin to the marketplace:

1. Create a GitHub repository
2. Add `plugin.json` at the root
3. Create a Release with version tag (e.g., `v1.0.0`)
4. Submit to plugin marketplace

## Plugin Best Practices

1. **Error Handling**: Always wrap plugin code in try-catch blocks
2. **Logging**: Use `ctx.logger` for debugging
3. **Performance**: Cache external API responses
4. **Security**: Never log sensitive data
5. **Documentation**: Include comprehensive README
6. **Testing**: Write tests for all hooks and endpoints
7. **Versioning**: Follow semver for plugin versions
8. **Dependencies**: Keep plugin dependencies minimal
9. **Permissions**: Always check user permissions
10. **Idempotency**: Make operations idempotent where possible

## Example Plugins

- **Stripe Payment Gateway**: Payment processing
- **SendGrid Email**: Advanced email delivery
- **AWS S3 Storage**: File storage integration
- **Google Analytics**: Analytics integration
- **Discord Notifications**: Webhook notifications
- **Slack Integration**: Team notifications

## Resources

- [Plugin API Reference](#)
- [Webhook Guide](#)
- [Admin UI Component Library](#)
- [Testing Guide](#)
- [Security Best Practices](#)
