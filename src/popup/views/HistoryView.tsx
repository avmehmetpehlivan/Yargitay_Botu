import { useEffect } from 'react';
import { useHistoryStore } from '../store/history.store';
import { formatDateTimeTR } from '../../shared/utils/dateUtils';
import { recordsTotalLabel } from '../../shared/utils/totals';
import { summarizeCriteria } from '../../shared/utils/criteriaUtils';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export function HistoryView() {
  const { items, isLoaded, load, remove } = useHistoryStore();

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  if (!isLoaded) {
    return <div className="p-4 text-xs text-slate-400 text-center">Yükleniyor…</div>;
  }

  if (!items.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
        <span className="text-3xl">🕐</span>
        <p className="text-sm">Henüz arama geçmişi yok.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Arama Geçmişi</h2>
        <span className="text-xs text-slate-400">{items.length} kayıt</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap gap-1">
                {item.keywords.map((kw) => (
                  <Badge key={kw} variant="brand">{kw}</Badge>
                ))}
                {item.keywords.length === 0 && (
                  <span className="text-xs italic text-slate-400">(anahtar kelimesiz)</span>
                )}
              </div>
              {summarizeCriteria(item.criteria).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summarizeCriteria(item.criteria).map((p) => (
                    <Badge key={p} variant="slate">{p}</Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400">
                {formatDateTimeTR(item.scrapedAt)} — {recordsTotalLabel(item.totalCount, item.recordsTotal)}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => remove(item.id)}
              className="shrink-0 text-slate-400 hover:text-red-500"
            >
              Sil
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
