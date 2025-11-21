import path from 'node:path';
import ora from 'ora';
import { runNpmScript } from '../utils/run.js';

export async function runPluginDev(pluginDirectory: string): Promise<void> {
  const spinner = ora('Starting plugin dev server').start();

  try {
    const cwd = path.resolve(pluginDirectory);
    spinner.stop();
    console.log(`Running npm run dev in ${cwd}`);
    await runNpmScript('dev', cwd);
  } catch (error) {
    spinner.fail('Plugin dev server exited with errors');
    throw error;
  }
}
