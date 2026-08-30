import { IconArrowRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { navigateTo } from '../shared/helpers';
import { Link } from '../ui/link';
import { Status } from '../ui/status';
import type { PrototypeProps } from '../shared/types';

function OpenLink({ href, label }: { href: string; label: string }) {
  return (
    <TableCell className="text-right">
      <Button asChild variant="ghost" size="icon">
        <Link href={href} aria-label={`Open ${label}`} onClick={(event) => event.stopPropagation()}><IconArrowRight aria-hidden /></Link>
      </Button>
    </TableCell>
  );
}

export function OrderTable({ props }: { props: PrototypeProps }) {
  return (
    <Card>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference / job</TableHead><TableHead>Customer</TableHead><TableHead>Due</TableHead><TableHead>Progress</TableHead><TableHead>Status</TableHead><TableHead className="text-right"><span className="sr-only">Open</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.orderRows.map((row) => (
              <TableRow key={row.ref} onClick={() => navigateTo(props.orderHref(row.ref))} className="cursor-pointer">
                <TableCell className="min-w-[230px]">
                  <small className="block font-mono text-muted-foreground">{row.ref}</small>
                  <strong className="block">{row.title}</strong>
                  {row.priority === 'Urgent' && <Status tone="danger">Urgent</Status>}
                </TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell>{row.due}</TableCell>
                <TableCell><strong>{row.stage}</strong><small className="block text-muted-foreground">stage</small></TableCell>
                <TableCell><Status tone={row.status === 'QC issue' ? 'danger' : row.status === 'Waiting approval' ? 'warning' : row.status === 'Ready for release' || row.status === 'Released' ? 'success' : 'info'}>{row.status}</Status></TableCell>
                <OpenLink href={props.orderHref(row.ref)} label={row.ref} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
