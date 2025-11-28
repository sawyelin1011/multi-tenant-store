import { useEffect, useState } from 'react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { api } from '@/lib/api';
import type { DashboardStats } from '@/types';

export function DashboardNew() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard stats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner className="py-16" size="lg" />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin console</p>
      </div>

      <DashboardGrid
        stats={{
          totalTenants: 12,
          totalStores: 45,
          totalProducts: 234,
          totalOrders: 1456,
          totalRevenue: 125430,
          monthlyRevenue: 23450,
        }}
      />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Sales Trend" description="Last 30 days">
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart placeholder (integrate Recharts)
          </div>
        </ChartCard>

        <ChartCard title="Order Status" description="Current month">
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart placeholder (integrate Recharts)
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Recent Orders">
        <RecentOrdersTable orders={stats?.recentOrders} />
      </ChartCard>
    </div>
  );
}
