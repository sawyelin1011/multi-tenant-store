// UI Theme Types
export interface UIThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  border?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  [key: string]: string | undefined;
}

export interface UIThemeFonts {
  heading?: string;
  body?: string;
  mono?: string;
  sizes?: Record<string, string>;
  weights?: Record<string, string | number>;
}

export interface UIThemeSpacing {
  unit?: string;
  scale?: number[];
}

export interface UITheme {
  id: string;
  tenant_id?: string;
  name: string;
  slug: string;
  is_default: boolean;
  is_system: boolean;
  colors: UIThemeColors;
  fonts: UIThemeFonts;
  spacing: UIThemeSpacing;
  borders: Record<string, any>;
  shadows: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// UI Layout Types
export interface UILayoutRegion {
  name: string;
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  order?: number;
  [key: string]: any;
}

export interface UILayoutGridConfig {
  columns?: number;
  gap?: string;
  rows?: number;
  areas?: string[][];
  [key: string]: any;
}

export interface UILayoutResponsiveConfig {
  breakpoints?: Record<string, number>;
  [key: string]: any;
}

export interface UILayout {
  id: string;
  tenant_id?: string;
  plugin_id?: string;
  name: string;
  slug: string;
  type: string;
  is_system: boolean;
  grid_config: UILayoutGridConfig;
  regions: UILayoutRegion[];
  responsive_config: UILayoutResponsiveConfig;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// UI Component Types
export interface UIComponentPropsSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface UIComponentRenderConfig {
  template?: string;
  style?: Record<string, any>;
  className?: string;
  [key: string]: any;
}

export interface UIComponent {
  id: string;
  tenant_id?: string;
  plugin_id?: string;
  name: string;
  slug: string;
  type: string;
  category?: string;
  is_system: boolean;
  props_schema: UIComponentPropsSchema;
  default_props: Record<string, any>;
  render_config: UIComponentRenderConfig;
  dependencies: string[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// UI Widget Types
export interface UIWidgetVisibilityRule {
  condition?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

export interface UIWidget {
  id: string;
  tenant_id: string;
  component_id: string;
  page: string;
  region: string;
  position: number;
  props: Record<string, any>;
  visibility_rules: UIWidgetVisibilityRule;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// UI Template Types
export interface UITemplateOverrideConfig {
  layout?: Partial<UILayout>;
  theme?: Partial<UITheme>;
  widgets?: Partial<UIWidget>[];
  [key: string]: any;
}

export interface UITemplate {
  id: string;
  tenant_id?: string;
  plugin_id?: string;
  page: string;
  name: string;
  layout_id?: string;
  theme_id?: string;
  is_default: boolean;
  is_system: boolean;
  override_config: UITemplateOverrideConfig;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Resolved Template Types (with relationships)
export interface ResolvedUITemplate extends UITemplate {
  layout?: UILayout;
  theme?: UITheme;
  widgets?: Array<UIWidget & { component?: UIComponent }>;
}

// Input/Create Types
export interface CreateUIThemeInput {
  tenant_id?: string;
  name: string;
  slug: string;
  is_default?: boolean;
  colors?: UIThemeColors;
  fonts?: UIThemeFonts;
  spacing?: UIThemeSpacing;
  borders?: Record<string, any>;
  shadows?: Record<string, any>;
}

export interface CreateUILayoutInput {
  tenant_id?: string;
  plugin_id?: string;
  name: string;
  slug: string;
  type?: string;
  grid_config?: UILayoutGridConfig;
  regions?: UILayoutRegion[];
  responsive_config?: UILayoutResponsiveConfig;
  metadata?: Record<string, any>;
}

export interface CreateUIComponentInput {
  tenant_id?: string;
  plugin_id?: string;
  name: string;
  slug: string;
  type: string;
  category?: string;
  props_schema?: UIComponentPropsSchema;
  default_props?: Record<string, any>;
  render_config?: UIComponentRenderConfig;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface CreateUIWidgetInput {
  tenant_id: string;
  component_id: string;
  page: string;
  region: string;
  position?: number;
  props?: Record<string, any>;
  visibility_rules?: UIWidgetVisibilityRule;
  is_active?: boolean;
}

export interface CreateUITemplateInput {
  tenant_id?: string;
  plugin_id?: string;
  page: string;
  name: string;
  layout_id?: string;
  theme_id?: string;
  is_default?: boolean;
  override_config?: UITemplateOverrideConfig;
  metadata?: Record<string, any>;
}
