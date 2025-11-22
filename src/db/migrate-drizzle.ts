import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDrizzleMigrations(): Promise<void> {
  try {
    console.log('🔄 Running Drizzle migrations...');
    
    const migrationsFolder = path.join(__dirname, '../../drizzle');
    
    await migrate(db, { migrationsFolder });
    
    console.log('✅ Drizzle migrations completed');
  } catch (error) {
    console.error('❌ Drizzle migration failed:', error);
    throw error;
  }
}

export default runDrizzleMigrations;
