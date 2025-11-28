import brandDefinition from './brand.json';

export interface AdminBrandConfig {
  name: string;
  platformName: string;
  tagline: string;
  primaryColor: string;
  supportEmail: string;
  docsUrl: string;
  packageScope: string;
  navigation: Array<{ label: string; href: string }>;
}

export const brand = brandDefinition as AdminBrandConfig;
