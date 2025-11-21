import path from 'node:path';
import fs from 'fs-extra';
import ora from 'ora';
import { kebabCase } from 'lodash-es';

interface MigrationCreateOptions {
  table?: string;
  description?: string;
}

export async function createPluginMigration(pluginDirectory: string, name: string, options: MigrationCreateOptions = {}): Promise<void> {
  const spinner = ora('Creating migration').start();

  try {
    const cwd = path.resolve(pluginDirectory);
    const manifestPath = path.join(cwd, 'plugin.json');

    if (!(await fs.pathExists(manifestPath))) {
      throw new Error(`plugin.json not found in ${cwd}`);
    }

    const manifest = await fs.readJSON(manifestPath);
    manifest.database_migrations = manifest.database_migrations ?? [];

    const slug = kebabCase(name);
    const timestamp = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
    const fileName = `${timestamp}_${slug}.sql`;
    const relativePath = path.join('migrations', fileName).replace(/\\/g, '/');
    const filePath = path.join(cwd, relativePath);
    await fs.ensureDir(path.dirname(filePath));

    const tableName = options.table ?? `${manifest.slug}_${slug}`.replace(/-/g, '_');
    const description = options.description ?? `Migration ${name}`;

    const content = `-- ${description}
CREATE TABLE IF NOT EXISTS ${tableName} (
  id TEXT PRIMARY KEY,
  data TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

    await fs.writeFile(filePath, content);

    if (!manifest.database_migrations.includes(relativePath)) {
      manifest.database_migrations.push(relativePath);
    }

    await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
    spinner.succeed(`Migration written to ${relativePath}`);
  } catch (error) {
    spinner.fail('Failed to create migration');
    throw error;
  }
}
