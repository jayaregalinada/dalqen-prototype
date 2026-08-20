import { ArrowLeft, CalendarDays, UsersRound } from 'lucide-react';
import { Link } from '../ui/link';
import { Status } from '../ui/status';
import { formatDate, orderStatus } from '../shared/helpers';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function OrderHeader({ props }: { props: PrototypeProps }) {
  const order = props.currentOrder;
  if (!order) return null;
  return (
    <div className={styles.orderHeader}>
      <Link href={props.href('orders')} className={styles.backLink}><ArrowLeft size={16} aria-hidden /> Orders</Link>
      <div className={styles.orderIdentity}>
        <span className={styles.mono}>{order.ref}</span><h1>{order.title}</h1><Status tone="info">{orderStatus(order)}</Status>
      </div>
      <div className={styles.orderMeta}>
        <span><UsersRound size={15} aria-hidden /> {order.customer}</span>
        <span><CalendarDays size={15} aria-hidden /> Due {formatDate(order.dueDate).toLowerCase()}</span>
        {order.priority === 'Urgent' && <Status tone='danger'>Urgent</Status>}
      </div>
    </div>
  );
}
