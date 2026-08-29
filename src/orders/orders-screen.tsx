import { IconChevronDown, IconFilter, IconPlus, IconSearch, IconAdjustmentsHorizontal, IconX } from '@tabler/icons-react';
import { ScreenTitle } from '../ui/screen-title';
import { QueueToggle } from '../ui/queue-toggle';
import { OrderTable } from '../orders/order-table';
import { KanbanBoard } from '../ui/kanban-board';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { Button } from '@/components/ui/button';
import type { PrototypeProps } from '../shared/types';

export function OrdersScreen({ props, flavor }: { props: PrototypeProps; flavor: string }) {
  return (
    <div className="animate-[enter_580ms_cubic-bezier(0.22,0.75,0.15,1)_both]">
      <ScreenTitle eyebrow='Production ledger' title={props.queueMode === 'orders' ? 'Orders' : props.queueMode === 'kanban' ? 'Kanban' : 'Project queues'}
        copy={props.queueMode === 'orders' ? 'Track every job order from intake to final release.' : props.queueMode === 'kanban' ? 'Move projects across stages visually.' : 'Move work by stage, owner, and department.'}
        actions={props.canCreateOrder ? <Button type='button' onClick={props.openNewOrder}><IconPlus size={16} /> New job order</Button> : undefined} />
      <div className="mb-3 flex items-center justify-between gap-4">
        <QueueToggle mode={props.queueMode} setMode={props.setQueueMode} />
        <div className="flex items-center gap-2">
          <Button type='button' variant="outline"><IconFilter size={15} /> Saved: {props.queueMode === 'orders' ? 'Active orders' : props.queueMode === 'kanban' ? 'All projects' : 'My department'}<IconChevronDown size={14} /></Button>
          <Button type='button' variant="outline"><IconAdjustmentsHorizontal size={15} /> Filters <span className="size-4 rounded-md bg-primary text-primary-foreground">{'2'}</span></Button>
          <label className="flex h-[38px] w-[215px] items-center gap-2 rounded-[10px] border bg-card px-3 text-muted-foreground">
            <IconSearch size={15} /><span className="sr-only">Search table</span><input placeholder='Search this view' className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
          </label>
        </div>
      </div>
      {props.queueMode === 'projects' && (
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-foreground">
            Stage: Active
            <button type='button' aria-label='Remove stage filter' className="grid size-5 place-items-center rounded-full bg-black/5 hover:bg-black/10"><IconX size={12} /></button>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-foreground">
            Due: Next 7 days
            <button type='button' aria-label='Remove due date filter' className="grid size-5 place-items-center rounded-full bg-black/5 hover:bg-black/10"><IconX size={12} /></button>
          </span>
          <button type='button' className="bg-transparent text-xs font-bold text-primary hover:underline">Clear all</button>
        </div>
      )}
      {props.queueMode === 'kanban'
        ? <KanbanBoard props={props} />
        : (props.queueMode === 'orders' ? props.orderRows : props.projectRows).length === 0
          ? <EmptyWorkspace openNewOrder={props.openNewOrder} compact canCreateOrder={props.canCreateOrder} />
          : <OrderTable props={props} />}
      <div className="flex justify-between px-1 py-3 text-xs text-muted-foreground"><span>Showing {(props.queueMode === 'orders' ? props.orderRows : props.projectRows).length} {props.queueMode}</span><span>Sorted by attention, then due date</span></div>
    </div>
  );
}