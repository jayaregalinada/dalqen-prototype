import { useState, type FormEvent } from 'react';
import { AlertCircle, X } from 'lucide-react';
import styles from '../prototype.module.css';

export function ReworkDialog({
  currentStage,
  close,
  confirm,
}: {
  currentStage: string;
  close: () => void;
  confirm: (targetStage: string, reason: string) => void;
}) {
  const stages = ['Layout', 'Approval', 'Working Doc', 'Sizing', 'Printing', 'Heatpress', 'Sewing', 'QC', 'For Release', 'Completed'];
  const currentIdx = stages.indexOf(currentStage);
  const previousStages = stages.slice(0, currentIdx);

  const [targetStage, setTargetStage] = useState(previousStages[previousStages.length - 1] ?? 'Layout');
  const [reason, setReason] = useState('Print alignment needs correction before final sewing.');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    confirm(targetStage, reason);
  };

  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={close}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="rework-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <div><span className={styles.eyebrow}>Record exception</span><h2 id="rework-title">Send project back for rework</h2></div>
          <button type="button" onClick={close} aria-label="Close rework dialog"><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <label>
            Return to stage
            <select value={targetStage} onChange={(e) => setTargetStage(e.target.value)}>
              {previousStages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </label>
          <label>
            Reason
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </label>
          <p><AlertCircle size={16} aria-hidden /> The assigned department and project followers will be notified.</p>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.ghostButton} onClick={close}>Keep current stage</button>
            <button type="submit" className={styles.dangerButton}>Send to {targetStage}</button>
          </div>
        </form>
      </section>
    </div>
  );
}