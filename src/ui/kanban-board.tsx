import { useMemo } from 'react';
import { Link } from '../ui/link';
import { Status } from '../ui/status';
import { Card, CardContent } from '@/components/ui/card';
import type { PrototypeProps } from '../shared/types';

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
    return <p className="py-10 text-center text-sm text-muted-foreground">No projects yet. Create a job order to get started.</p>;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 py-1">
      {activeStages.map((stage) => {
        const cards = columns[stage];
        if (!cards || cards.length === 0) return null;
        return (
          <div key={stage} className="flex flex-col gap-2">
            <header className="flex items-center justify-between rounded-lg bg-accent p-2 text-xs font-bold uppercase tracking-[0.04em]">
              <span>{stage}</span>
              <small className="grid size-[22px] place-items-center rounded-full bg-border font-mono">{cards.length}</small>
            </header>
            <div className="flex flex-col gap-1.5">
              {cards.map((card) => (
                <Link key={card.order + '-' + card.project} href={props.projectHref(card.order, card.projectName)}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-[13px] font-semibold">{card.project}</strong>
                        <Status tone={
                          card.flag === 'Rework' ? 'danger' :
                          card.flag === 'Unassigned' ? 'warning' :
                          'success'
                        }>{card.flag}</Status>
                      </div>
                      <div className="flex gap-2.5 text-xs text-muted-foreground">
                        <span className="font-mono">{card.order}</span>
                        <span>{card.owner}</span>
                        <span>{card.due}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}