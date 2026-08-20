import { Check, CheckCircle2, ClipboardCheck, Clock3, FileText, MessageSquareText, PackageCheck, Plus, RefreshCcw, Shirt, UserRound, ArrowRight } from 'lucide-react';
import { cx } from '../shared/helpers';
import { StageRail } from '../ui/stage-rail';
import { Status } from '../ui/status';
import type { PrototypeProps } from '../shared/types';
import styles from '../prototype.module.css';
export function ProjectWorkspace({ props, jacket = false }: { props: PrototypeProps; jacket?: boolean }) {
  const project = props.currentProject;
  const isOwner = props.user.role === 'owner';
  const isQc = props.user.role === 'qc';
  return (
    <div className={cx(styles.projectWorkspace, jacket && styles.projectWorkspaceJacket)}>
      <section className={styles.projectMain}>
        <StageRail stage={props.stage} />
        {props.notice && <div className={styles.notice} role="status"><CheckCircle2 size={17} aria-hidden /> {props.notice}</div>}
        <div className={styles.actionBar}>
          <div>
            {isOwner && <button type="button" className={styles.ghostButton} onClick={props.openRework}><RefreshCcw size={16} aria-hidden /> Send back</button>}
            {isOwner && <button type="button" className={styles.smallButton} onClick={props.openAssignment}><UserRound size={16} aria-hidden /> Assign team member</button>}
            <span>Assigned to: <strong>{project?.assignee ?? "Unassigned"} · {project?.department ?? "Layout"}</strong></span>
          </div>
          {isOwner
            ? <button type="button" className={styles.primaryButton} onClick={props.advanceStage}>Advance to next stage <ArrowRight size={16} aria-hidden /></button>
            : <span className={styles.stageReadout}>Current stage: <strong>{props.stage}</strong></span>}
        </div>
        <div className={styles.projectGrid}>
          <section className={styles.contentPanel}>
            <header><div><span className={styles.eyebrow}>Production files</span><h2>Artwork revisions</h2></div><button type="button" className={styles.smallButton}><Plus size={15} aria-hidden /> Upload revision</button></header>
            <div className={styles.emptyPanelState}><FileText size={22} strokeWidth={1.4} aria-hidden /><strong>No artwork uploaded</strong><span>Add the first production file when it is ready.</span></div>
          </section>
          <section className={styles.contentPanel}>
            <header><div><span className={styles.eyebrow}>Quantities</span><h2>Sizing & lineup</h2></div><button type="button" className={styles.smallButton}>Edit</button></header>
            <div className={styles.emptyPanelState}><Shirt size={22} strokeWidth={1.4} aria-hidden /><strong>No sizing details yet</strong><span>Record sizes and lineup entries for {project?.quantity ?? 0} items.</span></div>
          </section>
        </div>
      </section>
      <aside className={styles.projectAside}>
        <section>
          <span className={styles.eyebrow}>Release gates</span><h2>Finish with confidence</h2>
          <div className={styles.gatePending}><Clock3 size={15} aria-hidden /><span>Artwork approval<small>Waiting for the first production file</small></span></div>
          <div className={project?.paid ? styles.gateDone : styles.gatePending}>{project?.paid ? <Check size={15} aria-hidden /> : <Clock3 size={15} aria-hidden />}<span>Payment record<small>{project?.paid ? "Marked as paid" : 'Not recorded yet'}</small></span></div>
          <div className={props.qcStatus === "Passed" ? styles.gateDone : styles.gatePending}>
            {props.qcStatus === "Passed" ? <Check size={15} aria-hidden /> : <Clock3 size={15} aria-hidden />}<span>Quality control<small>{props.qcStatus === "Passed" ? "Passed just now" : 'Pending after Sewing'}</small></span>
          </div>
          {(isOwner || isQc) && props.qcStatus !== "Passed" && <button type="button" className={styles.secondaryButton} onClick={props.passQc}><ClipboardCheck size={16} aria-hidden /> Record QC pass</button>}
          {isOwner && <button type="button" className={styles.releaseButton} disabled={props.qcStatus !== "Passed"}><PackageCheck size={17} aria-hidden /> Release project</button>}
          {isOwner && props.qcStatus !== 'Passed' && <p className={styles.helper}>Release unlocks after QC passes.</p>}
        </section>
        <section>
          <div className={styles.asideTitle}><span><MessageSquareText size={16} aria-hidden /> Discussion</span><Status tone="neutral">0</Status></div>
          <p>{props.currentOrder?.notes || "No notes or discussion yet."}</p>
          <button type="button" className={styles.textButton}>Start discussion <ArrowRight size={14} /></button>
        </section>
      </aside>
    </div>
  );
}