import { PluginManifest, validatePluginManifest } from './manifest.js';
import { DependencyResolver, ResolutionResult } from './dependency-resolver.js';
import { PluginLifecycleManager, LifecycleEvent } from './lifecycle.js';
import { PluginLoader, LoadedPlugin } from './loader.js';
import { PluginContext, PluginSandbox } from './context.js';

export interface PluginManagerConfig {
  enableHotReload: boolean;
  maxPluginMemory: number;
  enableSandboxing: boolean;
  allowedPluginCategories: string[];
  dependencyCheckInterval: number;
  healthCheckInterval: number;
}

export interface PluginInfo {
  slug: string;
  manifest: PluginManifest;
  installed: boolean;
  active: boolean;
  loaded: boolean;
  version: string;
  category: string;
  dependencies: string[];
  dependents: string[];
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date;
  resourceUsage: {
    memory: number;
    cpu: number;
    requests: number;
  };
}

export class PluginManager {
  private config: PluginManagerConfig;
  private lifecycleManager: PluginLifecycleManager;
  private loader: PluginLoader;
  private dependencyResolver: DependencyResolver;
  private healthCheckInterval?: NodeJS.Timeout;
  private dependencyCheckInterval?: NodeJS.Timeout;

  constructor(config: Partial<PluginManagerConfig> = {}) {
    this.config = {
      enableHotReload: false,
      maxPluginMemory: 128,
      enableSandboxing: true,
      allowedPluginCategories: ['cms', 'auth', 'payment', 'delivery', 'email', 'analytics', 'integration', 'ui', 'workflow', 'utility'],
      dependencyCheckInterval: 60000, // 1 minute
      healthCheckInterval: 300000, // 5 minutes
      ...config,
    };

    this.lifecycleManager = new PluginLifecycleManager();
    this.loader = new PluginLoader({
      enableHotReload: this.config.enableHotReload,
      enableSandboxing: this.config.enableSandboxing,
    });
    this.dependencyResolver = new DependencyResolver();

    // Start background tasks
    this.startBackgroundTasks();
  }

  /**
   * Register a new plugin in the system
   */
  async registerPlugin(manifest: PluginManifest): Promise<void> {
    // Validate manifest
    const validatedManifest = validatePluginManifest(manifest);

    // Check category is allowed
    if (!this.config.allowedPluginCategories.includes(validatedManifest.category)) {
      throw new Error(`Plugin category ${validatedManifest.category} is not allowed`);
    }

    // Register with lifecycle manager
    await this.lifecycleManager.registerPlugin(validatedManifest);

    console.log(`Plugin ${validatedManifest.slug} registered successfully`);
  }

  /**
   * Install a plugin for a tenant
   */
  async installPlugin(
    tenantId: string,
    pluginSlug: string,
    config: Record<string, any> = {}
  ): Promise<void> {
    // Check dependencies
    const resolution = this.dependencyResolver.resolveDependencies([pluginSlug]);
    if (!resolution.success) {
      throw new Error(`Dependency resolution failed: ${JSON.stringify(resolution.conflicts)}`);
    }

    // Install through lifecycle manager
    await this.lifecycleManager.installPlugin(tenantId, pluginSlug, config);

    console.log(`Plugin ${pluginSlug} installed for tenant ${tenantId}`);
  }

  /**
   * Activate a plugin for a tenant
   */
  async activatePlugin(tenantId: string, pluginSlug: string): Promise<void> {
    // Get plugin info
    const pluginStatus = this.lifecycleManager.getPluginStatus(pluginSlug);
    if (!pluginStatus.installed) {
      throw new Error(`Plugin ${pluginSlug} is not installed`);
    }

    // Create plugin context
    const context = await this.createPluginContext(tenantId, pluginSlug);

    // Load the plugin
    const loadedPlugin = await this.loader.loadPlugin(pluginSlug, pluginStatus.manifest!, context);

    // Activate through lifecycle manager
    await this.lifecycleManager.activatePlugin(tenantId, pluginSlug);

    console.log(`Plugin ${pluginSlug} activated for tenant ${tenantId}`);
  }

  /**
   * Deactivate a plugin for a tenant
   */
  async deactivatePlugin(tenantId: string, pluginSlug: string): Promise<void> {
    // Unload the plugin
    if (this.loader.isPluginLoaded(pluginSlug)) {
      await this.loader.unloadPlugin(pluginSlug);
    }

    // Deactivate through lifecycle manager
    await this.lifecycleManager.deactivatePlugin(tenantId, pluginSlug);

    console.log(`Plugin ${pluginSlug} deactivated for tenant ${tenantId}`);
  }

  /**
   * Uninstall a plugin for a tenant
   */
  async uninstallPlugin(tenantId: string, pluginSlug: string): Promise<void> {
    // Deactivate first if active
    const pluginStatus = this.lifecycleManager.getPluginStatus(pluginSlug);
    if (pluginStatus.active) {
      await this.deactivatePlugin(tenantId, pluginSlug);
    }

    // Uninstall through lifecycle manager
    await this.lifecycleManager.uninstallPlugin(tenantId, pluginSlug);

    console.log(`Plugin ${pluginSlug} uninstalled for tenant ${tenantId}`);
  }

  /**
   * Execute a hook
   */
  async executeHook(hookName: string, data: any, context?: PluginContext): Promise<any[]> {
    const hooks = this.loader.getHooks(hookName);
    const results: any[] = [];

    for (const hook of hooks) {
      try {
        const plugin = this.loader.getLoadedPlugin(hook.plugin);
        if (plugin && plugin.active) {
          const result = await plugin.sandbox.execute(async (ctx) => {
            return await hook.handler(ctx, data);
          });
          results.push(result.result);
        }
      } catch (error) {
        console.error(`Hook ${hookName} failed for plugin ${hook.plugin}:`, error);
        // Continue with other hooks
      }
    }

    return results;
  }

  /**
   * Execute a plugin route
   */
  async executeRoute(
    method: string,
    path: string,
    req: any,
    res: any,
    next: any,
    context?: PluginContext
  ): Promise<void> {
    const routeKey = `${method}:${path}`;
    const routes = this.loader.getRoutes();
    const route = routes.find(r => `${r.method}:${r.path}` === routeKey);

    if (!route) {
      return next();
    }

    try {
      const plugin = this.loader.getLoadedPlugin(route.plugin);
      if (plugin && plugin.active) {
        // Execute middleware first
        for (const middleware of route.middleware) {
          await middleware(req, res, next);
        }

        // Execute route handler
        await plugin.sandbox.execute(async (ctx) => {
          return await route.handler(ctx, req, res, next);
        });
      } else {
        next();
      }
    } catch (error) {
      console.error(`Route ${routeKey} failed for plugin ${route.plugin}:`, error);
      next(error);
    }
  }

  /**
   * Execute a scheduled task
   */
  async executeTask(taskName: string, data: any, context?: PluginContext): Promise<void> {
    const tasks = this.loader.getTasks();
    const task = tasks.find(t => t.name === taskName);

    if (!task) {
      throw new Error(`Task ${taskName} not found`);
    }

    try {
      const plugin = this.loader.getLoadedPlugin(task.plugin);
      if (plugin && plugin.active) {
        await plugin.sandbox.execute(async (ctx) => {
          return await task.handler(ctx, data);
        });
      }
    } catch (error) {
      console.error(`Task ${taskName} failed for plugin ${task.plugin}:`, error);
      throw error;
    }
  }

  /**
   * Execute a webhook
   */
  async executeWebhook(event: string, data: any, context?: PluginContext): Promise<void> {
    const webhooks = this.loader.getWebhooks();
    const eventWebhooks = webhooks.filter(w => w.event === event);

    const promises = eventWebhooks.map(async (webhook) => {
      try {
        const plugin = this.loader.getLoadedPlugin(webhook.plugin);
        if (plugin && plugin.active) {
          if (webhook.async) {
            // Execute asynchronously
            plugin.sandbox.execute(async (ctx) => {
              return await webhook.handler(ctx, data);
            }).catch(error => {
              console.error(`Async webhook ${event} failed for plugin ${webhook.plugin}:`, error);
            });
          } else {
            // Execute synchronously
            await plugin.sandbox.execute(async (ctx) => {
              return await webhook.handler(ctx, data);
            });
          }
        }
      } catch (error) {
        console.error(`Webhook ${event} failed for plugin ${webhook.plugin}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get plugin information
   */
  async getPluginInfo(pluginSlug: string): Promise<PluginInfo | null> {
    const status = this.lifecycleManager.getPluginStatus(pluginSlug);
    const loadedPlugin = this.loader.getLoadedPlugin(pluginSlug);
    const dependencies = this.dependencyResolver.getAllDependencies(pluginSlug);
    const dependents = this.dependencyResolver.getDependents(pluginSlug);

    if (!status.registered) {
      return null;
    }

    return {
      slug: pluginSlug,
      manifest: status.manifest!,
      installed: status.installed,
      active: status.active,
      loaded: !!loadedPlugin,
      version: status.manifest!.version,
      category: status.manifest!.category,
      dependencies,
      dependents,
      healthStatus: 'unknown', // Would be determined by health checks
      lastHealthCheck: new Date(),
      resourceUsage: {
        memory: 0,
        cpu: 0,
        requests: 0,
      },
    };
  }

  /**
   * List all plugins
   */
  async listPlugins(): Promise<PluginInfo[]> {
    const plugins = this.lifecycleManager.listPlugins();
    const pluginInfos: PluginInfo[] = [];

    for (const plugin of plugins) {
      const info = await this.getPluginInfo(plugin.slug);
      if (info) {
        pluginInfos.push(info);
      }
    }

    return pluginInfos;
  }

  /**
   * Get plugins by category
   */
  async getPluginsByCategory(category: string): Promise<PluginInfo[]> {
    const allPlugins = await this.listPlugins();
    return allPlugins.filter(plugin => plugin.category === category);
  }

  /**
   * Check plugin dependencies
   */
  checkDependencies(pluginSlug: string): ResolutionResult {
    return this.dependencyResolver.resolveDependencies([pluginSlug]);
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): {
    nodes: Array<{ slug: string; manifest: PluginManifest; installed: boolean; active: boolean }>;
    edges: Array<{ from: string; to: string }>;
  } {
    return this.dependencyResolver.exportGraph();
  }

  /**
   * Create plugin context
   */
  private async createPluginContext(tenantId: string, pluginSlug: string): Promise<PluginContext> {
    // This would create a proper plugin context with all necessary services
    // For now, return a mock context
    const pluginStatus = this.lifecycleManager.getPluginStatus(pluginSlug);
    
    return {
      tenant: {
        id: tenantId,
        slug: 'tenant-slug',
        name: 'Tenant Name',
        settings: {},
      },
      plugin: {
        id: pluginSlug,
        slug: pluginSlug,
        manifest: pluginStatus.manifest!,
        config: {},
      },
      // Mock implementations - these would be actual service implementations
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
   * Start background tasks
   */
  private startBackgroundTasks(): void {
    // Health check interval
    if (this.config.healthCheckInterval > 0) {
      this.healthCheckInterval = setInterval(() => {
        this.performHealthChecks();
      }, this.config.healthCheckInterval);
    }

    // Dependency check interval
    if (this.config.dependencyCheckInterval > 0) {
      this.dependencyCheckInterval = setInterval(() => {
        this.checkDependencyHealth();
      }, this.config.dependencyCheckInterval);
    }
  }

  /**
   * Perform health checks on all plugins
   */
  private async performHealthChecks(): Promise<void> {
    const plugins = await this.listPlugins();
    
    for (const plugin of plugins) {
      if (plugin.active && plugin.manifest.health_check) {
        try {
          // Perform health check
          // This would implement actual health check logic
          console.log(`Health check for plugin ${plugin.slug}`);
        } catch (error) {
          console.error(`Health check failed for plugin ${plugin.slug}:`, error);
        }
      }
    }
  }

  /**
   * Check dependency health
   */
  private async checkDependencyHealth(): Promise<void> {
    const plugins = await this.listPlugins();
    
    for (const plugin of plugins) {
      if (plugin.active) {
        const resolution = this.dependencyResolver.resolveDependencies([plugin.slug]);
        if (!resolution.success) {
          console.warn(`Dependency issues detected for plugin ${plugin.slug}:`, resolution.conflicts);
        }
      }
    }
  }

  /**
   * Stop background tasks
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.dependencyCheckInterval) {
      clearInterval(this.dependencyCheckInterval);
    }
  }

  /**
   * Get manager statistics
   */
  getStats(): {
    registeredPlugins: number;
    installedPlugins: number;
    activePlugins: number;
    loadedPlugins: number;
    totalHooks: number;
    totalRoutes: number;
    totalTasks: number;
    totalWebhooks: number;
  } {
    const loaderStats = this.loader.getStats();
    const lifecyclePlugins = this.lifecycleManager.listPlugins();
    
    return {
      registeredPlugins: lifecyclePlugins.length,
      installedPlugins: lifecyclePlugins.filter(p => p.installed).length,
      activePlugins: lifecyclePlugins.filter(p => p.active).length,
      loadedPlugins: loaderStats.loadedPlugins,
      totalHooks: loaderStats.totalHooks,
      totalRoutes: loaderStats.totalRoutes,
      totalTasks: loaderStats.totalTasks,
      totalWebhooks: loaderStats.totalWebhooks,
    };
  }

  /**
   * Register event listener
   */
  on(event: string, listener: (event: LifecycleEvent) => void): void {
    this.lifecycleManager.on(event, listener);
  }
}