import { ChevronDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { ScreenTitle } from '../ui/screen-title';
import { QueueToggle } from '../ui/queue-toggle';
import { OrderTable } from '../orders/order-table';
import { KanbanBoard } from '../ui/kanban-board';
import { EmptyWorkspace } from '../ui/empty-workspace';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function OrdersScreen({ props, flavor }: { props: PrototypeProps; flavor: string }) {
  return (
    <div className={styles.standardScreen}>
      <ScreenTitle eyebrow='Production ledger' title={props.queueMode === 'orders' ? 'Orders' : props.queueMode === 'kanban' ? 'Kanban' : 'Project queues'}
        copy={props.queueMode === 'orders' ? 'Track every job order from intake to final release.' : props.queueMode === 'kanban' ? 'Move projects across stages visually.' : 'Move work by stage, owner, and department.'}
        actions={props.canCreateOrder ? <button className={styles.primaryButton} type='button' onClick={props.openNewOrder}><Filter size={16} /> New job order</button> : undefined} />
      <div className={styles.listControls}><QueueToggle mode={props.queueMode} setMode={props.setQueueMode} /><div className={styles.filterSet}>
        <button type='button'><Filter size={15} /> Saved: {props.queueMode === 'orders' ? 'Active orders' : props.queueMode === 'kanban' ? 'All projects' : 'My department'}<ChevronDown size={14} /></button>
        <button type='button'><SlidersHorizontal size={15} /> Filters <span>2</span></button>
        <label><Search size={15} /><span className={styles.srOnly}>Search table</span><input placeholder='Search this view' /></label>
      </div></div>
      {props.queueMode === 'projects' && <div className={styles.activeFilters}>
        <span>Stage: Active <button type='button' aria-label='Remove stage filter'><X size={12} /></button></span>
        <span>Due: Next 7 days <button type='button' aria-label='Remove due date filter'><X size={12} /></button></span>
        <button type='button'>Clear all</button>
      </div>}
      {props.queueMode === 'kanban'
        ? <KanbanBoard props={props} />
        : (props.queueMode === 'orders' ? props.orderRows : props.projectRows).length === 0
          ? <EmptyWorkspace openNewOrder={props.openNewOrder} compact canCreateOrder={props.canCreateOrder} />
          : <OrderTable props={props} />}
      <div className={styles.tableFoot}><span>Showing {(props.queueMode === 'orders' ? props.orderRows : props.projectRows).length} {props.queueMode}</span><span>Sorted by attention, then due date</span></div>
    </div>
  );
}