import { useEffect, useRef, useState } from 'react';
import { IconUpload, IconCheck, IconX, IconPhoto, IconFile, IconEye, IconDownload, IconZoomIn, IconZoomOut, IconLayoutGrid, IconList, IconTrash } from '@tabler/icons-react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { users } from '../shared/constants';
import { DESIGN_BUCKET, resolveDesignUrls, uploadDesignFile } from '../shared/image-storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DESIGN_URL_MAX_CHARS } from '../hooks/use-shared-demo-state';
import type { DemoOrder, DemoSizeFile } from '../hooks/use-shared-demo-state';
import type { User } from '../shared/types';
import { ConfirmActionDialog } from '../ui/confirm-action-dialog';

type Props = {
  order: DemoOrder;
  user: User;
  isOwner: boolean;
  updateOrder: (orderId: string, patch: Partial<DemoOrder>) => void;
};

type UploadProgress = { name: string; status: 'uploading' | 'done' | 'failed' };

export function SizingsTab({ order, user, isOwner, updateOrder }: Props) {
  const sizings = order.sizings ?? [];
  const itemCount = order.projects.length;
  const isAssignedArtist = order.assignedArtistId === user.id && user.role === 'artist';
  const canUpload = isAssignedArtist && order.stage === 'Sizing';
  const canDelete = isAssignedArtist && order.stage === 'Sizing';
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<DemoSizeFile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; active: boolean } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try { return localStorage.getItem('dalqen-sizings-view') === 'grid' ? 'grid' : 'list'; } catch { return 'list'; }
  });
  const [deleteTarget, setDeleteTarget] = useState<DemoSizeFile | null>(null);
  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    const paths = (order.sizings ?? []).map((d) => d.url).filter((u) => u.startsWith(DESIGN_BUCKET + '/'));
    if (paths.length === 0) { setResolvedUrls({}); return; }
    void resolveDesignUrls(paths).then(setResolvedUrls);
  }, [order.sizings]);

  useEffect(() => { if (viewing) { setZoom(1); setPan({ x: 0, y: 0 }); } }, [viewing?.id]);

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
      const maxX = Math.max(0, (img.offsetWidth * zoom - wrap.clientWidth) / 2);
      const maxY = Math.max(0, (img.offsetHeight * zoom - wrap.clientHeight) / 2);
      nx = Math.min(maxX, Math.max(-maxX, nx));
      ny = Math.min(maxY, Math.max(-maxY, ny));
    }
    setPan({ x: nx, y: ny });
  };
  const onPanEnd = () => { if (dragRef.current) dragRef.current.active = false; };

  const fileToUrl = (file: File): Promise<string> =>
    uploadDesignFile(file).then((path) => {
      if (path) return path;
      return new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result ?? ''));
        r.readAsDataURL(file);
      });
    });

  const buildSizing = (file: File, url: string): DemoSizeFile => ({
    id: crypto.randomUUID(),
    name: file.name.slice(0, 120),
    url,
    size: file.size,
    uploadedBy: user.id,
    createdAt: new Date().toISOString(),
  });

  // Sequential upload: each file lands as it succeeds; failures collect with per-file retry.
  const processFiles = async (files: File[]) => {
    setUploading(true);
    setUploadError('');
    setFailedFiles([]);
    const progress: UploadProgress[] = files.map((f) => ({ name: f.name, status: 'uploading' }));
    setUploadProgress(progress);
    let current = sizings;
    const failed: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const url = await fileToUrl(f);
        if (!url || url.length > DESIGN_URL_MAX_CHARS) throw new Error('oversized inline fallback');
        current = [...current, buildSizing(f, url)];
        updateOrder(order.id, { sizings: current });
        progress[i] = { name: f.name, status: 'done' };
      } catch (e) {
        console.error('Sizing upload failed', f.name, e);
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
    const last = sizings[sizings.length - 1];
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

  const confirmDelete = () => {
    if (!deleteTarget) return;
    updateOrder(order.id, { sizings: sizings.filter((s) => s.id !== deleteTarget.id) });
    setDeleteTarget(null);
    if (viewing?.id === deleteTarget.id) setViewing(null);
  };

  const handleDownload = async (s: DemoSizeFile) => {
    const url = getDisplayUrl(s);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = s.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(url, '_blank', 'noopener');
    }
  };
  // Download the whole sizing set as one zip. Client-side (throwaway prototype):
  // fetch each file, buffer in JSZip, save. 150MB total guard keeps the tab alive.
  const downloadAllZip = async () => {
    if (zipping || sizings.length === 0) return;
    setZipping(true);
    setZipError('');
    const MAX_TOTAL = 150 * 1024 * 1024;
    try {
      const zip = new JSZip();
      const used = new Set<string>();
      let total = 0;
      const failed: string[] = [];
      for (const s of sizings) {
        const base = s.name.replace(/\.[^.]+$/, '');
        const ext = s.name.includes('.') ? s.name.slice(s.name.lastIndexOf('.')) : '';
        let name = s.name;
        let n = 2;
        while (used.has(name)) { name = `${base}-${n}${ext}`; n++; }
        used.add(name);
        try {
          const res = await fetch(getDisplayUrl(s));
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          total += blob.size;
          if (total > MAX_TOTAL) { failed.push(s.name); continue; }
          zip.file(name, blob);
        } catch {
          failed.push(s.name);
        }
      }
      if (Object.keys(zip.files).length === 0) throw new Error('no files downloaded');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.ref}-sizings.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (failed.length > 0) setZipError(`${failed.length} file${failed.length === 1 ? '' : 's'} could not be downloaded: ${failed.join(', ')}`);
    } catch (e) {
      console.error('Zip download failed', e);
      setZipError('Could not create the zip — try again or download files individually.');
    } finally {
      setZipping(false);
    }
  };

  const getDisplayUrl = (s: DemoSizeFile) => resolvedUrls[s.url] ?? s.url;
  const viewerName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const isImageFile = (s: DemoSizeFile) => s.url.startsWith('data:image') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(s.name);
  const isPdf = (s: DemoSizeFile) => s.name.toLowerCase().endsWith('.pdf') || s.url.includes('.pdf');

  const renderThumb = (s: DemoSizeFile, displayUrl: string, sizeClass: string) => (
    <button
      type="button"
      onClick={() => setViewing(s)}
      aria-label={`View ${s.name}`}
      className={cn('relative block overflow-hidden rounded-lg border-2 bg-muted p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring', sizeClass)}
    >
      {isImageFile(s)
        ? <img src={displayUrl} alt={s.name} className="size-full object-cover" draggable={false} />
        : <div className="grid size-full place-items-center text-muted-foreground"><IconFile size={20} /></div>}
    </button>
  );

  const renderMeta = (s: DemoSizeFile) => (
    <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()} · by {viewerName(s.uploadedBy)}</p>
  );

  const renderActions = (s: DemoSizeFile) => (
    <div className="flex flex-wrap items-center gap-1">
      <Button type="button" variant="ghost" size="sm" onClick={() => setViewing(s)} className="gap-1.5"><IconEye size={14} /> View</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => void handleDownload(s)} className="gap-1.5"><IconDownload size={14} /> Download</Button>
      {canDelete && s.uploadedBy === user.id && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteTarget(s)} className="gap-1 text-destructive" aria-label={`Delete ${s.name}`}><IconTrash size={14} /> Delete</Button>
      )}
    </div>
  );

  const renderSizing = (s: DemoSizeFile) => {
    const displayUrl = getDisplayUrl(s);
    if (viewMode === 'grid') {
      return (
        <div key={s.id} className="rounded-xl border bg-card p-2">
          <div className="relative">{renderThumb(s, displayUrl, 'aspect-video w-full')}</div>
          <p className="mt-2 truncate text-sm font-bold">{s.name}</p>
          {renderMeta(s)}
          <div className="mt-2">{renderActions(s)}</div>
        </div>
      );
    }
    return (
      <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-2.5">
        <div className="shrink-0">{renderThumb(s, displayUrl, 'size-14')}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{s.name}</p>
          {renderMeta(s)}
        </div>
        {renderActions(s)}
        {isPdf(s) && <span className="hidden">{displayUrl}</span>}
      </div>
    );
  };

  const sizingComplete = itemCount > 0 && sizings.length >= itemCount;

  return (
    <>
      <Card className="mb-0">
        <CardHeader className="border-b">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-[17px] tracking-[-0.02em]">
                Sizing
                {sizings.length > 0 && <Badge variant="secondary">{sizings.length} {sizings.length === 1 ? 'file' : 'files'}</Badge>}
                {itemCount > 0 && <Badge variant={sizingComplete ? 'default' : 'outline'}>{Math.min(sizings.length, itemCount)} of {itemCount} items sized</Badge>}
              </CardTitle>
              <CardDescription className="text-xs">
                {canUpload
                  ? itemCount > 0
                    ? 'Upload the sized output — one file per Line Up item, matching its instructions. Advance unlocks once every item is covered.'
                    : 'This order has no Line Up items — add items in the Line Up tab before sizing.'
                  : order.stage !== 'Sizing' ? 'Uploads are closed in this stage.' : !isAssignedArtist ? 'Only the assigned artist can upload.' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => void downloadAllZip()} disabled={sizings.length === 0 || zipping} className="gap-1.5" title={sizings.length === 0 ? 'No sizing files to download' : undefined}>
                <IconDownload size={14} /> {zipping ? 'Preparing zip…' : `Download all (${sizings.length})`}
              </Button>
              <Button type="button" variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => { setViewMode('list'); try { localStorage.setItem('dalqen-sizings-view', 'list'); } catch { /* ignore */ } }} aria-label="List view" title="List view"><IconList size={16} /></Button>
              <Button type="button" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => { setViewMode('grid'); try { localStorage.setItem('dalqen-sizings-view', 'grid'); } catch { /* ignore */ } }} aria-label="Grid view" title="Grid view"><IconLayoutGrid size={16} /></Button>
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
              <p className="text-sm font-bold">{uploading ? 'Uploading…' : isDragOver ? 'Drop sizing here' : 'Drag & drop sizing here'}</p>
              <p className="text-xs text-muted-foreground">or click to browse · PNG, JPG, PDF · up to 10 at once</p>
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
          {zipError && !uploading && <p className="text-xs font-medium text-destructive" role="alert">{zipError}</p>}
          {sizings.length === 0 ? (
            canUpload ? null : (
              <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center">
                <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted"><IconPhoto size={18} className="text-muted-foreground" /></div>
                <p className="mt-3 text-sm font-bold">No sizing yet</p>
                <p className="mt-1 text-xs text-muted-foreground">The assigned artist will upload the sized output here.</p>
              </div>
            )
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...sizings].reverse().map((s) => renderSizing(s))}
            </div>
          ) : (
            <div className="grid gap-2.5">
              {[...sizings].reverse().map((s) => renderSizing(s))}
            </div>
          )}
          {itemCount > 0 && sizings.length > 0 && !sizingComplete && (
            <p className="text-xs text-muted-foreground">{itemCount - sizings.length} more {itemCount - sizings.length === 1 ? 'item' : 'items'} to size — the order can advance once every Line Up item is covered.</p>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete sizing file?"
        description={`"${deleteTarget?.name ?? ''}" will be removed from this order's sizing.`}
        confirmLabel="Delete"
        variant="destructive"
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={confirmDelete}
      />

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
              if (isPdf(viewing)) {
                return (
                  <div className="h-full w-full overflow-auto">
                    <iframe src={displayUrl} title={viewing.name} className="h-[65vh] w-full rounded border bg-white" />
                  </div>
                );
              }
              if (isImageFile(viewing)) {
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
              {canDelete && viewing && viewing.uploadedBy === user.id && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setDeleteTarget(viewing); setViewing(null); }} className="gap-1 text-destructive"><IconTrash size={15} /> Delete</Button>
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
