import { db } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

export class IntegrationService {
  async createIntegration(tenantId: string, data: {
    name: string;
    integration_type: string;
    credentials?: Record<string, any>;
    field_mapping?: Record<string, any>;
    sync_config?: Record<string, any>;
    webhook_config?: Record<string, any>;
  }) {
    const integration = await db.one(
      `INSERT INTO integrations (tenant_id, name, integration_type, credentials, field_mapping, sync_config, webhook_config, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tenantId,
        data.name,
        data.integration_type,
        data.credentials ? JSON.stringify(data.credentials) : '{}',
        data.field_mapping ? JSON.stringify(data.field_mapping) : '{}',
        data.sync_config ? JSON.stringify(data.sync_config) : '{}',
        data.webhook_config ? JSON.stringify(data.webhook_config) : '{}',
        true,
      ]
    );

    return integration;
  }

  async getIntegration(tenantId: string, id: string) {
    const integration = await db.oneOrNone(
      'SELECT * FROM integrations WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    return integration;
  }

  async listIntegrations(tenantId: string, limit: number = 50, offset: number = 0) {
    const data = await db.manyOrNone(
      'SELECT * FROM integrations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );

    const [{ count }] = await db.one(
      'SELECT COUNT(*) as count FROM integrations WHERE tenant_id = $1',
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

  async updateIntegration(tenantId: string, id: string, data: any) {
    const integration = await db.one(
      `UPDATE integrations 
       SET name = COALESCE($3, name),
           credentials = COALESCE($4, credentials),
           field_mapping = COALESCE($5, field_mapping),
           sync_config = COALESCE($6, sync_config),
           webhook_config = COALESCE($7, webhook_config),
           is_active = COALESCE($8, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.name,
        data.credentials ? JSON.stringify(data.credentials) : null,
        data.field_mapping ? JSON.stringify(data.field_mapping) : null,
        data.sync_config ? JSON.stringify(data.sync_config) : null,
        data.webhook_config ? JSON.stringify(data.webhook_config) : null,
        data.is_active,
      ]
    );

    return integration;
  }

  async deleteIntegration(tenantId: string, id: string) {
    await db.none(
      'DELETE FROM integrations WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }
}

export const integrationService = new IntegrationService();
