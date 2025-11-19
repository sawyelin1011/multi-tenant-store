import { db } from '../config/database.js';
import { ProductType } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export class ProductTypeService {
  async createProductType(tenantId: string, data: {
    name: string;
    slug: string;
    icon?: string;
    category?: string;
    schema: Record<string, any>;
  }): Promise<ProductType> {
    const existing = await db.oneOrNone(
      'SELECT id FROM product_types WHERE tenant_id = $1 AND slug = $2',
      [tenantId, data.slug]
    );

    if (existing) {
      throw new ConflictError('Product type slug already exists');
    }

    const productType = await db.one(
      `INSERT INTO product_types (tenant_id, name, slug, icon, category, schema, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenantId, data.name, data.slug, data.icon, data.category, JSON.stringify(data.schema), true]
    );

    return productType;
  }

  async getProductType(tenantId: string, id: string): Promise<ProductType> {
    const productType = await db.oneOrNone(
      'SELECT * FROM product_types WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!productType) {
      throw new NotFoundError('Product type not found');
    }

    return productType;
  }

  async listProductTypes(tenantId: string, limit: number = 50, offset: number = 0) {
    const data = await db.manyOrNone(
      'SELECT * FROM product_types WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );

    const [{ count }] = await db.one(
      'SELECT COUNT(*) as count FROM product_types WHERE tenant_id = $1',
      [tenantId]
    );

    return {
      data,
      total: parseInt(count, 10),
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(parseInt(count, 10) / limit),
    };
  }

  async updateProductType(tenantId: string, id: string, data: Partial<ProductType>): Promise<ProductType> {
    const productType = await db.one(
      `UPDATE product_types 
       SET name = COALESCE($3, name),
           icon = COALESCE($4, icon),
           category = COALESCE($5, category),
           schema = COALESCE($6, schema),
           ui_config = COALESCE($7, ui_config),
           validation_rules = COALESCE($8, validation_rules),
           workflows = COALESCE($9, workflows),
           is_active = COALESCE($10, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.name,
        data.icon,
        data.category,
        data.schema ? JSON.stringify(data.schema) : null,
        data.ui_config ? JSON.stringify(data.ui_config) : null,
        data.validation_rules ? JSON.stringify(data.validation_rules) : null,
        data.workflows ? JSON.stringify(data.workflows) : null,
        data.is_active,
      ]
    );

    return productType;
  }

  async deleteProductType(tenantId: string, id: string): Promise<void> {
    await db.none(
      'DELETE FROM product_types WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }
}

export const productTypeService = new ProductTypeService();
