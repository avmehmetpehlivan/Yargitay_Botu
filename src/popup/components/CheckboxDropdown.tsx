import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

/**
 * Açılır kutu (combobox) içinde checkbox'larla çoklu seçim.
 * Seçim "Tümü / N seçili" olarak özetlenir; ✕ ile temizlenir.
 */
export function CheckboxDropdown({ label, options, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca kapat
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
    <div ref={ref} className="relative">
      <span className="text-[11px] font-medium text-slate-600">{label}</span>

      <div className="mt-1 flex items-stretch rounded-md border border-slate-200 bg-white">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center justify-between px-2 py-1 text-xs disabled:bg-slate-50"
        >
          <span className={value.length ? 'text-slate-700' : 'text-slate-400'}>{summary}</span>
          <span className="text-slate-400">▾</span>
        </button>
        {value.length > 0 && (
          <button
            type="button"
            disabled={disabled}
            title="Temizle"
            onClick={() => onChange([])}
            className="border-l border-slate-200 px-2 text-slate-400 hover:text-red-600"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full border-b border-slate-100 px-2 py-1 text-left text-[11px] text-red-600 hover:bg-slate-50"
            >
              Seçimi temizle ({value.length})
            </button>
          )}
          {options.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2 px-2 py-1 text-xs hover:bg-slate-50"
            >
              <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />
              <span className="text-slate-700">{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
