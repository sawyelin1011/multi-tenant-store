import type { BrandConfig, BrandConfigOverrides, LoadBrandConfigOptions } from './types.js';

/**
 * Default brand configuration for MTC Platform
 */
export const BRAND_DEFAULTS: BrandConfig = {
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
 * Environment variable mappings for overrides
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

function applyEnvOverrides(target: BrandConfig, env: Record<string, string | undefined>): void {
  for (const [key, envVar] of Object.entries(ENV_MAPPINGS)) {
    const value = env[envVar];
    if (value) {
      const typedKey = key as keyof BrandConfig;
      target[typedKey] = value as BrandConfig[keyof BrandConfig];
    }
  }
}

/**
 * Load brand configuration with env and manual overrides
 */
export function loadBrandConfig(
  overrides?: BrandConfigOverrides,
  env: Record<string, string | undefined> = process.env,
): BrandConfig {
  const config: BrandConfig = { ...BRAND_DEFAULTS };
  applyEnvOverrides(config, env);

  if (overrides) {
    Object.assign(config, overrides);
  }

  return config;
}

/**
 * Load brand configuration from CLI flags/arguments
 */
export function loadBrandConfigFromArgs(
  args: Record<string, unknown>,
  options?: LoadBrandConfigOptions,
): BrandConfig {
  const overrides: BrandConfigOverrides = {};

  if (typeof args.brand === 'string') overrides.brandName = args.brand;
  if (typeof args.scope === 'string') overrides.packageScope = args.scope;
  if (typeof args['npm-org'] === 'string') overrides.npmOrg = args['npm-org'];
  if (typeof args['github-org'] === 'string') overrides.githubOrg = args['github-org'];
  if (typeof args['brand-color'] === 'string') overrides.brandColor = args['brand-color'];
  if (typeof args['brand-logo'] === 'string') overrides.brandLogo = args['brand-logo'];
  if (typeof args['platform-name'] === 'string') overrides.platformName = args['platform-name'];
  if (typeof args['cli-name'] === 'string') overrides.cliName = args['cli-name'];
  if (typeof args['docs-url'] === 'string') overrides.docsUrl = args['docs-url'];
  if (typeof args['support-email'] === 'string') overrides.supportEmail = args['support-email'];

  const combinedOverrides: BrandConfigOverrides = {
    ...options?.overrides,
    ...overrides,
  };

  return loadBrandConfig(combinedOverrides, options?.env);
}

/**
 * Convenience helpers
 */
export function getPackageScope(packageName: string, config: BrandConfig = brand): string {
  return `@${config.packageScope}/${packageName}`;
}

export function getCliName(config: BrandConfig = brand): string {
  return config.cliName;
}

export function getPlatformName(config: BrandConfig = brand): string {
  return config.platformName;
}

export const brand = loadBrandConfig();
