import { IconActivity, IconClipboardList, IconLayoutDashboard, IconPlus, IconUsersGroup } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '../ui/link';
import type { Screen, PrototypeProps } from '../shared/types';

export function AppNav({ screen, href, openNewOrder, canCreateOrder, styleName }: { screen: Screen; href: PrototypeProps['href']; openNewOrder: () => void; canCreateOrder: boolean; styleName?: string }) {
  const links: Array<{ screen: Screen; label: string; icon: typeof IconLayoutDashboard }> = [
    { screen: 'dashboard', label: 'Today', icon: IconLayoutDashboard },
    { screen: 'orders', label: 'Orders & queues', icon: IconClipboardList },
  ];
  return (
    <nav className={cn('grid gap-1', styleName)} aria-label="Workspace navigation">
      {links.map(({ screen: target, label, icon: Icon }) => (
        <Button key={target} asChild variant={screen === target ? 'secondary' : 'ghost'} className="w-full justify-start">
          <Link href={href(target)} aria-current={screen === target ? 'page' : undefined}>
            <Icon aria-hidden /><span>{label}</span>
          </Link>
        </Button>
      ))}
      <span className="mx-3.5 mt-5 mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Workspace</span>
      <Button asChild variant="ghost" className="w-full justify-start">
        <a href="#customers" onClick={(event) => event.preventDefault()}><IconUsersGroup aria-hidden /><span>Customers</span></a>
      </Button>
      <Button asChild variant="ghost" className="w-full justify-start">
        <a href="#reports" onClick={(event) => event.preventDefault()}><IconActivity aria-hidden /><span>Reports</span></a>
      </Button>
      {canCreateOrder && (
        <Button type="button" className="mt-3 w-full" onClick={openNewOrder}>
          <IconPlus aria-hidden /><span>New job order</span>
        </Button>
      )}
    </nav>
  );
}
