import { db } from '../config/database.js';
import { Product, ProductAttribute } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';

export class ProductService {
  async createProduct(tenantId: string, data: {
    product_type_id: string;
    name: string;
    slug?: string;
    status?: string;
    metadata?: Record<string, any>;
  }): Promise<Product> {
    const product = await db.one(
      `INSERT INTO products (tenant_id, product_type_id, name, slug, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, data.product_type_id, data.name, data.slug, data.status || 'draft', JSON.stringify(data.metadata || {})]
    );

    return product;
  }

  async getProduct(tenantId: string, id: string): Promise<Product> {
    const product = await db.oneOrNone(
      'SELECT * FROM products WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async listProducts(tenantId: string, filters: any = {}, limit: number = 50, offset: number = 0) {
    let query = 'SELECT * FROM products WHERE tenant_id = $1';
    let params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.product_type_id) {
      query += ` AND product_type_id = $${paramIndex}`;
      params.push(filters.product_type_id);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    const data = await db.manyOrNone(
      query + ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    let countQuery = 'SELECT COUNT(*) as count FROM products WHERE tenant_id = $1';
    const countParams = [tenantId];

    if (filters.product_type_id) {
      countQuery += ` AND product_type_id = $2`;
      countParams.push(filters.product_type_id);
    }

    if (filters.status) {
      const idx = countParams.length + 1;
      countQuery += ` AND status = $${idx}`;
      countParams.push(filters.status);
    }

    const [{ count }] = await db.one(countQuery, countParams);

    return {
      data,
      total: parseInt(count, 10),
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(parseInt(count, 10) / limit),
    };
  }

  async updateProduct(tenantId: string, id: string, data: Partial<Product>): Promise<Product> {
    const product = await db.one(
      `UPDATE products 
       SET name = COALESCE($3, name),
           slug = COALESCE($4, slug),
           status = COALESCE($5, status),
           metadata = COALESCE($6, metadata),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.name,
        data.slug,
        data.status,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );

    return product;
  }

  async deleteProduct(tenantId: string, id: string): Promise<void> {
    await db.none('DELETE FROM products WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }

  async setAttribute(productId: string, key: string, value: any, type: string = 'json'): Promise<ProductAttribute> {
    const attribute = await db.one(
      `INSERT INTO product_attributes (product_id, attribute_key, attribute_value, attribute_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, attribute_key) 
       DO UPDATE SET attribute_value = $3, attribute_type = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [productId, key, JSON.stringify(value), type]
    );

    return attribute;
  }

  async getAttributes(productId: string): Promise<ProductAttribute[]> {
    const attributes = await db.manyOrNone(
      'SELECT * FROM product_attributes WHERE product_id = $1',
      [productId]
    );

    return attributes || [];
  }

  async getAttribute(productId: string, key: string): Promise<ProductAttribute | null> {
    const attribute = await db.oneOrNone(
      'SELECT * FROM product_attributes WHERE product_id = $1 AND attribute_key = $2',
      [productId, key]
    );

    return attribute;
  }
}

export const productService = new ProductService();
