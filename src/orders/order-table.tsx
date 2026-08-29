import { IconArrowRight } from '@tabler/icons-react';
import { navigateTo } from '../shared/helpers';
import { Link } from '../ui/link';
import { Status } from '../ui/status';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PrototypeProps } from '../shared/types';
import { cn } from '@/lib/utils';

function OpenLink({ href, label }: { href: string; label: string }) {
  return (
    <TableCell className="text-right">
      <Link href={href} aria-label={'Open ' + label} onClick={(e) => e.stopPropagation()} className="inline-grid size-8 place-items-center rounded-lg hover:bg-muted">
        <IconArrowRight size={16} />
      </Link>
    </TableCell>
  );
}

export function OrderTable({ props }: { props: PrototypeProps }) {
  if (props.queueMode === 'projects') {
    return (
      <div className="overflow-auto rounded-[15px] border bg-card shadow-[0_10px_35px_rgba(31,48,42,0.045)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[230px] uppercase tracking-wider text-xs">Project</TableHead><TableHead className="uppercase tracking-wider text-xs">Order</TableHead><TableHead className="uppercase tracking-wider text-xs">Stage</TableHead><TableHead className="uppercase tracking-wider text-xs">Owner / dept.</TableHead><TableHead className="uppercase tracking-wider text-xs">Due</TableHead><TableHead className="uppercase tracking-wider text-xs">Attention</TableHead><TableHead className="text-right uppercase tracking-wider text-xs"><span className="sr-only">Open</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.projectRows.map((row) => (
              <TableRow key={row.order + '-' + row.project} onClick={() => navigateTo(props.projectHref(row.order, row.projectName))} className="cursor-pointer">
                <TableCell className="min-w-[230px] font-medium">{row.project}</TableCell>
                <TableCell className="font-mono font-normal text-muted-foreground">{row.order}</TableCell>
                <TableCell><Status tone={row.stage === 'QC' ? 'danger' : row.stage === 'Approval' ? 'warning' : 'info'}>{row.stage}</Status></TableCell>
                <TableCell>
                  <span className="block text-foreground">{row.owner}</span>
                  <small className="block text-muted-foreground">{row.dept}</small>
                </TableCell>
                <TableCell>{row.due}</TableCell>
                <TableCell><Status tone={row.flag === 'On track' ? 'success' : row.flag === 'Unassigned' ? 'warning' : 'danger'}>{row.flag}</Status></TableCell>
                <OpenLink href={props.projectHref(row.order, row.projectName)} label={row.project} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  return (
    <div className="overflow-auto rounded-[15px] border bg-card shadow-[0_10px_35px_rgba(31,48,42,0.045)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="uppercase tracking-wider text-xs">Reference / job</TableHead><TableHead className="uppercase tracking-wider text-xs">Customer</TableHead><TableHead className="uppercase tracking-wider text-xs">Due</TableHead><TableHead className="uppercase tracking-wider text-xs">Progress</TableHead><TableHead className="uppercase tracking-wider text-xs">Status</TableHead><TableHead className="text-right uppercase tracking-wider text-xs"><span className="sr-only">Open</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.orderRows.map((row) => (
            <TableRow key={row.ref} onClick={() => navigateTo(props.orderHref(row.ref))} className="cursor-pointer">
              <TableCell className="min-w-[230px]">
                <small className="block font-mono text-xs text-muted-foreground">{row.ref}</small>
                <strong className="block text-[13px] font-semibold text-foreground">{row.title}</strong>
                {row.priority === 'Urgent' && <Status tone='danger'>Urgent</Status>}
              </TableCell>
              <TableCell>{row.customer}</TableCell>
              <TableCell>{row.due}</TableCell>
              <TableCell>
                <b className="font-semibold">{row.progress}</b>
                <small className="block text-muted-foreground">released</small>
              </TableCell>
              <TableCell><Status tone={row.status === 'QC issue' ? 'danger' : row.status === 'Waiting approval' ? 'warning' : row.status === 'Ready for release' || row.status === 'Released' ? 'success' : 'info'}>{row.status}</Status></TableCell>
              <OpenLink href={props.orderHref(row.ref)} label={row.ref} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}