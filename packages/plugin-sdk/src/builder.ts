import { z } from 'zod';
import { PluginManifestSchema } from './manifest.js';

// Plugin builder class for easy plugin creation
export class PluginBuilder {
  private manifest: any = {
    name: '',
    slug: '',
    version: '1.0.0',
    description: '',
    author: '',
    platform_version: '1.0.0',
    category: 'utility',
    hooks: [],
    api_endpoints: [],
    admin_ui: {},
    database_migrations: [],
    permissions: [],
    settings_schema: {},
    dependencies: [],
    peer_dependencies: [],
    scheduled_tasks: [],
    webhooks: [],
    runtime: {
      memory_mb: 128,
      timeout_ms: 30000,
      cpu_units: 1,
    },
  };

  constructor(name: string, slug: string) {
    this.manifest.name = name;
    this.manifest.slug = slug;
  }

  // Basic metadata
  version(version: string): PluginBuilder {
    this.manifest.version = version;
    return this;
  }

  description(description: string): PluginBuilder {
    this.manifest.description = description;
    return this;
  }

  author(author: string): PluginBuilder {
    this.manifest.author = author;
    return this;
  }

  homepage(url: string): PluginBuilder {
    this.manifest.homepage = url;
    return this;
  }

  repository(url: string): PluginBuilder {
    this.manifest.repository = url;
    return this;
  }

  license(license: string): PluginBuilder {
    this.manifest.license = license;
    return this;
  }

  // Platform compatibility
  platformVersion(version: string): PluginBuilder {
    this.manifest.platform_version = version;
    return this;
  }

  compatibility(versions: string[]): PluginBuilder {
    this.manifest.compatibility = versions;
    return this;
  }

  // Categorization
  category(category: 'cms' | 'auth' | 'payment' | 'delivery' | 'email' | 'analytics' | 'integration' | 'ui' | 'workflow' | 'utility'): PluginBuilder {
    this.manifest.category = category;
    return this;
  }

  tags(tags: string[]): PluginBuilder {
    this.manifest.tags = tags;
    return this;
  }

  // Dependencies
  dependency(name: string, version: string, optional: boolean = false): PluginBuilder {
    if (!this.manifest.dependencies) {
      this.manifest.dependencies = [];
    }
    this.manifest.dependencies.push({ name, version, optional });
    return this;
  }

  peerDependency(name: string, version: string, optional: boolean = false): PluginBuilder {
    if (!this.manifest.peer_dependencies) {
      this.manifest.peer_dependencies = [];
    }
    this.manifest.peer_dependencies.push({ name, version, optional });
    return this;
  }

  // Hooks
  hook(name: string, handler: string, priority: number = 100): PluginBuilder {
    if (!this.manifest.hooks) {
      this.manifest.hooks = [];
    }
    this.manifest.hooks.push({ name, handler, priority });
    return this;
  }

  // API endpoints
  apiEndpoint(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', path: string, handler: string, options: {
    authRequired?: boolean;
    rateLimit?: { requests: number; window: string };
    middleware?: string[];
  } = {}): PluginBuilder {
    if (!this.manifest.api_endpoints) {
      this.manifest.api_endpoints = [];
    }
    
    this.manifest.api_endpoints.push({
      method,
      path,
      handler,
      auth_required: options.authRequired ?? true,
      rate_limit: options.rateLimit,
      middleware: options.middleware,
    });
    
    return this;
  }

  // Admin UI
  settingsComponent(component: string): PluginBuilder {
    if (!this.manifest.admin_ui) {
      this.manifest.admin_ui = {};
    }
    this.manifest.admin_ui.settings_component = component;
    return this;
  }

  menuItem(label: string, path: string, options: {
    component?: string;
    icon?: string;
    order?: number;
    permissions?: string[];
  } = {}): PluginBuilder {
    if (!this.manifest.admin_ui) {
      this.manifest.admin_ui = {};
    }
    if (!this.manifest.admin_ui.menu_items) {
      this.manifest.admin_ui.menu_items = [];
    }
    
    this.manifest.admin_ui.menu_items.push({
      label,
      path,
      component: options.component,
      icon: options.icon,
      order: options.order ?? 0,
      permissions: options.permissions,
    });
    
    return this;
  }

  widget(id: string, component: string, dashboard: 'main' | 'analytics' | 'orders' | 'products' = 'main', options: {
    order?: number;
    permissions?: string[];
  } = {}): PluginBuilder {
    if (!this.manifest.admin_ui) {
      this.manifest.admin_ui = {};
    }
    if (!this.manifest.admin_ui.widgets) {
      this.manifest.admin_ui.widgets = [];
    }
    
    this.manifest.admin_ui.widgets.push({
      id,
      component,
      dashboard,
      order: options.order ?? 0,
      permissions: options.permissions,
    });
    
    return this;
  }

  // Database migrations
  migration(version: string, description: string, up: string, down?: string): PluginBuilder {
    if (!this.manifest.database_migrations) {
      this.manifest.database_migrations = [];
    }
    
    this.manifest.database_migrations.push({
      version,
      description,
      up,
      down,
    });
    
    return this;
  }

  // Permissions
  permission(name: string, description: string, options: {
    category?: string;
    defaultRoles?: string[];
  } = {}): PluginBuilder {
    if (!this.manifest.permissions) {
      this.manifest.permissions = [];
    }
    
    this.manifest.permissions.push({
      name,
      description,
      category: options.category,
      default_roles: options.defaultRoles,
    });
    
    return this;
  }

  simplePermission(name: string): PluginBuilder {
    if (!this.manifest.permissions) {
      this.manifest.permissions = [];
    }
    this.manifest.permissions.push(name);
    return this;
  }

  // Settings schema
  setting(key: string, config: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'select' | 'multiselect';
    label: string;
    description?: string;
    default?: any;
    required?: boolean;
    sensitive?: boolean;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      options?: any[];
    };
    group?: string;
    order?: number;
  }): PluginBuilder {
    if (!this.manifest.settings_schema) {
      this.manifest.settings_schema = {};
    }
    
    this.manifest.settings_schema[key] = {
      type: config.type,
      label: config.label,
      description: config.description,
      default: config.default,
      required: config.required ?? false,
      sensitive: config.sensitive ?? false,
      validation: config.validation,
      group: config.group,
      order: config.order ?? 0,
    };
    
    return this;
  }

  // Lifecycle scripts
  installScript(script: string): PluginBuilder {
    this.manifest.install_script = script;
    return this;
  }

  uninstallScript(script: string): PluginBuilder {
    this.manifest.uninstall_script = script;
    return this;
  }

  activateScript(script: string): PluginBuilder {
    this.manifest.activate_script = script;
    return this;
  }

  deactivateScript(script: string): PluginBuilder {
    this.manifest.deactivate_script = script;
    return this;
  }

  // Runtime requirements
  runtime(config: {
    memoryMB?: number;
    timeoutMs?: number;
    cpuUnits?: number;
    environment?: string[];
    bindings?: string[];
  }): PluginBuilder {
    this.manifest.runtime = {
      memory_mb: config.memoryMB ?? 128,
      timeout_ms: config.timeoutMs ?? 30000,
      cpu_units: config.cpuUnits ?? 1,
      environment: config.environment,
      bindings: config.bindings,
    };
    return this;
  }

  // Scheduled tasks
  scheduledTask(name: string, schedule: string, handler: string, enabled: boolean = true): PluginBuilder {
    if (!this.manifest.scheduled_tasks) {
      this.manifest.scheduled_tasks = [];
    }
    
    this.manifest.scheduled_tasks.push({
      name,
      schedule,
      handler,
      enabled,
    });
    
    return this;
  }

  // Webhooks
  webhook(event: string, handler: string, async: boolean = true): PluginBuilder {
    if (!this.manifest.webhooks) {
      this.manifest.webhooks = [];
    }
    
    this.manifest.webhooks.push({
      event,
      handler,
      async,
    });
    
    return this;
  }

  // Internationalization
  i18n(defaultLocale: string = 'en', supportedLocales?: string[], translationsDir: string = './locales'): PluginBuilder {
    this.manifest.i18n = {
      default_locale: defaultLocale,
      supported_locales: supportedLocales,
      translations_dir: translationsDir,
    };
    return this;
  }

  // Health check
  healthCheck(config: {
    endpoint?: string;
    script?: string;
    interval?: string;
    timeout?: number;
  }): PluginBuilder {
    this.manifest.health_check = {
      endpoint: config.endpoint,
      script: config.script,
      interval: config.interval ?? '1m',
      timeout: config.timeout ?? 5000,
    };
    return this;
  }

  // Build the manifest
  build(): any {
    // Validate the manifest
    try {
      return PluginManifestSchema.parse(this.manifest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('\n');
        throw new Error(`Invalid plugin manifest:\n${formattedError}`);
      }
      throw error;
    }
  }

  // Export as JSON string
  toJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }

  // Save to file
  async saveToFile(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, this.toJSON(), 'utf-8');
  }
}

// Convenience builders for specific plugin types
export class CMSPluginBuilder extends PluginBuilder {
  constructor(name: string, slug: string) {
    super(name, slug);
    this.category('cms');
  }

  contentType(name: string, fields: Record<string, any>, validations: Record<string, any> = {}): CMSPluginBuilder {
    // This would add content type configuration
    // For now, just add as metadata
    return this;
  }
}

export class AuthPluginBuilder extends PluginBuilder {
  constructor(name: string, slug: string) {
    super(name, slug);
    this.category('auth');
  }

  oauth(provider: string, config: Record<string, any>): AuthPluginBuilder {
    this.setting(`${provider}_client_id`, {
      type: 'string',
      label: `${provider} Client ID`,
      required: true,
      sensitive: true,
    });
    
    this.setting(`${provider}_client_secret`, {
      type: 'string',
      label: `${provider} Client Secret`,
      required: true,
      sensitive: true,
    });
    
    return this;
  }
}

export class PaymentPluginBuilder extends PluginBuilder {
  constructor(name: string, slug: string) {
    super(name, slug);
    this.category('payment');
  }

  webhook(path: string): PaymentPluginBuilder {
    this.apiEndpoint('POST', `/webhooks/${path}`, 'src/handlers/webhook', {
      authRequired: false,
    });
    
    this.webhook('payment.success', 'src/handlers/payment-success');
    this.webhook('payment.failure', 'src/handlers/payment-failure');
    
    return this;
  }
}

export class EmailPluginBuilder extends PluginBuilder {
  constructor(name: string, slug: string) {
    super(name, slug);
    this.category('email');
  }

  smtp(): EmailPluginBuilder {
    this.setting('smtp_host', {
      type: 'string',
      label: 'SMTP Host',
      required: true,
    });
    
    this.setting('smtp_port', {
      type: 'number',
      label: 'SMTP Port',
      default: 587,
    });
    
    this.setting('smtp_user', {
      type: 'string',
      label: 'SMTP Username',
      required: true,
    });
    
    this.setting('smtp_password', {
      type: 'string',
      label: 'SMTP Password',
      required: true,
      sensitive: true,
    });
    
    return this;
  }
}

export class AnalyticsPluginBuilder extends PluginBuilder {
  constructor(name: string, slug: string) {
    super(name, slug);
    this.category('analytics');
  }

  dashboard(name: string, widgetId: string, component: string): AnalyticsPluginBuilder {
    this.widget(widgetId, component, 'analytics');
    return this;
  }
}

// Factory functions
export function createPlugin(name: string, slug: string): PluginBuilder {
  return new PluginBuilder(name, slug);
}

export function createCMSPlugin(name: string, slug: string): CMSPluginBuilder {
  return new CMSPluginBuilder(name, slug);
}

export function createAuthPlugin(name: string, slug: string): AuthPluginBuilder {
  return new AuthPluginBuilder(name, slug);
}

export function createPaymentPlugin(name: string, slug: string): PaymentPluginBuilder {
  return new PaymentPluginBuilder(name, slug);
}

export function createEmailPlugin(name: string, slug: string): EmailPluginBuilder {
  return new EmailPluginBuilder(name, slug);
}

export function createAnalyticsPlugin(name: string, slug: string): AnalyticsPluginBuilder {
  return new AnalyticsPluginBuilder(name, slug);
}