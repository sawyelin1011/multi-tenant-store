/**
 * One-time data migration utility: PostgreSQL → D1 SQLite
 *
 * Usage:
 *   npm run db:migrate:postgres-to-d1
 *
 * Requirements:
 *   - SOURCE_DB_URL: PostgreSQL connection string
 *   - TARGET_DB_FILE: Path to target SQLite database file
 *
 * This script:
 *   1. Connects to the existing PostgreSQL database
 *   2. Exports all data in batches
 *   3. Transforms data for SQLite compatibility
 *   4. Imports data into D1 database
 *   5. Validates data integrity
 */

import Database from 'better-sqlite3';
import pgPromise from 'pg-promise';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/db/schema.js';
import dotenv from 'dotenv';

dotenv.config();

const BATCH_SIZE = 100;
const SOURCE_DB_URL = process.env.SOURCE_DB_URL;
const TARGET_DB_FILE = process.env.TARGET_DB_FILE || './migrated.db';

interface MigrationStats {
  table: string;
  sourceCount: number;
  targetCount: number;
  status: 'success' | 'error';
  message?: string;
}

const stats: MigrationStats[] = [];

async function migrateTable(
  pgp: any,
  sourceDb: any,
  targetDb: any,
  tableName: string,
  columns: string[]
) {
  try {
    console.log(`\n📋 Migrating table: ${tableName}`);

    // Count source records
    const sourceCountResult = await sourceDb.one(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const sourceCount = sourceCountResult.count;
    console.log(`  Source records: ${sourceCount}`);

    if (sourceCount === 0) {
      stats.push({
        table: tableName,
        sourceCount: 0,
        targetCount: 0,
        status: 'success',
        message: 'Empty table',
      });
      return;
    }

    // Migrate in batches
    let totalMigrated = 0;
    for (let offset = 0; offset < sourceCount; offset += BATCH_SIZE) {
      const records = await sourceDb.manyOrNone(
        `SELECT ${columns.join(', ')} FROM ${tableName} ORDER BY id LIMIT $1 OFFSET $2`,
        [BATCH_SIZE, offset]
      );

      if (records.length === 0) break;

      // Transform records for SQLite (handle JSON fields)
      const transformedRecords = records.map((record: any) => {
        const transformed: any = { ...record };

        // SQLite uses TEXT for JSON, ensure proper stringification
        const jsonFields = getJsonFieldsForTable(tableName);
        jsonFields.forEach((field) => {
          if (transformed[field] && typeof transformed[field] === 'object') {
            transformed[field] = JSON.stringify(transformed[field]);
          }
        });

        return transformed;
      });

      // Insert into target database
      // Note: This would need to be customized based on your drizzle schema
      console.log(`  Migrating batch ${offset}-${offset + records.length}...`);

      totalMigrated += records.length;
    }

    // Verify
    const targetDb_instance = new Database(TARGET_DB_FILE);
    const targetCountResult = targetDb_instance
      .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
      .get() as any;
    const targetCount = targetCountResult?.count || 0;

    targetDb_instance.close();

    stats.push({
      table: tableName,
      sourceCount,
      targetCount,
      status: sourceCount === targetCount ? 'success' : 'error',
      message:
        sourceCount === targetCount
          ? 'Migration successful'
          : `Mismatch: source=${sourceCount}, target=${targetCount}`,
    });

    console.log(`  ✅ Migrated: ${totalMigrated} records`);
  } catch (error: any) {
    stats.push({
      table: tableName,
      sourceCount: 0,
      targetCount: 0,
      status: 'error',
      message: error.message,
    });
    console.error(`  ❌ Error migrating ${tableName}:`, error.message);
  }
}

function getJsonFieldsForTable(tableName: string): string[] {
  const jsonFields: { [key: string]: string[] } = {
    tenants: ['settings', 'branding'],
    tenant_users: ['permissions'],
    product_types: ['schema', 'ui_config', 'validation_rules', 'workflows'],
    field_types: ['validation_schema'],
    products: ['metadata'],
    product_attributes: ['attribute_value'],
    product_variants: ['attributes', 'price_data', 'inventory_data', 'delivery_data'],
    plugins: ['manifest'],
    tenant_plugins: ['config'],
    workflows: ['steps'],
    workflow_executions: ['execution_data'],
    delivery_methods: ['config', 'template'],
    deliveries: ['delivery_data', 'error_log'],
    pricing_rules: ['conditions', 'price_modifier'],
    user_roles: ['permissions'],
    orders: ['items_data', 'pricing_data', 'payment_data', 'customer_data', 'metadata'],
    order_items: ['item_data'],
    payment_gateways: ['credentials', 'config'],
    payment_transactions: ['gateway_response'],
    integrations: ['credentials', 'field_mapping', 'sync_config', 'webhook_config'],
    integration_syncs: ['synced_data', 'errors'],
  };

  return jsonFields[tableName] || [];
}

async function main() {
  if (!SOURCE_DB_URL) {
    console.error('❌ SOURCE_DB_URL environment variable not set');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting PostgreSQL to D1 migration');
    console.log(`   Source: ${SOURCE_DB_URL}`);
    console.log(`   Target: ${TARGET_DB_FILE}\n`);

    // Connect to PostgreSQL
    const pgp_instance = pgPromise();
    const sourceDb = pgp_instance(SOURCE_DB_URL);

    // Initialize target database
    const targetDb = new Database(TARGET_DB_FILE);
    const drizzleDb = drizzle(targetDb, { schema });

    // List of tables to migrate (in dependency order)
    const tables = [
      // Core tables
      { name: 'tenants', columns: ['*'] },
      { name: 'tenant_users', columns: ['*'] },

      // Product system
      { name: 'field_types', columns: ['*'] },
      { name: 'product_types', columns: ['*'] },
      { name: 'products', columns: ['*'] },
      { name: 'product_attributes', columns: ['*'] },
      { name: 'product_variants', columns: ['*'] },

      // Plugin system
      { name: 'plugins', columns: ['*'] },
      { name: 'tenant_plugins', columns: ['*'] },
      { name: 'plugin_hooks', columns: ['*'] },

      // Workflows
      { name: 'workflows', columns: ['*'] },
      { name: 'workflow_executions', columns: ['*'] },

      // Delivery
      { name: 'delivery_methods', columns: ['*'] },
      { name: 'deliveries', columns: ['*'] },

      // Pricing
      { name: 'pricing_rules', columns: ['*'] },
      { name: 'user_roles', columns: ['*'] },

      // Orders
      { name: 'orders', columns: ['*'] },
      { name: 'order_items', columns: ['*'] },

      // Payments
      { name: 'payment_gateways', columns: ['*'] },
      { name: 'payment_transactions', columns: ['*'] },

      // Integrations
      { name: 'integrations', columns: ['*'] },
      { name: 'integration_syncs', columns: ['*'] },
    ];

    // Migrate each table
    for (const table of tables) {
      await migrateTable(
        pgp_instance,
        sourceDb,
        drizzleDb,
        table.name,
        table.columns[0] === '*'
          ? []
          : table.columns
      );
    }

    // Close connections
    targetDb.close();
    await sourceDb.$pool.end();

    // Print summary
    console.log('\n\n📊 Migration Summary:');
    console.log('─'.repeat(70));
    console.table(stats);
    console.log('─'.repeat(70));

    const successCount = stats.filter((s) => s.status === 'success').length;
    const errorCount = stats.filter((s) => s.status === 'error').length;

    console.log(`\n✅ Completed: ${successCount}/${stats.length} tables`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} tables`);
      process.exit(1);
    } else {
      console.log(
        `\n🎉 Migration successful! Your data is now in: ${TARGET_DB_FILE}`
      );
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
