import { PluginManifest } from './manifest.js';

// Cloudflare Workers environment bindings
export interface WorkerEnv {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  // Add other bindings as needed
}

// Plugin context interface - what plugins have access to
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
    manifest: PluginManifest;
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

  // HTTP client with rate limiting
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

  // UI component registry (for admin UI contributions)
  ui: {
    registerComponent: (id: string, component: any) => void;
    registerWidget: (id: string, widget: any) => void;
    registerMenuItem: (item: any) => void;
  };
}

// Plugin sandbox configuration
export interface SandboxConfig {
  timeoutMs: number;
  memoryLimitMB: number;
  allowedDomains: string[];
  allowedBindings: string[];
  rateLimit: {
    requests: number;
    window: number; // milliseconds
  };
  permissions: string[];
}

// Plugin execution result
export interface PluginExecutionResult {
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  memoryUsed: number;
}

// Plugin sandbox implementation
export class PluginSandbox {
  private config: SandboxConfig;
  private context: PluginContext;
  private startTime: number = 0;
  private memoryUsage: number = 0;

  constructor(context: PluginContext, config: Partial<SandboxConfig> = {}) {
    this.context = context;
    this.config = {
      timeoutMs: 30000,
      memoryLimitMB: 128,
      allowedDomains: [],
      allowedBindings: ['DB', 'KV', 'R2'],
      rateLimit: {
        requests: 100,
        window: 60000, // 1 minute
      },
      permissions: [],
      ...config,
    };
  }

  /**
   * Execute a plugin function in the sandbox
   */
  async execute<T = any>(
    fn: (context: PluginContext) => Promise<T>,
    customConfig?: Partial<SandboxConfig>
  ): Promise<PluginExecutionResult> {
    const config = { ...this.config, ...customConfig };
    const startTime = Date.now();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Plugin execution timeout (${config.timeoutMs}ms)`));
        }, config.timeoutMs);
      });

      // Execute the function with timeout
      const result = await Promise.race([
        fn(this.createRestrictedContext(config)),
        timeoutPromise,
      ]);

      return {
        success: true,
        result,
        duration: Date.now() - startTime,
        memoryUsed: this.memoryUsage,
      };
    } catch (error) {
      this.context.logger.error('Plugin execution failed', error instanceof Error ? error : new Error(String(error)));
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
        memoryUsed: this.memoryUsage,
      };
    }
  }

  /**
   * Create a restricted context with limited access
   */
  private createRestrictedContext(config: SandboxConfig): PluginContext {
    // Create proxy objects to restrict access
    const restrictedHttp = this.createRestrictedHttpClient(config.allowedDomains);
    const restrictedDb = this.createRestrictedDatabaseClient();
    const restrictedCache = this.createRestrictedCacheClient();
    const restrictedStorage = this.createRestrictedStorageClient();

    return {
      ...this.context,
      http: restrictedHttp,
      db: restrictedDb,
      cache: restrictedCache,
      storage: restrictedStorage,
    };
  }

  /**
   * Create restricted HTTP client with domain whitelist
   */
  private createRestrictedHttpClient(allowedDomains: string[]) {
    return {
      get: async (url: string, options?: RequestInit) => {
        if (allowedDomains.length > 0 && !this.isDomainAllowed(url, allowedDomains)) {
          throw new Error(`Domain not allowed: ${new URL(url).hostname}`);
        }
        return fetch(url, options);
      },
      post: async (url: string, data?: any, options?: RequestInit) => {
        if (allowedDomains.length > 0 && !this.isDomainAllowed(url, allowedDomains)) {
          throw new Error(`Domain not allowed: ${new URL(url).hostname}`);
        }
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          ...options,
        });
      },
      put: async (url: string, data?: any, options?: RequestInit) => {
        if (allowedDomains.length > 0 && !this.isDomainAllowed(url, allowedDomains)) {
          throw new Error(`Domain not allowed: ${new URL(url).hostname}`);
        }
        return fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          ...options,
        });
      },
      delete: async (url: string, options?: RequestInit) => {
        if (allowedDomains.length > 0 && !this.isDomainAllowed(url, allowedDomains)) {
          throw new Error(`Domain not allowed: ${new URL(url).hostname}`);
        }
        return fetch(url, {
          method: 'DELETE',
          ...options,
        });
      },
    };
  }

  /**
   * Create restricted database client with tenant isolation
   */
  private createRestrictedDatabaseClient() {
    return {
      query: async (sql: string, params?: any[]) => {
        // Ensure tenant_id is included in queries for security
        if (!sql.includes('tenant_id') && !sql.toLowerCase().includes('schema_migrations')) {
          this.context.logger.warn('Query without tenant_id filter detected', { sql });
        }
        
        // Add tenant_id filter automatically for security
        const modifiedSql = this.addTenantFilter(sql);
        return this.context.db.query(modifiedSql, params);
      },
      one: async (sql: string, params?: any[]) => {
        const modifiedSql = this.addTenantFilter(sql);
        return this.context.db.one(modifiedSql, params);
      },
      transaction: async (callback: (db: any) => Promise<any>) => {
        return this.context.db.transaction(callback);
      },
    };
  }

  /**
   * Create restricted cache client with tenant prefixing
   */
  private createRestrictedCacheClient() {
    const tenantPrefix = `tenant:${this.context.tenant.id}:plugin:${this.context.plugin.slug}:`;
    
    return {
      get: async (key: string) => {
        return this.context.cache.get(tenantPrefix + key);
      },
      set: async (key: string, value: any, ttl?: number) => {
        return this.context.cache.set(tenantPrefix + key, value, ttl);
      },
      delete: async (key: string) => {
        return this.context.cache.delete(tenantPrefix + key);
      },
      clear: async () => {
        // Only clear plugin-specific keys for this tenant
        // This would need implementation based on the cache backend
        return this.context.cache.clear();
      },
    };
  }

  /**
   * Create restricted storage client with tenant prefixing
   */
  private createRestrictedStorageClient() {
    const tenantPrefix = `tenant-${this.context.tenant.id}/plugin-${this.context.plugin.slug}/`;
    
    return {
      upload: async (key: string, data: ArrayBuffer | ReadableStream, metadata?: Record<string, string>) => {
        return this.context.storage.upload(tenantPrefix + key, data, metadata);
      },
      download: async (key: string) => {
        return this.context.storage.download(tenantPrefix + key);
      },
      delete: async (key: string) => {
        return this.context.storage.delete(tenantPrefix + key);
      },
      list: async (prefix?: string) => {
        return this.context.storage.list(tenantPrefix + (prefix || ''));
      },
    };
  }

  /**
   * Check if a domain is allowed
   */
  private isDomainAllowed(url: string, allowedDomains: string[]): boolean {
    try {
      const hostname = new URL(url).hostname;
      return allowedDomains.some(domain => {
        if (domain.startsWith('*.')) {
          return hostname.endsWith(domain.slice(1));
        }
        return hostname === domain;
      });
    } catch {
      return false;
    }
  }

  /**
   * Add tenant filter to SQL queries for security
   */
  private addTenantFilter(sql: string): string {
    // This is a simplified implementation
    // In production, you'd want a more sophisticated SQL parser
    const lowerSql = sql.toLowerCase();
    
    // Skip if already has tenant filter or is a system query
    if (
      lowerSql.includes('tenant_id') ||
      lowerSql.includes('schema_migrations') ||
      lowerSql.includes('information_schema')
    ) {
      return sql;
    }

    // Add tenant_id WHERE clause for SELECT queries
    if (lowerSql.trim().startsWith('select') && !lowerSql.includes('where')) {
      return sql + ` WHERE tenant_id = '${this.context.tenant.id}'`;
    }

    return sql;
  }

  /**
   * Get memory usage (placeholder - actual implementation would depend on runtime)
   */
  private getMemoryUsage(): number {
    // In a real implementation, this would query the runtime for memory usage
    return Math.random() * this.config.memoryLimitMB;
  }
}