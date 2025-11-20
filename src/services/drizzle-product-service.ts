import { getWorkerDb, withWorkerTenantId } from '../config/worker-database.js';
import {
  products,
  productAttributes,
  productVariants,
  productTypes,
} from '../db/schema.js';
import { Product, ProductAttribute } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzleProductService {
  async createProduct(
    tenantId: string,
    data: {
      product_type_id: string;
      name: string;
      slug?: string;
      status?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Product> {
    const db = getWorkerDb();

    const [product] = await db
      .insert(products)
      .values({
        tenant_id: tenantId,
        product_type_id: data.product_type_id,
        name: data.name,
        slug: data.slug,
        status: data.status || 'draft',
        metadata: JSON.stringify(data.metadata || {}),
      })
      .returning();

    return this.parseProduct(product);
  }

  async getProduct(tenantId: string, id: string): Promise<Product> {
    const db = getWorkerDb();

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.tenant_id, tenantId)),
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return this.parseProduct(product);
  }

  async listProducts(
    tenantId: string,
    filters: any = {},
    limit: number = 50,
    offset: number = 0
  ) {
    const db = getWorkerDb();

    let whereClause = eq(products.tenant_id, tenantId);

    if (filters.product_type_id) {
      whereClause = and(whereClause, eq(products.product_type_id, filters.product_type_id));
    }

    if (filters.status) {
      whereClause = and(whereClause, eq(products.status, filters.status));
    }

    const data = await db.query.products.findMany({
      where: whereClause,
      orderBy: (p) => desc(p.created_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: products.id })
      .from(products)
      .where(whereClause);

    const total = countResult.length;

    return {
      data: data.map((p) => this.parseProduct(p)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateProduct(
    tenantId: string,
    id: string,
    data: Partial<Product>
  ): Promise<Product> {
    const db = getWorkerDb();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);
    updateData.updated_at = new Date().toISOString();

    const [product] = await db
      .update(products)
      .set(updateData)
      .where(and(eq(products.id, id), eq(products.tenant_id, tenantId)))
      .returning();

    return this.parseProduct(product);
  }

  async deleteProduct(tenantId: string, id: string): Promise<void> {
    const db = getWorkerDb();
    await db.delete(products).where(and(eq(products.id, id), eq(products.tenant_id, tenantId)));
  }

  async setAttribute(
    productId: string,
    key: string,
    value: any,
    type: string = 'json'
  ): Promise<ProductAttribute> {
    const db = getWorkerDb();

    // Try to find existing attribute
    const existing = await db.query.productAttributes.findFirst({
      where: and(eq(productAttributes.product_id, productId), eq(productAttributes.attribute_key, key)),
    });

    let attribute;
    if (existing) {
      [attribute] = await db
        .update(productAttributes)
        .set({
          attribute_value: JSON.stringify(value),
          attribute_type: type,
          updated_at: new Date().toISOString(),
        })
        .where(eq(productAttributes.id, existing.id))
        .returning();
    } else {
      [attribute] = await db
        .insert(productAttributes)
        .values({
          product_id: productId,
          attribute_key: key,
          attribute_value: JSON.stringify(value),
          attribute_type: type,
        })
        .returning();
    }

    return this.parseProductAttribute(attribute);
  }

  async getAttributes(productId: string): Promise<ProductAttribute[]> {
    const db = getWorkerDb();

    const attributes = await db.query.productAttributes.findMany({
      where: eq(productAttributes.product_id, productId),
    });

    return (attributes || []).map((a) => this.parseProductAttribute(a));
  }

  async getAttribute(productId: string, key: string): Promise<ProductAttribute | null> {
    const db = getWorkerDb();

    const attribute = await db.query.productAttributes.findFirst({
      where: and(
        eq(productAttributes.product_id, productId),
        eq(productAttributes.attribute_key, key)
      ),
    });

    return attribute ? this.parseProductAttribute(attribute) : null;
  }

  private parseProduct(product: any): Product {
    return {
      ...product,
      metadata: typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata,
    };
  }

  private parseProductAttribute(attr: any): ProductAttribute {
    return {
      ...attr,
      attribute_value:
        typeof attr.attribute_value === 'string'
          ? JSON.parse(attr.attribute_value)
          : attr.attribute_value,
    };
  }
}

export const drizzleProductService = new DrizzleProductService();
