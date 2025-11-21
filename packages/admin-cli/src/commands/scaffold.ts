import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import Handlebars from 'handlebars';
import { loadBrandConfigFromArgs, getPackageScope, getPlatformName, type BrandConfig } from '@mtc-platform/config';

// Helper functions for string manipulation
function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
}

function pascalCase(str: string): string {
  return str.replace(/(?:^|[-_\s])(\w)/g, (_, char) => char.toUpperCase()).replace(/[-_\s]/g, '');
}

function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

interface ScaffoldOptions {
  directory: string;
  slug?: string;
  author?: string;
  description?: string;
  template?: string;
}

interface BrandOptions extends Record<string, string | undefined> {
  brand?: string;
  scope?: string;
  npmOrg?: string;
  githubOrg?: string;
  brandColor?: string;
  brandLogo?: string;
  platformName?: string;
  cliName?: string;
  docsUrl?: string;
  supportEmail?: string;
}

export async function scaffoldPlugin(type: string, name: string, options: ScaffoldOptions, brandOptions?: BrandOptions): Promise<void> {
  const spinner = ora('Scaffolding plugin...').start();
  
  try {
    // Load brand configuration
    const brandConfig = brandOptions ? loadBrandConfigFromArgs(brandOptions) : loadBrandConfigFromArgs({});
    const platformName = getPlatformName(brandConfig);
    const packageScope = getPackageScope('plugin-sdk', brandConfig);
    
    // Validate plugin type
    const validTypes = ['cms', 'auth', 'payment', 'delivery', 'email', 'analytics', 'integration', 'ui', 'workflow', 'utility'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid plugin type: ${type}. Valid types: ${validTypes.join(', ')}`);
    }

    // Generate plugin slug if not provided
    const slug = options.slug || kebabCase(name);
    
    // Create plugin directory
    const pluginDir = path.join(options.directory, slug);
    await fs.ensureDir(pluginDir);

    // Template context
    const context = {
      name,
      slug,
      className: pascalCase(name),
      varName: camelCase(name),
      type,
      author: options.author || 'Plugin Developer',
      description: options.description || `${pascalCase(name)} ${type} plugin`,
      year: new Date().getFullYear(),
      brand: brandConfig,
      platformName,
      packageScope,
    };

    // Copy template files
    const templateDir = options.template 
      ? path.resolve(options.template)
      : path.join(__dirname, '../../templates', type);
    
    if (!await fs.pathExists(templateDir)) {
      throw new Error(`Template not found: ${templateDir}`);
    }

    await copyTemplate(templateDir, pluginDir, context);

    // Create additional files
    await createPluginFiles(pluginDir, context);

    spinner.succeed(`Plugin "${name}" scaffolded successfully at ${pluginDir}`);
    
    // Show next steps
    console.log(chalk.blue('\nNext steps:'));
    console.log(`  1. cd ${pluginDir}`);
    console.log(`  2. npm install`);
    console.log(`  3. Edit plugin.json with your details`);
    console.log(`  4. Implement your plugin logic in src/`);
    console.log(`  5. Run "mtc-admin validate" to check your plugin`);
    
  } catch (error) {
    spinner.fail('Scaffolding failed');
    throw error;
  }
}

async function copyTemplate(templateDir: string, targetDir: string, context: any): Promise<void> {
  const files = await fs.readdir(templateDir);
  
  for (const file of files) {
    const sourcePath = path.join(templateDir, file);
    const targetPath = path.join(targetDir, file);
    const stat = await fs.stat(sourcePath);
    
    if (stat.isDirectory()) {
      await fs.ensureDir(targetPath);
      await copyTemplate(sourcePath, targetPath, context);
    } else {
      // Process template files
      if (file.endsWith('.hbs')) {
        const template = await fs.readFile(sourcePath, 'utf-8');
        const compiled = Handlebars.compile(template);
        const content = compiled(context);
        const outputFileName = file.replace('.hbs', '');
        await fs.writeFile(path.join(targetDir, outputFileName), content);
      } else {
        await fs.copy(sourcePath, targetPath);
      }
    }
  }
}

async function createPluginFiles(pluginDir: string, context: any): Promise<void> {
  // Create src directory
  const srcDir = path.join(pluginDir, 'src');
  await fs.ensureDir(srcDir);
  
  // Create hooks directory
  const hooksDir = path.join(srcDir, 'hooks');
  await fs.ensureDir(hooksDir);
  
  // Create api directory
  const apiDir = path.join(srcDir, 'api');
  await fs.ensureDir(apiDir);
  
  // Create admin directory
  const adminDir = path.join(srcDir, 'admin');
  await fs.ensureDir(adminDir);
  
  // Create package.json
  const packageJson = {
    name: context.slug,
    version: '1.0.0',
    description: context.description,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch',
      test: 'vitest',
    },
    dependencies: {
      [context.packageScope]: '^1.0.0',
    },
    devDependencies: {
      '@types/node': '^20.10.0',
      'typescript': '^5.3.3',
      'vitest': '^1.0.4',
    },
  };
  
  await fs.writeJSON(path.join(pluginDir, 'package.json'), packageJson, { spaces: 2 });
  
  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'node',
      outDir: './dist',
      rootDir: './src',
      declaration: true,
      sourceMap: true,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };
  
  await fs.writeJSON(path.join(pluginDir, 'tsconfig.json'), tsConfig, { spaces: 2 });
  
  // Create plugin.json manifest using SDK
  const manifestContent = generatePluginManifest(context);
  await fs.writeJSON(path.join(pluginDir, 'plugin.json'), manifestContent, { spaces: 2 });
  
  // Create index.ts
  const indexContent = generateIndexFile(context);
  await fs.writeFile(path.join(srcDir, 'index.ts'), indexContent);
  
  // Create README.md
  const readmeContent = generateReadme(context);
  await fs.writeFile(path.join(pluginDir, 'README.md'), readmeContent);
}

function generatePluginManifest(context: any): any {
  const baseManifest = {
    name: context.name,
    slug: context.slug,
    version: '1.0.0',
    description: context.description,
    author: context.author,
    platform_version: '1.0.0',
    category: context.type,
  };
  
  // Add type-specific manifest content
  switch (context.type) {
    case 'payment':
      return {
        ...baseManifest,
        hooks: [
          {
            name: 'before_payment_process',
            handler: 'src/hooks/beforePaymentProcess.ts',
            priority: 100,
          },
          {
            name: 'after_payment_success',
            handler: 'src/hooks/afterPaymentSuccess.ts',
            priority: 100,
          },
        ],
        api_endpoints: [
          {
            method: 'POST',
            path: '/process-payment',
            handler: 'src/api/processPayment.ts',
            auth_required: true,
          },
          {
            method: 'POST',
            path: '/webhook',
            handler: 'src/api/webhook.ts',
            auth_required: false,
          },
        ],
        settings_schema: {
          api_key: {
            type: 'string',
            label: 'API Key',
            required: true,
            sensitive: true,
          },
          enabled: {
            type: 'boolean',
            label: 'Enabled',
            default: true,
          },
        },
      };
      
    case 'email':
      return {
        ...baseManifest,
        hooks: [
          {
            name: 'before_email_send',
            handler: 'src/hooks/beforeEmailSend.ts',
            priority: 100,
          },
        ],
        settings_schema: {
          smtp_host: {
            type: 'string',
            label: 'SMTP Host',
            required: true,
          },
          smtp_port: {
            type: 'number',
            label: 'SMTP Port',
            default: 587,
          },
          smtp_user: {
            type: 'string',
            label: 'SMTP Username',
            required: true,
          },
          smtp_password: {
            type: 'string',
            label: 'SMTP Password',
            required: true,
            sensitive: true,
          },
        },
      };
      
    case 'auth':
      return {
        ...baseManifest,
        hooks: [
          {
            name: 'before_authenticate',
            handler: 'src/hooks/beforeAuthenticate.ts',
            priority: 100,
          },
          {
            name: 'after_authenticate',
            handler: 'src/hooks/afterAuthenticate.ts',
            priority: 100,
          },
        ],
        api_endpoints: [
          {
            method: 'POST',
            path: '/auth/login',
            handler: 'src/api/login.ts',
            auth_required: false,
          },
          {
            method: 'POST',
            path: '/auth/logout',
            handler: 'src/api/logout.ts',
            auth_required: true,
          },
        ],
      };
      
    default:
      return baseManifest;
  }
}

function generateIndexFile(context: any): string {
  return `import { ${context.type === 'payment' ? 'PaymentPlugin' : context.type === 'email' ? 'EmailPlugin' : context.type === 'auth' ? 'AuthPlugin' : 'BasePlugin'}, PluginContext } from '${context.packageScope}';

export default class ${context.className}Plugin implements ${context.type === 'payment' ? 'PaymentPlugin' : context.type === 'email' ? 'EmailPlugin' : context.type === 'auth' ? 'AuthPlugin' : 'BasePlugin'} {
  name = '${context.name}';
  version = '1.0.0';
  category = '${context.type}';

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('Initializing ${context.name} plugin');
    
    // Plugin initialization logic here
  }

  async destroy(context: PluginContext): Promise<void> {
    context.logger.info('Destroying ${context.name} plugin');
    
    // Plugin cleanup logic here
  }

${context.type === 'payment' ? `
  async processPayment(context: PluginContext, paymentData: any): Promise<any> {
    context.logger.info('Processing payment', { paymentData });
    
    // Payment processing logic here
    return {
      success: true,
      transactionId: 'txn_' + Date.now(),
      status: 'completed',
    };
  }
` : ''}

${context.type === 'email' ? `
  async sendEmail(context: PluginContext, emailData: any): Promise<any> {
    context.logger.info('Sending email', { emailData });
    
    // Email sending logic here
    return {
      success: true,
      messageId: 'msg_' + Date.now(),
    };
  }
` : ''}

${context.type === 'auth' ? `
  async authenticate(context: PluginContext, credentials: any): Promise<any> {
    context.logger.info('Authenticating user', { credentials });
    
    // Authentication logic here
    return {
      user: { id: 'user_' + Date.now(), email: credentials.email },
      token: 'jwt_token_here',
    };
  }
` : ''}
}
`;
}

function generateReadme(context: any): string {
  return `# ${context.name}

${context.description}

## Installation

1. Add the plugin to your ${context.platformName}
2. Configure the plugin settings
3. Activate the plugin

## Configuration

The plugin requires the following configuration:

${context.type === 'payment' ? `
- \`api_key\`: Your payment provider API key
- \`enabled\`: Whether the payment gateway is enabled
` : ''}

${context.type === 'email' ? `
- \`smtp_host\`: SMTP server hostname
- \`smtp_port\`: SMTP server port (default: 587)
- \`smtp_user\`: SMTP username
- \`smtp_password\`: SMTP password
` : ''}

## Usage

${context.type === 'payment' ? `
### Processing Payments

The plugin integrates with the payment system to process transactions through ${context.name}.

### Webhooks

Configure your payment provider to send webhooks to:
\`POST /plugins/${context.slug}/webhook\`
` : ''}

${context.type === 'email' ? `
### Sending Emails

The plugin automatically sends emails through your SMTP server when triggered by platform events.
` : ''}

${context.type === 'auth' ? `
### Authentication

The plugin provides authentication services for users.

### Endpoints

- \`POST /plugins/${context.slug}/auth/login\` - User login
- \`POST /plugins/${context.slug}/auth/logout\` - User logout
` : ''}

## Development

1. Install dependencies: \`npm install\`
2. Build the plugin: \`npm run build\`
3. Run tests: \`npm test\`

## License

Copyright © ${context.year} ${context.author}
`;
}