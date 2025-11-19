import { db } from '../config/database.js';
import { DeliveryMethod } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';

export class DeliveryService {
  async createDeliveryMethod(tenantId: string, data: {
    name: string;
    type: 'email' | 'webhook' | 'file' | 'manual' | 'plugin';
    config?: Record<string, any>;
    template?: Record<string, any>;
  }): Promise<DeliveryMethod> {
    const method = await db.one(
      `INSERT INTO delivery_methods (tenant_id, name, type, config, template, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        tenantId,
        data.name,
        data.type,
        JSON.stringify(data.config || {}),
        JSON.stringify(data.template || {}),
        true,
      ]
    );

    return method;
  }

  async getDeliveryMethod(tenantId: string, id: string): Promise<DeliveryMethod> {
    const method = await db.oneOrNone(
      'SELECT * FROM delivery_methods WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!method) {
      throw new NotFoundError('Delivery method not found');
    }

    return method;
  }

  async listDeliveryMethods(tenantId: string, limit: number = 50, offset: number = 0) {
    const data = await db.manyOrNone(
      'SELECT * FROM delivery_methods WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );

    const [{ count }] = await db.one(
      'SELECT COUNT(*) as count FROM delivery_methods WHERE tenant_id = $1',
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

  async updateDeliveryMethod(tenantId: string, id: string, data: Partial<DeliveryMethod>): Promise<DeliveryMethod> {
    const method = await db.one(
      `UPDATE delivery_methods 
       SET name = COALESCE($3, name),
           config = COALESCE($4, config),
           template = COALESCE($5, template),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.name,
        data.config ? JSON.stringify(data.config) : null,
        data.template ? JSON.stringify(data.template) : null,
        data.is_active,
      ]
    );

    return method;
  }

  async deleteDeliveryMethod(tenantId: string, id: string): Promise<void> {
    await db.none(
      'DELETE FROM delivery_methods WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }
}

export const deliveryService = new DeliveryService();
