#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createAdminApp } from './commands/create-app.js';
import { scaffoldPlugin } from './commands/plugin-scaffold.js';
import { addPluginComponent } from './commands/plugin-add-component.js';
import { runPluginDev } from './commands/plugin-dev.js';
import { runPluginBuild } from './commands/plugin-build.js';
import { preparePluginPublish } from './commands/plugin-publish-prepare.js';
import { createPluginMigration } from './commands/plugin-migration-create.js';
import { SUPPORTED_PLUGIN_TYPES } from './templates/plugin-presets.js';

const program = new Command();

program
  .name('mtc-admin')
  .description('Multi-tenant admin + plugin toolkit for the MTC Platform')
  .version('1.0.0');

program
  .command('create-app')
  .description('Scaffold the shadcn-powered admin workspace')
  .argument('<name>', 'Directory / package name for the admin app')
  .option('-d, --directory <directory>', 'Parent directory for the app', '.')
  .option('--template <path>', 'Path to a custom admin starter template')
  .option('--brand <brand>', 'Brand override for the starter')
  .option('--scope <scope>', 'NPM scope for generated package name')
  .option('--platform-name <name>', 'Platform display name override')
  .option('--docs-url <url>', 'Docs URL override')
  .option('--support-email <email>', 'Support email override')
  .action(handleAction(async (name: string, options) => {
    await createAdminApp(name, options);
  }));

const plugin = program.command('plugin').description('Plugin workspace commands');

plugin
  .command('scaffold')
  .description('Generate a plugin from the official template set')
  .argument('<name>', 'Human readable plugin name (used for slug + class name)')
  .requiredOption('-t, --type <type>', `Plugin type (${SUPPORTED_PLUGIN_TYPES.join(', ')})`)
  .option('-d, --directory <directory>', 'Output directory', '.')
  .option('--description <description>', 'Description for README + manifest')
  .option('--author <author>', 'Author name for manifest')
  .option('--slug <slug>', 'Slug override ( defaults to kebab-case(name) )')
  .option('--template <path>', 'Alternative template directory')
  .option('--force', 'Overwrite directory if it already exists')
  .option('--brand <brand>', 'Brand override used for SDK / package scope')
  .option('--scope <scope>', 'NPM scope override for generated package.json')
  .option('--platform-name <name>', 'Platform name override')
  .option('--docs-url <url>', 'Docs URL override')
  .option('--support-email <email>', 'Support email override')
  .action(handleAction(async (name: string, options) => {
    await scaffoldPlugin(name, { ...options, type: options.type.toLowerCase() });
  }));

const pluginAdd = plugin.command('add').description('Augment plugin assets');

pluginAdd
  .command('component')
  .description('Generate a new admin component and register it in plugin.json')
  .argument('<plugin-path>', 'Path to the plugin directory')
  .argument('<component-name>', 'Component name (PascalCase or words)')
  .option('--kind <kind>', 'widget | menu', 'widget')
  .option('--dashboard <dashboard>', 'Dashboard placement for widgets', 'analytics')
  .option('--label <label>', 'Human readable label override')
  .action(handleAction(async (pluginPath: string, componentName: string, options) => {
    const kind = (options.kind ?? 'widget').toLowerCase();
    if (!['widget', 'menu'].includes(kind)) {
      throw new Error('Kind must be either "widget" or "menu"');
    }
    await addPluginComponent(pluginPath, componentName, {
      kind,
      dashboard: options.dashboard,
      label: options.label,
    });
  }));

plugin
  .command('dev')
  .description('Run npm run dev inside a plugin directory')
  .argument('[plugin-path]', 'Plugin directory (defaults to current dir)', '.')
  .action(handleAction(async (pluginPath: string) => {
    await runPluginDev(pluginPath);
  }));

plugin
  .command('build')
  .description('Run npm run build inside a plugin directory')
  .argument('[plugin-path]', 'Plugin directory (defaults to current dir)', '.')
  .action(handleAction(async (pluginPath: string) => {
    await runPluginBuild(pluginPath);
  }));

plugin
  .command('publish:prepare')
  .description('Bundle a plugin tarball without triggering npm publish')
  .argument('[plugin-path]', 'Plugin directory (defaults to current dir)', '.')
  .option('--skip-build', 'Skip npm run build before packing')
  .action(handleAction(async (pluginPath: string, options) => {
    await preparePluginPublish(pluginPath, options);
  }));

plugin
  .command('migration:create')
  .description('Create a timestamped SQL migration and register it in plugin.json')
  .argument('<plugin-path>', 'Plugin directory')
  .argument('<name>', 'Migration name, e.g. add-customer-table')
  .option('--table <table>', 'Custom table name override')
  .option('--description <description>', 'Migration description header')
  .action(handleAction(async (pluginPath: string, migrationName: string, options) => {
    await createPluginMigration(pluginPath, migrationName, options);
  }));

program.hook('preAction', () => {
  process.on('unhandledRejection', (error) => {
    console.error(chalk.red('Unhandled rejection'), error);
    process.exit(1);
  });
});

program.parseAsync().catch((error) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});

function handleAction<T extends any[]>(action: (...args: T) => Promise<void>) {
  return async (...args: T): Promise<void> => {
    try {
      await action(...args);
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  };
}
