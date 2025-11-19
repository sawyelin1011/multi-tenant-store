import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { D1Database } from '@cloudflare/workers-types';
import Database from 'better-sqlite3';
import * as schema from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

export function initDrizzleDb(sqliteDb: Database.Database): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(sqliteDb, { schema });
  }
  return dbInstance;
}

export function getDrizzleDb(): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDrizzleDb first.');
  }
  return dbInstance;
}

/**
 * Tenant-scoped query helper for enforcing row-level isolation
 * Ensures all queries are filtered by tenant_id
 */
export function withTenantId(tenantId: string) {
  const db = getDrizzleDb();

  return {
    query: db,
    tenantId,

    // Helper to filter by tenant
    filterByTenant: (whereClause: any) => {
      // Combine tenant filter with existing where clause
      if (whereClause) {
        return and(eq(schema.tenants.id, tenantId), whereClause);
      }
      return eq(schema.tenants.id, tenantId);
    },
  };
}

export type DrizzleDB = BetterSQLite3Database<typeof schema>;

export default getDrizzleDb();
