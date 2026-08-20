import { X } from "lucide-react";
import { cx } from "../shared/helpers";
import { users, roleDefs } from "../shared/constants";
import type { Role, User } from "../shared/types";
import styles from "../prototype.module.css";
export function UserSwitcherDialog({ user, close, select }: { user: User; close: () => void; select: (user: User) => void }) {
  const personaKeys: Role[] = ["owner", "artist", "sewer", "heatpress", "qc"];
  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={close}>
      <section className={cx(styles.dialog, styles.roleDialog)} role="dialog" aria-modal="true" aria-labelledby="user-switcher-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <div><span className={styles.eyebrow}>Switch user</span><h2 id="user-switcher-title">Who are you?</h2></div>
          <button type="button" onClick={close} aria-label="Close user picker"><X size={18} /></button>
        </div>
        <p className={styles.roleDialogNote}>Sign in as a team member to see only the job orders and projects assigned to you. The owner sees the full workspace.</p>
        <div className={styles.roleGrid}>
          {personaKeys.map((roleKey) => {
            const group = users.filter(u => u.role === roleKey);
            if (group.length === 0) return null;
            return (
              <div key={roleKey} className={styles.roleGroup}>
                <span className={styles.roleGroupLabel}>{roleDefs.find(r => r.key === roleKey)?.label}</span>
                {group.map((candidate) => (
                  <button key={candidate.id} type="button" className={cx(styles.roleCard, candidate.id === user.id && styles.roleCardActive)} onClick={() => { select(candidate); close(); }}>
                    <span>{candidate.initials}</span>
                    <div><b>{candidate.name}</b><small>{candidate.role === "owner" ? "Full workspace — all stages" : roleDefs.find(r => r.key === candidate.role)?.stages.join(" → ") + " stages"}</small></div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}