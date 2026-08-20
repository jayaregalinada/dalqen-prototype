import { useMemo } from 'react';
import { Link } from '../ui/link';
import { Status } from '../ui/status';
import type { PrototypeProps, DemoProject } from '../shared/types';
import styles from '../prototype.module.css';

const activeStages = ['Layout', 'Approval', 'Working Doc', 'Sizing', 'Printing', 'Heatpress', 'Sewing', 'QC', 'For Release'];

export function KanbanBoard({ props }: { props: PrototypeProps }) {
  const projects = props.projectRows;

  const columns = useMemo(() => {
    const map: Record<string, typeof projects> = {};
    for (const stage of activeStages) {
      map[stage] = projects.filter((p) => p.stage === stage);
    }
    return map;
  }, [projects]);

  if (projects.length === 0) {
    return <div className={styles.standardScreen}><p className={styles.emptyKanban}>No projects yet. Create a job order to get started.</p></div>;
  }

  return (
    <div className={styles.kanbanBoard}>
      {activeStages.map((stage) => {
        const cards = columns[stage];
        if (!cards || cards.length === 0) return null;
        return (
          <div key={stage} className={styles.kanbanColumn}>
            <header className={styles.kanbanColumnHeader}>
              <span>{stage}</span>
              <small>{cards.length}</small>
            </header>
            <div className={styles.kanbanCards}>
              {cards.map((card) => (
                <Link key={card.order + '-' + card.project} href={props.href('project')} className={styles.kanbanCard}>
                  <div className={styles.kanbanCardHead}>
                    <strong>{card.project}</strong>
                    <Status tone={
                      card.flag === 'Rework' ? 'danger' :
                      card.flag === 'Unassigned' ? 'warning' :
                      'success'
                    }>{card.flag}</Status>
                  </div>
                  <div className={styles.kanbanCardMeta}>
                    <span className={styles.mono}>{card.order}</span>
                    <span>{card.owner}</span>
                    <span>{card.due}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}