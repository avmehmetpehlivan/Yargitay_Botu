import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

/** Açılır kutuda checkbox'larla çoklu seçim ("Tümü / N seçili", ✕ ile temizle). */
export function CheckboxDropdown({ label, options, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);

  const summary = value.length === 0 ? 'Tümü' : `${value.length} seçili`;

  return (
    <div ref={ref} className="relative flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-2">{label}</span>

      <div className="flex items-stretch rounded-lg border border-line-2 bg-surface">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center justify-between px-2.5 py-1.5 text-xs disabled:opacity-50"
        >
          <span className={value.length ? 'text-fg' : 'text-fg-3'}>{summary}</span>
          <span className="text-fg-3">▾</span>
        </button>
        {value.length > 0 && (
          <button
            type="button"
            disabled={disabled}
            title="Temizle"
            onClick={() => onChange([])}
            className="border-l border-line px-2 text-fg-3 hover:text-danger"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-line-2 bg-surface shadow-md">
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full border-b border-line px-2.5 py-1.5 text-left text-[11px] text-danger hover:bg-surface-2"
            >
              Seçimi temizle ({value.length})
            </button>
          )}
          {options.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-surface-2">
              <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} className="accent-[var(--accent)]" />
              <span className="text-fg">{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
