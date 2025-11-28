export type ThemeOption = {
  id: string
  label: string
  href?: string
}

export const baseThemeOptions: ThemeOption[] = [
  { id: 'default', label: 'Default (Carbon Night)' },
  { id: 'midnight', label: 'Midnight Neon', href: '/themes/midnight.css' },
]

export const THEME_STORAGE_KEY = 'cms-active-theme'
export const CUSTOM_THEME_STORAGE_KEY = 'cms-custom-themes'
