import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { users, roleDefs } from "../shared/constants";
import type { Role, User } from "../shared/types";

export function UserSwitcherDialog({ user, close, select }: { user: User; close: () => void; select: (user: User) => void }) {
  const personaKeys: Role[] = ["owner", "artist", "sewer", "heatpress", "qc"];
  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-[580px]" showCloseButton>
        <DialogHeader>
          <span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Switch user</span>
          <DialogTitle>Who are you?</DialogTitle>
          <DialogDescription>Sign in as a team member to see only the job orders and projects assigned to you. The owner sees the full workspace.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(62dvh,520px)] space-y-3.5 overflow-y-auto pr-0.5">
          {personaKeys.map((roleKey) => {
            const group = users.filter(u => u.role === roleKey);
            if (group.length === 0) return null;
            return (
              <div key={roleKey} className="grid gap-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{roleDefs.find(r => r.key === roleKey)?.label}</span>
                {group.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[14px] border bg-muted/40 p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted',
                      candidate.id === user.id && 'border-primary bg-primary/5',
                    )}
                    onClick={() => { select(candidate); close(); }}
                  >
                    <span className="grid size-[42px] shrink-0 place-items-center rounded-[12px] bg-muted text-sm font-extrabold text-primary">{candidate.initials}</span>
                    <span className="grid gap-0.5">
                      <b className="text-xs font-bold">{candidate.name}</b>
                      <small className="text-xs text-muted-foreground">{candidate.role === "owner" ? "Full workspace — all stages" : roleDefs.find(r => r.key === candidate.role)?.stages.join(" → ") + " stages"}</small>
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}