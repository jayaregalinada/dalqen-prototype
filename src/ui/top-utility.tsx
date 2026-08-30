import { IconBell, IconChevronDown, IconMoon, IconSearch, IconSun } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import type { User } from '../shared/types';

export function TopUtility({ compact = false, user, onUserClick }: { compact?: boolean; user: User; onUserClick?: () => void }) {
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('dalqen-theme', dark ? 'dark' : 'light'); } catch { /* private mode */ }
  }, [dark]);
  return (
    <div className={cn('flex h-[69px] items-center justify-end gap-2.5 border-b bg-background/80 px-[30px]', compact && 'h-14')}>
      <InputGroup className="w-[min(420px,46vw)]">
        <InputGroupAddon><IconSearch aria-hidden /></InputGroupAddon>
        <InputGroupInput aria-label="Search Dalqen" placeholder="Search orders, customers…" />
        <InputGroupAddon align="inline-end"><Kbd>⌘ K</Kbd></InputGroupAddon>
      </InputGroup>
      <Toggle
        variant="outline"
        pressed={dark}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        onPressedChange={setDark}
      >
        {dark ? <IconSun aria-hidden /> : <IconMoon aria-hidden />}
      </Toggle>
      <Button type="button" aria-label="Open notifications" variant="outline" size="icon" className="relative">
        <IconBell aria-hidden />
        <span className="absolute top-2 right-2 size-1.5 rounded-full bg-red-500 ring-2 ring-background" />
      </Button>
      <Button type="button" variant="ghost" onClick={onUserClick}>
        <Avatar size="sm"><AvatarFallback>{user.initials}</AvatarFallback></Avatar>
        <span>{user.name}</span>
        <IconChevronDown aria-hidden />
      </Button>
    </div>
  );
}
