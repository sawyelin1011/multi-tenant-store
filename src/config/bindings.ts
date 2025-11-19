import { Bindings } from '../types/bindings.js';

let bindingsInstance: Bindings | null = null;

export function setBindings(bindings: Bindings) {
  bindingsInstance = bindings;
}

export function getBindings(): Bindings {
  if (!bindingsInstance) {
    throw new Error('Bindings not initialized. Call setBindings first.');
  }
  return bindingsInstance;
}

export function createWorkerConfig(bindings: Bindings) {
  return {
    nodeEnv: bindings.NODE_ENV || 'production',
    adminJwtSecret: bindings.ADMIN_JWT_SECRET,
    tenantJwtSecret: bindings.TENANT_JWT_SECRET,
    bcryptRounds: parseInt(bindings.BCRYPT_ROUNDS || '10', 10),
    pluginDir: bindings.PLUGIN_DIR || './plugins',
    maxFileSize: parseInt(bindings.MAX_FILE_SIZE || '104857600', 10),
  };
}
