import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

const TONE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  neutral: 'outline',
  info: 'secondary',
  warning: 'destructive',
  danger: 'destructive',
  success: 'secondary',
};

export function Status({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <Badge variant={TONE_VARIANT[tone] ?? 'outline'}>{children}</Badge>;
}