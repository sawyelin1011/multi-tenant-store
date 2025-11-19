# Plugin Development Guide (Updated for Workers + shadcn)

Comprehensive guide to developing plugins for the Digital Commerce Platform with support for both Express and Cloudflare Workers runtimes, including plugin hooks, UI components, admin dashboard integration, and the new shadcn-based UI system.

## Table of Contents

1. [Overview](#overview)
2. [Plugin Architecture](#plugin-architecture)
3. [Plugin Structure](#plugin-structure)
4. [Plugin Manifest](#plugin-manifest)
5. [Hooks System](#hooks-system)
6. [UI Components (shadcn)](#ui-components-shadcn)
7. [API Endpoints](#api-endpoints)
8. [Database Migrations](#database-migrations)
9. [Testing Plugins](#testing-plugins)
10. [Deployment](#deployment)

## Overview

Plugins extend the platform with custom functionality through:

- **Hooks**: React to events (before/after actions)
- **UI Components**: Extend admin dashboard with shadcn/ui components
- **API Endpoints**: Add custom REST endpoints
- **Database**: Extend schema with migrations
- **Settings**: Configuration UI for plugin-specific settings

### Plugin Types

1. **Payment Gateway Plugins**: Process payments via Stripe, PayPal, etc.
2. **Delivery Method Plugins**: Custom fulfillment logic
3. **Integration Plugins**: Connect external services
4. **Analytics Plugins**: Track custom metrics
5. **Workflow Plugins**: Custom workflow steps
6. **UI Plugins**: Custom admin dashboard components

## Plugin Architecture

### Plugin Lifecycle Diagram

```
┌─────────────────────────────────────────────┐
│  Plugin Registry                             │
│  (Available plugins in platform)             │
└────────────────┬────────────────────────────┘
                 │
                 │ Install
                 ▼
┌─────────────────────────────────────────────┐
│  Tenant Plugin                               │
│  (Per-tenant installation)                  │
├─────────────────────────────────────────────┤
│  Status: inactive                            │
│  Config: {}                                  │
│  Hooks: not registered                       │
└────────────────┬────────────────────────────┘
                 │
                 │ Enable
                 ▼
┌─────────────────────────────────────────────┐
│  Active Plugin Instance                      │
├─────────────────────────────────────────────┤
│  Status: active                              │
│  Config: { api_key: '...', ... }            │
│  Hooks: registered & listening               │
│  UI: components mounted in admin dashboard  │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
   [Hooks]  [API]   [UI Components]
   Exec     Endpoints Render
```

### Request Flow with Plugin Hooks

```
Client Request
    │
    ▼
Middleware (Auth, Tenant)
    │
    ▼
Route Handler
    │
    ├─ before_product_create hook (priority 10, 20, 30...)
    │  ├─ Plugin A validates
    │  ├─ Plugin B transforms data
    │  └─ Plugin C checks business rules
    │
    ▼
Service Layer (Create Product)
    │
    ├─ after_product_create hook
    │  ├─ Plugin A: send webhook
    │  ├─ Plugin B: update analytics
    │  └─ Plugin C: trigger workflow
    │
    ▼
Response to Client
```

### Data Flow for UI Components

```
Admin Dashboard (React)
    │
    ├─ shadcn/ui Button
    ├─ shadcn/ui Form
    └─ Plugin Custom Component (TSX)
       │
       ├─ useStore() hook
       ├─ useAuth() hook
       └─ useTenant() hook
       │
       ▼
   Plugin API Endpoint
       │
       ├─ Call Express or Workers
       ├─ Process request
       └─ Return response
       │
       ▼
   Display in Admin Dashboard
```

## Plugin Structure

### Standard Plugin Directory

```
my-awesome-plugin/
├── plugin.json                      # Plugin manifest (required)
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── README.md                        # Documentation
│
├── src/
│   ├── index.ts                     # Main plugin file
│   │
│   ├── hooks/                       # Hook implementations
│   │   ├── beforeProductCreate.ts
│   │   ├── afterProductCreate.ts
│   │   ├── beforeOrderComplete.ts
│   │   └── afterPaymentSuccess.ts
│   │
│   ├── api/                         # Custom endpoints
│   │   ├── webhooks.ts
│   │   ├── customAction.ts
│   │   └── stats.ts
│   │
│   ├── admin/                       # Admin UI components (shadcn/ui)
│   │   ├── Settings.tsx             # Plugin settings component
│   │   ├── Dashboard.tsx            # Plugin dashboard
│   │   ├── Reports.tsx              # Reports/analytics
│   │   └── components/
│   │       ├── PluginStatusCard.tsx
│   │       ├── ConfigForm.tsx
│   │       └── MetricsChart.tsx
│   │
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── validators.ts
│   │
│   └── types.ts                     # TypeScript types
│
├── migrations/                      # Database migrations
│   └── 001_create_plugin_tables.sql
│
├── tests/
│   ├── hooks.test.ts
│   ├── api.test.ts
│   └── admin.test.ts
│
└── assets/
    ├── icon.svg
    └── banner.png
```

### Minimal Plugin (To Get Started)

```
simple-plugin/
├── plugin.json
├── package.json
└── src/
    └── index.ts
```

## Plugin Manifest

### Complete Manifest (plugin.json)

```json
{
  "id": "stripe-gateway-123",
  "name": "Stripe Payment Gateway",
  "slug": "stripe-gateway",
  "version": "2.0.0",
  "author": "Platform Team",
  "email": "team@platform.dev",
  "description": "Accept payments via Stripe with full webhook support",
  "homepage": "https://github.com/platform/stripe-gateway",
  "license": "MIT",
  "icon": "assets/icon.svg",
  "banner": "assets/banner.png",
  
  "compatibility": {
    "minVersion": "1.0.0",
    "maxVersion": "2.x",
    "runtimes": ["express", "workers"]
  },
  
  "hooks": [
    {
      "name": "before_payment_process",
      "handler": "src/hooks/beforePaymentProcess.ts",
      "priority": 10,
      "async": true,
      "timeout": 5000
    },
    {
      "name": "after_payment_success",
      "handler": "src/hooks/afterPaymentSuccess.ts",
      "priority": 5,
      "async": true
    },
    {
      "name": "after_payment_failed",
      "handler": "src/hooks/afterPaymentFailed.ts",
      "priority": 5,
      "async": true
    }
  ],
  
  "api_endpoints": [
    {
      "method": "POST",
      "path": "/webhooks",
      "handler": "src/api/webhooks.ts",
      "auth_required": false,
      "description": "Webhook endpoint for Stripe events",
      "rate_limit": "1000/1h"
    },
    {
      "method": "GET",
      "path": "/charges",
      "handler": "src/api/charges.ts",
      "auth_required": true,
      "description": "Get list of charges",
      "rate_limit": "100/1h"
    }
  ],
  
  "admin_ui": {
    "settings_component": "src/admin/Settings.tsx",
    "menu_items": [
      {
        "label": "Stripe Settings",
        "path": "/stripe",
        "component": "src/admin/Settings.tsx",
        "icon": "Settings"
      },
      {
        "label": "Transactions",
        "path": "/stripe/transactions",
        "component": "src/admin/Transactions.tsx",
        "icon": "CreditCard"
      },
      {
        "label": "Webhooks",
        "path": "/stripe/webhooks",
        "component": "src/admin/Webhooks.tsx",
        "icon": "Webhook"
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
      "placeholder": "sk_test_...",
      "help": "Your Stripe secret API key from the dashboard"
    },
    "webhook_secret": {
      "type": "string",
      "label": "Webhook Signing Secret",
      "required": true,
      "sensitive": true,
      "help": "Used to verify webhook signatures from Stripe"
    },
    "enabled": {
      "type": "boolean",
      "label": "Enable Stripe Payments",
      "default": true
    },
    "test_mode": {
      "type": "boolean",
      "label": "Test Mode",
      "default": true,
      "help": "Use Stripe test credentials instead of live"
    },
    "statement_descriptor": {
      "type": "string",
      "label": "Statement Descriptor",
      "maxLength": 22,
      "help": "Appears on customer's bank statement"
    },
    "currency": {
      "type": "select",
      "label": "Default Currency",
      "options": [
        { "value": "usd", "label": "US Dollar" },
        { "value": "eur", "label": "Euro" },
        { "value": "gbp", "label": "British Pound" }
      ]
    }
  },
  
  "dependencies": [
    "stripe@^12.0.0"
  ],
  
  "keywords": [
    "payment",
    "stripe",
    "gateway",
    "payment-processing"
  ]
}
```

## Hooks System

### Available Hooks

Hooks are fired at strategic points in the platform's operation. Each hook can have multiple implementations with different priorities.

#### Product Hooks

```typescript
// before_product_create
// Called before a product is created
export default async function beforeProductCreate(ctx: PluginContext, data: any) {
  // Can modify/validate data
  if (!data.name) throw new Error('Name required');
  data.sku = `${ctx.store.slug}-${Date.now()}`;
  return data; // Return modified data
}

// after_product_create
// Called after product is successfully created
export default async function afterProductCreate(ctx: PluginContext, product: any) {
  // Can't modify product, use for side effects
  await ctx.http.post('https://api.external.com/products', product);
  // No return needed for after hooks
}

// before_product_update, after_product_update
// before_product_delete
```

#### Order Hooks

```typescript
// before_order_create
export default async function beforeOrderCreate(ctx: PluginContext, data: any) {
  // Validate order data
  // Apply pricing rules
  // Check inventory
  return data;
}

// after_order_create
export default async function afterOrderCreate(ctx: PluginContext, order: any) {
  // Send confirmation email
  // Create fulfillment
  // Track in analytics
}

// order_status_changed
export default async function orderStatusChanged(ctx: PluginContext, event: any) {
  const { order, oldStatus, newStatus } = event;
  await ctx.email.send({
    to: order.customer_data.email,
    template: `order_${newStatus}`,
    data: { order }
  });
}
```

#### Payment Hooks

```typescript
// before_payment_process
export default async function beforePaymentProcess(ctx: PluginContext, payment: any) {
  // Stripe-specific: add idempotency key
  payment.idempotencyKey = crypto.randomUUID();
  return payment;
}

// after_payment_success
export default async function afterPaymentSuccess(ctx: PluginContext, transaction: any) {
  // Update order to "paid"
  // Trigger fulfillment
  // Send receipt
}

// after_payment_failed
```

#### Delivery Hooks

```typescript
// before_delivery
export default async function beforeDelivery(ctx: PluginContext, delivery: any) {
  // Generate download link
  // Create license key
  // Send API key
  return delivery;
}

// after_delivery
export default async function afterDelivery(ctx: PluginContext, delivery: any) {
  // Log delivery
  // Mark item as delivered
  // Send thank you email
}
```

### Hook Priorities

Lower priority = earlier execution

```typescript
// plugin.json
"hooks": [
  {
    "name": "before_product_create",
    "handler": "src/hooks/validate.ts",
    "priority": 5    // Runs first (validation)
  },
  {
    "name": "before_product_create",
    "handler": "src/hooks/transform.ts",
    "priority": 10   // Runs second (transformation)
  },
  {
    "name": "before_product_create",
    "handler": "src/hooks/enrich.ts",
    "priority": 15   // Runs third (enrichment)
  }
]
```

### Hook Context (PluginContext)

All hooks receive a context object with access to platform resources:

```typescript
interface PluginContext {
  // Store/Tenant information
  store: Tenant;              // Current store/tenant
  tenantId: string;           // Tenant UUID
  userId: string;             // Current user ID
  
  // Plugin information
  plugin: TenantPlugin;       // Plugin config & settings
  config: Record<string, any>; // Plugin settings
  
  // Database access
  db: Database;               // Query interface
  
  // HTTP client (with auth)
  http: HttpClient;           // Make external API calls
  
  // Caching (KV in Workers, Redis in Express)
  cache: CacheStore;          // Key-value cache with TTL
  
  // Session management
  session: SessionStore;      // User sessions
  
  // File storage (R2 in Workers, S3/local in Express)
  storage: FileStorage;       // Upload/download files
  
  // Email service
  email: EmailService;        // Send emails
  
  // Event system
  events: EventEmitter;       // Emit custom events
  
  // Logging
  logger: Logger;             // Log messages
  
  // Utilities
  utils: {
    generateToken(): string;
    hashPassword(pwd: string): string;
    formatPrice(price: number): string;
  }
}
```

### Hook Implementation Examples

#### Payment Gateway Plugin

```typescript
// src/hooks/beforePaymentProcess.ts
import { PluginContext } from '../types';

export default async function beforePaymentProcess(
  ctx: PluginContext,
  payment: any
) {
  const config = ctx.config as StripeConfig;
  
  // Validate API key exists
  if (!config.api_key) {
    throw new Error('Stripe API key not configured');
  }
  
  // Add Stripe-specific metadata
  payment.gateway_metadata = {
    api_mode: config.test_mode ? 'test' : 'live',
    idempotency_key: ctx.utils.generateToken(),
    customer_id: payment.customer_id,
    timestamp: new Date().toISOString()
  };
  
  // Log payment initiation
  ctx.logger.info(`Processing payment of ${payment.amount} via Stripe`, {
    paymentId: payment.id,
    tenantId: ctx.tenantId
  });
  
  return payment;
}
```

#### Integration Plugin

```typescript
// src/hooks/afterOrderCreate.ts
export default async function afterOrderCreate(ctx: PluginContext, order: any) {
  const config = ctx.config as IntegrationConfig;
  
  if (!config.enabled) return;
  
  try {
    // Push order to external system
    const response = await ctx.http.post(
      config.webhook_url,
      {
        event: 'order.created',
        order: {
          id: order.id,
          number: order.order_number,
          customer: order.customer_data,
          items: order.items_data,
          total: order.pricing_data.total
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'X-Webhook-Secret': config.webhook_secret
        },
        timeout: 5000
      }
    );
    
    // Store external reference
    await ctx.cache.set(
      `order-sync-${order.id}`,
      response.data.external_id,
      { ttl: 86400 } // 1 day
    );
    
  } catch (error) {
    ctx.logger.error('Failed to sync order to external system', {
      orderId: order.id,
      error: error.message
    });
    
    // Don't throw - order already created, sync failure is non-blocking
  }
}
```

## UI Components (shadcn)

### Using shadcn/ui Components

The admin dashboard uses shadcn/ui for consistent, accessible components. Plugins should follow the same pattern.

#### Plugin Settings Component

```typescript
// src/admin/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/use-toast';

// Validation schema (matches plugin.json settings_schema)
const stripeSettingsSchema = z.object({
  api_key: z.string().min(1, 'API key is required'),
  webhook_secret: z.string().min(1, 'Webhook secret is required'),
  enabled: z.boolean().default(true),
  test_mode: z.boolean().default(true),
  statement_descriptor: z.string().max(22).optional(),
  currency: z.enum(['usd', 'eur', 'gbp']).default('usd'),
});

type StripeSettings = z.infer<typeof stripeSettingsSchema>;

export default function StripeSettings() {
  const [loading, setLoading] = useState(false);
  const { tenant } = useStore();
  const { toast } = useToast();

  const form = useForm<StripeSettings>({
    resolver: zodResolver(stripeSettingsSchema),
    defaultValues: {
      enabled: true,
      test_mode: true,
      currency: 'usd',
    },
  });

  // Load plugin settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(
          `/api/${tenant.slug}/admin/plugins/stripe-gateway/config`
        );
        if (response.ok) {
          const { data } = await response.json();
          form.reset(data);
        }
      } catch (error) {
        toast({
          title: 'Error loading settings',
          variant: 'destructive',
        });
      }
    };

    loadSettings();
  }, [tenant.slug]);

  async function onSubmit(values: StripeSettings) {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/${tenant.slug}/admin/plugins/stripe-gateway/config`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) throw new Error('Failed to save settings');

      toast({
        title: 'Settings saved',
        description: 'Stripe configuration updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Stripe Payment Gateway</h2>
        <p className="text-gray-600">Configure your Stripe API credentials</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* API Key Field */}
          <FormField
            control={form.control}
            name="api_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stripe API Key</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="sk_test_..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your Stripe secret API key (kept secure)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Webhook Secret Field */}
          <FormField
            control={form.control}
            name="webhook_secret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook Signing Secret</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="whsec_..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Used to verify webhook signatures from Stripe
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency Selection */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="usd">US Dollar (USD)</SelectItem>
                    <SelectItem value="eur">Euro (EUR)</SelectItem>
                    <SelectItem value="gbp">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Test Mode Toggle */}
          <FormField
            control={form.control}
            name="test_mode"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Test Mode</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Enable/Disable Toggle */}
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Enable Stripe Payments</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

#### Plugin Dashboard Component

```typescript
// src/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/hooks/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StripeDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { tenant } = useStore();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(
          `/api/${tenant.slug}/admin/plugins/stripe-gateway/stats`
        );
        if (response.ok) {
          const { data } = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [tenant.slug]);

  if (loading) return <div>Loading...</div>;

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${stats?.total_revenue || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Transaction Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.transaction_count || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.success_rate || 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.daily_revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transactions">
        {/* Transactions table component */}
      </TabsContent>
    </Tabs>
  );
}
```

## API Endpoints

### Registering Custom Endpoints

```typescript
// src/api/webhooks.ts
import { Context } from 'hono';
import { HonoEnv } from '../types';

export default async function handleStripeWebhook(c: Context<HonoEnv>) {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();
  
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    c.env.STRIPE_WEBHOOK_SECRET
  );
  
  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Update order to paid
      await handlePaymentSuccess(c, event.data.object);
      break;
    case 'payment_intent.payment_failed':
      // Mark payment as failed
      await handlePaymentFailed(c, event.data.object);
      break;
  }
  
  return c.json({ received: true });
}

// src/api/index.ts - Register the endpoint
export function registerPluginEndpoints(app: HonoApp) {
  app.post('/webhooks', handleStripeWebhook);
  app.get('/charges', listCharges);
  app.get('/charges/:id', getCharge);
}
```

### Making Plugin Endpoints Available

In the plugin manifest:

```json
{
  "api_endpoints": [
    {
      "method": "POST",
      "path": "/webhooks",
      "handler": "src/api/webhooks.ts",
      "auth_required": false,
      "description": "Webhook endpoint for Stripe events"
    },
    {
      "method": "GET",
      "path": "/charges",
      "handler": "src/api/charges.ts",
      "auth_required": true
    }
  ]
}
```

Plugin endpoints are mounted at:
```
POST   /api/{tenant_slug}/plugins/stripe-gateway/webhooks
GET    /api/{tenant_slug}/plugins/stripe-gateway/charges
GET    /api/{tenant_slug}/plugins/stripe-gateway/charges/:id
```

## Database Migrations

### Creating Migrations

```sql
-- migrations/001_create_stripe_tables.sql
CREATE TABLE IF NOT EXISTS stripe_charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_charge_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stripe_charges_tenant ON stripe_charges(tenant_id);
CREATE INDEX idx_stripe_charges_order ON stripe_charges(order_id);
CREATE INDEX idx_stripe_charges_stripe_id ON stripe_charges(stripe_charge_id);
```

## Testing Plugins

### Unit Tests

```typescript
// tests/hooks.test.ts
import { describe, it, expect, vi } from 'vitest';
import beforePaymentProcess from '../src/hooks/beforePaymentProcess';

describe('Stripe Hooks', () => {
  it('should add idempotency key', async () => {
    const mockContext = {
      config: { test_mode: true },
      utils: { generateToken: () => 'test-token' },
      logger: { info: vi.fn() }
    };

    const payment = { amount: 1000 };
    const result = await beforePaymentProcess(mockContext, payment);

    expect(result.gateway_metadata).toBeDefined();
    expect(result.gateway_metadata.idempotency_key).toBe('test-token');
  });
});
```

### Integration Tests

```typescript
// tests/integration.test.ts
import { describe, it, expect } from 'vitest';

describe('Stripe Plugin Integration', () => {
  it('should process payment end-to-end', async () => {
    const token = 'test-token';
    
    // Create order
    const orderRes = await fetch('/api/test-store/admin/orders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customer_email: 'test@example.com',
        items: [{ productId: 'p1', quantity: 1 }]
      })
    });
    const { data: order } = await orderRes.json();

    // Process payment
    const paymentRes = await fetch('/api/test-store/admin/orders/pay', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        orderId: order.id,
        paymentMethod: 'stripe'
      })
    });
    expect(paymentRes.status).toBe(200);
  });
});
```

## Deployment

### Publish to Plugin Registry

```bash
# Package plugin
npm run build
npm pack

# Publish to platform
npm run publish -- --registry https://plugins.platform.dev

# Or upload manually
# Go to https://platform.dev/admin/plugins/upload
# Upload plugin tarball
```

### Install in Tenant

**Via API:**
```bash
curl -X POST https://api.example.com/api/{tenant_slug}/admin/plugins/stripe-gateway/install \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.0.0"
  }'
```

**Via Admin Dashboard:**
1. Go to Admin → Plugins
2. Find "Stripe Payment Gateway"
3. Click "Install"
4. Configure settings
5. Click "Enable"

## Resources

- **Sample Plugin**: [examples/stripe-plugin](../examples/stripe-plugin/)
- **Plugin API Reference**: [PLUGIN_API.md](./PLUGIN_API.md)
- **Admin UI Components**: [shadcn/ui Docs](https://ui.shadcn.com/)
- **Hono Framework**: [Hono Docs](https://hono.dev/)
- **React Hook Form**: [React Hook Form Docs](https://react-hook-form.com/)
