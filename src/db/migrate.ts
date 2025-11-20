import fs from 'fs';
import path from 'path';
import { db } from '../config/database.js';

const migrationsDir = path.join(process.cwd(), 'src/db/migrations');

async function getMigrations() {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  return files;
}

async function getExecutedMigrations() {
  try {
    const result = await db.query('SELECT version, name FROM schema_migrations ORDER BY version');
    return result.map((r: any) => ({ version: r.version, name: r.name }));
  } catch (error) {
    return [];
  }
}

async function executeMigration(version: number, name: string, sql: string) {
  try {
    await db.none('BEGIN');
    await db.none(sql);
    await db.none('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [version, name]);
    await db.none('COMMIT');
    console.log(`✓ Migration ${version}: ${name}`);
  } catch (error) {
    await db.none('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function rollbackMigration(version: number, name: string) {
  try {
    await db.none('DELETE FROM schema_migrations WHERE version = $1', [version]);
    console.log(`✓ Rolled back migration ${version}: ${name}`);
  } catch (error) {
    console.error(`✗ Failed to rollback ${version}: ${name}`, error);
    throw error;
  }
}

async function up() {
  const migrations = await getMigrations();
  const executed = await getExecutedMigrations();
  const executedVersions = new Set(executed.map((m: { version: number; name: string }) => m.version));

  for (const file of migrations) {
    const version = parseInt(file.split('_')[0], 10);
    if (!executedVersions.has(version)) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await executeMigration(version, file.replace('.sql', ''), sql);
    }
  }
}

async function down() {
  const executed = await getExecutedMigrations();
  if (executed.length > 0) {
    const last = executed[executed.length - 1];
    await rollbackMigration(last.version, last.name);
  }
}

async function main() {
  const command = process.argv[2] || 'up';
  try {
    if (command === 'up') {
      await up();
    } else if (command === 'down') {
      await down();
    } else {
      console.log('Unknown command:', command);
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await db.$pool.end();
  }
}

main();
