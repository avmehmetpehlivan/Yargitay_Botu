import { useState } from 'react';
import type { SavedSearch } from '../../../shared/types/SavedSearch';
import { formatDateTimeTR } from '../../../shared/utils/dateUtils';
import { summarizeCriteria } from '../../../shared/utils/criteriaUtils';

interface SavedSearchCardProps {
  saved: SavedSearch;
  onLoad: (saved: SavedSearch) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

export function SavedSearchCard({ saved, onLoad, onUpdateLabel, onDelete }: SavedSearchCardProps) {
  const [editing, setEditing] = useState(false);
  const [labelInput, setLabelInput] = useState(saved.label ?? '');

  const saveLabel = () => {
    onUpdateLabel(saved.id, labelInput.trim());
    setEditing(false);
  };

  const exclude = saved.criteria?.excludeKeywords ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        {editing ? (
          <input
            autoFocus
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={(e) => e.key === 'Enter' && saveLabel()}
            placeholder="Bir isim ver (isteğe bağlı)"
            className="flex-1 rounded-md border border-accent bg-surface px-2 py-1 text-sm text-fg focus:outline-none"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-fg hover:text-accent-text">
            {saved.label || saved.keywords.join(' • ')}
          </button>
        )}
        <span className="shrink-0 font-mono text-[11px] text-fg-3">{formatDateTimeTR(saved.savedAt)}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {saved.keywords.map((kw) => (
          <span key={kw} className="rounded-[7px] bg-accent-weak px-2 py-0.5 text-[11.5px] font-medium text-accent-text">{kw}</span>
        ))}
        {exclude.map((kw) => (
          <span key={kw} className="rounded-[7px] bg-danger-weak px-2 py-0.5 text-[11.5px] font-medium text-danger">− {kw}</span>
        ))}
        {summarizeCriteria(saved.criteria).map((p) => (
          <span key={p} className="rounded-[7px] border border-line bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-fg-2">{p}</span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => onLoad(saved)} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-on-accent transition-colors hover:bg-accent-hover">
          Aramaya Yükle
        </button>
        <button onClick={() => setEditing(true)} className="rounded-md px-3 py-1.5 text-xs font-medium text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg">
          Yeniden adlandır
        </button>
        <button onClick={() => onDelete(saved.id)} className="rounded-md px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-weak">
          Sil
        </button>
      </div>
    </div>
  );
}
