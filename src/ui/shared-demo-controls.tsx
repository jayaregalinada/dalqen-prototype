import { RefreshCcw } from "lucide-react";
import type { SyncStatus } from "../shared/types";
import styles from "../prototype.module.css";
export function SharedDemoControls({ status, canReset = true, onReset }: { status: SyncStatus; canReset?: boolean; onReset: () => void }) {
  const labels: Record<SyncStatus, string> = { connecting: "Connecting…", live: "Shared demo · Live", saving: "Saving…", error: "Sync unavailable", unconfigured: "Local preview" };
  return (
    <div className={styles.syncControl} role="status" title={status === "unconfigured" ? "Add Supabase environment variables to enable shared persistence." : undefined}>
      <span className={styles["sync_" + status]}><i />{labels[status]}</span>
      {canReset && <button type="button" onClick={onReset} aria-label="Reset shared demo data"><RefreshCcw size={14} strokeWidth={1.7} aria-hidden /> Reset</button>}
    </div>
  );
}
