import { useState, useEffect } from 'react';
import { KeywordInput } from '../components/KeywordInput';
import { DetailedSearch } from '../components/DetailedSearch';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/common/Button';
import { useScraping } from '../hooks/useScraping';
import { useSearchDraftStore } from '../store/searchDraft.store';
import { describeSearch } from '../../shared/utils/keywordQuery';
import { recordsTotalLabel } from '../../shared/utils/totals';
import type { DetailFields, SearchCriteria } from '../../shared/types/SearchCriteria';
import type { View } from '../App';

const withPending = (list: string[], pending: string) => {
  const p = pending.trim();
  return p && !list.includes(p) ? [...list, p] : list;
};

const YARGITAY_URL  = 'https://karararama.yargitay.gov.tr/';
const YARGITAY_HOST = 'karararama.yargitay.gov.tr';

interface SearchViewProps {
  onNavigate: (v: View) => void;
}

export function SearchView({ onNavigate }: SearchViewProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [pendingKeyword, setPendingKeyword] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [pendingExclude, setPendingExclude] = useState('');
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');
  const [detail, setDetail] = useState<DetailFields>({});
  const [showDetail, setShowDetail] = useState(false);
  const [isOnSite, setIsOnSite] = useState<boolean | null>(null);
  const { job, phase, isRunning, start, stop } = useScraping();
  const { draft, clearDraft } = useSearchDraftStore();

  // Henüz chip'e dönüşmemiş input metnini de dahil et (Enter'a basılmasa bile).
  const effInclude = withPending(keywords, pendingKeyword);
  const effExclude = withPending(excludeKeywords, pendingExclude);

  // Detaylı panelde herhangi bir filtre dolu mu? (anahtar kelime olmadan da aranabilir)
  const hasDetail = Object.values(detail).some((v) =>
    Array.isArray(v) ? v.length > 0 : !!v,
  );
  const canStart = (effInclude.length > 0 || hasDetail) && !!isOnSite;

  const previewText = describeSearch({
    keywords: effInclude,
    excludeKeywords: effExclude,
    matchMode,
  });

  // Aktif sekmenin Yargıtay olup olmadığını kontrol et. Yan panel odak kaybında
  // kapanmaz; bu yüzden sekme değişimini de dinleyip yeniden kontrol ederiz.
  useEffect(() => {
    const check = () => {
      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        setIsOnSite(!!tab?.url?.includes(YARGITAY_HOST));
      });
    };
    check();
    const onUpdated = () => check();
    chrome.tabs.onActivated.addListener(onUpdated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onUpdated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  // Kayıtlı/geçmiş aramadan gelen taslağı alanlara yükle (otomatik aramaz).
  useEffect(() => {
    if (!draft) return;
    const { keywords: kw, excludeKeywords: exc, matchMode: mm, ...rest } = draft;
    setKeywords(kw ?? []);
    setExcludeKeywords(exc ?? []);
    setMatchMode(mm ?? 'all');
    setPendingKeyword('');
    setPendingExclude('');
    setDetail(rest);
    if (Object.values(rest).some((v) => (Array.isArray(v) ? v.length > 0 : !!v))) {
      setShowDetail(true);
    }
    clearDraft();
  }, [draft, clearDraft]);

  const handleStart = async () => {
    if (!canStart) return;
    // Bekleyen metinleri chip olarak işle (görünürde de kalsın) ve aramaya kat.
    setKeywords(effInclude);
    setExcludeKeywords(effExclude);
    setPendingKeyword('');
    setPendingExclude('');

    const criteria: SearchCriteria = {
      keywords: effInclude,
      ...(effExclude.length ? { excludeKeywords: effExclude } : {}),
      ...(matchMode === 'any' ? { matchMode } : {}),
      ...(hasDetail ? detail : {}),
    };
    await start(criteria);
  };

  const error = job?.phase === 'error' ? job.error : null;

  // ── Yanlış sayfada uyarı ──────────────────────────────────────────────────
  if (isOnSite === false) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <span className="text-2xl">⚠️</span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-slate-800">
            Yargıtay sitesinde değilsiniz
          </h2>
          <p className="text-xs leading-relaxed text-slate-500">
            Bu uzantı yalnızca Yargıtay Karar Arama sisteminde çalışır.
            Aşağıdaki adrese gidin, arama yapın ve uzantıyı tekrar açın.
          </p>
        </div>

        <a
          href={YARGITAY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2
                     text-sm font-medium text-white hover:bg-brand-800 transition-colors"
        >
          Siteye Git
          <span className="text-xs opacity-75">↗</span>
        </a>

        <p className="text-[11px] text-slate-400">
          Siteye gittikten sonra arama yapıp uzantıyı yeniden açabilirsiniz.
        </p>
      </div>
    );
  }

  // ── Normal arama arayüzü ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Karar Ara</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Aranacak kelimeleri girin; hariç tutmak istediklerinizi de ekleyebilirsiniz.
        </p>
      </div>

      <KeywordInput
        value={keywords}
        onChange={setKeywords}
        inputValue={pendingKeyword}
        onInputChange={setPendingKeyword}
        label="İçersin"
        hint="(geçmesi istenen kelimeler)"
        placeholder="Örn: işe iade"
        disabled={isRunning}
      />

      {/* İçerme modu — yalnızca 2+ kelime varken anlamlı */}
      {effInclude.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Kelimeler:</span>
          <div className="inline-flex overflow-hidden rounded-md border border-slate-200">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setMatchMode('all')}
              className={
                'px-2 py-1 ' +
                (matchMode === 'all' ? 'bg-brand-700 text-white' : 'bg-white text-slate-600')
              }
            >
              Hepsi geçsin (VE)
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setMatchMode('any')}
              className={
                'px-2 py-1 ' +
                (matchMode === 'any' ? 'bg-brand-700 text-white' : 'bg-white text-slate-600')
              }
            >
              Herhangi biri (VEYA)
            </button>
          </div>
        </div>
      )}

      <KeywordInput
        value={excludeKeywords}
        onChange={setExcludeKeywords}
        inputValue={pendingExclude}
        onInputChange={setPendingExclude}
        label="İçermesin"
        hint="(hariç tutulacak kelimeler)"
        placeholder="Örn: fesih"
        badgeVariant="red"
        disabled={isRunning}
      />

      {/* Canlı açıklama — kullanıcı ne aradığını net görsün */}
      {previewText && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-2.5 text-xs text-slate-700">
          <span className="font-medium text-brand-800">Arama:</span> {previewText}
        </div>
      )}

      {/* Detaylı arama aç/kapa */}
      <button
        type="button"
        onClick={() => setShowDetail((s) => !s)}
        className="self-start text-xs font-medium text-brand-700 hover:underline"
      >
        {showDetail ? '▴ Detaylı Aramayı Gizle' : '▾ Detaylı Arama'}
      </button>

      {showDetail && (
        <DetailedSearch value={detail} onChange={setDetail} disabled={isRunning} />
      )}

      {isRunning && job && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          {phase === 'metadata' && (
            <ProgressBar
              label="Karar listesi taranıyor…"
              current={job.metadataProgress.current}
              total={job.metadataProgress.total || 1}
            />
          )}
          {phase === 'fulltext' && (
            <ProgressBar
              label="Karar metinleri indiriliyor…"
              current={job.fulltextProgress.current}
              total={job.fulltextProgress.total}
            />
          )}
        </div>
      )}

      {phase === 'complete' && job && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          Tamamlandı! {recordsTotalLabel(job.decisions.length, job.recordsTotal)}.
          <button
            onClick={() => onNavigate('results')}
            className="ml-2 font-semibold underline hover:no-underline"
          >
            Sonuçlara git →
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {!isRunning ? (
          <Button className="flex-1" onClick={handleStart} disabled={!canStart}>
            Toplamaya Başla
          </Button>
        ) : (
          <Button variant="danger" className="flex-1" onClick={stop}>
            Durdur
          </Button>
        )}
      </div>
    </div>
  );
}
