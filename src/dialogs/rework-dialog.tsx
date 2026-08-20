import { AlertCircle, X } from "lucide-react";
import styles from "../prototype.module.css";
export function ReworkDialog({ close, confirm }: { close: () => void; confirm: () => void }) {
  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={close}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="rework-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <div><span className={styles.eyebrow}>Record exception</span><h2 id="rework-title">Send project back for rework</h2></div>
          <button type="button" onClick={close} aria-label="Close rework dialog"><X size={18} /></button>
        </div>
        <label>Return to stage<select defaultValue="Printing"><option>Printing</option><option>Working Doc</option><option>Layout</option></select></label>
        <label>Reason<textarea defaultValue="Print alignment needs correction before final sewing." rows={3} /></label>
        <p><AlertCircle size={16} aria-hidden /> The assigned department and project followers will be notified.</p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostButton} onClick={close}>Keep current stage</button>
          <button type="button" className={styles.dangerButton} onClick={confirm}>Send to Printing</button>
        </div>
      </section>
    </div>
  );
}