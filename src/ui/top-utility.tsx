import { IconBell, IconChevronDown, IconSearch } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";
import type { User } from "../shared/types";

export function TopUtility({ compact = false, user, onUserClick }: { compact?: boolean; user: User; onUserClick?: () => void }) {
  return (
    <div className={cn('flex h-[69px] items-center justify-end gap-2.5 border-b px-[30px] bg-white/80', compact && 'h-14')}>
      <label className="flex h-[42px] w-[min(420px,46vw)] items-center gap-2.5 rounded-[12px] border bg-white/75 px-3 text-muted-foreground">
        <IconSearch size={16} stroke={1.6} aria-hidden />
        <span className="sr-only">Search Dalqen</span>
        <input placeholder="Search orders, projects, customers…" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
        <kbd className="rounded-md border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">⌘ K</kbd>
      </label>
      <Button type="button" aria-label="Open notifications" variant="outline" size="icon" className="relative">
        <IconBell size={18} stroke={1.6} />
        <span className="absolute top-2 right-2 size-1.5 rounded-full bg-red-500 ring-2 ring-white" />
      </Button>
      <button type="button" className="flex min-h-[42px] items-center gap-2 rounded-[12px] px-2.5 py-1 hover:bg-muted/50" onClick={onUserClick}>
        <Avatar size="sm"><AvatarFallback className="text-xs font-bold">{user.initials}</AvatarFallback></Avatar>
        <b className="text-xs font-bold">{user.name}</b>
        <IconChevronDown size={14} aria-hidden />
      </button>
    </div>
  );
}