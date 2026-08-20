import { cx } from '../shared/helpers';
import { Link } from '../ui/link';
import { AppNav } from '../ui/app-nav';
import { TopUtility } from '../ui/top-utility';
import { DispatchDashboard } from '../dispatch/dispatch-dashboard';
import { OrdersScreen } from '../orders/orders-screen';
import { OrderScreen } from '../orders/order-screen';
import { ProjectScreen } from '../orders/project-screen';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function DispatchBoard(props: PrototypeProps) {
  return (
    <div className={cx(styles.prototype, styles.dispatch)}>
      <aside className={styles.dispatchSidebar}>
        <Link href={props.href('dashboard')} className={styles.brand}><span>D</span><div><b>Dalqen</b><small>My Workshop</small></div></Link>
        <AppNav variant="A" screen={props.screen} href={props.href} openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} />
        <div className={styles.sidebarFoot}><span>Production health</span><strong><i /> {props.stats.activeProjects} active projects</strong><small>{props.stats.overdue + props.stats.qcIssues} need attention</small></div>
      </aside>
      <main className={styles.dispatchMain}>
        <TopUtility user={props.user} onUserClick={props.openUserSwitcher} />
        <div className={styles.dispatchCanvas}>
          {props.screen === 'dashboard' && <DispatchDashboard props={props} />}
          {props.screen === 'orders' && <OrdersScreen props={props} flavor='dispatch' />}
          {props.screen === 'order' && <OrderScreen props={props} flavor='dispatch' />}
          {props.screen === 'project' && <ProjectScreen props={props} flavor='dispatch' />}
        </div>
      </main>
    </div>
  );
}