import { ArrowRight, Bell, Menu, Plus, Search } from 'lucide-react';
import { cx, formatDate } from '../shared/helpers';
import { Link } from '../ui/link';
import { JacketDashboard } from '../jacket/jacket-dashboard';
import { JacketOrders } from '../jacket/jacket-orders';
import { JacketOrder } from '../jacket/jacket-order';
import { JacketProject } from '../jacket/jacket-project';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function JobJacket(props: PrototypeProps) {
  return (
    <div className={cx(styles.prototype, styles.jacket)}>
      <header className={styles.jacketHeader}>
        <button type="button" className={styles.jacketMenu} aria-label="Open menu"><Menu size={18} /></button>
        <Link href={props.href('dashboard')} className={styles.jacketBrand}><span>DALQEN</span><small>Production desk</small></Link>
        <div className={styles.jacketHeaderTools}>
          <label><Search size={16} /><span className={styles.srOnly}>Search job jackets</span><input placeholder="Find a job jacket" /></label>
          <button type="button" aria-label="Notifications"><Bell size={17} /></button>
          <button type="button" onClick={props.openUserSwitcher} aria-label="Switch user">{props.user.initials}</button>
        </div>
      </header>
      <div className={styles.jacketLayout}>
        <aside className={styles.jacketIndex}>
          <span className={styles.indexLabel}>Index</span>
          <nav aria-label="Workspace index">
            <Link href={props.href('dashboard')} aria-current={props.screen === "dashboard" ? "page" : undefined}><span>01</span>Today</Link>
            <Link href={props.href('orders')} aria-current={props.screen === "orders" ? "page" : undefined}><span>02</span>Job jackets</Link>
            <a href="#customers" onClick={(e) => e.preventDefault()}><span>03</span>Customers</a>
            <a href="#reports" onClick={(e) => e.preventDefault()}><span>04</span>Reports</a>
          </nav>
          {props.canCreateOrder && <button type='button' className={styles.jacketNew} onClick={props.openNewOrder}><Plus size={16} /> New job</button>}
          <div className={styles.jacketDate}><strong>{new Date().getDate()}</strong><span>{new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date()).toUpperCase()}<br/>{new Date().getFullYear()}</span></div>
        </aside>
        <main className={styles.jacketPaper}>
          {props.screen === 'dashboard' && <JacketDashboard props={props} />}
          {props.screen === 'orders' && <JacketOrders props={props} />}
          {props.screen === 'order' && <JacketOrder props={props} />}
          {props.screen === 'project' && <JacketProject props={props} />}
        </main>
      </div>
    </div>
  );
}