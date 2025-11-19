import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { workflowService } from '../../services/workflowService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// Create workflow
router.post('/', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, entity_type, trigger, steps } = req.body;

    const workflow = await workflowService.createWorkflow(req.tenantId!, {
      name,
      entity_type,
      trigger,
      steps,
    });

    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

// List workflows
router.get('/', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await workflowService.listWorkflows(req.tenantId!, limit, offset);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get workflow
router.get('/:id', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const workflow = await workflowService.getWorkflow(req.tenantId!, req.params.id);
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

// Update workflow
router.put('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.tenantId!, req.params.id, req.body);
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

// Delete workflow
router.delete('/:id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    await workflowService.deleteWorkflow(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
