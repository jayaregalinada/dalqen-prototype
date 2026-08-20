import type { ReactNode, ComponentType } from "react";
import styles from "../prototype.module.css";
export function IconLabel({ icon: Icon, children }: { icon: ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>; children: ReactNode }) {
  return <span className={styles.iconLabel}><Icon size={16} strokeWidth={1.65} aria-hidden />{children}</span>;
}
