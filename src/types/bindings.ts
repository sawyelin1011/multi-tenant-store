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

export interface Variables {
  tenantId?: string;
  userId?: string;
  pluginManager?: any;
  tenant?: any;
  [key: string]: any;
}

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
