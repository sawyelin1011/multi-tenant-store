import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SalesChartProps {
  data?: Array<{ date: string; sales: number; orders: number }>;
}

const defaultData = [
  { date: 'Jan', sales: 4000, orders: 240 },
  { date: 'Feb', sales: 3000, orders: 198 },
  { date: 'Mar', sales: 2000, orders: 180 },
  { date: 'Apr', sales: 2780, orders: 208 },
  { date: 'May', sales: 1890, orders: 148 },
  { date: 'Jun', sales: 2390, orders: 200 },
];

export function SalesChart({ data = defaultData }: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
        <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
