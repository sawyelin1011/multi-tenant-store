/**
 * Local database migration runner for development
 * Runs Drizzle migrations locally via better-sqlite3
 */
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    const dbPath = process.env.DB_FILE_NAME || './local.db';
    console.log(`📦 Initializing database at: ${dbPath}`);

    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    const migrationsFolder = path.join(__dirname, '../drizzle/migrations');
    console.log(`🔄 Running migrations from: ${migrationsFolder}`);

    await migrate(db, {
      migrationsFolder,
    });

    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
