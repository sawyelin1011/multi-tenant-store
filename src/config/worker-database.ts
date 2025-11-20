import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/workers-types';
import * as schema from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

export type WorkerDB = DrizzleD1Database<typeof schema>;

let dbInstance: WorkerDB | null = null;

/**
 * Initialize Drizzle with Cloudflare D1 binding
 */
export function initWorkerDb(d1: D1Database): WorkerDB {
  if (!dbInstance) {
    dbInstance = drizzle(d1, { schema });
  }
  return dbInstance;
}

export function getWorkerDb(): WorkerDB {
  if (!dbInstance) {
    throw new Error('Worker database not initialized. Call initWorkerDb first.');
  }
  return dbInstance;
}

/**
 * Tenant-scoped query helper for enforcing row-level isolation in Workers
 */
export function withWorkerTenantId(tenantId: string) {
  const db = getWorkerDb();

  return {
    query: db,
    tenantId,

    filterByTenant: (whereClause: any) => {
      if (whereClause) {
        return and(eq(schema.tenants.id, tenantId), whereClause);
      }
      return eq(schema.tenants.id, tenantId);
    },
  };
}

export default getWorkerDb;
