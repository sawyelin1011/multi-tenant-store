import axios, { type AxiosInstance } from 'axios';
import { adminConfig } from '@/config/admin.config';

export const apiClient: AxiosInstance = axios.create({
  baseURL: adminConfig.api.baseUrl,
  timeout: adminConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('api_key');
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('api_key');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  // Auth
  login: (apiKey: string) => apiClient.post('/auth/login', { apiKey }),
  logout: () => {
    localStorage.removeItem('api_key');
    window.location.href = '/login';
  },

  // Dashboard
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),

  // Tenants
  getTenants: (params?: any) => apiClient.get('/admin/tenants', { params }),
  getTenant: (id: string) => apiClient.get(`/admin/tenants/${id}`),
  createTenant: (data: any) => apiClient.post('/admin/tenants', data),
  updateTenant: (id: string, data: any) => apiClient.put(`/admin/tenants/${id}`, data),
  deleteTenant: (id: string) => apiClient.delete(`/admin/tenants/${id}`),

  // Stores
  getStores: (params?: any) => apiClient.get('/storefront/stores', { params }),
  getStore: (id: string) => apiClient.get(`/storefront/stores/${id}`),
  createStore: (data: any) => apiClient.post('/storefront/stores', data),
  updateStore: (id: string, data: any) => apiClient.put(`/storefront/stores/${id}`, data),
  deleteStore: (id: string) => apiClient.delete(`/storefront/stores/${id}`),

  // Products
  getProducts: (params?: any) => apiClient.get('/storefront/products', { params }),
  getProduct: (id: string) => apiClient.get(`/storefront/products/${id}`),
  createProduct: (data: any) => apiClient.post('/storefront/products', data),
  updateProduct: (id: string, data: any) => apiClient.put(`/storefront/products/${id}`, data),
  deleteProduct: (id: string) => apiClient.delete(`/storefront/products/${id}`),
  bulkUploadProducts: (storeId: string, data: any) =>
    apiClient.post(`/storefront/products/bulk-upload`, { storeId, products: data }),

  // Orders
  getOrders: (params?: any) => apiClient.get('/storefront/orders', { params }),
  getOrder: (id: string) => apiClient.get(`/storefront/orders/${id}`),
  updateOrder: (id: string, data: any) => apiClient.put(`/storefront/orders/${id}`, data),

  // Users
  getUsers: (params?: any) => apiClient.get('/admin/users', { params }),
  getUser: (id: string) => apiClient.get(`/admin/users/${id}`),
  createUser: (data: any) => apiClient.post('/admin/users', data),
  updateUser: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),

  // Analytics
  getAnalytics: (params?: any) => apiClient.get('/admin/analytics', { params }),
  getSalesChart: (params?: any) => apiClient.get('/admin/analytics/sales', { params }),
  getRevenueChart: (params?: any) => apiClient.get('/admin/analytics/revenue', { params }),
};
