import { D1Database } from './d1.js';

export async function runD1Migrations(db: D1Database) {
  console.log('🔄 Running D1 migrations...');

  const migrations = [
    // 0001: Create users table
    {
      id: '0001_users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          api_key TEXT UNIQUE,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `,
    },
    // 0002: Create tenants table
    {
      id: '0002_tenants',
      sql: `
        CREATE TABLE IF NOT EXISTS tenants (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          config TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `,
    },
    // 0003: Create stores table
    {
      id: '0003_stores',
      sql: `
        CREATE TABLE IF NOT EXISTS stores (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'digital',
          config TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        );
      `,
    },
    // 0004: Create products table
    {
      id: '0004_products',
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          name TEXT NOT NULL,
          sku TEXT,
          price REAL,
          description TEXT,
          type TEXT DEFAULT 'digital',
          attributes TEXT DEFAULT '{}',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
        );
      `,
    },
    // 0005: Create orders table
    {
      id: '0005_orders',
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          user_id TEXT,
          items TEXT DEFAULT '[]',
          total REAL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `,
    },
    // 0006: Create migrations tracking table
    {
      id: '0006_migrations',
      sql: `
        CREATE TABLE IF NOT EXISTS migrations (
          id TEXT PRIMARY KEY,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `,
    },
  ];

  try {
    for (const migration of migrations) {
      try {
        // Check if migration already ran
        const stmt = db.prepare('SELECT id FROM migrations WHERE id = ?');
        const bound = stmt.bind(migration.id);
        const existing = await bound.first();

        if (existing) {
          console.log(`  ✓ Migration ${migration.id} already applied`);
          continue;
        }

        // Run migration
        await db.exec(migration.sql);

        // Track migration
        const trackStmt = db.prepare('INSERT INTO migrations (id) VALUES (?)');
        const trackBound = trackStmt.bind(migration.id);
        await trackBound.run();

        console.log(`  ✓ Migration ${migration.id} applied`);
      } catch (error: any) {
        console.error(`  ✗ Migration ${migration.id} failed:`, error.message);
        throw error;
      }
    }
    console.log('✅ D1 migrations complete');
  } catch (error) {
    console.error('❌ D1 migration failed:', error);
    throw error;
  }
}
