import { nanoid } from 'nanoid';
import { db } from './client.js';
import { order_items, orders, products, stores, tenants, users } from './schema.js';

export function seed() {
  console.log('🌱 Seeding database...');

  try {
    const existingUser = db.select().from(users).limit(1).all();
    if (existingUser.length > 0) {
      console.log('✅ Database already seeded');
      return;
    }

    const adminId = 'admin-1';
    const tenantId = nanoid();
    const storeId = nanoid();
    const userId = 'user-1';

    db.insert(users)
      .values({
        id: adminId,
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@platform.local',
        api_key: process.env.SUPER_ADMIN_API_KEY || 'sk_test_admin123456',
        role: 'admin',
      })
      .run();

    db.insert(users)
      .values({
        id: userId,
        email: 'customer@test.local',
        role: 'customer',
      })
      .run();

    db.insert(tenants)
      .values({
        id: tenantId,
        name: 'Test Tenant',
        slug: 'test-tenant',
      })
      .run();

    db.insert(stores)
      .values({
        id: storeId,
        tenant_id: tenantId,
        name: 'Test Store',
        type: 'digital',
      })
      .run();

    const prod1Id = nanoid();
    const prod2Id = nanoid();

    db.insert(products)
      .values([
        {
          id: prod1Id,
          store_id: storeId,
          name: 'Digital Product 1',
          sku: 'PROD-001',
          price: 99.99,
          description: 'Test digital product',
          type: 'digital',
        },
        {
          id: prod2Id,
          store_id: storeId,
          name: 'Digital Product 2',
          sku: 'PROD-002',
          price: 199.99,
          description: 'Premium product',
          type: 'digital',
        },
      ])
      .run();

    const orderId = nanoid();

    db.insert(orders)
      .values({
        id: orderId,
        store_id: storeId,
        user_id: userId,
        total: 299.98,
        status: 'completed',
      })
      .run();

    db.insert(order_items)
      .values([
        {
          id: nanoid(),
          order_id: orderId,
          product_id: prod1Id,
          quantity: 1,
          price: 99.99,
        },
        {
          id: nanoid(),
          order_id: orderId,
          product_id: prod2Id,
          quantity: 1,
          price: 199.99,
        },
      ])
      .run();

    console.log('✅ Seed complete');
    console.log(`  - Admin user: ${process.env.SUPER_ADMIN_EMAIL || 'admin@platform.local'}`);
    console.log(`  - API key: ${process.env.SUPER_ADMIN_API_KEY || 'sk_test_admin123456'}`);
    console.log(`  - Test tenant: ${tenantId}`);
    console.log(`  - Test store: ${storeId}`);
    console.log('  - Test products: 2');
    console.log('  - Test orders: 1');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}
