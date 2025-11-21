#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loadBrandConfig, loadBrandConfigFromArgs, getCliName, getPlatformName } from '@mtc-platform/config';
import { scaffoldPlugin } from './commands/scaffold.js';
import { addHook } from './commands/add-hook.js';
import { generateManifest } from './commands/generate-manifest.js';
import { validatePlugin } from './commands/validate.js';
import { listPlugins } from './commands/list.js';
import { installPlugin } from './commands/install.js';
import { uninstallPlugin } from './commands/uninstall.js';

const program = new Command();

// Load brand configuration using defaults for now
const brandConfig = loadBrandConfig();
const cliName = getCliName(brandConfig);
const platformName = getPlatformName(brandConfig);

// CLI configuration
program
  .name(cliName)
  .description(`CLI tool for managing ${platformName} plugins`)
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--config <path>', 'Path to configuration file', './mtc-admin.config.json')
  .option('--brand <brand>', 'Brand name override')
  .option('--scope <scope>', 'Package scope override')
  .option('--npm-org <org>', 'NPM organization override')
  .option('--github-org <org>', 'GitHub organization override')
  .option('--brand-color <color>', 'Brand color override (hex)')
  .option('--brand-logo <url>', 'Brand logo URL override')
  .option('--platform-name <name>', 'Platform name override')
  .option('--cli-name <name>', 'CLI binary name override')
  .option('--docs-url <url>', 'Documentation URL override')
  .option('--support-email <email>', 'Support email override');

// Plugin scaffolding command
program
  .command('scaffold')
  .description('Scaffold a new plugin')
  .argument('<type>', 'Plugin type (cms, auth, payment, delivery, email, analytics, integration, ui, workflow, utility)')
  .argument('<name>', 'Plugin name')
  .option('-d, --directory <path>', 'Output directory', './plugins')
  .option('--slug <slug>', 'Plugin slug (auto-generated from name if not provided)')
  .option('--author <author>', 'Plugin author')
  .option('--description <description>', 'Plugin description')
  .option('--template <template>', 'Custom template to use')
  .option('--brand <brand>', 'Brand name override')
  .option('--scope <scope>', 'Package scope override')
  .action(async (type, name, options) => {
    try {
      // Merge brand options from global CLI options
      const globalOptions = program.opts();
      const brandOptions = {
        brand: options.brand || globalOptions.brand,
        scope: options.scope || globalOptions.scope,
        npmOrg: globalOptions['npm-org'],
        githubOrg: globalOptions['github-org'],
        brandColor: globalOptions['brand-color'],
        brandLogo: globalOptions['brand-logo'],
        platformName: globalOptions['platform-name'],
        cliName: globalOptions['cli-name'],
        docsUrl: globalOptions['docs-url'],
        supportEmail: globalOptions['support-email'],
      };
      
      await scaffoldPlugin(type, name, options, brandOptions);
      console.log(chalk.green(`✅ Plugin "${name}" scaffolded successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Error scaffolding plugin: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Add hook command
program
  .command('add-hook')
  .description('Add a hook to an existing plugin')
  .argument('<hook-name>', 'Hook name (e.g., before_product_create)')
  .argument('<plugin-path>', 'Path to plugin directory')
  .option('--handler <handler>', 'Handler file name', 'hooks/handler.ts')
  .option('--priority <priority>', 'Hook priority', '100')
  .action(async (hookName, pluginPath, options) => {
    try {
      await addHook(hookName, pluginPath, options);
      console.log(chalk.green(`✅ Hook "${hookName}" added successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Error adding hook: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Generate manifest command
program
  .command('generate-manifest')
  .description('Generate plugin manifest from plugin directory')
  .argument('<plugin-path>', 'Path to plugin directory')
  .option('-o, --output <path>', 'Output file path', 'plugin.json')
  .option('--validate', 'Validate manifest after generation')
  .action(async (pluginPath, options) => {
    try {
      await generateManifest(pluginPath, options);
      console.log(chalk.green(`✅ Manifest generated successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Error generating manifest: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Validate plugin command
program
  .command('validate')
  .description('Validate a plugin')
  .argument('<plugin-path>', 'Path to plugin directory or manifest file')
  .option('--strict', 'Enable strict validation')
  .action(async (pluginPath, options) => {
    try {
      await validatePlugin(pluginPath, options);
      console.log(chalk.green('✅ Plugin validation passed!'));
    } catch (error) {
      console.error(chalk.red(`❌ Plugin validation failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// List plugins command
program
  .command('list')
  .description('List installed plugins')
  .option('--tenant <tenant>', 'Tenant ID (required for multi-tenant mode)')
  .option('--category <category>', 'Filter by category')
  .option('--status <status>', 'Filter by status (active, inactive)')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(async (options) => {
    try {
      await listPlugins(options);
    } catch (error) {
      console.error(chalk.red(`❌ Error listing plugins: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Install plugin command
program
  .command('install')
  .description('Install a plugin')
  .argument('<plugin>', 'Plugin path or slug')
  .option('--tenant <tenant>', 'Tenant ID (required for multi-tenant mode)')
  .option('--config <config>', 'Plugin configuration (JSON string or file path)')
  .option('--force', 'Force installation even if already installed')
  .action(async (plugin, options) => {
    try {
      await installPlugin(plugin, options);
      console.log(chalk.green(`✅ Plugin installed successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Error installing plugin: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Uninstall plugin command
program
  .command('uninstall')
  .description('Uninstall a plugin')
  .argument('<plugin>', 'Plugin slug')
  .option('--tenant <tenant>', 'Tenant ID (required for multi-tenant mode)')
  .option('--force', 'Force uninstallation')
  .action(async (plugin, options) => {
    try {
      await uninstallPlugin(plugin, options);
      console.log(chalk.green(`✅ Plugin uninstalled successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Error uninstalling plugin: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`❌ Invalid command: ${program.args.join(' ')}`));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Parse command line arguments
program.parse();