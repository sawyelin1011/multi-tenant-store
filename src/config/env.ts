import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET,
  tenantJwtSecret: process.env.TENANT_JWT_SECRET,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  pluginDir: process.env.PLUGIN_DIR || './plugins',
  fileUploadDir: process.env.FILE_UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10),
  redisUrl: process.env.REDIS_URL,
};

export default config;
