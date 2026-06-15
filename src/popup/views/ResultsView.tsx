import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import type { Decision } from '../../shared/types/Decision';
import type { View } from '../App';
import { STORAGE_LIMITS } from '../../shared/constants/storage';
import { formatDateTR } from '../../shared/utils/dateUtils';
import { useScraping } from '../hooks/useScraping';
import { useSavedStore } from '../store/saved.store';
import { usePdfDownload } from '../hooks/usePdfDownload';
import { useExport } from '../hooks/useExport';
import { usePreview } from '../hooks/usePreview';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useCollectionsStore } from '../store/collections.store';
import { useToastStore } from '../store/toast.store';
import { ReadingPane } from '../components/ReadingPane';
import { SaveDecisionModal } from '../components/SaveDecisionModal';
import { EmptyState } from '../components/EmptyState';
import { Segmented } from '../components/Segmented';
import { Icon } from '../components/Icon';

const LIMIT = STORAGE_LIMITS.maxFulltextPerPdf; // 25
const PAGE_SIZES = [10, 25, 50, 100] as const;

const shortChamber = (c: string) =>
  c.replace(' Dairesi', '.HD').replace(' Hukuk', '').replace('. Kurulu', ' Kur.');

const numOf = (s: string) => s.split('/').reduce((a, p) => a * 100000 + (parseInt(p, 10) || 0), 0);

type SortKey = 'none' | 'esas' | 'karar' | 'tarih';
type SortDir = 'asc' | 'desc';
type ExportFormat = 'pdf' | 'word';

export function ResultsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { job, loadMore, fetchFulltexts, cancelFulltext } = useScraping();
  const { save: saveSearch } = useSavedStore();
  const { state: pdfState, download, reset: resetPdf } = usePdfDownload();
  const { state: exportState, exportWord, reset: resetExport } = useExport();
  const preview = usePreview();
  const isNarrow = useMediaQuery('(max-width: 760px)');
  const { saved, categories } = useCollectionsStore();
  const pushToast = useToastStore((s) => s.push);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveTarget, setSaveTarget] = useState<Decision[] | null>(null);
  const [searchSaved, setSearchSaved] = useState(false);
  const [recentId, setRecentId] = useState<string | null>(null); // detaydan dönülen satır (1 sn flash)
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [chamberSel, setChamberSel] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('none');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [pendingExport, setPendingExport] = useState<{ ids: string[]; format: ExportFormat } | null>(null);

  const decisions: Decision[] = useMemo(() => job?.decisions ?? [], [job]);
  const keywords = useMemo(() => job?.keywords ?? [], [job]);
  const include = keywords;
  const exclude = job?.criteria?.excludeKeywords ?? [];

  // Koleksiyon: kayıtlı id → kategori rengi.
  const catColor = useMemo(() => new Map(categories.map((c) => [c.id, c.color])), [categories]);
  const savedCat = useMemo(() => new Map(saved.map((s) => [s.id, s.categoryIds[0]])), [saved]);
  const savedCount = useMemo(() => new Map(saved.map((s) => [s.id, s.categoryIds.length])), [saved]);
  const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved]);
  // Tek kategorideyse o kategorinin rengi; çok kategorideyse renk yok (sayı gösterilir).
  const colorOf = (id: string) => {
    if ((savedCount.get(id) ?? 0) !== 1) return undefined;
    const c = savedCat.get(id);
    return c ? catColor.get(c) : undefined;
  };
  const countOf = (id: string) => savedCount.get(id) ?? 0;

  // Daire filtresi seçenekleri: yüklenen kararlardaki benzersiz daireler (çoktan aza).
  const chamberFilters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of decisions) counts.set(d.chamber, (counts.get(d.chamber) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [decisions]);

  // Filtre veya sıralama = "yüklenenleri rafine et" modu (lazy-load durur). Hiçbiri
  // yokken site sırasında tüm recordsTotal boyunca sayfalanır (ileriye gidince blok çekilir).
  const isRefining = chamberSel.size > 0 || !!dateFrom || !!dateTo || sortKey !== 'none';
  const activeFilterCount =
    chamberSel.size + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (sortKey !== 'none' ? 1 : 0);

  const filtered = useMemo(() => {
    let list = decisions;
    if (chamberSel.size) list = list.filter((d) => chamberSel.has(d.chamber));
    if (dateFrom) list = list.filter((d) => d.date >= dateFrom);
    if (dateTo) list = list.filter((d) => d.date <= dateTo);
    if (sortKey !== 'none') {
      list = [...list].sort((a, b) => {
        const av = sortKey === 'tarih' ? a.date : numOf(sortKey === 'esas' ? a.esasNo : a.kararNo);
        const bv = sortKey === 'tarih' ? b.date : numOf(sortKey === 'esas' ? b.esasNo : b.kararNo);
        const c = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'desc' ? -c : c;
      });
    }
    return list;
  }, [decisions, chamberSel, dateFrom, dateTo, sortKey, sortDir]);

  const recordsTotal = job?.recordsTotal ?? decisions.length;
  // Sayfa sayısı:
  //  - rafine modda: yüklenen eşleşenler.
  //  - daha çekilebilirken: sitedeki toplam üzerinden OPTİMİSTİK (ör. 29.320/100=294).
  //  - sunucu tükendiğinde (boş/eksik blok): yalnızca gerçekten erişilebilen kadar
  //    (site derin sayfalarda kapatırsa "/294" gerçek sayıya düşer, hayalet sayfa kalmaz).
  const loadedPages = Math.max(1, Math.ceil(decisions.length / pageSize));
  const totalPages = isRefining
    ? Math.max(1, Math.ceil(filtered.length / pageSize))
    : job?.canLoadMore
      ? Math.max(loadedPages, Math.ceil(recordsTotal / pageSize))
      : loadedPages;
  const exhaustedBelowTotal = !isRefining && !job?.canLoadMore && decisions.length < recordsTotal;
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);
  const atLimit = selected.size >= LIMIT;
  const isLoadingMore = job?.phase === 'metadata' && decisions.length > 0;

  const openDecision = preview.previewId ? decisions.find((d) => d.id === preview.previewId) ?? null : null;
  const hasOpen = openDecision != null;

  // Yeni arama → sıfırla.
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    setSearchSaved(false);
  }, [job?.id]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Detaydan dönülen satırın flash'ını ~3 sn sonra temizle (tek sefer oynar).
  useEffect(() => {
    if (!recentId) return;
    const t = setTimeout(() => setRecentId(null), 3000);
    return () => clearTimeout(t);
  }, [recentId]);

  // Rafine modda DEĞİLKEN, görüntülenen sayfa yüklenenleri aşınca sonraki bloğu
  // tembel çek (429 koruması: loadError'da dur, "Tekrar dene" bekler).
  useEffect(() => {
    if (isRefining) return;
    if (page * pageSize > decisions.length && job?.canLoadMore && job.phase === 'complete' && !job.loadError) {
      void loadMore();
    }
  }, [page, pageSize, decisions.length, isRefining, job?.canLoadMore, job?.phase, job?.loadError, loadMore]);

  // Tam metin çekimi bitince seçilenleri PDF/Word üret.
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

  // ── Boş / yükleniyor durumları (split yerine tam-yüzey) ──
  if (!job || decisions.length === 0) {
    if (job?.phase === 'metadata') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-fg-3">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
          <p className="text-sm">Aranıyor…</p>
        </div>
      );
    }
    return (
      <EmptyState
        icon={job?.phase === 'complete' ? 'search' : 'layers'}
        title={job?.phase === 'complete' ? 'Sonuç bulunamadı' : 'Henüz arama yapılmadı'}
        body={job?.phase === 'complete' ? 'Bu kriterlerle eşleşen karar yok. Terimleri değiştirip tekrar deneyin.' : 'Arama sekmesinden başlayabilirsin.'}
      />
    );
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else if (n.size < LIMIT) n.add(id);
      return n;
    });
  const selectFirst = () => setSelected(new Set(filtered.slice(0, LIMIT).map((d) => d.id)));
  const clearSel = () => setSelected(new Set());

  const runFullExport = async (format: ExportFormat) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    resetPdf();
    resetExport();
    setExporting(format);
    await fetchFulltexts(ids);
    setPendingExport({ ids, format });
  };
  const closeExport = () => {
    if (pdfState === 'done' || exportState === 'done') {
      pushToast(`${exporting === 'pdf' ? 'PDF' : 'Word'} indirildi`);
    }
    setExporting(null);
    resetPdf();
    resetExport();
  };
  const cancelExport = () => {
    void cancelFulltext();
    setPendingExport(null);
    setExporting(null);
  };

  // Önizleme aç/kapat: kapanınca çıkılan satırı 1 sn flash'la işaretle.
  const openPreview = (id: string) => {
    setRecentId(null);
    preview.open(id);
  };
  const closePreview = () => {
    setRecentId(preview.previewId);
    preview.close();
  };

  // Reading pane aksiyonları.
  const copyText = () => {
    if (preview.text)
      void navigator.clipboard
        .writeText(preview.text)
        .then(() => pushToast('Karar metni panoya kopyalandı'))
        .catch(() => {});
  };
  const pdfThis = () => {
    if (openDecision && preview.text) void download([{ ...openDecision, fullText: preview.text }], keywords);
  };

  return (
    <div className="relative flex min-h-0 flex-1">
      {/* SOL %30 — sonuç listesi */}
      {!(isNarrow && hasOpen) && (
        <section
          className={clsx(
            'flex min-h-0 flex-col border-r border-line bg-surface',
            isNarrow ? 'flex-1' : 'shrink-0 grow-0 basis-[clamp(310px,33%,430px)]',
          )}
        >
          {/* Özet */}
          <div className="border-b border-line px-4 pb-2.5 pt-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {include.map((k) => (
                <span key={k} className="rounded-[7px] bg-accent-weak px-2.5 py-1 text-xs font-medium text-accent-text">
                  {k}
                </span>
              ))}
              {exclude.map((k) => (
                <span key={k} className="rounded-[7px] bg-danger-weak px-2.5 py-1 text-xs font-medium text-danger">
                  − {k}
                </span>
              ))}
              <button
                onClick={() => onNavigate('search')}
                title="Aramayı düzenle"
                className="grid h-6 w-6 place-items-center rounded-md border border-line bg-surface text-fg-3 transition-colors hover:border-line-2 hover:bg-surface-2 hover:text-accent-text"
              >
                <Icon name="pencil" size={13} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[11.5px] text-fg-3">
                Sitede <b className="font-semibold text-fg-2">{recordsTotal.toLocaleString('tr-TR')}</b> karar ·{' '}
                {decisions.length}{' '}
                {exhaustedBelowTotal ? 'erişilebildi (site sınırı)' : 'yüklendi'}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={async () => {
                    if (searchSaved) return;
                    await saveSearch(keywords, job?.criteria);
                    setSearchSaved(true);
                    pushToast('Arama "Kayıtlı"ya eklendi');
                  }}
                  title={searchSaved ? 'Arama kaydedildi' : 'Aramayı kaydet'}
                  className={
                    'grid h-6 w-6 place-items-center rounded-md transition-colors ' +
                    (searchSaved ? 'text-accent' : 'text-fg-3 hover:bg-surface-2 hover:text-accent-text')
                  }
                >
                  <Icon name="star" size={14} style={searchSaved ? { fill: 'currentColor' } : undefined} />
                </button>
                <button
                  onClick={() => onNavigate('search')}
                  title="Aramadan çık (yeni arama)"
                  className="grid h-6 w-6 place-items-center rounded-md text-fg-3 transition-colors hover:bg-danger-weak hover:text-danger"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Filtre accordion */}
          <div className="border-b border-line">
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12.5px] font-medium text-fg-2 transition-colors hover:text-fg"
            >
              <Icon name="sliders" size={16} />
              <span>Filtreler</span>
              {activeFilterCount > 0 && (
                <em className="grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent px-1.5 text-[10px] font-semibold not-italic tabular-nums text-on-accent">
                  {activeFilterCount}
                </em>
              )}
              <span className="flex-1" />
              <Icon name="chevronDown" size={15} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>
            {filtersOpen && (
              <div className="flex flex-col gap-3.5 border-t border-line bg-surface-2 px-4 pb-4 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-2">Daireler</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setChamberSel(new Set());
                        setDateFrom('');
                        setDateTo('');
                        setSortKey('none');
                      }}
                      className="text-[11px] text-fg-3 hover:text-danger"
                    >
                      Temizle
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {chamberFilters.length === 0 && (
                    <span className="text-[11.5px] text-fg-3">Daire bilgisi yok.</span>
                  )}
                  {chamberFilters.map(([c, n]) => {
                    const on = chamberSel.has(c);
                    return (
                      <button
                        key={c}
                        title={`${c} · ${n} karar`}
                        onClick={() =>
                          setChamberSel((prev) => {
                            const next = new Set(prev);
                            next.has(c) ? next.delete(c) : next.add(c);
                            return next;
                          })
                        }
                        className={clsx(
                          'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                          on ? 'border-accent bg-accent text-on-accent' : 'border-line-2 bg-surface text-fg-2 hover:border-accent hover:text-fg',
                        )}
                      >
                        {shortChamber(c)}
                        <span className={clsx('tabular-nums', on ? 'text-on-accent' : 'text-fg-faint')}>{n}</span>
                        {on && <Icon name="check" size={11} stroke={2.4} />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-fg-2">Karar tarihi</label>
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line-2 bg-surface px-2 py-1.5 font-mono text-xs text-fg-2 focus:border-accent focus:outline-none" />
                    <span className="text-fg-3">–</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line-2 bg-surface px-2 py-1.5 font-mono text-xs text-fg-2 focus:border-accent focus:outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-fg-2">Sıralama</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Segmented
                      size="sm"
                      value={sortKey}
                      onChange={setSortKey}
                      options={[
                        { value: 'esas', label: 'Esas' },
                        { value: 'karar', label: 'Karar' },
                        { value: 'tarih', label: 'Tarih' },
                      ]}
                    />
                    <button
                      onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                      className="inline-flex items-center gap-1 rounded-lg border border-line-2 bg-surface px-2.5 py-1.5 text-[11px] text-fg-2 hover:border-line-strong"
                    >
                      <Icon name="chevronDown" size={14} style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none' }} />
                      {sortDir === 'desc' ? 'Yeni→Eski' : 'Eski→Yeni'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <div className="inline-flex gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5">
              {PAGE_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPageSize(s);
                    setPage(1);
                  }}
                  className={clsx(
                    'rounded-md px-2.5 py-1 text-[11.5px] font-medium tabular-nums transition-colors',
                    pageSize === s ? 'bg-surface text-fg shadow-sm' : 'text-fg-3 hover:text-fg-2',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {selected.size > 0 ? (
              <button onClick={clearSel} className="whitespace-nowrap text-[11.5px] font-medium text-accent-text hover:underline">
                Temizle
              </button>
            ) : (
              <button onClick={selectFirst} className="whitespace-nowrap text-[11.5px] font-medium text-accent-text hover:underline">
                İlk {LIMIT}'i seç
              </button>
            )}
          </div>

          {/* Satırlar */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {pageRows.map((d, i) => (
              <DecisionRow
                key={d.id}
                index={pageStart + i + 1}
                d={d}
                checked={selected.has(d.id)}
                active={preview.previewId === d.id}
                recent={recentId === d.id}
                savedColor={colorOf(d.id)}
                savedCount={countOf(d.id)}
                atLimit={atLimit}
                onToggle={() => toggle(d.id)}
                onOpen={() => openPreview(d.id)}
                onSave={() => setSaveTarget([d])}
              />
            ))}
            {pageRows.length === 0 && isLoadingMore && (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-fg-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
                Sonraki blok çekiliyor…
              </div>
            )}
            {pageRows.length === 0 && !isLoadingMore && job?.loadError && (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-xs">
                <p className="text-fg-3">Yüklenemedi (sunucu yoğun olabilir).</p>
                <button onClick={() => void loadMore()} className="rounded-md bg-accent px-3 py-1 font-medium text-on-accent hover:bg-accent-hover">
                  Tekrar dene
                </button>
              </div>
            )}
            {pageRows.length === 0 && !isLoadingMore && !job?.loadError && (
              <p className="px-5 py-8 text-center text-[12.5px] text-fg-3">
                {isRefining ? 'Bu filtrelerle eşleşen karar yok.' : 'Gösterilecek karar yok.'}
              </p>
            )}
          </div>

          {/* Pager */}
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="grid h-[30px] w-[30px] place-items-center rounded-md border border-line bg-surface text-fg-2 transition-colors enabled:hover:border-line-2 enabled:hover:bg-surface-2 disabled:opacity-30"
            >
              <Icon name="chevronLeft" size={15} />
            </button>
            <span className="font-mono text-xs text-fg-3">
              Sayfa <b className="text-fg">{safePage}</b> / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="grid h-[30px] w-[30px] place-items-center rounded-md border border-line bg-surface text-fg-2 transition-colors enabled:hover:border-line-2 enabled:hover:bg-surface-2 disabled:opacity-30"
            >
              <Icon name="chevronRight" size={15} />
            </button>
          </div>
        </section>
      )}

      {/* SAĞ %70 — okuma paneli */}
      {!(isNarrow && !hasOpen) && (
        <section className="flex min-h-0 flex-1 flex-col bg-bg">
          {openDecision ? (
            <ReadingPane
              decision={openDecision}
              terms={include}
              state={preview.state}
              text={preview.text}
              saved={savedIds.has(openDecision.id)}
              savedColor={colorOf(openDecision.id)}
              backMode={isNarrow}
              pdfBusy={pdfState === 'generating'}
              onClose={closePreview}
              onSave={() => setSaveTarget([openDecision])}
              onCopy={copyText}
              onPdf={pdfThis}
            />
          ) : (
            <EmptyState
              icon="textT"
              title="Okumak için bir karar seçin"
              body="Soldaki listeden bir karara tıkladığınızda tam metni burada açılır; arama terimleri vurgulanır."
            />
          )}
        </section>
      )}

      {/* Floating action bar */}
      {selected.size > 0 && (
        <div className="absolute bottom-[22px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-[14px] border border-line-2 bg-surface py-2 pl-4 pr-2.5 shadow-lg">
          <div className="flex items-baseline gap-1.5 text-[12.5px] text-fg-2">
            <span className="text-sm font-bold tabular-nums text-fg">{selected.size}</span>
            <span>karar seçildi</span>
            <span className="text-[11px] tabular-nums text-fg-faint">/ {LIMIT}</span>
          </div>
          <span className="h-[22px] w-px bg-line-2" />
          <FabBtn variant="primary" icon="pdf" label="PDF" onClick={() => runFullExport('pdf')} />
          <FabBtn variant="outline" icon="word" label="Word" onClick={() => runFullExport('word')} />
          <FabBtn variant="ghost" icon="bookmark" label="Koleksiyona ekle" onClick={() => setSaveTarget([...selected].map((id) => decisions.find((d) => d.id === id)).filter(Boolean) as Decision[])} />
          <span className="h-[22px] w-px bg-line-2" />
          <button onClick={clearSel} title="Seçimi temizle" className="grid h-[30px] w-[30px] place-items-center rounded-lg text-fg-3 transition-colors hover:bg-surface-3 hover:text-fg">
            <Icon name="x" size={15} />
          </button>
        </div>
      )}

      {saveTarget && saveTarget.length > 0 && (
        <SaveDecisionModal decisions={saveTarget} keywords={keywords} onClose={() => setSaveTarget(null)} />
      )}

      {exporting && (
        <ExportProgress
          format={exporting}
          fetching={job?.phase === 'fulltext'}
          generating={pdfState === 'generating' || exportState === 'busy'}
          done={pdfState === 'done' || exportState === 'done'}
          error={pdfState === 'error' || exportState === 'error'}
          current={job?.fulltextProgress.current ?? 0}
          total={job?.fulltextProgress.total ?? 0}
          startedAt={job?.fulltextStartedAt ?? null}
          throttled={!!job?.throttled}
          onCancel={cancelExport}
          onClose={closeExport}
        />
      )}
    </div>
  );
}

/* ── Floating bar butonu ── */
function FabBtn({ variant, icon, label, onClick }: { variant: 'primary' | 'outline' | 'ghost'; icon: 'pdf' | 'word' | 'bookmark'; label: string; onClick: () => void }) {
  const cls =
    variant === 'primary'
      ? 'bg-accent text-on-accent hover:bg-accent-hover'
      : variant === 'outline'
        ? 'border border-line-2 bg-surface text-fg hover:bg-surface-2'
        : 'text-fg-2 hover:bg-surface-3 hover:text-fg';
  return (
    <button onClick={onClick} className={'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ' + cls}>
      <Icon name={icon} size={15} /> {label}
    </button>
  );
}

/* ── Karar satırı ── */
function DecisionRow({
  index,
  d,
  checked,
  active,
  recent,
  savedColor,
  savedCount,
  atLimit,
  onToggle,
  onOpen,
  onSave,
}: {
  index: number;
  d: Decision;
  checked: boolean;
  active: boolean;
  recent: boolean;
  savedColor?: string;
  savedCount: number;
  atLimit: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onSave: () => void;
}) {
  const disabled = !checked && atLimit;
  const saved = savedCount > 0;
  return (
    <div
      onClick={onOpen}
      className={clsx(
        'group flex cursor-pointer items-start gap-2.5 border-b border-l-2 border-line py-2.5 pl-3.5 pr-4 transition-colors',
        active ? 'border-l-accent bg-accent-weak' : 'border-l-transparent hover:bg-surface-2',
        checked && !active && 'bg-accent-weak',
        recent && !active && 'row-flash',
      )}
    >
      <span
        className={clsx(
          'mt-px min-w-[1.5rem] shrink-0 select-none text-right font-mono text-[11px] tabular-nums leading-[19px]',
          active ? 'text-accent-text' : 'text-fg-faint',
        )}
      >
        {index}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onToggle();
        }}
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        className={clsx(
          'mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors',
          checked ? 'border-accent bg-accent text-on-accent' : 'border-line-strong bg-surface hover:border-accent',
          disabled && 'opacity-30',
        )}
      >
        {checked && <Icon name="check" size={12} stroke={2.4} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.01em] text-fg">
          {savedCount >= 2 ? (
            <span
              className="shrink-0 rounded-full bg-accent-weak px-1.5 text-[10px] font-semibold tabular-nums text-accent-text"
              title={`${savedCount} kategoride`}
            >
              +{savedCount}
            </span>
          ) : (
            savedColor && (
              <span
                className="h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: savedColor }}
                title="Koleksiyonda"
              />
            )
          )}
          <span className="truncate">{d.chamber}</span>
        </div>
        <div className="mt-[3px] font-mono text-[11.5px] text-fg-3">
          {d.esasNo} · {d.kararNo} · {formatDateTR(d.date)}
        </div>
      </div>
      <div className={clsx('flex shrink-0 gap-px transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          title={saved ? 'Koleksiyonda — düzenle' : 'Koleksiyona kaydet'}
          className={
            'grid h-[27px] w-[27px] place-items-center rounded-md transition-colors hover:bg-surface-3 ' +
            (saved ? 'text-accent' : 'text-fg-3 hover:text-accent-text')
          }
        >
          <Icon name="bookmark" size={15} style={saved ? { fill: 'currentColor' } : undefined} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          title="Önizle"
          className="grid h-[27px] w-[27px] place-items-center rounded-md text-fg-3 transition-colors hover:bg-surface-3 hover:text-accent-text"
        >
          <Icon name="eye" size={15} />
        </button>
      </div>
    </div>
  );
}

/* ── Export ilerleme + ETA modalı ── */
function ExportProgress({
  format,
  fetching,
  generating,
  done,
  error,
  current,
  total,
  startedAt,
  throttled,
  onCancel,
  onClose,
}: {
  format: ExportFormat;
  fetching: boolean;
  generating: boolean;
  done: boolean;
  error: boolean;
  current: number;
  total: number;
  startedAt: string | null;
  throttled: boolean;
  onCancel: () => void;
  onClose: () => void;
}) {
  const label = format === 'pdf' ? 'PDF' : 'Word';
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  let eta = 'hesaplanıyor…';
  if (startedAt && current > 0 && current < total) {
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const rem = Math.round(((elapsed / current) * (total - current)) / 1000);
    eta = rem >= 60 ? `~${Math.floor(rem / 60)} dk ${rem % 60} sn` : `~${rem} sn`;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--scrim)] p-6">
      <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-xl border border-line-2 bg-surface p-[22px] shadow-lg">
        {done ? (
          <>
            <div className="flex items-start gap-3.5">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                <Icon name="check" size={18} stroke={2.6} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">{label} hazır</p>
                <p className="mt-1 text-xs leading-relaxed text-fg-3">Seçili kararların tam metni indirildi. Anahtar kelimeler vurgulandı.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-on-accent hover:bg-accent-hover">
                Kapat
              </button>
            </div>
          </>
        ) : error ? (
          <>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg">Dışa aktarma başarısız</p>
              <p className="mt-1 text-xs text-fg-3">Bir hata oluştu. Tekrar deneyebilirsiniz.</p>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="rounded-md border border-line-2 bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-2">
                Kapat
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3.5">
              <span className="h-[26px] w-[26px] shrink-0 animate-spin rounded-full border-[2.5px] border-accent-weak-2 border-t-accent" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">
                  {generating ? `${label} oluşturuluyor…` : 'Seçili kararların tam metni çekiliyor…'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-fg-3">
                  {generating ? 'Belge hazırlanıyor, birazdan inecek.' : `${label} için ${total} kararın metni Yargıtay'dan indiriliyor.`}
                </p>
              </div>
            </div>
            {fetching && (
              <>
                <div className="h-[7px] overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: pct + '%' }} />
                </div>
                <div className="flex justify-between font-mono text-[11.5px] text-fg-3">
                  <span><b className="text-fg">{current}</b> / {total}</span>
                  <span>Tahmini kalan: {eta}</span>
                </div>
                {throttled && (
                  <p className="text-[11.5px] text-warn">Sunucu hız sınırı uyguladı (429); otomatik yavaşlatılıp devam ediliyor.</p>
                )}
                <div className="flex justify-end">
                  <button onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs font-medium text-fg-2 hover:bg-surface-3">
                    İptal
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
