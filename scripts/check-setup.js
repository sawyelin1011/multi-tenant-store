#!/usr/bin/env node

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Checking development setup...\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check package.json scripts
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const scripts = packageJson.scripts;

console.log('\n📦 Checking package.json scripts...');
const requiredScripts = ['dev', 'dev:watch', 'cf:dev', 'cf:build', 'dev:both'];
for (const script of requiredScripts) {
  if (scripts[script]) {
    console.log(`✅ ${script}: ${scripts[script]}`);
  } else {
    console.log(`❌ Missing script: ${script}`);
  }
}

// Check tsx installation
try {
  execSync('npx tsx --version', { stdio: 'pipe' });
  console.log('✅ tsx is installed');
} catch (error) {
  console.log('❌ tsx is not installed');
}

// Check wrangler installation
try {
  execSync('npx wrangler --version', { stdio: 'pipe' });
  console.log('✅ wrangler is installed');
} catch (error) {
  console.log('❌ wrangler is not installed');
}

// Check TypeScript configuration
try {
  const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));
  console.log('✅ tsconfig.json exists and is valid');
  console.log(`   Target: ${tsconfig.compilerOptions.target}`);
  console.log(`   Module: ${tsconfig.compilerOptions.module}`);
  console.log(`   Module Resolution: ${tsconfig.compilerOptions.moduleResolution}`);
} catch (error) {
  console.log('❌ tsconfig.json is invalid');
}

// Check environment files
const envFiles = ['.env.example', '.env.example.worker', '.env.local'];
console.log('\n📝 Checking environment files...');
for (const file of envFiles) {
  try {
    readFileSync(file, 'utf8');
    console.log(`✅ ${file} exists`);
  } catch (error) {
    if (file === '.env.local') {
      console.log(`⚠️  ${file} doesn't exist (copy from .env.example)`);
    } else {
      console.log(`❌ ${file} doesn't exist`);
    }
  }
}

// Check wrangler.toml
try {
  readFileSync('wrangler.toml', 'utf8');
  console.log('✅ wrangler.toml exists');
} catch (error) {
  console.log('❌ wrangler.toml doesn\'t exist');
}

// Check source files
const sourceFiles = ['src/index.ts', 'src/worker.ts', 'src/config/env.ts'];
console.log('\n📂 Checking source files...');
for (const file of sourceFiles) {
  try {
    readFileSync(file, 'utf8');
    console.log(`✅ ${file} exists`);
  } catch (error) {
    console.log(`❌ ${file} doesn't exist`);
  }
}

console.log('\n🎉 Setup check complete!');
console.log('\nNext steps:');
console.log('1. Copy .env.example to .env.local and configure');
console.log('2. Run "npm run dev" for Express development');
console.log('3. Run "npm run cf:dev" for Workers development');
console.log('4. Run "npm run dev:both" for concurrent development');
