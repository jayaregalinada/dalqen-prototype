import { useEffect, useRef, useState } from 'react';
import { IconUpload, IconCheck, IconX, IconPhoto, IconFile, IconEye, IconDownload, IconZoomIn, IconZoomOut, IconLayoutGrid, IconList, IconRotate, IconSquareCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { stages, users } from '../shared/constants';
import { DESIGN_BUCKET, resolveDesignUrls, uploadDesignFile } from '../shared/image-storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DESIGN_URL_MAX_CHARS, orderDesignState } from '../hooks/use-shared-demo-state';
import type { DemoOrder, DemoDesign } from '../hooks/use-shared-demo-state';
import type { User } from '../shared/types';

type Props = {
  order: DemoOrder;
  user: User;
  isOwner: boolean;
  updateOrder: (orderId: string, patch: Partial<DemoOrder>) => void;
};

type UploadProgress = { name: string; status: 'uploading' | 'done' | 'failed' };
type RejectTarget = { kind: 'single'; design: DemoDesign } | { kind: 'bulk' };

const STATUS_BORDER: Record<DemoDesign['status'], string> = {
  approved: 'border-emerald-400',
  rejected: 'border-red-400',
  pending: 'border-muted',
};

function StatusChip({ status, name }: { status: DemoDesign['status']; name: string }) {
  if (status === 'approved') {
    return (
      <span title="Approved" aria-label={`${name}: approved`} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-white shadow">
        <IconCheck size={12} stroke={3} aria-hidden />
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span title="Rejected" aria-label={`${name}: rejected`} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-red-500 text-white shadow">
        <IconX size={12} stroke={3} aria-hidden />
      </span>
    );
  }
  return (
    <span title="Pending" aria-label={`${name}: pending`} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-muted-foreground/60 text-white shadow">
      <span className="size-1.5 rounded-full bg-white" aria-hidden />
    </span>
  );
}

export function DesignsTab({ order, user, isOwner, updateOrder }: Props) {
  const designs = order.designs ?? [];
  const designState = orderDesignState(order);
  const approvedCount = designs.filter((d) => d.status === 'approved').length;
  const rejectedCount = designs.filter((d) => d.status === 'rejected').length;
  const isAssignedArtist = order.assignedArtistId === user.id && user.role === 'artist';
  const canUpload = isAssignedArtist && (order.stage === 'Layout' || order.stage === 'Approval');
  const canReview = isOwner && order.stage === 'Approval' && designs.length > 0;
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<DemoDesign | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; active: boolean } | null>(null);

  // Drag-to-pan the zoomed preview instead of scrolling the container.
  const onPanStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: pan.x, baseY: pan.y, active: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || !d.active) return;
    let nx = d.baseX + (e.clientX - d.startX);
    let ny = d.baseY + (e.clientY - d.startY);
    const img = imgRef.current;
    const wrap = imgWrapRef.current;
    if (img && wrap) {
      // keep the scaled image covering the viewport center (no fly-away)
      const maxX = Math.max(0, (img.offsetWidth * zoom - wrap.clientWidth) / 2);
      const maxY = Math.max(0, (img.offsetHeight * zoom - wrap.clientHeight) / 2);
      nx = Math.min(maxX, Math.max(-maxX, nx));
      ny = Math.min(maxY, Math.max(-maxY, ny));
    }
    setPan({ x: nx, y: ny });
  };
  const onPanEnd = () => { if (dragRef.current) dragRef.current.active = false; };
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try { return localStorage.getItem('dalqen-designs-view') === 'grid' ? 'grid' : 'list'; } catch { return 'list'; }
  });
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeRejected, setIncludeRejected] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [overrideTarget, setOverrideTarget] = useState<DemoDesign | null>(null);

  useEffect(() => {
    const paths = (order.designs ?? []).map((d) => d.url).filter((u) => u.startsWith(DESIGN_BUCKET + '/'));
    if (paths.length === 0) { setResolvedUrls({}); return; }
    void resolveDesignUrls(paths).then(setResolvedUrls);
  }, [order.designs]);

  useEffect(() => { if (viewing) { setZoom(1); setPan({ x: 0, y: 0 }); } }, [viewing?.id]);

  const fileToUrl = (file: File): Promise<string> =>
    uploadDesignFile(file).then((path) => {
      if (path) return path;
      return new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result ?? ''));
        r.readAsDataURL(file);
      });
    });

  const buildDesign = (file: File, url: string): DemoDesign => ({
    id: crypto.randomUUID(),
    name: file.name.slice(0, 120),
    url,
    size: file.size,
    uploadedBy: user.id,
    createdAt: new Date().toISOString(),
    status: 'pending',
    rejectReason: null,
    viewedBy: null,
    viewedAt: null,
    downloadedBy: null,
    downloadedAt: null,
  });

  // Sequential upload: each file lands as its own design as it succeeds; failures
  // collect with per-file retry instead of discarding the whole batch.
  const processFiles = async (files: File[]) => {
    setUploading(true);
    setUploadError('');
    setFailedFiles([]);
    const progress: UploadProgress[] = files.map((f) => ({ name: f.name, status: 'uploading' }));
    setUploadProgress(progress);
    let current = designs;
    const failed: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const url = await fileToUrl(f);
        if (!url || url.length > DESIGN_URL_MAX_CHARS) throw new Error('oversized inline fallback');
        current = [...current, buildDesign(f, url)];
        updateOrder(order.id, { designs: current });
        progress[i] = { name: f.name, status: 'done' };
      } catch (e) {
        console.error('Design upload failed', f.name, e);
        progress[i] = { name: f.name, status: 'failed' };
        failed.push(f);
      }
      setUploadProgress([...progress]);
    }
    setFailedFiles(failed);
    setUploading(false);
    if (failed.length > 0) setUploadError(`${files.length - failed.length} uploaded, ${failed.length} failed — retry below`);
  };

  const retryFile = (f: File) => {
    setFailedFiles((prev) => prev.filter((x) => x !== f));
    void processFiles([f]);
  };

  const addFiles = async (files: FileList | File[]) => {
    if (!canUpload || uploading) return;
    const list = Array.from(files).slice(0, 10);
    if (!list.length) return;
    const MAX = 50 * 1024 * 1024;
    const valid: File[] = [];
    const errs: string[] = [];
    const last = designs[designs.length - 1];
    for (const f of list) {
      const isImage = f.type.startsWith('image/');
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      if (!isImage && !isPdf) { errs.push(`${f.name}: images or PDF only`); continue; }
      if (f.size > MAX) { errs.push(`${f.name}: over 50MB`); continue; }
      if (last && last.name === f.name.slice(0, 120) && last.size === f.size && Date.now() - new Date(last.createdAt).getTime() < 30_000) {
        errs.push(`${f.name}: already uploaded`);
        continue;
      }
      valid.push(f);
    }
    if (files.length > 10) errs.push(`first 10 of ${files.length} files processed`);
    if (errs.length) setUploadError(errs.join(' · ')); else setUploadError('');
    if (!valid.length) return;
    void processFiles(valid);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = '';
  };

  const onDragOver = (e: React.DragEvent) => { if (!canUpload || uploading) return; e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canUpload || uploading || !e.dataTransfer.files.length) return;
    void addFiles(e.dataTransfer.files);
  };

  // --- per-design review actions -------------------------------------------------
  const patchDesign = (d: DemoDesign, patch: Partial<DemoDesign>) => {
    updateOrder(order.id, {
      designs: designs.map((x) => (x.id === d.id ? { ...x, ...patch } : x)),
    });
  };

  const approveDesign = (d: DemoDesign) => {
    if (d.status === 'rejected') { setOverrideTarget(d); return; }
    patchDesign(d, { status: 'approved', rejectReason: null });
  };

  const rejectDesign = (d: DemoDesign) => setRejectTarget({ kind: 'single', design: d });

  const resetDesign = (d: DemoDesign) => patchDesign(d, { status: 'pending', rejectReason: null });

  const confirmOverride = () => {
    if (!overrideTarget) return;
    patchDesign(overrideTarget, { status: 'approved', rejectReason: null });
    if (selectMode) setSelected((prev) => new Set(prev).add(overrideTarget.id));
    setOverrideTarget(null);
  };

  const confirmReject = () => {
    const reason = rejectReason.slice(0, 400) || null;
    if (rejectTarget?.kind === 'single') {
      patchDesign(rejectTarget.design, { status: 'rejected', rejectReason: reason });
    } else if (rejectTarget?.kind === 'bulk') {
      updateOrder(order.id, {
        designs: designs.map((x) => (selected.has(x.id) && x.status !== 'rejected' ? { ...x, status: 'rejected', rejectReason: reason } : x)),
      });
      setSelected(new Set());
    }
    setRejectTarget(null);
    setRejectReason('');
  };

  // --- bulk selection ------------------------------------------------------------
  const isSelectable = (d: DemoDesign) => d.status !== 'rejected' || includeRejected;

  const toggleSelect = (d: DemoDesign) => {
    if (!isSelectable(d)) return;
    if (d.status === 'rejected') { setOverrideTarget(d); return; } // prompt at selection
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
      return next;
    });
  };

  const approveSelected = () => {
    updateOrder(order.id, {
      designs: designs.map((x) => (selected.has(x.id) && x.status !== 'approved' ? { ...x, status: 'approved', rejectReason: null } : x)),
    });
    setSelected(new Set());
  };

  const finalize = () => {
    const idx = stages.indexOf(order.stage);
    const next = stages[Math.min(idx + 1, stages.length - 1)];
    updateOrder(order.id, { stage: next });
  };

  // --- display helpers -----------------------------------------------------------
  const getDisplayUrl = (d: DemoDesign) => resolvedUrls[d.url] ?? d.url;
  const viewerName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  const recordAction = (d: DemoDesign, kind: 'view' | 'download') => {
    if (!isOwner) return;
    const now = new Date().toISOString();
    const stamp = kind === 'view'
      ? { viewedBy: user.id, viewedAt: now }
      : { downloadedBy: user.id, downloadedAt: now };
    patchDesign(d, stamp);
  };

  const openViewer = (d: DemoDesign) => {
    recordAction(d, 'view');
    setViewing(d);
  };
  // Modal actions: approve/reject/reset directly from the preview dialog.
  const approveFromModal = (d: DemoDesign) => {
    if (d.status === 'rejected') { setViewing(null); setOverrideTarget(d); return; }
    patchDesign(d, { status: 'approved', rejectReason: null });
    setViewing((v) => (v ? { ...v, status: 'approved', rejectReason: null } : v));
  };

  const rejectFromModal = (d: DemoDesign) => {
    setViewing(null);
    setRejectTarget({ kind: 'single', design: d });
  };

  const resetFromModal = (d: DemoDesign) => {
    patchDesign(d, { status: 'pending', rejectReason: null });
    setViewing((v) => (v ? { ...v, status: 'pending', rejectReason: null } : v));
  };

  const handleDownload = async (d: DemoDesign) => {
    recordAction(d, 'download');
    const url = getDisplayUrl(d);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = d.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(url, '_blank', 'noopener');
    }
  };
  const renderThumb = (d: DemoDesign, displayUrl: string, isImage: boolean, sizeClass: string) => (
    <button
      type="button"
      onClick={() => openViewer(d)}
      aria-label={`View ${d.name}`}
      className={cn(
        'relative block overflow-hidden rounded-lg border-2 bg-muted p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        sizeClass,
        STATUS_BORDER[d.status],
      )}
    >
      {isImage
        ? <img src={displayUrl} alt={d.name} className="size-full object-cover" draggable={false} />
        : <div className="grid size-full place-items-center text-muted-foreground"><IconFile size={20} /></div>}
      <StatusChip status={d.status} name={d.name} />
    </button>
  );

  const renderMeta = (d: DemoDesign) => (
    <>
      <p className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()} · by {viewerName(d.uploadedBy)}</p>
      {(d.viewedBy || d.downloadedBy) && (
        <p className="text-xs text-muted-foreground">
          {d.viewedBy && <>Viewed by {viewerName(d.viewedBy)}{d.viewedAt ? ` · ${new Date(d.viewedAt).toLocaleString()}` : ''}</>}
          {d.viewedBy && d.downloadedBy && ' · '}
          {d.downloadedBy && <>Downloaded by {viewerName(d.downloadedBy)}{d.downloadedAt ? ` · ${new Date(d.downloadedAt).toLocaleString()}` : ''}</>}
        </p>
      )}
      {d.status === 'rejected' && d.rejectReason && <p className="text-xs font-medium text-red-700">Reason: {d.rejectReason}</p>}
    </>
  );

  const renderActions = (d: DemoDesign) => (
    <div className="flex flex-wrap items-center gap-1">
      <Button type="button" variant="ghost" size="sm" onClick={() => openViewer(d)} className="gap-1.5"><IconEye size={14} /> View</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => void handleDownload(d)} className="gap-1.5"><IconDownload size={14} /> Download</Button>
      {canReview && d.status !== 'approved' && (
        <Button type="button" variant="ghost" size="sm" onClick={() => approveDesign(d)} className="gap-1 text-emerald-700"><IconCheck size={14} /> Approve</Button>
      )}
      {canReview && d.status !== 'rejected' && (
        <Button type="button" variant="ghost" size="sm" onClick={() => rejectDesign(d)} className="gap-1 text-destructive"><IconX size={14} /> Reject</Button>
      )}
      {canReview && d.status !== 'pending' && (
        <Button type="button" variant="ghost" size="sm" onClick={() => resetDesign(d)} className="gap-1"><IconRotate size={14} /> Reset</Button>
      )}
    </div>
  );

  const renderDesign = (d: DemoDesign, i: number) => {
    const isLatest = i === 0;
    const version = designs.length - i;
    const displayUrl = getDisplayUrl(d);
    const isImage = d.url.startsWith('data:image') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(d.name);
    const checkbox = selectMode && (
      <input
        type="checkbox"
        checked={selected.has(d.id)}
        disabled={!isSelectable(d)}
        onChange={() => toggleSelect(d)}
        aria-label={`Select ${d.name}`}
        className="size-4 accent-primary"
      />
    );
    if (viewMode === 'grid') {
      return (
        <div key={d.id} className={cn('rounded-xl border bg-card p-2', selectMode && selected.has(d.id) && 'border-primary ring-1 ring-primary/40')}>
          <div className="relative">
            {renderThumb(d, displayUrl, isImage, 'aspect-video w-full')}
            {checkbox && <span className="absolute left-1 top-1">{checkbox}</span>}
          </div>
          <p className="mt-2 truncate text-sm font-bold">{d.name} <span className="font-normal text-muted-foreground">· v{version}{isLatest ? ' · latest' : ''}</span></p>
          {renderMeta(d)}
          <div className="mt-2">{renderActions(d)}</div>
        </div>
      );
    }
    return (
      <div key={d.id} className={cn('flex flex-wrap items-center gap-3 rounded-xl border bg-card p-2.5', selectMode && selected.has(d.id) && 'border-primary ring-1 ring-primary/40')}>
        {checkbox}
        <div className="shrink-0">{renderThumb(d, displayUrl, isImage, 'size-14')}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{d.name} <span className="font-normal text-muted-foreground">· v{version}{isLatest ? ' · latest' : ''}</span></p>
          {renderMeta(d)}
        </div>
        {renderActions(d)}
        {isPdf(d) && <span className="hidden">{displayUrl}</span>}
      </div>
    );
  };

  const isPdf = (d: DemoDesign) => d.name.toLowerCase().endsWith('.pdf') || d.url.includes('.pdf');

  return (
    <>
      <Card className="mb-0">
        <CardHeader className="border-b">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-[17px] tracking-[-0.02em]">
                Designs
                {designs.length > 0 && <Badge variant="secondary">{designs.length} {designs.length === 1 ? 'version' : 'versions'}</Badge>}
                {approvedCount > 0 && <Badge>{approvedCount} approved</Badge>}
                {rejectedCount > 0 && <Badge variant="destructive">{rejectedCount} rejected</Badge>}
                {designState === 'pending' && order.stage === 'Approval' && <Badge variant="outline">Awaiting approval</Badge>}
              </CardTitle>
              <CardDescription className="text-xs">
                {canUpload ? 'Upload a design for approval. First upload gates Layout → Approval.' : order.stage !== 'Layout' && order.stage !== 'Approval' ? 'Uploads are closed in this stage.' : !isAssignedArtist ? 'Only the assigned artist can upload.' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              {canReview && (
                <Button type="button" variant={selectMode ? 'secondary' : 'outline'} size="sm" onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); setIncludeRejected(false); }} className="gap-1.5">
                  <IconSquareCheck size={14} /> {selectMode ? 'Done selecting' : 'Select'}
                </Button>
              )}
              <Button type="button" variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => { setViewMode('list'); try { localStorage.setItem('dalqen-designs-view', 'list'); } catch { /* ignore */ } }} aria-label="List view" title="List view"><IconList size={16} /></Button>
              <Button type="button" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => { setViewMode('grid'); try { localStorage.setItem('dalqen-designs-view', 'grid'); } catch { /* ignore */ } }} aria-label="Grid view" title="Grid view"><IconLayoutGrid size={16} /></Button>
            </div>
          </div>
          {canUpload && <Input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} multiple />}
        </CardHeader>
        <CardContent className="grid gap-3 pt-4" onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          {canUpload && (
            <div
              role="button"
              tabIndex={uploading ? -1 : 0}
              aria-disabled={uploading}
              onClick={() => { if (!uploading) fileRef.current?.click(); }}
              onKeyDown={(e) => { if (uploading) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                uploading ? 'cursor-wait opacity-70' : 'cursor-pointer',
                isDragOver && !uploading ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 bg-muted/20 hover:bg-muted/30',
              )}
            >
              <div className={cn('grid size-10 place-items-center rounded-full', isDragOver && !uploading ? 'bg-primary text-primary-foreground' : 'bg-muted')}><IconUpload size={18} className={isDragOver && !uploading ? '' : 'text-muted-foreground'} /></div>
              <p className="text-sm font-bold">{uploading ? 'Uploading…' : isDragOver ? 'Drop design here' : 'Drag & drop design here'}</p>
              <p className="text-xs text-muted-foreground">or click to browse · PNG, JPG, PDF{designs.length === 0 ? ' · first upload gates Approval' : ''} · up to 10 at once</p>
            </div>
          )}
          {uploading && uploadProgress.length > 0 && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              {uploadProgress.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 py-0.5">
                  {p.status === 'uploading' && <IconUpload size={12} className="animate-pulse text-muted-foreground" aria-hidden />}
                  {p.status === 'done' && <IconCheck size={12} className="text-emerald-600" aria-hidden />}
                  {p.status === 'failed' && <IconX size={12} className="text-destructive" aria-hidden />}
                  <span className="truncate">{p.name}</span>
                </div>
              ))}
            </div>
          )}
          {failedFiles.length > 0 && !uploading && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs" role="alert">
              <p className="font-bold text-destructive">Upload failed</p>
              {failedFiles.map((f) => (
                <div key={f.name + f.size + f.lastModified} className="flex items-center justify-between gap-2 py-1">
                  <span className="truncate">{f.name}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => retryFile(f)}>Retry</Button>
                </div>
              ))}
            </div>
          )}
          {uploadError && !uploading && <p className="text-xs font-medium text-destructive" role="alert">{uploadError}</p>}
          {selectMode && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 p-3">
              <span className="text-xs font-bold">{selected.size} selected</span>
              {rejectedCount > 0 && (
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={includeRejected} onChange={(e) => setIncludeRejected(e.target.checked)} className="size-3.5 accent-primary" />
                  Include previously rejected
                </label>
              )}
              <Button type="button" size="sm" onClick={approveSelected} disabled={selected.size === 0} className="gap-1"><IconCheck size={14} /> Approve selected</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setRejectTarget({ kind: 'bulk' })} disabled={selected.size === 0} className="gap-1"><IconX size={14} /> Reject selected</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          )}
          {designs.length === 0 ? (
            canUpload ? null : (
              <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center">
                <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted"><IconPhoto size={18} className="text-muted-foreground" /></div>
                <p className="mt-3 text-sm font-bold">No designs yet</p>
                <p className="mt-1 text-xs text-muted-foreground">The assigned artist will upload the design here.</p>
              </div>
            )
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...designs].reverse().map((d, i) => renderDesign(d, i))}
            </div>
          ) : (
            <div className="grid gap-2.5">
              {[...designs].reverse().map((d, i) => renderDesign(d, i))}
            </div>
          )}

          {designState === 'rejected' && order.stage === 'Approval' && (
            <p className="text-xs text-muted-foreground">Revised — artist should upload a revised version. Each rejection and its reason are marked on the design.</p>
          )}

          {canReview && approvedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button type="button" onClick={finalize}><IconCheck size={15} /> Approve & advance to Document</Button>
              <span className="text-xs text-muted-foreground">{approvedCount} approved — advancing gates the order out of Approval.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject reason dialog (single or bulk) */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(''); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{rejectTarget?.kind === 'bulk' ? `Reject ${selected.size} designs` : 'Reject design'}</DialogTitle>
            <DialogDescription>Reason (optional) — shown to the artist on the design.</DialogDescription>
          </DialogHeader>
          <Textarea id="design-reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Tell the artist what to revise…" rows={3} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmReject}><IconX size={15} /> Reject</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Override confirm: approving a previously-rejected design */}
      <Dialog open={!!overrideTarget} onOpenChange={(open) => { if (!open) setOverrideTarget(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Approve previously rejected design?</DialogTitle>
            <DialogDescription>"{overrideTarget?.name}" was rejected earlier. Approving it clears the rejection and its reason.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOverrideTarget(null)}>Cancel</Button>
            <Button type="button" onClick={confirmOverride}><IconCheck size={15} /> Approve anyway</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden p-0 sm:max-w-[900px]">
          <DialogHeader className="shrink-0 border-b px-4 py-3">
            <DialogTitle className="pr-6">{viewing?.name}</DialogTitle>
            {viewing && <DialogDescription className="text-xs">{viewing.name} · {new Date(viewing.createdAt).toLocaleString()} · by {viewerName(viewing.uploadedBy)}</DialogDescription>}
          </DialogHeader>
          <div className="relative flex min-h-[50vh] flex-1 items-center justify-center overflow-hidden bg-muted/30 p-4">
            {viewing && (() => {
              const displayUrl = getDisplayUrl(viewing);
              const isImage = viewing.url.startsWith('data:image') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(viewing.name);
              const isPdf = viewing.name.toLowerCase().endsWith('.pdf');
              if (isPdf) {
                return (
                  <div className="h-full w-full overflow-auto">
                    <iframe src={displayUrl} title={viewing.name} className="h-[65vh] w-full rounded border bg-white" />
                  </div>
                );
              }
              if (isImage) {
                return (
                  <div
                    ref={imgWrapRef}
                    onPointerDown={onPanStart}
                    onPointerMove={onPanMove}
                    onPointerUp={onPanEnd}
                    onPointerCancel={onPanEnd}
                    className={cn(
                      'flex size-full touch-none select-none items-center justify-center overflow-hidden',
                      zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
                    )}
                  >
                    <img
                      ref={imgRef}
                      src={displayUrl}
                      alt={viewing.name}
                      className="max-h-[65vh] max-w-full object-contain"
                      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}
                      draggable={false}
                    />
                  </div>
                );
              }
              return (
                <div className="grid place-items-center gap-2 py-10 text-center">
                  <IconFile size={32} className="text-muted-foreground" />
                  <p className="text-sm">{viewing.name}</p>
                  <Button variant="outline" onClick={() => void handleDownload(viewing)}>Download to view</Button>
                </div>
              );
            })()}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
            <div className="flex flex-wrap items-center gap-1">
              {canReview && viewing && viewing.status !== 'approved' && (
                <Button type="button" variant="ghost" size="sm" onClick={() => approveFromModal(viewing)} className="gap-1 text-emerald-700"><IconCheck size={15} /> Approve</Button>
              )}
              {canReview && viewing && viewing.status !== 'rejected' && (
                <Button type="button" variant="ghost" size="sm" onClick={() => rejectFromModal(viewing)} className="gap-1 text-destructive"><IconX size={15} /> Reject</Button>
              )}
              {canReview && viewing && viewing.status !== 'pending' && (
                <Button type="button" variant="ghost" size="sm" onClick={() => resetFromModal(viewing)} className="gap-1"><IconRotate size={15} /> Reset</Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button type="button" variant="outline" size="icon" onClick={() => { setZoom((z) => Math.max(0.5, z - 0.25)); setPan({ x: 0, y: 0 }); }} aria-label="Zoom out"><IconZoomOut size={16} /></Button>
              <span className="min-w-[3.5rem] text-center text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <Button type="button" variant="outline" size="icon" onClick={() => { setZoom((z) => Math.min(3, z + 0.25)); setPan({ x: 0, y: 0 }); }} aria-label="Zoom in"><IconZoomIn size={16} /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</Button>
              <Button type="button" onClick={() => viewing && void handleDownload(viewing)} className="gap-1.5"><IconDownload size={15} /> Download</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
