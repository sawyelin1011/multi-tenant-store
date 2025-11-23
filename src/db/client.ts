import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

const databasePath = process.env.SQLITE_DB || 'db.sqlite';
const sqlite = new Database(databasePath);
export const db = drizzle(sqlite, { schema });

export default db;
