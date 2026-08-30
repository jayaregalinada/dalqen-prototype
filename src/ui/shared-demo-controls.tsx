import { IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '../shared/types';

export function SharedDemoControls({ status, canReset = true, onReset }: { status: SyncStatus; canReset?: boolean; onReset: () => void }) {
  const labels: Record<SyncStatus, string> = { connecting: 'Connecting…', live: 'Shared demo · Live', saving: 'Saving…', error: 'Sync unavailable', unconfigured: 'Local preview' };
  return (
    <Card
      size="sm"
      className="fixed right-5 bottom-[max(22px,env(safe-area-inset-bottom))] z-30 w-fit"
      role="status"
      title={status === 'unconfigured' ? 'Add Supabase environment variables to enable shared persistence.' : undefined}
    >
      <CardContent className="flex items-center gap-2">
        <span className={cn('inline-flex items-center gap-2 text-xs font-bold whitespace-nowrap', status === 'error' && 'text-red-600')}>
          <i className={cn(
            'size-1.5 rounded-full bg-muted-foreground/60',
            status === 'live' && 'bg-emerald-600',
            (status === 'saving' || status === 'connecting') && 'animate-pulse bg-amber-600',
            status === 'error' && 'bg-red-500',
          )} />
          {labels[status]}
        </span>
        {canReset && <Button type="button" variant="outline" size="sm" onClick={onReset} aria-label="Reset shared demo data"><IconRefresh aria-hidden /> Reset</Button>}
      </CardContent>
    </Card>
  );
}
