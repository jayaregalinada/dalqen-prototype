import { IconAlertTriangle, IconArrowRight, IconClock, IconClipboardList, IconMessages, IconChecklist } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScreenTitle } from '../ui/screen-title';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { UserDashboard } from '../workspace/user-dashboard';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import type { PrototypeProps } from '../shared/types';

export function DispatchDashboard({ props }: { props: PrototypeProps }) {
  if (props.user.role !== 'owner') return <UserDashboard user={props.user} props={props} />;
  if (props.orderRows.length === 0) {
    return <><ScreenTitle eyebrow="New workspace" title="Start your production desk." copy="Create the first job order to populate your dashboard and queues." /><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></>;
  }
  const flowStages = ['Layout', 'Approval', 'Printing', 'Heatpress', 'Sewing', 'QC', 'Release'];
  const stats = [
    { label: 'Overdue', value: props.stats.overdue, icon: IconAlertTriangle, tone: 'danger' },
    { label: 'Due today', value: props.stats.dueToday, icon: IconClock, tone: 'warning' },
    { label: 'Waiting approval', value: props.stats.waiting, icon: IconMessages, tone: 'info' },
    { label: 'Ready to release', value: props.stats.ready, icon: IconChecklist, tone: 'success' },
  ];
  return (
    <>
      <ScreenTitle
        eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
        title="Keep today moving."
        copy="Your production floor, ordered by what needs a decision next."
        actions={<Button asChild><Link href={props.href('orders')}>Open all queues <IconArrowRight aria-hidden /></Link></Button>}
      />
      <div className="mb-4 grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Link href={props.href('orders')} key={label}>
            <Card size="sm">
              <CardContent className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3">
                <span className={tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-700' : tone === 'info' ? 'text-blue-700' : 'text-emerald-700'}><Icon aria-hidden /></span>
                <strong className="text-2xl font-semibold">{value}</strong>
                <span className="grid"><span className="font-medium">{label}</span><small className="text-muted-foreground">View work</small></span>
                <IconArrowRight aria-hidden className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mb-4">
        <CardHeader>
          <div><CardDescription>Live production</CardDescription><CardTitle>Work in motion</CardTitle></div>
          <CardAction><div className="flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-red-600" />QC issue</span><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-amber-500" />Waiting</span></div></CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 max-[1100px]:min-w-[910px] max-[1100px]:overflow-x-auto">
            {flowStages.map((stage, index) => {
              const stageOrders = props.orderRows.filter((order) => order.stage === stage);
              const hot = stageOrders.some((order) => order.status === 'QC issue');
              return (
                <Link href={props.href('orders')} key={stage} className={hot ? 'grid min-h-[130px] content-center gap-1.5 bg-destructive/5 p-3.5' : 'grid min-h-[130px] content-center gap-1.5 p-3.5'}>
                  <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <strong className="font-medium text-muted-foreground">{stage}</strong>
                  <span className="text-3xl font-semibold">{stageOrders.length}</span>
                  {hot && <small className="text-muted-foreground">Needs attention</small>}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(260px,0.55fr)] gap-4 max-[820px]:grid-cols-1">
        <Card>
          <CardHeader>
            <div><CardDescription>Recently added</CardDescription><CardTitle>Current work</CardTitle></div>
            <CardAction><Button asChild variant="link" size="sm"><Link href={props.href('orders')}>See queue <IconArrowRight aria-hidden /></Link></Button></CardAction>
          </CardHeader>
          <CardContent>
            {props.orderRows.slice(0, 3).map((order) => (
              <Link href={props.orderHref(order.ref)} key={order.ref} className="grid min-h-[63px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 border-b py-3 last:border-b-0">
                <IconClipboardList aria-hidden className="text-muted-foreground" />
                <span className="grid"><strong>{order.ref} · {order.title}</strong><small className="text-muted-foreground">{order.stage} · {order.customer}</small></span>
                <Status tone={order.status === 'In production' ? 'info' : order.status === 'QC issue' ? 'danger' : 'warning'}>{order.status}</Status>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div><CardDescription>Release desk</CardDescription><CardTitle>{props.stats.ready === 0 ? 'Nothing waiting for release' : `${props.stats.ready} ready for release`}</CardTitle></div>
            <CardAction><Button asChild variant="outline" size="sm"><Link href={props.href('orders')}>Open orders <IconArrowRight aria-hidden /></Link></Button></CardAction>
          </CardHeader>
          <CardContent><p className="text-muted-foreground">Orders appear here once they are in Release and QC is passed.</p></CardContent>
        </Card>
      </div>
    </>
  );
}
