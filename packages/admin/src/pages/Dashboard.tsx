import { useEffect, useState } from 'react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { SalesChart } from '@/components/charts/SalesChart';
import { OrderStatusChart } from '@/components/charts/OrderStatusChart';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { AnalyticsChart } from '@/components/charts/AnalyticsChart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { api } from '@/lib/api';
import type { DashboardStats } from '@/types';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.warn('Dashboard stats not available, using demo data');
        setStats({
          totalStores: 12,
          totalProducts: 234,
          totalOrders: 456,
          totalRevenue: 125430,
          recentOrders: [],
          salesTrend: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Welcome to your admin console</p>
      </div>

      <DashboardGrid
        stats={{
          totalTenants: stats?.totalStores ?? 0,
          totalStores: stats?.totalStores ?? 0,
          totalProducts: stats?.totalOrders ?? 0,
          totalOrders: stats?.totalOrders ?? 0,
          totalRevenue: parseInt(String(stats?.totalRevenue ?? 0), 10),
          monthlyRevenue: parseInt(String(stats?.totalRevenue ?? 0), 10) / 12,
        }}
      />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Sales Trend" description="Last 6 months">
          <SalesChart />
        </ChartCard>

        <ChartCard title="Order Status" description="Distribution">
          <OrderStatusChart />
        </ChartCard>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Revenue Overview" description="Last 6 months">
          <RevenueChart />
        </ChartCard>

        <ChartCard title="Analytics" description="Weekly metrics">
          <AnalyticsChart />
        </ChartCard>
      </div>

      <ChartCard title="Recent Orders">
        <RecentOrdersTable orders={stats?.recentOrders} />
      </ChartCard>
    </div>
  );
}
