import { IconArrowLeft, IconCalendar, IconUsersGroup } from '@tabler/icons-react';
import { Link } from '../ui/link';
import { Status } from '../ui/status';
import { formatDate, orderStatus } from '../shared/helpers';
import type { PrototypeProps } from '../shared/types';

export function OrderHeader({ props }: { props: PrototypeProps }) {
  const order = props.currentOrder;
  if (!order) return null;
  return (
    <div className="mb-[19px] grid gap-3">
      <Link href={props.href('orders')} className="inline-flex min-h-9 w-fit items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"><IconArrowLeft size={16} aria-hidden /> Orders</Link>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">{order.ref}</span>
        <h1 className="font-heading text-[clamp(28px,3vw,38px)] font-semibold leading-tight tracking-[-0.035em]">{order.title}</h1>
        <Status tone="info">{orderStatus(order)}</Status>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><IconUsersGroup size={15} aria-hidden /> {order.customer}</span>
        <span className="inline-flex items-center gap-1.5"><IconCalendar size={15} aria-hidden /> Due {formatDate(order.dueDate).toLowerCase()}</span>
        {order.priority === 'Urgent' && <Status tone='danger'>Urgent</Status>}
      </div>
    </div>
  );
}