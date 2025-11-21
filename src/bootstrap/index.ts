import { bootstrapDatabase } from './database.js';
import { initSuperAdmin } from './init-super-admin.js';

export async function bootstrap(): Promise<void> {
  console.log('🚀 Bootstrapping application...\n');
  
  // Step 1: Run database migrations
  const migrationsRan = await bootstrapDatabase();
  
  // Step 2: Initialize super admin (only if migrations ran or auto-migrate is disabled)
  if (migrationsRan || !process.env.DB_AUTO_MIGRATE) {
    await initSuperAdmin();
  }
  
  console.log('\n✅ Bootstrap complete\n');
}

export default bootstrap;
