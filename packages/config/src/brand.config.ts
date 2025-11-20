/**
 * Default MTC Platform brand configuration
 */
export interface BrandConfig {
  /** Brand name for display purposes */
  brandName: string;
  /** NPM package scope (without @) */
  packageScope: string;
  /** NPM organization name */
  npmOrg: string;
  /** GitHub organization name */
  githubOrg: string;
  /** Primary brand color (hex code) */
  brandColor: string;
  /** Brand logo URL or path */
  brandLogo: string;
  /** Platform display name */
  platformName: string;
  /** CLI binary name */
  cliName: string;
  /** Documentation URL */
  docsUrl: string;
  /** Support email */
  supportEmail: string;
}

/**
 * Default brand configuration for MTC Platform
 */
export const defaultBrandConfig: BrandConfig = {
  brandName: 'MTC Platform',
  packageScope: 'mtc-platform',
  npmOrg: 'mtc-platform',
  githubOrg: 'mtc-platform',
  brandColor: '#2563eb',
  brandLogo: 'https://cdn.mtcplatform.com/logo.svg',
  platformName: 'MTC Platform',
  cliName: 'mtc-admin',
  docsUrl: 'https://docs.mtcplatform.com',
  supportEmail: 'support@mtcplatform.com',
};

/**
 * Environment variable mappings
 */
const ENV_MAPPINGS: Record<keyof BrandConfig, string> = {
  brandName: 'MTC_BRAND_NAME',
  packageScope: 'MTC_PACKAGE_SCOPE',
  npmOrg: 'MTC_NPM_ORG',
  githubOrg: 'MTC_GITHUB_ORG',
  brandColor: 'MTC_BRAND_COLOR',
  brandLogo: 'MTC_BRAND_LOGO',
  platformName: 'MTC_PLATFORM_NAME',
  cliName: 'MTC_CLI_NAME',
  docsUrl: 'MTC_DOCS_URL',
  supportEmail: 'MTC_SUPPORT_EMAIL',
};

/**
 * Load brand configuration with environment variable overrides
 */
export function loadBrandConfig(overrides?: Partial<BrandConfig>): BrandConfig {
  const config = { ...defaultBrandConfig };

  // Apply environment variable overrides
  for (const [key, envVar] of Object.entries(ENV_MAPPINGS)) {
    const envValue = process.env[envVar];
    if (envValue) {
      (config as any)[key] = envValue;
    }
  }

  // Apply direct overrides
  if (overrides) {
    Object.assign(config, overrides);
  }

  return config;
}

/**
 * Load brand configuration from CLI arguments
 */
export function loadBrandConfigFromArgs(args: Record<string, any>): BrandConfig {
  const overrides: Partial<BrandConfig> = {};

  if (args.brand) overrides.brandName = args.brand;
  if (args.scope) overrides.packageScope = args.scope;
  if (args['npm-org']) overrides.npmOrg = args['npm-org'];
  if (args['github-org']) overrides.githubOrg = args['github-org'];
  if (args['brand-color']) overrides.brandColor = args['brand-color'];
  if (args['brand-logo']) overrides.brandLogo = args['brand-logo'];
  if (args['platform-name']) overrides.platformName = args['platform-name'];
  if (args['cli-name']) overrides.cliName = args['cli-name'];
  if (args['docs-url']) overrides.docsUrl = args['docs-url'];
  if (args['support-email']) overrides.supportEmail = args['support-email'];

  return loadBrandConfig(overrides);
}

/**
 * Get the full package name with scope
 */
export function getPackageScope(packageName: string, config?: BrandConfig): string {
  const brandConfig = config || loadBrandConfig();
  return `@${brandConfig.packageScope}/${packageName}`;
}

/**
 * Get the CLI binary name
 */
export function getCliName(config?: BrandConfig): string {
  const brandConfig = config || loadBrandConfig();
  return brandConfig.cliName;
}

/**
 * Get the platform display name
 */
export function getPlatformName(config?: BrandConfig): string {
  const brandConfig = config || loadBrandConfig();
  return brandConfig.platformName;
}

/**
 * Export the current brand configuration
 */
export const brand = loadBrandConfig();