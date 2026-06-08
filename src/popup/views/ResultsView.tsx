import { useEffect, useMemo, useState } from 'react';
import type { Decision } from '../../shared/types/Decision';
import type { SearchResult } from '../../shared/types/SearchResult';
import { STORAGE_LIMITS } from '../../shared/constants/storage';
import { formatDateTR } from '../../shared/utils/dateUtils';
import { recordsTotalLabel } from '../../shared/utils/totals';
import { useScraping } from '../hooks/useScraping';
import { useSavedStore } from '../store/saved.store';
import { usePdfDownload } from '../hooks/usePdfDownload';
import { useExport } from '../hooks/useExport';
import { StatisticsPanel } from '../components/StatisticsPanel';
import { FilterChips } from '../components/FilterChips';
import { Button } from '../components/common/Button';

const LIMIT = STORAGE_LIMITS.maxFulltextPerPdf; // 25

type PendingExport = { ids: string[]; format: 'pdf' | 'word' };

export function ResultsView() {
  const { job, fetchFulltexts, cancelFulltext } = useScraping();
  const { save } = useSavedStore();
  const { state: pdfState, error: pdfError, download } = usePdfDownload();
  const { state: exportState, exportCsv, exportWord } = useExport();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingExport, setPendingExport] = useState<PendingExport | null>(null);
  const [yearFilter, setYearFilter] = useState<number[]>([]);
  const [chamberFilter, setChamberFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'none' | 'date-desc' | 'date-asc' | 'chamber'>('none');

  const decisions: Decision[] = job?.decisions ?? [];
  const keywords: string[] = job?.keywords ?? [];
  const isFetching = job?.phase === 'fulltext';

  // Grafiklerden seçilen yıl/daire filtrelerini listeye uygula.
  const filtered = useMemo(
    () =>
      decisions.filter(
        (d) =>
          (yearFilter.length === 0 || yearFilter.includes(d.year)) &&
          (chamberFilter.length === 0 || chamberFilter.includes(d.chamber)),
      ),
    [decisions, yearFilter, chamberFilter],
  );

  // Filtre + sıralama uygulanmış görünür liste.
  const visible = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'date-desc') arr.sort((a, b) => b.date.localeCompare(a.date));
    else if (sortBy === 'date-asc') arr.sort((a, b) => a.date.localeCompare(b.date));
    else if (sortBy === 'chamber') arr.sort((a, b) => a.chamber.localeCompare(b.chamber, 'tr'));
    return arr;
  }, [filtered, sortBy]);

  const toggleYear = (y: number) =>
    setYearFilter((p) => (p.includes(y) ? p.filter((x) => x !== y) : [...p, y]));
  const toggleChamber = (c: string) =>
    setChamberFilter((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const clearFilters = () => {
    setYearFilter([]);
    setChamberFilter([]);
  };

  const result: SearchResult | null = useMemo(() => {
    if (!job || decisions.length === 0) return null;
    return {
      id: job.id,
      keywords,
      decisions,
      totalCount: decisions.length,
      scrapedAt: job.startedAt,
      durationMs: 0,
    };
  }, [job, decisions, keywords]);

  // Tam metin çekimi bittiğinde (faz 'complete'e dönünce) seçilenleri istenen
  // biçimde (PDF / Word) dışa aktar.
  useEffect(() => {
    if (!pendingExport || job?.phase !== 'complete') return;
    const byId = new Map(decisions.map((d) => [d.id, d]));
    const picked = pendingExport.ids.map((id) => byId.get(id)).filter(Boolean) as Decision[];
    const fmt = pendingExport.format;
    setPendingExport(null);
    if (picked.length === 0) return;
    if (fmt === 'pdf') void download(picked, keywords, 'full');
    else void exportWord(picked, keywords);
  }, [job?.phase, pendingExport, decisions, keywords, download, exportWord]);

  if (!result) {
    if (job && job.phase === 'complete' && decisions.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
          <span className="text-3xl">🔍</span>
          <p className="text-sm">Sonuç bulunamadı.</p>
          <p className="text-xs">
            Bu kriterlerle eşleşen karar yok. Arama terimlerini değiştirip tekrar deneyin.
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400 p-8 text-center">
        <span className="text-3xl">📊</span>
        <p className="text-sm">Henüz bir arama yapılmadı.</p>
        <p className="text-xs">Arama sekmesinden başlayabilirsin.</p>
      </div>
    );
  }

  const atLimit = selected.size >= LIMIT;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < LIMIT) next.add(id);
      return next;
    });
  };

  const selectFirst = () => setSelected(new Set(visible.slice(0, LIMIT).map((d) => d.id)));
  const clearSelection = () => setSelected(new Set());

  const handleSummaryPdf = () => download(decisions, keywords, 'summary');
  const handleCsv = () => exportCsv(filtered);

  // Tam metin gereken export'lar: önce (cache + ağ) çek, sonra üret.
  const runFullExport = async (format: 'pdf' | 'word') => {
    const ids = [...selected];
    await fetchFulltexts(ids); // job fazını 'fulltext'e çeker
    setPendingExport({ ids, format });
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      {job?.recordsTotal != null && job.recordsTotal > decisions.length && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          {recordsTotalLabel(decisions.length, job.recordsTotal)}. İstatistik ve seçim bu{' '}
          {decisions.length} karar üzerinden yapılır.
        </div>
      )}

      <StatisticsPanel
        result={result}
        years={yearFilter}
        chambers={chamberFilter}
        onToggleYear={toggleYear}
        onToggleChamber={toggleChamber}
        onClearFilters={clearFilters}
      />

      {/* Tam metin çekimi sürüyorsa ilerleme paneli */}
      {isFetching && job && <FulltextProgress job={job} onCancel={cancelFulltext} />}

      {/* Seçim listesi */}
      {!isFetching && (
        <div className="flex flex-col gap-2">
          {/* Aktif filtreler — seçim alanının üstünde de görünür */}
          <FilterChips
            years={yearFilter}
            chambers={chamberFilter}
            onToggleYear={toggleYear}
            onToggleChamber={toggleChamber}
            onClear={clearFilters}
          />

          {/* Sıralama */}
          <label className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
            Listelenen {visible.length} kararı sırala:
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded border border-slate-200 px-1 py-0.5 text-xs focus:border-brand-400 focus:outline-none"
            >
              <option value="none">Varsayılan</option>
              <option value="date-desc">Tarih (yeni → eski)</option>
              <option value="date-asc">Tarih (eski → yeni)</option>
              <option value="chamber">Daire</option>
            </select>
          </label>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              <strong className={atLimit ? 'text-amber-600' : 'text-slate-700'}>
                {selected.size}
              </strong>{' '}
              / {LIMIT} seçildi
              {filtered.length !== decisions.length && (
                <span className="ml-1 text-slate-400">({filtered.length} karar gösteriliyor)</span>
              )}
            </span>
            <div className="flex gap-2">
              <button className="text-brand-700 hover:underline" onClick={selectFirst}>
                İlk {LIMIT}'i seç
              </button>
              <button className="text-slate-500 hover:underline" onClick={clearSelection}>
                Temizle
              </button>
            </div>
          </div>

          <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
            {visible.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-slate-400">
                Bu filtreyle eşleşen karar yok.
              </p>
            )}
            {visible.map((d) => {
              const checked = selected.has(d.id);
              const disabled = !checked && atLimit;
              return (
                <label
                  key={d.id}
                  className={
                    'flex cursor-pointer items-start gap-2 px-2 py-1.5 text-xs ' +
                    (checked ? 'bg-brand-50' : disabled ? 'opacity-40' : 'hover:bg-slate-50')
                  }
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(d.id)}
                  />
                  <span className="flex flex-col">
                    <span className="font-medium text-slate-700">{d.chamber}</span>
                    <span className="text-slate-500">
                      {d.esasNo} · {d.kararNo} · {formatDateTR(d.date)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Dışa aktarma butonları */}
      {!isFetching && (
        <div className="flex flex-col gap-2">
          {/* Seçili kararların TAM METNİ (çekim gerekir) */}
          <p className="text-[11px] font-medium text-slate-500">Seçili kararların tam metni:</p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => runFullExport('pdf')}
              loading={pdfState === 'generating'}
              disabled={selected.size === 0 || pdfState === 'generating' || exportState === 'busy'}
            >
              PDF ({selected.size} karar)
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() => runFullExport('word')}
              loading={exportState === 'busy'}
              disabled={selected.size === 0 || pdfState === 'generating' || exportState === 'busy'}
            >
              Word ({selected.size} karar)
            </Button>
          </div>

          {/* Tüm listenin KÜNYESİ (anında, çekim yok) */}
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Künye listesi ({filtered.length} karar):
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="secondary"
              onClick={handleSummaryPdf}
              disabled={pdfState === 'generating'}
            >
              Künye PDF
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={handleCsv}
              disabled={exportState === 'busy' || filtered.length === 0}
            >
              CSV (Excel)
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => save(keywords, job?.criteria)}>
            ⭐ Aramayı Kaydet
          </Button>
        </div>
      )}

      {(pdfState === 'done' || exportState === 'done') && (
        <p className="text-center text-xs text-green-600">İndirildi!</p>
      )}
      {(pdfError || exportState === 'error') && (
        <p className="text-center text-xs text-red-600">{pdfError ?? 'Dışa aktarma başarısız.'}</p>
      )}
    </div>
  );
}

// ─── Tam metin ilerleme paneli ─────────────────────────────────────────────────

function FulltextProgress({
  job,
  onCancel,
}: {
  job: NonNullable<ReturnType<typeof useScraping>['job']>;
  onCancel: () => void;
}) {
  const { current, total } = job.fulltextProgress;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  // ETA: gerçek hıza göre (geçen süre ÷ biten × kalan). Yavaşlama olunca uzar.
  let etaText = 'hesaplanıyor…';
  if (job.fulltextStartedAt && current > 0 && current < total) {
    const elapsed = Date.now() - new Date(job.fulltextStartedAt).getTime();
    const remainingSec = Math.round(((elapsed / current) * (total - current)) / 1000);
    etaText =
      remainingSec >= 60
        ? `~${Math.floor(remainingSec / 60)} dk ${remainingSec % 60} sn`
        : `~${remainingSec} sn`;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-brand-100 bg-brand-50 p-3">
      <div className="flex items-center justify-between text-xs font-medium text-brand-800">
        <span>Seçili kararların tam metni çekiliyor…</span>
        <span>
          {current} / {total}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
        <div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-600">
        <span>Tahmini kalan süre: {etaText}</span>
        <button className="text-red-600 hover:underline" onClick={onCancel}>
          İptal
        </button>
      </div>

      {job.throttled && (
        <p className="text-[11px] text-amber-700">
          ⏳ Sunucu hız sınırı uyguladı; otomatik yavaşlatılıp devam ediliyor.
        </p>
      )}
    </div>
  );
}
