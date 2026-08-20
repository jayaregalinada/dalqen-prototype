import { Filter, Plus, SlidersHorizontal } from 'lucide-react';
import { QueueToggle } from '../ui/queue-toggle';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import type { PrototypeProps, OrderRow, ProjectRow } from '../shared/types';
import styles from '../prototype.module.css';
export function JacketOrders({ props }: { props: PrototypeProps }) {
  return (
    <div className={styles.jacketList}>
      <div className={styles.jacketListHead}><div><span className={styles.jacketKicker}>Production archive / active</span><h1>{props.queueMode === "orders" ? "Job jackets" : 'Project index'}</h1></div>{props.canCreateOrder && <button type="button" className={styles.jacketAction} onClick={props.openNewOrder}><Plus size={16} /> Open new jacket</button>}</div>
      <div className={styles.jacketToolbar}><QueueToggle mode={props.queueMode} setMode={props.setQueueMode} /><div><button type="button"><Filter size={15} /> Active work</button><button type="button"><SlidersHorizontal size={15} /> Refine <span>2</span></button></div></div>
      {(props.queueMode === 'orders' ? props.orderRows : props.projectRows).length === 0
        ? <EmptyWorkspace openNewOrder={props.openNewOrder} compact canCreateOrder={props.canCreateOrder} />
        : <div className={styles.jacketLedger}>
            <div className={styles.jacketLedgerHead}><span>No.</span><span>Reference & job</span><span>{props.queueMode === "orders" ? "Customer" : 'Order / owner'}</span><span>Progress / stage</span><span>Promise</span><span>Status</span></div>
            {(props.queueMode === 'orders' ? props.orderRows : props.projectRows).map((raw, index) => {
              const row = props.queueMode === 'orders' ? raw as OrderRow : null;
              const projectRow = props.queueMode === 'projects' ? raw as ProjectRow : null;
              return <Link href={props.href(projectRow ? "project" : 'order')} key={row?.ref ?? (projectRow?.order + "-" + projectRow?.project)}>
                <span className={styles.jacketNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div><small className={styles.mono}>{row?.ref ?? projectRow?.order}</small><strong>{row?.title ?? projectRow?.project}</strong></div>
                <span>{row?.customer ?? (projectRow?.owner + " · " + projectRow?.dept)}</span>
                <span>{row ? (row.progress + ' released') : projectRow?.stage}</span><b>{row?.due ?? projectRow?.due}</b>
                <Status tone={(row?.status === 'QC issue' || projectRow?.flag === 'Rework') ? "danger" : (row?.status === 'Waiting approval' || projectRow?.flag === 'Unassigned') ? "warning" : 'info'}>{row?.status ?? projectRow?.flag}</Status>
              </Link>;
            })}
          </div>}
    </div>
  );
}