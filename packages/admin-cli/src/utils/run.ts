import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export function runCommand(command: string, args: string[], options: RunOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

export function runNpmScript(script: string, cwd: string, extraArgs: string[] = []): Promise<void> {
  return runCommand(npmCommand, ['run', script, ...extraArgs], { cwd });
}

export function runNpmInstall(cwd: string): Promise<void> {
  return runCommand(npmCommand, ['install'], { cwd });
}
