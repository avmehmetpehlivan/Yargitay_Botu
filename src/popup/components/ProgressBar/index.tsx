import { clsx } from 'clsx';

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ label, current, total, className }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={clsx('space-y-1', className)}>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{current} / {total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-brand-600 transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
