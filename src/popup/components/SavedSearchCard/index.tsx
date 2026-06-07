import { useState } from 'react';
import type { SavedSearch } from '../../../shared/types/SavedSearch';
import { formatDateTimeTR } from '../../../shared/utils/dateUtils';
import { summarizeCriteria } from '../../../shared/utils/criteriaUtils';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface SavedSearchCardProps {
  saved: SavedSearch;
  onLoad: (saved: SavedSearch) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

export function SavedSearchCard({
  saved,
  onLoad,
  onUpdateLabel,
  onDelete,
}: SavedSearchCardProps) {
  const [editing, setEditing] = useState(false);
  const [labelInput, setLabelInput] = useState(saved.label ?? '');

  const saveLabel = () => {
    onUpdateLabel(saved.id, labelInput.trim());
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
      {/* Başlık satırı */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => e.key === 'Enter' && saveLabel()}
              placeholder="Bir isim ver (isteğe bağlı)"
              className="w-full rounded border border-brand-300 px-2 py-1 text-xs focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-left text-sm font-medium text-slate-800 hover:text-brand-700 truncate"
            >
              {saved.label || saved.keywords.join(' • ')}
            </button>
          )}
        </div>
        {saved.newDecisionCount > 0 && (
          <span title="Son taramadan bu yana eklenen karar sayısı">
            <Badge variant="red">{saved.newDecisionCount} yeni karar</Badge>
          </span>
        )}
      </div>

      {/* Keyword'ler (label varsa göster) */}
      {saved.label && (
        <div className="flex flex-wrap gap-1">
          {saved.keywords.map((kw) => (
            <Badge key={kw} variant="brand">{kw}</Badge>
          ))}
        </div>
      )}

      {/* Detaylı arama parametreleri */}
      {summarizeCriteria(saved.criteria).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {summarizeCriteria(saved.criteria).map((p) => (
            <Badge key={p} variant="slate">{p}</Badge>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="space-y-0.5 text-xs text-slate-400">
        <p>Kaydedildi: {formatDateTimeTR(saved.savedAt)}</p>
        {saved.lastCheckedCount > 0 ? (
          <p title="Bu arama için yeni karar olup olmadığının en son kontrol edildiği zaman">
            Yeni karar taraması: {formatDateTimeTR(saved.lastCheckedAt)} · o an{' '}
            {saved.lastCheckedCount} karar vardı
          </p>
        ) : (
          <p>Yeni karar taraması henüz yapılmadı</p>
        )}
      </div>

      {/* Aksiyonlar */}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onLoad(saved)} className="flex-1">
          Aramaya Yükle
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Yeniden adlandır
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(saved.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50">
          Sil
        </Button>
      </div>
    </div>
  );
}
