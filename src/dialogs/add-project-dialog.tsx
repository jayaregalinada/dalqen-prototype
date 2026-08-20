import { useState, type FormEvent } from 'react';
import { X, ArrowRight, Plus } from 'lucide-react';
import { cx } from '../shared/helpers';
import styles from '../prototype.module.css';

type ProjectDraft = { name: string; type: string; quantity: number; route: string };

export function AddProjectDialog({
  close,
  addProject,
}: {
  close: () => void;
  addProject: (draft: ProjectDraft) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Jersey Set');
  const [quantity, setQuantity] = useState(1);
  const [route, setRoute] = useState('Full Apparel');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addProject({ name, type, quantity, route });
  };

  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={close}>
      <form className={cx(styles.dialog, styles.newOrderDialog)} role="dialog" aria-modal="true" aria-labelledby="add-project-title" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <div><span className={styles.eyebrow}>Extend job order</span><h2 id="add-project-title">Add a project</h2><p>Add another production line item to this job order.</p></div>
          <button type="button" onClick={close} aria-label="Close add project"><X size={18} /></button>
        </div>
        <div className={styles.formGrid}>
          <label>Description<input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home jersey set" /></label>
          <label>Type<select value={type} onChange={(e) => setType(e.target.value)}><option>Jersey Set</option><option>Jersey Upper</option><option>Polo</option><option>T-shirt</option><option>Tarpaulin</option><option>Custom item</option></select></label>
          <label>Quantity<input required min={1} type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></label>
          <label>Route<select value={route} onChange={(e) => setRoute(e.target.value)}><option>Full Apparel</option><option>Print & Press</option><option>Print Only / DTF</option><option>Subcon</option><option>Tarpaulin</option></select></label>
        </div>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostButton} onClick={close}>Cancel</button>
          <button type="submit" className={styles.primaryButton}><Plus size={16} /> Add project <ArrowRight size={16} /></button>
        </div>
      </form>
    </div>
  );
}