#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const tasks = [
  { name: 'Admin starter', cwd: 'packages/admin' },
  { name: 'Plugin SDK', cwd: 'packages/plugin-sdk' },
  { name: 'Admin CLI', cwd: 'packages/admin-cli' },
  { name: 'Sample plugin (Stripe Gateway)', cwd: 'examples/stripe-plugin' },
];

function runTask({ name, cwd }) {
  console.log(`\n📦 Building ${name} (${cwd})`);
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: path.resolve(process.cwd(), cwd),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Build failed for ${name}`);
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
