import { db } from './client.js';
import { users, tenants, products, productTypes } from './schema.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seed(): Promise<void> {
  try {
    // Check if super admin already exists
    const adminExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, process.env.SUPER_ADMIN_EMAIL || 'admin@platform.local'),
    });

    if (adminExists) {
      console.log('✅ Seed data already exists, skipping...');
      return;
    }

    console.log('🌱 Seeding database...');

    const superAdminId = uuidv4();
    const tenantId = uuidv4();
    const productTypeId = uuidv4();
    const userId = uuidv4();

    // Create super admin
    const passwordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'admin123', 10);
    
    await db.insert(users).values({
      id: superAdminId,
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@platform.local',
      password_hash: passwordHash,
      api_key: process.env.SUPER_ADMIN_API_KEY || 'sk_test_realkey123456789',
      role: 'super_admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`  ✓ Created super admin: ${process.env.SUPER_ADMIN_EMAIL || 'admin@platform.local'}`);

    // Create test tenant
    await db.insert(tenants).values({
      id: tenantId,
      slug: 'test-tenant',
      name: 'Test Tenant',
      domain: 'test.example.com',
      subdomain: 'test',
      status: 'active',
      plan: 'basic',
      settings: JSON.stringify({}),
      branding: JSON.stringify({}),
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('  ✓ Created test tenant');

    // Create test product type
    await db.insert(productTypes).values({
      id: productTypeId,
      tenant_id: tenantId,
      name: 'Digital Product',
      slug: 'digital-product',
      schema: JSON.stringify({
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'description', type: 'text' },
          { name: 'price', type: 'number', required: true },
        ]
      }),
      ui_config: JSON.stringify({}),
      validation_rules: JSON.stringify({}),
      workflows: JSON.stringify({}),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('  ✓ Created test product type');

    // Create test products
    await db.insert(products).values([
      {
        id: uuidv4(),
        tenant_id: tenantId,
        product_type_id: productTypeId,
        name: 'Premium Digital Course',
        slug: 'premium-digital-course',
        status: 'active',
        metadata: JSON.stringify({
          description: 'Advanced training course',
          price: 99.99,
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        product_type_id: productTypeId,
        name: 'Budget eBook',
        slug: 'budget-ebook',
        status: 'active',
        metadata: JSON.stringify({
          description: 'Starter guide for beginners',
          price: 29.99,
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    console.log('  ✓ Created test products');

    // Create test customer user
    const customerPasswordHash = await bcrypt.hash('customer123', 10);
    await db.insert(users).values({
      id: userId,
      email: 'customer@test.local',
      password_hash: customerPasswordHash,
      role: 'user',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('  ✓ Created test customer user');

    console.log('✅ Seed complete\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

export default seed;
