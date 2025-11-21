import path from 'node:path';
import fs from 'fs-extra';
import ora from 'ora';
import { kebabCase, startCase } from 'lodash-es';
import { resolveBrandConfig, extractBrandOptions, getScopedPackageName } from '../utils/brand.js';
import { ADMIN_STARTER_ROOT } from '../utils/paths.js';

interface CreateAppOptions {
  directory?: string;
  template?: string;
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

export async function createAdminApp(name: string, rawOptions: CreateAppOptions): Promise<void> {
  const spinner = ora('Creating admin workspace').start();

  try {
    const options = mapOptionAliases(rawOptions);
    const brandConfig = resolveBrandConfig(extractBrandOptions(options));
    const slug = kebabCase(name);
    const targetDir = path.resolve(options.directory ?? process.cwd(), slug);

    if (await fs.pathExists(targetDir)) {
      throw new Error(`Target directory already exists: ${targetDir}`);
    }

    const templateDir = path.resolve(options.template ?? ADMIN_STARTER_ROOT);
    if (!(await fs.pathExists(templateDir))) {
      throw new Error(`Admin starter template not found at ${templateDir}`);
    }

    await fs.copy(templateDir, targetDir, {
      filter: (file) => !/node_modules|dist|\.DS_Store/.test(file),
    });

    const packageJsonPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      packageJson.name = getScopedPackageName(brandConfig.packageScope, slug);
      packageJson.description = `${brandConfig.brandName} admin workspace for ${brandConfig.platformName}`;
      await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
    }

    const brandConfigPath = path.join(targetDir, 'src', 'config', 'brand.json');
    if (await fs.pathExists(brandConfigPath)) {
      const currentBrand = await fs.readJSON(brandConfigPath);
      const resolvedBrandName = options.brand ?? `${startCase(name)} Admin`;
      await fs.writeJSON(
        brandConfigPath,
        {
          ...currentBrand,
          name: resolvedBrandName,
          platformName: brandConfig.platformName,
          supportEmail: brandConfig.supportEmail,
          docsUrl: brandConfig.docsUrl,
          packageScope: brandConfig.packageScope,
        },
        { spaces: 2 },
      );
    }

    spinner.succeed(`Admin app scaffolded in ${targetDir}`);
    console.log('\nNext steps:');
    console.log(`  cd ${targetDir}`);
    console.log('  npm install');
    console.log('  npm run dev');
  } catch (error) {
    spinner.fail('Failed to create admin workspace');
    throw error;
  }
}

function mapOptionAliases(options: CreateAppOptions): CreateAppOptions {
  return {
    ...options,
    platformName: options.platformName ?? (options as any)['platform-name'],
    docsUrl: options.docsUrl ?? (options as any)['docs-url'],
    supportEmail: options.supportEmail ?? (options as any)['support-email'],
  };
}

