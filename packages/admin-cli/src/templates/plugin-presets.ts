export type PluginType =
  | 'payment'
  | 'auth'
  | 'analytics'
  | 'integration'
  | 'ui'
  | 'workflow'
  | 'delivery'
  | 'email'
  | 'cms'
  | 'utility';

interface HookDefinition {
  name: string;
  handler: string;
  priority: number;
}

interface ApiEndpointDefinition {
  method: string;
  path: string;
  handler: string;
  auth_required: boolean;
}

interface MenuItemDefinition {
  label: string;
  path: string;
  component?: string;
  icon?: string;
  order?: number;
}

interface WidgetDefinition {
  id: string;
  component: string;
  dashboard: string;
  order?: number;
}

interface AdminUiDefinition {
  settings_component?: string;
  menu_items?: MenuItemDefinition[];
  widgets?: WidgetDefinition[];
}

export interface PluginPreset {
  pluginInterface: string;
  categoryEnum: string;
  description: string;
  hooks: HookDefinition[];
  apiEndpoints: ApiEndpointDefinition[];
  adminUi: AdminUiDefinition;
  settingsSchema: Record<string, any>;
  migrations?: string[];
  lifecycleSnippet: string;
}

const paymentLifecycle = `
  async processPayment(context: PluginContext, paymentData: any) {
    context.logger.info('Processing payment request', { amount: paymentData.amount, currency: paymentData.currency });

    return {
      success: true,
      transactionId: 'txn_' + Date.now(),
      status: 'authorized',
      metadata: {
        provider: this.name,
      },
    };
  }

  async handleWebhook(context: PluginContext, event: string, payload: any) {
    context.logger.info('Webhook received', { event });
  }
`;

const authLifecycle = `
  async authenticate(context: PluginContext, credentials: any) {
    context.logger.info('Authenticating user', { email: credentials.email });
    return {
      user: { id: 'user_' + Date.now(), email: credentials.email },
      token: 'jwt-token-placeholder',
    };
  }
`;

const analyticsLifecycle = `
  async initialize(context: PluginContext) {
    context.logger.info('Analytics capture configured for tenant', { tenant: context.tenant.slug });
  }
`;

const workflowLifecycle = `
  async executeWorkflow(context: PluginContext, workflowName: string, data: any) {
    context.logger.info('Executing workflow step', { workflowName });
    return {
      status: 'completed',
      data,
    };
  }
`;

const integrationLifecycle = `
  async syncData(context: PluginContext, syncConfig: any) {
    context.logger.info('Syncing data with upstream provider', { direction: syncConfig.direction });
    return {
      success: true,
      recordsProcessed: 1,
    };
  }
`;

const deliveryLifecycle = `
  async deliver(context: PluginContext, deliveryData: any) {
    context.logger.info('Delivering product payload', { orderId: deliveryData.orderId });
    return {
      success: true,
      deliveryId: 'del_' + Date.now(),
      status: 'completed',
    };
  }
`;

const emailLifecycle = `
  async sendEmail(context: PluginContext, emailData: any) {
    context.logger.info('Sending transactional email', { to: emailData.to });
    return {
      success: true,
      messageId: 'msg_' + Date.now(),
    };
  }
`;

const cmsLifecycle = `
  async initialize(context: PluginContext) {
    context.logger.info('CMS content types registered for tenant', { tenant: context.tenant.slug });
  }
`;

const utilityLifecycle = `
  async initialize(context: PluginContext) {
    context.logger.info('Utility plugin ready', { plugin: this.name });
  }
`;

export const pluginPresets: Record<PluginType, PluginPreset> = {
  payment: {
    pluginInterface: 'PaymentPlugin',
    categoryEnum: 'PAYMENT',
    description: 'Payment gateway integration with hooks and webhooks.',
    hooks: [
      { name: 'before_payment_process', handler: 'src/hooks/beforePaymentProcess.ts', priority: 100 },
      { name: 'after_payment_success', handler: 'src/hooks/afterPaymentSuccess.ts', priority: 50 },
    ],
    apiEndpoints: [
      { method: 'POST', path: '/process-payment', handler: 'src/api/processPayment.ts', auth_required: true },
      { method: 'POST', path: '/webhook', handler: 'src/api/webhook.ts', auth_required: false },
    ],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      menu_items: [
        { label: 'Payment Gateway', path: '/payments/{{slug}}', component: 'src/admin/Overview.tsx', icon: 'credit-card', order: 100 },
      ],
      widgets: [
        { id: 'gateway-status', component: 'src/admin/components/GatewayStatus.tsx', dashboard: 'analytics', order: 120 },
      ],
    },
    settingsSchema: {
      api_key: { type: 'string', label: 'Secret API Key', required: true, sensitive: true },
      publishable_key: { type: 'string', label: 'Publishable Key', required: true },
      webhook_secret: { type: 'string', label: 'Webhook Secret', required: true, sensitive: true },
      enabled: { type: 'boolean', label: 'Enable gateway', default: true },
    },
    migrations: ['migrations/001_create_gateway_tables.sql'],
    lifecycleSnippet: paymentLifecycle,
  },
  auth: {
    pluginInterface: 'AuthPlugin',
    categoryEnum: 'AUTH',
    description: 'Custom authentication provider with login hooks.',
    hooks: [
      { name: 'before_authenticate', handler: 'src/hooks/beforeAuthenticate.ts', priority: 100 },
      { name: 'after_authenticate', handler: 'src/hooks/afterAuthenticate.ts', priority: 50 },
    ],
    apiEndpoints: [
      { method: 'POST', path: '/auth/login', handler: 'src/api/login.ts', auth_required: false },
      { method: 'POST', path: '/auth/logout', handler: 'src/api/logout.ts', auth_required: true },
    ],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      menu_items: [
        { label: 'Auth Provider', path: '/auth/{{slug}}', component: 'src/admin/Overview.tsx', icon: 'shield-check', order: 100 },
      ],
    },
    settingsSchema: {
      client_id: { type: 'string', label: 'Client ID', required: true },
      client_secret: { type: 'string', label: 'Client Secret', required: true, sensitive: true },
      callback_url: { type: 'string', label: 'Callback URL', required: true },
    },
    migrations: [],
    lifecycleSnippet: authLifecycle,
  },
  analytics: {
    pluginInterface: 'AnalyticsPlugin',
    categoryEnum: 'ANALYTICS',
    description: 'Collect events and expose admin dashboards.',
    hooks: [{ name: 'event_tracked', handler: 'src/hooks/eventTracked.ts', priority: 100 }],
    apiEndpoints: [
      { method: 'POST', path: '/events', handler: 'src/api/trackEvent.ts', auth_required: false },
      { method: 'GET', path: '/metrics', handler: 'src/api/getMetrics.ts', auth_required: true },
    ],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      widgets: [{ id: 'analytics-overview', component: 'src/admin/components/AnalyticsOverview.tsx', dashboard: 'analytics', order: 100 }],
    },
    settingsSchema: {
      enabled: { type: 'boolean', label: 'Enable tracking', default: true },
      retention_days: { type: 'number', label: 'Retention (days)', default: 365 },
    },
    migrations: ['migrations/001_create_events_table.sql'],
    lifecycleSnippet: analyticsLifecycle,
  },
  integration: {
    pluginInterface: 'IntegrationPlugin',
    categoryEnum: 'INTEGRATION',
    description: 'Sync data with external SaaS providers.',
    hooks: [{ name: 'after_order_create', handler: 'src/hooks/afterOrderCreate.ts', priority: 80 }],
    apiEndpoints: [{ method: 'POST', path: '/sync', handler: 'src/api/sync.ts', auth_required: true }],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      menu_items: [{ label: 'Integrations', path: '/integrations/{{slug}}', component: 'src/admin/Overview.tsx', icon: 'link-2', order: 120 }],
    },
    settingsSchema: {
      api_url: { type: 'string', label: 'API URL', required: true },
      token: { type: 'string', label: 'Access Token', required: true, sensitive: true },
      schedule: { type: 'string', label: 'Sync Schedule (cron)', default: '0 * * * *' },
    },
    migrations: ['migrations/001_create_sync_tables.sql'],
    lifecycleSnippet: integrationLifecycle,
  },
  ui: {
    pluginInterface: 'UIPlugin',
    categoryEnum: 'UI',
    description: 'Adds shadcn widgets to the admin workspace.',
    hooks: [],
    apiEndpoints: [],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      widgets: [{ id: 'custom-widget', component: 'src/admin/components/CustomWidget.tsx', dashboard: 'main', order: 90 }],
    },
    settingsSchema: {
      enabled: { type: 'boolean', label: 'Display widget', default: true },
    },
    migrations: [],
    lifecycleSnippet: utilityLifecycle,
  },
  workflow: {
    pluginInterface: 'WorkflowPlugin',
    categoryEnum: 'WORKFLOW',
    description: 'Register workflow steps for fulfillment automation.',
    hooks: [{ name: 'after_order_create', handler: 'src/hooks/afterOrderCreate.ts', priority: 90 }],
    apiEndpoints: [{ method: 'POST', path: '/workflows/execute', handler: 'src/api/executeWorkflow.ts', auth_required: true }],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      menu_items: [{ label: 'Workflows', path: '/workflows/{{slug}}', component: 'src/admin/Overview.tsx', icon: 'workflow', order: 130 }],
    },
    settingsSchema: {
      sla_minutes: { type: 'number', label: 'SLA (minutes)', default: 30 },
    },
    migrations: ['migrations/001_create_workflow_tables.sql'],
    lifecycleSnippet: workflowLifecycle,
  },
  delivery: {
    pluginInterface: 'DeliveryPlugin',
    categoryEnum: 'DELIVERY',
    description: 'Implements custom delivery / fulfillment logic.',
    hooks: [{ name: 'after_order_complete', handler: 'src/hooks/afterOrderComplete.ts', priority: 70 }],
    apiEndpoints: [{ method: 'POST', path: '/deliveries', handler: 'src/api/createDelivery.ts', auth_required: true }],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      menu_items: [{ label: 'Delivery', path: '/delivery/{{slug}}', component: 'src/admin/Overview.tsx', icon: 'package', order: 140 }],
    },
    settingsSchema: {
      delivery_window: { type: 'string', label: 'Delivery window', default: 'instant' },
      retries: { type: 'number', label: 'Retry attempts', default: 3 },
    },
    migrations: ['migrations/001_create_delivery_tables.sql'],
    lifecycleSnippet: deliveryLifecycle,
  },
  email: {
    pluginInterface: 'EmailPlugin',
    categoryEnum: 'EMAIL',
    description: 'Transactional email provider with SMTP credentials.',
    hooks: [{ name: 'before_email_send', handler: 'src/hooks/beforeEmailSend.ts', priority: 50 }],
    apiEndpoints: [{ method: 'POST', path: '/preview-email', handler: 'src/api/previewEmail.ts', auth_required: true }],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      widgets: [{ id: 'email-metrics', component: 'src/admin/components/EmailMetrics.tsx', dashboard: 'analytics', order: 150 }],
    },
    settingsSchema: {
      smtp_host: { type: 'string', label: 'SMTP Host', required: true },
      smtp_port: { type: 'number', label: 'SMTP Port', default: 587 },
      smtp_user: { type: 'string', label: 'SMTP User', required: true },
      smtp_password: { type: 'string', label: 'SMTP Password', required: true, sensitive: true },
    },
    migrations: [],
    lifecycleSnippet: emailLifecycle,
  },
  cms: {
    pluginInterface: 'CMSPlugin',
    categoryEnum: 'CMS',
    description: 'Expose CMS content to the storefront.',
    hooks: [{ name: 'before_product_create', handler: 'src/hooks/beforeProductCreate.ts', priority: 80 }],
    apiEndpoints: [{ method: 'GET', path: '/content', handler: 'src/api/getContent.ts', auth_required: true }],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
      menu_items: [{ label: 'Content', path: '/content/{{slug}}', component: 'src/admin/Overview.tsx', icon: 'layout-dashboard', order: 160 }],
    },
    settingsSchema: {
      space_id: { type: 'string', label: 'Space ID', required: true },
      access_token: { type: 'string', label: 'Access Token', required: true, sensitive: true },
    },
    migrations: [],
    lifecycleSnippet: cmsLifecycle,
  },
  utility: {
    pluginInterface: 'UtilityPlugin',
    categoryEnum: 'UTILITY',
    description: 'Helper plugin for automation and shared logic.',
    hooks: [{ name: 'before_order_create', handler: 'src/hooks/beforeOrderCreate.ts', priority: 60 }],
    apiEndpoints: [{ method: 'POST', path: '/utilities/run', handler: 'src/api/runUtility.ts', auth_required: true }],
    adminUi: {
      settings_component: 'src/admin/Settings.tsx',
    },
    settingsSchema: {
      enabled: { type: 'boolean', label: 'Enabled', default: true },
    },
    migrations: [],
    lifecycleSnippet: utilityLifecycle,
  },
};

export const SUPPORTED_PLUGIN_TYPES = Object.keys(pluginPresets) as PluginType[];
