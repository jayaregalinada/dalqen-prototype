import { IconArrowRight, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { navigateTo } from '../shared/helpers';
import { roleDefs } from '../shared/constants';
import { ScreenTitle } from '../ui/screen-title';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import type { User, PrototypeProps } from '../shared/types';

export function UserDashboard({ user, props }: { user: User; props: PrototypeProps }) {
  const def = roleDefs.find((role) => role.key === user.role)!;
  return (
    <div>
      <ScreenTitle eyebrow={def.label} title={`${user.name}'s workspace`} copy="Job orders assigned to you." actions={props.canCreateOrder ? <Button type="button" onClick={props.openNewOrder}><IconPlus aria-hidden /> New job order</Button> : undefined} />
      {props.orderRows.length === 0 ? (
        <EmptyWorkspace openNewOrder={props.openNewOrder} compact canCreateOrder={props.canCreateOrder} />
      ) : (
        <Card>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Order / reference</TableHead><TableHead>Stage</TableHead><TableHead>Due</TableHead><TableHead className="text-right"><span className="sr-only">Open</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {props.orderRows.map((order) => (
                  <TableRow key={order.ref} onClick={() => navigateTo(props.orderHref(order.ref))} className="cursor-pointer">
                    <TableCell><strong className="block">{order.title}</strong><small className="block font-mono text-muted-foreground">{order.ref} · {order.customer}</small></TableCell>
                    <TableCell><Status tone={order.status === 'QC issue' ? 'danger' : 'success'}>{order.stage}</Status></TableCell>
                    <TableCell className="font-mono text-muted-foreground">{order.due}</TableCell>
                    <TableCell className="text-right"><Button asChild variant="ghost" size="icon"><Link href={props.orderHref(order.ref)} aria-label={`Open ${order.title}`}><IconArrowRight aria-hidden /></Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
