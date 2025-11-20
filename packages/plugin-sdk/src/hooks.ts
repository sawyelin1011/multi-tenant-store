import { z } from 'zod';

// Hook definitions for different plugin types
export const HookDefinitions = {
  // Product hooks
  BEFORE_PRODUCT_CREATE: 'before_product_create',
  AFTER_PRODUCT_CREATE: 'after_product_create',
  BEFORE_PRODUCT_UPDATE: 'before_product_update',
  AFTER_PRODUCT_UPDATE: 'after_product_update',
  BEFORE_PRODUCT_DELETE: 'before_product_delete',
  AFTER_PRODUCT_DELETE: 'after_product_delete',
  
  // Order hooks
  BEFORE_ORDER_CREATE: 'before_order_create',
  AFTER_ORDER_CREATE: 'after_order_create',
  BEFORE_ORDER_UPDATE: 'before_order_update',
  AFTER_ORDER_UPDATE: 'after_order_update',
  BEFORE_ORDER_COMPLETE: 'before_order_complete',
  AFTER_ORDER_COMPLETE: 'after_order_complete',
  BEFORE_ORDER_CANCEL: 'before_order_cancel',
  AFTER_ORDER_CANCEL: 'after_order_cancel',
  
  // Payment hooks
  BEFORE_PAYMENT_PROCESS: 'before_payment_process',
  AFTER_PAYMENT_SUCCESS: 'after_payment_success',
  AFTER_PAYMENT_FAILURE: 'after_payment_failure',
  BEFORE_PAYMENT_REFUND: 'before_payment_refund',
  AFTER_PAYMENT_REFUND: 'after_payment_refund',
  
  // Delivery hooks
  BEFORE_DELIVERY: 'before_delivery',
  AFTER_DELIVERY: 'after_delivery',
  BEFORE_DELIVERY_RETRY: 'before_delivery_retry',
  AFTER_DELIVERY_RETRY: 'after_delivery_retry',
  DELIVERY_FAILED: 'delivery_failed',
  
  // User hooks
  BEFORE_USER_CREATE: 'before_user_create',
  AFTER_USER_CREATE: 'after_user_create',
  BEFORE_USER_UPDATE: 'before_user_update',
  AFTER_USER_UPDATE: 'after_user_update',
  BEFORE_USER_DELETE: 'before_user_delete',
  AFTER_USER_DELETE: 'after_user_delete',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Auth hooks
  BEFORE_AUTHENTICATE: 'before_authenticate',
  AFTER_AUTHENTICATE: 'after_authenticate',
  AUTHENTICATION_FAILED: 'authentication_failed',
  BEFORE_AUTHORIZE: 'before_authorize',
  AFTER_AUTHORIZE: 'after_authorize',
  AUTHORIZATION_FAILED: 'authorization_failed',
  
  // Content hooks
  BEFORE_CONTENT_CREATE: 'before_content_create',
  AFTER_CONTENT_CREATE: 'after_content_create',
  BEFORE_CONTENT_UPDATE: 'before_content_update',
  AFTER_CONTENT_UPDATE: 'after_content_update',
  BEFORE_CONTENT_DELETE: 'before_content_delete',
  AFTER_CONTENT_DELETE: 'after_content_delete',
  CONTENT_VIEWED: 'content_viewed',
  
  // Email hooks
  BEFORE_EMAIL_SEND: 'before_email_send',
  AFTER_EMAIL_SEND: 'after_email_send',
  EMAIL_FAILED: 'email_failed',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  
  // Analytics hooks
  EVENT_TRACKED: 'event_tracked',
  PAGE_VIEWED: 'page_viewed',
  METRICS_COLLECTED: 'metrics_collected',
  
  // Integration hooks
  BEFORE_SYNC: 'before_sync',
  AFTER_SYNC: 'after_sync',
  SYNC_FAILED: 'sync_failed',
  WEBHOOK_RECEIVED: 'webhook_received',
  
  // System hooks
  PLUGIN_INSTALLED: 'plugin_installed',
  PLUGIN_ACTIVATED: 'plugin_activated',
  PLUGIN_DEACTIVATED: 'plugin_deactivated',
  PLUGIN_UNINSTALLED: 'plugin_uninstalled',
  PLUGIN_ERROR: 'plugin_error',
  
  // Workflow hooks
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_FAILED: 'workflow_failed',
  WORKFLOW_STEP_STARTED: 'workflow_step_started',
  WORKFLOW_STEP_COMPLETED: 'workflow_step_completed',
  
  // Utility hooks
  CRON_JOB: 'cron_job',
  HEALTH_CHECK: 'health_check',
  CACHE_CLEAR: 'cache_clear',
} as const;

// Hook data types
export interface ProductHookData {
  product: any;
  tenantId: string;
  userId?: string;
}

export interface OrderHookData {
  order: any;
  tenantId: string;
  userId?: string;
}

export interface PaymentHookData {
  payment: any;
  order?: any;
  tenantId: string;
  userId?: string;
}

export interface DeliveryHookData {
  delivery: any;
  order?: any;
  orderItem?: any;
  tenantId: string;
  userId?: string;
}

export interface UserHookData {
  user: any;
  tenantId: string;
}

export interface AuthHookData {
  credentials?: any;
  user?: any;
  resource?: string;
  action?: string;
  result?: any;
  tenantId: string;
}

export interface ContentHookData {
  content: any;
  contentType: string;
  tenantId: string;
  userId?: string;
}

export interface EmailHookData {
  email: {
    to: string | string[];
    subject: string;
    template?: string;
    data?: Record<string, any>;
  };
  tenantId: string;
  messageId?: string;
  error?: Error;
}

export interface AnalyticsHookData {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  tenantId: string;
  timestamp?: Date;
}

export interface IntegrationHookData {
  integration: any;
  data?: any;
  direction?: 'import' | 'export' | 'bidirectional';
  tenantId: string;
  error?: Error;
}

export interface PluginHookData {
  plugin: {
    slug: string;
    name: string;
    version: string;
  };
  tenantId: string;
  error?: Error;
}

export interface WorkflowHookData {
  workflow: any;
  execution: any;
  step?: any;
  tenantId: string;
  error?: Error;
}

// Hook registry for type-safe hook registration
export class HookRegistry {
  private static hooks: Map<string, Array<{ handler: Function; priority: number }>> = new Map();

  static registerHook(hookName: string, handler: Function, priority: number = 100): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    this.hooks.get(hookName)!.push({ handler, priority });
    
    // Sort by priority (lower number = higher priority)
    this.hooks.get(hookName)!.sort((a, b) => a.priority - b.priority);
  }

  static getHooks(hookName: string): Array<{ handler: Function; priority: number }> {
    return this.hooks.get(hookName) || [];
  }

  static unregisterHook(hookName: string, handler: Function): void {
    const hooks = this.hooks.get(hookName);
    if (hooks) {
      const index = hooks.findIndex(h => h.handler === handler);
      if (index !== -1) {
        hooks.splice(index, 1);
      }
    }
  }

  static clearHooks(hookName?: string): void {
    if (hookName) {
      this.hooks.delete(hookName);
    } else {
      this.hooks.clear();
    }
  }

  static getAllHooks(): Map<string, Array<{ handler: Function; priority: number }>> {
    return new Map(this.hooks);
  }
}

// Hook decorators for TypeScript
export function Hook(hookName: string, priority: number = 100) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      return originalMethod.apply(this, args);
    };
    
    // Register the hook
    HookRegistry.registerHook(hookName, descriptor.value, priority);
    
    return descriptor;
  };
}

// Hook execution utilities
export class HookExecutor {
  static async executeHook<T = any>(hookName: string, data: T): Promise<any[]> {
    const hooks = HookRegistry.getHooks(hookName);
    const results: any[] = [];

    for (const hook of hooks) {
      try {
        const result = await hook.handler(data);
        results.push(result);
      } catch (error) {
        console.error(`Hook ${hookName} failed:`, error);
        // Continue with other hooks
      }
    }

    return results;
  }

  static async executeHookWithFilter<T = any, R = any>(
    hookName: string, 
    data: T, 
    filter: (result: any) => boolean
  ): Promise<R[]> {
    const hooks = HookRegistry.getHooks(hookName);
    const results: R[] = [];

    for (const hook of hooks) {
      try {
        const result = await hook.handler(data);
        if (filter(result)) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Hook ${hookName} failed:`, error);
      }
    }

    return results;
  }

  static async executeHookWithTransform<T = any, R = any>(
    hookName: string, 
    data: T, 
    transform: (result: any) => R
  ): Promise<R[]> {
    const hooks = HookRegistry.getHooks(hookName);
    const results: R[] = [];

    for (const hook of hooks) {
      try {
        const result = await hook.handler(data);
        results.push(transform(result));
      } catch (error) {
        console.error(`Hook ${hookName} failed:`, error);
      }
    }

    return results;
  }

  static async executeHookUntil<T = any, R = any>(
    hookName: string, 
    data: T, 
    condition: (result: any) => boolean
  ): Promise<R | null> {
    const hooks = HookRegistry.getHooks(hookName);

    for (const hook of hooks) {
      try {
        const result = await hook.handler(data);
        if (condition(result)) {
          return result;
        }
      } catch (error) {
        console.error(`Hook ${hookName} failed:`, error);
      }
    }

    return null;
  }
}

// Hook validation schemas
export const HookDataSchemas = {
  product: z.object({
    product: z.any(),
    tenantId: z.string(),
    userId: z.string().optional(),
  }),
  
  order: z.object({
    order: z.any(),
    tenantId: z.string(),
    userId: z.string().optional(),
  }),
  
  payment: z.object({
    payment: z.any(),
    order: z.any().optional(),
    tenantId: z.string(),
    userId: z.string().optional(),
  }),
  
  delivery: z.object({
    delivery: z.any(),
    order: z.any().optional(),
    orderItem: z.any().optional(),
    tenantId: z.string(),
    userId: z.string().optional(),
  }),
  
  user: z.object({
    user: z.any(),
    tenantId: z.string(),
  }),
  
  auth: z.object({
    credentials: z.any().optional(),
    user: z.any().optional(),
    resource: z.string().optional(),
    action: z.string().optional(),
    result: z.any().optional(),
    tenantId: z.string(),
  }),
  
  content: z.object({
    content: z.any(),
    contentType: z.string(),
    tenantId: z.string(),
    userId: z.string().optional(),
  }),
  
  email: z.object({
    email: z.object({
      to: z.union([z.string(), z.array(z.string())]),
      subject: z.string(),
      template: z.string().optional(),
      data: z.record(z.any()).optional(),
    }),
    tenantId: z.string(),
    messageId: z.string().optional(),
    error: z.any().optional(),
  }),
  
  analytics: z.object({
    event: z.string(),
    properties: z.record(z.any()).optional(),
    userId: z.string().optional(),
    tenantId: z.string(),
    timestamp: z.date().optional(),
  }),
  
  integration: z.object({
    integration: z.any(),
    data: z.any().optional(),
    direction: z.enum(['import', 'export', 'bidirectional']).optional(),
    tenantId: z.string(),
    error: z.any().optional(),
  }),
  
  plugin: z.object({
    plugin: z.object({
      slug: z.string(),
      name: z.string(),
      version: z.string(),
    }),
    tenantId: z.string(),
    error: z.any().optional(),
  }),
  
  workflow: z.object({
    workflow: z.any(),
    execution: z.any(),
    step: z.any().optional(),
    tenantId: z.string(),
    error: z.any().optional(),
  }),
};

// Export all hook-related types and utilities
export type { 
  ProductHookData, 
  OrderHookData, 
  PaymentHookData, 
  DeliveryHookData, 
  UserHookData, 
  AuthHookData, 
  ContentHookData, 
  EmailHookData, 
  AnalyticsHookData, 
  IntegrationHookData, 
  PluginHookData, 
  WorkflowHookData 
};