import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import type { QueueMode } from '../shared/types';

export function QueueToggle({ mode, setMode }: { mode: QueueMode; setMode: (mode: QueueMode) => void }) {
  return (
    <ButtonGroup aria-label="Queue view">
      {(['orders', 'kanban'] as const).map((item) => (
        <Button
          key={item}
          type="button"
          variant={mode === item ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={mode === item}
          onClick={() => setMode(item)}
        >
          {item[0].toUpperCase() + item.slice(1)}
        </Button>
      ))}
    </ButtonGroup>
  );
}
