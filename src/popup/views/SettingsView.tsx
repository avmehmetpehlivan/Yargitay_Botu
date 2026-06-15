import { useEffect, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { getSettings, saveSettings } from '../../shared/utils/chromeStorage';
import { countCache, clearCache } from '../../shared/utils/fulltextCache';
import { DEFAULT_SETTINGS } from '../../shared/types/Storage';
import { useHistoryStore } from '../store/history.store';
import { useUiStore, type Accent } from '../store/ui.store';
import { Segmented } from '../components/Segmented';
import { Toggle } from '../components/Toggle';
import { Icon } from '../components/Icon';

const LIB = 'mx-auto w-full max-w-[920px] px-[clamp(20px,5vw,56px)] pb-20 pt-[26px]';

const ACCENTS: { id: Accent; name: string; desc: string; hex: string; weak: string }[] = [
  {
    id: 'teal',
    name: 'Sakin Teal',
    desc: 'Sessiz mürekkep teali',
    hex: '#2c7a72',
    weak: 'rgba(44,122,114,0.12)',
  },
  {
    id: 'neutral',
    name: 'Nötr Gri',
    desc: 'Tamamen sessiz, neredeyse renksiz',
    hex: '#34342f',
    weak: 'rgba(52,52,47,0.10)',
  },
  {
    id: 'blue',
    name: 'İnce Mavi',
    desc: 'Mürekkep mavisi vurgu',
    hex: '#2f64d8',
    weak: 'rgba(47,100,216,0.12)',
  },
];

export function SettingsView() {
  const { clear: clearHistoryStore } = useHistoryStore();
  const { theme, accent, setTheme, setAccent } = useUiStore();
  const [autoSave, setAutoSave] = useState(DEFAULT_SETTINGS.autoSaveHistory);
  const [cacheCount, setCacheCount] = useState<number | null>(null);
  const [busy, setBusy] = useState<'cache' | 'history' | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => setAutoSave(s.autoSaveHistory));
    countCache()
      .then(setCacheCount)
      .catch(() => setCacheCount(null));
  }, []);

  const toggleAutoSave = async () => {
    const s = await getSettings();
    const next = !s.autoSaveHistory;
    await saveSettings({ ...s, autoSaveHistory: next });
    setAutoSave(next);
  };
  const onClearCache = async () => {
    if (
      !confirm(
        'Önbellekteki tüm karar metinleri silinecek. Geçmiş ve kayıtlı aramalar etkilenmez. Devam edilsin mi?',
      )
    )
      return;
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
    if (!confirm('Tüm arama geçmişi silinecek. Kayıtlı aramalar etkilenmez. Devam edilsin mi?'))
      return;
    setBusy('history');
    try {
      await clearHistoryStore();
      setNote('Arama geçmişi temizlendi.');
    } finally {
      setBusy(null);
    }
  };

  const clearBtn =
    'rounded-md border border-line-2 bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-50';

  return (
    <div className={LIB}>
      <div className="mb-[22px]">
        <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-fg">Ayarlar</h2>
        <p className="mt-[5px] text-[12.5px] leading-relaxed text-fg-3">
          Görünüm ve veri tercihleri. Her şey cihazınızda kalır.
        </p>
      </div>

      {/* Accent karşılaştırma */}
      <div className="mb-5">
        <p className="text-[13.5px] font-semibold text-fg">Tema tercihi</p>
        <div className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              className={clsx(
                'relative flex flex-col gap-3 rounded-lg border-[1.5px] bg-surface p-3.5 text-left transition-colors',
                accent === a.id
                  ? 'border-accent shadow-[0_0_0_3px_var(--accent-weak)]'
                  : 'border-line hover:border-line-strong',
              )}
            >
              {accent === a.id && (
                <span
                  className="absolute right-3 top-3 grid h-[18px] w-[18px] place-items-center rounded-full text-white"
                  style={{ background: a.hex }}
                >
                  <Icon name="check" size={11} stroke={2.6} />
                </span>
              )}
              <div className="flex items-center gap-2 rounded-md border border-line bg-surface-2 p-3">
                <span
                  className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg text-[13px] font-semibold text-white"
                  style={{ background: a.hex }}
                >
                  Aa
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: a.weak, color: a.hex }}
                >
                  işe iade
                </span>
                <span className="h-[5px] min-w-[16px] flex-1 overflow-hidden rounded-full bg-line-2">
                  <i className="block h-full w-[62%] rounded-full" style={{ background: a.hex }} />
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-fg">{a.name}</span>
                <span className="text-[11px] leading-snug text-fg-3">{a.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ayar listesi */}
      <div className="overflow-hidden rounded-lg border border-line">
        <SettingsRow title="Tema" desc="Çalışma alanının görünümü.">
          <Segmented
            size="sm"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Açık' },
              { value: 'dark', label: 'Koyu' },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          title="Aramaları geçmişe kaydet"
          desc="Her arama otomatik olarak Geçmiş'e eklenir."
        >
          <Toggle on={autoSave} onClick={toggleAutoSave} />
        </SettingsRow>
        <SettingsRow
          title="Karar metni önbelleği"
          desc={
            cacheCount == null
              ? 'Çekilen karar metinleri tekrar indirilmemek için diskte tutulur.'
              : `${cacheCount.toLocaleString('tr-TR')} karar metni önbellekte. Yalnızca karar detay metinleri silinir.`
          }
        >
          <button
            onClick={onClearCache}
            disabled={busy !== null || cacheCount === 0}
            className={clearBtn}
          >
            Temizle
          </button>
        </SettingsRow>
        <SettingsRow title="Arama geçmişi" desc="Tüm geçmişi temizler.">
          <button onClick={onClearHistory} disabled={busy !== null} className={clearBtn}>
            Temizle
          </button>
        </SettingsRow>
      </div>

      {note && <p className="mt-3 text-center text-xs text-accent-text">{note}</p>}

      <div className="mt-[18px] flex items-center justify-between px-1 font-mono text-[11.5px] text-fg-faint">
        <span>Sürüm {chrome.runtime.getManifest().version}</span>
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') })}
          className="text-accent-text hover:underline"
        >
          Gizlilik Politikası
        </button>
      </div>
    </div>
  );
}

function SettingsRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-[18px] py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-fg">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-fg-3">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
