import { Router } from 'express';
import { AuthRequest } from '../../types/express.js';
import { uiTemplateService } from '../../services/uiTemplateService.js';
import { verifyTenantToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenantResolver.js';

const router = Router({ mergeParams: true });

// Get template for a specific page
router.get('/templates/:page', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const { page } = req.params;
    const resolved = req.query.resolved === 'true';

    if (resolved) {
      const template = await uiTemplateService.resolveTemplate(page, req.tenantId!);
      res.json({ success: true, data: template });
    } else {
      const template = await uiTemplateService.getTemplate(page, req.tenantId);
      res.json({ success: true, data: template });
    }
  } catch (error) {
    next(error);
  }
});

// Create or update template for tenant
router.put('/templates/:page', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { page } = req.params;
    const { name, layout_id, theme_id, is_default, override_config, metadata } = req.body;

    const existing = await uiTemplateService.getTemplate(page, req.tenantId).catch(() => null);

    if (existing && existing.tenant_id === req.tenantId) {
      const template = await uiTemplateService.updateTemplate(page, req.tenantId!, {
        name,
        layout_id,
        theme_id,
        is_default,
        override_config,
        metadata,
      });
      res.json({ success: true, data: template });
    } else {
      const template = await uiTemplateService.createTemplate({
        tenant_id: req.tenantId,
        page,
        name: name || `${page} Template`,
        layout_id,
        theme_id,
        is_default,
        override_config,
        metadata,
      });
      res.status(201).json({ success: true, data: template });
    }
  } catch (error) {
    next(error);
  }
});

// Get component by ID
router.get('/components/:componentId', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const { componentId } = req.params;
    const component = await uiTemplateService.getComponent(componentId, req.tenantId);
    res.json({ success: true, data: component });
  } catch (error) {
    next(error);
  }
});

// List all components
router.get('/components', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const { type, category } = req.query;
    const components = await uiTemplateService.listComponents(
      req.tenantId,
      type as string,
      category as string
    );
    res.json({ success: true, data: components });
  } catch (error) {
    next(error);
  }
});

// Create component
router.post('/components', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, slug, type, category, props_schema, default_props, render_config, dependencies, metadata } = req.body;
    const component = await uiTemplateService.createComponent({
      tenant_id: req.tenantId,
      name,
      slug,
      type,
      category,
      props_schema,
      default_props,
      render_config,
      dependencies,
      metadata,
    });
    res.status(201).json({ success: true, data: component });
  } catch (error) {
    next(error);
  }
});

// Get current theme
router.get('/themes/current', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const theme = await uiTemplateService.getCurrentTheme(req.tenantId!);
    res.json({ success: true, data: theme });
  } catch (error) {
    next(error);
  }
});

// List all themes
router.get('/themes', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const themes = await uiTemplateService.listThemes(req.tenantId);
    res.json({ success: true, data: themes });
  } catch (error) {
    next(error);
  }
});

// Get theme by ID
router.get('/themes/:themeId', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const { themeId } = req.params;
    const theme = await uiTemplateService.getTheme(themeId, req.tenantId);
    res.json({ success: true, data: theme });
  } catch (error) {
    next(error);
  }
});

// Create theme
router.post('/themes', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, slug, is_default, colors, fonts, spacing, borders, shadows } = req.body;
    const theme = await uiTemplateService.createTheme({
      tenant_id: req.tenantId,
      name,
      slug,
      is_default,
      colors,
      fonts,
      spacing,
      borders,
      shadows,
    });
    res.status(201).json({ success: true, data: theme });
  } catch (error) {
    next(error);
  }
});

// Update theme
router.put('/themes/:themeId', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { themeId } = req.params;
    const { name, slug, is_default, colors, fonts, spacing, borders, shadows } = req.body;
    const theme = await uiTemplateService.updateTheme(themeId, req.tenantId!, {
      name,
      slug,
      is_default,
      colors,
      fonts,
      spacing,
      borders,
      shadows,
    });
    res.json({ success: true, data: theme });
  } catch (error) {
    next(error);
  }
});

// List layouts
router.get('/layouts', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const { type } = req.query;
    const layouts = await uiTemplateService.listLayouts(req.tenantId, type as string);
    res.json({ success: true, data: layouts });
  } catch (error) {
    next(error);
  }
});

// Get layout by ID
router.get('/layouts/:layoutId', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const { layoutId } = req.params;
    const layout = await uiTemplateService.getLayout(layoutId, req.tenantId);
    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
});

// Create layout
router.post('/layouts', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, slug, type, grid_config, regions, responsive_config, metadata } = req.body;
    const layout = await uiTemplateService.createLayout({
      tenant_id: req.tenantId,
      name,
      slug,
      type,
      grid_config,
      regions,
      responsive_config,
      metadata,
    });
    res.status(201).json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
});

// List widgets for a page
router.get('/widgets', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const { page, region } = req.query;
    const widgets = await uiTemplateService.listWidgets(
      req.tenantId!,
      page as string,
      region as string
    );
    res.json({ success: true, data: widgets });
  } catch (error) {
    next(error);
  }
});

// Get widget by ID
router.get('/widgets/:widgetId', resolveTenant, async (req: AuthRequest, res, next) => {
  try {
    const { widgetId } = req.params;
    const widget = await uiTemplateService.getWidget(widgetId, req.tenantId!);
    res.json({ success: true, data: widget });
  } catch (error) {
    next(error);
  }
});

// Create widget
router.post('/widgets', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { component_id, page, region, position, props, visibility_rules, is_active } = req.body;
    const widget = await uiTemplateService.createWidget({
      tenant_id: req.tenantId!,
      component_id,
      page,
      region,
      position,
      props,
      visibility_rules,
      is_active,
    });
    res.status(201).json({ success: true, data: widget });
  } catch (error) {
    next(error);
  }
});

// Update widget
router.put('/widgets/:widgetId', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { widgetId } = req.params;
    const { position, props, visibility_rules, is_active } = req.body;
    const widget = await uiTemplateService.updateWidget(widgetId, req.tenantId!, {
      position,
      props,
      visibility_rules,
      is_active,
    });
    res.json({ success: true, data: widget });
  } catch (error) {
    next(error);
  }
});

// Delete widget
router.delete('/widgets/:widgetId', resolveTenant, verifyTenantToken, async (req: AuthRequest, res, next) => {
  try {
    const { widgetId } = req.params;
    await uiTemplateService.deleteWidget(widgetId, req.tenantId!);
    res.json({ success: true, message: 'Widget deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
