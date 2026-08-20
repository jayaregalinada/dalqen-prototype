import { Activity, ClipboardList, LayoutDashboard, Plus, UsersRound } from "lucide-react";
import { cx } from "../shared/helpers";
import { Link } from "../ui/link";
import type { Screen, PrototypeProps } from "../shared/types";
import styles from "../prototype.module.css";
export function AppNav({ variant, screen, href, openNewOrder, canCreateOrder, styleName }: { variant: string; screen: Screen; href: PrototypeProps["href"]; openNewOrder: () => void; canCreateOrder: boolean; styleName?: string }) {
  const links: Array<{ screen: Screen; label: string; icon: typeof LayoutDashboard }> = [
    { screen: "dashboard", label: "Today", icon: LayoutDashboard },
    { screen: "orders", label: "Orders & queues", icon: ClipboardList },
  ];
  return (
    <nav className={cx(styles.appNav, styleName)} aria-label="Workspace navigation">
      {links.map(({ screen: target, label, icon: Icon }) => (
        <Link key={target} href={href(target)} aria-current={screen === target ? "page" : undefined}>
          <Icon size={18} strokeWidth={1.6} aria-hidden /><span>{label}</span>
        </Link>
      ))}
      <span className={styles.navDivider}>Workspace</span>
      <a href="#customers" onClick={(event) => event.preventDefault()}><UsersRound size={18} strokeWidth={1.6} aria-hidden /><span>Customers</span></a>
      <a href="#reports" onClick={(event) => event.preventDefault()}><Activity size={18} strokeWidth={1.6} aria-hidden /><span>Reports</span></a>
      {canCreateOrder && <button type="button" className={styles.newOrderLink} onClick={openNewOrder}><Plus size={17} strokeWidth={1.8} aria-hidden /><span>New job order</span></button>}
    </nav>
  );
}
