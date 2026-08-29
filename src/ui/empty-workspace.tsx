import { IconClipboardList, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyWorkspace({ openNewOrder, compact = false, canCreateOrder = true }: { openNewOrder: () => void; compact?: boolean; canCreateOrder?: boolean }) {
  return (
    <section className={cn(
      'grid min-h-[420px] place-items-center content-center rounded-[20px] border border-dashed bg-card/95 p-12 text-center',
      compact && 'min-h-[300px]',
    )}>
      <span className="mb-4 grid size-14 place-items-center rounded-[17px] bg-primary/10 text-primary"><IconClipboardList size={25} stroke={1.4} aria-hidden /></span>
      <span className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{canCreateOrder ? "Your workspace is ready" : 'Nothing assigned to you'}</span>
      <h2 className="font-heading text-[clamp(25px,3vw,38px)] font-semibold tracking-[-0.04em]">{canCreateOrder ? "No job orders yet." : 'No job orders for you yet.'}</h2>
      <p className="mx-auto mt-2.5 mb-5 max-w-[520px] leading-relaxed text-muted-foreground">{canCreateOrder ? "Create your first customer order. Its projects will automatically appear across the dashboard, queues, and production stages." : 'Job orders will appear here once the workspace owner creates them and assigns a project to you.'}</p>
      {canCreateOrder ? <Button type='button' onClick={openNewOrder}><IconPlus size={16} /> Create first job order</Button> : null}
    </section>
  );
}