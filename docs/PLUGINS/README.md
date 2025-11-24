# Plugin System Documentation

Welcome to the plugin system documentation for MTC Platform. This section contains comprehensive guides for developing, installing, and managing plugins.

## 📚 Plugin Documentation

### [Plugin Development Guide](./DEVELOPMENT_GUIDE.md)
Comprehensive guide to building plugins:
- Plugin architecture and concepts
- Development environment setup
- Hook system implementation
- UI component development
- Testing and debugging
- Publishing and distribution

### [Plugin API Reference](./API_REFERENCE.md)
Complete plugin API documentation:
- Hook specifications
- API endpoints
- Database operations
- Event system
- Utility functions
- Best practices

### [Plugin Examples](./EXAMPLES.md)
Real-world plugin examples:
- Payment gateway plugins
- Email notification plugins
- Analytics plugins
- Custom workflow plugins
- Integration plugins

## 🚀 Quick Start

### What is a Plugin?

A plugin is a self-contained package that extends the MTC Platform with new functionality without modifying the core code. Plugins can:

- Add payment gateways
- Send notifications
- Integrate with external services
- Customize workflows
- Add admin UI components
- Extend API endpoints

### Plugin Structure

```
my-plugin/
├── plugin.json              # Plugin manifest
├── src/
│   ├── index.js            # Plugin entry point
│   ├── hooks/             # Hook implementations
│   │   ├── product-created.js
│   │   └── order-completed.js
│   ├── routes/            # Custom API routes
│   │   └── webhook.js
│   ├── ui/                # Admin UI components
│   │   └── settings.jsx
│   └── services/          # Plugin services
│       └── email.js
├── tests/                 # Plugin tests
├── docs/                  # Plugin documentation
├── assets/                # Static assets
└── README.md              # Plugin README
```

### Basic Plugin Example

Create a simple plugin that sends email when products are created:

```javascript
// src/hooks/product-created.js
export default async function productCreated(product, context) {
  const { services, tenant } = context;
  
  // Send notification email
  await services.email.send({
    to: tenant.adminEmail,
    subject: `New Product: ${product.name}`,
    body: `Product ${product.name} has been created in your store.`
  });
  
  console.log(`Product created notification sent for ${product.name}`);
}
```

## 🔌 Plugin Manifest

Every plugin requires a `plugin.json` manifest:

```json
{
  "name": "email-notifications",
  "version": "1.0.0",
  "description": "Send email notifications for platform events",
  "author": "Your Name",
  "license": "MIT",
  "main": "src/index.js",
  "hooks": [
    "product.created",
    "order.completed",
    "user.registered"
  ],
  "permissions": [
    "read:products",
    "read:orders",
    "read:users",
    "send:email"
  ],
  "dependencies": {
    "nodemailer": "^6.9.0"
  },
  "settings": {
    "smtp_host": {
      "type": "text",
      "label": "SMTP Host",
      "required": true
    },
    "smtp_port": {
      "type": "number",
      "label": "SMTP Port",
      "default": 587
    }
  }
}
```

## 🎯 Plugin Capabilities

### Hook System

Plugins can register for various platform events:

```javascript
// Available hooks
const hooks = {
  // Product events
  'product.created': async (product, context) => {},
  'product.updated': async (product, context) => {},
  'product.deleted': async (product, context) => {},
  
  // Order events
  'order.created': async (order, context) => {},
  'order.completed': async (order, context) => {},
  'order.cancelled': async (order, context) => {},
  
  // User events
  'user.registered': async (user, context) => {},
  'user.login': async (user, context) => {},
  
  // Payment events
  'payment.succeeded': async (payment, context) => {},
  'payment.failed': async (payment, context) => {},
  
  // Tenant events
  'tenant.created': async (tenant, context) => {},
  'tenant.updated': async (tenant, context) => {}
};
```

### Custom API Routes

Plugins can register custom API endpoints:

```javascript
// src/routes/webhook.js
export default function registerRoutes(app) {
  app.post('/plugins/my-plugin/webhook', async (req, res) => {
    const { event, data } = req.body;
    
    // Handle webhook
    await handleWebhook(event, data);
    
    res.json({ success: true });
  });
}
```

### Admin UI Components

Plugins can add custom admin interface components:

```jsx
// src/ui/settings.jsx
import React, { useState } from 'react';

export default function PluginSettings({ plugin, onSave }) {
  const [settings, setSettings] = useState(plugin.settings);
  
  const handleSave = async () => {
    await onSave(settings);
  };
  
  return (
    <div className="plugin-settings">
      <h3>Email Notification Settings</h3>
      
      <div className="form-group">
        <label>SMTP Host</label>
        <input
          type="text"
          value={settings.smtp_host}
          onChange={(e) => setSettings({
            ...settings,
            smtp_host: e.target.value
          })}
        />
      </div>
      
      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
}
```

## 🔧 Development Workflow

### 1. Create Plugin Structure

```bash
mkdir my-awesome-plugin
cd my-awesome-plugin

# Initialize plugin
npm init -y

# Create directories
mkdir -p src/{hooks,routes,ui,services} tests docs assets
```

### 2. Create Plugin Manifest

```bash
cat > plugin.json << 'EOF'
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "An awesome plugin for MTC Platform",
  "main": "src/index.js",
  "hooks": ["product.created"],
  "permissions": ["read:products"]
}
EOF
```

### 3. Implement Plugin Logic

```javascript
// src/index.js
export default {
  hooks: {
    'product.created': async (product, context) => {
      console.log(`New product: ${product.name}`);
    }
  }
};
```

### 4. Test Plugin Locally

```bash
# Install plugin in development mode
npm run plugin:install ./my-awesome-plugin

# Restart development server
npm run dev

# Test plugin functionality
curl -X POST http://localhost:3000/api/products \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{"store_id":"test","name":"Test Product"}'
```

## 📦 Plugin Installation

### From Local Directory

```bash
npm run plugin:install ./my-plugin
```

### From NPM Registry

```bash
npm run plugin:install @mtc-plugins/stripe-payment
```

### From Git Repository

```bash
npm run plugin:install https://github.com/user/my-plugin.git
```

### Plugin Configuration

After installation, configure the plugin:

```bash
# Configure plugin settings
curl -X POST http://localhost:3000/api/plugins/my-plugin/configure \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "smtp_host": "smtp.example.com",
    "smtp_port": 587,
    "api_key": "your-api-key"
  }'
```

## 🔍 Plugin Management

### List Installed Plugins

```bash
curl -H "x-api-key: sk_test_admin123456" \
  http://localhost:3000/api/plugins
```

### Get Plugin Details

```bash
curl -H "x-api-key: sk_test_admin123456" \
  http://localhost:3000/api/plugins/my-plugin
```

### Update Plugin

```bash
npm run plugin:update my-plugin
```

### Uninstall Plugin

```bash
npm run plugin:uninstall my-plugin
```

## 🧪 Plugin Testing

### Unit Tests

```javascript
// tests/hooks/product-created.test.js
import productCreated from '../../src/hooks/product-created.js';

describe('productCreated hook', () => {
  it('should send email notification', async () => {
    const product = { id: '123', name: 'Test Product' };
    const context = {
      services: {
        email: {
          send: jest.fn().mockResolvedValue(true)
        }
      },
      tenant: {
        adminEmail: 'admin@example.com'
      }
    };
    
    await productCreated(product, context);
    
    expect(context.services.email.send).toHaveBeenCalledWith({
      to: 'admin@example.com',
      subject: 'New Product: Test Product',
      body: expect.stringContaining('Test Product')
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/plugin.test.js
import request from 'supertest';
import app from '../../src/index';

describe('Plugin Integration', () => {
  it('should trigger plugin on product creation', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('x-api-key', process.env.SUPER_ADMIN_API_KEY)
      .send({
        store_id: 'test-store',
        name: 'Test Product',
        price: 29.99
      })
      .expect(201);
    
    // Verify plugin was triggered
    expect(response.body.data.plugin_data).toBeDefined();
  });
});
```

## 🚀 Plugin Distribution

### Publishing to NPM

```bash
# Build plugin for distribution
npm run build

# Publish to NPM
npm publish
```

### Plugin Registry

Submit your plugin to the MTC Platform plugin registry:

1. **Fork the registry repository**
2. **Add your plugin to the registry**
3. **Submit a pull request**
4. **Wait for review and approval**

### Plugin Marketplace

Approved plugins appear in the plugin marketplace where users can:
- Browse available plugins
- Read reviews and ratings
- Install plugins with one click
- Get automatic updates

## 📋 Plugin Guidelines

### Code Quality

- Follow JavaScript/TypeScript best practices
- Include comprehensive tests
- Document all public APIs
- Handle errors gracefully

### Security

- Validate all inputs
- Sanitize outputs
- Use secure dependencies
- Follow principle of least privilege

### Performance

- Minimize database queries
- Implement caching where appropriate
- Use efficient algorithms
- Monitor resource usage

### User Experience

- Provide clear error messages
- Include helpful documentation
- Design intuitive admin interfaces
- Support internationalization

## 🔒 Plugin Security

### Permission System

Plugins declare required permissions in their manifest:

```json
{
  "permissions": [
    "read:products",
    "write:orders",
    "send:email",
    "access:external-api"
  ]
}
```

### Sandboxing

Plugins run in controlled environments:
- Limited file system access
- Network access restrictions
- Resource usage limits
- Memory constraints

### Security Review

All plugins undergo security review:
- Static code analysis
- Dependency vulnerability scanning
- Manual security review
- Penetration testing

## 🌟 Featured Plugins

### Payment Gateways

- **Stripe**: Complete Stripe integration
- **PayPal**: PayPal payment processing
- **Square**: Square payments
- **Braintree**: Braintree integration

### Email Services

- **SendGrid**: Transactional email
- **Mailgun**: Email delivery
- **AWS SES**: Amazon email service
- **Postmark**: Reliable email

### Analytics

- **Google Analytics**: Web analytics
- **Mixpanel**: Product analytics
- **Segment**: Customer data platform
- **Hotjar**: User behavior analytics

### Integrations

- **Slack**: Team notifications
- **Discord**: Community integration
- **Zapier**: Automation platform
- **Webhooks**: Custom webhooks

## 📚 Additional Resources

### Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - Detailed plugin development
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Examples](./EXAMPLES.md) - Real-world plugin examples

### Tools

- **Plugin CLI**: Command-line tools for plugin development
- **Plugin Generator**: Scaffold new plugins quickly
- **Testing Framework**: Plugin-specific testing utilities
- **Documentation Generator**: Auto-generate plugin docs

### Community

- **Plugin Forum**: Discuss plugin development
- **Showcase**: Share your plugins
- **Contributors**: Meet plugin developers
- **Support**: Get help with plugin issues

## 🤝 Getting Help

### Common Issues

1. **Plugin not loading**: Check manifest syntax and hooks
2. **Permission denied**: Verify required permissions
3. **Hook not triggered**: Check event names and registration
4. **UI not showing**: Verify component exports

### Support Channels

- **Documentation**: Check this documentation first
- **GitHub Issues**: Report plugin-related bugs
- **Plugin Forum**: Ask questions about development
- **Discord/Slack**: Real-time chat with developers

### Contributing

We welcome contributions to the plugin system:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

---

**Plugin System Version**: 2.0.0  
**Last Updated**: 2024-11-24  
**Platform Compatibility**: v1.0.0+

For detailed plugin development information, see the [Development Guide](./DEVELOPMENT_GUIDE.md).