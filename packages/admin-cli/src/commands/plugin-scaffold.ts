import path from 'node:path';
import fs from 'fs-extra';
import ora from 'ora';
import Handlebars from 'handlebars';
import { camelCase, kebabCase, startCase, upperFirst } from 'lodash-es';
import { resolveBrandConfig, extractBrandOptions, getScopedPackageName } from '../utils/brand.js';
import { PLUGIN_TEMPLATE_ROOT } from '../utils/paths.js';
import { pluginPresets, type PluginType, SUPPORTED_PLUGIN_TYPES } from '../templates/plugin-presets.js';

Handlebars.registerHelper('json', (value: unknown) => JSON.stringify(value, null, 2));

interface PluginScaffoldOptions {
  type: PluginType;
  directory?: string;
  template?: string;
  description?: string;
  author?: string;
  slug?: string;
  force?: boolean;
  brand?: string;
  scope?: string;
  platformName?: string;
  docsUrl?: string;
  supportEmail?: string;
  npmOrg?: string;
  githubOrg?: string;
  brandColor?: string;
  brandLogo?: string;
  cliName?: string;
}

export async function scaffoldPlugin(name: string, rawOptions: PluginScaffoldOptions): Promise<void> {
  const spinner = ora('Scaffolding plugin').start();

  try {
    const options = normalizeOptions(rawOptions);
    const type = options.type;
    const preset = pluginPresets[type];

    if (!preset) {
      throw new Error(`Unsupported plugin type "${type}". Supported types: ${SUPPORTED_PLUGIN_TYPES.join(', ')}`);
    }

    const brandConfig = resolveBrandConfig(extractBrandOptions(options));
    const slug = options.slug ?? kebabCase(name);
    const targetDir = path.resolve(options.directory ?? process.cwd(), slug);

    if (await fs.pathExists(targetDir)) {
      if (!options.force) {
        throw new Error(`Directory already exists at ${targetDir}. Use --force to overwrite.`);
      }
    } else {
      await fs.ensureDir(targetDir);
    }

    const displayName = startCase(name);
    const className = `${upperFirst(camelCase(slug))}`;
    const templateDir = path.resolve(options.template ?? path.join(PLUGIN_TEMPLATE_ROOT, 'base'));

    if (!(await fs.pathExists(templateDir))) {
      throw new Error(`Template directory missing: ${templateDir}`);
    }

    const hydratedPreset = applySlugToObject(preset, slug);
    const sdkPackageName = `@${brandConfig.packageScope}/plugin-sdk`;

    const context = {
      name: displayName,
      slug,
      description: options.description ?? preset.description,
      author: options.author ?? brandConfig.brandName,
      type,
      className,
      brand: brandConfig,
      packageScope: brandConfig.packageScope,
      sdkPackageName,
      npmName: getScopedPackageName(brandConfig.packageScope, slug),
      pluginInterface: preset.pluginInterface,
      categoryEnum: preset.categoryEnum,
      hooks: hydratedPreset.hooks,
      apiEndpoints: hydratedPreset.apiEndpoints,
      adminUi: hydratedPreset.adminUi,
      settingsSchema: hydratedPreset.settingsSchema,
      migrations: hydratedPreset.migrations ?? [],
      lifecycleSnippet: preset.lifecycleSnippet,
    };

    await copyTemplate(templateDir, targetDir, context);
    await createHookFiles(context, targetDir);
    await createApiFiles(context, targetDir);
    await createAdminComponents(context, targetDir);
    await createMigrationFiles(context, targetDir);

    spinner.succeed(`Plugin created in ${targetDir}`);
    console.log('\nNext steps:');
    console.log(`  cd ${targetDir}`);
    console.log('  npm install');
    console.log('  npm run build');
    console.log('  mtc-admin plugin publish:prepare .');
  } catch (error) {
    spinner.fail('Plugin scaffolding failed');
    throw error;
  }
}

async function copyTemplate(templateDir: string, targetDir: string, context: Record<string, any>): Promise<void> {
  const entries = await fs.readdir(templateDir);

  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry);
    const destPath = path.join(targetDir, entry.replace(/\.hbs$/, ''));
    const stats = await fs.stat(srcPath);

    if (stats.isDirectory()) {
      await fs.ensureDir(destPath);
      await copyTemplate(srcPath, destPath, context);
      continue;
    }

    if (entry.endsWith('.hbs')) {
      const template = await fs.readFile(srcPath, 'utf-8');
      const compiled = Handlebars.compile(template);
      const rendered = compiled(context);
      await fs.outputFile(destPath, rendered);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}

async function createHookFiles(context: Record<string, any>, targetDir: string): Promise<void> {
  const hooks = (context.hooks as Array<{ handler: string; name: string }>) ?? [];
  const sdkPackageName = context.sdkPackageName as string;

  if (!hooks.length) {
    return;
  }

  for (const hook of hooks) {
    const filePath = path.join(targetDir, hook.handler);
    const fnName = pascalFromFilename(path.basename(hook.handler));
    const content = `import type { PluginContext } from '${sdkPackageName}';

export default async function ${fnName}(context: PluginContext, payload: any) {
  context.logger.info('${hook.name} executed via ${context.name}', { tenant: context.tenant.slug });
  return payload;
}
`;
    await fs.outputFile(filePath, content);
  }
}

async function createApiFiles(context: Record<string, any>, targetDir: string): Promise<void> {
  const apiEndpoints = (context.apiEndpoints as Array<{ handler: string; path: string }>) ?? [];
  const sdkPackageName = context.sdkPackageName as string;

  if (!apiEndpoints.length) {
    return;
  }

  for (const endpoint of apiEndpoints) {
    const filePath = path.join(targetDir, endpoint.handler);
    const fnName = pascalFromFilename(path.basename(endpoint.handler));
    const content = `import type { PluginContext } from '${sdkPackageName}';

type RequestLike = Record<string, any>;
type ResponseLike = { json: (body: any) => void } & Record<string, any>;

export default async function ${fnName}(context: PluginContext, req: RequestLike, res: ResponseLike) {
  context.logger.info('Handling ${endpoint.path}');
  res.json({ ok: true });
}
`;
    await fs.outputFile(filePath, content);
  }
}

async function createAdminComponents(context: Record<string, any>, targetDir: string): Promise<void> {
  const adminUi = (context.adminUi as { widgets?: Array<{ component: string }>; menu_items?: Array<{ component?: string }> }) ?? {};
  const componentPaths = new Set<string>();

  for (const widget of adminUi.widgets ?? []) {
    componentPaths.add(widget.component);
  }

  for (const menuItem of adminUi.menu_items ?? []) {
    if (menuItem.component) {
      componentPaths.add(menuItem.component);
    }
  }

  for (const componentPath of componentPaths) {
    const outputPath = path.join(targetDir, componentPath);
    if (await fs.pathExists(outputPath)) {
      continue;
    }

    const componentName = pascalFromFilename(path.basename(componentPath));
    const content = `export function ${componentName}() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">${context.name} component placeholder.</p>
    </div>
  );
}
`;
    await fs.outputFile(outputPath, content);
  }
}

async function createMigrationFiles(context: Record<string, any>, targetDir: string): Promise<void> {
  const migrations = context.migrations as string[];
  if (!migrations?.length) return;

  for (const migration of migrations) {
    const migrationPath = path.join(targetDir, migration);
    if (await fs.pathExists(migrationPath)) {
      continue;
    }

    const tableSlug = context.slug.replace(/-/g, '_');
    const content = `-- Migration managed by mtc-admin
CREATE TABLE IF NOT EXISTS ${tableSlug} (
  id TEXT PRIMARY KEY,
  payload TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;
    await fs.outputFile(migrationPath, content);
  }
}

function applySlugToObject<T>(input: T, slug: string): T {
  if (typeof input === 'string') {
    return input.replace(/{{slug}}/g, slug) as T;
  }

  if (Array.isArray(input)) {
    return input.map((value) => applySlugToObject(value, slug)) as T;
  }

  if (input && typeof input === 'object') {
    const clone: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      clone[key] = applySlugToObject(value as any, slug);
    }
    return clone as T;
  }

  return input;
}

function normalizeOptions(options: PluginScaffoldOptions): PluginScaffoldOptions {
  return {
    ...options,
    platformName: options.platformName ?? (options as any)['platform-name'],
    docsUrl: options.docsUrl ?? (options as any)['docs-url'],
    supportEmail: options.supportEmail ?? (options as any)['support-email'],
  };
}

function pascalFromFilename(filename: string): string {
  const base = filename.replace(/\.[tj]sx?$/, '');
  const dashed = base
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
  return upperFirst(camelCase(dashed));
}
