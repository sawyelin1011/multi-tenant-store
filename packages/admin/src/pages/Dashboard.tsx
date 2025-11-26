import { useEffect, useState } from 'react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin console</p>
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
        <ChartCard title="Sales Trend" description="Last 30 days">
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Integrate SalesChart here
          </div>
        </ChartCard>

        <ChartCard title="Order Status" description="Current month">
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Integrate OrderStatusChart here
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Recent Orders">
        <RecentOrdersTable orders={stats?.recentOrders} />
      </ChartCard>
    </div>
  );
}
