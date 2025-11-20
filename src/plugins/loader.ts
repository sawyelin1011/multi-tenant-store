import { PluginManifest } from './manifest.js';
import { PluginContext, PluginSandbox } from './context.js';
import { PluginRegistry } from './lifecycle.js';

export interface LoadedPlugin {
  manifest: PluginManifest;
  instance: any;
  context: PluginContext;
  sandbox: PluginSandbox;
  active: boolean;
  hooks: Map<string, Array<{ handler: Function; priority: number }>>;
  routes: Map<string, { handler: Function; method: string; middleware: Function[] }>;
  tasks: Map<string, { handler: Function; schedule: string }>;
  webhooks: Map<string, { handler: Function; async: boolean }>;
  uiComponents: Map<string, any>;
  widgets: Map<string, any>;
}

export interface LoaderConfig {
  pluginDirectory: string;
  enableHotReload: boolean;
  maxLoadTime: number;
  enableSandboxing: boolean;
  allowedModules: string[];
  restrictedGlobals: string[];
}

export class PluginLoader {
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private config: LoaderConfig;
  private moduleCache: Map<string, any> = new Map();

  constructor(config: Partial<LoaderConfig> = {}) {
    this.config = {
      pluginDirectory: './plugins',
      enableHotReload: false,
      maxLoadTime: 30000,
      enableSandboxing: true,
      allowedModules: [
        'crypto', 'util', 'path', 'url', 'querystring',
        // Add other safe Node.js modules
      ],
      restrictedGlobals: [
        'process', 'global', 'Buffer', 'setImmediate', 'clearImmediate',
        // Restrict potentially dangerous globals
      ],
      ...config,
    };
  }

  /**
   * Load a plugin from its directory
   */
  async loadPlugin(
    pluginSlug: string,
    manifest: PluginManifest,
    context: PluginContext
  ): Promise<LoadedPlugin> {
    const startTime = Date.now();

    try {
      // Check if already loaded
      if (this.loadedPlugins.has(pluginSlug)) {
        throw new Error(`Plugin ${pluginSlug} is already loaded`);
      }

      // Load timeout
      const loadTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Plugin load timeout after ${this.config.maxLoadTime}ms`));
        }, this.config.maxLoadTime);
      });

      // Load the plugin
      const loadPromise = this.doLoadPlugin(pluginSlug, manifest, context);

      const loadedPlugin = await Promise.race([loadPromise, loadTimeout]);

      // Cache the loaded plugin
      this.loadedPlugins.set(pluginSlug, loadedPlugin);

      console.log(`Plugin ${pluginSlug} loaded in ${Date.now() - startTime}ms`);
      return loadedPlugin;

    } catch (error) {
      console.error(`Failed to load plugin ${pluginSlug}:`, error);
      throw error;
    }
  }

  /**
   * Internal plugin loading logic
   */
  private async doLoadPlugin(
    pluginSlug: string,
    manifest: PluginManifest,
    context: PluginContext
  ): Promise<LoadedPlugin> {
    // Create sandbox
    const sandboxConfig = manifest.runtime ? {
      timeoutMs: manifest.runtime.timeout_ms || 30000,
      memoryLimitMB: manifest.runtime.memory_mb || 128,
      allowedDomains: [],
      allowedBindings: manifest.runtime.bindings || ['DB', 'KV', 'R2'],
      rateLimit: {
        requests: 100,
        window: 60000, // 1 minute
      },
      permissions: [],
    } : {};
    const sandbox = new PluginSandbox(context, sandboxConfig);

    // Load plugin entry point
    const pluginInstance = await this.loadPluginEntry(pluginSlug, manifest, sandbox);

    // Initialize plugin components
    const hooks = await this.loadHooks(manifest, sandbox);
    const routes = await this.loadRoutes(manifest, sandbox);
    const tasks = await this.loadTasks(manifest, sandbox);
    const webhooks = await this.loadWebhooks(manifest, sandbox);
    const uiComponents = await this.loadUIComponents(manifest, sandbox);
    const widgets = await this.loadWidgets(manifest, sandbox);

    return {
      manifest,
      instance: pluginInstance,
      context,
      sandbox,
      active: true,
      hooks,
      routes,
      tasks,
      webhooks,
      uiComponents,
      widgets,
    };
  }

  /**
   * Load plugin entry point
   */
  private async loadPluginEntry(
    pluginSlug: string,
    manifest: PluginManifest,
    sandbox: PluginSandbox
  ): Promise<any> {
    try {
      // In a real implementation, this would dynamically import the plugin
      // For now, we'll create a mock instance
      
      const pluginModule = {
        default: {
          name: manifest.name,
          version: manifest.version,
          initialize: async (ctx: PluginContext) => {
            ctx.logger.info(`Initializing ${manifest.name} plugin`);
          },
          destroy: async (ctx: PluginContext) => {
            ctx.logger.info(`Destroying ${manifest.name} plugin`);
          },
        },
      };

      // Initialize the plugin
      if (pluginModule.default && typeof pluginModule.default.initialize === 'function') {
        await sandbox.execute(async (ctx) => {
          await pluginModule.default.initialize(ctx);
        });
      }

      return pluginModule.default;
    } catch (error) {
      throw new Error(`Failed to load plugin entry point: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load plugin hooks
   */
  private async loadHooks(
    manifest: PluginManifest,
    sandbox: PluginSandbox
  ): Promise<Map<string, Array<{ handler: Function; priority: number }>>> {
    const hooks = new Map<string, Array<{ handler: Function; priority: number }>>();

    if (!manifest.hooks) {
      return hooks;
    }

    for (const hookDef of manifest.hooks) {
      try {
        // Load hook handler
        const handler = await this.loadHandler(hookDef.handler, sandbox);
        
        if (!hooks.has(hookDef.name)) {
          hooks.set(hookDef.name, []);
        }

        hooks.get(hookDef.name)!.push({
          handler,
          priority: hookDef.priority,
        });

        // Sort by priority (lower number = higher priority)
        hooks.get(hookDef.name)!.sort((a, b) => a.priority - b.priority);

      } catch (error) {
        console.error(`Failed to load hook ${hookDef.name}:`, error);
      }
    }

    return hooks;
  }

  /**
   * Load plugin API routes
   */
  private async loadRoutes(
    manifest: PluginManifest,
    sandbox: PluginSandbox
  ): Promise<Map<string, { handler: Function; method: string; middleware: Function[] }>> {
    const routes = new Map<string, { handler: Function; method: string; middleware: Function[] }>();

    if (!manifest.api_endpoints) {
      return routes;
    }

    for (const routeDef of manifest.api_endpoints) {
      try {
        // Load route handler
        const handler = await this.loadHandler(routeDef.handler, sandbox);
        
        // Load middleware if specified
        const middleware: Function[] = [];
        if (routeDef.middleware) {
          for (const middlewarePath of routeDef.middleware) {
            const middlewareFn = await this.loadHandler(middlewarePath, sandbox);
            middleware.push(middlewareFn);
          }
        }

        const routeKey = `${routeDef.method}:${routeDef.path}`;
        routes.set(routeKey, {
          handler,
          method: routeDef.method,
          middleware,
        });

      } catch (error) {
        console.error(`Failed to load route ${routeDef.method} ${routeDef.path}:`, error);
      }
    }

    return routes;
  }

  /**
   * Load scheduled tasks
   */
  private async loadTasks(
    manifest: PluginManifest,
    sandbox: PluginSandbox
  ): Promise<Map<string, { handler: Function; schedule: string }>> {
    const tasks = new Map<string, { handler: Function; schedule: string }>();

    if (!manifest.scheduled_tasks) {
      return tasks;
    }

    for (const taskDef of manifest.scheduled_tasks) {
      try {
        // Load task handler
        const handler = await this.loadHandler(taskDef.handler, sandbox);
        
        tasks.set(taskDef.name, {
          handler,
          schedule: taskDef.schedule,
        });

      } catch (error) {
        console.error(`Failed to load task ${taskDef.name}:`, error);
      }
    }

    return tasks;
  }

  /**
   * Load webhook handlers
   */
  private async loadWebhooks(
    manifest: PluginManifest,
    sandbox: PluginSandbox
  ): Promise<Map<string, { handler: Function; async: boolean }>> {
    const webhooks = new Map<string, { handler: Function; async: boolean }>();

    if (!manifest.webhooks) {
      return webhooks;
    }

    for (const webhookDef of manifest.webhooks) {
      try {
        // Load webhook handler
        const handler = await this.loadHandler(webhookDef.handler, sandbox);
        
        webhooks.set(webhookDef.event, {
          handler,
          async: webhookDef.async,
        });

      } catch (error) {
        console.error(`Failed to load webhook ${webhookDef.event}:`, error);
      }
    }

    return webhooks;
  }

  /**
   * Load UI components
   */
  private async loadUIComponents(
    manifest: PluginManifest,
    sandbox: PluginSandbox
  ): Promise<Map<string, any>> {
    const components = new Map<string, any>();

    if (!manifest.admin_ui?.settings_component) {
      return components;
    }

    try {
      // Load settings component
      const component = await this.loadHandler(manifest.admin_ui.settings_component, sandbox);
      components.set('settings', component);

    } catch (error) {
      console.error(`Failed to load UI components:`, error);
    }

    return components;
  }

  /**
   * Load widgets
   */
  private async loadWidgets(
    manifest: PluginManifest,
    sandbox: PluginSandbox
  ): Promise<Map<string, any>> {
    const widgets = new Map<string, any>();

    if (!manifest.admin_ui?.widgets) {
      return widgets;
    }

    for (const widgetDef of manifest.admin_ui.widgets) {
      try {
        // Load widget component
        const widget = await this.loadHandler(widgetDef.component, sandbox);
        widgets.set(widgetDef.id, widget);

      } catch (error) {
        console.error(`Failed to load widget ${widgetDef.id}:`, error);
      }
    }

    return widgets;
  }

  /**
   * Load a handler function from a file path
   */
  private async loadHandler(handlerPath: string, sandbox: PluginSandbox): Promise<Function> {
    try {
      // In a real implementation, this would dynamically import the module
      // For now, we'll create a mock handler
      
      const cacheKey = handlerPath;
      if (this.moduleCache.has(cacheKey)) {
        return this.moduleCache.get(cacheKey);
      }

      // Mock handler - in reality this would be a dynamic import
      const handler = async (context: PluginContext, ...args: any[]) => {
        context.logger.info(`Executing handler: ${handlerPath}`);
        return { success: true };
      };

      // Cache the handler
      this.moduleCache.set(cacheKey, handler);
      
      return handler;

    } catch (error) {
      throw new Error(`Failed to load handler ${handlerPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginSlug: string): Promise<void> {
    const loadedPlugin = this.loadedPlugins.get(pluginSlug);
    if (!loadedPlugin) {
      throw new Error(`Plugin ${pluginSlug} is not loaded`);
    }

    try {
      // Call destroy method if available
      if (loadedPlugin.instance && typeof loadedPlugin.instance.destroy === 'function') {
        await loadedPlugin.sandbox.execute(async (ctx) => {
          await loadedPlugin.instance.destroy(ctx);
        });
      }

      // Clear cache entries for this plugin
      for (const [key] of this.moduleCache.entries()) {
        if (key.includes(pluginSlug)) {
          this.moduleCache.delete(key);
        }
      }

      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginSlug);

      console.log(`Plugin ${pluginSlug} unloaded successfully`);

    } catch (error) {
      console.error(`Failed to unload plugin ${pluginSlug}:`, error);
      throw error;
    }
  }

  /**
   * Reload a plugin (for hot reload)
   */
  async reloadPlugin(
    pluginSlug: string,
    manifest: PluginManifest,
    context: PluginContext
  ): Promise<LoadedPlugin> {
    if (!this.config.enableHotReload) {
      throw new Error('Hot reload is disabled');
    }

    // Unload if already loaded
    if (this.loadedPlugins.has(pluginSlug)) {
      await this.unloadPlugin(pluginSlug);
    }

    // Load again
    return await this.loadPlugin(pluginSlug, manifest, context);
  }

  /**
   * Get a loaded plugin
   */
  getLoadedPlugin(pluginSlug: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginSlug);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): Map<string, LoadedPlugin> {
    return new Map(this.loadedPlugins);
  }

  /**
   * Check if a plugin is loaded
   */
  isPluginLoaded(pluginSlug: string): boolean {
    return this.loadedPlugins.has(pluginSlug);
  }

  /**
   * Get hooks for a specific event
   */
  getHooks(event: string): Array<{ plugin: string; handler: Function; priority: number }> {
    const hooks: Array<{ plugin: string; handler: Function; priority: number }> = [];

    for (const [pluginSlug, loadedPlugin] of this.loadedPlugins.entries()) {
      const pluginHooks = loadedPlugin.hooks.get(event) || [];
      hooks.push(...pluginHooks.map(hook => ({
        plugin: pluginSlug,
        handler: hook.handler,
        priority: hook.priority,
      })));
    }

    // Sort by priority
    hooks.sort((a, b) => a.priority - b.priority);
    
    return hooks;
  }

  /**
   * Get routes
   */
  getRoutes(): Array<{ plugin: string; method: string; path: string; handler: Function; middleware: Function[] }> {
    const routes: Array<{ plugin: string; method: string; path: string; handler: Function; middleware: Function[] }> = [];

    for (const [pluginSlug, loadedPlugin] of this.loadedPlugins.entries()) {
      for (const [routeKey, route] of loadedPlugin.routes.entries()) {
        const [method, path] = routeKey.split(':');
        routes.push({
          plugin: pluginSlug,
          method,
          path,
          handler: route.handler,
          middleware: route.middleware,
        });
      }
    }

    return routes;
  }

  /**
   * Get scheduled tasks
   */
  getTasks(): Array<{ plugin: string; name: string; handler: Function; schedule: string }> {
    const tasks: Array<{ plugin: string; name: string; handler: Function; schedule: string }> = [];

    for (const [pluginSlug, loadedPlugin] of this.loadedPlugins.entries()) {
      for (const [taskName, task] of loadedPlugin.tasks.entries()) {
        tasks.push({
          plugin: pluginSlug,
          name: taskName,
          handler: task.handler,
          schedule: task.schedule,
        });
      }
    }

    return tasks;
  }

  /**
   * Get webhooks
   */
  getWebhooks(): Array<{ plugin: string; event: string; handler: Function; async: boolean }> {
    const webhooks: Array<{ plugin: string; event: string; handler: Function; async: boolean }> = [];

    for (const [pluginSlug, loadedPlugin] of this.loadedPlugins.entries()) {
      for (const [event, webhook] of loadedPlugin.webhooks.entries()) {
        webhooks.push({
          plugin: pluginSlug,
          event,
          handler: webhook.handler,
          async: webhook.async,
        });
      }
    }

    return webhooks;
  }

  /**
   * Get UI components
   */
  getUIComponents(pluginSlug: string): Map<string, any> {
    const loadedPlugin = this.loadedPlugins.get(pluginSlug);
    return loadedPlugin ? loadedPlugin.uiComponents : new Map();
  }

  /**
   * Get widgets
   */
  getWidgets(pluginSlug: string): Map<string, any> {
    const loadedPlugin = this.loadedPlugins.get(pluginSlug);
    return loadedPlugin ? loadedPlugin.widgets : new Map();
  }

  /**
   * Clear all loaded plugins
   */
  async clearAll(): Promise<void> {
    const unloadPromises = Array.from(this.loadedPlugins.keys()).map(slug => 
      this.unloadPlugin(slug).catch(error => 
        console.error(`Failed to unload plugin ${slug}:`, error)
      )
    );

    await Promise.all(unloadPromises);
    this.loadedPlugins.clear();
    this.moduleCache.clear();
  }

  /**
   * Get loader statistics
   */
  getStats(): {
    loadedPlugins: number;
    totalHooks: number;
    totalRoutes: number;
    totalTasks: number;
    totalWebhooks: number;
    cacheSize: number;
  } {
    let totalHooks = 0;
    let totalRoutes = 0;
    let totalTasks = 0;
    let totalWebhooks = 0;

    for (const loadedPlugin of this.loadedPlugins.values()) {
      totalHooks += loadedPlugin.hooks.size;
      totalRoutes += loadedPlugin.routes.size;
      totalTasks += loadedPlugin.tasks.size;
      totalWebhooks += loadedPlugin.webhooks.size;
    }

    return {
      loadedPlugins: this.loadedPlugins.size,
      totalHooks,
      totalRoutes,
      totalTasks,
      totalWebhooks,
      cacheSize: this.moduleCache.size,
    };
  }
}