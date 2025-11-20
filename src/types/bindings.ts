import { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';

export interface Bindings {
  [key: string]: any;
  DB: D1Database;
  CACHE: KVNamespace;
  SESSION: KVNamespace;
  ASSETS: R2Bucket;
  ADMIN_JWT_SECRET: string;
  TENANT_JWT_SECRET: string;
  BCRYPT_ROUNDS?: string;
  PLUGIN_DIR?: string;
  MAX_FILE_SIZE?: string;
  NODE_ENV?: string;
}

export interface HonoEnv {
  Bindings: Bindings;
  Variables: {
    tenantId?: string;
    userId?: string;
    pluginManager?: any;
    [key: string]: any;
  };
}
