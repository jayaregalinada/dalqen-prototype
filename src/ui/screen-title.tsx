import type { ReactNode } from "react";
export function ScreenTitle({ eyebrow, title, copy, actions }: { eyebrow?: string; title: string; copy?: string; actions?: ReactNode }) {
  return (
    <header className="mb-7 flex items-end justify-between gap-6">
      <div>
        {eyebrow && <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</span>}
        <h1 className="font-heading text-[clamp(29px,3vw,42px)] font-semibold leading-tight tracking-[-0.04em]">{title}</h1>
        {copy && <p className="mt-2 max-w-[630px] text-muted-foreground">{copy}</p>}
      </div>
      {actions && <div className="flex gap-2.5">{actions}</div>}
    </header>
  );
}