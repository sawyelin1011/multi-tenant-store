import { PluginManifest, validatePluginManifest } from './manifest.js';
import { DependencyResolver, ResolutionResult } from './dependency-resolver.js';
import { PluginContext, PluginSandbox, PluginExecutionResult } from './context.js';
import { getWorkerDb } from '../config/worker-database.js';
import { plugins, tenantPlugins } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

export interface PluginRegistry {
  [slug: string]: {
    manifest: PluginManifest;
    instance?: any;
    context?: PluginContext;
    sandbox?: PluginSandbox;
    installed: boolean;
    active: boolean;
    installedAt?: Date;
    activatedAt?: Date;
  };
}

export interface LifecycleEvent {
  type: 'install' | 'uninstall' | 'activate' | 'deactivate' | 'update' | 'error';
  plugin: string;
  tenant: string;
  timestamp: Date;
  data?: any;
  error?: Error;
}

export class PluginLifecycleManager {
  private registry: PluginRegistry = {};
  private dependencyResolver: DependencyResolver;
  private eventListeners: Map<string, Array<(event: LifecycleEvent) => void>> = new Map();

  constructor() {
    this.dependencyResolver = new DependencyResolver();
  }

  /**
   * Register a plugin manifest in the system
   */
  async registerPlugin(manifest: PluginManifest): Promise<void> {
    // Validate manifest
    const validatedManifest = validatePluginManifest(manifest);
    
    // Check if plugin already exists
    if (this.registry[validatedManifest.slug]) {
      throw new Error(`Plugin ${validatedManifest.slug} is already registered`);
    }

    // Add to dependency resolver
    this.dependencyResolver.addPlugin(validatedManifest);

    // Register in local registry
    this.registry[validatedManifest.slug] = {
      manifest: validatedManifest,
      installed: false,
      active: false,
    };

    // Store in database
    const db = getWorkerDb();
    await db.insert(plugins).values({
      name: validatedManifest.name,
      slug: validatedManifest.slug,
      version: validatedManifest.version,
      author: validatedManifest.author,
      description: validatedManifest.description,
      manifest: JSON.stringify(validatedManifest),
      status: 'available',
      is_official: false, // Could be determined by verification
    }).onConflictDoUpdate({
      target: plugins.slug,
      set: {
        name: validatedManifest.name,
        version: validatedManifest.version,
        author: validatedManifest.author,
        description: validatedManifest.description,
        manifest: JSON.stringify(validatedManifest),
        updated_at: new Date().toISOString(),
      },
    });
  }

  /**
   * Install a plugin for a tenant
   */
  async installPlugin(
    tenantId: string,
    pluginSlug: string,
    config: Record<string, any> = {}
  ): Promise<void> {
    const plugin = this.registry[pluginSlug];
    if (!plugin) {
      throw new Error(`Plugin ${pluginSlug} is not registered`);
    }

    if (plugin.installed) {
      throw new Error(`Plugin ${pluginSlug} is already installed`);
    }

    // Resolve dependencies
    const resolution = this.dependencyResolver.resolveDependencies([pluginSlug]);
    if (!resolution.success) {
      throw new Error(`Dependency resolution failed: ${JSON.stringify(resolution.conflicts)}`);
    }

    // Install dependencies first
    for (const depSlug of resolution.resolved) {
      if (depSlug !== pluginSlug) {
        await this.installPlugin(tenantId, depSlug, {});
      }
    }

    try {
      // Create plugin context
      const context = await this.createPluginContext(tenantId, pluginSlug, config);
      
      // Create sandbox
      const sandbox = new PluginSandbox(context, plugin.manifest.runtime);

      // Run install script if present
      if (plugin.manifest.install_script) {
        const installResult = await this.runPluginScript(
          plugin.manifest.install_script,
          sandbox,
          'install'
        );
        
        if (!installResult.success) {
          throw new Error(`Install script failed: ${installResult.error?.message}`);
        }
      }

      // Run database migrations
      if (plugin.manifest.database_migrations) {
        await this.runMigrations(plugin.manifest.database_migrations, tenantId);
      }

      // Update registry
      plugin.installed = true;
      plugin.context = context;
      plugin.sandbox = sandbox;
      plugin.installedAt = new Date();

      // Store in database
      const db = getWorkerDb();
      const pluginRecord = await db.query.plugins.findFirst({
        where: eq(plugins.slug, pluginSlug),
      });

      if (pluginRecord) {
        await db.insert(tenantPlugins).values({
          tenant_id: tenantId,
          plugin_id: pluginRecord.id,
          status: 'inactive',
          config: JSON.stringify(config),
          installed_at: new Date().toISOString(),
        });
      }

      // Emit event
      this.emitEvent({
        type: 'install',
        plugin: pluginSlug,
        tenant: tenantId,
        timestamp: new Date(),
        data: { config },
      });

    } catch (error) {
      // Rollback on failure
      await this.rollbackInstall(tenantId, pluginSlug);
      
      this.emitEvent({
        type: 'error',
        plugin: pluginSlug,
        tenant: tenantId,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
      
      throw error;
    }
  }

  /**
   * Activate a plugin for a tenant
   */
  async activatePlugin(tenantId: string, pluginSlug: string): Promise<void> {
    const plugin = this.registry[pluginSlug];
    if (!plugin) {
      throw new Error(`Plugin ${pluginSlug} is not registered`);
    }

    if (!plugin.installed) {
      throw new Error(`Plugin ${pluginSlug} is not installed`);
    }

    if (plugin.active) {
      throw new Error(`Plugin ${pluginSlug} is already active`);
    }

    try {
      // Run activate script if present
      if (plugin.manifest.activate_script) {
        const activateResult = await this.runPluginScript(
          plugin.manifest.activate_script,
          plugin.sandbox!,
          'activate'
        );
        
        if (!activateResult.success) {
          throw new Error(`Activate script failed: ${activateResult.error?.message}`);
        }
      }

      // Register hooks
      if (plugin.manifest.hooks) {
        await this.registerHooks(pluginSlug, plugin.manifest.hooks, plugin.sandbox!);
      }

      // Register API endpoints
      if (plugin.manifest.api_endpoints) {
        await this.registerApiEndpoints(pluginSlug, plugin.manifest.api_endpoints, plugin.sandbox!);
      }

      // Register scheduled tasks
      if (plugin.manifest.scheduled_tasks) {
        await this.registerScheduledTasks(pluginSlug, plugin.manifest.scheduled_tasks, plugin.sandbox!);
      }

      // Register webhooks
      if (plugin.manifest.webhooks) {
        await this.registerWebhooks(pluginSlug, plugin.manifest.webhooks, plugin.sandbox!);
      }

      // Update registry
      plugin.active = true;
      plugin.activatedAt = new Date();

      // Update database
      const db = getWorkerDb();
      const pluginRecord = await db.query.plugins.findFirst({
        where: eq(plugins.slug, pluginSlug),
      });

      if (pluginRecord) {
        await db
          .update(tenantPlugins)
          .set({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .where(
            and(
              eq(tenantPlugins.tenant_id, tenantId),
              eq(tenantPlugins.plugin_id, pluginRecord.id)
            )
          );
      }

      // Emit event
      this.emitEvent({
        type: 'activate',
        plugin: pluginSlug,
        tenant: tenantId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.emitEvent({
        type: 'error',
        plugin: pluginSlug,
        tenant: tenantId,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
      
      throw error;
    }
  }

  /**
   * Deactivate a plugin for a tenant
   */
  async deactivatePlugin(tenantId: string, pluginSlug: string): Promise<void> {
    const plugin = this.registry[pluginSlug];
    if (!plugin) {
      throw new Error(`Plugin ${pluginSlug} is not registered`);
    }

    if (!plugin.active) {
      throw new Error(`Plugin ${pluginSlug} is not active`);
    }

    try {
      // Run deactivate script if present
      if (plugin.manifest.deactivate_script) {
        const deactivateResult = await this.runPluginScript(
          plugin.manifest.deactivate_script,
          plugin.sandbox!,
          'deactivate'
        );
        
        if (!deactivateResult.success) {
          throw new Error(`Deactivate script failed: ${deactivateResult.error?.message}`);
        }
      }

      // Unregister hooks
      if (plugin.manifest.hooks) {
        await this.unregisterHooks(pluginSlug);
      }

      // Unregister API endpoints
      if (plugin.manifest.api_endpoints) {
        await this.unregisterApiEndpoints(pluginSlug);
      }

      // Unregister scheduled tasks
      if (plugin.manifest.scheduled_tasks) {
        await this.unregisterScheduledTasks(pluginSlug);
      }

      // Unregister webhooks
      if (plugin.manifest.webhooks) {
        await this.unregisterWebhooks(pluginSlug);
      }

      // Update registry
      plugin.active = false;

      // Update database
      const db = getWorkerDb();
      const pluginRecord = await db.query.plugins.findFirst({
        where: eq(plugins.slug, pluginSlug),
      });

      if (pluginRecord) {
        await db
          .update(tenantPlugins)
          .set({
            status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .where(
            and(
              eq(tenantPlugins.tenant_id, tenantId),
              eq(tenantPlugins.plugin_id, pluginRecord.id)
            )
          );
      }

      // Emit event
      this.emitEvent({
        type: 'deactivate',
        plugin: pluginSlug,
        tenant: tenantId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.emitEvent({
        type: 'error',
        plugin: pluginSlug,
        tenant: tenantId,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
      
      throw error;
    }
  }

  /**
   * Uninstall a plugin for a tenant
   */
  async uninstallPlugin(tenantId: string, pluginSlug: string): Promise<void> {
    const plugin = this.registry[pluginSlug];
    if (!plugin) {
      throw new Error(`Plugin ${pluginSlug} is not registered`);
    }

    if (!plugin.installed) {
      throw new Error(`Plugin ${pluginSlug} is not installed`);
    }

    // Check if other plugins depend on this one
    const impact = this.dependencyResolver.checkUninstallImpact(pluginSlug);
    if (!impact.safe) {
      throw new Error(`Cannot uninstall ${pluginSlug}: required by ${impact.broken.join(', ')}`);
    }

    // Deactivate first if active
    if (plugin.active) {
      await this.deactivatePlugin(tenantId, pluginSlug);
    }

    try {
      // Run uninstall script if present
      if (plugin.manifest.uninstall_script) {
        const uninstallResult = await this.runPluginScript(
          plugin.manifest.uninstall_script,
          plugin.sandbox!,
          'uninstall'
        );
        
        if (!uninstallResult.success) {
          throw new Error(`Uninstall script failed: ${uninstallResult.error?.message}`);
        }
      }

      // Update registry
      plugin.installed = false;
      plugin.context = undefined;
      plugin.sandbox = undefined;

      // Update database
      const db = getWorkerDb();
      const pluginRecord = await db.query.plugins.findFirst({
        where: eq(plugins.slug, pluginSlug),
      });

      if (pluginRecord) {
        await db
          .delete(tenantPlugins)
          .where(
            and(
              eq(tenantPlugins.tenant_id, tenantId),
              eq(tenantPlugins.plugin_id, pluginRecord.id)
            )
          );
      }

      // Emit event
      this.emitEvent({
        type: 'uninstall',
        plugin: pluginSlug,
        tenant: tenantId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.emitEvent({
        type: 'error',
        plugin: pluginSlug,
        tenant: tenantId,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
      
      throw error;
    }
  }

  /**
   * Create plugin context for a tenant
   */
  private async createPluginContext(
    tenantId: string,
    pluginSlug: string,
    config: Record<string, any>
  ): Promise<PluginContext> {
    const plugin = this.registry[pluginSlug];
    
    // Get tenant information
    const db = getWorkerDb();
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // This would be implemented with actual service calls
    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        settings: typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings,
      },
      plugin: {
        id: pluginSlug, // Would be actual plugin ID
        slug: pluginSlug,
        manifest: plugin.manifest,
        config,
      },
      // These would be actual implementations
      db: {
        query: async (sql: string, params?: any[]) => [],
        one: async (sql: string, params?: any[]) => ({}),
        transaction: async (callback) => callback({}),
      },
      cache: {
        get: async (key: string) => null,
        set: async (key: string, value: any, ttl?: number) => {},
        delete: async (key: string) => {},
        clear: async () => {},
      },
      storage: {
        upload: async (key: string, data: ArrayBuffer | ReadableStream, metadata?: Record<string, string>) => '',
        download: async (key: string) => new ArrayBuffer(0),
        delete: async (key: string) => {},
        list: async (prefix?: string) => [],
      },
      http: {
        get: async (url: string, options?: RequestInit) => new Response(),
        post: async (url: string, data?: any, options?: RequestInit) => new Response(),
        put: async (url: string, data?: any, options?: RequestInit) => new Response(),
        delete: async (url: string, options?: RequestInit) => new Response(),
      },
      events: {
        emit: async (event: string, data: any) => {},
        on: (event: string, handler: (data: any) => Promise<void>) => {},
        off: (event: string, handler: (data: any) => Promise<void>) => {},
      },
      logger: {
        debug: (message: string, meta?: Record<string, any>) => console.debug(message, meta),
        info: (message: string, meta?: Record<string, any>) => console.info(message, meta),
        warn: (message: string, meta?: Record<string, any>) => console.warn(message, meta),
        error: (message: string, error?: Error, meta?: Record<string, any>) => console.error(message, error, meta),
      },
      plugins: {
        get: async (slug: string) => null,
        call: async (slug: string, method: string, ...args: any[]) => null,
        list: async () => [],
      },
      tasks: {
        schedule: async (name: string, data: any, delay?: number) => {},
        cancel: async (taskId: string) => {},
      },
      utils: {
        crypto: {
          hash: async (data: string) => '',
          random: async (length: number) => '',
          sign: async (data: string, key: string) => '',
          verify: async (data: string, signature: string, key: string) => false,
        },
        validation: {
          email: (email: string) => true,
          url: (url: string) => true,
          uuid: (uuid: string) => true,
        },
        formatting: {
          currency: (amount: number, currency?: string) => '$0.00',
          date: (date: Date, format?: string) => date.toISOString(),
          json: (obj: any, pretty?: boolean) => JSON.stringify(obj, null, pretty ? 2 : 0),
        },
      },
      ui: {
        registerComponent: (id: string, component: any) => {},
        registerWidget: (id: string, widget: any) => {},
        registerMenuItem: (item: any) => {},
      },
    };
  }

  /**
   * Run a plugin script
   */
  private async runPluginScript(
    scriptPath: string,
    sandbox: PluginSandbox,
    type: string
  ): Promise<PluginExecutionResult> {
    try {
      // In a real implementation, this would load and execute the script
      // For now, we'll simulate it
      const scriptFunction = async (context: PluginContext) => {
        // Simulate script execution
        context.logger.info(`Running ${type} script`);
        return { success: true };
      };

      return await sandbox.execute(scriptFunction);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: 0,
        memoryUsed: 0,
      };
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(
    migrations: any[],
    tenantId: string
  ): Promise<void> {
    // In a real implementation, this would run the migrations
    console.log(`Running ${migrations.length} migrations for tenant ${tenantId}`);
  }

  /**
   * Register hooks
   */
  private async registerHooks(
    pluginSlug: string,
    hooks: any[],
    sandbox: PluginSandbox
  ): Promise<void> {
    // In a real implementation, this would register the hooks
    console.log(`Registering ${hooks.length} hooks for plugin ${pluginSlug}`);
  }

  /**
   * Register API endpoints
   */
  private async registerApiEndpoints(
    pluginSlug: string,
    endpoints: any[],
    sandbox: PluginSandbox
  ): Promise<void> {
    // In a real implementation, this would register the API endpoints
    console.log(`Registering ${endpoints.length} API endpoints for plugin ${pluginSlug}`);
  }

  /**
   * Register scheduled tasks
   */
  private async registerScheduledTasks(
    pluginSlug: string,
    tasks: any[],
    sandbox: PluginSandbox
  ): Promise<void> {
    // In a real implementation, this would register the scheduled tasks
    console.log(`Registering ${tasks.length} scheduled tasks for plugin ${pluginSlug}`);
  }

  /**
   * Register webhooks
   */
  private async registerWebhooks(
    pluginSlug: string,
    webhooks: any[],
    sandbox: PluginSandbox
  ): Promise<void> {
    // In a real implementation, this would register the webhooks
    console.log(`Registering ${webhooks.length} webhooks for plugin ${pluginSlug}`);
  }

  /**
   * Unregister hooks
   */
  private async unregisterHooks(pluginSlug: string): Promise<void> {
    console.log(`Unregistering hooks for plugin ${pluginSlug}`);
  }

  /**
   * Unregister API endpoints
   */
  private async unregisterApiEndpoints(pluginSlug: string): Promise<void> {
    console.log(`Unregistering API endpoints for plugin ${pluginSlug}`);
  }

  /**
   * Unregister scheduled tasks
   */
  private async unregisterScheduledTasks(pluginSlug: string): Promise<void> {
    console.log(`Unregistering scheduled tasks for plugin ${pluginSlug}`);
  }

  /**
   * Unregister webhooks
   */
  private async unregisterWebhooks(pluginSlug: string): Promise<void> {
    console.log(`Unregistering webhooks for plugin ${pluginSlug}`);
  }

  /**
   * Rollback installation on failure
   */
  private async rollbackInstall(tenantId: string, pluginSlug: string): Promise<void> {
    console.log(`Rolling back installation of ${pluginSlug} for tenant ${tenantId}`);
    // Implementation would clean up any partial installation
  }

  /**
   * Emit lifecycle event
   */
  private emitEvent(event: LifecycleEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * Register event listener
   */
  on(event: string, listener: (event: LifecycleEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginSlug: string): {
    registered: boolean;
    installed: boolean;
    active: boolean;
    manifest?: PluginManifest;
  } {
    const plugin = this.registry[pluginSlug];
    return {
      registered: !!plugin,
      installed: plugin?.installed || false,
      active: plugin?.active || false,
      manifest: plugin?.manifest,
    };
  }

  /**
   * List all registered plugins
   */
  listPlugins(): Array<{
    slug: string;
    name: string;
    version: string;
    category: string;
    installed: boolean;
    active: boolean;
  }> {
    return Object.entries(this.registry).map(([slug, plugin]) => ({
      slug,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      category: plugin.manifest.category,
      installed: plugin.installed,
      active: plugin.active,
    }));
  }
}