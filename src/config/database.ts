import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise();

const db = pgp({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/digital_commerce',
  max: 30,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export { db, pgp };
