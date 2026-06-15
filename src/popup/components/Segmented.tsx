import { clsx } from 'clsx';

interface Option<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-md border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'whitespace-nowrap rounded-[7px] font-medium transition-colors',
            size === 'sm' ? 'px-2.5 py-1 text-[11.5px]' : 'px-3 py-1.5 text-[12.5px]',
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-2 hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
