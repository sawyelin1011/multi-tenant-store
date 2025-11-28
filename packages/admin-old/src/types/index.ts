export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  type: 'digital' | 'physical';
  status: 'active' | 'inactive' | 'draft';
  images?: string[];
  downloadUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  storeId: string;
  customerId: string;
  customerEmail: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  total: number;
  currency: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'manager';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
  salesTrend: ChartData[];
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
}

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: MenuItem[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
