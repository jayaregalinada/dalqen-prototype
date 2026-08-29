import { IconArrowRight, IconUserCircle } from '@tabler/icons-react';
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { users, roleDefs } from "../shared/constants";
import type { Role, DemoProject } from "../shared/types";

export function AssignArtistDialog({ project, close, assign }: { project: DemoProject; close: () => void; assign: (assignee: string, department: string) => void }) {
  const assignable = users.filter(u => u.role !== "owner");
  const [userId, setUserId] = useState(() => users.find(u => u.name === project.assignee && u.role !== "owner")?.id ?? assignable[0].id);
  const selected = users.find(u => u.id === userId)!;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); assign(selected.name, selected.dept ?? "Layout"); };
  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton>
        <form onSubmit={submit}>
          <DialogHeader>
            <span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Project ownership</span>
            <DialogTitle>Assign a team member</DialogTitle>
          </DialogHeader>
          <Label className="mt-2 block">Team member
            <Select value={userId} onValueChange={(v) => setUserId(v ?? '')}>
              <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["artist", "sewer", "heatpress", "qc"] as Role[]).map((roleKey) => {
                  const group = assignable.filter(u => u.role === roleKey);
                  if (group.length === 0) return null;
                  return (
                    <SelectGroup key={roleKey}>
                      <SelectLabel>{roleDefs.find(r => r.key === roleKey)?.label}</SelectLabel>
                      {group.map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.dept}</SelectItem>)}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </Label>
          <DialogDescription className="mt-3 flex items-center gap-2"><IconUserCircle size={16} aria-hidden /> Only this team member and the workspace owner will see this project in their queues.</DialogDescription>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit">Assign team member <IconArrowRight size={16} /></Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}