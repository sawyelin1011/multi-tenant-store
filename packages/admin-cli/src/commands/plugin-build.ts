import path from 'node:path';
import ora from 'ora';
import { runNpmScript } from '../utils/run.js';

export async function runPluginBuild(pluginDirectory: string): Promise<void> {
  const spinner = ora('Building plugin').start();

  try {
    const cwd = path.resolve(pluginDirectory);
    await runNpmScript('build', cwd);
    spinner.succeed('Plugin build completed');
  } catch (error) {
    spinner.fail('Plugin build failed');
    throw error;
  }
}
