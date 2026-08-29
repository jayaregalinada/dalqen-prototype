import { IconAlertCircle } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  const stages = ['Layout', 'Approval', 'Working Doc', 'Sizing', 'Printing', 'Heatpress', 'Sewing', 'QC', 'For Release', 'Completed'];
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
            <DialogTitle>Send project back for rework</DialogTitle>
          </DialogHeader>
          <div className="mt-2 grid gap-3">
            <Label>Return to stage
              <Select value={targetStage} onValueChange={(v) => setTargetStage(v ?? '')}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {previousStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
            <Label>Reason
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1.5" />
            </Label>
          </div>
          <DialogDescription className="mt-3 flex items-center gap-2"><IconAlertCircle size={16} aria-hidden /> The assigned department and project followers will be notified.</DialogDescription>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={close}>Keep current stage</Button>
            <Button type="submit" variant="destructive">Send to {targetStage}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}