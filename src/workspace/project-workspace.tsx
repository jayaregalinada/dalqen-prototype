import { IconCheck, IconCircleCheck, IconClipboardCheck, IconClock, IconFileText, IconMessages, IconChecklist, IconPlus, IconRefresh, IconShirt, IconUserCircle, IconArrowRight } from '@tabler/icons-react';
import { StageRail } from '../ui/stage-rail';
import { Status } from '../ui/status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { PrototypeProps } from '../shared/types';

export function ProjectWorkspace({ props, jacket = false }: { props: PrototypeProps; jacket?: boolean }) {
  const project = props.currentProject;
  const isOwner = props.user.role === 'owner';
  const isQc = props.user.role === 'qc';
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_270px] gap-4 max-[820px]:grid-cols-1">
      <section className="min-w-0">
        <StageRail stage={props.stage} />
        {props.notice && <div className="mb-3 flex items-center gap-2 rounded-[11px] bg-emerald-100 px-3.5 py-2.5 text-xs font-bold text-emerald-800" role="status"><IconCircleCheck size={17} aria-hidden /> {props.notice}</div>}
        <div className="mb-3 flex items-center justify-between gap-4 rounded-[15px] border bg-card p-2.5 max-[820px]:flex-col max-[820px]:items-stretch">
          <div className="flex items-center gap-3">
            {isOwner && <Button type="button" variant="outline" onClick={props.openRework}><IconRefresh size={16} aria-hidden /> Send back</Button>}
            {isOwner && <Button type="button" variant="outline" onClick={props.openAssignment}><IconUserCircle size={16} aria-hidden /> Assign team member</Button>}
            <span className="text-xs text-muted-foreground">Assigned to: <strong className="font-bold text-foreground">{project?.assignee ?? "Unassigned"} · {project?.department ?? "Layout"}</strong></span>
          </div>
          {isOwner
            ? <Button type="button" onClick={props.advanceStage}>Advance to next stage <IconArrowRight size={16} aria-hidden /></Button>
            : <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">Current stage: <strong className="text-primary">{props.stage}</strong></span>}
        </div>
        <div className="grid grid-cols-[1.05fr_0.95fr] gap-3 max-[820px]:grid-cols-1">
          <Card className="min-w-0">
            <CardHeader className="flex-row items-center justify-between gap-2.5">
              <div><span className="mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Production files</span><h2 className="font-heading text-[17px] tracking-[-0.02em]">Artwork revisions</h2></div>
              <Button type="button" variant="outline"><IconPlus size={15} aria-hidden /> Upload revision</Button>
            </CardHeader>
            <CardContent className="grid min-h-[160px] place-items-center content-center gap-1.5 p-6 text-center text-muted-foreground">
              <IconFileText size={22} stroke={1.4} aria-hidden className="mb-1 text-primary" />
              <strong className="text-xs font-bold text-foreground">No artwork uploaded</strong>
              <span className="text-xs">Add the first production file when it is ready.</span>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="flex-row items-center justify-between gap-2.5">
              <div><span className="mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Quantities</span><h2 className="font-heading text-[17px] tracking-[-0.02em]">Sizing &amp; lineup</h2></div>
              <Button type="button" variant="outline">Edit</Button>
            </CardHeader>
            <CardContent className="grid min-h-[160px] place-items-center content-center gap-1.5 p-6 text-center text-muted-foreground">
              <IconShirt size={22} stroke={1.4} aria-hidden className="mb-1 text-primary" />
              <strong className="text-xs font-bold text-foreground">No sizing details yet</strong>
              <span className="text-xs">Record sizes and lineup entries for {project?.quantity ?? 0} items.</span>
            </CardContent>
          </Card>
        </div>
      </section>
      <aside className="grid content-start gap-3 max-[820px]:grid-cols-2">
        <Card className="grid content-start gap-1.5">
          <CardContent className="grid gap-1.5">
          <span className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Release gates</span>
          <h2 className="mb-4 font-heading text-[17px] tracking-[-0.02em]">Finish with confidence</h2>
          <div className="flex gap-2.5 border-b py-2.5 text-amber-600">
            <IconClock size={15} aria-hidden className="mt-0.5 shrink-0" />
            <span className="grid text-xs font-bold text-foreground">Artwork approval<small className="font-medium text-muted-foreground">Waiting for the first production file</small></span>
          </div>
          <div className={project?.paid ? 'flex gap-2.5 border-b py-2.5 text-emerald-600' : 'flex gap-2.5 border-b py-2.5 text-amber-600'}>
            {project?.paid ? <IconCheck size={15} aria-hidden className="mt-0.5 shrink-0" /> : <IconClock size={15} aria-hidden className="mt-0.5 shrink-0" />}
            <span className="grid text-xs font-bold text-foreground">Payment record<small className="font-medium text-muted-foreground">{project?.paid ? "Marked as paid" : 'Not recorded yet'}</small></span>
          </div>
          <div className={props.qcStatus === "Passed" ? 'flex gap-2.5 border-b py-2.5 text-emerald-600' : 'flex gap-2.5 border-b py-2.5 text-amber-600'}>
            {props.qcStatus === "Passed" ? <IconCheck size={15} aria-hidden className="mt-0.5 shrink-0" /> : <IconClock size={15} aria-hidden className="mt-0.5 shrink-0" />}
            <span className="grid text-xs font-bold text-foreground">Quality control<small className="font-medium text-muted-foreground">{props.qcStatus === "Passed" ? "Passed just now" : 'Pending after Sewing'}</small></span>
          </div>
          {(isOwner || isQc) && props.qcStatus !== "Passed" && <Button type="button" variant="secondary" className="mt-3 w-full" onClick={props.passQc}><IconClipboardCheck size={16} aria-hidden /> Record QC pass</Button>}
          {isOwner && <Button type="button" className="mt-2.5 w-full" disabled={props.qcStatus !== "Passed"}><IconChecklist size={17} aria-hidden /> Release project</Button>}
          {isOwner && props.qcStatus !== 'Passed' && <p className="mt-2 text-center text-xs text-muted-foreground">Release unlocks after QC passes.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-2"><IconMessages size={16} aria-hidden /> Discussion</span><Status tone="neutral">0</Status>
          </div>
          <div className="mt-3 text-xs leading-[1.6] text-muted-foreground [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-1.5" dangerouslySetInnerHTML={{ __html: props.currentOrder?.overview || '<p>No overview or discussion yet.</p>' }} />
          <button type="button" className="inline-flex items-center gap-1.5 bg-transparent p-0 text-xs font-bold text-primary">Start discussion <IconArrowRight size={14} /></button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}