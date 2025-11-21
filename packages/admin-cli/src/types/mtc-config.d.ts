declare module '@mtc-platform/config' {
  export interface BrandConfig {
    brandName: string;
    packageScope: string;
    npmOrg: string;
    githubOrg: string;
    brandColor: string;
    brandLogo: string;
    platformName: string;
    cliName: string;
    docsUrl: string;
    supportEmail: string;
  }

  export function loadBrandConfig(overrides?: Partial<BrandConfig>): BrandConfig;
}
