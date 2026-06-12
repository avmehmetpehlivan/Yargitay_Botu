import { useEffect, useState } from 'react';
import type { Decision } from '../../shared/types/Decision';
import { STORAGE_LIMITS } from '../../shared/constants/storage';
import { formatDateTR } from '../../shared/utils/dateUtils';
import { useScraping } from '../hooks/useScraping';
import { useSavedStore } from '../store/saved.store';
import { usePdfDownload } from '../hooks/usePdfDownload';
import { useExport } from '../hooks/useExport';
import { DecisionPreview } from '../components/DecisionPreview';
import { usePreview } from '../hooks/usePreview';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Button } from '../components/common/Button';

// Kırılım: ≥800px'te detay listenin sağında (split), altında tam-yüzey katman açılır.
const SPLIT_QUERY = '(min-width: 800px)';

const LIMIT = STORAGE_LIMITS.maxFulltextPerPdf; // 25
const PAGE_SIZES = [10, 25, 50, 100] as const;

type PendingExport = { ids: string[]; format: 'pdf' | 'word' };

export function ResultsView() {
  const { job, loadMore, fetchFulltexts, cancelFulltext } = useScraping();
  const { save } = useSavedStore();
  const { state: pdfState, error: pdfError, download } = usePdfDownload();
  const { state: exportState, exportWord } = useExport();
  const preview = usePreview();
  const isWide = useMediaQuery(SPLIT_QUERY);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingExport, setPendingExport] = useState<PendingExport | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1); // 1-tabanlı

  const decisions: Decision[] = job?.decisions ?? [];
  const keywords: string[] = job?.keywords ?? [];
  const isExporting = job?.phase === 'fulltext';
  const isLoadingMore = job?.phase === 'metadata' && decisions.length > 0;

  // Listelenebilecek toplam = min(sitedeki toplam, ayar üst sınırı).
  const effectiveTotal = job?.effectiveTotal ?? decisions.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  // Yeni arama → sayfayı başa al.
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [job?.id]);

  // Sayfa, toplam sayfa sayısını aşarsa kıstır (ör. pageSize büyüyünce).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Görüntülenecek sayfa için yeterli karar çekilmemişse sonraki bloğu iste.
  // loadError varsa (ör. 429) otomatik denemeyiz — kullanıcı "Tekrar dene" der.
  useEffect(() => {
    const needed = page * pageSize;
    if (needed > decisions.length && job?.canLoadMore && job.phase === 'complete' && !job.loadError) {
      void loadMore();
    }
  }, [page, pageSize, decisions.length, job?.canLoadMore, job?.phase, job?.loadError, loadMore]);

  // Tam metin çekimi bitince (faz 'complete') seçilenleri PDF/Word olarak üret.
  useEffect(() => {
    if (!pendingExport || job?.phase !== 'complete') return;
    const byId = new Map(decisions.map((d) => [d.id, d]));
    const picked = pendingExport.ids.map((id) => byId.get(id)).filter(Boolean) as Decision[];
    const fmt = pendingExport.format;
    setPendingExport(null);
    if (picked.length === 0) return;
    if (fmt === 'pdf') void download(picked, keywords);
    else void exportWord(picked, keywords);
  }, [job?.phase, pendingExport, decisions, keywords, download, exportWord]);

  // ── Boş durumlar ────────────────────────────────────────────────────────
  if (!job || (job.phase === 'idle')) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
        <span className="text-3xl">📋</span>
        <p className="text-sm">Henüz bir arama yapılmadı.</p>
        <p className="text-xs">Arama sekmesinden başlayabilirsin.</p>
      </div>
    );
  }
  if (decisions.length === 0) {
    if (job.phase === 'metadata') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          <p className="text-sm">Aranıyor…</p>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
        <span className="text-3xl">🔍</span>
        <p className="text-sm">Sonuç bulunamadı.</p>
        <p className="text-xs">Bu kriterlerle eşleşen karar yok. Terimleri değiştirip tekrar deneyin.</p>
      </div>
    );
  }

  const atLimit = selected.size >= LIMIT;
  const previewDecision = preview.previewId
    ? decisions.find((d) => d.id === preview.previewId) ?? null
    : null;

  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageDecisions = decisions.slice(pageStart, pageStart + pageSize);
  const recordsTotal = job.recordsTotal ?? decisions.length;
  // ≥800px + açık önizleme → detay listenin sağında (split); değilse tam-yüzey katman.
  const isSplit = isWide && previewDecision != null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < LIMIT) next.add(id);
      return next;
    });
  };
  const selectFirst = () => setSelected(new Set(decisions.slice(0, LIMIT).map((d) => d.id)));
  const clearSelection = () => setSelected(new Set());

  // Tam metin gereken export'lar: önce (cache + ağ) çek, sonra üret.
  const runFullExport = async (format: 'pdf' | 'word') => {
    const ids = [...selected];
    await fetchFulltexts(ids); // job fazını 'fulltext'e çeker
    setPendingExport({ ids, format });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      {/* Toplam bilgisi */}
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        Sitede <strong className="text-slate-800">{recordsTotal}</strong> karar bulundu
      </div>

      {/* Tam metin (export) çekimi sürüyorsa ilerleme paneli */}
      {isExporting && job && <FulltextProgress job={job} onCancel={cancelFulltext} />}

      {/* Gövde: dar/orta panelde tek sütun; ≥992px + önizleme açıkken sol liste / sağ detay */}
      {!isExporting && (
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {/* Sayfa boyutu */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span>Sayfada:</span>
            {PAGE_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setPageSize(s);
                  setPage(1);
                }}
                className={
                  'rounded px-2 py-0.5 transition-colors ' +
                  (pageSize === s
                    ? 'bg-brand-600 font-medium text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }
              >
                {s}
              </button>
            ))}
          </div>

          {/* Seçim sayacı */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              <strong className={atLimit ? 'text-amber-600' : 'text-slate-700'}>{selected.size}</strong>{' '}
              / {LIMIT} seçildi
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

          {/* Liste */}
          <div className="min-h-[8rem] flex-1 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
            {pageDecisions.map((d) => {
              const checked = selected.has(d.id);
              const disabled = !checked && atLimit;
              return (
                <div
                  key={d.id}
                  className={
                    'flex items-start gap-2 px-2 py-1.5 text-xs ' +
                    (checked ? 'bg-brand-50' : 'hover:bg-slate-50')
                  }
                >
                  <label
                    className={
                      'flex min-w-0 flex-1 cursor-pointer items-start gap-2 ' +
                      (disabled ? 'opacity-40' : '')
                    }
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(d.id)}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-slate-700">{d.chamber}</span>
                      <span className="text-slate-500">
                        {d.esasNo} · {d.kararNo} · {formatDateTR(d.date)}
                      </span>
                    </span>
                  </label>
                  <button
                    onClick={() => preview.open(d.id)}
                    title="Kararı önizle"
                    aria-label="Kararı önizle"
                    className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-brand-700"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {isLoadingMore && pageDecisions.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-2 py-6 text-xs text-slate-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
                Sonraki karar bloğu çekiliyor…
              </div>
            )}

            {!isLoadingMore && pageDecisions.length === 0 && job.loadError && (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center text-xs">
                <span className="text-2xl">⏳</span>
                <p className="text-slate-500">
                  Bu sayfa yüklenemedi. Sunucu yoğun olabilir (429); birkaç saniye sonra tekrar deneyin.
                </p>
                <button
                  onClick={() => void loadMore()}
                  className="rounded-md bg-brand-600 px-3 py-1 font-medium text-white hover:bg-brand-700"
                >
                  Tekrar dene
                </button>
              </div>
            )}
          </div>

          {/* Sayfalama */}
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded px-2 py-1 text-slate-600 enabled:hover:bg-slate-100 disabled:opacity-30"
            >
              ◀ Önceki
            </button>
            <span className="flex items-center gap-1.5 text-slate-500">
              Sayfa <strong className="text-slate-700">{safePage}</strong> / {totalPages}
              {isLoadingMore && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
              )}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded px-2 py-1 text-slate-600 enabled:hover:bg-slate-100 disabled:opacity-30"
            >
              Sonraki ▶
            </button>
          </div>
        </div>
            {/* Dışa aktarma — sol sütunun altında */}
            <div className="flex flex-col gap-2">
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

              <Button variant="ghost" size="sm" onClick={() => save(keywords, job?.criteria)}>
                ⭐ Aramayı Kaydet
              </Button>

              {(pdfState === 'done' || exportState === 'done') && (
                <p className="text-center text-xs text-green-600">İndirildi!</p>
              )}
              {(pdfError || exportState === 'error') && (
                <p className="text-center text-xs text-red-600">{pdfError ?? 'Dışa aktarma başarısız.'}</p>
              )}
            </div>
          </div>

          {/* Sağ pane: ≥992px'te karar detayı listenin sağında açılır */}
          {isSplit && previewDecision && (
            <div className="flex min-h-0 flex-[1.4]">
              <DecisionPreview
                decision={previewDecision}
                keywords={keywords}
                state={preview.state}
                text={preview.text}
                onClose={preview.close}
                inline
              />
            </div>
          )}
        </div>
      )}

      {/* Dar/orta panel: tam-yüzey katman (geri tuşuyla listeye dönülür) */}
      {!isWide && previewDecision && (
        <DecisionPreview
          decision={previewDecision}
          keywords={keywords}
          state={preview.state}
          text={preview.text}
          onClose={preview.close}
        />
      )}
    </div>
  );
}

// ─── Tam metin (export) ilerleme paneli ────────────────────────────────────────

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
