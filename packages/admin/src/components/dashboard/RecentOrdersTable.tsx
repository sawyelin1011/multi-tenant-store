import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types';

interface RecentOrdersTableProps {
  orders?: Order[];
}

export function RecentOrdersTable({ orders = [] }: RecentOrdersTableProps) {
  if (!orders.length) {
    return <p className="text-sm text-muted-foreground">No recent orders yet.</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.customerEmail}</TableCell>
              <TableCell>
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: order.currency,
                }).format(order.total)}
              </TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
