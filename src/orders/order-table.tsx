import { ArrowRight } from "lucide-react";
import { Link } from "../ui/link";
import { Status } from "../ui/status";
import type { PrototypeProps } from "../shared/types";
import styles from "../prototype.module.css";
export function OrderTable({ props }: { props: PrototypeProps }) {
  if (props.queueMode === "projects") {
    return (
      <div className={styles.tableShell}>
        <table>
          <thead><tr><th>Project</th><th>Order</th><th>Stage</th><th>Owner / dept.</th><th>Due</th><th>Attention</th><th><span className={styles.srOnly}>Open</span></th></tr></thead>
          <tbody>{props.projectRows.map((row) => (
            <tr key={row.order + "-" + row.project}>
              <td><strong>{row.project}</strong></td><td className={styles.mono}>{row.order}</td>
              <td><Status tone={row.stage === "QC" ? "danger" : row.stage === "Approval" ? "warning" : "info"}>{row.stage}</Status></td>
              <td>{row.owner}<small>{row.dept}</small></td><td>{row.due}</td>
              <td><Status tone={row.flag === "On track" ? "success" : row.flag === "Unassigned" ? "warning" : "danger"}>{row.flag}</Status></td>
              <td><Link href={props.href("project")} aria-label={"Open " + row.project}><ArrowRight size={16} /></Link></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }
  return (
    <div className={styles.tableShell}>
      <table>
        <thead><tr><th>Reference / job</th><th>Customer</th><th>Due</th><th>Progress</th><th>Status</th><th><span className={styles.srOnly}>Open</span></th></tr></thead>
        <tbody>{props.orderRows.map((row) => (
          <tr key={row.ref}>
            <td><small className={styles.mono}>{row.ref}</small><strong>{row.title}</strong>{row.priority === "Urgent" && <Status tone="danger">Urgent</Status>}</td>
            <td>{row.customer}</td><td>{row.due}</td><td><b>{row.progress}</b><small>released</small></td>
            <td><Status tone={row.status === "QC issue" ? "danger" : row.status === "Waiting approval" ? "warning" : row.status === "Ready for release" || row.status === "Released" ? "success" : "info"}>{row.status}</Status></td>
            <td><Link href={props.href("order")} aria-label={"Open " + row.ref}><ArrowRight size={16} /></Link></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
