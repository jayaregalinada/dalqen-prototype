import { IconActivity, IconArrowDown, IconArrowLeft, IconArrowRight, IconStack2, IconFileText, IconGripVertical, IconMessages, IconDots, IconPencil, IconPlus, IconRefresh, IconClipboardCheck, IconTrash, IconX, IconPhoto, IconAlertTriangle, IconRuler2 } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { cx, formatDate, orderStatus } from '../shared/helpers';
import { cn } from '@/lib/utils';
import type { DemoOrder, DemoProject, PrototypeProps } from '../shared/types';
import { OrderHeader } from '../orders/order-header';
import { users, stages } from '../shared/constants';
import { orderDesignState } from '../hooks/use-shared-demo-state';
import { resolveStorageImages } from '../shared/image-storage';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { OverviewEditor } from '../ui/overview-editor';
import { StageRail } from '../ui/stage-rail';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConfirmActionDialog } from '../ui/confirm-action-dialog';
import { TextPromptDialog } from '../ui/text-prompt-dialog';
import { DesignsTab } from './designs-tab';
import { SizingsTab } from './sizings-tab';
import { Badge } from '@/components/ui/badge';

const tabs = ['overview', 'projects', 'discussion', 'designs', 'sizings', 'activity'] as const;
type Tab = (typeof tabs)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  projects: 'Line Up',
  discussion: 'Discussion',
  designs: 'Designs',
  sizings: 'Sizing',
  activity: 'Activity',
};

type LineUpRowDraft = { name?: string; custom?: Record<string, string> };
type PendingConfirmation =
  | { kind: 'discardOverview' }
  | { kind: 'deleteComment'; commentId: string; author: string }
  | { kind: 'removeLineUpItem'; itemId: string; itemName: string }
  | null;
type PendingTextPrompt =
  | { kind: 'lineUpColumn' }
  | { kind: 'lineUpTemplate'; defaultValue: string }
  | null;

export function OrderScreen({ props, flavor }: { props: PrototypeProps; flavor: string }) {
  const order = props.currentOrder;
  const [activeTab, setActiveTab] = useState<Tab>('overview'); // hooks before any early return
  const [overviewDraft, setOverviewDraft] = useState<string | null>(null); // null = read mode
  const [briefDraft, setBriefDraft] = useState<Partial<DemoOrder> | null>(null);
  // Line Up: cell edits accumulate in a local draft; auto-saved (debounced) + manual Save.
  const [lineUpDraft, setLineUpDraft] = useState<Record<string, LineUpRowDraft> | null>(null);
  const draftRef = useRef<Record<string, LineUpRowDraft> | null>(null);
  const saveTimer = useRef<number | null>(null);
  // Drag-and-drop reorder (native HTML5 DnD); drag starts only from the grip handle so
  // editing cells still works. dropIndex = row being hovered as the target position.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const clearDrag = () => { setDragIndex(null); setDropIndex(null); };
  // Discussion: composer draft, a key bump remounts the editor empty after posting,
  // and per-comment resolved image HTML for the read view.
  const [commentDraft, setCommentDraft] = useState<string | null>(null);
  const [composerKey, setComposerKey] = useState(0);
  const [readComments, setReadComments] = useState<Record<string, string>>({});
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>(null);
  const [pendingTextPrompt, setPendingTextPrompt] = useState<PendingTextPrompt>(null);
  // ref mirrors commentDraft so postComment reads the latest draft even if a re-render
  // (or HMR/resume) left the click handler with a stale closure.
  const commentRef = useRef<string | null>(null);
  useEffect(() => {
    const comments = order?.discussion ?? [];
    let live = true;
    void Promise.all(comments.map((c) => resolveStorageImages(c.html))).then((resolved) => {
      if (!live) return;
      const map: Record<string, string> = {};
      comments.forEach((c, i) => { if (resolved[i]) map[c.id] = resolved[i]; });
      setReadComments(map);
    });
    return () => { live = false; };
  }, [order?.discussion]);
  // read view: storage paths -> signed URLs for display (resolves on load/update; never persisted)
  const [readOverview, setReadOverview] = useState(order?.overview ?? '');
  useEffect(() => {
    const html = order?.overview ?? '';
    let live = true;
    void resolveStorageImages(html).then((resolved) => { if (live) setReadOverview(resolved); });
    return () => { live = false; };
  }, [order?.overview]);
  useEffect(() => { draftRef.current = lineUpDraft; }, [lineUpDraft]);
  useEffect(() => () => { if (saveTimer.current !== null) window.clearTimeout(saveTimer.current); }, []);
  // Overview edit handlers: Save writes + closes to read mode; Cancel discards (confirms only when dirty).
  const overviewDirty = overviewDraft !== null && order !== undefined && overviewDraft !== order.overview;
  const saveOverview = () => {
    if (overviewDraft !== null && order) props.updateOrder(order.id, { overview: overviewDraft });
    setOverviewDraft(null);
  };
  const cancelOverview = () => {
    if (overviewDraft === null) return;
    if (overviewDirty) {
      setPendingConfirmation({ kind: 'discardOverview' });
      return;
    }
    setOverviewDraft(null);
  };
  // Cmd/Ctrl+S saves, Esc cancels — active only while the overview editor is open.
  useEffect(() => {
    if (overviewDraft === null) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveOverview();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelOverview();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overviewDraft, overviewDirty]); // eslint-disable-line react-hooks/exhaustive-deps
  const isAdmin = props.canCreateOrder;
  if (props.orderAccessDenied) {
    return (
      <Card className="min-h-[420px] grid place-items-center text-center">
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">Order not found — it may have been removed, or you don't have access to it.</p>
          <Link href={props.href('orders')}><Button variant="secondary"><IconArrowLeft size={15} /> Back to orders</Button></Link>
        </CardContent>
      </Card>
    );
  }
  if (!order) return <EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} />;
  // order-level progress: who can act on the strip below the header
  const canAdvance = isAdmin || order.assignedArtistId === props.user.id;
  const canQc = isAdmin || props.user.role === 'qc';
  const atLastStage = props.stage === 'Completed' || props.stage === stages[stages.length - 1];
  const releaseGate = props.stage === 'For Release' && props.qcStatus !== 'Passed';
  const designs = (order as unknown as { designs?: { length: number } })?.designs as unknown as DemoOrder['designs'] ?? [];
  const designState = orderDesignState(order);
  const needsDesignForApproval = props.stage === 'Layout' && designs.length === 0;
  const advanceBlockedByDesign = needsDesignForApproval;
  const advanceBlockedByApproval = props.stage === 'Approval' && designState !== 'approved';
  const advanceBlockedByLineUp = props.stage === 'Document' && props.lineUpItems.length === 0;
  const warnLineUp = props.stage === 'Document' && order.projects.length === 0;
  const sizingCount = order.sizings?.length ?? 0;
  const advanceBlockedBySizing = props.stage === 'Sizing' && sizingCount < props.lineUpItems.length;
  const warnSizing = props.stage === 'Sizing' && sizingCount < order.projects.length;
  const printerMissing = props.stage === 'Printing' && (order.assignedPrinterIds?.length ?? 0) === 0;
  const advanceBlockedByPrinter = printerMissing;
  const isRevised = props.stage === 'Approval' && designState === 'rejected';

  const formatCommentTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const mins = Math.round((Date.now() - d.getTime()) / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  };
  const postComment = () => {
    const html = commentRef.current?.trim();
    if (!html) return;
    if (!html.replace(/<[^>]*>/g, '').trim() || !order) return; // empty (<p></p>) guard
    props.updateOrder(order.id, {
      discussion: [...order.discussion, { id: crypto.randomUUID(), author: props.user.name || 'Anonymous', html, createdAt: new Date().toISOString() }],
    });
    setCommentDraft(null);
    commentRef.current = null;
    setComposerKey((k) => k + 1);
  };
  const commentText = (commentDraft ?? '').replace(/<[^>]*>/g, '').trim();
  const clearComposer = () => { setCommentDraft(null); commentRef.current = null; };
  const setComposerDraft = (html: string) => { commentRef.current = html; setCommentDraft(html); };
  const deleteComment = (id: string) => {
    const target = order?.discussion.find((c) => c.id === id);
    if (!target) return;
    setPendingConfirmation({ kind: 'deleteComment', commentId: id, author: target.author || 'unknown' });
  };

  // Line Up: the table shows only the template columns + per-order extras. The first column
  // is the item's identity — editing it updates the item name (workspace link, kanban follow it).
  // New orders must pick a template first; once items exist the template is locked.
  // Cell edits auto-save (debounced) but there is also a manual Save; it disables while writing.
  const templatePicked = !!order.lineUpTemplateName && !!props.lineUpTemplates[order.lineUpTemplateName];
  const templateName = (order.lineUpTemplateName && props.lineUpTemplates[order.lineUpTemplateName])
    ? order.lineUpTemplateName
    : props.lineUpTemplates[order.category] ? order.category : props.lineUpTemplates['Jersey'] ? 'Jersey' : Object.keys(props.lineUpTemplates)[0] ?? '';
  const needsTemplatePick = order.projects.length === 0 && !templatePicked;
  const templateCols = props.lineUpTemplates[templateName] ?? [];
  const removedCols = order.removedLineUpColumns ?? [];
  const lineUpCols = [...new Set([...templateCols.filter((c) => !removedCols.includes(c)), ...(order.lineUpColumns ?? [])])];
  // effective columns differ from the stock template → show "(modified)" and invite Save as template
  const deviated = lineUpCols.length !== templateCols.length || lineUpCols.some((c) => !templateCols.includes(c));
  const busySaving = props.syncStatus === 'saving';
  const cellValue = (item: { id: string; custom: Record<string, string> }, col: string) =>
    lineUpDraft?.[item.id]?.custom?.[col] ?? item.custom?.[col] ?? '';
  const nameValue = (item: { id: string; name: string }) => lineUpDraft?.[item.id]?.name ?? item.name;
  const setRow = (itemId: string, patch: LineUpRowDraft) =>
    setLineUpDraft((prev) => ({ ...(prev ?? {}), [itemId]: { ...(prev?.[itemId] ?? {}), ...patch } }));
  const setCell = (itemId: string, col: string, value: string) =>
    setLineUpDraft((prev) => ({
      ...(prev ?? {}),
      [itemId]: { ...(prev?.[itemId] ?? {}), custom: { ...(prev?.[itemId]?.custom ?? {}), [col]: value } },
    }));
  const saveLineUp = () => {
    const draft = draftRef.current ?? lineUpDraft;
    if (!draft) return;
    props.updateOrder(order.id, {
      projects: order.projects.map((p) => {
        const d = draft[p.id];
        if (!d) return p;
        return {
          ...p,
          name: d.name?.trim() ? d.name.trim().slice(0, 160) : p.name,
          custom: { ...p.custom, ...(d.custom ?? {}) },
        };
      }),
    });
    if (saveTimer.current !== null) { window.clearTimeout(saveTimer.current); saveTimer.current = null; }
    draftRef.current = null;
    setLineUpDraft(null);
  };
  const scheduleSave = () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { saveTimer.current = null; saveLineUp(); }, 1000);
  };
  const discardLineUp = () => {
    if (saveTimer.current !== null) { window.clearTimeout(saveTimer.current); saveTimer.current = null; }
    draftRef.current = null;
    setLineUpDraft(null);
  };
  const editCell = (itemId: string, col: string, value: string) => { setCell(itemId, col, value); scheduleSave(); };
  const editName = (itemId: string, value: string) => { setRow(itemId, { name: value }); scheduleSave(); };
  const removeLineUpItem = (item: DemoProject) =>
    setPendingConfirmation({ kind: 'removeLineUpItem', itemId: item.id, itemName: item.name });
  const moveLineUpItem = (item: DemoProject, toIndex: number) => props.moveItemTo(order.id, item.id, toIndex);
  const addLineUpColumn = () => setPendingTextPrompt({ kind: 'lineUpColumn' });
  const removeLineUpColumn = (col: string) => {
    if (templateCols.includes(col)) {
      // removing a stock template column deviates this order from the template
      props.updateOrder(order.id, {
        removedLineUpColumns: [...new Set([...removedCols, col])],
        lineUpColumns: (order.lineUpColumns ?? []).filter((c) => c !== col),
      });
    } else {
      props.updateOrder(order.id, { lineUpColumns: (order.lineUpColumns ?? []).filter((c) => c !== col) });
    }
  };
  const switchTemplate = (name: string) => {
    if (!name || name === templateName || name === '__save_template__') return;
    // once items exist the template is locked — only deviations (and Save template) are allowed
    if (order.projects.length > 0) return;
    // adopting a template means exactly its columns — drop any deviation overrides
    props.updateOrder(order.id, { lineUpTemplateName: name, lineUpColumns: [], removedLineUpColumns: [] });
  };
  const saveAsTemplate = () => setPendingTextPrompt({ kind: 'lineUpTemplate', defaultValue: deviated ? `${templateName} modified` : templateName });

  const confirmPendingAction = () => {
    if (pendingConfirmation?.kind === 'discardOverview') {
      setOverviewDraft(null);
    } else if (pendingConfirmation?.kind === 'deleteComment') {
      props.updateOrder(order.id, { discussion: order.discussion.filter((comment) => comment.id !== pendingConfirmation.commentId) });
    } else if (pendingConfirmation?.kind === 'removeLineUpItem') {
      setLineUpDraft((prev) => {
        if (!prev) return prev;
        const { [pendingConfirmation.itemId]: _removed, ...rest } = prev;
        return Object.keys(rest).length ? rest : null;
      });
      props.removeItem(order.id, pendingConfirmation.itemId);
    }
    setPendingConfirmation(null);
  };

  const submitTextPrompt = (name: string) => {
    if (pendingTextPrompt?.kind === 'lineUpColumn') {
      const col = name.slice(0, 40);
      if (removedCols.includes(col)) {
        // re-adding a stock template column restores it for this order
        props.updateOrder(order.id, { removedLineUpColumns: removedCols.filter((c) => c !== col) });
      } else if (templateCols.includes(col) || (order.lineUpColumns ?? []).includes(col)) {
        return; // already visible
      } else {
        props.updateOrder(order.id, { lineUpColumns: [...(order.lineUpColumns ?? []), col] });
      }
    } else if (pendingTextPrompt?.kind === 'lineUpTemplate') {
      props.saveLineUpTemplate(name.slice(0, 40), lineUpCols, order.id);
    }
    setPendingTextPrompt(null);
  };

  const saveBrief = () => {
    if (briefDraft) props.updateOrder(order.id, briefDraft);
    setBriefDraft(null);
  };

  const rowActionBtn = 'border bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-default';

  return (
    <div className="animate-[enter_580ms_cubic-bezier(0.22,0.75,0.15,1)_both]">
      <OrderHeader props={props} />
      {/* Order-level progress lives here — not on individual Line Up items anymore */}
      <section className="mb-4 overflow-hidden rounded-[15px] border bg-card">
        <StageRail stage={props.stage} compact reviseStage={isRevised ? 'Approval' : null}/>
        {isRevised && <div className="px-3.5 pb-2"><Badge variant="destructive">Revised · v{designs.length}</Badge></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {canAdvance && <Button type='button' onClick={props.advanceStage} disabled={atLastStage || releaseGate || advanceBlockedByDesign || advanceBlockedByApproval || advanceBlockedByLineUp || advanceBlockedBySizing || advanceBlockedByPrinter} title={releaseGate ? 'QC must pass before release' : advanceBlockedByDesign ? 'Upload a design in Designs tab first' : advanceBlockedByApproval ? 'Approve at least one design first' : advanceBlockedByLineUp ? 'Add at least one Line Up item first' : advanceBlockedBySizing ? 'Upload sizing for every Line Up item first' : advanceBlockedByPrinter ? 'Assign a printing crew first' : undefined}><IconArrowRight size={15} /> {props.stage === 'For Release' ? 'Release order' : 'Advance stage'}</Button>}
            {canQc && props.qcStatus !== 'Passed' && <Button type='button' variant="outline" onClick={props.passQc}><IconClipboardCheck size={15} /> Record QC pass</Button>}
            {isAdmin && <Button type='button' variant="outline" onClick={props.openRework}><IconRefresh size={15} /> Send back</Button>}
            {!canAdvance && <span className="text-xs text-muted-foreground">Current stage: <strong className="text-primary">{props.stage}</strong></span>}
          </div>
          {releaseGate && <small className="text-xs font-bold text-amber-700">QC must pass before this order can be released.</small>}
          {printerMissing && <small className="text-xs font-bold text-amber-700">Awaiting printing crew assignment.</small>}
        </div>
      </section>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList className="w-full justify-start">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex h-[38px] items-center gap-2 px-3.5 text-[13px] font-bold text-muted-foreground" title={tab === 'projects' && warnLineUp ? 'Line Up is empty — add items before advancing' : tab === 'sizings' && warnSizing ? 'Sizing incomplete — upload sizing for every Line Up item before advancing' : undefined}>
              {tab === 'overview' && <IconFileText size={16} />}
              {tab === 'projects' && <IconStack2 size={16} />}
              {tab === 'discussion' && <IconMessages size={16} />}
              {tab === 'designs' && <IconPhoto size={16} />}
              {tab === 'sizings' && <IconRuler2 size={16} />}
              {tab === 'activity' && <IconActivity size={16} />}
              <span className="capitalize">{TAB_LABELS[tab]}</span>
              {tab === 'projects' && warnLineUp && <IconAlertTriangle size={15} className="text-amber-500" aria-label="Line Up is empty" />}
              {tab === 'projects' && <span className={cn('inline-grid min-w-[19px] place-items-center rounded-md px-1 text-xs font-bold', warnLineUp ? 'bg-amber-100 text-amber-700' : 'bg-muted')}>{order.projects.length}</span>}
              {tab === 'sizings' && warnSizing && <IconAlertTriangle size={15} className="text-amber-500" aria-label="Sizing incomplete" />}
              {tab === 'sizings' && <span className={cn('inline-grid min-w-[19px] place-items-center rounded-md px-1 text-xs font-bold', warnSizing ? 'bg-amber-100 text-amber-700' : 'bg-muted')}>{sizingCount}</span>}
              {tab === 'discussion' && <span className="inline-grid min-w-[19px] place-items-center rounded-md bg-muted px-1 text-xs font-bold">{order.discussion.length}</span>}
              {tab === 'designs' && <span className="inline-grid min-w-[19px] place-items-center rounded-md bg-muted px-1 text-xs font-bold">{designs.length}</span>}
            </TabsTrigger>
          ))}
          <Button type='button' variant="ghost" size="icon" className="ml-auto" aria-label='More order actions'><IconDots size={18} /></Button>
        </TabsList>
      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-4 pt-4 max-[820px]:grid-cols-1">
        <TabsContent value="overview">
          {/* Card border stays for every viewer; only the toolbar row (with its bottom line)
              is admin-only — non-admins (e.g. the assigned artist) skip it entirely. */}
          <Card className="mb-0">
            <CardHeader className="border-b">
              <CardAction>
                <Button type='button' variant="outline" onClick={() => setOverviewDraft(order.overview)}><IconPencil size={13} /> Edit overview</Button>
              </CardAction>
            </CardHeader>
            {overviewDraft === null
              ? (
                <CardContent className="text-xs">
                  {readOverview
                    ? <div className="leading-[1.6] text-muted-foreground [&_img]:my-1.5 [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: readOverview }} />
                    : <p className="text-muted-foreground">No overview was added to this order yet.</p>}
                </CardContent>
              )
              : (
                <OverviewEditor
                  initialHtml={order.overview}
                  onChange={setOverviewDraft}
                  className="px-4 py-4"
                  header={(toolbar) => (
                    <div className="flex min-h-[46px] items-center justify-between gap-2 border-b px-4 py-2">
                      {toolbar}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button type='button' onClick={saveOverview} disabled={!overviewDirty}>Save</Button>
                        <Button type='button' variant="ghost" onClick={cancelOverview}>Cancel</Button>
                      </div>
                    </div>
                  )}
                />
              )}
          </Card>
        </TabsContent>
        <TabsContent value="projects">
          <Card className="mb-0">
            <CardHeader className="border-b">
              <div><CardDescription className="mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em]">{order.projects.length} items</CardDescription><CardTitle className="text-[17px] tracking-[-0.02em]">Line Up</CardTitle></div>
             <CardAction className="flex flex-wrap items-center gap-2">
                {isAdmin && !needsTemplatePick && <>
                  <Select value={templateName} onValueChange={(v) => { if (v === '__save_template__') { saveAsTemplate(); } else { switchTemplate(v ?? ''); } }}>
                    <SelectTrigger aria-label='Line Up template' className={cn(deviated && 'border-amber-400 text-amber-800', order.projects.length > 0 && 'opacity-60')} title={order.projects.length > 0 ? 'Template locked once items exist — Save template… still available' : deviated ? 'Columns differ from this template — Save as template to keep them' : undefined}>
                      <SelectValue>{templateName}{deviated ? ' (modified)' : ''}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(props.lineUpTemplates).map((name) => <SelectItem key={name} value={name} disabled={order.projects.length > 0} title={order.projects.length > 0 ? 'Template is locked once items exist' : undefined}>{name}</SelectItem>)}
                      <SelectSeparator />
                      <SelectItem value="__save_template__" >Save template…</SelectItem>
                    </SelectContent>
                  </Select>
                  {(lineUpDraft !== null || busySaving) && <>
                    <Button type='button' onClick={() => { if (saveTimer.current !== null) { window.clearTimeout(saveTimer.current); saveTimer.current = null; } saveLineUp(); }} disabled={busySaving}>{busySaving ? 'Saving…' : 'Save table'}</Button>
                    {!busySaving && <Button type='button' variant="outline" onClick={discardLineUp}>Discard</Button>}
                  </>}
                  <Button type='button' onClick={() => props.openAddProject(lineUpCols)}><IconPlus size={14} /> Add item</Button>
                </>}
              </CardAction>
            </CardHeader>
            {needsTemplatePick
              ? (
                <CardContent className="text-xs">
                  {isAdmin ? (
                    <>
                      <p className="mb-3 text-muted-foreground">This order has no Line Up template yet. Pick one to start the roster — it can be changed until the first item is added.</p>
                      <Select onValueChange={(v) => switchTemplate(typeof v === 'string' ? v : '')}>
                        <SelectTrigger aria-label='Choose Line Up template'>
                          <SelectValue placeholder="Choose template…" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(props.lineUpTemplates).map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No Line Up items yet.</p>
                  )}
                </CardContent>
              )
              : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        {lineUpCols.map((col, i) => (
                          <TableHead key={col} className="whitespace-nowrap uppercase tracking-wider text-xs">
                            <span className="inline-flex items-center gap-1">
                              {col}
                              {isAdmin && i > 0 && (
                                <Button type='button' variant="ghost" size="icon" className="size-4 rounded-full text-muted-foreground hover:bg-muted hover:text-red-600" aria-label={`Remove column ${col}`} onClick={() => removeLineUpColumn(col)}><IconX size={11} /></Button>
                              )}
                            </span>
                          </TableHead>
                        ))}
                        {isAdmin && <TableHead><Button type='button' variant="outline" size="sm" className="inline-flex gap-1 rounded-md border-dashed px-2 py-1 text-[11px] font-bold uppercase tracking-normal text-muted-foreground hover:border-primary hover:text-primary" onClick={addLineUpColumn}><IconPlus size={12} /> column</Button></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {props.lineUpItems.map((item, idx) => (
                        <TableRow
                          key={item.id}
                          className={cn(
                            dragIndex === idx && 'opacity-35',
                            dropIndex === idx && dragIndex !== null && dragIndex !== idx && 'shadow-[inset_0_2px_0_0_var(--primary)]',
                          )}
                          onDragOver={(e) => { e.preventDefault(); setDropIndex(idx); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragIndex !== null && dragIndex !== idx) moveLineUpItem(props.lineUpItems[dragIndex], idx);
                            clearDrag();
                          }}
                        >
                          {lineUpCols.map((col, i) => (
                            <TableCell key={col}>
                              {i === 0
                                ? isAdmin
                                  ? <Input className="w-full min-w-[130px] font-bold" value={nameValue(item)} onChange={(e) => editName(item.id, e.target.value)} aria-label={`${col} of ${item.name}`} />
                                  : <strong className="text-[13px] font-bold">{item.name}</strong>
                                : isAdmin
                                  ? <Input
                                      className="w-full min-w-[90px]"
                                      value={cellValue(item, col)}
                                      onChange={(e) => editCell(item.id, col, e.target.value)}
                                      placeholder='—'
                                      aria-label={`${col} for ${item.name}`}
                                    />
                                  : <span className="text-[13px]">{cellValue(item, col) || '—'}</span>}
                            </TableCell>
                          ))}
                          {isAdmin && <TableCell className="w-[1%] whitespace-nowrap" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== idx) moveLineUpItem(props.lineUpItems[dragIndex], idx); clearDrag(); }}>
                            <div className="flex items-center justify-end gap-1">
                              <span className={cn('grid size-[30px] cursor-grab place-items-center rounded-lg text-muted-foreground hover:bg-muted', dragIndex === idx && 'opacity-35')} draggable title='Drag to reorder' aria-label='Drag to reorder' onDragStart={() => setDragIndex(props.lineUpItems.findIndex((p) => p.id === item.id))} onDragEnd={clearDrag}><IconGripVertical size={15} /></span>
                              <Button type='button' variant="outline" size="icon" className={rowActionBtn} onClick={() => moveLineUpItem(item, Math.max(0, idx - 1))} disabled={idx === 0} aria-label='Move up' title='Move up'><IconArrowDown size={14} style={{ rotate: '180deg' }} /></Button>
                              <Button type='button' variant="outline" size="icon" className={rowActionBtn} onClick={() => moveLineUpItem(item, Math.min(props.lineUpItems.length - 1, idx + 1))} disabled={idx === props.lineUpItems.length - 1} aria-label='Move down' title='Move down'><IconArrowDown size={14} /></Button>
                              <Button type='button' variant="outline" size="icon" className={cn(rowActionBtn, 'hover:bg-red-50 hover:text-red-600')} onClick={() => removeLineUpItem(item)} aria-label='Remove item' title='Remove item'><IconTrash size={14} /></Button>
                            </div>
                          </TableCell>}
                        </TableRow>
                      ))}
                      {order.projects.length === 0 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={lineUpCols.length + (isAdmin ? 1 : 0)} className="py-8 text-center text-xs text-muted-foreground">No items yet — use "Add item" to start the Line Up.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
          </Card>
        </TabsContent>
        <TabsContent value="discussion">
          <Card className="mb-0">
            <div className="p-4">
              <OverviewEditor key={composerKey} initialHtml='' onChange={setComposerDraft} boxed header={(toolbar) => (
                <div className="flex items-center justify-between gap-2 pb-2">
                  {toolbar}
                </div>
              )} />
              <div className="mt-2 flex items-center justify-end gap-2">
                {commentText && <Button type='button' variant="ghost" onClick={clearComposer}>Clear</Button>}
                <Button type='button' onClick={postComment} disabled={!commentText}>Post</Button>
              </div>
            </div>
            {order.discussion.length === 0
              ? <p className="px-4 py-3 text-xs text-muted-foreground">No comments yet — post the first note above.</p>
              : <div className="mt-2 grid gap-0.5 pb-2">
                  {[...order.discussion].reverse().map((c) => (
                    <div key={c.id} className="group flex gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                      <Avatar className="shrink-0"><AvatarFallback className="text-sm font-bold">{(c.author || '?').slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <strong className="text-[13px] font-bold">{c.author}</strong>
                          <span className="text-xs text-muted-foreground">{formatCommentTime(c.createdAt)}</span>
                          {isAdmin && <Button type='button' variant="ghost" size="icon" className="ml-auto size-6 rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => deleteComment(c.id)} aria-label='Delete comment' title='Delete comment'><IconTrash size={13} /></Button>}
                        </div>
                        {readComments[c.id]
                          ? <div className="mt-1 text-[13px] leading-[1.55] text-foreground [&_img]:my-1.5 [&_img]:max-w-full [&_img]:rounded-lg [&_p]:first:mt-0 [&_p]:last:mb-0" dangerouslySetInnerHTML={{ __html: readComments[c.id] }} />
                          : <p className="mt-1 text-[13px]">…</p>}
                      </div>
                    </div>
                  ))}
                </div>}
          </Card>
        </TabsContent>
        <TabsContent value="designs">
          <DesignsTab order={order as unknown as DemoOrder} user={props.user} isOwner={isAdmin} updateOrder={props.updateOrder} />
        </TabsContent>
        <TabsContent value="sizings">
          <SizingsTab order={order as unknown as DemoOrder} user={props.user} isOwner={isAdmin} updateOrder={props.updateOrder} />
        </TabsContent>
        <TabsContent value="activity">
          <Card className="mb-0">
            <CardHeader className="border-b">
              <div><CardDescription className="mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em]">Activity</CardDescription><CardTitle className="text-[17px] tracking-[-0.02em]">What happened</CardTitle></div>
            </CardHeader>
            <CardContent className="text-xs"><p className="text-muted-foreground">No activity recorded yet. Stage advances, assignments, and releases will appear here.</p></CardContent>
          </Card>
        </TabsContent>
        <aside className="grid content-start gap-3">
          <Card className="mb-0">
            <CardHeader>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Job brief</span>
              <CardAction>
                {isAdmin && (briefDraft === null
                  ? <Button type='button' variant="ghost" size="sm" className="gap-1 px-2 text-xs font-bold text-primary hover:text-primary" onClick={() => setBriefDraft({ customer: order.customer, contact: order.contact, category: order.category, orderType: order.orderType, dueDate: order.dueDate, priority: order.priority, assignedArtistId: order.assignedArtistId, assignedPrinterIds: order.assignedPrinterIds })}><IconPencil size={13} /> Edit</Button>
                  : null)}
              </CardAction>
            </CardHeader>
            {briefDraft === null
              ? (
                <CardContent>
                  {[['Customer', order.customer], ['Contact', order.contact || '—'], ['Category', order.category], ['Order type', order.orderType], ['Assigned artist', users.find((u) => u.id === order.assignedArtistId)?.name ?? '—'], ['Printing crew', order.assignedPrinterIds.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(', ') || '—'], ['Created', formatDate(order.createdAt.slice(0, 10))], ['Promise date', formatDate(order.dueDate)], ['Priority', order.priority]].map(([dt, dd]) => (
                    <div key={dt} className="grid gap-0.5 border-b py-2.5 last:border-b-0">
                      <dt className="text-xs text-muted-foreground">{dt}</dt>
                      <dd className="text-xs font-bold text-foreground">{dd}</dd>
                    </div>
                  ))}
                </CardContent>
              )
              : (
                <CardContent className="grid gap-2.5">
                  <label className="grid gap-1 text-xs font-bold text-foreground">Customer<Input required value={briefDraft.customer ?? ''} onChange={(e) => setBriefDraft({ ...briefDraft, customer: e.target.value })} /></label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Contact<Input value={briefDraft.contact ?? ''} onChange={(e) => setBriefDraft({ ...briefDraft, contact: e.target.value })} /></label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Category
                    <Select value={briefDraft.category ?? ''} onValueChange={(v) => { const cat = v ?? ''; setBriefDraft({ ...briefDraft, category: cat, orderType: (props.orderTypes[cat] ?? [])[0] ?? '' }); }}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {props.categories.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Order type
                    <Select value={briefDraft.orderType ?? ''} onValueChange={(v) => setBriefDraft({ ...briefDraft, orderType: v ?? '' })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(props.orderTypes[briefDraft.category ?? ''] ?? []).map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Assigned artist
                    <Select value={briefDraft.assignedArtistId || '__unassigned__'} onValueChange={(v) => setBriefDraft({ ...briefDraft, assignedArtistId: v === '__unassigned__' ? '' : v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned__">— Unassigned</SelectItem>
                        {users.filter((u) => u.role === 'artist').map((artist) => (
                          <SelectItem key={artist.id} value={artist.id}>{artist.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Printing crew
                    <div className="flex flex-wrap items-center gap-1.5">
                      {users.filter((u) => u.role === 'printer').map((printer) => {
                        const on = (briefDraft.assignedPrinterIds ?? []).includes(printer.id);
                        return (
                          <Button key={printer.id} type='button' variant={on ? 'default' : 'outline'} size="sm" className="h-7 rounded-full px-2.5 text-xs font-bold" onClick={() => setBriefDraft({ ...briefDraft, assignedPrinterIds: on ? (briefDraft.assignedPrinterIds ?? []).filter((id) => id !== printer.id) : [...(briefDraft.assignedPrinterIds ?? []), printer.id] })}>
                            {printer.name}
                          </Button>
                        );
                      })}
                      <Button type='button' variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-primary" onClick={() => setBriefDraft({ ...briefDraft, assignedPrinterIds: users.filter((u) => u.role === 'printer').map((p) => p.id) })}>Select all</Button>
                      {(briefDraft.assignedPrinterIds ?? []).length > 0 && <Button type='button' variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-muted-foreground" onClick={() => setBriefDraft({ ...briefDraft, assignedPrinterIds: [] })}>Clear</Button>}
                    </div>
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Promise date<Input type="date" value={briefDraft.dueDate ?? ''} onChange={(e) => setBriefDraft({ ...briefDraft, dueDate: e.target.value })} /></label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Priority
                    <Select value={briefDraft.priority ?? 'Normal'} onValueChange={(v) => setBriefDraft({ ...briefDraft, priority: (v ?? 'Normal') as 'Normal' | 'Urgent' })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem><SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <div className="mt-1 flex gap-2">
                    <Button type='button' onClick={saveBrief}>Save</Button>
                    <Button type='button' variant="ghost" onClick={() => setBriefDraft(null)}>Cancel</Button>
                  </div>
                </CardContent>
              )}
          </Card>
        </aside>
      </div>
      </Tabs>
      <ConfirmActionDialog
        open={pendingConfirmation !== null}
        title={pendingConfirmation?.kind === 'discardOverview' ? 'Discard overview changes?' : pendingConfirmation?.kind === 'deleteComment' ? 'Delete comment?' : 'Remove Line Up item?'}
        description={pendingConfirmation?.kind === 'discardOverview' ? 'Your unsaved overview changes will be lost.' : pendingConfirmation?.kind === 'deleteComment' ? `Delete the comment by ${pendingConfirmation.author}?` : pendingConfirmation?.kind === 'removeLineUpItem' ? `Remove "${pendingConfirmation.itemName}" from the Line Up?` : ''}
        confirmLabel={pendingConfirmation?.kind === 'discardOverview' ? 'Discard changes' : pendingConfirmation?.kind === 'deleteComment' ? 'Delete comment' : 'Remove item'}
        variant="destructive"
        onOpenChange={(open) => { if (!open) setPendingConfirmation(null); }}
        onConfirm={confirmPendingAction}
      />
      <TextPromptDialog
        open={pendingTextPrompt !== null}
        title={pendingTextPrompt?.kind === 'lineUpTemplate' ? 'Save Line Up template' : 'Add Line Up column'}
        description={pendingTextPrompt?.kind === 'lineUpTemplate' ? 'Save the current columns as a reusable template.' : 'Add a column to this order’s Line Up.'}
        label={pendingTextPrompt?.kind === 'lineUpTemplate' ? 'Template name' : 'Column name'}
        defaultValue={pendingTextPrompt?.kind === 'lineUpTemplate' ? pendingTextPrompt.defaultValue : ''}
        submitLabel={pendingTextPrompt?.kind === 'lineUpTemplate' ? 'Save template' : 'Add column'}
        onOpenChange={(open) => { if (!open) setPendingTextPrompt(null); }}
        onSubmit={submitTextPrompt}
      />
    </div>
  );
}