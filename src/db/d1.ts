export interface CloudflareEnv {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  UPLOADS: R2Bucket;
  ENVIRONMENT?: string;
  LOG_LEVEL?: string;
  [key: string]: any;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch(queries: D1PreparedStatement[]): Promise<any[]>;
}

export interface D1PreparedStatement {
  bind(...args: any[]): D1PreparedStatement;
  first(column?: string): Promise<any>;
  all(): Promise<D1Result>;
  run(): Promise<D1Result>;
}

export interface D1Result {
  success: boolean;
  results?: any[];
  meta: {
    duration: number;
    served_by?: string;
    internal_stats?: string;
  };
}

export interface D1ExecResult {
  success: boolean;
  count?: number;
}

export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
  put(key: string, value: any, options?: { expirationTtl?: number; metadata?: Record<string, string> }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string }>; list_complete: boolean; cursor?: string }>;
}

export interface R2Bucket {
  put(key: string, data: ArrayBuffer | ReadableStream, options?: { customMetadata?: Record<string, string> }): Promise<R2Object>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ objects: R2Object[]; delimited_prefixes?: string[]; cursor?: string; truncated: boolean }>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    expires?: string;
  };
  customMetadata?: Record<string, string>;
  version: string;
  checksums?: {
    md5?: string;
    sha1?: string;
    sha256?: string;
    sha384?: string;
    sha512?: string;
  };
}

export class D1Client {
  constructor(private db: D1Database) {}

  async query<T = any>(sql: string, params: any[] = []): Promise<{ results: T[] }> {
    try {
      const stmt = this.db.prepare(sql);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await bound.all();
      return {
        results: (result.results || []) as T[],
      };
    } catch (error: any) {
      console.error('D1 query error:', { sql, params, error: error.message });
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<D1Result> {
    try {
      const stmt = this.db.prepare(sql);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      return await bound.run();
    } catch (error: any) {
      console.error('D1 execute error:', { sql, params, error: error.message });
      throw error;
    }
  }

  async first<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      const stmt = this.db.prepare(sql);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      return (await bound.first()) as T | null;
    } catch (error: any) {
      console.error('D1 first error:', { sql, params, error: error.message });
      throw error;
    }
  }

  async batch(statements: Array<{ sql: string; params?: any[] }>) {
    try {
      const prepared = statements.map(({ sql, params = [] }) => {
        const stmt = this.db.prepare(sql);
        return params.length > 0 ? stmt.bind(...params) : stmt;
      });
      return await this.db.batch(prepared);
    } catch (error: any) {
      console.error('D1 batch error:', error.message);
      throw error;
    }
  }
}
