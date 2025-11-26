import axios, { type AxiosInstance } from 'axios';
import { adminConfig } from '@/config/admin.config';
import type { DashboardStats, Tenant, Store, Product, Order, User } from '@/types';

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

// Response interceptor - Return response directly since interceptor returns data
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('api_key');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const unwrap = async <T>(promise: Promise<{ data: { success: boolean; data: T } }>): Promise<T> => {
  const response = await promise;
  return response.data.data;
};

// API Methods
export const api = {
  // Auth
  login: (apiKey: string) => unwrap<any>(apiClient.post('/auth/login', { apiKey })),
  logout: () => {
    localStorage.removeItem('api_key');
    window.location.href = '/login';
  },

  // Dashboard
  getDashboardStats: () => unwrap<DashboardStats>(apiClient.get('/dashboard/stats')),

  // Tenants
  getTenants: (params?: any) => unwrap<Tenant[]>(apiClient.get('/tenants', { params })),
  getTenant: (id: string) => unwrap<Tenant>(apiClient.get(`/tenants/${id}`)),
  createTenant: (data: any) => unwrap<Tenant>(apiClient.post('/tenants', data)),
  updateTenant: (id: string, data: any) => unwrap<Tenant>(apiClient.put(`/tenants/${id}`, data)),
  deleteTenant: (id: string) => unwrap<void>(apiClient.delete(`/tenants/${id}`)),

  // Stores
  getStores: (params?: any) => unwrap<Store[]>(apiClient.get('/stores', { params })),
  getStore: (id: string) => unwrap<Store>(apiClient.get(`/stores/${id}`)),
  createStore: (data: any) => unwrap<Store>(apiClient.post('/stores', data)),
  updateStore: (id: string, data: any) => unwrap<Store>(apiClient.put(`/stores/${id}`, data)),
  deleteStore: (id: string) => unwrap<void>(apiClient.delete(`/stores/${id}`)),

  // Products
  getProducts: (params?: any) => unwrap<Product[]>(apiClient.get('/products', { params })),
  getProduct: (id: string) => unwrap<Product>(apiClient.get(`/products/${id}`)),
  createProduct: (data: any) => unwrap<Product>(apiClient.post('/products', data)),
  updateProduct: (id: string, data: any) => unwrap<Product>(apiClient.put(`/products/${id}`, data)),
  deleteProduct: (id: string) => unwrap<void>(apiClient.delete(`/products/${id}`)),
  bulkUploadProducts: (storeId: string, data: any) =>
    unwrap<any>(apiClient.post(`/products/bulk-upload`, { storeId, products: data })),

  // Orders
  getOrders: (params?: any) => unwrap<Order[]>(apiClient.get('/orders', { params })),
  getOrder: (id: string) => unwrap<Order>(apiClient.get(`/orders/${id}`)),
  updateOrder: (id: string, data: any) => unwrap<Order>(apiClient.put(`/orders/${id}`, data)),

  // Users
  getUsers: (params?: any) => unwrap<User[]>(apiClient.get('/users', { params })),
  getUser: (id: string) => unwrap<User>(apiClient.get(`/users/${id}`)),
  createUser: (data: any) => unwrap<User>(apiClient.post('/users', data)),
  updateUser: (id: string, data: any) => unwrap<User>(apiClient.put(`/users/${id}`, data)),
  deleteUser: (id: string) => unwrap<void>(apiClient.delete(`/users/${id}`)),

  // Analytics
  getAnalytics: (params?: any) => unwrap<any>(apiClient.get('/analytics', { params })),
  getSalesChart: (params?: any) => unwrap<any>(apiClient.get('/analytics/sales', { params })),
  getRevenueChart: (params?: any) => unwrap<any>(apiClient.get('/analytics/revenue', { params })),
};
