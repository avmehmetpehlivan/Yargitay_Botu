import { useEffect } from 'react';
import { useHistoryStore } from '../store/history.store';
import { useSearchDraftStore } from '../store/searchDraft.store';
import { formatDateTimeTR } from '../../shared/utils/dateUtils';
import { recordsTotalLabel } from '../../shared/utils/totals';
import { summarizeCriteria } from '../../shared/utils/criteriaUtils';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import type { View } from '../App';

const LIB = 'mx-auto w-full max-w-[920px] px-[clamp(20px,5vw,56px)] pb-20 pt-[26px]';

export function HistoryView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { items, isLoaded, load, remove } = useHistoryStore();
  const setDraft = useSearchDraftStore((s) => s.setDraft);

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  const loadSearch = (criteria: { keywords: string[] } | undefined, keywords: string[]) => {
    setDraft(criteria ?? { keywords });
    onNavigate('search');
  };

  return (
    <div className={LIB}>
      <div className="mb-[22px] flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-fg">Arama Geçmişi</h2>
          <p className="mt-[5px] max-w-[460px] text-[12.5px] leading-relaxed text-fg-3">
            Son aramalarınız. Birine tıklayıp kriterleri yeniden yükleyin.
          </p>
        </div>
        <span className="shrink-0 pt-1 font-mono text-xs tabular-nums text-fg-3">{items.length} kayıt</span>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="clock" title="Geçmiş boş" body="Yaptığınız aramalar burada görünür." />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((h) => (
            <div
              key={h.id}
              onClick={() => loadSearch(h.criteria, h.keywords)}
              className="group flex cursor-pointer items-center gap-3.5 rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-line-2 hover:bg-surface-2"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {h.keywords.map((k) => (
                    <span key={k} className="rounded-[7px] bg-accent-weak px-2 py-0.5 text-[11.5px] font-medium text-accent-text">{k}</span>
                  ))}
                  {(h.criteria?.excludeKeywords ?? []).map((k) => (
                    <span key={k} className="rounded-[7px] bg-danger-weak px-2 py-0.5 text-[11.5px] font-medium text-danger">− {k}</span>
                  ))}
                  {summarizeCriteria(h.criteria).map((p) => (
                    <span key={p} className="rounded-[7px] border border-line bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-fg-2">{p}</span>
                  ))}
                  {h.keywords.length === 0 && (h.criteria?.excludeKeywords ?? []).length === 0 && (
                    <span className="text-[11.5px] italic text-fg-faint">(anahtar kelimesiz)</span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-fg-3">
                  {formatDateTimeTR(h.scrapedAt)} · {recordsTotalLabel(h.totalCount, h.recordsTotal)}
                </div>
              </div>
              <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-accent-text group-hover:inline-flex">
                Yükle <Icon name="arrowRight" size={14} />
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(h.id);
                }}
                title="Sil"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-fg-3 transition-colors hover:bg-danger-weak hover:text-danger"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
