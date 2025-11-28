import {
  LayoutDashboard,
  Building2,
  Store,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import { adminConfig } from '@/config/admin.config';

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  featureFlag?: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Tenants',
    href: '/tenants',
    icon: <Building2 className="h-5 w-5" />,
    featureFlag: adminConfig.features.enableTenantManagement,
  },
  {
    label: 'Stores',
    href: '/stores',
    icon: <Store className="h-5 w-5" />,
    featureFlag: adminConfig.features.enableStoreManagement,
  },
  {
    label: 'Products',
    href: '/products',
    icon: <Package className="h-5 w-5" />,
    featureFlag: adminConfig.features.enableProductManagement,
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: <ShoppingCart className="h-5 w-5" />,
    featureFlag: adminConfig.features.enableOrderManagement,
  },
  {
    label: 'Users',
    href: '/users',
    icon: <Users className="h-5 w-5" />,
    featureFlag: adminConfig.features.enableUserManagement,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    featureFlag: adminConfig.features.enableAnalytics,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
    featureFlag: adminConfig.features.enableSettings,
  },
].filter((item) => item.featureFlag !== false);
