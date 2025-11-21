import path from 'node:path';
import fs from 'fs-extra';
import ora from 'ora';
import { spawnSync } from 'node:child_process';
import { runNpmScript } from '../utils/run.js';

interface PublishPrepareOptions {
  skipBuild?: boolean;
}

export async function preparePluginPublish(pluginDirectory: string, options: PublishPrepareOptions = {}): Promise<void> {
  const spinner = ora('Preparing npm tarball (manual publish)').start();

  try {
    const cwd = path.resolve(pluginDirectory);
    const packageJsonPath = path.join(cwd, 'package.json');

    if (!(await fs.pathExists(packageJsonPath))) {
      throw new Error(`package.json not found in ${cwd}`);
    }

    const pkg = await fs.readJSON(packageJsonPath);

    if (!options.skipBuild) {
      await runNpmScript('build', cwd);
    }

    const releasesDir = path.join(cwd, 'dist', 'releases');
    await fs.ensureDir(releasesDir);

    const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['pack', '--pack-destination', releasesDir], {
      cwd,
      encoding: 'utf-8',
    });

    if (result.status !== 0) {
      throw new Error(result.stderr || 'npm pack failed');
    }

    const tarballName = result.stdout.trim().split('\n').pop()?.trim();
    if (!tarballName) {
      throw new Error('Unable to determine pack output');
    }

    spinner.succeed('Tarball created');
    console.log(`Output: ${path.join(releasesDir, tarballName)}`);
    console.log('\nManual publish steps:');
    console.log(`  cd ${cwd}`);
    console.log(`  npm publish dist/releases/${tarballName} --access public`);
    console.log(`  git tag -a ${pkg.name}@${pkg.version} -m "release: ${pkg.name} v${pkg.version}"`);
    console.log(`  git push origin ${pkg.name}@${pkg.version}`);
  } catch (error) {
    spinner.fail('Publish preparation failed');
    throw error;
  }
}
