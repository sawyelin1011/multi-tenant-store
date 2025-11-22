import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default db;
