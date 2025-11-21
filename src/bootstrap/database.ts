import { config } from '../config/env.js';
import { runMigrations } from '../db/migrate.js';

export async function bootstrapDatabase(): Promise<boolean> {
  if (!config.dbAutoMigrate) {
    console.log('⚠️  Auto-migration disabled (DB_AUTO_MIGRATE=false)');
    return false;
  }

  try {
    console.log('🔄 Running database migrations...');
    await runMigrations();
    return true;
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    console.error('⚠️  Application will continue but may not function correctly');
    console.error('💡 Run: npm run db:migrate:up');
    return false;
  }
}

export default bootstrapDatabase;
