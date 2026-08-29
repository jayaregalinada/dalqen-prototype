import { IconAlertTriangle, IconArrowRight, IconClock, IconClipboardList, IconMessages, IconChecklist } from '@tabler/icons-react';
import { ScreenTitle } from '../ui/screen-title';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { UserDashboard } from '../workspace/user-dashboard';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { PrototypeProps } from '../shared/types';

export function DispatchDashboard({ props }: { props: PrototypeProps }) {
  if (props.user.role !== 'owner') return <UserDashboard user={props.user} props={props} />;
  if (props.orderRows.length === 0) {
    return <><ScreenTitle eyebrow='New workspace' title='Start your production desk.' copy='Create the first job order to populate your dashboard and queues.' /><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></>;
  }
  const flowStages = ['Layout', 'Approval', 'Printing', 'Heatpress', 'Sewing', 'QC', 'For Release'];
  return (
    <>
      <ScreenTitle eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())} title="Keep today moving." copy="Your production floor, ordered by what needs a decision next." actions={<Link href={props.href('orders')}><Button>Open all queues <IconArrowRight size={16} /></Button></Link>} />
      <div className="mb-4 grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {[{ label: 'Overdue', value: props.stats.overdue, icon: IconAlertTriangle, tone: 'danger' }, { label: 'Due today', value: props.stats.dueToday, icon: IconClock, tone: 'warning' }, { label: 'Waiting approval', value: props.stats.waiting, icon: IconMessages, tone: 'info' }, { label: 'Ready to release', value: props.stats.ready, icon: IconChecklist, tone: 'success' }].map(({ label, value, icon: Icon, tone }) => (
          <Link href={props.href('orders', 'projects')} key={label} className="grid min-h-[78px] grid-cols-[38px_auto_1fr_auto] items-center gap-3 rounded-[15px] border bg-card p-3 shadow-[0_8px_26px_rgba(32,48,42,0.035)] transition-all hover:-translate-y-0.5 hover:border-primary/25">
            <span className={tone === 'danger' ? 'grid size-[38px] place-items-center rounded-[11px] bg-red-500/10 text-red-600' : tone === 'warning' ? 'grid size-[38px] place-items-center rounded-[11px] bg-amber-500/10 text-amber-700' : tone === 'info' ? 'grid size-[38px] place-items-center rounded-[11px] bg-blue-500/10 text-blue-700' : 'grid size-[38px] place-items-center rounded-[11px] bg-emerald-500/10 text-emerald-700'}><Icon size={18} stroke={1.6} aria-hidden /></span>
            <strong className="text-[26px] font-semibold tracking-[-0.04em]">{value}</strong>
            <span className="grid"><b className="text-xs font-bold">{label}</b><small className="text-xs text-muted-foreground">View work</small></span>
            <IconArrowRight size={16} aria-hidden className="text-muted-foreground" />
          </Link>
        ))}
      </div>
      <Card className="mb-4 overflow-hidden">
        <CardHeader className="flex-row items-end justify-between">
          <div><span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Live production</span><h2 className="text-[19px] font-semibold tracking-[-0.025em]">Work in motion</h2></div>
          <div className="flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-red-600" />QC issue</span><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-amber-500" />Waiting</span></div>
        </CardHeader>
          <div><span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Live production</span><h2 className="text-[19px] font-semibold tracking-[-0.025em]">Work in motion</h2></div>
        <div className="grid grid-cols-7 border-t max-[1100px]:min-w-[910px] max-[1100px]:overflow-x-auto">
          {flowStages.map((stage, index) => {
            const count = props.projectRows.filter((p) => p.stage === stage).length;
            const hot = props.projectRows.filter((p) => p.stage === stage && p.flag !== 'On track').length;
            return <Link href={props.href('orders', 'projects')} key={stage} className={`relative grid min-h-[130px] content-center gap-1.5 border-r p-3.5 last:border-r-0 hover:bg-muted/50 ${hot > 0 ? 'bg-[#fffcf5]' : ''}`}>
              <span className="absolute top-2.5 left-3 font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
              <strong className="font-semibold text-muted-foreground">{stage}</strong>
              <b className="text-[30px] font-semibold tracking-[-0.05em]">{count}</b>
              {hot > 0 && <small className="text-xs text-muted-foreground">{hot} need attention</small>}
              <span className={`absolute right-3 bottom-3 left-3 h-1 rounded-full ${index === 1 || index === 4 ? 'bg-amber-500' : index === 5 ? 'bg-red-500' : index === 6 ? 'bg-emerald-500' : 'bg-muted'} ${index === 0 ? 'scale-x-[0.42] origin-left' : index === 2 ? 'scale-x-[0.78] origin-left' : index === 3 ? 'scale-x-[0.5] origin-left' : index === 6 ? 'scale-x-[0.4] origin-left' : index === 5 ? 'scale-x-[0.68] origin-left' : index === 4 ? 'scale-x-[0.92] origin-left' : index === 1 ? 'scale-x-[0.62] origin-left' : ''}`} />
            </Link>;
          })}
        </div>
      </Card>
      <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(260px,0.55fr)] gap-4 max-[820px]:grid-cols-1">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-end justify-between border-b">
            <div><span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Recently added</span><h2 className="text-[19px] font-semibold tracking-[-0.025em]">Current work</h2></div>
            <Link href={props.href('orders')} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">See queue <IconArrowRight size={14} /></Link>
          </CardHeader>
          {props.projectRows.slice(0, 3).map((p) => (
            <Link href={props.projectHref(p.order, p.projectName)} key={p.order + "-" + p.project} className="grid min-h-[63px] grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2.5 border-b p-3.5 last:border-b-0 hover:bg-muted/50">
              <span className="grid size-8 place-items-center rounded-[10px] bg-muted text-muted-foreground"><IconClipboardList size={17} aria-hidden /></span>
              <span className="grid"><strong className="text-xs font-bold">{p.order} · {p.project}</strong><small className="text-xs text-muted-foreground">{p.stage} · {p.owner}</small></span>
              <Status tone={p.flag === "On track" ? "success" : 'warning'}>{p.flag}</Status>
            </Link>
          ))}
        </Card>
        <Card className="relative border-[#c4dd5a] bg-[#d9ef72] text-[#1e2b22]">
          <CardContent className="p-5">
          <span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#52642c]">Release desk</span>
          <h2 className="max-w-[210px] text-[26px] font-semibold tracking-[-0.025em]">{props.stats.ready === 0 ? "Nothing waiting for release." : props.stats.ready + " ready for release."}</h2>
          <p className="mt-2 max-w-[280px] text-xs text-[#4b5a38]">Projects appear here after production and QC are complete.</p>
          <Link href={props.href('orders', 'projects')}><Button variant="secondary" className="relative z-10 mt-3 bg-black/15 text-[#1e2b22] hover:bg-black/25">Open project queue <IconArrowRight size={16} /></Button></Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}