import { useState } from 'react';
import { COLLECTION_COLORS } from '../../shared/constants/storage';

interface Props {
  initialName?: string;
  initialColor?: string;
  submitLabel?: string;
  onSubmit: (name: string, color: string) => void;
  onCancel?: () => void;
}

/** Kategori adı + renk seçimi (palet + özel renk). Yeni oluşturma ve düzenleme için. */
export function CategoryEditor({
  initialName = '',
  initialColor = COLLECTION_COLORS[0],
  submitLabel = 'Oluştur',
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, color);
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface-2 p-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Kategori adı (ör. İşe İade)"
        className="rounded-md border border-line-2 bg-surface px-2.5 py-1.5 text-sm text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {COLLECTION_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={c}
            className={
              'h-6 w-6 rounded-full transition-transform ' +
              (color === c ? 'ring-2 ring-fg ring-offset-1 ring-offset-surface-2' : 'hover:scale-110')
            }
            style={{ backgroundColor: c }}
          />
        ))}
        {/* Özel renk */}
        <label
          className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-dashed border-line-strong"
          title="Özel renk"
          style={!COLLECTION_COLORS.includes(color as (typeof COLLECTION_COLORS)[number]) ? { backgroundColor: color, borderStyle: 'solid' } : undefined}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          {COLLECTION_COLORS.includes(color as (typeof COLLECTION_COLORS)[number]) && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-fg-3">+</span>
          )}
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="flex-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-md border border-line-2 bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
          >
            İptal
          </button>
        )}
      </div>
    </div>
  );
}
