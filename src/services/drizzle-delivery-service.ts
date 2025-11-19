import { getWorkerDb } from '../config/worker-database.js';
import { deliveryMethods } from '../db/schema.js';
import { DeliveryMethod } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzleDeliveryService {
  async createDeliveryMethod(
    tenantId: string,
    data: {
      name: string;
      type: 'email' | 'webhook' | 'file' | 'manual' | 'plugin';
      config?: Record<string, any>;
      template?: Record<string, any>;
    }
  ): Promise<DeliveryMethod> {
    const db = getWorkerDb();

    const [method] = await db
      .insert(deliveryMethods)
      .values({
        tenant_id: tenantId,
        name: data.name,
        type: data.type,
        config: JSON.stringify(data.config || {}),
        template: JSON.stringify(data.template || {}),
        is_active: true,
      })
      .returning();

    return this.parseDeliveryMethod(method);
  }

  async getDeliveryMethod(tenantId: string, id: string): Promise<DeliveryMethod> {
    const db = getWorkerDb();

    const method = await db.query.deliveryMethods.findFirst({
      where: and(eq(deliveryMethods.id, id), eq(deliveryMethods.tenant_id, tenantId)),
    });

    if (!method) {
      throw new NotFoundError('Delivery method not found');
    }

    return this.parseDeliveryMethod(method);
  }

  async listDeliveryMethods(tenantId: string, limit: number = 50, offset: number = 0) {
    const db = getWorkerDb();

    const data = await db.query.deliveryMethods.findMany({
      where: eq(deliveryMethods.tenant_id, tenantId),
      orderBy: (d) => desc(d.created_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: deliveryMethods.id })
      .from(deliveryMethods)
      .where(eq(deliveryMethods.tenant_id, tenantId));

    const total = countResult.length;

    return {
      data: data.map((d) => this.parseDeliveryMethod(d)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateDeliveryMethod(
    tenantId: string,
    id: string,
    data: Partial<DeliveryMethod>
  ): Promise<DeliveryMethod> {
    const db = getWorkerDb();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.config !== undefined) updateData.config = JSON.stringify(data.config);
    if (data.template !== undefined) updateData.template = JSON.stringify(data.template);
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    updateData.updated_at = new Date().toISOString();

    const [method] = await db
      .update(deliveryMethods)
      .set(updateData)
      .where(and(eq(deliveryMethods.id, id), eq(deliveryMethods.tenant_id, tenantId)))
      .returning();

    return this.parseDeliveryMethod(method);
  }

  async deleteDeliveryMethod(tenantId: string, id: string): Promise<void> {
    const db = getWorkerDb();

    await db
      .delete(deliveryMethods)
      .where(and(eq(deliveryMethods.id, id), eq(deliveryMethods.tenant_id, tenantId)));
  }

  private parseDeliveryMethod(method: any): DeliveryMethod {
    return {
      ...method,
      config: typeof method.config === 'string' ? JSON.parse(method.config) : method.config,
      template: typeof method.template === 'string' ? JSON.parse(method.template) : method.template,
    };
  }
}

export const drizzleDeliveryService = new DrizzleDeliveryService();
