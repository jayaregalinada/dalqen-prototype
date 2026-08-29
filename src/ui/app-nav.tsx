import { IconActivity, IconClipboardList, IconLayoutDashboard, IconPlus, IconUsersGroup } from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { Link } from "../ui/link";
import type { Screen, PrototypeProps } from "../shared/types";

export function AppNav({ screen, href, openNewOrder, canCreateOrder, styleName }: { screen: Screen; href: PrototypeProps["href"]; openNewOrder: () => void; canCreateOrder: boolean; styleName?: string }) {
  const links: Array<{ screen: Screen; label: string; icon: typeof IconLayoutDashboard }> = [
    { screen: "dashboard", label: "Today", icon: IconLayoutDashboard },
    { screen: "orders", label: "Orders & queues", icon: IconClipboardList },
  ];
  return (
    <nav className={cn('grid gap-1', styleName)} aria-label="Workspace navigation">
      {links.map(({ screen: target, label, icon: Icon }) => (
        <Link
          key={target}
          href={href(target)}
          aria-current={screen === target ? "page" : undefined}
          className={cn(
            'flex min-h-[44px] items-center gap-3 rounded-[11px] px-3.5 font-semibold text-muted-foreground',
            'hover:bg-primary/5 hover:text-foreground',
            screen === target && 'bg-accent text-accent-foreground',
          )}
        >
          <Icon size={18} stroke={1.6} aria-hidden /><span>{label}</span>
        </Link>
      ))}
      <span className="mx-3.5 mt-5 mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Workspace</span>
      <a href="#customers" onClick={(event) => event.preventDefault()} className="flex min-h-[44px] items-center gap-3 rounded-[11px] px-3.5 font-semibold text-muted-foreground hover:bg-primary/5 hover:text-foreground"><IconUsersGroup size={18} stroke={1.6} aria-hidden /><span>Customers</span></a>
      <a href="#reports" onClick={(event) => event.preventDefault()} className="flex min-h-[44px] items-center gap-3 rounded-[11px] px-3.5 font-semibold text-muted-foreground hover:bg-primary/5 hover:text-foreground"><IconActivity size={18} stroke={1.6} aria-hidden /><span>Reports</span></a>
      {canCreateOrder && (
        <button type="button" className="mt-3 flex min-h-[44px] items-center justify-center gap-3 rounded-[11px] bg-primary px-3.5 font-bold text-primary-foreground hover:bg-primary/90" onClick={openNewOrder}>
          <IconPlus size={17} stroke={1.8} aria-hidden /><span>New job order</span>
        </button>
      )}
    </nav>
  );
}