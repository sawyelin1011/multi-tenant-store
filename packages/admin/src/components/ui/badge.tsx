import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
};

interface BadgeProps extends PropsWithChildren {
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)}>{children}</span>;
}
