import { IconArrowRight, IconClipboardCheck, IconPlus } from '@tabler/icons-react';
import { navigateTo } from "../shared/helpers";
import { roleDefs } from "../shared/constants";
import { ScreenTitle } from "../ui/screen-title";
import { EmptyWorkspace } from "../ui/empty-workspace";
import { Status } from "../ui/status";
import { Link } from "../ui/link";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User, PrototypeProps } from "../shared/types";

export function UserDashboard({ user, props }: { user: User; props: PrototypeProps }) {
  const def = roleDefs.find(r => r.key === user.role)!;
  const relevantProjects = props.projectRows.filter(p => def.stages.includes(p.stage));
  return (
    <div className="animate-[enter_580ms_cubic-bezier(0.22,0.75,0.15,1)_both]">
      <ScreenTitle eyebrow={def.label} title={user.name + "'s workspace"} copy={"Projects assigned to you in " + def.stages.join(" → ") + " stages."}
        actions={props.canCreateOrder ? <Button type="button" onClick={props.openNewOrder}><IconPlus size={16} /> New job order</Button> : undefined} />
      {props.orderRows.length === 0 ? (
        <EmptyWorkspace openNewOrder={props.openNewOrder} compact canCreateOrder={props.canCreateOrder} />
      ) : relevantProjects.length === 0 ? (
        <section className="grid min-h-[200px] place-items-center content-center gap-1.5 rounded-[15px] border border-dashed p-6 text-center text-muted-foreground">
          <IconClipboardCheck size={22} stroke={1.4} aria-hidden className="mb-1 text-primary" />
          <strong className="text-xs font-bold text-foreground">No projects assigned to you yet</strong>
          <span className="text-xs">When the owner assigns you a project in {def.stages.join(" or ")}, it will appear here.</span>
        </section>
      ) : (
        <div className="overflow-hidden rounded-[15px] border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase tracking-wider text-xs">Project / reference</TableHead><TableHead className="uppercase tracking-wider text-xs">Stage</TableHead><TableHead className="uppercase tracking-wider text-xs">Due</TableHead><TableHead className="text-right uppercase tracking-wider text-xs"><span className="sr-only">Open</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relevantProjects.map((project) => (
                <TableRow key={project.order + "-" + project.project} onClick={() => navigateTo(props.projectHref(project.order, project.projectName))} className="cursor-pointer">
                  <TableCell>
                    <strong className="block text-xs font-bold">{project.project}</strong>
                    <small className="block font-mono text-xs text-muted-foreground">{project.order} · {project.dept} · {project.owner}</small>
                  </TableCell>
                  <TableCell><Status tone={project.flag === "On track" ? "success" : "warning"}>{project.stage}</Status></TableCell>
                  <TableCell className="font-mono text-muted-foreground">{project.due}</TableCell>
                  <TableCell className="text-right">
                    <Link href={props.projectHref(project.order, project.projectName)} aria-label={'Open ' + project.project} className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><IconArrowRight size={16} /></Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}