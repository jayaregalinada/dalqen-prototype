import type { QueueMode } from "../shared/types";
import styles from "../prototype.module.css";
export function QueueToggle({ mode, setMode }: { mode: QueueMode; setMode: (mode: QueueMode) => void }) {
  return (
    <div className={styles.segmented} aria-label="Queue view">
      <button type="button" aria-pressed={mode === "orders"} onClick={() => setMode("orders")}>Orders</button>
      <button type="button" aria-pressed={mode === "projects"} onClick={() => setMode("projects")}>Projects</button>
    </div>
  );
}
