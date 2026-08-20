import { Activity, AlertCircle, ArrowRight, Boxes, CircleDollarSign, MessageSquareText, MoreHorizontal, Shirt, UsersRound, CalendarDays, ArrowLeft } from "lucide-react";
import { cx, formatDate, orderStatus } from "../shared/helpers";
import { ScreenTitle } from "../ui/screen-title";
import { OrderHeader } from "../orders/order-header";
import { EmptyWorkspace } from "../ui/empty-workspace";
import { Status } from "../ui/status";
import { Link } from "../ui/link";
import type { PrototypeProps } from "../shared/types";
import styles from "../prototype.module.css";
export function OrderScreen({ props, flavor }: { props: PrototypeProps; flavor: string }) {
  const order = props.currentOrder;
  if (!order) return <div className={styles.standardScreen}><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></div>;
  const released = order.projects.filter((project) => project.stage === "Completed").length;
  const progress = order.projects.length ? Math.round((released / order.projects.length) * 100) : 0;
  return (
    <div className={styles.standardScreen}>
      <OrderHeader props={props} />
      <div className={styles.orderTabs}>
        <button type="button" aria-current="page"><Boxes size={16} /> Projects <span>{order.projects.length}</span></button>
        <button type="button"><MessageSquareText size={16} /> Discussion <span>{order.notes ? 1 : 0}</span></button>
        <button type="button"><Activity size={16} /> Activity</button>
        <button type="button" className={styles.moreButton} aria-label="More order actions"><MoreHorizontal size={18} /></button>
      </div>
      <div className={styles.orderBody}>
        <section className={styles.orderProjects}>
          <header><div><span className={styles.eyebrow}>{order.projects.length} projects · {released} released</span><h2>Production progress</h2></div>
          <div className={styles.progressMeter}><span><i style={{ width: progress + "%" }} /></span><small>{progress}% released</small></div></header>
          {props.projects.map((project) => (
            <Link href={props.href("project")} key={project.name} className={styles.projectRow}>
              <span className={cx(styles.projectMark, styles["mark_" + project.tone])}><Shirt size={18} strokeWidth={1.5} aria-hidden /></span>
              <div><strong>{project.name}</strong><small>{project.detail} · {project.dept}</small></div>
              <Status tone={project.tone}>{project.stage}</Status>
              <div className={styles.projectOwner}><span>{project.owner.slice(0, 2).toUpperCase()}</span><small>{project.owner}</small></div>
              <div><small>Due</small><strong>{project.due}</strong></div>
              <span className={styles.paidState}>{project.paid ? <><CircleDollarSign size={15} /> Paid</> : <><AlertCircle size={15} /> Unpaid</>}</span>
              <ArrowRight size={16} aria-hidden />
            </Link>
          ))}
        </section>
        <aside className={styles.orderSummary}>
          <section><span className={styles.eyebrow}>Job brief</span>
            <dl><div><dt>Customer</dt><dd>{order.customer}</dd></div><div><dt>Created</dt><dd>{formatDate(order.createdAt.slice(0, 10))}</dd></div><div><dt>Promise date</dt><dd>{formatDate(order.dueDate)}</dd></div><div><dt>Priority</dt><dd>{order.priority}</dd></div></dl>
          </section>
          <section className={styles.latestNote}><span><MessageSquareText size={16} /> Order notes</span><p>{order.notes || "No notes added yet."}</p></section>
        </aside>
      </div>
    </div>
  );
}