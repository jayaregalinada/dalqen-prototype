import { ArrowLeft } from "lucide-react";
import { Link } from "../ui/link";
import { formatDate } from "../shared/helpers";
import { EmptyWorkspace } from "../ui/empty-workspace";
import { ProjectWorkspace } from "../workspace/project-workspace";
import type { PrototypeProps } from "../shared/types";
import styles from "../prototype.module.css";
export function JacketProject({ props }: { props: PrototypeProps }) {
  const order = props.currentOrder;
  const project = props.currentProject;
  if (!order || !project) return <div className={styles.jacketProject}><EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} /></div>;
  return (
    <div className={styles.jacketProject}>
      <div className={styles.jacketProjectHead}><Link href={props.href("order")} className={styles.backLink}><ArrowLeft size={15} /> {order.ref}</Link><div><span className={styles.jacketKicker}>Project insert / 01</span><h1>{project.name} <em>{project.quantity} {project.type}</em></h1></div><div className={styles.jacketStamp}><span>Current station</span><strong>{props.stage.toUpperCase()}</strong><b>DUE {formatDate(order.dueDate).toUpperCase()}</b></div></div>
      <ProjectWorkspace props={props} jacket />
    </div>
  );
}