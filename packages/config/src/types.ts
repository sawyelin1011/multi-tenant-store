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

export type BrandConfigOverrides = Partial<BrandConfig>;

export interface LoadBrandConfigOptions {
  /** Additional overrides to apply after env/flag resolution */
  overrides?: BrandConfigOverrides;
  /** Custom environment dictionary (defaults to process.env) */
  env?: Record<string, string | undefined>;
}
