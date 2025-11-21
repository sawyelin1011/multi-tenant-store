import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema.js';
import { config } from './env.js';

export type PostgresDB = PostgresJsDatabase<typeof schema>;

let dbInstance: PostgresDB | null = null;

/**
 * Initialize Drizzle with PostgreSQL
 */
export function initPostgresDb(): PostgresDB {
  if (!dbInstance) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL not configured in environment');
    }
    
    const client = postgres(config.databaseUrl, {
      max: 30,
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

export function getPostgresDb(): PostgresDB {
  if (!dbInstance) {
    return initPostgresDb();
  }
  return dbInstance;
}

export default getPostgresDb;