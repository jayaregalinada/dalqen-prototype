import { IconRefresh } from '@tabler/icons-react';
import type { SyncStatus } from "../shared/types";
import { cn } from '@/lib/utils';

export function SharedDemoControls({ status, canReset = true, onReset }: { status: SyncStatus; canReset?: boolean; onReset: () => void }) {
  const labels: Record<SyncStatus, string> = { connecting: "Connecting…", live: "Shared demo · Live", saving: "Saving…", error: "Sync unavailable", unconfigured: "Local preview" };
  return (
    <div
      className="fixed bottom-[max(22px,env(safe-area-inset-bottom))] right-5 z-30 flex min-h-[42px] items-center gap-1.5 rounded-[13px] border bg-white/94 p-1.5 text-muted-foreground shadow-[0_12px_34px_rgba(18,31,27,0.14)] backdrop-blur-md"
      role="status"
      title={status === "unconfigured" ? "Add Supabase environment variables to enable shared persistence." : undefined}
    >
      <span className={cn("inline-flex items-center gap-2 px-1.5 text-xs font-bold whitespace-nowrap", status === 'error' && 'text-red-600')}>
        <i className={cn(
          'size-1.5 rounded-full bg-muted-foreground/60 shadow-[0_0_0_4px_rgba(90,104,99,0.09)]',
          status === 'live' && 'bg-emerald-600 shadow-[0_0_0_4px_rgba(21,148,98,0.11)]',
          (status === 'saving' || status === 'connecting') && 'bg-amber-600 shadow-[0_0_0_4px_rgba(202,124,23,0.11)] animate-pulse',
          status === 'error' && 'bg-red-500 shadow-[0_0_0_4px_rgba(200,72,63,0.11)]',
        )} />
        {labels[status]}
      </span>
      {canReset && (
        <button type="button" onClick={onReset} aria-label="Reset shared demo data" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-xs font-bold text-foreground hover:bg-muted/80">
          <IconRefresh size={14} stroke={1.7} aria-hidden /> Reset
        </button>
      )}
    </div>
  );
}