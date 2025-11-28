import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';

interface OrdersTableProps {
  orders: Order[];
  onView?: (order: Order) => void;
}

export function OrdersTable({ orders, onView }: OrdersTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium font-mono text-xs">{order.id}</TableCell>
              <TableCell>{order.customerEmail}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: order.currency,
                }).format(order.total)}
              </TableCell>
              <TableCell>
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>
              </TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => onView?.(order)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
