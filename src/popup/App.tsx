import { useState, useEffect } from 'react';
import { NavRail } from './components/NavRail';
import { TopBar, OriginChip } from './components/TopBar';
import { Toaster } from './components/Toaster';
import { SearchView }  from './views/SearchView';
import { ResultsView } from './views/ResultsView';
import { HistoryView } from './views/HistoryView';
import { SavedView }   from './views/SavedView';
import { CollectionsView } from './views/CollectionsView';
import { SettingsView } from './views/SettingsView';
import { useScrapingStore } from './store/scraping.store';
import { useCollectionsStore } from './store/collections.store';
import { useUiStore } from './store/ui.store';

export type View = 'search' | 'results' | 'collections' | 'history' | 'saved' | 'settings';

const TITLES: Record<View, { title: string; sub: string }> = {
  search:      { title: 'Karar Ara', sub: 'Yeni arama…' },
  results:     { title: 'Sonuçlar', sub: '' },
  collections: { title: 'Koleksiyon', sub: 'Kayıtlı kararlar' },
  history:     { title: 'Geçmiş', sub: 'Son aramalar' },
  saved:       { title: 'Kayıtlı', sub: 'Arama şablonları' },
  settings:    { title: 'Ayarlar', sub: 'Görünüm ve veri' },
};

export function App() {
  const [activeView, setActiveView] = useState<View>('search');
  const job = useScrapingStore((s) => s.job);
  const hasSearch = job != null;
  const savedCount = useCollectionsStore((s) => s.saved.length);
  const loadCollections = useCollectionsStore((s) => s.load);
  const { theme, toggleTheme, init } = useUiStore();

  // Tema/accent'i <html>'e uygula + koleksiyonları yükle (açılışta).
  useEffect(() => { init(); }, [init]);
  useEffect(() => { void loadCollections(); }, [loadCollections]);

  // Sonuçlar temizlenirse ve hâlâ o sekmedeysek aramaya dön.
  useEffect(() => {
    if (!hasSearch && activeView === 'results') setActiveView('search');
  }, [hasSearch, activeView]);

  // Üst çubuk başlığı/alt-başlığı.
  const meta = TITLES[activeView];
  let sub = meta.sub;
  if (activeView === 'results' && job?.criteria) {
    const inc = (job.criteria.keywords ?? []).map((k) => `"${k}"`).join(' ');
    const exc = job.criteria.excludeKeywords ?? [];
    sub = inc + (exc.length ? ` · hariç: ${exc.join(', ')}` : '');
  }

  return (
    <div className="flex h-screen w-full bg-bg font-ui text-fg">
      <NavRail
        view={activeView}
        onNavigate={setActiveView}
        theme={theme}
        onToggleTheme={toggleTheme}
        showResults={hasSearch}
        resultCount={job?.recordsTotal ?? job?.decisions.length ?? null}
        savedCount={savedCount}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar title={meta.title} sub={sub || undefined} right={<OriginChip />} />

        {/* Viewport: ResultsView flex-1 ile doldurup listesini kendi içinde kaydırır;
            diğer (doğal yükseklikli) view'ler taşarsa burada kaydırılır. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {activeView === 'search'      && <SearchView  onNavigate={setActiveView} />}
          {activeView === 'results'     && <ResultsView onNavigate={setActiveView} />}
          {activeView === 'collections' && <CollectionsView />}
          {activeView === 'history'     && <HistoryView onNavigate={setActiveView} />}
          {activeView === 'saved'       && <SavedView   onNavigate={setActiveView} />}
          {activeView === 'settings'    && <SettingsView />}
        </div>
      </main>

      <Toaster />
    </div>
  );
}
