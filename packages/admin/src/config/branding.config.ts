export const brandingConfig = {
  name: import.meta.env.VITE_APP_NAME || 'MTC Platform',
  company: import.meta.env.VITE_COMPANY_NAME || 'Your Company',
  logo: {
    light: import.meta.env.VITE_LOGO_URL || '/logo.png',
    dark: import.meta.env.VITE_LOGO_URL || '/logo.png',
    small: import.meta.env.VITE_LOGO_SMALL_URL || '/logo-small.png',
    favicon: '/favicon.ico',
  },
  colors: {
    primary: import.meta.env.VITE_PRIMARY_COLOR || '#2563eb',
    secondary: import.meta.env.VITE_SECONDARY_COLOR || '#64748b',
  },
  socials: {
    twitter: import.meta.env.VITE_TWITTER_URL,
    github: import.meta.env.VITE_GITHUB_URL,
    linkedin: import.meta.env.VITE_LINKEDIN_URL,
  },
  support: {
    email: import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com',
    phone: import.meta.env.VITE_SUPPORT_PHONE,
    url: import.meta.env.VITE_SUPPORT_URL,
  },
};
