import { runMigrations } from '../db/migrate.js';
import { seed } from '../db/seed.js';

export async function bootstrap() {
  console.log('🚀 Bootstrapping application...');

  try {
    runMigrations();
    seed();

    console.log('✅ Bootstrap complete');
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    throw error;
  }
}
