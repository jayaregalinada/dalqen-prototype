import { IconActivity, IconArrowDown, IconArrowLeft, IconStack2, IconFileText, IconGripVertical, IconMessages, IconDots, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { cx, formatDate, orderStatus } from '../shared/helpers';
import { cn } from '@/lib/utils';
import type { DemoOrder, PrototypeProps, ProjectCard } from '../shared/types';
import { OrderHeader } from '../orders/order-header';
import { users } from '../shared/constants';
import { resolveStorageImages } from '../shared/image-storage';
import { EmptyWorkspace } from '../ui/empty-workspace';
import { OverviewEditor } from '../ui/overview-editor';
import { Status } from '../ui/status';
import { Link } from '../ui/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const tabs = ['overview', 'projects', 'discussion', 'activity'] as const;
type Tab = (typeof tabs)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  projects: 'Line Up',
  discussion: 'Discussion',
  activity: 'Activity',
};

type LineUpRowDraft = { name?: string; custom?: Record<string, string> };

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
    if (overviewDirty && !window.confirm('Discard unsaved overview changes?')) return;
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
      <div className="grid min-h-[420px] place-items-center rounded-[20px] border border-dashed bg-card/95 p-12 text-center">
        <p className="text-sm text-muted-foreground">Order not found — it may have been removed, or you don't have access to it.</p>
        <Link href={props.href('orders')}><Button variant="secondary" className="mt-4"><IconArrowLeft size={15} /> Back to orders</Button></Link>
      </div>
    );
  }
  if (!order) return <EmptyWorkspace openNewOrder={props.openNewOrder} canCreateOrder={props.canCreateOrder} />;
  const released = order.projects.filter((project) => project.stage === 'Completed').length;
  const progress = order.projects.length ? Math.round((released / order.projects.length) * 100) : 0;

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
    if (!target || !order) return;
    if (!window.confirm(`Delete comment by ${target.author || 'unknown'}?`)) return;
    props.updateOrder(order.id, { discussion: order.discussion.filter((c) => c.id !== id) });
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
  const lineUpCols = [...new Set([...(props.lineUpTemplates[templateName] ?? []), ...(order.lineUpColumns ?? [])])];
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
  const removeLineUpItem = (item: ProjectCard) => {
    if (!window.confirm(`Remove "${item.name}" from the Line Up?`)) return;
    setLineUpDraft((prev) => {
      if (!prev) return prev;
      const { [item.id]: _removed, ...rest } = prev;
      return Object.keys(rest).length ? rest : null;
    });
    props.removeItem(order.id, item.id);
  };
  const moveLineUpItem = (item: ProjectCard, toIndex: number) => props.moveItemTo(order.id, item.id, toIndex);
  const addLineUpColumn = () => {
    const name = window.prompt('New column name');
    if (!name?.trim()) return;
    if ((order.lineUpColumns ?? []).includes(name.trim())) return;
    props.updateOrder(order.id, { lineUpColumns: [...(order.lineUpColumns ?? []), name.trim().slice(0, 40)] });
  };
  const removeLineUpColumn = (col: string) =>
    props.updateOrder(order.id, { lineUpColumns: order.lineUpColumns.filter((c) => c !== col) });
  const switchTemplate = (name: string) => {
    if (!name) return;
    props.updateOrder(order.id, { lineUpTemplateName: name });
  };
  const saveAsTemplate = () => {
    const name = window.prompt('Save these columns as template named:', templateName);
    if (!name?.trim()) return;
    props.saveLineUpTemplate(name.trim().slice(0, 40), lineUpCols, order.id);
  };

  const saveBrief = () => {
    if (briefDraft) props.updateOrder(order.id, briefDraft);
    setBriefDraft(null);
  };

  const lineUpCell = 'w-full min-w-[90px] rounded-[7px] border border-transparent bg-transparent px-[7px] py-[5px] text-[13px] font-normal text-foreground outline-none hover:border-border focus:border-primary focus:bg-background';
  const rowActionBtn = 'grid size-[30px] place-items-center rounded-lg border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-default';
  const smallInput = 'h-[34px] w-full rounded-lg border border-input bg-background px-2.5 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40';

  return (
    <div className="animate-[enter_580ms_cubic-bezier(0.22,0.75,0.15,1)_both]">
      <OrderHeader props={props} />
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList className="w-full justify-start">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex h-[38px] items-center gap-2 px-3.5 text-[13px] font-bold text-muted-foreground">              {tab === 'overview' && <IconFileText size={16} />}
              {tab === 'projects' && <IconStack2 size={16} />}
              {tab === 'discussion' && <IconMessages size={16} />}
              {tab === 'activity' && <IconActivity size={16} />}
              <span className="capitalize">{TAB_LABELS[tab]}</span>
              {tab === 'projects' && <span className="inline-grid min-w-[19px] place-items-center rounded-md bg-muted px-1 text-xs font-bold">{order.projects.length}</span>}
              {tab === 'discussion' && <span className="inline-grid min-w-[19px] place-items-center rounded-md bg-muted px-1 text-xs font-bold">{order.discussion.length}</span>}
            </TabsTrigger>
          ))}
          <Button type='button' variant="ghost" size="icon" className="ml-auto" aria-label='More order actions'><IconDots size={18} /></Button>
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-4 pt-4 max-[820px]:grid-cols-1">
        {activeTab === 'overview' && (
          // card border stays for every viewer; only the toolbar row (with its bottom line)
          // is admin-only — non-admins (e.g. the assigned artist) skip it entirely
          <section className="overflow-hidden rounded-[15px] border bg-card">
            {/* CardHeader row stays mounted for admin; content swaps: read = Edit button, edit = TipTap toolbar + Save/Cancel */}
            {isAdmin && overviewDraft === null && (
              <div className="flex items-center justify-end gap-2 border-b px-4 py-2.5">
                <Button type='button' variant="outline" onClick={() => setOverviewDraft(order.overview)}><IconPencil size={13} /> Edit overview</Button>
              </div>
            )}
            {overviewDraft === null
              ? (
                <div className="px-4 py-3 text-xs">
                  {readOverview
                    ? <div className="leading-[1.6] text-muted-foreground [&_img]:my-1.5 [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: readOverview }} />
                    : <p className="text-muted-foreground">No overview was added to this order yet.</p>}
                </div>
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
          </section>
        )}
        {activeTab === 'projects' && (
          <section className="overflow-hidden rounded-[15px] border bg-card">
            <header className="flex min-h-[80px] items-center justify-between gap-5 border-b px-4 py-3.5">
                <div><span className="mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{order.projects.length} items</span><h2 className="font-heading text-[17px] tracking-[-0.02em]">Line Up</h2></div>
                <div className="flex items-center gap-2.5">
                  {isAdmin && !needsTemplatePick && <>
                  <Select value={templateName} onValueChange={(v) => switchTemplate(v ?? '')} disabled={order.projects.length > 0}>
                    <SelectTrigger aria-label='Line Up template' title={order.projects.length > 0 ? 'Template is locked once items exist' : undefined}>
                      <SelectValue placeholder="Template" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(props.lineUpTemplates).map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button type='button' className="inline-flex min-h-[34px] items-center rounded-lg border bg-card px-2.5 text-xs font-bold" onClick={saveAsTemplate}>Save as template</button>
                  {(lineUpDraft !== null || busySaving) && <>
                    <button type='button' className="inline-flex min-h-[34px] items-center rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-60" onClick={() => { if (saveTimer.current !== null) { window.clearTimeout(saveTimer.current); saveTimer.current = null; } saveLineUp(); }} disabled={busySaving}>{busySaving ? 'Saving…' : 'Save table'}</button>
                    {!busySaving && <Button type='button' variant="outline" onClick={discardLineUp}>Discard</Button>}
                  </>}
                  <Button type='button' onClick={() => props.openAddProject(lineUpCols)}><IconPlus size={14} /> Add item</Button>
                </>}
              </div>
            </header>
            {needsTemplatePick
              ? (
                <div className="p-4 text-xs">
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
                </div>
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
                              {isAdmin && i > 0 && order.lineUpColumns.includes(col) && (
                                <button type='button' className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-red-600" aria-label={`Remove column ${col}`} onClick={() => removeLineUpColumn(col)}><IconX size={11} /></button>
                              )}
                            </span>
                          </TableHead>
                        ))}
                        {isAdmin && <TableHead><button type='button' className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/40 px-2 py-1 text-[11px] font-bold uppercase tracking-normal text-muted-foreground hover:border-primary hover:text-primary" onClick={addLineUpColumn}><IconPlus size={12} /> column</button></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {props.projects.map((item, idx) => (
                        <TableRow
                          key={item.id}
                          className={cn(
                            dragIndex === idx && 'opacity-35',
                            dropIndex === idx && dragIndex !== null && dragIndex !== idx && 'shadow-[inset_0_2px_0_0_var(--primary)]',
                          )}
                          onDragOver={(e) => { e.preventDefault(); setDropIndex(idx); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragIndex !== null && dragIndex !== idx) moveLineUpItem(props.projects[dragIndex], idx);
                            clearDrag();
                          }}
                        >
                          {lineUpCols.map((col, i) => (
                            <TableCell key={col}>
                              {i === 0
                                ? isAdmin
                                  ? <Input className={cn(lineUpCell, 'min-w-[130px] font-bold')} value={nameValue(item)} onChange={(e) => editName(item.id, e.target.value)} aria-label={`${col} of ${item.name}`} />
                                  : <strong className="text-[13px] font-bold">{item.name}</strong>
                                : isAdmin
                                  ? <Input
                                      className={lineUpCell}
                                      value={cellValue(item, col)}
                                      onChange={(e) => editCell(item.id, col, e.target.value)}
                                      placeholder='—'
                                      aria-label={`${col} for ${item.name}`}
                                    />
                                  : <span className="text-[13px]">{cellValue(item, col) || '—'}</span>}
                            </TableCell>
                          ))}
                          {isAdmin && <TableCell className="w-[1%] whitespace-nowrap" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== idx) moveLineUpItem(props.projects[dragIndex], idx); clearDrag(); }}>
                            <div className="flex items-center justify-end gap-1">
                              <span className={cn('grid size-[30px] cursor-grab place-items-center rounded-lg text-muted-foreground hover:bg-muted', dragIndex === idx && 'opacity-35')} draggable title='Drag to reorder' aria-label='Drag to reorder' onDragStart={() => setDragIndex(props.projects.findIndex((p) => p.id === item.id))} onDragEnd={clearDrag}><IconGripVertical size={15} /></span>
                              <button type='button' className={rowActionBtn} onClick={() => moveLineUpItem(item, Math.max(0, idx - 1))} disabled={idx === 0} aria-label='Move up' title='Move up'><IconArrowDown size={14} style={{ rotate: '180deg' }} /></button>
                              <button type='button' className={rowActionBtn} onClick={() => moveLineUpItem(item, Math.min(props.projects.length - 1, idx + 1))} disabled={idx === props.projects.length - 1} aria-label='Move down' title='Move down'><IconArrowDown size={14} /></button>
                              <button type='button' className={cn(rowActionBtn, 'hover:bg-red-50 hover:text-red-600')} onClick={() => removeLineUpItem(item)} aria-label='Remove item' title='Remove item'><IconTrash size={14} /></button>
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
          </section>
        )}
        {activeTab === 'discussion' && (
          <section className="overflow-hidden rounded-[15px] border bg-card">
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
                          {isAdmin && <button type='button' className="ml-auto grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => deleteComment(c.id)} aria-label='Delete comment' title='Delete comment'><IconTrash size={13} /></button>}
                        </div>
                        {readComments[c.id]
                          ? <div className="mt-1 text-[13px] leading-[1.55] text-foreground [&_img]:my-1.5 [&_img]:max-w-full [&_img]:rounded-lg [&_p]:first:mt-0 [&_p]:last:mb-0" dangerouslySetInnerHTML={{ __html: readComments[c.id] }} />
                          : <p className="mt-1 text-[13px]">…</p>}
                      </div>
                    </div>
                  ))}
                </div>}
          </section>
        )}
        {activeTab === 'activity' && (
          <section className="overflow-hidden rounded-[15px] border bg-card">
            <header className="flex min-h-[67px] items-center border-b px-4 py-3">
              <div><span className="mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Activity</span><h2 className="font-heading text-[17px] tracking-[-0.02em]">What happened</h2></div>
            </header>
            <p className="px-4 py-3 text-xs text-muted-foreground">No activity recorded yet. Stage advances, assignments, and releases will appear here.</p>
          </section>
        )}
        <aside className="grid content-start gap-3">
          <section className="overflow-hidden rounded-[15px] border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Job brief</span>
              {isAdmin && (briefDraft === null
                ? <button type='button' className="inline-flex items-center gap-1 bg-transparent p-0 text-xs font-bold text-primary" onClick={() => setBriefDraft({ customer: order.customer, contact: order.contact, category: order.category, orderType: order.orderType, dueDate: order.dueDate, priority: order.priority, assignedArtistId: order.assignedArtistId })}><IconPencil size={13} /> Edit</button>
                : null)}
            </div>
            {briefDraft === null
              ? (
                <dl className="mt-1.5">
                  {[['Customer', order.customer], ['Contact', order.contact || '—'], ['Category', order.category], ['Order type', order.orderType], ['Assigned artist', users.find((u) => u.id === order.assignedArtistId)?.name ?? '—'], ['Created', formatDate(order.createdAt.slice(0, 10))], ['Promise date', formatDate(order.dueDate)], ['Priority', order.priority]].map(([dt, dd]) => (
                    <div key={dt} className="grid gap-0.5 border-b py-2.5 last:border-b-0">
                      <dt className="text-xs text-muted-foreground">{dt}</dt>
                      <dd className="text-xs font-bold text-foreground">{dd}</dd>
                    </div>
                  ))}
                </dl>
              )
              : (
                <div className="mt-3 grid gap-2.5">
                  <label className="grid gap-1 text-xs font-bold text-foreground">Customer<input className={smallInput} required value={briefDraft.customer ?? ''} onChange={(e) => setBriefDraft({ ...briefDraft, customer: e.target.value })} /></label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Contact<input className={smallInput} value={briefDraft.contact ?? ''} onChange={(e) => setBriefDraft({ ...briefDraft, contact: e.target.value })} /></label>
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
                    <Select value={briefDraft.assignedArtistId ?? ''} onValueChange={(v) => setBriefDraft({ ...briefDraft, assignedArtistId: v ?? '' })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— Unassigned</SelectItem>
                        {users.filter((u) => u.role === 'artist').map((artist) => (
                          <SelectItem key={artist.id} value={artist.id}>{artist.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-foreground">Promise date<input type='date' className={smallInput} value={briefDraft.dueDate ?? ''} onChange={(e) => setBriefDraft({ ...briefDraft, dueDate: e.target.value })} /></label>
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
                </div>
              )}
          </section>
        </aside>
      </div>
    </div>
  );
}