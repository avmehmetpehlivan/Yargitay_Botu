import { useState, useEffect } from 'react';
import { KeywordInput } from '../components/KeywordInput';
import { DetailedSearch } from '../components/DetailedSearch';
import { Segmented } from '../components/Segmented';
import { Icon } from '../components/Icon';
import { useScraping } from '../hooks/useScraping';
import { useSearchDraftStore } from '../store/searchDraft.store';
import { describeSearch } from '../../shared/utils/keywordQuery';
import type { DetailFields, SearchCriteria } from '../../shared/types/SearchCriteria';
import type { View } from '../App';

const withPending = (list: string[], pending: string) => {
  const p = pending.trim();
  return p && !list.includes(p) ? [...list, p] : list;
};

const YARGITAY_URL = 'https://karararama.yargitay.gov.tr/';
const YARGITAY_HOST = 'karararama.yargitay.gov.tr';

export function SearchView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [pendingKeyword, setPendingKeyword] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [pendingExclude, setPendingExclude] = useState('');
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');
  const [detail, setDetail] = useState<DetailFields>({});
  const [showDetail, setShowDetail] = useState(false);
  const [isOnSite, setIsOnSite] = useState<boolean | null>(null);
  const { start } = useScraping();
  const { draft, clearDraft } = useSearchDraftStore();

  const effInclude = withPending(keywords, pendingKeyword);
  const effExclude = withPending(excludeKeywords, pendingExclude);
  const hasDetail = Object.values(detail).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
  const canStart = (effInclude.length > 0 || hasDetail) && !!isOnSite;

  const previewText = describeSearch({ keywords: effInclude, excludeKeywords: effExclude, matchMode });

  useEffect(() => {
    const check = () =>
      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        setIsOnSite(!!tab?.url?.includes(YARGITAY_HOST));
      });
    check();
    const onUpdated = () => check();
    chrome.tabs.onActivated.addListener(onUpdated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onUpdated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  useEffect(() => {
    if (!draft) return;
    const { keywords: kw, excludeKeywords: exc, matchMode: mm, ...rest } = draft;
    setKeywords(kw ?? []);
    setExcludeKeywords(exc ?? []);
    setMatchMode(mm ?? 'all');
    setPendingKeyword('');
    setPendingExclude('');
    setDetail(rest);
    if (Object.values(rest).some((v) => (Array.isArray(v) ? v.length > 0 : !!v))) setShowDetail(true);
    clearDraft();
  }, [draft, clearDraft]);

  const handleStart = async () => {
    if (!canStart) return;
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
    onNavigate('results');
  };

  // ── Yanlış sayfada uyarı ──
  if (isOnSite === false) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-[16px] border border-line bg-surface-2 text-warn">
          <Icon name="external" size={26} stroke={1.5} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[15px] font-semibold text-fg">Yargıtay sitesinde değilsiniz</h2>
          <p className="max-w-[340px] text-xs leading-relaxed text-fg-3">
            Bu uzantı yalnızca Yargıtay Karar Arama sisteminde çalışır. Aşağıdaki adrese gidip
            uzantıyı tekrar açın.
          </p>
        </div>
        <a
          href={YARGITAY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          Siteye Git <Icon name="external" size={14} />
        </a>
      </div>
    );
  }

  // ── Normal arama ──
  return (
    <div className="flex flex-1 justify-center overflow-y-auto">
      <div className="flex w-full max-w-[600px] flex-col gap-5 px-7 pb-20 pt-12">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg">Karar Ara</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-3">
            Aranacak kelimeleri girin; hariç tutmak istediklerinizi de ekleyebilirsiniz.
          </p>
        </div>

        <KeywordInput
          value={keywords}
          onChange={setKeywords}
          inputValue={pendingKeyword}
          onInputChange={setPendingKeyword}
          label="İçersin"
          hint="geçmesi istenen kelimeler"
          placeholder="Örn: işe iade"
        />

        {effInclude.length > 1 && (
          <div className="-mt-1 flex items-center gap-2.5">
            <span className="text-xs text-fg-3">Kelimeler:</span>
            <Segmented
              size="sm"
              value={matchMode}
              onChange={setMatchMode}
              options={[
                { value: 'all', label: 'Hepsi geçsin (VE)' },
                { value: 'any', label: 'Herhangi biri (VEYA)' },
              ]}
            />
          </div>
        )}

        <KeywordInput
          value={excludeKeywords}
          onChange={setExcludeKeywords}
          inputValue={pendingExclude}
          onInputChange={setPendingExclude}
          label="İçermesin"
          hint="hariç tutulacak kelimeler"
          placeholder="Örn: fesih"
          badgeVariant="red"
        />

        {previewText && (
          <div className="rounded-md bg-accent-weak px-3.5 py-3 text-[13px] leading-relaxed text-fg-2">
            <span className="mr-2 font-semibold text-accent-text">Arama</span>
            {previewText}
          </div>
        )}

        <div className="border-t border-line pt-4">
          <button
            onClick={() => setShowDetail((s) => !s)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-text"
          >
            <Icon name="chevronDown" size={15} style={{ transform: showDetail ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            Detaylı arama
          </button>
          {showDetail && (
            <div className="mt-4">
              <DetailedSearch value={detail} onChange={setDetail} />
            </div>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          <Icon name="layers" size={17} /> Toplamaya Başla
        </button>

        <div className="mt-0.5 flex items-center justify-center gap-2 text-[11px] text-fg-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_0_3px_var(--accent-weak)]" />
          <span className="font-mono">karararama.yargitay.gov.tr — bağlı</span>
        </div>
      </div>
    </div>
  );
}
