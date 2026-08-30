import { IconBold, IconPhoto as ImageIcon, IconItalic, IconList, IconListNumbers, IconUnderline } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

import { BUCKET, canonicalizeStorageImages, resolveStorageImages, uploadImage } from '../shared/image-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ponytail: TipTap StarterKit (v3) bundles underline; ProseMirror owns the editable DOM, so
// React re-renders can never clobber editor content (the bug that wiped dialog overviews).

const PLACEHOLDER = 'Describe the job, paste or drop reference images, add instructions…';

/** Rewrite every canonical "overview-images/…" img src in the doc to a signed URL for display. */
async function refreshEditorImages(editor: Editor): Promise<void> {
  const paths = new Set<string>();
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image' && typeof node.attrs.src === 'string' && node.attrs.src.startsWith(`${BUCKET}/`)) {
      paths.add(node.attrs.src);
    }
    return true;
  });
  if (paths.size === 0) return;
  const resolved = await resolveStorageImages(
    [...paths].map((p) => `<img src="${p}">`).join(''),
  );
  editor.commands.command(({ tr }) => {
    tr.doc.descendants((node, pos) => {
      const src = node.type.name === 'image' ? node.attrs.src : null;
      if (typeof src === 'string' && src.startsWith(`${BUCKET}/`)) {
        const match = resolved.match(new RegExp(`src="([^"]*${src.split('/')[1]}[^"]*)"`) ?? undefined);
        const url = match?.[1];
        if (url) tr.setNodeAttribute(pos, 'src', url);
      }
      return true;
    });
    return true;
  });
}

type ToolbarAction = { icon: ReactNode; label: string; active: boolean; run: () => void };

export function OverviewEditor({
  initialHtml,
  onChange,
  header,
  boxed = false,
  className,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  /** Optional slot to render the toolbar elsewhere (e.g. in the row with Save/Cancel). */
  header?: (toolbar: ReactNode) => ReactNode;
  /** Give the editor a visible bordered box (dialogs) instead of the seamless read-mode look. */
  boxed?: boolean;
  className?: string;
}) {
  const editorRef = useRef<Editor | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emit = useCallback(
    (html: string) => onChange(canonicalizeStorageImages(html)),
    [onChange],
  );

  const insertUpload = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) return;
    const path = await uploadImage(file);
    if (!path) {
      setError('Image upload failed — check your connection and try again.');
      return;
    }
    const editor = editorRef.current;
    if (!editor) return;
    editor.chain().focus().setImage({ src: path }).run();
    await refreshEditorImages(editor);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: PLACEHOLDER }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: { class: cn('tiptap-content min-h-[110px] outline-none'), 'data-placeholder': PLACEHOLDER },
      handlePaste: (_view, event) => {
        const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (!file) return false;
        void insertUpload(file);
        return true;
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (!file) return false;
        event.preventDefault();
        void insertUpload(file);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => emit(e.getHTML()),
    immediatelyRender: false,
  });

  editorRef.current = editor;

  // sign any pre-existing canonical image paths once the editor is up
  useEffect(() => {
    if (editor) void refreshEditorImages(editor);
  }, [editor]); // run once per editor instance; onChange supplies save-ready HTML from here on

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    setDragOver(false);
    if (e.defaultPrevented) return; // already handled inside the editor
    e.preventDefault();
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));
    if (file) void insertUpload(file);
  };

  if (!editor) return <Skeleton className={cn('h-[136px]', className)} />;

  const actions: ToolbarAction[] = [
    { icon: <IconBold size={14} />, label: 'Bold', active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { icon: <IconItalic size={14} />, label: 'Italic', active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { icon: <IconUnderline size={14} />, label: 'Underline', active: editor.isActive('underline'), run: () => editor.chain().focus().toggleUnderline().run() },
    { icon: <IconList size={14} />, label: 'Bulleted list', active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { icon: <IconListNumbers size={14} />, label: 'Numbered list', active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: <ImageIcon size={14} />, label: 'Insert image', active: false, run: () => fileRef.current?.click() },
  ];

  const toolbar = (
    <ButtonGroup aria-label="Text formatting">
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant={action.active ? 'secondary' : 'ghost'}
          size="icon"
          title={action.label}
          aria-label={action.label}
          aria-pressed={action.active}
          onMouseDown={(event) => event.preventDefault()}
          onClick={action.run}
        >
          {action.icon}
        </Button>
      ))}
      <Input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void insertUpload(file); event.target.value = ''; }}
      />
    </ButtonGroup>
  );

  return (
    <>
      {header ? header(toolbar) : toolbar}
      <div
        className={cn(
          'rounded-[10px] text-xs text-muted-foreground outline-none [&_.tiptap-content]:[&_img]:max-w-full focus-within:ring-2 focus-within:ring-ring/40',
          'transition-shadow',
          boxed && 'border border-input bg-card p-3 focus-within:ring-2',
          dragOver && 'bg-primary/5 ring-2 ring-dashed ring-primary',
          className,
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
        onDrop={onDrop}
      >
        <EditorContent editor={editor} />
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    </>
  );
}