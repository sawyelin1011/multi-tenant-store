import { loadBrandConfig, type BrandConfig } from '@mtc-platform/config';

export interface BrandOptions {
  brand?: string;
  scope?: string;
  platformName?: string;
  docsUrl?: string;
  supportEmail?: string;
  npmOrg?: string;
  githubOrg?: string;
  brandColor?: string;
  brandLogo?: string;
  cliName?: string;
}

export function resolveBrandConfig(options: BrandOptions = {}): BrandConfig {
  const overrides: Partial<BrandConfig> = {};

  if (options.brand) overrides.brandName = options.brand;
  if (options.scope) overrides.packageScope = options.scope;
  if (options.platformName) overrides.platformName = options.platformName;
  if (options.docsUrl) overrides.docsUrl = options.docsUrl;
  if (options.supportEmail) overrides.supportEmail = options.supportEmail;
  if (options.npmOrg) overrides.npmOrg = options.npmOrg;
  if (options.githubOrg) overrides.githubOrg = options.githubOrg;
  if (options.brandColor) overrides.brandColor = options.brandColor;
  if (options.brandLogo) overrides.brandLogo = options.brandLogo;
  if (options.cliName) overrides.cliName = options.cliName;

  return loadBrandConfig(overrides);
}

export function extractBrandOptions(options: Record<string, any>): BrandOptions {
  const lookup = (key: string, fallbackKey?: string) => options[key] ?? (fallbackKey ? options[fallbackKey] : undefined);

  return {
    brand: lookup('brand'),
    scope: lookup('scope'),
    platformName: lookup('platformName', 'platform-name'),
    docsUrl: lookup('docsUrl', 'docs-url'),
    supportEmail: lookup('supportEmail', 'support-email'),
    npmOrg: lookup('npmOrg', 'npm-org'),
    githubOrg: lookup('githubOrg', 'github-org'),
    brandColor: lookup('brandColor', 'brand-color'),
    brandLogo: lookup('brandLogo', 'brand-logo'),
    cliName: lookup('cliName', 'cli-name'),
  };
}

export function getScopedPackageName(packageScope: string, slug: string): string {
  return packageScope ? `@${packageScope}/${slug}` : slug;
}
