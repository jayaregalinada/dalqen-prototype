import { IconArrowLeft, IconDots } from '@tabler/icons-react';
import { formatDate } from "../shared/helpers";
import { EmptyWorkspace } from "../ui/empty-workspace";
import { ProjectWorkspace } from "../workspace/project-workspace";
import { Status } from "../ui/status";
import { Link } from "../ui/link";
import { Button } from '@/components/ui/button';
import type { PrototypeProps } from "../shared/types";

export function ProjectScreen({ props, flavor }: { props: PrototypeProps; flavor: string }) {
  const order = props.currentOrder;
  const project = props.currentProject;
  if (props.projectAccessDenied) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[20px] border border-dashed bg-card/95 p-12 text-center">
        <p className="text-sm text-muted-foreground">Project not found — it may have been removed, or you don't have access to it.</p>
        <Link href={props.href('orders')}><Button variant="secondary" className="mt-4"><IconArrowLeft size={15} /> Back to orders</Button></Link>
      </div>
    );
  }
  if (!order || !project) return <EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} />;
  return (
    <div>
      <div className="mb-[17px] grid grid-cols-[1fr_auto] items-start">
        <Link href={props.href("order")} className="col-span-2 mb-2 inline-flex min-h-9 w-fit items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"><IconArrowLeft size={16} /> {order.ref}</Link>
        <div>
          <span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{order.title}</span>
          <h1 className="font-heading text-[clamp(28px,3vw,39px)] font-semibold tracking-[-0.04em]">{project.name} <small className="ml-1 text-[0.42em] font-semibold text-muted-foreground">{project.quantity} {project.type}</small></h1>
          <p className="mt-2 flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground">
            <Status tone="info">{props.stage}</Status>
            <span>{project.route} route</span>
            <span>Due {formatDate(order.dueDate).toLowerCase()}</span>
          </p>
        </div>
        <Button type="button" variant="outline" size="icon" aria-label="More project actions"><IconDots size={18} /></Button>
      </div>
      <ProjectWorkspace props={props} />
    </div>
  );
}