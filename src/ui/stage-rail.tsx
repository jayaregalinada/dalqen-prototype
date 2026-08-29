import { IconCheck } from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { stages } from "../shared/constants";

export function StageRail({ stage, compact = false }: { stage: string; compact?: boolean }) {
  const active = Math.max(stages.indexOf(stage), 0);
  return (
    <ol
      className={cn(
        'mb-3 list-none overflow-x-auto rounded-[15px] border bg-card p-4',
        'grid grid-cols-[repeat(10,minmax(62px,1fr))]',
        compact && 'py-2.5',
      )}
      aria-label={"Current stage: " + stage}
    >
      {stages.map((item, index) => (
        <li
          key={item}
          className={cn(
            'relative grid min-w-[62px] place-items-center gap-1.5 text-center text-muted-foreground',
            'after:absolute after:top-3 after:h-px after:bg-border after:content-[""] after:left-[calc(-50%+13px)] after:right-[calc(50%+13px)]',
            'first:after:hidden',
            index < active && 'text-emerald-700 after:bg-emerald-300',
            index === active && 'text-primary',
          )}
        >
          <span className={cn(
            'relative z-10 grid size-6 place-items-center rounded-full border border-input bg-card text-xs font-bold',
            index < active && 'border-transparent bg-emerald-100',
            index === active && 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(23,107,87,0.12)]',
          )}>
            {index < active ? <IconCheck size={13} stroke={2} aria-hidden /> : index + 1}
          </span>
          <small className={cn('max-w-[68px] text-xs leading-tight', index < active && 'font-bold', index === active && 'font-bold')}>{item}</small>
        </li>
      ))}
    </ol>
  );
}