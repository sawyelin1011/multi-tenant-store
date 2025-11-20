import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { uiTemplateService } from '../services/uiTemplateService.js';
import { db } from '../config/database.js';

describe('UITemplateService', () => {
  let testTenantId: string;
  let testThemeId: string;
  let testLayoutId: string;
  let testComponentId: string;
  let testWidgetId: string;

  beforeAll(async () => {
    const tenant = await db.one(
      `INSERT INTO tenants (slug, name, branding)
       VALUES ('test-ui-tenant', 'Test UI Tenant', '{"colors": {"primary": "#ff0000"}}')
       RETURNING id`
    );
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    await db.none('DELETE FROM tenants WHERE id = $1', [testTenantId]);
  });

  describe('Theme Management', () => {
    it('should create a theme', async () => {
      const theme = await uiTemplateService.createTheme({
        tenant_id: testTenantId,
        name: 'Test Theme',
        slug: 'test-theme',
        is_default: true,
        colors: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
      });

      expect(theme).toBeDefined();
      expect(theme.name).toBe('Test Theme');
      expect(theme.colors.primary).toBe('#3b82f6');
      testThemeId = theme.id;
    });

    it('should get theme by id', async () => {
      const theme = await uiTemplateService.getTheme(testThemeId, testTenantId);
      expect(theme).toBeDefined();
      expect(theme.id).toBe(testThemeId);
      expect(theme.name).toBe('Test Theme');
    });

    it('should list themes', async () => {
      const themes = await uiTemplateService.listThemes(testTenantId);
      expect(themes).toBeDefined();
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
    });

    it('should update theme', async () => {
      const updated = await uiTemplateService.updateTheme(testThemeId, testTenantId, {
        name: 'Updated Theme',
        colors: {
          primary: '#10b981',
        },
      });
      expect(updated.name).toBe('Updated Theme');
      expect(updated.colors.primary).toBe('#10b981');
    });

    it('should get current theme with branding merged', async () => {
      const theme = await uiTemplateService.getCurrentTheme(testTenantId);
      expect(theme).toBeDefined();
    });
  });

  describe('Layout Management', () => {
    it('should create a layout', async () => {
      const layout = await uiTemplateService.createLayout({
        tenant_id: testTenantId,
        name: 'Test Layout',
        slug: 'test-layout',
        type: 'page',
        grid_config: {
          columns: 12,
          gap: '1rem',
        },
        regions: [
          { name: 'header', width: '100%' },
          { name: 'main', width: '1fr' },
        ],
      });

      expect(layout).toBeDefined();
      expect(layout.name).toBe('Test Layout');
      expect(layout.grid_config.columns).toBe(12);
      testLayoutId = layout.id;
    });

    it('should get layout by id', async () => {
      const layout = await uiTemplateService.getLayout(testLayoutId, testTenantId);
      expect(layout).toBeDefined();
      expect(layout.id).toBe(testLayoutId);
    });

    it('should list layouts', async () => {
      const layouts = await uiTemplateService.listLayouts(testTenantId);
      expect(layouts).toBeDefined();
      expect(Array.isArray(layouts)).toBe(true);
    });
  });

  describe('Component Management', () => {
    it('should create a component', async () => {
      const component = await uiTemplateService.createComponent({
        tenant_id: testTenantId,
        name: 'Test Component',
        slug: 'test-component',
        type: 'widget',
        category: 'dashboard',
        props_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
          },
        },
        default_props: {
          title: 'Default Title',
        },
      });

      expect(component).toBeDefined();
      expect(component.name).toBe('Test Component');
      expect(component.type).toBe('widget');
      testComponentId = component.id;
    });

    it('should get component by id', async () => {
      const component = await uiTemplateService.getComponent(testComponentId, testTenantId);
      expect(component).toBeDefined();
      expect(component.id).toBe(testComponentId);
    });

    it('should list components', async () => {
      const components = await uiTemplateService.listComponents(testTenantId);
      expect(components).toBeDefined();
      expect(Array.isArray(components)).toBe(true);
    });

    it('should filter components by type', async () => {
      const components = await uiTemplateService.listComponents(testTenantId, 'widget');
      expect(components).toBeDefined();
      expect(components.every((c) => c.type === 'widget')).toBe(true);
    });
  });

  describe('Widget Management', () => {
    it('should create a widget', async () => {
      const widget = await uiTemplateService.createWidget({
        tenant_id: testTenantId,
        component_id: testComponentId,
        page: 'dashboard',
        region: 'main',
        position: 0,
        props: {
          title: 'Test Widget',
        },
        is_active: true,
      });

      expect(widget).toBeDefined();
      expect(widget.page).toBe('dashboard');
      expect(widget.props.title).toBe('Test Widget');
      testWidgetId = widget.id;
    });

    it('should get widget by id', async () => {
      const widget = await uiTemplateService.getWidget(testWidgetId, testTenantId);
      expect(widget).toBeDefined();
      expect(widget.id).toBe(testWidgetId);
    });

    it('should list widgets', async () => {
      const widgets = await uiTemplateService.listWidgets(testTenantId);
      expect(widgets).toBeDefined();
      expect(Array.isArray(widgets)).toBe(true);
    });

    it('should filter widgets by page', async () => {
      const widgets = await uiTemplateService.listWidgets(testTenantId, 'dashboard');
      expect(widgets).toBeDefined();
      expect(widgets.every((w) => w.page === 'dashboard')).toBe(true);
    });

    it('should update widget', async () => {
      const updated = await uiTemplateService.updateWidget(testWidgetId, testTenantId, {
        position: 5,
        props: {
          title: 'Updated Widget',
        },
      });
      expect(updated.position).toBe(5);
      expect(updated.props.title).toBe('Updated Widget');
    });

    it('should delete widget', async () => {
      await uiTemplateService.deleteWidget(testWidgetId, testTenantId);
      await expect(uiTemplateService.getWidget(testWidgetId, testTenantId)).rejects.toThrow();
    });
  });

  describe('Template Management', () => {
    it('should create a template', async () => {
      const template = await uiTemplateService.createTemplate({
        tenant_id: testTenantId,
        page: 'test-page',
        name: 'Test Page Template',
        layout_id: testLayoutId,
        theme_id: testThemeId,
        is_default: true,
      });

      expect(template).toBeDefined();
      expect(template.page).toBe('test-page');
      expect(template.name).toBe('Test Page Template');
    });

    it('should get template by page', async () => {
      const template = await uiTemplateService.getTemplate('test-page', testTenantId);
      expect(template).toBeDefined();
      expect(template.page).toBe('test-page');
    });

    it('should resolve template with all relationships', async () => {
      const widget = await uiTemplateService.createWidget({
        tenant_id: testTenantId,
        component_id: testComponentId,
        page: 'test-page',
        region: 'main',
        position: 0,
        props: {},
        is_active: true,
      });

      const resolved = await uiTemplateService.resolveTemplate('test-page', testTenantId);
      expect(resolved).toBeDefined();
      expect(resolved.layout).toBeDefined();
      expect(resolved.theme).toBeDefined();
      expect(resolved.widgets).toBeDefined();
      expect(resolved.widgets.length).toBeGreaterThan(0);
      expect(resolved.widgets[0].component).toBeDefined();

      await uiTemplateService.deleteWidget(widget.id, testTenantId);
    });

    it('should update template', async () => {
      const updated = await uiTemplateService.updateTemplate('test-page', testTenantId, {
        name: 'Updated Template',
      });
      expect(updated.name).toBe('Updated Template');
    });
  });
});
