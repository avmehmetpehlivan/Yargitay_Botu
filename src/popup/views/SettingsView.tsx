import { useEffect, useState, type ReactNode } from 'react';
import { getSettings, saveSettings } from '../../shared/utils/chromeStorage';
import { countCache, clearCache } from '../../shared/utils/fulltextCache';
import { DEFAULT_SETTINGS } from '../../shared/types/Storage';
import { useHistoryStore } from '../store/history.store';
import { Button } from '../components/common/Button';

export function SettingsView() {
  const { clear: clearHistoryStore } = useHistoryStore();
  const [autoSave, setAutoSave] = useState(DEFAULT_SETTINGS.autoSaveHistory);
  const [cacheCount, setCacheCount] = useState<number | null>(null);
  const [busy, setBusy] = useState<'cache' | 'history' | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => setAutoSave(s.autoSaveHistory));
    countCache().then(setCacheCount).catch(() => setCacheCount(null));
  }, []);

  const toggleAutoSave = async () => {
    const s = await getSettings();
    const next = !s.autoSaveHistory;
    await saveSettings({ ...s, autoSaveHistory: next });
    setAutoSave(next);
  };

  const onClearCache = async () => {
    if (!confirm('Önbellekteki tüm karar metinleri silinecek. Geçmiş ve kayıtlı aramalar etkilenmez. Devam edilsin mi?')) return;
    setBusy('cache');
    try {
      await clearCache();
      setCacheCount(0);
      setNote('Önbellek temizlendi.');
    } finally {
      setBusy(null);
    }
  };

  const onClearHistory = async () => {
    if (!confirm('Tüm arama geçmişi silinecek. Kayıtlı aramalar etkilenmez. Devam edilsin mi?')) return;
    setBusy('history');
    try {
      await clearHistoryStore();
      setNote('Arama geçmişi temizlendi.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold text-slate-800">Ayarlar</h2>

      {/* Otomatik geçmiş kaydı */}
      <Row
        title="Aramaları geçmişe kaydet"
        desc="Her arama otomatik olarak Geçmiş sekmesine eklenir."
      >
        <Toggle on={autoSave} onClick={toggleAutoSave} />
      </Row>

      {/* Önbellek */}
      <Row
        title="Karar metni önbelleği"
        desc={
          cacheCount == null
            ? 'Çekilen karar metinleri tekrar indirilmemek için diskte tutulur.'
            : `${cacheCount.toLocaleString('tr-TR')} karar metni önbellekte. Sadece bu metinler silinir; geçmiş/kayıtlı aramalar etkilenmez.`
        }
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={onClearCache}
          loading={busy === 'cache'}
          disabled={busy !== null || cacheCount === 0}
        >
          Temizle
        </Button>
      </Row>

      {/* Geçmiş */}
      <Row title="Arama geçmişi" desc="Geçmiş sekmesindeki tüm kayıtları siler.">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClearHistory}
          loading={busy === 'history'}
          disabled={busy !== null}
        >
          Temizle
        </Button>
      </Row>

      {note && <p className="text-center text-xs text-green-600">{note}</p>}

      {/* Hakkında */}
      <div className="mt-1 flex items-center justify-between px-1 text-xs text-slate-400">
        <span>Sürüm {chrome.runtime.getManifest().version}</span>
        <button
          className="text-brand-700 hover:underline"
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') })}
        >
          Gizlilik Politikası
        </button>
      </div>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        'relative h-5 w-9 rounded-full transition-colors ' + (on ? 'bg-brand-700' : 'bg-slate-300')
      }
      aria-pressed={on}
    >
      <span
        className={
          'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ' +
          (on ? 'left-[18px]' : 'left-0.5')
        }
      />
    </button>
  );
}
