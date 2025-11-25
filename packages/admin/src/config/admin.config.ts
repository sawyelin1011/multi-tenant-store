export const adminConfig = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
  },

  // Branding
  branding: {
    appName: import.meta.env.VITE_APP_NAME || 'MTC Platform',
    logo: import.meta.env.VITE_LOGO_URL || '/logo.png',
    logoSmall: import.meta.env.VITE_LOGO_SMALL_URL || '/logo-small.png',
    favicon: '/favicon.ico',
    company: import.meta.env.VITE_COMPANY_NAME || 'Your Company',
  },

  // Theme
  theme: {
    defaultTheme: (import.meta.env.VITE_THEME as 'light' | 'dark' | 'system') || 'system',
    templates: ['default', 'dark', 'light', 'custom'],
  },

  // Features
  features: {
    enableTenantManagement: import.meta.env.VITE_ENABLE_TENANTS !== 'false',
    enableStoreManagement: import.meta.env.VITE_ENABLE_STORES !== 'false',
    enableProductManagement: import.meta.env.VITE_ENABLE_PRODUCTS !== 'false',
    enableOrderManagement: import.meta.env.VITE_ENABLE_ORDERS !== 'false',
    enableUserManagement: import.meta.env.VITE_ENABLE_USERS !== 'false',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
    enableSettings: true,
  },

  // Layout
  layout: {
    sidebarCollapsedByDefault: false,
    sidebarPosition: 'left' as const,
    headerStyle: 'default',
  },
};
