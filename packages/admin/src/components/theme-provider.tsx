import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  THEME_STORAGE_KEY,
  CUSTOM_THEME_STORAGE_KEY,
  baseThemeOptions,
  type ThemeOption,
} from '@/config/themes'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: string
}

type ThemeContextValue = {
  themeId: string
  setTheme: (nextThemeId: string) => void
  themes: ThemeOption[]
  registerTheme: (theme: ThemeOption) => void
  removeTheme: (themeId: string) => void
  customThemes: ThemeOption[]
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children, defaultTheme = 'default' }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState(defaultTheme)
  const [customThemes, setCustomThemes] = useState<ThemeOption[]>([])

  // Load persisted theme (browser only)
  useEffect(() => {
    const persisted = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null
    if (persisted && persisted !== themeId) {
      setThemeId(persisted)
    }
  }, [])

  // Load custom themes from storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY)
      if (stored) {
        const parsed: ThemeOption[] = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setCustomThemes(parsed)
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored custom themes', error)
    }
  }, [])

  // Persist custom themes when they change
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(customThemes))
  }, [customThemes])

  const setTheme = (nextThemeId: string) => {
    setThemeId(nextThemeId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, nextThemeId)
    }
  }

  const registerTheme = (theme: ThemeOption) => {
    setCustomThemes((prev) => {
      const exists = prev.find((item) => item.id === theme.id)
      if (exists) {
        return prev.map((item) => (item.id === theme.id ? { ...item, ...theme } : item))
      }
      return [...prev, theme]
    })
  }

  const removeTheme = (id: string) => {
    setCustomThemes((prev) => prev.filter((item) => item.id !== id))
    if (themeId === id) {
      const fallback = baseThemeOptions[0]?.id || 'default'
      setTheme(fallback)
    }
  }

  const themes = useMemo(() => [...baseThemeOptions, ...customThemes], [customThemes])

  // Apply selected theme to document and optionally load CSS file
  useEffect(() => {
    const selected = themes.find((option) => option.id === themeId) ?? themes[0] ?? baseThemeOptions[0]
    if (!selected) return
    if (selected.id !== themeId) {
      setTheme(selected.id)
      return
    }
    const root = document.documentElement
    root.setAttribute('data-theme', selected.id)

    const linkId = 'dynamic-theme-stylesheet'
    const existing = document.getElementById(linkId) as HTMLLinkElement | null

    if (selected.href) {
      if (existing) {
        if (existing.getAttribute('href') !== selected.href) {
          existing.setAttribute('href', selected.href)
        }
      } else {
        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        link.href = selected.href
        document.head.appendChild(link)
      }
    } else if (existing) {
      existing.remove()
    }
  }, [themeId, themes])

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      setTheme,
      themes,
      registerTheme,
      removeTheme,
      customThemes,
    }),
    [themeId, themes, customThemes],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeManager() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeManager must be used within ThemeProvider')
  }
  return context
}
