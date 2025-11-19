import { db } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

export class PaymentService {
  async createPaymentGateway(tenantId: string, data: {
    name: string;
    gateway_type: string;
    credentials?: Record<string, any>;
    config?: Record<string, any>;
  }) {
    const gateway = await db.one(
      `INSERT INTO payment_gateways (tenant_id, name, gateway_type, credentials, config, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        tenantId,
        data.name,
        data.gateway_type,
        data.credentials ? JSON.stringify(data.credentials) : '{}',
        data.config ? JSON.stringify(data.config) : '{}',
        true,
      ]
    );

    return gateway;
  }

  async getPaymentGateway(tenantId: string, id: string) {
    const gateway = await db.oneOrNone(
      'SELECT * FROM payment_gateways WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!gateway) {
      throw new NotFoundError('Payment gateway not found');
    }

    return gateway;
  }

  async listPaymentGateways(tenantId: string, limit: number = 50, offset: number = 0) {
    const data = await db.manyOrNone(
      'SELECT * FROM payment_gateways WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );

    const [{ count }] = await db.one(
      'SELECT COUNT(*) as count FROM payment_gateways WHERE tenant_id = $1',
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

  async updatePaymentGateway(tenantId: string, id: string, data: any) {
    const gateway = await db.one(
      `UPDATE payment_gateways 
       SET name = COALESCE($3, name),
           credentials = COALESCE($4, credentials),
           config = COALESCE($5, config),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.name,
        data.credentials ? JSON.stringify(data.credentials) : null,
        data.config ? JSON.stringify(data.config) : null,
        data.is_active,
      ]
    );

    return gateway;
  }

  async deletePaymentGateway(tenantId: string, id: string) {
    await db.none(
      'DELETE FROM payment_gateways WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }
}

export const paymentService = new PaymentService();
