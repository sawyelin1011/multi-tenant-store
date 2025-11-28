import { StatCard } from './StatCard';
import { Building2, Store, Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalTenants?: number;
  totalStores?: number;
  totalProducts?: number;
  totalOrders?: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
}

interface DashboardGridProps {
  stats?: DashboardStats;
}

export function DashboardGrid({ stats }: DashboardGridProps) {
  const { totalTenants = 0, totalStores = 0, totalProducts = 0, totalOrders = 0, totalRevenue = 0, monthlyRevenue = 0 } = stats || {};

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard
        title="Total Tenants"
        value={totalTenants}
        description="Active tenant accounts"
        icon={<Building2 className="h-4 w-4 text-primary" />}
      />
      <StatCard
        title="Total Stores"
        value={totalStores}
        description="Active storefronts"
        icon={<Store className="h-4 w-4 text-primary" />}
      />
      <StatCard
        title="Total Products"
        value={totalProducts}
        description="Products in catalog"
        icon={<Package className="h-4 w-4 text-primary" />}
      />
      <StatCard
        title="Total Orders"
        value={totalOrders}
        description="All time orders"
        icon={<ShoppingCart className="h-4 w-4 text-primary" />}
      />
      <StatCard
        title="Total Revenue"
        value={`${totalRevenue.toLocaleString()}`}
        description="All time revenue"
        icon={<DollarSign className="h-4 w-4 text-primary" />}
        trend={{ value: '+12.5% from last month', direction: 'up' }}
      />
      <StatCard
        title="Monthly Revenue"
        value={`${monthlyRevenue.toLocaleString()}`}
        description="This month"
        icon={<TrendingUp className="h-4 w-4 text-primary" />}
        trend={{ value: '+8.3% from last month', direction: 'up' }}
      />
    </div>
  );
}
