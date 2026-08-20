import { Bell, ChevronDown, Search } from "lucide-react";
import { cx } from "../shared/helpers";
import type { User } from "../shared/types";
import styles from "../prototype.module.css";
export function TopUtility({ compact = false, user, onUserClick }: { compact?: boolean; user: User; onUserClick?: () => void }) {
  return (
    <div className={cx(styles.utility, compact && styles.utilityCompact)}>
      <label className={styles.searchBox}>
        <Search size={16} strokeWidth={1.6} aria-hidden />
        <span className={styles.srOnly}>Search Dalqen</span>
        <input placeholder="Search orders, projects, customers…" />
        <kbd>⌘ K</kbd>
      </label>
      <button type="button" aria-label="Open notifications" className={styles.iconButton}><Bell size={18} strokeWidth={1.6} /><span className={styles.notificationDot} /></button>
      <button type="button" className={styles.profileButton} onClick={onUserClick}>
        <span>{user.initials}</span><b>{user.name}</b><ChevronDown size={14} aria-hidden /></button>
    </div>
  );
}
