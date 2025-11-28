import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthResponse, User } from '@/types'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/constants'

const writeAuthCookie = (token?: string | null) => {
  if (typeof document === 'undefined') return

  if (!token) {
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
    return
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (payload: AuthResponse) => void
  logout: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: ({ token, user }) => {
        set({ token, user, isAuthenticated: true })
        writeAuthCookie(token)
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        writeAuthCookie(null)
      },
      setUser: (user: User | null) => set((state) => ({ ...state, user })),
    }),
    {
      name: 'cf-cms-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token, user, isAuthenticated }) => ({ token, user, isAuthenticated }),
    },
  ),
)
