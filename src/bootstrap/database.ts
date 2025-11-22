import { config } from '../config/env.js';
import { runDrizzleMigrations } from '../db/migrate-drizzle.js';
import { seed } from '../db/seed.js';

export async function bootstrapDatabase(): Promise<boolean> {
  if (!config.dbAutoMigrate) {
    console.log('⚠️  Auto-migration disabled (DB_AUTO_MIGRATE=false)');
    return false;
  }

  try {
    console.log('🔄 Running database migrations...');
    await runDrizzleMigrations();
    
    // Seed if needed
    console.log('🌱 Checking if seed data needed...');
    await seed();
    
    return true;
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    console.error('⚠️  Application will continue but may not function correctly');
    console.error('💡 Run: npm run db:push');
    return false;
  }
}

export default bootstrapDatabase;
