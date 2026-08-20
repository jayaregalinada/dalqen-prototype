import type { ReactNode } from "react";
import styles from "../prototype.module.css";
export function ScreenTitle({ eyebrow, title, copy, actions }: { eyebrow?: string; title: string; copy?: string; actions?: ReactNode }) {
  return (
    <header className={styles.screenTitle}>
      <div>{eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}<h1>{title}</h1>{copy && <p>{copy}</p>}</div>
      {actions && <div className={styles.titleActions}>{actions}</div>}
    </header>
  );
}
