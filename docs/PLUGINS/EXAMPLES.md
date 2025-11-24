# Plugin Examples

This document provides real-world plugin examples to help you understand how to build plugins for MTC Platform.

## 📚 Table of Contents

1. [Payment Gateway Plugins](#payment-gateway-plugins)
2. [Email Notification Plugins](#email-notification-plugins)
3. [Analytics Plugins](#analytics-plugins)
4. [Integration Plugins](#integration-plugins)
5. [Custom Workflow Plugins](#custom-workflow-plugins)
6. [UI Enhancement Plugins](#ui-enhancement-plugins)

## 💳 Payment Gateway Plugins

### Stripe Payment Gateway

Complete Stripe integration for payment processing.

#### Plugin Structure

```
stripe-payment/
├── plugin.json
├── src/
│   ├── index.js
│   ├── hooks/
│   │   ├── order-created.js
│   │   └── payment-completed.js
│   ├── routes/
│   │   ├── webhook.js
│   │   └── payment-intent.js
│   ├── services/
│   │   └── stripe-service.js
│   └── ui/
│       └── settings.jsx
└── package.json
```

#### Plugin Manifest

```json
{
  "name": "stripe-payment",
  "version": "2.0.0",
  "description": "Stripe payment gateway integration",
  "author": "MTC Platform",
  "license": "MIT",
  "main": "src/index.js",
  "hooks": [
    "order.created",
    "payment.completed",
    "order.cancelled"
  ],
  "permissions": [
    "read:orders",
    "write:payments",
    "send:webhooks"
  ],
  "dependencies": {
    "stripe": "^14.0.0"
  },
  "settings": {
    "publishable_key": {
      "type": "text",
      "label": "Stripe Publishable Key",
      "required": true,
      "secret": true
    },
    "secret_key": {
      "type": "text",
      "label": "Stripe Secret Key",
      "required": true,
      "secret": true
    },
    "webhook_secret": {
      "type": "text",
      "label": "Webhook Secret",
      "required": true,
      "secret": true
    }
  }
}
```

#### Main Plugin File

```javascript
// src/index.js
import StripeService from './services/stripe-service.js';
import orderCreatedHook from './hooks/order-created.js';
import paymentCompletedHook from './hooks/payment-completed.js';
import webhookRoutes from './routes/webhook.js';

export default {
  name: 'stripe-payment',
  version: '2.0.0',
  
  async initialize(config, context) {
    this.stripeService = new StripeService(config);
    this.context = context;
    
    // Initialize Stripe with config
    await this.stripeService.initialize(config);
    
    console.log('Stripe payment plugin initialized');
  },
  
  hooks: {
    'order.created': orderCreatedHook,
    'payment.completed': paymentCompletedHook
  },
  
  routes: {
    '/stripe/webhook': webhookRoutes,
    '/stripe/create-payment-intent': {
      method: 'POST',
      handler: this.createPaymentIntent.bind(this)
    }
  },
  
  async createPaymentIntent(req, res) {
    try {
      const { order_id, payment_method_id } = req.body;
      
      const paymentIntent = await this.stripeService.createPaymentIntent({
        order_id,
        payment_method_id,
        amount: req.body.amount,
        currency: req.body.currency || 'usd'
      });
      
      res.json({
        success: true,
        data: {
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
};
```

#### Order Created Hook

```javascript
// src/hooks/order-created.js
import StripeService from '../services/stripe-service.js';

export default async function orderCreated(order, context) {
  const { services, tenant, plugin } = context;
  
  // Only process orders with Stripe payment method
  if (order.payment_method !== 'stripe') {
    return;
  }
  
  try {
    const stripeService = new StripeService(plugin.config);
    await stripeService.initialize(plugin.config);
    
    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      order_id: order.id,
      amount: order.total,
      currency: order.currency,
      metadata: {
        tenant_id: tenant.id,
        customer_email: order.customer_email
      }
    });
    
    // Update order with payment intent
    await services.orders.updateOrder(order.id, {
      payment_intent_id: paymentIntent.id,
      payment_status: 'pending'
    });
    
    // Send payment confirmation email
    await services.email.send({
      to: order.customer_email,
      subject: `Payment Required for Order ${order.id}`,
      template: 'payment-required',
      data: {
        order,
        payment_url: `${tenant.domain}/checkout/${order.id}?payment_intent=${paymentIntent.client_secret}`
      }
    });
    
    console.log(`Payment intent created for order ${order.id}: ${paymentIntent.id}`);
    
  } catch (error) {
    console.error(`Failed to create payment intent for order ${order.id}:`, error);
    
    // Mark order as failed
    await services.orders.updateOrder(order.id, {
      payment_status: 'failed',
      error_message: error.message
    });
  }
}
```

#### Stripe Service

```javascript
// src/services/stripe-service.js
import Stripe from 'stripe';

export default class StripeService {
  constructor(config) {
    this.config = config;
    this.stripe = null;
  }
  
  async initialize(config) {
    this.stripe = new Stripe(config.secret_key, {
      apiVersion: '2023-10-16'
    });
  }
  
  async createPaymentIntent({ order_id, amount, currency = 'usd', metadata = {} }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          order_id,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      });
      
      return paymentIntent;
    } catch (error) {
      throw new Error(`Stripe API Error: ${error.message}`);
    }
  }
  
  async confirmPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }
  
  async retrievePaymentIntent(paymentIntentId) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }
  
  async createRefund(paymentIntentId, amount) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100)
      });
      return refund;
    } catch (error) {
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }
}
```

#### Webhook Handler

```javascript
// src/routes/webhook.js
import crypto from 'crypto';

export default async function handleWebhook(req, res, context) {
  const { services, tenant, plugin } = context;
  const sig = req.headers['stripe-signature'];
  const webhookSecret = plugin.config.webhook_secret;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object, context);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object, context);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}

async function handlePaymentSucceeded(paymentIntent, context) {
  const { services, tenant } = context;
  
  // Update order status
  await services.orders.updateOrder(paymentIntent.metadata.order_id, {
    payment_status: 'completed',
    paid_at: new Date()
  });
  
  // Send confirmation email
  const order = await services.orders.getOrder(paymentIntent.metadata.order_id);
  await services.email.send({
    to: order.customer_email,
    subject: `Payment Confirmed for Order ${order.id}`,
    template: 'payment-confirmed',
    data: { order, paymentIntent }
  });
  
  console.log(`Payment succeeded for order ${paymentIntent.metadata.order_id}`);
}

async function handlePaymentFailed(paymentIntent, context) {
  const { services, tenant } = context;
  
  // Update order status
  await services.orders.updateOrder(paymentIntent.metadata.order_id, {
    payment_status: 'failed',
    error_message: paymentIntent.last_payment_error?.message
  });
  
  // Send failure email
  const order = await services.orders.getOrder(paymentIntent.metadata.order_id);
  await services.email.send({
    to: order.customer_email,
    subject: `Payment Failed for Order ${order.id}`,
    template: 'payment-failed',
    data: { order, paymentIntent }
  });
  
  console.log(`Payment failed for order ${paymentIntent.metadata.order_id}`);
}
```

#### Settings UI Component

```jsx
// src/ui/settings.jsx
import React, { useState, useEffect } from 'react';

export default function StripeSettings({ plugin, onSave, onError }) {
  const [config, setConfig] = useState(plugin.config || {});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(config);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      // Test API keys with Stripe
      const response = await fetch('/api/plugins/stripe/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Stripe connection successful!');
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="stripe-settings">
      <h3>Stripe Payment Gateway Settings</h3>
      
      <div className="form-group">
        <label>Publishable Key</label>
        <input
          type="password"
          value={config.publishable_key || ''}
          onChange={(e) => handleChange('publishable_key', e.target.value)}
          placeholder="pk_test_..."
        />
        <small>Starts with pk_test_ or pk_live_</small>
      </div>

      <div className="form-group">
        <label>Secret Key</label>
        <input
          type="password"
          value={config.secret_key || ''}
          onChange={(e) => handleChange('secret_key', e.target.value)}
          placeholder="sk_test_..."
        />
        <small>Starts with sk_test_ or sk_live_</small>
      </div>

      <div className="form-group">
        <label>Webhook Secret</label>
        <input
          type="password"
          value={config.webhook_secret || ''}
          onChange={(e) => handleChange('webhook_secret', e.target.value)}
          placeholder="whsec_..."
        />
        <small>From your Stripe webhook settings</small>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={testConnection}
          disabled={testing || !config.publishable_key || !config.secret_key}
          className="btn btn-secondary"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
```

## 📧 Email Notification Plugins

### SendGrid Email Service

Send transactional emails using SendGrid API.

#### Plugin Manifest

```json
{
  "name": "sendgrid-email",
  "version": "1.5.0",
  "description": "SendGrid email service integration",
  "main": "src/index.js",
  "hooks": [
    "order.completed",
    "user.registered",
    "product.created"
  ],
  "permissions": [
    "send:email",
    "read:orders",
    "read:users"
  ],
  "dependencies": {
    "@sendgrid/mail": "^7.7.0"
  },
  "settings": {
    "api_key": {
      "type": "text",
      "label": "SendGrid API Key",
      "required": true,
      "secret": true
    },
    "from_email": {
      "type": "email",
      "label": "From Email",
      "required": true
    },
    "from_name": {
      "type": "text",
      "label": "From Name",
      "required": true
    }
  }
}
```

#### Email Service Implementation

```javascript
// src/services/sendgrid-service.js
import sgMail from '@sendgrid/mail';

export default class SendGridService {
  constructor(config) {
    this.config = config;
    sgMail.setApiKey(config.api_key);
  }
  
  async sendEmail({ to, subject, html, text, from }) {
    try {
      const msg = {
        to,
        from: from || {
          email: this.config.from_email,
          name: this.config.from_name
        },
        subject,
        text,
        html
      };
      
      const result = await sgMail.send(msg);
      return result;
    } catch (error) {
      throw new Error(`SendGrid Error: ${error.message}`);
    }
  }
  
  async sendTemplate({ to, templateId, templateData }) {
    try {
      const msg = {
        to,
        from: {
          email: this.config.from_email,
          name: this.config.from_name
        },
        templateId,
        dynamicTemplateData: templateData
      };
      
      const result = await sgMail.send(msg);
      return result;
    } catch (error) {
      throw new Error(`SendGrid Template Error: ${error.message}`);
    }
  }
}
```

## 📊 Analytics Plugins

### Google Analytics Integration

Track user behavior and sales with Google Analytics.

#### Plugin Manifest

```json
{
  "name": "google-analytics",
  "version": "1.2.0",
  "description": "Google Analytics tracking integration",
  "main": "src/index.js",
  "hooks": [
    "order.completed",
    "product.viewed",
    "user.registered"
  ],
  "permissions": [
    "track:analytics",
    "read:orders",
    "read:products"
  ],
  "dependencies": {
    "universal-analytics": "^0.5.3"
  },
  "settings": {
    "tracking_id": {
      "type": "text",
      "label": "Google Analytics Tracking ID",
      "required": true,
      "placeholder": "GA-XXXXXXXXX-X"
    },
    "enable_ecommerce": {
      "type": "boolean",
      "label": "Enable E-commerce Tracking",
      "default": true
    }
  }
}
```

## 🔗 Integration Plugins

### Slack Notifications

Send platform notifications to Slack channels.

#### Plugin Manifest

```json
{
  "name": "slack-notifications",
  "version": "1.0.0",
  "description": "Send notifications to Slack channels",
  "main": "src/index.js",
  "hooks": [
    "order.completed",
    "product.created",
    "user.registered",
    "system.error"
  ],
  "permissions": [
    "send:webhooks",
    "read:orders"
  ],
  "dependencies": {
    "axios": "^1.6.0"
  },
  "settings": {
    "webhook_url": {
      "type": "url",
      "label": "Slack Webhook URL",
      "required": true,
      "secret": true
    },
    "channel": {
      "type": "text",
      "label": "Default Channel",
      "default": "#general"
    },
    "notify_orders": {
      "type": "boolean",
      "label": "Notify on New Orders",
      "default": true
    }
  }
}
```

#### Slack Service

```javascript
// src/services/slack-service.js
import axios from 'axios';

export default class SlackService {
  constructor(config) {
    this.webhookUrl = config.webhook_url;
    this.defaultChannel = config.channel;
  }
  
  async sendMessage({ text, channel, blocks }) {
    try {
      const payload = {
        text,
        channel: channel || this.defaultChannel,
        blocks
      };
      
      const response = await axios.post(this.webhookUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Slack Error: ${error.message}`);
    }
  }
  
  async sendOrderNotification(order, tenant) {
    const message = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🛒 *New Order Received*\n*Order ID:* ${order.id}\n*Customer:* ${order.customer_email}\n*Total:* $${order.total}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Order'
              },
              url: `${tenant.domain}/admin/orders/${order.id}`
            }
          ]
        }
      ]
    };
    
    return this.sendMessage(message);
  }
}
```

## 🔄 Custom Workflow Plugins

### Order Fulfillment Workflow

Automate order fulfillment for digital products.

#### Plugin Manifest

```json
{
  "name": "digital-fulfillment",
  "version": "1.0.0",
  "description": "Automatic fulfillment for digital products",
  "main": "src/index.js",
  "hooks": [
    "payment.completed",
    "order.completed"
  ],
  "permissions": [
    "read:orders",
    "write:orders",
    "read:products",
    "send:email"
  ],
  "settings": {
    "auto_fulfill": {
      "type": "boolean",
      "label": "Auto-fulfill Digital Products",
      "default": true
    },
    "generate_licenses": {
      "type": "boolean",
      "label": "Generate License Keys",
      "default": false
    }
  }
}
```

## 🎨 UI Enhancement Plugins

### Product Quick View

Add quick preview functionality to product listings.

#### Plugin Manifest

```json
{
  "name": "product-quick-view",
  "version": "1.0.0",
  "description": "Add quick view modal to product listings",
  "main": "src/index.js",
  "hooks": [
    "store.frontend.loaded"
  ],
  "permissions": [
    "modify:ui",
    "read:products"
  ],
  "settings": {
    "enable_quick_view": {
      "type": "boolean",
      "label": "Enable Quick View",
      "default": true
    },
    "modal_size": {
      "type": "select",
      "label": "Modal Size",
      "options": ["small", "medium", "large"],
      "default": "medium"
    }
  }
}
```

## 🧪 Testing Plugin Examples

### Unit Test Example

```javascript
// tests/hooks/order-created.test.js
import orderCreatedHook from '../../src/hooks/order-created.js';
import StripeService from '../../src/services/stripe-service.js';

jest.mock('../../src/services/stripe-service.js');

describe('orderCreatedHook', () => {
  let mockContext;
  let mockOrder;

  beforeEach(() => {
    mockOrder = {
      id: 'order_123',
      total: 99.99,
      currency: 'usd',
      payment_method: 'stripe',
      customer_email: 'test@example.com'
    };

    mockContext = {
      services: {
        orders: {
          updateOrder: jest.fn().mockResolvedValue({})
        },
        email: {
          send: jest.fn().mockResolvedValue({})
        }
      },
      tenant: {
        id: 'tenant_123',
        domain: 'https://store.example.com'
      },
      plugin: {
        config: {
          secret_key: 'sk_test_123'
        }
      }
    };

    jest.clearAllMocks();
  });

  it('should create payment intent for Stripe orders', async () => {
    const mockPaymentIntent = {
      id: 'pi_123',
      client_secret: 'pi_123_secret'
    };

    StripeService.prototype.createPaymentIntent = jest.fn().mockResolvedValue(mockPaymentIntent);

    await orderCreatedHook(mockOrder, mockContext);

    expect(StripeService.prototype.createPaymentIntent).toHaveBeenCalledWith({
      order_id: 'order_123',
      amount: 99.99,
      currency: 'usd',
      metadata: {
        tenant_id: 'tenant_123',
        customer_email: 'test@example.com'
      }
    });

    expect(mockContext.services.orders.updateOrder).toHaveBeenCalledWith('order_123', {
      payment_intent_id: 'pi_123',
      payment_status: 'pending'
    });
  });

  it('should ignore non-Stripe orders', async () => {
    mockOrder.payment_method = 'paypal';

    await orderCreatedHook(mockOrder, mockContext);

    expect(StripeService.prototype.createPaymentIntent).not.toHaveBeenCalled();
  });

  it('should handle Stripe errors gracefully', async () => {
    StripeService.prototype.createPaymentIntent = jest.fn().mockRejectedValue(
      new Error('Stripe API Error')
    );

    await orderCreatedHook(mockOrder, mockContext);

    expect(mockContext.services.orders.updateOrder).toHaveBeenCalledWith('order_123', {
      payment_status: 'failed',
      error_message: 'Stripe API Error'
    });
  });
});
```

### Integration Test Example

```javascript
// tests/integration/stripe-payment.test.js
import request from 'supertest';
import app from '../../src/index';

describe('Stripe Payment Plugin Integration', () => {
  let apiKey;
  let testOrder;

  beforeAll(async () => {
    apiKey = process.env.SUPER_ADMIN_API_KEY;
    
    // Create test order
    const response = await request(app)
      .post('/api/orders')
      .set('x-api-key', apiKey)
      .send({
        store_id: 'test_store',
        customer_email: 'test@example.com',
        items: [
          {
            product_id: 'test_product',
            quantity: 1,
            price: 29.99
          }
        ],
        total: 29.99,
        payment_method: 'stripe'
      });

    testOrder = response.body.data;
  });

  it('should create payment intent for order', async () => {
    const response = await request(app)
      .post('/stripe/create-payment-intent')
      .set('x-api-key', apiKey)
      .send({
        order_id: testOrder.id,
        payment_method_id: 'pm_test_123',
        amount: 29.99
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.client_secret).toBeDefined();
    expect(response.body.data.payment_intent_id).toBeDefined();
  });

  it('should handle Stripe webhooks', async () => {
    const webhookPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          metadata: {
            order_id: testOrder.id
          },
          status: 'succeeded'
        }
      }
    };

    const response = await request(app)
      .post('/stripe/webhook')
      .set('stripe-signature', 'test-signature')
      .send(webhookPayload)
      .expect(200);

    expect(response.body.received).toBe(true);
  });
});
```

## 📋 Plugin Development Checklist

### Before Publishing

- [ ] Plugin follows naming conventions
- [ ] All required fields in plugin.json
- [ ] Permissions are properly declared
- [ ] Error handling is comprehensive
- [ ] Logging is implemented
- [ ] Configuration validation
- [ ] Unit tests included
- [ ] Integration tests passing
- [ ] Documentation is complete
- [ ] Security review completed

### Security Considerations

- [ ] Input validation and sanitization
- [ ] Secret data handling
- [ ] API rate limiting
- [ ] Error message sanitization
- [ ] Dependency security scanning
- [ ] Webhook signature verification

### Performance Considerations

- [ ] Efficient database queries
- [ ] Proper error handling
- [ ] Resource cleanup
- [ ] Caching implemented
- [ ] Memory usage optimized
- [ ] Network requests optimized

## 🚀 Publishing Your Plugin

### Preparing for Release

1. **Version Management**: Use semantic versioning
2. **Changelog**: Document all changes
3. **Testing**: Run full test suite
4. **Documentation**: Update README and examples
5. **Security**: Final security review

### Publishing Process

```bash
# Run final tests
npm test

# Build plugin
npm run build

# Publish to NPM
npm publish

# Submit to MTC registry
git push origin main --tags
```

### Post-Release

- Monitor plugin usage and errors
- Respond to user feedback
- Plan next features and improvements
- Update documentation as needed

## 📚 Additional Resources

### Development Tools

- **Plugin CLI**: `@mtc-platform/plugin-cli`
- **Testing Framework**: Built-in test utilities
- **Documentation Generator**: Auto-generate plugin docs
- **Validation Tool**: Validate plugin manifests

### Community Resources

- **Plugin Forum**: Discuss development challenges
- **Showcase**: Share your plugins
- **Contributors**: Connect with other developers
- **Support**: Get help from the community

---

**Plugin Examples Version**: 1.0.0  
**Last Updated**: 2024-11-24  
**Platform Compatibility**: v1.0.0+

For plugin development guidelines, see the [Plugin Development Guide](./DEVELOPMENT_GUIDE.md).