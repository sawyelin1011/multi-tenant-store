import path from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client.js';

export function runMigrations() {
  console.log('🔄 Running migrations...');
  try {
    migrate(db, {
      migrationsFolder: path.join(process.cwd(), 'drizzle'),
    });
    console.log('✅ Migrations complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
