import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { formatDate } from "../shared/helpers";
import { EmptyWorkspace } from "../ui/empty-workspace";
import { ProjectWorkspace } from "../workspace/project-workspace";
import { Status } from "../ui/status";
import { Link } from "../ui/link";
import type { PrototypeProps } from "../shared/types";
import styles from "../prototype.module.css";
export function ProjectScreen({ props, flavor }: { props: PrototypeProps; flavor: string }) {
  const order = props.currentOrder;
  const project = props.currentProject;
  if (!order || !project) return <div className={styles.standardScreen}><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></div>;
  return (
    <div className={styles.standardScreen}>
      <div className={styles.projectHeader}>
        <Link href={props.href("order")} className={styles.backLink}><ArrowLeft size={16} /> {order.ref}</Link>
        <div><span className={styles.eyebrow}>{order.title}</span><h1>{project.name} <small>{project.quantity} {project.type}</small></h1>
        <p><Status tone="info">{props.stage}</Status><span>{project.route} route</span><span>Due {formatDate(order.dueDate).toLowerCase()}</span></p></div>
        <button type="button" className={styles.iconButton} aria-label="More project actions"><MoreHorizontal size={18} /></button>
      </div>
      <ProjectWorkspace props={props} />
    </div>
  );
}