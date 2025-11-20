import { z } from 'zod';

// Re-export manifest schema from the main plugin system
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

export const HookDefinitionSchema = z.object({
  name: z.string(),
  handler: z.string(),
  priority: z.number().default(100),
  conditions: z.record(z.any()).optional(),
});

export const ApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string(),
  handler: z.string(),
  auth_required: z.boolean().default(true),
  rate_limit: z.object({
    requests: z.number(),
    window: z.string(),
  }).optional(),
  middleware: z.array(z.string()).optional(),
});

export const DatabaseMigrationSchema = z.object({
  version: z.string(),
  description: z.string(),
  up: z.string(),
  down: z.string().optional(),
});

export const PluginManifestSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500),
  author: z.string().max(100),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().optional(),
  
  platform_version: z.string(),
  compatibility: z.array(z.string()).optional(),
  
  category: PluginCategorySchema,
  tags: z.array(z.string()).optional(),
  
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string(),
    optional: z.boolean().default(false),
    conditions: z.record(z.any()).optional(),
  })).optional(),
  
  peer_dependencies: z.array(z.object({
    name: z.string(),
    version: z.string(),
    optional: z.boolean().default(false),
    conditions: z.record(z.any()).optional(),
  })).optional(),
  
  hooks: z.array(HookDefinitionSchema).optional(),
  api_endpoints: z.array(ApiEndpointSchema).optional(),
  admin_ui: z.object({
    settings_component: z.string().optional(),
    menu_items: z.array(z.object({
      label: z.string(),
      path: z.string(),
      component: z.string().optional(),
      icon: z.string().optional(),
      order: z.number().default(0),
      permissions: z.array(z.string()).optional(),
    })).optional(),
    widgets: z.array(z.object({
      id: z.string(),
      component: z.string(),
      dashboard: z.enum(['main', 'analytics', 'orders', 'products']).default('main'),
      order: z.number().default(0),
      permissions: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
  
  database_migrations: z.array(DatabaseMigrationSchema).optional(),
  
  permissions: z.array(z.union([z.string(), z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    default_roles: z.array(z.string()).optional(),
  })])).optional(),
  
  settings_schema: z.record(z.object({
    type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'select', 'multiselect']),
    label: z.string(),
    description: z.string().optional(),
    default: z.any().optional(),
    required: z.boolean().default(false),
    sensitive: z.boolean().default(false),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      options: z.array(z.any()).optional(),
    }).optional(),
    group: z.string().optional(),
    order: z.number().default(0),
  })).optional(),
  
  install_script: z.string().optional(),
  uninstall_script: z.string().optional(),
  activate_script: z.string().optional(),
  deactivate_script: z.string().optional(),
  
  runtime: z.object({
    memory_mb: z.number().optional().default(128),
    timeout_ms: z.number().optional().default(30000),
    cpu_units: z.number().optional().default(1),
    environment: z.array(z.string()).optional(),
    bindings: z.array(z.string()).optional(),
  }).optional(),
  
  scheduled_tasks: z.array(z.object({
    name: z.string(),
    schedule: z.string(),
    handler: z.string(),
    enabled: z.boolean().default(true),
  })).optional(),
  
  webhooks: z.array(z.object({
    event: z.string(),
    handler: z.string(),
    async: z.boolean().default(true),
  })).optional(),
  
  i18n: z.object({
    default_locale: z.string().default('en'),
    supported_locales: z.array(z.string()).optional(),
    translations_dir: z.string().optional().default('./locales'),
  }).optional(),
  
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
export type DatabaseMigration = z.infer<typeof DatabaseMigrationSchema>;

// Validation functions
export function validatePluginManifest(manifest: unknown): PluginManifest {
  return PluginManifestSchema.parse(manifest);
}

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