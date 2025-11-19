import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { pluginService } from '../../services/pluginService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// List available plugins
router.get('/', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const installed = req.query.installed === 'true';

    if (installed) {
      const result = await pluginService.listTenantPlugins(req.tenantId!, limit, offset);
      res.json({ success: true, data: result });
    } else {
      const result = await pluginService.listPlugins(limit, offset);
      res.json({ success: true, data: result });
    }
  } catch (error) {
    next(error);
  }
});

// Install plugin
router.post('/:plugin_id/install', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { config } = req.body;

    const tenantPlugin = await pluginService.installPlugin(
      req.tenantId!,
      req.params.plugin_id,
      config
    );

    res.status(201).json({ success: true, data: tenantPlugin });
  } catch (error) {
    next(error);
  }
});

// Get tenant plugin
router.get('/installed/:plugin_id', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const tenantPlugin = await pluginService.getTenantPlugin(req.tenantId!, req.params.plugin_id);
    res.json({ success: true, data: tenantPlugin });
  } catch (error) {
    next(error);
  }
});

// Update plugin config
router.put('/:plugin_id/config', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const tenantPlugin = await pluginService.updatePluginConfig(
      req.tenantId!,
      req.params.plugin_id,
      req.body
    );

    res.json({ success: true, data: tenantPlugin });
  } catch (error) {
    next(error);
  }
});

// Enable plugin
router.post('/:plugin_id/enable', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const tenantPlugin = await pluginService.enablePlugin(req.tenantId!, req.params.plugin_id);
    res.json({ success: true, data: tenantPlugin });
  } catch (error) {
    next(error);
  }
});

// Disable plugin
router.post('/:plugin_id/disable', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const tenantPlugin = await pluginService.disablePlugin(req.tenantId!, req.params.plugin_id);
    res.json({ success: true, data: tenantPlugin });
  } catch (error) {
    next(error);
  }
});

// Uninstall plugin
router.delete('/:plugin_id', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    await pluginService.uninstallPlugin(req.tenantId!, req.params.plugin_id);
    res.json({ success: true, message: 'Plugin uninstalled' });
  } catch (error) {
    next(error);
  }
});

export default router;
