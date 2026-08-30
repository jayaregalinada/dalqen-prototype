import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { users, roleDefs } from '../shared/constants';
import type { Role, User } from '../shared/types';

export function UserSwitcherDialog({ user, close, select }: { user: User; close: () => void; select: (user: User) => void }) {
  const personaKeys: Role[] = ['owner', 'artist', 'sewer', 'heatpress', 'qc'];
  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-[580px]" showCloseButton>
        <DialogHeader>
          <DialogTitle>Who are you?</DialogTitle>
          <DialogDescription>Sign in as a team member to see only the job orders assigned to you. The owner sees the full workspace.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(62dvh,520px)] space-y-3.5 overflow-y-auto">
          {personaKeys.map((roleKey) => {
            const group = users.filter((candidate) => candidate.role === roleKey);
            if (group.length === 0) return null;
            return (
              <div key={roleKey} className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{roleDefs.find((role) => role.key === roleKey)?.label}</span>
                {group.map((candidate) => (
                  <Button
                    key={candidate.id}
                    type="button"
                    variant={candidate.id === user.id ? 'secondary' : 'outline'}
                    className="h-auto w-full justify-start py-3 whitespace-normal"
                    onClick={() => { select(candidate); close(); }}
                  >
                    <Avatar><AvatarFallback>{candidate.initials}</AvatarFallback></Avatar>
                    <span className="grid gap-0.5 text-left">
                      <span>{candidate.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{candidate.role === 'owner' ? 'Full workspace — all stages' : `${roleDefs.find((role) => role.key === candidate.role)?.stages.join(' → ')} stages`}</span>
                    </span>
                  </Button>
                ))}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
