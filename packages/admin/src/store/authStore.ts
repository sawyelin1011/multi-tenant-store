import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  apiKey: string | null;
  isAuthenticated: boolean;
  setApiKey: (key: string) => void;
  logout: () => void;
}

const defaultApiKey = import.meta.env.VITE_API_KEY || null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: defaultApiKey,
      isAuthenticated: Boolean(defaultApiKey),
      setApiKey: (key) => set({ apiKey: key, isAuthenticated: true }),
      logout: () => set({ apiKey: defaultApiKey, isAuthenticated: Boolean(defaultApiKey) }),
    }),
    { name: 'admin-auth' }
  )
);
