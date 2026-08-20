import { Check } from "lucide-react";
import { cx } from "../shared/helpers";
import { stages } from "../shared/constants";
import styles from "../prototype.module.css";
export function StageRail({ stage, compact = false }: { stage: string; compact?: boolean }) {
  const active = Math.max(stages.indexOf(stage), 0);
  return (
    <ol className={cx(styles.stageRail, compact && styles.stageRailCompact)} aria-label={"Current stage: " + stage}>
      {stages.map((item, index) => (
        <li key={item} className={cx(index < active && styles.stageDone, index === active && styles.stageCurrent)}>
          <span>{index < active ? <Check size={13} strokeWidth={2} aria-hidden /> : index + 1}</span>
          <small>{item}</small>
        </li>
      ))}
    </ol>
  );
}
