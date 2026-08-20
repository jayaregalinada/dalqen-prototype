import { ArrowRight, CheckCircle2, ClipboardList, FileText, Plus, Printer, Settings2, UserRound } from 'lucide-react';
import { UserDashboard } from '../workspace/user-dashboard';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function ConsoleDashboard({ props }: { props: PrototypeProps }) {
  if (props.user.role !== 'owner') return <UserDashboard user={props.user} props={props} />;
  if (props.orderRows.length === 0) return <div className={styles.consoleDashboard}><header className={styles.consolePageHead}><div><span>OPS / NEW WORKSPACE</span><h1>Production control</h1></div><div>{props.canCreateOrder && <button type='button' onClick={props.openNewOrder}><Plus size={15} /> New order</button>}</div></header><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></div>;
  return (
    <div className={styles.consoleDashboard}>
      <header className={styles.consolePageHead}><div><span>OPS / LIVE WORKSPACE</span><h1>Production control</h1></div><div><button type="button"><Printer size={15} /> Print floor sheet</button>{props.canCreateOrder && <button type="button" onClick={props.openNewOrder}><Plus size={15} /> New order</button>}</div></header>
      <section className={styles.consoleKpis}>
        {[{ label: 'Delivery exposure', value: props.stats.overdue, note: 'Overdue orders', tone: 'danger' }, { label: 'Due today', value: props.stats.dueToday, note: 'Promise date today', tone: 'warning' }, { label: 'Active projects', value: props.stats.activeProjects, note: 'Across all routes', tone: 'info' }, { label: 'Released', value: props.stats.released, note: 'Completed projects', tone: 'success' }].map((item) => (
          <Link href={props.href('orders', 'projects')} key={item.label} className={styles.consoleKpi}><span>{item.label}</span><strong>{item.value}</strong><small className={styles["text_" + item.tone]}>{item.note}</small><ArrowRight size={15} /></Link>
        ))}
      </section>
      <div className={styles.consoleGrid}>
        <section className={styles.controlTable}><header><div><h2>Exception queue</h2><span>Ordered by delivery impact</span></div><button type="button"><Settings2 size={15} /> Configure</button></header>
          <div className={styles.controlTableHead}><span>Risk</span><span>Job / project</span><span>Exception</span><span>Owner</span><span>Due</span></div>
          {props.projectRows.slice(0, 4).map((row) => <Link href={props.href('project')} key={row.order + '-' + row.project}><Status tone={row.flag === 'On track' ? 'success' : 'warning'}>{row.flag === 'On track' ? 'OK' : 'P1'}</Status><strong>{row.order} · {row.project}</strong><span>{row.stage}</span><span>{row.owner}</span><b>{row.due}</b></Link>)}
        </section>
        <section className={styles.capacityPanel}><header><h2>Stage load</h2><Link href={props.href('orders', 'projects')}>Details</Link></header>
          {['Layout', 'Approval', 'Printing', 'Heatpress', 'Sewing', 'QC'].map((name) => {
            const count = props.projectRows.filter((p) => p.stage === name).length;
            const value = props.stats.activeProjects ? Math.round((count / props.stats.activeProjects) * 100) : 0;
            return <div className={styles.capacityRow} key={name}><span>{name}<b>{count}</b></span><div><i style={{ transform: 'scaleX(' + (value / 100) + ')' }} /></div><small>{value}%</small></div>;
          })}
        </section>
      </div>
      <section className={styles.consoleTimeline}><header><h2>Floor activity</h2><span>Shared workspace</span></header>
        <div><span><CheckCircle2 size={15} /> {props.currentOrder?.ref} created</span><time>Now</time><span><ClipboardList size={15} /> {props.currentOrder?.projects.length} projects added</span><time>Now</time><span><UserRound size={15} /> Awaiting assignment</span><time>Next</time><span><FileText size={15} /> Artwork not uploaded</span><time>Next</time></div>
      </section>
    </div>
  );
}