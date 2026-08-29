import type { ReactNode, ComponentType } from "react";
export function IconLabel({ icon: Icon, children }: { icon: ComponentType<{ size?: number; stroke?: number; "aria-hidden"?: boolean }>; children: ReactNode }) {
  return <span className="inline-flex items-center gap-2"><Icon size={16} stroke={1.65} aria-hidden />{children}</span>;
}