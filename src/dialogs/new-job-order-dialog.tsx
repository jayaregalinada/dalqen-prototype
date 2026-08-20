import { useReducer, type FormEvent } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';
import { cx } from '../shared/helpers';
import type { NewOrderInput } from '../shared/types';
import styles from '../prototype.module.css';

type ProjectDraft = { name: string; type: string; quantity: number; route: string; };

type FormState = {
  customer: string;
  title: string;
  dueDate: string;
  priority: 'Normal' | 'Urgent';
  notes: string;
  projectDrafts: ProjectDraft[];
};

type FormAction =
  | { type: 'SET_FIELD'; field: 'customer' | 'title' | 'dueDate' | 'notes'; value: string }
  | { type: 'SET_PRIORITY'; value: 'Normal' | 'Urgent' }
  | { type: 'UPDATE_PROJECT'; index: number; field: keyof ProjectDraft; value: string | number }
  | { type: 'ADD_PROJECT' }
  | { type: 'REMOVE_PROJECT'; index: number };

const defaultDraft: ProjectDraft = { name: '', type: 'Jersey Set', quantity: 1, route: 'Full Apparel' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_PRIORITY':
      return { ...state, priority: action.value };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projectDrafts: state.projectDrafts.map((p, i) =>
          i === action.index ? { ...p, [action.field]: action.value } : p
        ),
      };
    case 'ADD_PROJECT':
      return { ...state, projectDrafts: [...state.projectDrafts, { ...defaultDraft }] };
    case 'REMOVE_PROJECT':
      return { ...state, projectDrafts: state.projectDrafts.filter((_, i) => i !== action.index) };
    default:
      return state;
  }
}

export function NewJobOrderDialog({ close, create }: { close: () => void; create: (input: NewOrderInput) => void }) {
  const [form, dispatch] = useReducer(formReducer, {
    customer: '',
    title: '',
    dueDate: '',
    priority: 'Normal' as 'Normal' | 'Urgent',
    notes: '',
    projectDrafts: [{ ...defaultDraft }],
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    create({
      customer: form.customer,
      title: form.title,
      dueDate: form.dueDate,
      priority: form.priority,
      notes: form.notes,
      projects: form.projectDrafts,
    });
  };

  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={close}>
      <form className={cx(styles.dialog, styles.newOrderDialog)} role="dialog" aria-modal="true" aria-labelledby="new-order-title" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <div><span className={styles.eyebrow}>First production record</span><h2 id="new-order-title">Create a job order</h2><p>Start with the customer and add every project included in this order.</p></div>
          <button type="button" onClick={close} aria-label="Close new job order"><X size={18} /></button>
        </div>
        <div className={styles.formGrid}>
          <label>Customer<input required autoFocus value={form.customer} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'customer', value: e.target.value })} placeholder="Customer or organization" /></label>
          <label>Order title<input required value={form.title} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })} placeholder="What is this job for?" /></label>
          <label>Due date<input required type="date" value={form.dueDate} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'dueDate', value: e.target.value })} /></label>
          <label>Priority<select value={form.priority} onChange={(e) => dispatch({ type: 'SET_PRIORITY', value: e.target.value as 'Normal' | "Urgent" })}><option>Normal</option><option>Urgent</option></select></label>
          <label className={styles.formWide}>Notes<textarea rows={2} value={form.notes} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'notes', value: e.target.value })} placeholder="Production instructions, approvals, or delivery notes" /></label>
        </div>
        <section className={styles.projectDrafts}>
          <header><div><span className={styles.eyebrow}>Projects</span><h3>{form.projectDrafts.length} {form.projectDrafts.length === 1 ? "project" : 'projects'} in this order</h3></div>
          <button type="button" className={styles.smallButton} onClick={() => dispatch({ type: 'ADD_PROJECT' })}><Plus size={14} /> Add project</button></header>
          {form.projectDrafts.map((project, index) => (
            <div className={styles.projectDraft} key={index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <label>Description<input required value={project.name} onChange={(e) => dispatch({ type: 'UPDATE_PROJECT', index, field: 'name', value: e.target.value })} placeholder="e.g. Home jersey set" /></label>
              <label>Type<select value={project.type} onChange={(e) => dispatch({ type: 'UPDATE_PROJECT', index, field: 'type', value: e.target.value })}><option>Jersey Set</option><option>Jersey Upper</option><option>Polo</option><option>T-shirt</option><option>Tarpaulin</option><option>Custom item</option></select></label>
              <label>Quantity<input required min={1} type="number" value={project.quantity} onChange={(e) => dispatch({ type: 'UPDATE_PROJECT', index, field: 'quantity', value: Number(e.target.value) })} /></label>
              <label>Route<select value={project.route} onChange={(e) => dispatch({ type: 'UPDATE_PROJECT', index, field: 'route', value: e.target.value })}><option>Full Apparel</option><option>Print & Press</option><option>Print Only / DTF</option><option>Subcon</option><option>Tarpaulin</option></select></label>
              <button type="button" disabled={form.projectDrafts.length === 1} onClick={() => dispatch({ type: 'REMOVE_PROJECT', index })} aria-label={"Remove project " + (index + 1)}><X size={15} /></button>
            </div>
          ))}
        </section>
        <div className={styles.dialogActions}><button type="button" className={styles.ghostButton} onClick={close}>Cancel</button><button type="submit" className={styles.primaryButton}>Create job order <ArrowRight size={16} /></button></div>
      </form>
    </div>
  );
}
