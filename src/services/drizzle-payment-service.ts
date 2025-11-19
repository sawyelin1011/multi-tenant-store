import { getWorkerDb } from '../config/worker-database.js';
import { paymentGateways } from '../db/schema.js';
import { NotFoundError } from '../utils/errors.js';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzlePaymentService {
  async createPaymentGateway(
    tenantId: string,
    data: {
      name: string;
      gateway_type: string;
      credentials?: Record<string, any>;
      config?: Record<string, any>;
    }
  ) {
    const db = getWorkerDb();

    const [gateway] = await db
      .insert(paymentGateways)
      .values({
        tenant_id: tenantId,
        name: data.name,
        gateway_type: data.gateway_type,
        credentials: data.credentials ? JSON.stringify(data.credentials) : '{}',
        config: data.config ? JSON.stringify(data.config) : '{}',
        is_active: true,
      })
      .returning();

    return this.parsePaymentGateway(gateway);
  }

  async getPaymentGateway(tenantId: string, id: string) {
    const db = getWorkerDb();

    const gateway = await db.query.paymentGateways.findFirst({
      where: and(eq(paymentGateways.id, id), eq(paymentGateways.tenant_id, tenantId)),
    });

    if (!gateway) {
      throw new NotFoundError('Payment gateway not found');
    }

    return this.parsePaymentGateway(gateway);
  }

  async listPaymentGateways(tenantId: string, limit: number = 50, offset: number = 0) {
    const db = getWorkerDb();

    const data = await db.query.paymentGateways.findMany({
      where: eq(paymentGateways.tenant_id, tenantId),
      orderBy: (p) => desc(p.created_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: paymentGateways.id })
      .from(paymentGateways)
      .where(eq(paymentGateways.tenant_id, tenantId));

    const total = countResult.length;

    return {
      data: data.map((p) => this.parsePaymentGateway(p)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updatePaymentGateway(tenantId: string, id: string, data: any) {
    const db = getWorkerDb();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.credentials !== undefined) updateData.credentials = JSON.stringify(data.credentials);
    if (data.config !== undefined) updateData.config = JSON.stringify(data.config);
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    updateData.updated_at = new Date().toISOString();

    const [gateway] = await db
      .update(paymentGateways)
      .set(updateData)
      .where(and(eq(paymentGateways.id, id), eq(paymentGateways.tenant_id, tenantId)))
      .returning();

    return this.parsePaymentGateway(gateway);
  }

  async deletePaymentGateway(tenantId: string, id: string) {
    const db = getWorkerDb();

    await db
      .delete(paymentGateways)
      .where(and(eq(paymentGateways.id, id), eq(paymentGateways.tenant_id, tenantId)));
  }

  private parsePaymentGateway(gateway: any) {
    return {
      ...gateway,
      credentials: typeof gateway.credentials === 'string' ? JSON.parse(gateway.credentials) : gateway.credentials,
      config: typeof gateway.config === 'string' ? JSON.parse(gateway.config) : gateway.config,
    };
  }
}

export const drizzlePaymentService = new DrizzlePaymentService();
