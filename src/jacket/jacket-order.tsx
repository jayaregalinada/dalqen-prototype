import { ArrowLeft, ArrowRight, MessageSquareText } from 'lucide-react';
import { formatDate } from '../shared/helpers';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function JacketOrder({ props }: { props: PrototypeProps }) {
  const order = props.currentOrder;
  if (!order) return <div className={styles.jacketOrder}><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></div>;
  const released = order.projects.filter((p) => p.stage === 'Completed').length;
  return (
    <div className={styles.jacketOrder}>
      <Link href={props.href('orders')} className={styles.backLink}><ArrowLeft size={15} /> Job jackets</Link>
      <div className={styles.jacketFolderHead}><div><span className={styles.mono}>{order.ref} / ACTIVE</span><h1>{order.title}</h1></div><div className={styles.jacketStamp}><span>Promise</span><strong>{formatDate(order.dueDate).toUpperCase()}</strong><b>{order.priority.toUpperCase()}</b></div></div>
      <div className={styles.jacketOrderMeta}><span>Client<strong>{order.customer}</strong></span><span>Opened<strong>{formatDate(order.createdAt.slice(0, 10))}</strong></span><span>Projects<strong>{order.projects.length} total · {released} released</strong></span><span>Notes<strong>{order.notes ? "Added" : 'None'}</strong></span></div>
      <div className={styles.jacketOrderGrid}><section><header><span>Project inserts</span><small>Click any insert to open its production record</small></header>
        {props.projects.map((project, index) => <Link href={props.href('project')} key={project.name}><span className={styles.jacketNumber}>{String(index + 1).padStart(2, '0')}</span><div><strong>{project.name}</strong><small>{project.detail} · {project.owner}</small></div><Status tone={project.tone}>{project.stage}</Status><span>{project.paid ? 'Paid' : 'Unpaid'}</span><ArrowRight size={15} /></Link>)}
      </section><aside><span className={styles.jacketKicker}>Order annotation</span><MessageSquareText size={22} strokeWidth={1.4} /><p>{order.notes || "No notes were added to this order."}</p><button type="button">Start discussion</button></aside></div>
    </div>
  );
}