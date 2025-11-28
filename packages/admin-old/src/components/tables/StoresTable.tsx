import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Store } from '@/types';
import { Button } from '@/components/ui/button';

interface StoresTableProps {
  stores: Store[];
  onEdit?: (store: Store) => void;
}

export function StoresTable({ stores, onEdit }: StoresTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Tenant ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((store) => (
            <TableRow key={store.id}>
              <TableCell className="font-medium">{store.name}</TableCell>
              <TableCell className="text-muted-foreground">{store.slug}</TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">{store.tenantId}</TableCell>
              <TableCell>
                <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>{store.status}</Badge>
              </TableCell>
              <TableCell>{new Date(store.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => onEdit?.(store)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
