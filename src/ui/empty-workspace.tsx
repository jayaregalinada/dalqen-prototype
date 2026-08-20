import { ClipboardList, Plus } from 'lucide-react';
import { cx } from '../shared/helpers';
import styles from '../prototype.module.css';
export function EmptyWorkspace({ openNewOrder, compact = false, canCreateOrder = true }: { openNewOrder: () => void; compact?: boolean; canCreateOrder?: boolean }) {
  return (
    <section className={cx(styles.emptyWorkspace, compact && styles.emptyWorkspaceCompact)}>
      <span className={styles.emptyIcon}><ClipboardList size={25} strokeWidth={1.4} aria-hidden /></span>
      <span className={styles.eyebrow}>{canCreateOrder ? "Your workspace is ready" : 'Nothing assigned to you'}</span>
      <h2>{canCreateOrder ? "No job orders yet." : 'No job orders for you yet.'}</h2>
      <p>{canCreateOrder ? "Create your first customer order. Its projects will automatically appear across the dashboard, queues, and production stages." : 'Job orders will appear here once the workspace owner creates them and assigns a project to you.'}</p>
      {canCreateOrder ? <button type='button' className={styles.primaryButton} onClick={openNewOrder}><Plus size={16} /> Create first job order</button> : null}
    </section>
  );
}
