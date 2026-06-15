import { useEffect } from 'react';
import { useSavedStore } from '../store/saved.store';
import { useSearchDraftStore } from '../store/searchDraft.store';
import { SavedSearchCard } from '../components/SavedSearchCard';
import { EmptyState } from '../components/EmptyState';
import type { SavedSearch } from '../../shared/types/SavedSearch';
import type { View } from '../App';

const LIB = 'mx-auto w-full max-w-[920px] px-[clamp(20px,5vw,56px)] pb-20 pt-[26px]';

export function SavedView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { items, isLoaded, load, updateLabel, remove } = useSavedStore();
  const setDraft = useSearchDraftStore((s) => s.setDraft);

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  const handleLoad = (saved: SavedSearch) => {
    setDraft(saved.criteria ?? { keywords: saved.keywords });
    onNavigate('search');
  };

  return (
    <div className={LIB}>
      <div className="mb-[22px] flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-fg">Kayıtlı Aramalar</h2>
          <p className="mt-[5px] max-w-[460px] text-[12.5px] leading-relaxed text-fg-3">
            "Aramaya Yükle" kriterleri arama ekranına taşır; düzenleyip kendiniz başlatırsınız.
          </p>
        </div>
        <span className="shrink-0 pt-1 font-mono text-xs tabular-nums text-fg-3">{items.length} kayıt</span>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="star" title="Kayıtlı arama yok" body="Sonuçlar ekranından aramaları kaydedin." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((saved) => (
            <SavedSearchCard key={saved.id} saved={saved} onLoad={handleLoad} onUpdateLabel={updateLabel} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
