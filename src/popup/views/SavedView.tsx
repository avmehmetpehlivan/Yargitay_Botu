import { useEffect } from 'react';
import { useSavedStore } from '../store/saved.store';
import { useSearchDraftStore } from '../store/searchDraft.store';
import { SavedSearchCard } from '../components/SavedSearchCard';
import type { SavedSearch } from '../../shared/types/SavedSearch';
import type { View } from '../App';

interface SavedViewProps {
  onNavigate: (v: View) => void;
}

export function SavedView({ onNavigate }: SavedViewProps) {
  const { items, isLoaded, load, updateLabel, remove } = useSavedStore();
  const setDraft = useSearchDraftStore((s) => s.setDraft);

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  if (!isLoaded) {
    return <div className="p-4 text-xs text-slate-400 text-center">Yükleniyor…</div>;
  }

  if (!items.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
        <span className="text-3xl">⭐</span>
        <p className="text-sm">Kayıtlı arama yok.</p>
        <p className="text-xs">Sonuçlar ekranından aramaları kaydet.</p>
      </div>
    );
  }

  // Otomatik aratma YOK — kriterleri arama ekranına yükle, kullanıcı düzenleyip
  // "Toplamaya Başla"ya kendisi bassın.
  const handleLoad = (saved: SavedSearch) => {
    setDraft(saved.criteria ?? { keywords: saved.keywords });
    onNavigate('search');
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Kayıtlı Aramalar</h2>
        <span className="text-xs text-slate-400">{items.length} kayıt</span>
      </div>
      <p className="text-xs text-slate-500">
        "Aramaya Yükle" ile kriterler arama ekranına taşınır; düzenleyip
        "Toplamaya Başla"ya kendiniz basarsınız.
      </p>

      <div className="space-y-2">
        {items.map((saved) => (
          <SavedSearchCard
            key={saved.id}
            saved={saved}
            onLoad={handleLoad}
            onUpdateLabel={updateLabel}
            onDelete={remove}
          />
        ))}
      </div>
    </div>
  );
}
