import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AnalyticsChartProps {
  data?: Array<{ label: string; metricA: number; metricB: number }>;
}

const defaultData = [
  { label: 'Week 1', metricA: 4000, metricB: 2400 },
  { label: 'Week 2', metricA: 3000, metricB: 1398 },
  { label: 'Week 3', metricA: 2000, metricB: 9800 },
  { label: 'Week 4', metricA: 2780, metricB: 3908 },
];

export function AnalyticsChart({ data = defaultData }: AnalyticsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorMetricA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorMetricB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="metricA" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMetricA)" />
        <Area type="monotone" dataKey="metricB" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorMetricB)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
