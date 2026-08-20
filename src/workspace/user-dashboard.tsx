import { ArrowRight, ClipboardCheck, Plus } from "lucide-react";
import { cx } from "../shared/helpers";
import { roleDefs } from "../shared/constants";
import { ScreenTitle } from "../ui/screen-title";
import { EmptyWorkspace } from "../ui/empty-workspace";
import { Status } from "../ui/status";
import { Link } from "../ui/link";
import type { User, PrototypeProps } from "../shared/types";
import styles from "../prototype.module.css";
export function UserDashboard({ user, props }: { user: User; props: PrototypeProps }) {
  const def = roleDefs.find(r => r.key === user.role)!;
  const relevantProjects = props.projectRows.filter(p => def.stages.includes(p.stage));
  return (
    <div className={styles.roleWorkspace}>
      <ScreenTitle eyebrow={def.label} title={user.name + "'s workspace"} copy={"Projects assigned to you in " + def.stages.join(" → ") + " stages."}
        actions={props.canCreateOrder ? <button type="button" className={styles.primaryButton} onClick={props.openNewOrder}><Plus size={16} /> New job order</button> : undefined} />
      {props.orderRows.length === 0 ? (
        <EmptyWorkspace openNewOrder={props.openNewOrder} compact canCreateOrder={props.canCreateOrder} />
      ) : relevantProjects.length === 0 ? (
        <section className={styles.roleEmpty}><ClipboardCheck size={22} strokeWidth={1.4} aria-hidden /><strong>No projects assigned to you yet</strong><span>When the owner assigns you a project in {def.stages.join(" or ")}, it will appear here.</span></section>
      ) : (
        <div className={styles.roleQueue}>
          <div className={styles.roleQueueHeader}><span>Project / reference</span><span>Stage</span><span>Due</span></div>
          {relevantProjects.map((project) => (
            <Link href={props.href("project")} key={project.order + "-" + project.project} className={styles.roleTaskCard}>
              <div className={styles.roleTaskInfo}><strong>{project.project}</strong><small>{project.order} · {project.dept} · {project.owner}</small></div>
              <Status tone={project.flag === "On track" ? "success" : "warning"}>{project.stage}</Status>
              <span className={styles.mono}>{project.due}</span>
              <ArrowRight size={16} className={styles.roleTaskArrow} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}