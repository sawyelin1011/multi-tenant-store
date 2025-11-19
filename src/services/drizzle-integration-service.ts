import { getWorkerDb } from '../config/worker-database.js';
import { integrations } from '../db/schema.js';
import { NotFoundError } from '../utils/errors.js';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzleIntegrationService {
  async createIntegration(
    tenantId: string,
    data: {
      name: string;
      integration_type: string;
      credentials?: Record<string, any>;
      field_mapping?: Record<string, any>;
      sync_config?: Record<string, any>;
      webhook_config?: Record<string, any>;
    }
  ) {
    const db = getWorkerDb();

    const [integration] = await db
      .insert(integrations)
      .values({
        tenant_id: tenantId,
        name: data.name,
        integration_type: data.integration_type,
        credentials: data.credentials ? JSON.stringify(data.credentials) : '{}',
        field_mapping: data.field_mapping ? JSON.stringify(data.field_mapping) : '{}',
        sync_config: data.sync_config ? JSON.stringify(data.sync_config) : '{}',
        webhook_config: data.webhook_config ? JSON.stringify(data.webhook_config) : '{}',
        is_active: true,
      })
      .returning();

    return this.parseIntegration(integration);
  }

  async getIntegration(tenantId: string, id: string) {
    const db = getWorkerDb();

    const integration = await db.query.integrations.findFirst({
      where: and(eq(integrations.id, id), eq(integrations.tenant_id, tenantId)),
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    return this.parseIntegration(integration);
  }

  async listIntegrations(tenantId: string, limit: number = 50, offset: number = 0) {
    const db = getWorkerDb();

    const data = await db.query.integrations.findMany({
      where: eq(integrations.tenant_id, tenantId),
      orderBy: (i) => desc(i.created_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: integrations.id })
      .from(integrations)
      .where(eq(integrations.tenant_id, tenantId));

    const total = countResult.length;

    return {
      data: data.map((i) => this.parseIntegration(i)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateIntegration(tenantId: string, id: string, data: any) {
    const db = getWorkerDb();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.credentials !== undefined) updateData.credentials = JSON.stringify(data.credentials);
    if (data.field_mapping !== undefined) updateData.field_mapping = JSON.stringify(data.field_mapping);
    if (data.sync_config !== undefined) updateData.sync_config = JSON.stringify(data.sync_config);
    if (data.webhook_config !== undefined) updateData.webhook_config = JSON.stringify(data.webhook_config);
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    updateData.updated_at = new Date().toISOString();

    const [integration] = await db
      .update(integrations)
      .set(updateData)
      .where(and(eq(integrations.id, id), eq(integrations.tenant_id, tenantId)))
      .returning();

    return this.parseIntegration(integration);
  }

  async deleteIntegration(tenantId: string, id: string) {
    const db = getWorkerDb();

    await db
      .delete(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.tenant_id, tenantId)));
  }

  private parseIntegration(integration: any) {
    return {
      ...integration,
      credentials: typeof integration.credentials === 'string' ? JSON.parse(integration.credentials) : integration.credentials,
      field_mapping: typeof integration.field_mapping === 'string' ? JSON.parse(integration.field_mapping) : integration.field_mapping,
      sync_config: typeof integration.sync_config === 'string' ? JSON.parse(integration.sync_config) : integration.sync_config,
      webhook_config: typeof integration.webhook_config === 'string' ? JSON.parse(integration.webhook_config) : integration.webhook_config,
    };
  }
}

export const drizzleIntegrationService = new DrizzleIntegrationService();
