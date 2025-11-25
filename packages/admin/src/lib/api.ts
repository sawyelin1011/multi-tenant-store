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

const unwrap = async <T>(promise: Promise<{ data: T }>): Promise<T> => {
  const response = await promise;
  return response.data;
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
  getDashboardStats: () => unwrap<DashboardStats>(apiClient.get('/admin/dashboard/stats')),

  // Tenants
  getTenants: (params?: any) => unwrap<Tenant[]>(apiClient.get('/admin/tenants', { params })),
  getTenant: (id: string) => unwrap<Tenant>(apiClient.get(`/admin/tenants/${id}`)),
  createTenant: (data: any) => unwrap<Tenant>(apiClient.post('/admin/tenants', data)),
  updateTenant: (id: string, data: any) => unwrap<Tenant>(apiClient.put(`/admin/tenants/${id}`, data)),
  deleteTenant: (id: string) => unwrap<void>(apiClient.delete(`/admin/tenants/${id}`)),

  // Stores
  getStores: (params?: any) => unwrap<Store[]>(apiClient.get('/storefront/stores', { params })),
  getStore: (id: string) => unwrap<Store>(apiClient.get(`/storefront/stores/${id}`)),
  createStore: (data: any) => unwrap<Store>(apiClient.post('/storefront/stores', data)),
  updateStore: (id: string, data: any) => unwrap<Store>(apiClient.put(`/storefront/stores/${id}`, data)),
  deleteStore: (id: string) => unwrap<void>(apiClient.delete(`/storefront/stores/${id}`)),

  // Products
  getProducts: (params?: any) => unwrap<Product[]>(apiClient.get('/storefront/products', { params })),
  getProduct: (id: string) => unwrap<Product>(apiClient.get(`/storefront/products/${id}`)),
  createProduct: (data: any) => unwrap<Product>(apiClient.post('/storefront/products', data)),
  updateProduct: (id: string, data: any) => unwrap<Product>(apiClient.put(`/storefront/products/${id}`, data)),
  deleteProduct: (id: string) => unwrap<void>(apiClient.delete(`/storefront/products/${id}`)),
  bulkUploadProducts: (storeId: string, data: any) =>
    unwrap<any>(apiClient.post(`/storefront/products/bulk-upload`, { storeId, products: data })),

  // Orders
  getOrders: (params?: any) => unwrap<Order[]>(apiClient.get('/storefront/orders', { params })),
  getOrder: (id: string) => unwrap<Order>(apiClient.get(`/storefront/orders/${id}`)),
  updateOrder: (id: string, data: any) => unwrap<Order>(apiClient.put(`/storefront/orders/${id}`, data)),

  // Users
  getUsers: (params?: any) => unwrap<User[]>(apiClient.get('/admin/users', { params })),
  getUser: (id: string) => unwrap<User>(apiClient.get(`/admin/users/${id}`)),
  createUser: (data: any) => unwrap<User>(apiClient.post('/admin/users', data)),
  updateUser: (id: string, data: any) => unwrap<User>(apiClient.put(`/admin/users/${id}`, data)),
  deleteUser: (id: string) => unwrap<void>(apiClient.delete(`/admin/users/${id}`)),

  // Analytics
  getAnalytics: (params?: any) => unwrap<any>(apiClient.get('/admin/analytics', { params })),
  getSalesChart: (params?: any) => unwrap<any>(apiClient.get('/admin/analytics/sales', { params })),
  getRevenueChart: (params?: any) => unwrap<any>(apiClient.get('/admin/analytics/revenue', { params })),
};
