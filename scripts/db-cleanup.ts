import { fileURLToPath } from 'url';
import { config } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);

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

async function cleanupDuplicateIndexes() {
  console.log('🧹 Cleaning up duplicate indexes...\n');

  const adapter = await createAdapter();
  
  try {
    if (config.dbType === 'sqlite') {
      // SQLite: List all indexes
      const indexes = await adapter.query(
        "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      );
      
      console.log(`Found ${indexes.length} indexes in SQLite database`);
      
      // Group indexes by name to find duplicates
      const indexMap = new Map();
      for (const idx of indexes) {
        if (!indexMap.has(idx.name)) {
          indexMap.set(idx.name, []);
        }
        indexMap.get(idx.name).push(idx);
      }
      
      let droppedCount = 0;
      for (const [indexName, indexList] of indexMap.entries()) {
        if (indexList.length > 1) {
          console.log(`⚠️  Found duplicate indexes: ${indexName} (${indexList.length} total)`);
          // Keep first, drop others
          for (let i = 1; i < indexList.length; i++) {
            try {
              console.log(`  Dropping: ${indexName}`);
              await adapter.run(`DROP INDEX IF EXISTS ${indexName}`);
              droppedCount++;
            } catch (error) {
              console.error(`  Failed to drop ${indexName}:`, error);
            }
          }
        }
      }
      
      if (droppedCount > 0) {
        console.log(`\n✓ Dropped ${droppedCount} duplicate index(es)`);
      } else {
        console.log('\n✓ No duplicate indexes found');
      }
    } else {
      // PostgreSQL: List all indexes
      const indexes = await adapter.query(`
        SELECT i.indexname, t.tablename 
        FROM pg_indexes i
        JOIN pg_tables t ON i.tablename = t.tablename
        WHERE t.schemaname = 'public'
        ORDER BY i.indexname
      `);
      
      console.log(`Found ${indexes.length} indexes in PostgreSQL database`);
      
      // Group indexes by name to find duplicates
      const indexMap = new Map();
      for (const idx of indexes) {
        if (!indexMap.has(idx.indexname)) {
          indexMap.set(idx.indexname, []);
        }
        indexMap.get(idx.indexname).push(idx);
      }
      
      let droppedCount = 0;
      for (const [indexName, indexList] of indexMap.entries()) {
        if (indexList.length > 1) {
          console.log(`⚠️  Found duplicate indexes: ${indexName} (${indexList.length} total)`);
          // Keep first, drop others
          for (let i = 1; i < indexList.length; i++) {
            try {
              console.log(`  Dropping: ${indexName}`);
              await adapter.run(`DROP INDEX IF EXISTS ${indexName} CASCADE`);
              droppedCount++;
            } catch (error) {
              console.error(`  Failed to drop ${indexName}:`, error);
            }
          }
        }
      }
      
      if (droppedCount > 0) {
        console.log(`\n✓ Dropped ${droppedCount} duplicate index(es)`);
      } else {
        console.log('\n✓ No duplicate indexes found');
      }
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await adapter.close();
  }
}

async function main() {
  try {
    await cleanupDuplicateIndexes();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
