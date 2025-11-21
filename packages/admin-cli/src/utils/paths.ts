import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const PACKAGE_ROOT = path.resolve(currentDir, '..', '..');
export const TEMPLATE_ROOT = path.join(PACKAGE_ROOT, 'templates');
export const PLUGIN_TEMPLATE_ROOT = path.join(TEMPLATE_ROOT, 'plugins');
export const ADMIN_STARTER_ROOT = path.resolve(PACKAGE_ROOT, '..', 'admin');

export function resolveInPackage(...segments: string[]): string {
  return path.join(PACKAGE_ROOT, ...segments);
}
