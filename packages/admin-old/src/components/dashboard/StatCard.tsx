import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
}

export function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</CardTitle>
        <div className="rounded-xl p-2.5 bg-gradient-to-br from-primary/10 to-chart-1/10 group-hover:from-primary/20 group-hover:to-chart-1/20 transition-all group-hover:scale-110 shadow-lg shadow-primary/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1.5">{description}</p>}
        {trend && (
          <div className={`flex items-center gap-1.5 text-xs mt-3 font-semibold px-2 py-1 rounded-lg w-fit ${trend.direction === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
            {trend.direction === 'up' ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />}
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
