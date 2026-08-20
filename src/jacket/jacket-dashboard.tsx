import { ArrowRight } from "lucide-react";
import { formatDate } from "../shared/helpers";
import { UserDashboard } from "../workspace/user-dashboard";
import { EmptyWorkspace } from "../ui/empty-workspace";
import { Status } from "../ui/status";
import { Link } from "../ui/link";
import type { PrototypeProps } from "../shared/types";
import styles from "../prototype.module.css";
export function JacketDashboard({ props }: { props: PrototypeProps }) {
  if (props.user.role !== "owner") return <UserDashboard user={props.user} props={props} />;
  if (props.orderRows.length === 0) return <div className={styles.jacketDashboard}><div className={styles.jacketMasthead}><div><span className={styles.jacketKicker}>New production desk</span><h1>Open your first<br/><em>job jacket.</em></h1></div><p>Add the first customer order and its projects to begin the production record.</p></div><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></div>;
  return (
    <div className={styles.jacketDashboard}>
      <div className={styles.jacketMasthead}><div><span className={styles.jacketKicker}>Today’s production brief</span><h1>What needs<br/><em>your mark</em> today.</h1></div><p>Start with exceptions, then move through the floor. Everything due today is collected here.</p></div>
      <section className={styles.jacketTabs}>
        <Link href={props.href("orders", "projects")}><span>01</span><strong>{props.stats.overdue}</strong><b>Overdue</b><small>Past promise date</small></Link>
        <Link href={props.href("orders", "projects")}><span>02</span><strong>{props.stats.waiting}</strong><b>Need approval</b><small>Approval stage</small></Link>
        <Link href={props.href("orders", "projects")}><span>03</span><strong>{props.stats.qcIssues}</strong><b>QC exceptions</b><small>Needs rework</small></Link>
        <Link href={props.href("orders", "projects")}><span>04</span><strong>{props.stats.ready}</strong><b>Ready to release</b><small>QC complete</small></Link>
      </section>
      <div className={styles.jacketDesk}>
        <section className={styles.jacketPriority}><header><span>Job jackets</span><small>Ordered by promise date</small></header>{props.orderRows.slice(0, 4).map((row, index) =>
          <Link href={props.href("order")} key={row.ref}>
            <span className={styles.jacketNumber}>{String(index + 1).padStart(2, "0")}</span>
            <div><small className={styles.mono}>{row.ref}</small><strong>{row.title}</strong><span>{row.customer}</span></div>
            <div><Status tone={row.status === "QC issue" ? "danger" : row.status === "Waiting approval" ? "warning" : "info"}>{row.status}</Status><small>{row.progress} released</small></div>
            <b>{row.due}</b><ArrowRight size={16} />
          </Link>)}</section>
        <aside className={styles.shiftNote}><span>Shift note / just now</span><h2>{props.stats.activeProjects} projects entered.</h2><p>Your first records are ready for assignment, artwork, and production updates.</p><div><span>Active work</span><strong>{props.stats.activeProjects}</strong></div><Link href={props.href("orders", "projects")}>Review stage queues <ArrowRight size={15} /></Link></aside>
      </div>
    </div>
  );
}