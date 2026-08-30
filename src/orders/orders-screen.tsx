import { IconAdjustmentsHorizontal, IconChevronDown, IconFilter, IconPlus, IconSearch } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ScreenTitle } from '../ui/screen-title';
import { QueueToggle } from '../ui/queue-toggle';
import { OrderTable } from '../orders/order-table';
import { KanbanBoard } from '../ui/kanban-board';
import { EmptyWorkspace } from '../ui/empty-workspace';
import type { PrototypeProps } from '../shared/types';

export function OrdersScreen({ props, flavor: _flavor }: { props: PrototypeProps; flavor: string }) {
  return (
    <div>
      <ScreenTitle
        eyebrow="Production ledger"
        title={props.queueMode === 'orders' ? 'Orders' : 'Kanban'}
        copy={props.queueMode === 'orders' ? 'Track every job order from intake to final release.' : 'Move orders across stages visually.'}
        actions={props.canCreateOrder ? <Button type="button" onClick={props.openNewOrder}><IconPlus aria-hidden /> New job order</Button> : undefined}
      />
      <div className="mb-3 flex items-center justify-between gap-4">
        <QueueToggle mode={props.queueMode} setMode={props.setQueueMode} />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline"><IconFilter aria-hidden /> Saved: {props.queueMode === 'orders' ? 'Active orders' : 'All orders'}<IconChevronDown aria-hidden /></Button>
          <Button type="button" variant="outline"><IconAdjustmentsHorizontal aria-hidden /> Filters <Badge variant="secondary">2</Badge></Button>
          <InputGroup className="w-[215px]">
            <InputGroupAddon><IconSearch aria-hidden /></InputGroupAddon>
            <InputGroupInput aria-label="Search this view" placeholder="Search this view" />
          </InputGroup>
        </div>
      </div>
      {props.queueMode === 'kanban'
        ? <KanbanBoard props={props} />
        : props.orderRows.length === 0
          ? <EmptyWorkspace openNewOrder={props.openNewOrder} compact canCreateOrder={props.canCreateOrder} />
          : <OrderTable props={props} />}
      <div className="flex justify-between px-1 py-3 text-xs text-muted-foreground"><span>Showing {props.orderRows.length} {props.queueMode}</span><span>Sorted by attention, then due date</span></div>
    </div>
  );
}
