import { getWorkerDb } from '../config/worker-database.js';
import { workflows } from '../db/schema.js';
import { Workflow } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzleWorkflowService {
  async createWorkflow(
    tenantId: string,
    data: {
      name: string;
      entity_type?: string;
      trigger?: string;
      steps?: any[];
    }
  ): Promise<Workflow> {
    const db = getWorkerDb();

    const [workflow] = await db
      .insert(workflows)
      .values({
        tenant_id: tenantId,
        name: data.name,
        entity_type: data.entity_type,
        trigger: data.trigger,
        steps: JSON.stringify(data.steps || []),
        is_active: true,
      })
      .returning();

    return this.parseWorkflow(workflow);
  }

  async getWorkflow(tenantId: string, id: string): Promise<Workflow> {
    const db = getWorkerDb();

    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, id), eq(workflows.tenant_id, tenantId)),
    });

    if (!workflow) {
      throw new NotFoundError('Workflow not found');
    }

    return this.parseWorkflow(workflow);
  }

  async listWorkflows(tenantId: string, limit: number = 50, offset: number = 0) {
    const db = getWorkerDb();

    const data = await db.query.workflows.findMany({
      where: eq(workflows.tenant_id, tenantId),
      orderBy: (w) => desc(w.created_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: workflows.id })
      .from(workflows)
      .where(eq(workflows.tenant_id, tenantId));

    const total = countResult.length;

    return {
      data: data.map((w) => this.parseWorkflow(w)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateWorkflow(tenantId: string, id: string, data: Partial<Workflow>): Promise<Workflow> {
    const db = getWorkerDb();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.entity_type !== undefined) updateData.entity_type = data.entity_type;
    if (data.trigger !== undefined) updateData.trigger = data.trigger;
    if (data.steps !== undefined) updateData.steps = JSON.stringify(data.steps);
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    updateData.updated_at = new Date().toISOString();

    const [workflow] = await db
      .update(workflows)
      .set(updateData)
      .where(and(eq(workflows.id, id), eq(workflows.tenant_id, tenantId)))
      .returning();

    return this.parseWorkflow(workflow);
  }

  async deleteWorkflow(tenantId: string, id: string): Promise<void> {
    const db = getWorkerDb();

    await db
      .delete(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.tenant_id, tenantId)));
  }

  private parseWorkflow(workflow: any): Workflow {
    return {
      ...workflow,
      steps: typeof workflow.steps === 'string' ? JSON.parse(workflow.steps) : workflow.steps,
    };
  }
}

export const drizzleWorkflowService = new DrizzleWorkflowService();
