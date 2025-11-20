import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-white p-6 shadow-sm', className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <div className={cn('text-sm font-medium text-slate-500 uppercase tracking-wide', className)}>{children}</div>;
}

export function CardValue({ children, className }: CardProps) {
  return <div className={cn('mt-2 text-3xl font-semibold text-slate-900', className)}>{children}</div>;
}
