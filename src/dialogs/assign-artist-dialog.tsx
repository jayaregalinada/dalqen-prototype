import { useState, type FormEvent } from "react";
import { ArrowRight, UserRound, X } from "lucide-react";
import { users, roleDefs } from "../shared/constants";
import type { Role, DemoProject } from "../shared/types";
import styles from "../prototype.module.css";
export function AssignArtistDialog({ project, close, assign }: { project: DemoProject; close: () => void; assign: (assignee: string, department: string) => void }) {
  const assignable = users.filter(u => u.role !== "owner");
  const [userId, setUserId] = useState(() => users.find(u => u.name === project.assignee && u.role !== "owner")?.id ?? assignable[0].id);
  const selected = users.find(u => u.id === userId)!;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); assign(selected.name, selected.dept ?? "Layout"); };
  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={close}>
      <form className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="assign-artist-title" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <div><span className={styles.eyebrow}>Project ownership</span><h2 id="assign-artist-title">Assign a team member</h2></div>
          <button type="button" onClick={close} aria-label="Close assignment"><X size={18} /></button>
        </div>
        <label>Team member
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {(["artist", "sewer", "heatpress", "qc"] as Role[]).map((roleKey) => {
              const group = assignable.filter(u => u.role === roleKey);
              if (group.length === 0) return null;
              return (<optgroup key={roleKey} label={roleDefs.find(r => r.key === roleKey)?.label}>{group.map(u => <option key={u.id} value={u.id}>{u.name} — {u.dept}</option>)}</optgroup>);
            })}
          </select>
        </label>
        <p><UserRound size={16} aria-hidden /> Only this team member and the workspace owner will see this project in their queues.</p>
        <div className={styles.dialogActions}><button type="button" className={styles.ghostButton} onClick={close}>Cancel</button><button type="submit" className={styles.primaryButton}>Assign team member <ArrowRight size={16} /></button></div>
      </form>
    </div>
  );
}