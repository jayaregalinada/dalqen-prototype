import type { QueueMode } from '../shared/types';
import { cn } from '@/lib/utils';

export function QueueToggle({ mode, setMode }: { mode: QueueMode; setMode: (mode: QueueMode) => void }) {
  return (
    <div className="inline-flex gap-0.5 rounded-xl bg-foreground/5 p-1" aria-label="Queue view">
      {(['orders', 'projects', 'kanban'] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
          className={cn(
            'min-h-9 rounded-lg px-4 text-sm font-bold text-muted-foreground transition-colors',
            mode === m && 'bg-background text-foreground shadow-sm',
          )}
        >
          {m[0].toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  );
}