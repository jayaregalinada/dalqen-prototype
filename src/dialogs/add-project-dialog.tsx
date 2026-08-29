import { IconArrowRight, IconPlus } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type ItemDraft = { name: string; custom: Record<string, string> };

export function AddProjectDialog({
  columns,
  close,
  addProject,
}: {
  columns: string[];
  close: () => void;
  addProject: (draft: ItemDraft) => void;
}) {
  const firstCol = columns[0] ?? 'Item name';
  const [name, setName] = useState('');
  const [custom, setCustom] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addProject({ name, custom });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-[640px]" showCloseButton>
        <form onSubmit={submit}>
          <DialogHeader>
            <span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Extend job order</span>
            <DialogTitle>Add an item</DialogTitle>
            <DialogDescription>Each field is a column in this order's Line Up.</DialogDescription>
          </DialogHeader>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <Label className="col-span-1">{firstCol}<Input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Team Pro Kit" /></Label>
            {columns.slice(1).map((col) => (
              <Label key={col}>{col}<Input value={custom[col] ?? ''} onChange={(e) => setCustom((prev) => ({ ...prev, [col]: e.target.value }))} placeholder="—" /></Label>
            ))}
          </div>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit"><IconPlus size={16} /> Add item <IconArrowRight size={16} /></Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}