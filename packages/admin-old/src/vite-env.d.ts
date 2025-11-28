/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_COMPANY_NAME: string;
  readonly VITE_LOGO_URL: string;
  readonly VITE_LOGO_SMALL_URL: string;
  readonly VITE_THEME: 'light' | 'dark' | 'system';
  readonly VITE_TEMPLATE: string;
  readonly VITE_ENABLE_TENANTS: string;
  readonly VITE_ENABLE_STORES: string;
  readonly VITE_ENABLE_PRODUCTS: string;
  readonly VITE_ENABLE_ORDERS: string;
  readonly VITE_ENABLE_USERS: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENV: 'development' | 'staging' | 'production';
  readonly VITE_PRIMARY_COLOR: string;
  readonly VITE_SECONDARY_COLOR: string;
  readonly VITE_TWITTER_URL: string;
  readonly VITE_GITHUB_URL: string;
  readonly VITE_LINKEDIN_URL: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_SUPPORT_PHONE: string;
  readonly VITE_SUPPORT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
