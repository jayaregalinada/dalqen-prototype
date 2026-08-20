import { Bell, Search } from 'lucide-react';
import { cx } from '../shared/helpers';
import { Link } from '../ui/link';
import { ConsoleDashboard } from '../console/console-dashboard';
import { OrdersScreen } from '../orders/orders-screen';
import { OrderScreen } from '../orders/order-screen';
import { ProjectScreen } from '../orders/project-screen';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function OpsConsole(props: PrototypeProps) {
  return (
    <div className={cx(styles.prototype, styles.console)}>
      <header className={styles.consoleHeader}>
        <Link href={props.href('dashboard')} className={styles.consoleBrand}><span>DQ</span><b>Dalqen Operations</b></Link>
        <nav aria-label="Primary"><Link href={props.href('dashboard')} aria-current={props.screen === "dashboard" ? "page" : undefined}>Overview</Link><Link href={props.href('orders')} aria-current={props.screen === "orders" ? "page" : undefined}>Work ledger</Link><a href="#customers" onClick={(e) => e.preventDefault()}>Customers</a></nav>
        <div className={styles.consoleTools}><button type="button"><Search size={17} /><span>Search</span><kbd>⌘K</kbd></button><button type="button" aria-label="Notifications"><Bell size={17} /></button><button type="button" className={styles.consoleProfile} onClick={props.openUserSwitcher} aria-label="Switch user">{props.user.initials}</button></div>
      </header>
      <div className={styles.consoleTicker}><span><i className={styles.liveDot} /> Live floor</span><b>{props.stats.activeProjects} active projects</b><span>{props.stats.overdue} overdue</span><span>{props.stats.waiting} waiting approval</span><span>{props.stats.qcIssues} QC exceptions</span><time>Updated just now</time></div>
      <main className={styles.consoleMain}>
        {props.screen === 'dashboard' && <ConsoleDashboard props={props} />}
        {props.screen === 'orders' && <OrdersScreen props={props} flavor='console' />}
        {props.screen === 'order' && <OrderScreen props={props} flavor='console' />}
        {props.screen === 'project' && <ProjectScreen props={props} flavor='console' />}
      </main>
    </div>
  );
}