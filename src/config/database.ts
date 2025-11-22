import pgPromise from 'pg-promise';
import sqlite from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const dbType = process.env.DB_TYPE || 'postgres';

let db: any;
let pgp: any;

if (dbType === 'sqlite') {
  // SQLite configuration
  const sqliteDb = new sqlite(process.env.DB_PATH || './local.db');
  sqliteDb.pragma('journal_mode = WAL');
  
  // Create a simple wrapper that matches pg-promise API
  db = {
    one: (query: string, params?: any[]) => {
      const stmt = sqliteDb.prepare(query);
      const result = stmt.get(params || []);
      return result;
    },
    oneOrNone: (query: string, params?: any[]) => {
      const stmt = sqliteDb.prepare(query);
      const result = stmt.get(params || []);
      return result || null;
    },
    many: (query: string, params?: any[]) => {
      const stmt = sqliteDb.prepare(query);
      const result = stmt.all(params || []);
      return result;
    },
    manyOrNone: (query: string, params?: any[]) => {
      const stmt = sqliteDb.prepare(query);
      const result = stmt.all(params || []);
      return result || [];
    },
    none: (query: string, params?: any[]) => {
      const stmt = sqliteDb.prepare(query);
      stmt.run(params || []);
      return;
    },
    result: (query: string, params?: any[]) => {
      const stmt = sqliteDb.prepare(query);
      const result = stmt.run(params || []);
      return { rowCount: result.changes };
    },
    $pool: {
      end: () => {
        sqliteDb.close();
      }
    }
  };
} else {
  // PostgreSQL configuration
  pgp = pgPromise();
  db = pgp({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/digital_commerce',
    max: 30,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

export { db, pgp };
