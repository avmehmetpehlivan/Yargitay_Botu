import { clsx } from 'clsx';

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={clsx('relative h-[22px] w-[38px] rounded-full transition-colors', on ? 'bg-accent' : 'bg-line-strong')}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all',
          on ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>
  );
}
