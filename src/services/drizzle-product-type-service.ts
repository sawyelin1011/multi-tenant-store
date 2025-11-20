import { getWorkerDb } from '../config/worker-database.js';
import { productTypes } from '../db/schema.js';
import { ProductType } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzleProductTypeService {
  async createProductType(
    tenantId: string,
    data: {
      name: string;
      slug: string;
      icon?: string;
      category?: string;
      schema: Record<string, any>;
    }
  ): Promise<ProductType> {
    const db = getWorkerDb();

    const existing = await db.query.productTypes.findFirst({
      where: and(
        eq(productTypes.tenant_id, tenantId),
        eq(productTypes.slug, data.slug)
      ),
    });

    if (existing) {
      throw new ConflictError('Product type slug already exists');
    }

    const [productType] = await db
      .insert(productTypes)
      .values({
        tenant_id: tenantId,
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        category: data.category,
        schema: JSON.stringify(data.schema),
        is_active: true,
      })
      .returning();

    return this.parseProductType(productType);
  }

  async getProductType(tenantId: string, id: string): Promise<ProductType> {
    const db = getWorkerDb();

    const productType = await db.query.productTypes.findFirst({
      where: and(eq(productTypes.id, id), eq(productTypes.tenant_id, tenantId)),
    });

    if (!productType) {
      throw new NotFoundError('Product type not found');
    }

    return this.parseProductType(productType);
  }

  async listProductTypes(tenantId: string, limit: number = 50, offset: number = 0) {
    const db = getWorkerDb();

    const data = await db.query.productTypes.findMany({
      where: eq(productTypes.tenant_id, tenantId),
      orderBy: (pt) => desc(pt.created_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: productTypes.id })
      .from(productTypes)
      .where(eq(productTypes.tenant_id, tenantId));

    const total = countResult.length;

    return {
      data: data.map((pt) => this.parseProductType(pt)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateProductType(
    tenantId: string,
    id: string,
    data: Partial<ProductType>
  ): Promise<ProductType> {
    const db = getWorkerDb();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.schema !== undefined) updateData.schema = JSON.stringify(data.schema);
    if (data.ui_config !== undefined) updateData.ui_config = JSON.stringify(data.ui_config);
    if (data.validation_rules !== undefined) updateData.validation_rules = JSON.stringify(data.validation_rules);
    if (data.workflows !== undefined) updateData.workflows = JSON.stringify(data.workflows);
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    updateData.updated_at = new Date().toISOString();

    const [productType] = await db
      .update(productTypes)
      .set(updateData)
      .where(and(eq(productTypes.id, id), eq(productTypes.tenant_id, tenantId)))
      .returning();

    return this.parseProductType(productType);
  }

  async deleteProductType(tenantId: string, id: string): Promise<void> {
    const db = getWorkerDb();
    await db
      .delete(productTypes)
      .where(and(eq(productTypes.id, id), eq(productTypes.tenant_id, tenantId)));
  }

  private parseProductType(pt: any): ProductType {
    return {
      ...pt,
      schema: typeof pt.schema === 'string' ? JSON.parse(pt.schema) : pt.schema,
      ui_config: typeof pt.ui_config === 'string' ? JSON.parse(pt.ui_config) : pt.ui_config,
      validation_rules: typeof pt.validation_rules === 'string' ? JSON.parse(pt.validation_rules) : pt.validation_rules,
      workflows: typeof pt.workflows === 'string' ? JSON.parse(pt.workflows) : pt.workflows,
    };
  }
}

export const drizzleProductTypeService = new DrizzleProductTypeService();
