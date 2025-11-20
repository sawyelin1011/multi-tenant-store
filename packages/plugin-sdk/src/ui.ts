import { z } from 'zod';

// UI component types for plugin contributions
export interface UIComponent {
  id: string;
  name: string;
  description?: string;
  component: any; // React component
  props?: Record<string, any>;
  permissions?: string[];
  category?: 'settings' | 'widget' | 'page' | 'modal' | 'form';
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  component: any; // React widget component
  dashboard: 'main' | 'analytics' | 'orders' | 'products' | 'customers';
  order: number;
  permissions?: string[];
  size?: {
    width: number;
    height: number;
  };
  refreshInterval?: number; // seconds
}

export interface MenuItem {
  label: string;
  path: string;
  component?: any; // React page component
  icon?: string;
  order: number;
  permissions?: string[];
  badge?: {
    count: number;
    color: string;
  };
  children?: MenuItem[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string; // Custom validation function name
  };
  options?: Array<{
    label: string;
    value: any;
  }>;
  defaultValue?: any;
  group?: string;
  order: number;
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  groups?: Array<{
    id: string;
    title: string;
    description?: string;
    order: number;
  }>;
  validation?: {
    // Global form validation rules
  };
}

export interface DataTableColumn {
  key: string;
  title: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'component' | 'action';
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  component?: any; // Custom component for rendering
  format?: (value: any, row: any) => string;
  actions?: Array<{
    label: string;
    action: string;
    icon?: string;
    permission?: string;
    dangerous?: boolean;
  }>;
}

export interface DataTableConfig {
  id: string;
  title: string;
  description?: string;
  columns: DataTableColumn[];
  dataSource: string; // API endpoint
  filters?: FormField[];
  actions?: Array<{
    label: string;
    action: string;
    icon?: string;
    permission?: string;
    bulk?: boolean;
  }>;
  pagination?: {
    enabled: boolean;
    pageSize: number;
    showSizeSelector: boolean;
  };
  sorting?: {
    enabled: boolean;
    defaultSort?: {
      key: string;
      direction: 'asc' | 'desc';
    };
  };
}

export interface ChartConfig {
  id: string;
  title: string;
  description?: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'gauge';
  dataSource: string; // API endpoint
  xAxis?: {
    key: string;
    label: string;
    type: 'category' | 'time' | 'value';
  };
  yAxis?: {
    key: string;
    label: string;
    type: 'value' | 'percentage';
  };
  series?: Array<{
    key: string;
    label: string;
    color?: string;
    type?: string;
  }>;
  filters?: FormField[];
  refreshInterval?: number; // seconds
  height?: number;
}

// UI component registry
export class UIComponentRegistry {
  private static components: Map<string, UIComponent> = new Map();
  private static widgets: Map<string, WidgetDefinition> = new Map();
  private static menuItems: MenuItem[] = [];
  private static forms: Map<string, FormSchema> = new Map();
  private static tables: Map<string, DataTableConfig> = new Map();
  private static charts: Map<string, ChartConfig> = new Map();

  // Component registration
  static registerComponent(component: UIComponent): void {
    this.components.set(component.id, component);
  }

  static getComponent(id: string): UIComponent | undefined {
    return this.components.get(id);
  }

  static getComponentsByCategory(category: string): UIComponent[] {
    return Array.from(this.components.values()).filter(c => c.category === category);
  }

  static listComponents(): UIComponent[] {
    return Array.from(this.components.values());
  }

  // Widget registration
  static registerWidget(widget: WidgetDefinition): void {
    this.widgets.set(widget.id, widget);
  }

  static getWidget(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  static getWidgetsByDashboard(dashboard: string): WidgetDefinition[] {
    return Array.from(this.widgets.values())
      .filter(w => w.dashboard === dashboard)
      .sort((a, b) => a.order - b.order);
  }

  static listWidgets(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  // Menu item registration
  static registerMenuItem(menuItem: MenuItem): void {
    this.menuItems.push(menuItem);
    // Sort by order
    this.menuItems.sort((a, b) => a.order - b.order);
  }

  static getMenuItems(): MenuItem[] {
    return [...this.menuItems];
  }

  static getMenuItemsByPermission(permissions: string[]): MenuItem[] {
    return this.menuItems.filter(item => 
      !item.permissions || item.permissions.some(p => permissions.includes(p))
    );
  }

  // Form schema registration
  static registerForm(form: FormSchema): void {
    this.forms.set(form.id, form);
  }

  static getForm(id: string): FormSchema | undefined {
    return this.forms.get(id);
  }

  static listForms(): FormSchema[] {
    return Array.from(this.forms.values());
  }

  // Data table registration
  static registerTable(table: DataTableConfig): void {
    this.tables.set(table.id, table);
  }

  static getTable(id: string): DataTableConfig | undefined {
    return this.tables.get(id);
  }

  static listTables(): DataTableConfig[] {
    return Array.from(this.tables.values());
  }

  // Chart registration
  static registerChart(chart: ChartConfig): void {
    this.charts.set(chart.id, chart);
  }

  static getChart(id: string): ChartConfig | undefined {
    return this.charts.get(id);
  }

  static listCharts(): ChartConfig[] {
    return Array.from(this.charts.values());
  }

  // Clear all registrations
  static clear(): void {
    this.components.clear();
    this.widgets.clear();
    this.menuItems = [];
    this.forms.clear();
    this.tables.clear();
    this.charts.clear();
  }

  // Export registry state
  static export(): {
    components: UIComponent[];
    widgets: WidgetDefinition[];
    menuItems: MenuItem[];
    forms: FormSchema[];
    tables: DataTableConfig[];
    charts: ChartConfig[];
  } {
    return {
      components: this.listComponents(),
      widgets: this.listWidgets(),
      menuItems: this.getMenuItems(),
      forms: this.listForms(),
      tables: this.listTables(),
      charts: this.listCharts(),
    };
  }
}

// UI component builders
export class ComponentBuilder {
  private component: Partial<UIComponent> = {};

  constructor(id: string, name: string) {
    this.component.id = id;
    this.component.name = name;
  }

  description(desc: string): ComponentBuilder {
    this.component.description = desc;
    return this;
  }

  componentType(comp: any): ComponentBuilder {
    this.component.component = comp;
    return this;
  }

  props(props: Record<string, any>): ComponentBuilder {
    this.component.props = props;
    return this;
  }

  permissions(perms: string[]): ComponentBuilder {
    this.component.permissions = perms;
    return this;
  }

  category(cat: 'settings' | 'widget' | 'page' | 'modal' | 'form'): ComponentBuilder {
    this.component.category = cat;
    return this;
  }

  build(): UIComponent {
    if (!this.component.id || !this.component.name || !this.component.component) {
      throw new Error('Component must have id, name, and component');
    }
    return this.component as UIComponent;
  }

  register(): void {
    UIComponentRegistry.registerComponent(this.build());
  }
}

export class WidgetBuilder {
  private widget: Partial<WidgetDefinition> = {};

  constructor(id: string, name: string) {
    this.widget.id = id;
    this.widget.name = name;
  }

  description(desc: string): WidgetBuilder {
    this.widget.description = desc;
    return this;
  }

  component(comp: any): WidgetBuilder {
    this.widget.component = comp;
    return this;
  }

  dashboard(dash: 'main' | 'analytics' | 'orders' | 'products' | 'customers'): WidgetBuilder {
    this.widget.dashboard = dash;
    return this;
  }

  order(ord: number): WidgetBuilder {
    this.widget.order = ord;
    return this;
  }

  permissions(perms: string[]): WidgetBuilder {
    this.widget.permissions = perms;
    return this;
  }

  size(width: number, height: number): WidgetBuilder {
    this.widget.size = { width, height };
    return this;
  }

  refreshInterval(seconds: number): WidgetBuilder {
    this.widget.refreshInterval = seconds;
    return this;
  }

  build(): WidgetDefinition {
    if (!this.widget.id || !this.widget.name || !this.widget.component || !this.widget.dashboard) {
      throw new Error('Widget must have id, name, component, and dashboard');
    }
    return this.widget as WidgetDefinition;
  }

  register(): void {
    UIComponentRegistry.registerWidget(this.build());
  }
}

export class MenuItemBuilder {
  private menuItem: Partial<MenuItem> = {};

  constructor(label: string, path: string) {
    this.menuItem.label = label;
    this.menuItem.path = path;
  }

  component(comp: any): MenuItemBuilder {
    this.menuItem.component = comp;
    return this;
  }

  icon(icon: string): MenuItemBuilder {
    this.menuItem.icon = icon;
    return this;
  }

  order(ord: number): MenuItemBuilder {
    this.menuItem.order = ord;
    return this;
  }

  permissions(perms: string[]): MenuItemBuilder {
    this.menuItem.permissions = perms;
    return this;
  }

  badge(count: number, color: string): MenuItemBuilder {
    this.menuItem.badge = { count, color };
    return this;
  }

  children(items: MenuItem[]): MenuItemBuilder {
    this.menuItem.children = items;
    return this;
  }

  build(): MenuItem {
    if (!this.menuItem.label || !this.menuItem.path) {
      throw new Error('MenuItem must have label and path');
    }
    return this.menuItem as MenuItem;
  }

  register(): void {
    UIComponentRegistry.registerMenuItem(this.build());
  }
}

// Factory functions
export function createComponent(id: string, name: string): ComponentBuilder {
  return new ComponentBuilder(id, name);
}

export function createWidget(id: string, name: string): WidgetBuilder {
  return new WidgetBuilder(id, name);
}

export function createMenuItem(label: string, path: string): MenuItemBuilder {
  return new MenuItemBuilder(label, path);
}

// Common shadcn/ui component configurations
export const ShadcnComponents = {
  // Form components
  input: (name: string, label: string, options: Partial<FormField> = {}) => ({
    name,
    label,
    type: 'text' as const,
    ...options,
  }),

  textarea: (name: string, label: string, options: Partial<FormField> = {}) => ({
    name,
    label,
    type: 'textarea' as const,
    ...options,
  }),

  select: (name: string, label: string, options: string[], opts: Partial<FormField> = {}) => ({
    name,
    label,
    type: 'select' as const,
    options: options.map(opt => ({ label: opt, value: opt })),
    ...opts,
  }),

  checkbox: (name: string, label: string, options: Partial<FormField> = {}) => ({
    name,
    label,
    type: 'checkbox' as const,
    ...options,
  }),

  // Table configurations
  table: (id: string, title: string, columns: DataTableColumn[]): DataTableConfig => ({
    id,
    title,
    columns,
    dataSource: '',
    pagination: {
      enabled: true,
      pageSize: 20,
      showSizeSelector: true,
    },
    sorting: {
      enabled: true,
    },
  }),

  // Chart configurations
  lineChart: (id: string, title: string, dataSource: string): ChartConfig => ({
    id,
    title,
    type: 'line',
    dataSource,
  }),

  barChart: (id: string, title: string, dataSource: string): ChartConfig => ({
    id,
    title,
    type: 'bar',
    dataSource,
  }),

  pieChart: (id: string, title: string, dataSource: string): ChartConfig => ({
    id,
    title,
    type: 'pie',
    dataSource,
  }),
};

// All exports are already handled by individual exports above