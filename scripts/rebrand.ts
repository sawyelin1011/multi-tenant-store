#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { loadBrandConfig } from '../packages/config/src/brand.config.js';

const brandConfig = loadBrandConfig();

// Specific files to process for brand replacements
const FILES_TO_PROCESS = [
  'package.json',
  'packages/admin-cli/package.json',
  'packages/plugin-sdk/package.json',
  'packages/config/package.json',
  'packages/admin-cli/src/cli.ts',
  'packages/admin-cli/src/commands/scaffold.ts',
  'packages/plugin-sdk/README.md',
  'src/config/env.ts',
  '.env.example',
  '.env.example.worker',
  '.env.example.local',
  'README.md',
  'API.md',
  'ARCHITECTURE.md',
  'DEVELOPMENT.md',
  'PLUGIN_DEVELOPMENT.md',
  'wrangler.toml',
];

// Directories to search for additional files
const DIRECTORIES_TO_SCAN = [
  'src',
  'packages/admin-cli/src',
  'packages/plugin-sdk/src',
  'examples',
  'docs',
];

// Replacement patterns
const REPLACEMENTS = {
  // Old brand references
  'Digital Commerce Platform': brandConfig.platformName,
  'digital-commerce-platform': brandConfig.packageScope,
  '@digital-commerce': `@${brandConfig.packageScope}`,
  'admin-cli': brandConfig.cliName,
  
  // Package name patterns
  '"name": "@digital-commerce/admin-cli"': `"name": "@${brandConfig.packageScope}/admin-cli"`,
  '"name": "@digital-commerce/plugin-sdk"': `"name": "@${brandConfig.packageScope}/plugin-sdk"`,
  '"name": "@digital-commerce/config"': `"name": "@${brandConfig.packageScope}/config"`,
  
  // Import patterns
  "'@digital-commerce/plugin-sdk'": `'@${brandConfig.packageScope}/plugin-sdk'`,
  '"@digital-commerce/plugin-sdk"': `"@${brandConfig.packageScope}/plugin-sdk"`,
  "'@digital-commerce/config'": `'@${brandConfig.packageScope}/config'`,
  '"@digital-commerce/config"': `"@${brandConfig.packageScope}/config"`,
  
  // CLI binary references
  '"admin-cli":': `"${brandConfig.cliName}":`,
  'admin-cli': brandConfig.cliName,
};

// Files to skip
const SKIP_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  '.log',
  'scripts/rebrand.ts',
];

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some(pattern => filePath.includes(pattern));
}

async function findFilesInDirectory(dir: string, extensions: string[] = ['.ts', '.js', '.json', '.md']): Promise<string[]> {
  const files: string[] = [];
  
  async function scanDirectory(currentDir: string): Promise<void> {
    try {
      const items = await fs.readdir(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          if (!shouldSkipFile(fullPath)) {
            await scanDirectory(fullPath);
          }
        } else if (extensions.some(ext => item.endsWith(ext))) {
          if (!shouldSkipFile(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  await scanDirectory(dir);
  return files;
}

async function processFile(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      return;
    }

    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;

    // Apply replacements
    for (const [search, replace] of Object.entries(REPLACEMENTS)) {
      if (content.includes(search)) {
        content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.warn(`⚠️  Skipping ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function updatePackageJson(filePath: string): Promise<void> {
  try {
    const packageJson = await fs.readJSON(filePath);
    let modified = false;

    // Update package name
    if (packageJson.name && packageJson.name.startsWith('@digital-commerce/')) {
      const packageName = packageJson.name.replace('@digital-commerce/', '');
      packageJson.name = `@${brandConfig.packageScope}/${packageName}`;
      modified = true;
    }

    // Update CLI binary name
    if (packageJson.bin && packageJson.bin['admin-cli']) {
      packageJson.bin[brandConfig.cliName] = packageJson.bin['admin-cli'];
      delete packageJson.bin['admin-cli'];
      modified = true;
    }

    // Update dependencies
    if (packageJson.dependencies) {
      for (const depName of Object.keys(packageJson.dependencies)) {
        if (depName.startsWith('@digital-commerce/')) {
          const newDepName = depName.replace('@digital-commerce/', `@${brandConfig.packageScope}/`);
          packageJson.dependencies[newDepName] = packageJson.dependencies[depName];
          delete packageJson.dependencies[depName];
          modified = true;
        }
      }
    }

    // Update devDependencies
    if (packageJson.devDependencies) {
      for (const depName of Object.keys(packageJson.devDependencies)) {
        if (depName.startsWith('@digital-commerce/')) {
          const newDepName = depName.replace('@digital-commerce/', `@${brandConfig.packageScope}/`);
          packageJson.devDependencies[newDepName] = packageJson.devDependencies[depName];
          delete packageJson.devDependencies[depName];
          modified = true;
        }
      }
    }

    // Update description
    if (packageJson.description && packageJson.description.includes('Digital Commerce Platform')) {
      packageJson.description = packageJson.description.replace('Digital Commerce Platform', brandConfig.platformName);
      modified = true;
    }

    if (modified) {
      await fs.writeJSON(filePath, packageJson, { spaces: 2 });
      console.log(`✅ Updated package.json: ${filePath}`);
    }
  } catch (error) {
    console.warn(`⚠️  Skipping package.json ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  console.log(`🎨 Rebranding to ${brandConfig.platformName}...`);
  console.log(`📦 Package scope: @${brandConfig.packageScope}`);
  console.log(`🔧 CLI name: ${brandConfig.cliName}`);
  console.log('');

  const allFiles = new Set<string>();

  // Add specific files
  for (const file of FILES_TO_PROCESS) {
    if (await fs.pathExists(file)) {
      allFiles.add(file);
    }
  }

  // Scan directories for additional files
  for (const dir of DIRECTORIES_TO_SCAN) {
    if (await fs.pathExists(dir)) {
      const files = await findFilesInDirectory(dir);
      files.forEach(file => allFiles.add(file));
    }
  }

  // Process all files
  for (const filePath of Array.from(allFiles)) {
    if (filePath.endsWith('package.json')) {
      await updatePackageJson(filePath);
    } else {
      await processFile(filePath);
    }
  }

  console.log('');
  console.log('✨ Rebranding complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run "npm install" to update dependencies');
  console.log('2. Run "npm run build:packages" to rebuild packages');
  console.log('3. Update any remaining manual references');
}

// Run the script
main().catch((error) => {
  console.error('❌ Rebranding failed:', error);
  process.exit(1);
});