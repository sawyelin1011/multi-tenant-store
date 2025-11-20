import dotenv from 'dotenv';
import { brand } from '@mtc-platform/config';

// Load environment variables from .env.local for local development
dotenv.config({ path: '.env.local' });
// Fallback to .env for other environments
dotenv.config();

// Runtime detection
export const isCloudflareWorker = typeof globalThis !== 'undefined' && 
  (globalThis as any).Request && 
  (globalThis as any).Response;

export const runtime = isCloudflareWorker ? 'worker' : 'node';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET,
  tenantJwtSecret: process.env.TENANT_JWT_SECRET,
  superAdminApiKey: process.env.SUPER_ADMIN_API_KEY || 'sk_test_anyvaluedemo',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'admin@platform.example.com',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  pluginDir: process.env.PLUGIN_DIR || './plugins',
  fileUploadDir: process.env.FILE_UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10),
  redisUrl: process.env.REDIS_URL,
  runtime,
  isCloudflareWorker,
  brand,
};

export default config;
