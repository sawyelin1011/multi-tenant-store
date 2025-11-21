#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const tasks = [
  { name: 'Config', cwd: 'packages/config', required: true },
  { name: 'Plugin SDK', cwd: 'packages/plugin-sdk', required: true },
  { name: 'Admin CLI', cwd: 'packages/admin-cli', required: true },
  { name: 'Admin starter', cwd: 'packages/admin', required: true },
  { name: 'Sample plugin (Stripe Gateway)', cwd: 'examples/stripe-plugin', required: false },
];

function runTask({ name, cwd, required }) {
  console.log(`\n📦 Building ${name} (${cwd})`);
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: path.resolve(process.cwd(), cwd),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    if (required) {
      throw new Error(`Build failed for ${name}`);
    } else {
      console.log(`⚠️  Optional build failed for ${name} (skipping)`);
    }
  }
}

try {
  for (const task of tasks) {
    runTask(task);
  }
  console.log('\n✅ All packages built successfully.');
} catch (error) {
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
