import { IconAlertCircle } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ReworkDialog({
  currentStage,
  close,
  confirm,
}: {
  currentStage: string;
  close: () => void;
  confirm: (targetStage: string, reason: string) => void;
}) {
  const stages = ['Layout', 'Approval', 'Document', 'Sizing', 'Printing', 'Heatpress', 'Sewing', 'QC', 'For Release', 'Completed'];
  const currentIdx = stages.indexOf(currentStage);
  const previousStages = stages.slice(0, currentIdx);

  const [targetStage, setTargetStage] = useState(previousStages[previousStages.length - 1] ?? 'Layout');
  const [reason, setReason] = useState('Print alignment needs correction before final sewing.');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    confirm(targetStage, reason);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton>
        <form onSubmit={submit}>
          <DialogHeader>
            <span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Record exception</span>
            <DialogTitle>Send order back for rework</DialogTitle>
          </DialogHeader>
          <FieldGroup className="mt-2 gap-3">
            <Field>
              <FieldLabel htmlFor="rework-stage">Return to stage</FieldLabel>
              <Select value={targetStage} onValueChange={setTargetStage}>
                <SelectTrigger id="rework-stage" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {previousStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="rework-reason">Reason</FieldLabel>
              <Textarea id="rework-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
            </Field>
          </FieldGroup>
          <DialogDescription className="mt-3 flex items-center gap-2"><IconAlertCircle size={16} aria-hidden /> The order will move back to this stage and the assigned artist will be notified.</DialogDescription>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={close}>Keep current stage</Button>
            <Button type="submit" variant="destructive">Send to {targetStage}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}