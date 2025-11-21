import path from 'node:path';
import fs from 'fs-extra';
import ora from 'ora';
import { camelCase, kebabCase, startCase, upperFirst } from 'lodash-es';

interface PluginAddComponentOptions {
  kind?: 'widget' | 'menu';
  dashboard?: string;
  label?: string;
}

export async function addPluginComponent(pluginDirectory: string, componentName: string, options: PluginAddComponentOptions): Promise<void> {
  const spinner = ora('Adding admin component').start();

  try {
    const pluginPath = path.resolve(pluginDirectory);
    const manifestPath = path.join(pluginPath, 'plugin.json');

    if (!(await fs.pathExists(manifestPath))) {
      throw new Error(`plugin.json not found in ${pluginPath}`);
    }

    const manifest = await fs.readJSON(manifestPath);
    manifest.admin_ui = manifest.admin_ui ?? {};

    const pascalName = upperFirst(camelCase(componentName));
    const relativeComponentPath = `src/admin/components/${pascalName}.tsx`;
    const componentPath = path.join(pluginPath, relativeComponentPath);

    if (await fs.pathExists(componentPath)) {
      throw new Error(`Component already exists: ${relativeComponentPath}`);
    }

    await fs.ensureDir(path.dirname(componentPath));

    const componentLabel = options.label ?? startCase(componentName);
    const componentContent = `export function ${pascalName}() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">${componentLabel} placeholder</p>
    </div>
  );
}
`;

    await fs.writeFile(componentPath, componentContent);

    if (options.kind === 'menu') {
      manifest.admin_ui.menu_items = manifest.admin_ui.menu_items ?? [];
      manifest.admin_ui.menu_items.push({
        label: componentLabel,
        path: `/plugins/${manifest.slug}/${kebabCase(componentName)}`,
        component: relativeComponentPath,
        icon: 'layout-dashboard',
        order: (manifest.admin_ui.menu_items.length + 1) * 100,
      });
    } else {
      manifest.admin_ui.widgets = manifest.admin_ui.widgets ?? [];
      manifest.admin_ui.widgets.push({
        id: kebabCase(componentName),
        component: relativeComponentPath,
        dashboard: options.dashboard ?? 'analytics',
        order: (manifest.admin_ui.widgets.length + 1) * 100,
      });
    }

    await fs.writeJSON(manifestPath, manifest, { spaces: 2 });

    spinner.succeed(`Component ${pascalName} added to ${pluginPath}`);
  } catch (error) {
    spinner.fail('Unable to add component');
    throw error;
  }
}
