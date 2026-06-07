import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'brand' | 'blue' | 'green' | 'red' | 'yellow' | 'slate';
  className?: string;
}

export function Badge({ children, variant = 'brand', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'brand'  && 'bg-brand-50 text-brand-800',
        variant === 'blue'   && 'bg-blue-50 text-blue-700',
        variant === 'green'  && 'bg-green-50 text-green-700',
        variant === 'red'    && 'bg-red-50 text-red-700',
        variant === 'yellow' && 'bg-yellow-50 text-yellow-700',
        variant === 'slate'  && 'bg-slate-100 text-slate-600',
        className,
      )}
    >
      {children}
    </span>
  );
}
