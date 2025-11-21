import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

class PostgresAdapter implements DatabaseAdapter {
  private db: any;

  async init() {
    const pgPromise = (await import('pg-promise')).default;
    const pgp = pgPromise();
    this.db = pgp({
      connectionString: config.databaseUrl || 'postgresql://localhost/digital_commerce',
      max: 30,
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    try {
      return await this.db.query(sql, params);
    } catch (error) {
      return [];
    }
  }

  async run(sql: string, params?: any[]): Promise<void> {
    await this.db.none(sql, params);
  }

  async close(): Promise<void> {
    await this.db.$pool.end();
  }
}

class SQLiteAdapter implements DatabaseAdapter {
  private db: any;

  async init() {
    const Database = (await import('better-sqlite3')).default;
    this.db = new Database(config.dbPath);
    this.db.pragma('foreign_keys = ON');
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    try {
      return this.db.prepare(sql).all(params || []);
    } catch (error) {
      return [];
    }
  }

  async run(sql: string, params?: any[]): Promise<void> {
    this.db.prepare(sql).run(params || []);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

async function createAdapter(): Promise<DatabaseAdapter> {
  const adapter = config.dbType === 'sqlite' ? new SQLiteAdapter() : new PostgresAdapter();
  await (adapter as any).init();
  return adapter;
}

async function resetDatabase() {
  console.log('⚠️  WARNING: This will drop ALL tables and reset the database!');
  console.log('⚠️  This command is for DEVELOPMENT ONLY.\n');

  // Safety check
  if (config.nodeEnv === 'production') {
    console.error('❌ ABORT: Cannot run db:reset in production environment!');
    process.exit(1);
  }

  const adapter = await createAdapter();
  
  try {
    console.log('🗑️  Dropping all tables...');
    
    if (config.dbType === 'sqlite') {
      // Get all table names
      const tables = await adapter.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      
      // Drop each table
      for (const table of tables) {
        console.log(`  Dropping table: ${table.name}`);
        await adapter.run(`DROP TABLE IF EXISTS ${table.name}`);
      }
    } else {
      // PostgreSQL - drop all tables
      const tableQuery = `
        SELECT tablename FROM pg_tables 
        WHERE schemaname != 'pg_catalog' 
        AND schemaname != 'information_schema'
      `;
      const tables = await adapter.query(tableQuery);
      
      for (const table of tables) {
        console.log(`  Dropping table: ${table.tablename}`);
        await adapter.run(`DROP TABLE IF EXISTS ${table.tablename} CASCADE`);
      }
    }
    
    console.log('\n✓ All tables dropped');
    console.log('📦 Database is ready for fresh migrations\n');
    console.log('Next steps:');
    console.log('  1. npm run db:migrate:up    # Run all migrations');
    console.log('  2. npm run dev              # Start development server\n');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await adapter.close();
  }
}

async function main() {
  try {
    await resetDatabase();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
