import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { SearchView }  from './views/SearchView';
import { ResultsView } from './views/ResultsView';
import { HistoryView } from './views/HistoryView';
import { SavedView }   from './views/SavedView';
import { SettingsView } from './views/SettingsView';
import appIcon from '../../extension-icon.svg';

export type View = 'search' | 'results' | 'history' | 'saved' | 'settings';

export function App() {
  const [activeView, setActiveView] = useState<View>('search');

  return (
    <div className="flex h-[580px] w-[420px] flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <img src={appIcon} alt="" className="h-8 w-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold text-slate-900">Yargıtay Karar Arama Asistanı</h1>
          <p className="text-xs text-slate-400">karararama.yargitay.gov.tr</p>
        </div>
        <button
          onClick={() => setActiveView('settings')}
          title="Ayarlar"
          aria-label="Ayarlar"
          className={
            'shrink-0 rounded-lg p-1.5 transition-colors ' +
            (activeView === 'settings'
              ? 'bg-brand-50 text-brand-700'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {/* Aktif görünüm */}
      <main className="flex-1 overflow-y-auto">
        {activeView === 'search'   && <SearchView  onNavigate={setActiveView} />}
        {activeView === 'results'  && <ResultsView />}
        {activeView === 'history'  && <HistoryView />}
        {activeView === 'saved'    && <SavedView   onNavigate={setActiveView} />}
        {activeView === 'settings' && <SettingsView />}
      </main>

      {/* Alt nav */}
      <Navigation active={activeView} onSelect={setActiveView} />
    </div>
  );
}
