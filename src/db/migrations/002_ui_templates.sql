-- UI Template System Tables

-- UI Themes: Define color schemes, fonts, and styling
CREATE TABLE IF NOT EXISTS ui_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  colors JSONB DEFAULT '{}',
  fonts JSONB DEFAULT '{}',
  spacing JSONB DEFAULT '{}',
  borders JSONB DEFAULT '{}',
  shadows JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_ui_themes_tenant_id ON ui_themes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ui_themes_slug ON ui_themes(slug);

-- UI Layouts: Define page structure and grid systems
CREATE TABLE IF NOT EXISTS ui_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plugin_id UUID REFERENCES plugins(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'page',
  is_system BOOLEAN DEFAULT false,
  grid_config JSONB DEFAULT '{}',
  regions JSONB DEFAULT '[]',
  responsive_config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_ui_layouts_tenant_id ON ui_layouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ui_layouts_plugin_id ON ui_layouts(plugin_id);
CREATE INDEX IF NOT EXISTS idx_ui_layouts_slug ON ui_layouts(slug);
CREATE INDEX IF NOT EXISTS idx_ui_layouts_type ON ui_layouts(type);

-- UI Components: Reusable UI building blocks
CREATE TABLE IF NOT EXISTS ui_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plugin_id UUID REFERENCES plugins(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  is_system BOOLEAN DEFAULT false,
  props_schema JSONB DEFAULT '{}',
  default_props JSONB DEFAULT '{}',
  render_config JSONB DEFAULT '{}',
  dependencies JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_ui_components_tenant_id ON ui_components(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ui_components_plugin_id ON ui_components(plugin_id);
CREATE INDEX IF NOT EXISTS idx_ui_components_slug ON ui_components(slug);
CREATE INDEX IF NOT EXISTS idx_ui_components_type ON ui_components(type);
CREATE INDEX IF NOT EXISTS idx_ui_components_category ON ui_components(category);

-- UI Widgets: Configured instances of components for specific pages
CREATE TABLE IF NOT EXISTS ui_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  component_id UUID REFERENCES ui_components(id) ON DELETE CASCADE,
  page VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  position INTEGER DEFAULT 0,
  props JSONB DEFAULT '{}',
  visibility_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ui_widgets_tenant_id ON ui_widgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ui_widgets_component_id ON ui_widgets(component_id);
CREATE INDEX IF NOT EXISTS idx_ui_widgets_page ON ui_widgets(page);
CREATE INDEX IF NOT EXISTS idx_ui_widgets_page_region ON ui_widgets(page, region);

-- UI Templates: Complete page configurations combining layout, theme, and widgets
CREATE TABLE IF NOT EXISTS ui_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plugin_id UUID REFERENCES plugins(id) ON DELETE SET NULL,
  page VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  layout_id UUID REFERENCES ui_layouts(id),
  theme_id UUID REFERENCES ui_themes(id),
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  override_config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, page)
);

CREATE INDEX IF NOT EXISTS idx_ui_templates_tenant_id ON ui_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ui_templates_plugin_id ON ui_templates(plugin_id);
CREATE INDEX IF NOT EXISTS idx_ui_templates_page ON ui_templates(page);
CREATE INDEX IF NOT EXISTS idx_ui_templates_layout_id ON ui_templates(layout_id);
CREATE INDEX IF NOT EXISTS idx_ui_templates_theme_id ON ui_templates(theme_id);
