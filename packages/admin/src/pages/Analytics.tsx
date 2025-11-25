import { ChartCard } from '@/components/dashboard/ChartCard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

export function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">View comprehensive platform analytics</p>
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
        <ChartCard title="Revenue Trend" description="Last 6 months">
          <div className="h-64 flex items-center justify-center text-muted-foreground">Revenue chart (Recharts)</div>
        </ChartCard>

        <ChartCard title="Orders by Status" description="Current month">
          <div className="h-64 flex items-center justify-center text-muted-foreground">Pie chart (Recharts)</div>
        </ChartCard>

        <ChartCard title="Top Products" description="By sales volume">
          <div className="h-64 flex items-center justify-center text-muted-foreground">Bar chart (Recharts)</div>
        </ChartCard>

        <ChartCard title="Customer Growth" description="Monthly signups">
          <div className="h-64 flex items-center justify-center text-muted-foreground">Line chart (Recharts)</div>
        </ChartCard>
      </div>
    </div>
  );
}
