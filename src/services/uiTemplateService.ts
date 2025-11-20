import { db } from '../config/database.js';
import {
  UITemplate,
  UITheme,
  UILayout,
  UIComponent,
  UIWidget,
  ResolvedUITemplate,
  CreateUITemplateInput,
  CreateUIThemeInput,
  CreateUILayoutInput,
  CreateUIComponentInput,
  CreateUIWidgetInput,
} from '../types/ui.js';
import { NotFoundError } from '../utils/errors.js';

export class UITemplateService {
  // Theme Methods
  async createTheme(data: CreateUIThemeInput): Promise<UITheme> {
    const theme = await db.one(
      `INSERT INTO ui_themes (tenant_id, name, slug, is_default, colors, fonts, spacing, borders, shadows)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.tenant_id || null,
        data.name,
        data.slug,
        data.is_default || false,
        JSON.stringify(data.colors || {}),
        JSON.stringify(data.fonts || {}),
        JSON.stringify(data.spacing || {}),
        JSON.stringify(data.borders || {}),
        JSON.stringify(data.shadows || {}),
      ]
    );
    return this.parseTheme(theme);
  }

  async getTheme(id: string, tenantId?: string): Promise<UITheme> {
    let query = 'SELECT * FROM ui_themes WHERE id = $1';
    const params: any[] = [id];

    if (tenantId) {
      query += ' AND (tenant_id = $2 OR tenant_id IS NULL)';
      params.push(tenantId);
    }

    const theme = await db.oneOrNone(query, params);
    if (!theme) throw new NotFoundError('Theme not found');
    return this.parseTheme(theme);
  }

  async getCurrentTheme(tenantId: string): Promise<UITheme> {
    const theme = await db.oneOrNone(
      `SELECT * FROM ui_themes 
       WHERE tenant_id = $1 AND is_default = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId]
    );

    if (theme) return this.parseTheme(theme);

    const systemTheme = await db.oneOrNone(
      'SELECT * FROM ui_themes WHERE is_system = true AND is_default = true LIMIT 1'
    );

    if (!systemTheme) throw new NotFoundError('No theme available');
    return this.parseTheme(systemTheme);
  }

  async listThemes(tenantId?: string): Promise<UITheme[]> {
    let query = 'SELECT * FROM ui_themes';
    const params: any[] = [];

    if (tenantId) {
      query += ' WHERE tenant_id = $1 OR tenant_id IS NULL';
      params.push(tenantId);
    } else {
      query += ' WHERE is_system = true';
    }

    query += ' ORDER BY is_system DESC, is_default DESC, name ASC';
    const themes = await db.manyOrNone(query, params);
    return themes ? themes.map((t) => this.parseTheme(t)) : [];
  }

  async updateTheme(id: string, tenantId: string, data: Partial<UITheme>): Promise<UITheme> {
    const theme = await db.one(
      `UPDATE ui_themes
       SET name = COALESCE($3, name),
           slug = COALESCE($4, slug),
           is_default = COALESCE($5, is_default),
           colors = COALESCE($6, colors),
           fonts = COALESCE($7, fonts),
           spacing = COALESCE($8, spacing),
           borders = COALESCE($9, borders),
           shadows = COALESCE($10, shadows),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.name,
        data.slug,
        data.is_default,
        data.colors ? JSON.stringify(data.colors) : null,
        data.fonts ? JSON.stringify(data.fonts) : null,
        data.spacing ? JSON.stringify(data.spacing) : null,
        data.borders ? JSON.stringify(data.borders) : null,
        data.shadows ? JSON.stringify(data.shadows) : null,
      ]
    );
    return this.parseTheme(theme);
  }

  // Layout Methods
  async createLayout(data: CreateUILayoutInput): Promise<UILayout> {
    const layout = await db.one(
      `INSERT INTO ui_layouts (tenant_id, plugin_id, name, slug, type, grid_config, regions, responsive_config, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.tenant_id || null,
        data.plugin_id || null,
        data.name,
        data.slug,
        data.type || 'page',
        JSON.stringify(data.grid_config || {}),
        JSON.stringify(data.regions || []),
        JSON.stringify(data.responsive_config || {}),
        JSON.stringify(data.metadata || {}),
      ]
    );
    return this.parseLayout(layout);
  }

  async getLayout(id: string, tenantId?: string): Promise<UILayout> {
    let query = 'SELECT * FROM ui_layouts WHERE id = $1';
    const params: any[] = [id];

    if (tenantId) {
      query += ' AND (tenant_id = $2 OR tenant_id IS NULL)';
      params.push(tenantId);
    }

    const layout = await db.oneOrNone(query, params);
    if (!layout) throw new NotFoundError('Layout not found');
    return this.parseLayout(layout);
  }

  async listLayouts(tenantId?: string, type?: string): Promise<UILayout[]> {
    let query = 'SELECT * FROM ui_layouts';
    const params: any[] = [];
    const conditions: string[] = [];

    if (tenantId) {
      conditions.push('(tenant_id = $1 OR tenant_id IS NULL)');
      params.push(tenantId);
    } else {
      conditions.push('is_system = true');
    }

    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY is_system DESC, name ASC';
    const layouts = await db.manyOrNone(query, params);
    return layouts ? layouts.map((l) => this.parseLayout(l)) : [];
  }

  // Component Methods
  async createComponent(data: CreateUIComponentInput): Promise<UIComponent> {
    const component = await db.one(
      `INSERT INTO ui_components (tenant_id, plugin_id, name, slug, type, category, props_schema, default_props, render_config, dependencies, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.tenant_id || null,
        data.plugin_id || null,
        data.name,
        data.slug,
        data.type,
        data.category || null,
        JSON.stringify(data.props_schema || {}),
        JSON.stringify(data.default_props || {}),
        JSON.stringify(data.render_config || {}),
        JSON.stringify(data.dependencies || []),
        JSON.stringify(data.metadata || {}),
      ]
    );
    return this.parseComponent(component);
  }

  async getComponent(id: string, tenantId?: string): Promise<UIComponent> {
    let query = 'SELECT * FROM ui_components WHERE id = $1';
    const params: any[] = [id];

    if (tenantId) {
      query += ' AND (tenant_id = $2 OR tenant_id IS NULL)';
      params.push(tenantId);
    }

    const component = await db.oneOrNone(query, params);
    if (!component) throw new NotFoundError('Component not found');
    return this.parseComponent(component);
  }

  async listComponents(tenantId?: string, type?: string, category?: string): Promise<UIComponent[]> {
    let query = 'SELECT * FROM ui_components';
    const params: any[] = [];
    const conditions: string[] = [];

    if (tenantId) {
      conditions.push('(tenant_id = $1 OR tenant_id IS NULL)');
      params.push(tenantId);
    } else {
      conditions.push('is_system = true');
    }

    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }

    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY category ASC, name ASC';
    const components = await db.manyOrNone(query, params);
    return components ? components.map((c) => this.parseComponent(c)) : [];
  }

  // Widget Methods
  async createWidget(data: CreateUIWidgetInput): Promise<UIWidget> {
    const widget = await db.one(
      `INSERT INTO ui_widgets (tenant_id, component_id, page, region, position, props, visibility_rules, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.tenant_id,
        data.component_id,
        data.page,
        data.region,
        data.position || 0,
        JSON.stringify(data.props || {}),
        JSON.stringify(data.visibility_rules || {}),
        data.is_active !== false,
      ]
    );
    return this.parseWidget(widget);
  }

  async getWidget(id: string, tenantId: string): Promise<UIWidget> {
    const widget = await db.oneOrNone(
      'SELECT * FROM ui_widgets WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!widget) throw new NotFoundError('Widget not found');
    return this.parseWidget(widget);
  }

  async listWidgets(tenantId: string, page?: string, region?: string): Promise<UIWidget[]> {
    let query = 'SELECT * FROM ui_widgets WHERE tenant_id = $1';
    const params: any[] = [tenantId];

    if (page) {
      query += ' AND page = $2';
      params.push(page);
    }

    if (region) {
      query += ` AND region = $${params.length + 1}`;
      params.push(region);
    }

    query += ' ORDER BY region ASC, position ASC';
    const widgets = await db.manyOrNone(query, params);
    return widgets ? widgets.map((w) => this.parseWidget(w)) : [];
  }

  async updateWidget(id: string, tenantId: string, data: Partial<UIWidget>): Promise<UIWidget> {
    const widget = await db.one(
      `UPDATE ui_widgets
       SET position = COALESCE($3, position),
           props = COALESCE($4, props),
           visibility_rules = COALESCE($5, visibility_rules),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.position,
        data.props ? JSON.stringify(data.props) : null,
        data.visibility_rules ? JSON.stringify(data.visibility_rules) : null,
        data.is_active,
      ]
    );
    return this.parseWidget(widget);
  }

  async deleteWidget(id: string, tenantId: string): Promise<void> {
    await db.none('DELETE FROM ui_widgets WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }

  // Template Methods
  async createTemplate(data: CreateUITemplateInput): Promise<UITemplate> {
    const template = await db.one(
      `INSERT INTO ui_templates (tenant_id, plugin_id, page, name, layout_id, theme_id, is_default, override_config, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.tenant_id || null,
        data.plugin_id || null,
        data.page,
        data.name,
        data.layout_id || null,
        data.theme_id || null,
        data.is_default || false,
        JSON.stringify(data.override_config || {}),
        JSON.stringify(data.metadata || {}),
      ]
    );
    return this.parseTemplate(template);
  }

  async getTemplate(page: string, tenantId?: string): Promise<UITemplate> {
    let query = 'SELECT * FROM ui_templates WHERE page = $1';
    const params: any[] = [page];

    if (tenantId) {
      query += ' AND (tenant_id = $2 OR tenant_id IS NULL)';
      params.push(tenantId);
    }

    query += ' ORDER BY tenant_id NULLS LAST LIMIT 1';

    const template = await db.oneOrNone(query, params);
    if (!template) throw new NotFoundError('Template not found');
    return this.parseTemplate(template);
  }

  async resolveTemplate(page: string, tenantId: string): Promise<ResolvedUITemplate> {
    const template = await this.getTemplate(page, tenantId);

    const resolved: ResolvedUITemplate = { ...template };

    if (template.layout_id) {
      resolved.layout = await this.getLayout(template.layout_id, tenantId);
    }

    if (template.theme_id) {
      resolved.theme = await this.getTheme(template.theme_id, tenantId);
    } else {
      resolved.theme = await this.getCurrentTheme(tenantId);
    }

    const widgets = await this.listWidgets(tenantId, page);
    resolved.widgets = await Promise.all(
      widgets.map(async (widget) => {
        const component = await this.getComponent(widget.component_id, tenantId);
        return { ...widget, component };
      })
    );

    if (template.tenant_id === null) {
      const tenant = await db.oneOrNone('SELECT branding FROM tenants WHERE id = $1', [tenantId]);
      if (tenant?.branding && resolved.theme) {
        resolved.theme = this.mergeBrandingIntoTheme(resolved.theme, tenant.branding);
      }
    }

    return resolved;
  }

  async updateTemplate(page: string, tenantId: string, data: Partial<UITemplate>): Promise<UITemplate> {
    const template = await db.one(
      `UPDATE ui_templates
       SET name = COALESCE($3, name),
           layout_id = COALESCE($4, layout_id),
           theme_id = COALESCE($5, theme_id),
           is_default = COALESCE($6, is_default),
           override_config = COALESCE($7, override_config),
           metadata = COALESCE($8, metadata),
           updated_at = CURRENT_TIMESTAMP
       WHERE page = $1 AND tenant_id = $2
       RETURNING *`,
      [
        page,
        tenantId,
        data.name,
        data.layout_id,
        data.theme_id,
        data.is_default,
        data.override_config ? JSON.stringify(data.override_config) : null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
    return this.parseTemplate(template);
  }

  // Helper Methods
  private mergeBrandingIntoTheme(theme: UITheme, branding: any): UITheme {
    const merged = { ...theme };

    if (branding.colors) {
      merged.colors = { ...theme.colors, ...branding.colors };
    }

    if (branding.fonts) {
      merged.fonts = { ...theme.fonts, ...branding.fonts };
    }

    if (branding.logo) {
      merged.metadata = { ...theme.metadata, logo: branding.logo };
    }

    return merged;
  }

  private parseTheme(theme: any): UITheme {
    return {
      ...theme,
      colors: this.parseJSON(theme.colors),
      fonts: this.parseJSON(theme.fonts),
      spacing: this.parseJSON(theme.spacing),
      borders: this.parseJSON(theme.borders),
      shadows: this.parseJSON(theme.shadows),
      created_at: new Date(theme.created_at),
      updated_at: new Date(theme.updated_at),
    };
  }

  private parseLayout(layout: any): UILayout {
    return {
      ...layout,
      grid_config: this.parseJSON(layout.grid_config),
      regions: this.parseJSON(layout.regions),
      responsive_config: this.parseJSON(layout.responsive_config),
      metadata: this.parseJSON(layout.metadata),
      created_at: new Date(layout.created_at),
      updated_at: new Date(layout.updated_at),
    };
  }

  private parseComponent(component: any): UIComponent {
    return {
      ...component,
      props_schema: this.parseJSON(component.props_schema),
      default_props: this.parseJSON(component.default_props),
      render_config: this.parseJSON(component.render_config),
      dependencies: this.parseJSON(component.dependencies),
      metadata: this.parseJSON(component.metadata),
      created_at: new Date(component.created_at),
      updated_at: new Date(component.updated_at),
    };
  }

  private parseWidget(widget: any): UIWidget {
    return {
      ...widget,
      props: this.parseJSON(widget.props),
      visibility_rules: this.parseJSON(widget.visibility_rules),
      created_at: new Date(widget.created_at),
      updated_at: new Date(widget.updated_at),
    };
  }

  private parseTemplate(template: any): UITemplate {
    return {
      ...template,
      override_config: this.parseJSON(template.override_config),
      metadata: this.parseJSON(template.metadata),
      created_at: new Date(template.created_at),
      updated_at: new Date(template.updated_at),
    };
  }

  private parseJSON(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value || {};
  }
}

export const uiTemplateService = new UITemplateService();
