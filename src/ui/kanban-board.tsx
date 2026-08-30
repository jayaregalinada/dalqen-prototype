import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { Link } from '../ui/link';
import { Status } from '../ui/status';
import type { PrototypeProps } from '../shared/types';

const activeStages = ['Layout', 'Approval', 'Document', 'Sizing', 'Printing', 'Heatpress', 'Sewing', 'QC', 'For Release'];

export function KanbanBoard({ props }: { props: PrototypeProps }) {
  const orders = props.orderRows;
  const columns = useMemo(() => Object.fromEntries(activeStages.map((stage) => [stage, orders.filter((order) => order.stage === stage)])), [orders]);

  if (orders.length === 0) return <EmptyWorkspace openNewOrder={props.openNewOrder} compact canCreateOrder={props.canCreateOrder} />;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 py-1">
      {activeStages.map((stage) => {
        const cards = columns[stage];
        if (!cards?.length) return null;
        return (
          <div key={stage} className="flex flex-col gap-2">
            <header className="flex items-center justify-between">
              <span className="font-medium">{stage}</span>
              <Status tone="neutral">{cards.length}</Status>
            </header>
            <div className="flex flex-col gap-2">
              {cards.map((order) => (
                <Link key={order.ref} href={props.orderHref(order.ref)}>
                  <Card size="sm">
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <strong>{order.title}</strong>
                        <Status tone={order.status === 'QC issue' ? 'danger' : order.status === 'Waiting approval' ? 'warning' : 'success'}>{order.status === 'In production' ? 'Active' : order.status}</Status>
                      </div>
                      <div className="flex gap-2.5 text-xs text-muted-foreground"><span className="font-mono">{order.ref}</span><span>{order.customer}</span><span>{order.due}</span></div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
