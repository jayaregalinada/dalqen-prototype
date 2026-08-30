import { IconClipboardList, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export function EmptyWorkspace({ openNewOrder, compact = false, canCreateOrder = true }: { openNewOrder: () => void; compact?: boolean; canCreateOrder?: boolean }) {
  return (
    <Empty className={compact ? 'min-h-[300px]' : 'min-h-[420px]'}>
      <EmptyHeader>
        <EmptyMedia variant="icon"><IconClipboardList aria-hidden /></EmptyMedia>
        <EmptyTitle>{canCreateOrder ? 'No job orders yet' : 'No job orders for you yet'}</EmptyTitle>
        <EmptyDescription>
          {canCreateOrder
            ? 'Create your first customer order. Its progress will track across the dashboard, queue, and production stages.'
            : 'Job orders will appear here once the workspace owner creates them and assigns the order to you.'}
        </EmptyDescription>
      </EmptyHeader>
      {canCreateOrder && <EmptyContent><Button type="button" onClick={openNewOrder}><IconPlus aria-hidden /> Create first job order</Button></EmptyContent>}
    </Empty>
  );
}
