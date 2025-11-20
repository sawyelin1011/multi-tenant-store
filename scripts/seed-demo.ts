#!/usr/bin/env tsx

import { faker } from '@faker-js/faker';
import { config } from '../src/config/env.js';

interface Tenant {
  slug: string;
  name: string;
  domain?: string;
  subdomain?: string;
  plan?: string;
}

interface ProductType {
  name: string;
  slug: string;
  icon?: string;
  category?: string;
  schema: any;
  ui_config?: any;
}

interface Product {
  name: string;
  slug: string;
  product_type_id: string;
  status: string;
  metadata?: any;
}

interface ProductVariant {
  sku: string;
  attributes: any;
  price_data: any;
  inventory_data: any;
  delivery_data: any;
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = config.superAdminApiKey;

class SeedService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  async createTenant(tenantData: Tenant) {
    console.log(`🏢 Creating tenant: ${tenantData.name}`);
    try {
      const response = await this.makeRequest('/api/admin/tenants', {
        method: 'POST',
        body: JSON.stringify(tenantData),
      });
      console.log(`✅ Created tenant: ${response.data.name} (${response.data.id})`);
      return response.data;
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Tenant already exists: ${tenantData.name}`);
        // Try to get existing tenant
        const tenants = await this.makeRequest('/api/admin/tenants');
        return tenants.data.find((t: any) => t.slug === tenantData.slug);
      }
      throw error;
    }
  }

  async createProductType(tenantSlug: string, productTypeData: ProductType) {
    console.log(`📦 Creating product type: ${productTypeData.name}`);
    try {
      const response = await this.makeRequest(`/api/${tenantSlug}/admin/product-types`, {
        method: 'POST',
        body: JSON.stringify(productTypeData),
      });
      console.log(`✅ Created product type: ${response.data.name} (${response.data.id})`);
      return response.data;
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Product type already exists: ${productTypeData.name}`);
        // Try to get existing product type
        const productTypes = await this.makeRequest(`/api/${tenantSlug}/admin/product-types`);
        return productTypes.data.find((pt: any) => pt.slug === productTypeData.slug);
      }
      throw error;
    }
  }

  async createProduct(tenantSlug: string, productData: Product) {
    console.log(`📚 Creating product: ${productData.name}`);
    try {
      const response = await this.makeRequest(`/api/${tenantSlug}/admin/products`, {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      console.log(`✅ Created product: ${response.data.name} (${response.data.id})`);
      return response.data;
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Product already exists: ${productData.name}`);
        return null;
      }
      throw error;
    }
  }

  async seedDemoData() {
    console.log('🌱 Starting demo data seeding...\n');

    try {
      // Demo Tenants
      const tenants = [
        {
          slug: 'gamestore',
          name: 'Game Store',
          subdomain: 'gamestore',
          plan: 'premium',
        },
        {
          slug: 'ebookstore',
          name: 'Ebook Store',
          subdomain: 'ebookstore',
          plan: 'professional',
        },
        {
          slug: 'courseplatform',
          name: 'Course Platform',
          subdomain: 'courses',
          plan: 'enterprise',
        },
      ];

      const createdTenants = [];

      for (const tenantData of tenants) {
        const tenant = await this.createTenant(tenantData);
        createdTenants.push(tenant);
        console.log('');
      }

      // Seed data for each tenant
      for (const tenant of createdTenants) {
        console.log(`\n🎯 Seeding data for ${tenant.name}...\n`);

        if (tenant.slug === 'gamestore') {
          await this.seedGameStore(tenant.slug);
        } else if (tenant.slug === 'ebookstore') {
          await this.seedEbookStore(tenant.slug);
        } else if (tenant.slug === 'courseplatform') {
          await this.seedCoursePlatform(tenant.slug);
        }

        console.log(`\n✅ Completed seeding for ${tenant.name}\n`);
      }

      console.log('🎉 Demo data seeding completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`- Created ${tenants.length} demo tenants`);
      console.log('- Each tenant has sample product types and products');
      console.log('- Ready for testing and development\n');

      console.log('🔗 Access URLs:');
      for (const tenant of createdTenants) {
        console.log(`- ${tenant.name}: http://${tenant.subdomain}.localhost:3000`);
      }

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  }

  private async seedGameStore(tenantSlug: string) {
    // Game Product Type
    const gameProductType = await this.createProductType(tenantSlug, {
      name: 'Video Game',
      slug: 'video-game',
      icon: '🎮',
      category: 'Games',
      schema: {
        type: 'object',
        properties: {
          genre: { type: 'string', enum: ['Action', 'RPG', 'Strategy', 'Puzzle', 'Sports'] },
          platform: { type: 'string', enum: ['PC', 'PlayStation', 'Xbox', 'Nintendo'] },
          age_rating: { type: 'string', enum: ['E', 'E10+', 'T', 'M'] },
          multiplayer: { type: 'boolean' },
          file_size: { type: 'number' },
        },
        required: ['genre', 'platform'],
      },
      ui_config: {
        fields: [
          { key: 'genre', label: 'Genre', type: 'select', options: ['Action', 'RPG', 'Strategy', 'Puzzle', 'Sports'] },
          { key: 'platform', label: 'Platform', type: 'select', options: ['PC', 'PlayStation', 'Xbox', 'Nintendo'] },
          { key: 'age_rating', label: 'Age Rating', type: 'select', options: ['E', 'E10+', 'T', 'M'] },
          { key: 'multiplayer', label: 'Multiplayer', type: 'checkbox' },
          { key: 'file_size', label: 'File Size (GB)', type: 'number' },
        ],
      },
    });

    // Sample Games
    const games = [
      {
        name: 'Cyber Adventure 2077',
        slug: 'cyber-adventure-2077',
        product_type_id: gameProductType.id,
        status: 'published',
        metadata: {
          genre: 'RPG',
          platform: 'PC',
          age_rating: 'M',
          multiplayer: true,
          file_size: 75,
          description: 'An epic cyberpunk RPG set in a dystopian future.',
        },
      },
      {
        name: 'Puzzle Master Pro',
        slug: 'puzzle-master-pro',
        product_type_id: gameProductType.id,
        status: 'published',
        metadata: {
          genre: 'Puzzle',
          platform: 'PC',
          age_rating: 'E',
          multiplayer: false,
          file_size: 2,
          description: 'Challenge your mind with hundreds of unique puzzles.',
        },
      },
      {
        name: 'Racing Championship 2024',
        slug: 'racing-championship-2024',
        product_type_id: gameProductType.id,
        status: 'published',
        metadata: {
          genre: 'Sports',
          platform: 'PlayStation',
          age_rating: 'E10+',
          multiplayer: true,
          file_size: 45,
          description: 'The ultimate racing experience with realistic physics.',
        },
      },
    ];

    for (const game of games) {
      await this.createProduct(tenantSlug, game);
    }
  }

  private async seedEbookStore(tenantSlug: string) {
    // Ebook Product Type
    const ebookProductType = await this.createProductType(tenantSlug, {
      name: 'Ebook',
      slug: 'ebook',
      icon: '📚',
      category: 'Books',
      schema: {
        type: 'object',
        properties: {
          author: { type: 'string' },
          isbn: { type: 'string' },
          page_count: { type: 'number' },
          language: { type: 'string' },
          format: { type: 'string', enum: ['PDF', 'EPUB', 'MOBI'] },
          file_size: { type: 'number' },
        },
        required: ['author', 'isbn', 'format'],
      },
      ui_config: {
        fields: [
          { key: 'author', label: 'Author', type: 'text' },
          { key: 'isbn', label: 'ISBN', type: 'text' },
          { key: 'page_count', label: 'Page Count', type: 'number' },
          { key: 'language', label: 'Language', type: 'text' },
          { key: 'format', label: 'Format', type: 'select', options: ['PDF', 'EPUB', 'MOBI'] },
          { key: 'file_size', label: 'File Size (MB)', type: 'number' },
        ],
      },
    });

    // Sample Ebooks
    const ebooks = [
      {
        name: 'The Art of Programming',
        slug: 'the-art-of-programming',
        product_type_id: ebookProductType.id,
        status: 'published',
        metadata: {
          author: 'Jane Developer',
          isbn: '978-0123456789',
          page_count: 450,
          language: 'English',
          format: 'PDF',
          file_size: 15,
          description: 'A comprehensive guide to modern programming practices.',
        },
      },
      {
        name: 'Digital Marketing Mastery',
        slug: 'digital-marketing-mastery',
        product_type_id: ebookProductType.id,
        status: 'published',
        metadata: {
          author: 'Mark Expert',
          isbn: '978-9876543210',
          page_count: 320,
          language: 'English',
          format: 'EPUB',
          file_size: 8,
          description: 'Learn the secrets of successful digital marketing campaigns.',
        },
      },
      {
        name: 'Mindful Living',
        slug: 'mindful-living',
        product_type_id: ebookProductType.id,
        status: 'published',
        metadata: {
          author: 'Sarah Peaceful',
          isbn: '978-1122334455',
          page_count: 200,
          language: 'English',
          format: 'MOBI',
          file_size: 5,
          description: 'A guide to incorporating mindfulness into daily life.',
        },
      },
    ];

    for (const ebook of ebooks) {
      await this.createProduct(tenantSlug, ebook);
    }
  }

  private async seedCoursePlatform(tenantSlug: string) {
    // Course Product Type
    const courseProductType = await this.createProductType(tenantSlug, {
      name: 'Online Course',
      slug: 'online-course',
      icon: '🎓',
      category: 'Education',
      schema: {
        type: 'object',
        properties: {
          instructor: { type: 'string' },
          duration: { type: 'string' },
          level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
          language: { type: 'string' },
          certificate: { type: 'boolean' },
          video_hours: { type: 'number' },
        },
        required: ['instructor', 'duration', 'level'],
      },
      ui_config: {
        fields: [
          { key: 'instructor', label: 'Instructor', type: 'text' },
          { key: 'duration', label: 'Duration', type: 'text' },
          { key: 'level', label: 'Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
          { key: 'language', label: 'Language', type: 'text' },
          { key: 'certificate', label: 'Certificate Available', type: 'checkbox' },
          { key: 'video_hours', label: 'Video Hours', type: 'number' },
        ],
      },
    });

    // Sample Courses
    const courses = [
      {
        name: 'Web Development Bootcamp',
        slug: 'web-development-bootcamp',
        product_type_id: courseProductType.id,
        status: 'published',
        metadata: {
          instructor: 'John Coder',
          duration: '12 weeks',
          level: 'Beginner',
          language: 'English',
          certificate: true,
          video_hours: 120,
          description: 'Learn full-stack web development from scratch.',
        },
      },
      {
        name: 'Advanced React Masterclass',
        slug: 'advanced-react-masterclass',
        product_type_id: courseProductType.id,
        status: 'published',
        metadata: {
          instructor: 'React Expert',
          duration: '8 weeks',
          level: 'Advanced',
          language: 'English',
          certificate: true,
          video_hours: 80,
          description: 'Master advanced React concepts and patterns.',
        },
      },
      {
        name: 'UI/UX Design Fundamentals',
        slug: 'ui-ux-design-fundamentals',
        product_type_id: courseProductType.id,
        status: 'published',
        metadata: {
          instructor: 'Design Guru',
          duration: '6 weeks',
          level: 'Beginner',
          language: 'English',
          certificate: true,
          video_hours: 45,
          description: 'Learn the principles of great user interface and experience design.',
        },
      },
    ];

    for (const course of courses) {
      await this.createProduct(tenantSlug, course);
    }
  }
}

// Run the seeder
const seedService = new SeedService();
seedService.seedDemoData().catch(console.error);