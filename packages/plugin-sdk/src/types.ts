import { z } from 'zod';

// Plugin context interface (what plugins receive)
export interface PluginContext {
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
    manifest: any;
    config: Record<string, any>;
  };

  // Database access (scoped to tenant)
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
    clear: () => Promise<void>;
  };

  // Storage access (tenant-scoped)
  storage: {
    upload: (key: string, data: ArrayBuffer | ReadableStream, metadata?: Record<string, string>) => Promise<string>;
    download: (key: string) => Promise<ArrayBuffer>;
    delete: (key: string) => Promise<void>;
    list: (prefix?: string) => Promise<Array<{ key: string; size: number; uploaded: number }>>;
  };

  // HTTP client
  http: {
    get: (url: string, options?: RequestInit) => Promise<Response>;
    post: (url: string, data?: any, options?: RequestInit) => Promise<Response>;
    put: (url: string, data?: any, options?: RequestInit) => Promise<Response>;
    delete: (url: string, options?: RequestInit) => Promise<Response>;
  };

  // Event system
  events: {
    emit: (event: string, data: any) => Promise<void>;
    on: (event: string, handler: (data: any) => Promise<void>) => void;
    off: (event: string, handler: (data: any) => Promise<void>) => void;
  };

  // Logging
  logger: {
    debug: (message: string, meta?: Record<string, any>) => void;
    info: (message: string, meta?: Record<string, any>) => void;
    warn: (message: string, meta?: Record<string, any>) => void;
    error: (message: string, error?: Error, meta?: Record<string, any>) => void;
  };

  // Plugin communication
  plugins: {
    get: (slug: string) => Promise<any>;
    call: (slug: string, method: string, ...args: any[]) => Promise<any>;
    list: () => Promise<Array<{ slug: string; name: string; active: boolean }>>;
  };

  // Background tasks
  tasks: {
    schedule: (name: string, data: any, delay?: number) => Promise<void>;
    cancel: (taskId: string) => Promise<void>;
  };

  // Utilities
  utils: {
    crypto: {
      hash: (data: string) => Promise<string>;
      random: (length: number) => Promise<string>;
      sign: (data: string, key: string) => Promise<string>;
      verify: (data: string, signature: string, key: string) => Promise<boolean>;
    };
    validation: {
      email: (email: string) => boolean;
      url: (url: string) => boolean;
      uuid: (uuid: string) => boolean;
    };
    formatting: {
      currency: (amount: number, currency?: string) => string;
      date: (date: Date, format?: string) => string;
      json: (obj: any, pretty?: boolean) => string;
    };
  };

  // UI component registry
  ui: {
    registerComponent: (id: string, component: any) => void;
    registerWidget: (id: string, widget: any) => void;
    registerMenuItem: (item: any) => void;
  };
}

// Hook handler function type
export type HookHandler<T = any, R = any> = (context: PluginContext, data: T) => Promise<R>;

// API route handler function type
export type RouteHandler = (context: PluginContext, req: Request, res: Response, next: Function) => Promise<void>;

// Task handler function type
export type TaskHandler<T = any> = (context: PluginContext, data: T) => Promise<void>;

// Webhook handler function type
export type WebhookHandler<T = any> = (context: PluginContext, data: T) => Promise<void>;

// Plugin categories
export enum PluginCategory {
  CMS = 'cms',
  AUTH = 'auth',
  PAYMENT = 'payment',
  DELIVERY = 'delivery',
  EMAIL = 'email',
  ANALYTICS = 'analytics',
  INTEGRATION = 'integration',
  UI = 'ui',
  WORKFLOW = 'workflow',
  UTILITY = 'utility',
}

// Base plugin interface
export interface BasePlugin {
  name: string;
  version: string;
  initialize?: (context: PluginContext) => Promise<void>;
  destroy?: (context: PluginContext) => Promise<void>;
}

// CMS Plugin interface
export interface CMSPlugin extends BasePlugin {
  category: PluginCategory.CMS;
  contentTypes: {
    name: string;
    fields: Record<string, any>;
    validations: Record<string, any>;
  }[];
  renderContent?: (context: PluginContext, content: any, template?: string) => Promise<string>;
  searchContent?: (context: PluginContext, query: string, filters?: any) => Promise<any[]>;
}

// Auth Plugin interface
export interface AuthPlugin extends BasePlugin {
  category: PluginCategory.AUTH;
  authenticate: (context: PluginContext, credentials: any) => Promise<{ user: any; token?: string }>;
  authorize?: (context: PluginContext, user: any, resource: string, action: string) => Promise<boolean>;
  refreshToken?: (context: PluginContext, token: string) => Promise<string>;
  logout?: (context: PluginContext, token: string) => Promise<void>;
  getUserProfile?: (context: PluginContext, userId: string) => Promise<any>;
  updateUserProfile?: (context: PluginContext, userId: string, data: any) => Promise<any>;
}

// Payment Plugin interface
export interface PaymentPlugin extends BasePlugin {
  category: PluginCategory.PAYMENT;
  processPayment: (context: PluginContext, paymentData: {
    amount: number;
    currency: string;
    customerId?: string;
    orderId?: string;
    metadata?: Record<string, any>;
  }) => Promise<{
    success: boolean;
    transactionId?: string;
    status: string;
    redirectUrl?: string;
    error?: string;
  }>;
  capturePayment?: (context: PluginContext, transactionId: string) => Promise<any>;
  refundPayment?: (context: PluginContext, transactionId: string, amount?: number) => Promise<any>;
  getPaymentStatus?: (context: PluginContext, transactionId: string) => Promise<any>;
  handleWebhook?: (context: PluginContext, event: string, data: any) => Promise<void>;
}

// Delivery Plugin interface
export interface DeliveryPlugin extends BasePlugin {
  category: PluginCategory.DELIVERY;
  deliver: (context: PluginContext, deliveryData: {
    orderId: string;
    orderItemId?: string;
    deliveryMethod: any;
    customerData: any;
    productData: any;
  }) => Promise<{
    success: boolean;
    deliveryId?: string;
    status: string;
    trackingInfo?: any;
    downloadUrl?: string;
    error?: string;
  }>;
  getDeliveryStatus?: (context: PluginContext, deliveryId: string) => Promise<any>;
  cancelDelivery?: (context: PluginContext, deliveryId: string) => Promise<any>;
  retryDelivery?: (context: PluginContext, deliveryId: string) => Promise<any>;
}

// Email Plugin interface
export interface EmailPlugin extends BasePlugin {
  category: PluginCategory.EMAIL;
  sendEmail: (context: PluginContext, emailData: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    template?: string;
    data?: Record<string, any>;
    html?: string;
    text?: string;
    attachments?: Array<{
      filename: string;
      content: ArrayBuffer | string;
      contentType?: string;
    }>;
  }) => Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
  getTemplate?: (context: PluginContext, templateName: string) => Promise<string>;
  renderTemplate?: (context: PluginContext, template: string, data: Record<string, any>) => Promise<string>;
}

// Analytics Plugin interface
export interface AnalyticsPlugin extends BasePlugin {
  category: PluginCategory.ANALYTICS;
  trackEvent: (context: PluginContext, eventData: {
    event: string;
    properties?: Record<string, any>;
    userId?: string;
    timestamp?: Date;
  }) => Promise<void>;
  trackPageView?: (context: PluginContext, pageData: {
    path: string;
    title?: string;
    referrer?: string;
    userId?: string;
  }) => Promise<void>;
  getMetrics?: (context: PluginContext, query: {
    metric: string;
    startDate: Date;
    endDate: Date;
    filters?: Record<string, any>;
  }) => Promise<any>;
  getDashboard?: (context: PluginContext, dashboardId: string) => Promise<any>;
}

// Integration Plugin interface
export interface IntegrationPlugin extends BasePlugin {
  category: PluginCategory.INTEGRATION;
  syncData?: (context: PluginContext, syncConfig: {
    direction: 'import' | 'export' | 'bidirectional';
    entityType: string;
    mapping: Record<string, string>;
    filters?: Record<string, any>;
  }) => Promise<{
    success: boolean;
    recordsProcessed: number;
    errors?: any[];
  }>;
  handleWebhook?: (context: PluginContext, source: string, event: string, data: any) => Promise<void>;
  getFieldMapping?: (context: PluginContext, entityType: string) => Promise<Record<string, string>>;
  validateMapping?: (context: PluginContext, mapping: Record<string, string>) => Promise<boolean>;
}

// UI Plugin interface
export interface UIPlugin extends BasePlugin {
  category: PluginCategory.UI;
  components: {
    id: string;
    component: any; // React component
    props?: Record<string, any>;
  }[];
  widgets: {
    id: string;
    widget: any; // React widget component
    dashboard: string;
    order: number;
    permissions?: string[];
  }[];
  menuItems: {
    label: string;
    path: string;
    component?: any;
    icon?: string;
    order: number;
    permissions?: string[];
  }[];
}

// Workflow Plugin interface
export interface WorkflowPlugin extends BasePlugin {
  category: PluginCategory.WORKFLOW;
  steps: {
    name: string;
    handler: TaskHandler;
    config?: Record<string, any>;
  }[];
  executeWorkflow?: (context: PluginContext, workflowName: string, data: any) => Promise<any>;
  getWorkflowStatus?: (context: PluginContext, executionId: string) => Promise<any>;
}

// Utility Plugin interface
export interface UtilityPlugin extends BasePlugin {
  category: PluginCategory.UTILITY;
  utilities: {
    name: string;
    handler: Function;
    description?: string;
  }[];
}

// Union type for all plugin types
export type Plugin = 
  | CMSPlugin
  | AuthPlugin
  | PaymentPlugin
  | DeliveryPlugin
  | EmailPlugin
  | AnalyticsPlugin
  | IntegrationPlugin
  | UIPlugin
  | WorkflowPlugin
  | UtilityPlugin;

// Export all types
export * from './builder.js';
export * from './hooks.js';
export * from './ui.js';
export * from './manifest.js';