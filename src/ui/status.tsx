import type { ReactNode } from 'react';
import { cx } from '../shared/helpers';
import styles from '../prototype.module.css';
export function Status({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={cx(styles.status, styles['status_' + tone])}>{children}</span>;
}
