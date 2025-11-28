import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import type { ApiError, AuthResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const API_KEY = import.meta.env.VITE_API_KEY || ''

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const redirectToLogin = () => {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    const apiKey = useAuthStore.getState().apiKey || API_KEY
    
    config.headers = config.headers ?? {}
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    } else if (apiKey) {
      config.headers['x-api-key'] = apiKey
    }
    
    // Add current tenant/store context
    const currentStore = useAuthStore.getState().currentStore
    if (currentStore) {
      config.headers['x-store-id'] = currentStore.id
    }
    
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      const { token } = useAuthStore.getState()
      if (token) {
        useAuthStore.getState().logout()
      }
      redirectToLogin()
    }
    return Promise.reject(error)
  },
)

export const buildQueryString = (params?: Record<string, string | number | boolean | undefined | null>) => {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export async function fetcher<T>(url: string): Promise<T> {
  const response = await api.get<T>(url)
  return response.data
}

export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await api.get<T>(url, config)
    return response.data
  },
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.post<T>(url, data, config)
    return response.data
  },
  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.put<T>(url, data, config)
    return response.data
  },
  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.patch<T>(url, data, config)
    return response.data
  },
  delete: async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await api.delete<T>(url, config)
    return response.data
  },
}

// Multi-Tenant API Endpoints
export const tenantsApi = {
  list: (params?: any) => apiClient.get('/tenants', { params }),
  get: (id: string) => apiClient.get(`/tenants/${id}`),
  create: (data: any) => apiClient.post('/tenants', data),
  update: (id: string, data: any) => apiClient.patch(`/tenants/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tenants/${id}`),
}

export const storesApi = {
  list: (params?: any) => apiClient.get('/stores', { params }),
  get: (id: string) => apiClient.get(`/stores/${id}`),
  create: (data: any) => apiClient.post('/stores', data),
  update: (id: string, data: any) => apiClient.patch(`/stores/${id}`, data),
  delete: (id: string) => apiClient.delete(`/stores/${id}`),
}

export const productsApi = {
  list: (params?: any) => apiClient.get('/products', { params }),
  get: (id: string) => apiClient.get(`/products/${id}`),
  create: (data: any) => apiClient.post('/products', data),
  update: (id: string, data: any) => apiClient.patch(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
}

export const ordersApi = {
  list: (params?: any) => apiClient.get('/orders', { params }),
  get: (id: string) => apiClient.get(`/orders/${id}`),
  update: (id: string, data: any) => apiClient.patch(`/orders/${id}`, data),
}

export const usersApi = {
  list: (params?: any) => apiClient.get('/users', { params }),
  get: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: any) => apiClient.post('/users', data),
  update: (id: string, data: any) => apiClient.patch(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
}

export const analyticsApi = {
  dashboard: () => apiClient.get('/analytics/dashboard'),
  sales: (params?: any) => apiClient.get('/analytics/sales', { params }),
  revenue: (params?: any) => apiClient.get('/analytics/revenue', { params }),
}

export const authApi = {
  login: (payload: { email: string; password: string }) => 
    apiClient.post<AuthResponse>('/auth/login', payload),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get<UserResponse>('/auth/me'),
  refreshToken: () => apiClient.post<AuthResponse>('/auth/refresh'),
}

type UserResponse = {
  user: AuthResponse['user']
}
