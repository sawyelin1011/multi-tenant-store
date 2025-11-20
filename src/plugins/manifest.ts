import { z } from 'zod';

// Plugin category types
export const PluginCategorySchema = z.enum([
  'cms',
  'auth', 
  'payment',
  'delivery',
  'email',
  'analytics',
  'integration',
  'ui',
  'workflow',
  'utility'
]);

// Hook definition schema
export const HookDefinitionSchema = z.object({
  name: z.string(),
  handler: z.string(), // Path to handler file
  priority: z.number().default(100),
  conditions: z.record(z.any()).optional(), // Conditional execution
});

// API endpoint definition
export const ApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string(),
  handler: z.string(), // Path to handler file
  auth_required: z.boolean().default(true),
  rate_limit: z.object({
    requests: z.number(),
    window: z.string(), // e.g., '1m', '1h'
  }).optional(),
  middleware: z.array(z.string()).optional(), // Middleware functions
});

// Admin UI component definition
export const AdminUiComponentSchema = z.object({
  settings_component: z.string().optional(), // Path to React component
  menu_items: z.array(z.object({
    label: z.string(),
    path: z.string(),
    component: z.string().optional(), // Path to React component
    icon: z.string().optional(),
    order: z.number().default(0),
    permissions: z.array(z.string()).optional(),
  })).optional(),
  widgets: z.array(z.object({
    id: z.string(),
    component: z.string(), // Path to React component
    dashboard: z.enum(['main', 'analytics', 'orders', 'products']).default('main'),
    order: z.number().default(0),
    permissions: z.array(z.string()).optional(),
  })).optional(),
});

// Database migration definition
export const DatabaseMigrationSchema = z.object({
  version: z.string(),
  description: z.string(),
  up: z.string(), // Path to migration file
  down: z.string().optional(), // Path to rollback file
});

// Permission definition
export const PermissionSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
  default_roles: z.array(z.string()).optional(),
});

// Plugin dependency definition
export const DependencySchema = z.object({
  name: z.string(),
  version: z.string(), // SemVer range
  optional: z.boolean().default(false),
  conditions: z.record(z.any()).optional(),
});

// Plugin manifest schema
export const PluginManifestSchema = z.object({
  // Basic metadata
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // SemVer
  description: z.string().max(500),
  author: z.string().max(100),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().optional(),
  
  // Platform compatibility
  platform_version: z.string(), // Minimum platform version
  compatibility: z.array(z.string()).optional(), // Platform versions
  
  // Plugin categorization
  category: PluginCategorySchema,
  tags: z.array(z.string()).optional(),
  
  // Dependencies
  dependencies: z.array(DependencySchema).optional(),
  peer_dependencies: z.array(DependencySchema).optional(),
  
  // Plugin capabilities
  hooks: z.array(HookDefinitionSchema).optional(),
  api_endpoints: z.array(ApiEndpointSchema).optional(),
  admin_ui: AdminUiComponentSchema.optional(),
  database_migrations: z.array(DatabaseMigrationSchema).optional(),
  
  // Permissions
  permissions: z.array(z.union([z.string(), PermissionSchema])).optional(),
  
  // Configuration schema
  settings_schema: z.record(z.object({
    type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'select', 'multiselect']),
    label: z.string(),
    description: z.string().optional(),
    default: z.any().optional(),
    required: z.boolean().default(false),
    sensitive: z.boolean().default(false), // For passwords, API keys, etc.
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      options: z.array(z.any()).optional(), // For select/multiselect
    }).optional(),
    group: z.string().optional(), // Group related settings
    order: z.number().default(0),
  })).optional(),
  
  // Plugin lifecycle
  install_script: z.string().optional(), // Path to install script
  uninstall_script: z.string().optional(), // Path to cleanup script
  activate_script: z.string().optional(), // Path to activation script
  deactivate_script: z.string().optional(), // Path to deactivation script
  
  // Runtime requirements
  runtime: z.object({
    memory_mb: z.number().optional().default(128),
    timeout_ms: z.number().optional().default(30000),
    cpu_units: z.number().optional().default(1),
    environment: z.array(z.string()).optional(), // Required environment variables
    bindings: z.array(z.string()).optional(), // Required Cloudflare bindings
  }).optional(),
  
  // Background tasks
  scheduled_tasks: z.array(z.object({
    name: z.string(),
    schedule: z.string(), // Cron expression
    handler: z.string(), // Path to handler
    enabled: z.boolean().default(true),
  })).optional(),
  
  // Webhook support
  webhooks: z.array(z.object({
    event: z.string(),
    handler: z.string(),
    async: z.boolean().default(true),
  })).optional(),
  
  // Internationalization
  i18n: z.object({
    default_locale: z.string().default('en'),
    supported_locales: z.array(z.string()).optional(),
    translations_dir: z.string().optional().default('./locales'),
  }).optional(),
  
  // Plugin health checks
  health_check: z.object({
    endpoint: z.string().optional(),
    script: z.string().optional(),
    interval: z.string().default('1m'),
    timeout: z.number().default(5000),
  }).optional(),
});

// Export types
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
export type PluginCategory = z.infer<typeof PluginCategorySchema>;
export type HookDefinition = z.infer<typeof HookDefinitionSchema>;
export type ApiEndpoint = z.infer<typeof ApiEndpointSchema>;
export type AdminUiComponent = z.infer<typeof AdminUiComponentSchema>;
export type DatabaseMigration = z.infer<typeof DatabaseMigrationSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Dependency = z.infer<typeof DependencySchema>;

// Validation function
export function validatePluginManifest(manifest: unknown): PluginManifest {
  return PluginManifestSchema.parse(manifest);
}

// Plugin manifest validation error
export class PluginManifestValidationError extends Error {
  constructor(message: string, public errors: any[]) {
    super(message);
    this.name = 'PluginManifestValidationError';
  }
}

// Safe validation with detailed errors
export function safeValidatePluginManifest(manifest: unknown): {
  success: boolean;
  data?: PluginManifest;
  errors?: any[];
} {
  try {
    const data = PluginManifestSchema.parse(manifest);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors,
      };
    }
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
    };
  }
}