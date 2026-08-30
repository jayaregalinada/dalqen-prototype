import { IconArrowRight, IconPlus } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

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
          <FieldGroup className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <Field>
              <FieldLabel htmlFor="line-up-item-name">{firstCol}</FieldLabel>
              <Input id="line-up-item-name" required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Team Pro Kit" />
            </Field>
            {columns.slice(1).map((column, index) => (
              <Field key={column}>
                <FieldLabel htmlFor={`line-up-field-${index}`}>{column}</FieldLabel>
                <Input id={`line-up-field-${index}`} value={custom[column] ?? ''} onChange={(event) => setCustom((prev) => ({ ...prev, [column]: event.target.value }))} placeholder="—" />
              </Field>
            ))}
          </FieldGroup>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit"><IconPlus size={16} /> Add item <IconArrowRight size={16} /></Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}