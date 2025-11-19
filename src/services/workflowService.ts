import { db } from '../config/database.js';
import { Workflow } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';

export class WorkflowService {
  async createWorkflow(tenantId: string, data: {
    name: string;
    entity_type?: string;
    trigger?: string;
    steps?: any[];
  }): Promise<Workflow> {
    const workflow = await db.one(
      `INSERT INTO workflows (tenant_id, name, entity_type, trigger, steps, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        tenantId,
        data.name,
        data.entity_type,
        data.trigger,
        JSON.stringify(data.steps || []),
        true,
      ]
    );

    return workflow;
  }

  async getWorkflow(tenantId: string, id: string): Promise<Workflow> {
    const workflow = await db.oneOrNone(
      'SELECT * FROM workflows WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!workflow) {
      throw new NotFoundError('Workflow not found');
    }

    return workflow;
  }

  async listWorkflows(tenantId: string, limit: number = 50, offset: number = 0) {
    const data = await db.manyOrNone(
      'SELECT * FROM workflows WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );

    const [{ count }] = await db.one(
      'SELECT COUNT(*) as count FROM workflows WHERE tenant_id = $1',
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

  async updateWorkflow(tenantId: string, id: string, data: Partial<Workflow>): Promise<Workflow> {
    const workflow = await db.one(
      `UPDATE workflows 
       SET name = COALESCE($3, name),
           entity_type = COALESCE($4, entity_type),
           trigger = COALESCE($5, trigger),
           steps = COALESCE($6, steps),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.name,
        data.entity_type,
        data.trigger,
        data.steps ? JSON.stringify(data.steps) : null,
        data.is_active,
      ]
    );

    return workflow;
  }

  async deleteWorkflow(tenantId: string, id: string): Promise<void> {
    await db.none(
      'DELETE FROM workflows WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }
}

export const workflowService = new WorkflowService();
