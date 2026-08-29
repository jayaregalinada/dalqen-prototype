import { Link } from '../ui/link';
import { AppNav } from '../ui/app-nav';
import { TopUtility } from '../ui/top-utility';
import { DispatchDashboard } from '../dispatch/dispatch-dashboard';
import { OrdersScreen } from '../orders/orders-screen';
import { OrderScreen } from '../orders/order-screen';
import { ProjectScreen } from '../orders/project-screen';
import type { PrototypeProps } from '../shared/types';

export function DispatchBoard(props: PrototypeProps) {
  return (
    <div className="grid min-h-dvh bg-background text-foreground font-sans text-sm leading-[1.45] text-foreground grid-cols-1 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="sticky top-0 flex h-dvh flex-col border-r bg-sidebar px-4 py-6">
        <Link href={props.href('dashboard')} className="mb-7 flex items-center gap-3 mx-1.5 hover:opacity-80">
          <span className="grid size-9 place-items-center rounded-[12px_12px_4px_12px] bg-primary font-heading text-xl font-extrabold text-[#d8f461]">D</span>
          <span className="grid"><b className="text-[15px] tracking-[-0.02em]">Dalqen</b><small className="text-muted-foreground text-xs">My Workshop</small></span>
        </Link>
        <AppNav screen={props.screen} href={props.href} openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} />
        <div className="mt-auto grid gap-1.5 rounded-[14px] bg-muted p-3.5">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Production health</span>
          <strong className="text-xs font-bold"><i className="mr-1.5 inline-block size-[7px] rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(41,161,110,0.12)]" /> {props.stats.activeProjects} active projects</strong>
          <small className="text-xs text-muted-foreground">{props.stats.overdue + props.stats.qcIssues} need attention</small>
        </div>
      </aside>
      <main className="min-w-0">
        <TopUtility user={props.user} onUserClick={props.openUserSwitcher} />
        <div className="mx-auto w-full max-w-[1440px] px-[clamp(20px,3vw,42px)] pt-[30px] pb-[100px]">
          {props.screen === 'dashboard' && <DispatchDashboard props={props} />}
          {props.screen === 'orders' && <OrdersScreen props={props} flavor='dispatch' />}
          {props.screen === 'order' && <OrderScreen props={props} flavor='dispatch' />}
          {props.screen === 'project' && <ProjectScreen props={props} flavor='dispatch' />}
        </div>
      </main>
    </div>
  );
}