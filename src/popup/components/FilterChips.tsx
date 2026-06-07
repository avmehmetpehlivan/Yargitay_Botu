interface FilterChipsProps {
  years: number[];
  chambers: string[];
  onToggleYear: (y: number) => void;
  onToggleChamber: (c: string) => void;
  onClear: () => void;
  className?: string;
}

/** Aktif yıl/daire filtrelerini kaldırılabilir chip'ler olarak gösterir. */
export function FilterChips({
  years,
  chambers,
  onToggleYear,
  onToggleChamber,
  onClear,
  className,
}: FilterChipsProps) {
  if (!years.length && !chambers.length) return null;

  return (
    <div className={'flex flex-wrap items-center gap-1.5 ' + (className ?? '')}>
      <span className="text-xs text-slate-500">Filtre:</span>
      {years.map((y) => (
        <Chip key={`y-${y}`} label={String(y)} onRemove={() => onToggleYear(y)} />
      ))}
      {chambers.map((c) => (
        <Chip key={`c-${c}`} label={c} onRemove={() => onToggleChamber(c)} />
      ))}
      <button
        onClick={onClear}
        className="ml-0.5 text-xs text-slate-400 hover:text-red-600"
      >
        Temizle
      </button>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-xs font-medium text-white">
      {label}
      <button onClick={onRemove} aria-label={`${label} filtresini kaldır`} className="leading-none opacity-80 hover:opacity-100">
        ×
      </button>
    </span>
  );
}
