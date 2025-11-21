import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

// Database interface for both PostgreSQL and SQLite
interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

class PostgresAdapter implements DatabaseAdapter {
  private db: any;

  async init() {
    // Import pg-promise dynamically
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
    // Import better-sqlite3 dynamically
    const Database = (await import('better-sqlite3')).default;
    this.db = new Database(config.dbPath);
    
    // Enable foreign keys
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

// Convert PostgreSQL syntax to SQLite if needed
function adaptSqlForDatabase(sql: string, dbType: string): string {
  if (dbType === 'sqlite') {
    return sql
      // Remove UUID DEFAULT expressions first - SQLite can't handle complex DEFAULT
      .replace(/\s+DEFAULT\s+gen_random_uuid\(\)/gi, '')
      // Replace UUID type with TEXT in SQLite - be more specific
      .replace(/(\s+)UUID(\s+)/gi, '$1TEXT$2')
      .replace(/(\s+)UUID,/gi, '$1TEXT,')
      .replace(/\(UUID\s/gi, '(TEXT ')
      // Replace TIMESTAMP with DATETIME
      .replace(/(\s+)TIMESTAMP(\s+)/gi, '$1DATETIME$2')
      .replace(/(\s+)TIMESTAMP,/gi, '$1DATETIME,')
      .replace(/CURRENT_TIMESTAMP/g, "(datetime('now'))")
      // Replace JSONB with TEXT
      .replace(/(\s+)JSONB(\s+)/gi, '$1TEXT$2')
      .replace(/(\s+)JSONB,/gi, '$1TEXT,')
      .replace(/(\s+)JSONB\)/gi, '$1TEXT)')
      // Replace BIGINT with INTEGER
      .replace(/(\s+)BIGINT(\s+)/gi, '$1INTEGER$2')
      .replace(/(\s+)BIGINT,/gi, '$1INTEGER,')
      // Replace DECIMAL with REAL
      .replace(/DECIMAL\([^)]+\)/g, 'REAL')
      // BOOLEAN type in SQLite is INTEGER (0 or 1)
      .replace(/(\s+)BOOLEAN(\s+)/gi, '$1INTEGER$2')
      // Replace boolean values in DEFAULT clauses
      .replace(/DEFAULT\s+true/gi, 'DEFAULT 1')
      .replace(/DEFAULT\s+false/gi, 'DEFAULT 0')
      // VARCHAR can stay in SQLite
      ;
  }
  return sql;
}

async function ensureMigrationsTable(adapter: DatabaseAdapter) {
  const createTableSql = config.dbType === 'sqlite'
    ? `CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT (datetime('now'))
      )`
    : `CREATE TABLE IF NOT EXISTS schema_migrations (
        version BIGINT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
  
  await adapter.run(createTableSql);
}

async function getMigrations(): Promise<string[]> {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return files;
}

async function getExecutedMigrations(adapter: DatabaseAdapter): Promise<Array<{ version: number; name: string }>> {
  const results = await adapter.query('SELECT version, name FROM schema_migrations ORDER BY version');
  return results.map((r: any) => ({ version: Number(r.version), name: r.name }));
}

async function executeMigration(adapter: DatabaseAdapter, version: number, name: string, sql: string) {
  try {
    // Adapt SQL for the target database
    const adaptedSql = adaptSqlForDatabase(sql, config.dbType);
    
    if (config.dbType === 'postgres') {
      await adapter.run('BEGIN');
      await adapter.run(adaptedSql);
      await adapter.run('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [version, name]);
      await adapter.run('COMMIT');
    } else {
      // SQLite handles transactions differently
      await adapter.run('BEGIN TRANSACTION');
      // Split SQL into individual statements for SQLite
      const statements = adaptedSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        // Remove SQL comments (-- style)
        .map(s => s.replace(/--.*$/gm, '').trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        if (process.env.DEBUG_SQL) {
          console.log('Executing SQL:', statement);
        }
        try {
          await adapter.run(statement);
        } catch (stmtError) {
          const errorMsg = String(stmtError).toLowerCase();
          // Gracefully handle "already exists" errors for idempotent operations
          if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
            if (process.env.DEBUG_SQL) {
              console.log(`⚠️  Statement skipped (already exists): ${statement.substring(0, 50)}...`);
            }
            // Continue execution - this is okay for idempotent CREATE IF NOT EXISTS
          } else {
            throw stmtError;
          }
        }
      }
      await adapter.run('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [version, name]);
      await adapter.run('COMMIT');
    }
    
    console.log(`✓ Migration ${version}: ${name}`);
  } catch (error) {
    try {
      await adapter.run('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    throw error;
  }
}

async function rollbackMigration(adapter: DatabaseAdapter, version: number, name: string) {
  try {
    const sql = config.dbType === 'postgres'
      ? 'DELETE FROM schema_migrations WHERE version = $1'
      : 'DELETE FROM schema_migrations WHERE version = ?';
    await adapter.run(sql, [version]);
    console.log(`✓ Rolled back migration ${version}: ${name}`);
  } catch (error) {
    console.error(`✗ Failed to rollback ${version}: ${name}`, error);
    throw error;
  }
}

export async function runMigrations(adapter?: DatabaseAdapter): Promise<void> {
  const ownAdapter = !adapter;
  const db = adapter || await createAdapter();
  
  try {
    await ensureMigrationsTable(db);
    
    const migrations = await getMigrations();
    const executed = await getExecutedMigrations(db);
    const executedVersions = new Set(executed.map((m) => m.version));

    let ranCount = 0;
    let skippedCount = 0;
    
    for (const file of migrations) {
      const version = parseInt(file.split('_')[0], 10);
      if (!executedVersions.has(version)) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await executeMigration(db, version, file.replace('.sql', ''), sql);
        ranCount++;
      } else {
        skippedCount++;
        if (process.env.VERBOSE_MIGRATIONS) {
          console.log(`⊘ Migration ${version}: ${file} (already executed)`);
        }
      }
    }
    
    if (ranCount === 0 && skippedCount > 0) {
      console.log(`✓ All migrations already executed (${skippedCount} skipped)`);
    } else if (ranCount > 0) {
      console.log(`✓ Ran ${ranCount} migration(s)${skippedCount > 0 ? ` (${skippedCount} already executed)` : ''}`);
    } else {
      console.log('✓ No pending migrations');
    }
  } finally {
    if (ownAdapter) {
      await db.close();
    }
  }
}

async function down() {
  const adapter = await createAdapter();
  try {
    await ensureMigrationsTable(adapter);
    const executed = await getExecutedMigrations(adapter);
    if (executed.length > 0) {
      const last = executed[executed.length - 1];
      await rollbackMigration(adapter, last.version, last.name);
    } else {
      console.log('No migrations to rollback');
    }
  } finally {
    await adapter.close();
  }
}

async function status() {
  const adapter = await createAdapter();
  try {
    await ensureMigrationsTable(adapter);
    const migrations = await getMigrations();
    const executed = await getExecutedMigrations(adapter);
    const executedVersions = new Map(executed.map((m) => [m.version, m]));
    
    console.log('\nMigration Status:\n');
    console.log(`Database Type: ${config.dbType}`);
    console.log(`Total Migrations: ${migrations.length}`);
    console.log(`Executed: ${executed.length}`);
    console.log(`Pending: ${migrations.length - executed.length}\n`);
    
    for (const file of migrations) {
      const version = parseInt(file.split('_')[0], 10);
      const executedMigration = executedVersions.get(version);
      
      if (executedMigration) {
        console.log(`✓ ${file} (executed)`);
      } else {
        console.log(`○ ${file} (pending)`);
      }
    }
    console.log();
  } finally {
    await adapter.close();
  }
}

async function main() {
  const command = process.argv[2] || 'up';
  try {
    if (command === 'up') {
      await runMigrations();
    } else if (command === 'down') {
      await down();
    } else if (command === 'status') {
      await status();
    } else {
      console.log('Unknown command:', command);
      console.log('Available commands: up, down, status');
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
