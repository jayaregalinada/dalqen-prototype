import { AlertTriangle, ArrowRight, Clock3, ClipboardList, MessageSquareText, PackageCheck } from 'lucide-react';
import { cx, formatDate } from '../shared/helpers';
import { ScreenTitle } from '../ui/screen-title';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { UserDashboard } from '../workspace/user-dashboard';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function DispatchDashboard({ props }: { props: PrototypeProps }) {
  if (props.user.role !== 'owner') return <UserDashboard user={props.user} props={props} />;
  if (props.orderRows.length === 0) {
    return <><ScreenTitle eyebrow='New workspace' title='Start your production desk.' copy='Create the first job order to populate your dashboard and queues.' /><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></>;
  }
  const flowStages = ['Layout', 'Approval', 'Printing', 'Heatpress', 'Sewing', 'QC', 'For Release'];
  return (
    <>
      <ScreenTitle eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())} title="Keep today moving." copy="Your production floor, ordered by what needs a decision next." actions={<Link href={props.href('orders')} className={styles.primaryButton}>Open all queues <ArrowRight size={16} /></Link>} />
      <div className={styles.pulseStrip}>
        {[{ label: 'Overdue', value: props.stats.overdue, icon: AlertTriangle, tone: 'danger' }, { label: 'Due today', value: props.stats.dueToday, icon: Clock3, tone: 'warning' }, { label: 'Waiting approval', value: props.stats.waiting, icon: MessageSquareText, tone: 'info' }, { label: 'Ready to release', value: props.stats.ready, icon: PackageCheck, tone: 'success' }].map(({ label, value, icon: Icon, tone }) => (
          <Link href={props.href('orders', 'projects')} key={label} className={styles.pulseCard}><span className={styles["pulse_" + tone]}><Icon size={18} strokeWidth={1.6} aria-hidden /></span><strong>{value}</strong><div><b>{label}</b><small>View work</small></div><ArrowRight size={16} aria-hidden /></Link>
        ))}
      </div>
      <section className={styles.dispatchBoard}>
        <header><div><span className={styles.eyebrow}>Live production</span><h2>Work in motion</h2></div><div className={styles.boardLegend}><span><i className={styles.redDot} />QC issue</span><span><i className={styles.amberDot} />Waiting</span></div></header>
        <div className={styles.flowRail}>
          {flowStages.map((stage, index) => {
            const count = props.projectRows.filter((p) => p.stage === stage).length;
            const hot = props.projectRows.filter((p) => p.stage === stage && p.flag !== 'On track').length;
            return <Link href={props.href('orders', 'projects')} key={stage} className={cx(styles.flowStage, hot > 0 && styles.flowHot)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong><b>{count}</b>{hot > 0 && <small>{hot} need attention</small>}</Link>;
          })}
        </div>
      </section>
      <div className={styles.dashboardSplit}>
        <section className={styles.attentionList}><header><div><span className={styles.eyebrow}>Recently added</span><h2>Current work</h2></div><Link href={props.href('orders')}>See queue <ArrowRight size={14} /></Link></header>
          {props.projectRows.slice(0, 3).map((p) => <Link href={props.href('project')} key={p.order + "-" + p.project}><span><ClipboardList size={17} aria-hidden /></span><div><strong>{p.order} · {p.project}</strong><small>{p.stage} · {p.owner}</small></div><Status tone={p.flag === "On track" ? "success" : 'warning'}>{p.flag}</Status></Link>)}
        </section>
        <section className={styles.releaseStack}><span className={styles.eyebrow}>Release desk</span><h2>{props.stats.ready === 0 ? "Nothing waiting for release." : props.stats.ready + " ready for release."}</h2><p>Projects appear here after production and QC are complete.</p><Link href={props.href('orders', 'projects')} className={styles.darkButton}>Open project queue <ArrowRight size={16} /></Link></section>
      </div>
    </>
  );
}