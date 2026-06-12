import type { ScrapingJob, Decision, DecisionMetadata } from '../shared/types/Decision';
import type { ContentToBackground } from '../shared/types/Messages';
import type { SearchCriteria } from '../shared/types/SearchCriteria';
import type { SearchResult } from '../shared/types/SearchResult';
import { generateId } from '../shared/utils/textUtils';
import { isoNow } from '../shared/utils/dateUtils';
import { getCachedFulltexts, putFulltexts } from '../shared/utils/fulltextCache';

type JobPhase = ScrapingJob['phase'];

/**
 * Content script'in tab'da çalıştığından emin olur.
 * Önce PING ile yoklar; cevap yoksa content.js'i chrome.scripting ile enjekte
 * eder. Content script tarafındaki GLOBAL_FLAG çift kayıt yapılmasını engeller.
 */
async function ensureContentScript(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    return; // zaten yüklü
  } catch {
    // yüklü değil — aşağıda enjekte ediyoruz
  }

  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  // Dinleyicinin kaydolması için kısa bir nefes
  await new Promise((resolve) => setTimeout(resolve, 300));
}

export class ScrapingOrchestrator {
  private job: ScrapingJob | null = null;
  private tabId: number | null = null;
  private metadataDecisions: DecisionMetadata[] = []; // çekilen tüm blokların metadata'sı
  private startedAt = 0;
  private cachedCount = 0; // tam metin fazında cache'ten gelen sayı (ilerleme tabanı)

  onComplete: ((result: SearchResult) => void) | null = null;
  onError:    ((error: string) => void) | null = null;

  // ─── Public API ──────────────────────────────────────────────────────────

  start(tabId: number, criteria: SearchCriteria): void {
    this.tabId = tabId;
    this.metadataDecisions = [];
    this.startedAt = Date.now();

    this.job = {
      id: generateId(),
      keywords: criteria.keywords,
      criteria,
      phase: 'metadata',
      metadataProgress: { current: 0, total: 0 },
      fulltextProgress: { current: 0, total: 0 },
      decisions: [],
      startedAt: isoNow(),
      error: null,
    };

    void this.beginBlock(); // ilk blok (100 karar)
  }

  /**
   * Kullanıcı sayfalarken çekilenden sonraki bloğu getirir (talep üzerine).
   * Zaten meşgulse veya çekilecek karar kalmadıysa hiçbir şey yapmaz.
   */
  loadMore(tabId: number): void {
    if (!this.job) return;
    if (this.job.phase === 'metadata' || this.job.phase === 'fulltext') return; // meşgul
    if (!this.job.canLoadMore) return;
    this.tabId = tabId;
    this.job.loadError = undefined; // yeni deneme: önceki hata temizlenir
    this.setPhase('metadata');
    void this.beginBlock();
  }

  /**
   * Çekilmiş karar sayısından (offset) başlayarak bir sonraki bloğu ister.
   * Content script yüklü değilse chrome.scripting ile enjekte eder.
   */
  private async beginBlock(): Promise<void> {
    if (!this.job || this.tabId == null) return;
    const criteria = this.job.criteria;
    if (!criteria) return;
    try {
      await ensureContentScript(this.tabId);
      await chrome.tabs.sendMessage(this.tabId, {
        action: 'SCRAPE_BLOCK',
        criteria,
        startOffset: this.metadataDecisions.length,
      });
    } catch {
      this.fail(
        'Content script sayfaya yüklenemedi. Lütfen Yargıtay Karar Arama sayfasını ' +
          '(F5) yenileyip tekrar deneyin.',
      );
    }
  }

  stop(): void {
    if (this.tabId) {
      chrome.tabs.sendMessage(this.tabId, { action: 'STOP' }).catch(() => {});
    }

    // Tam metin fazında iptal: çekimi durdur ama metadata sonuçlarını KORU.
    if (this.job && this.job.phase === 'fulltext') {
      this.job.throttled = false;
      this.setPhase('complete');
      return;
    }

    this.setPhase('idle');
    this.job = null;
  }

  getJob(): ScrapingJob | null { return this.job; }

  isRunning(): boolean {
    return this.job !== null &&
      (this.job.phase === 'metadata' || this.job.phase === 'fulltext');
  }

  /**
   * Talep üzerine, yalnızca seçilen kararların tam metnini çeker.
   * Metadata fazından sonra çağrılır (popup'taki "Tam PDF (seçili)" akışı).
   */
  fetchFulltexts(tabId: number, ids: string[]): void {
    if (!this.job) return;
    this.tabId = tabId;

    const idSet = new Set(ids);
    const selected = this.metadataDecisions.filter((d) => idSet.has(d.id));
    if (selected.length === 0) return;

    this.setPhase('fulltext');
    this.cachedCount = 0;
    this.job.fulltextProgress = { current: 0, total: selected.length };
    this.job.fulltextStartedAt = isoNow();
    this.job.throttled = false;

    void this.beginFulltexts(tabId, selected);
  }

  /**
   * Tek kararın tam metnini önizleme için döner (job'a dokunmaz).
   * Önce IndexedDB cache'e bakar (0 istek); yoksa content script üzerinden
   * tek bir /getDokuman çağırır ve sonucu cache'e yazar. Toplu çekim olmadığı
   * için 429 riski yok.
   */
  async previewFulltext(
    tabId: number,
    id: string,
  ): Promise<{ fullText: string; rateLimited: boolean }> {
    const cached = await getCachedFulltexts([id]);
    const hit = cached.get(id);
    if (hit) return { fullText: hit, rateLimited: false };

    try {
      await ensureContentScript(tabId);
      const res = (await chrome.tabs.sendMessage(tabId, { action: 'PREVIEW_ONE', id })) as
        | { ok: boolean; fullText?: string; rateLimited?: boolean }
        | undefined;

      if (res?.rateLimited) return { fullText: '', rateLimited: true };
      const fullText = res?.fullText ?? '';
      if (fullText) await putFulltexts([{ id, fullText }]);
      return { fullText, rateLimited: false };
    } catch {
      return { fullText: '', rateLimited: false };
    }
  }

  private async beginFulltexts(tabId: number, selected: DecisionMetadata[]): Promise<void> {
    if (!this.job) return;
    try {
      // 1) Cache'ten doldur — daha önce çekilenler için ağ isteği yok.
      const cached = await getCachedFulltexts(selected.map((d) => d.id));
      if (!this.job) return;
      if (cached.size > 0) {
        this.job.decisions = this.job.decisions.map((d) =>
          cached.has(d.id) ? { ...d, fullText: cached.get(d.id) ?? '' } : d,
        );
      }
      this.cachedCount = cached.size;
      this.job.fulltextProgress = { current: cached.size, total: selected.length };

      // 2) Eksik kalan id'ler — yalnızca bunları siteden çek.
      const missing = selected.filter((d) => !cached.has(d.id));
      if (missing.length === 0) {
        this.setPhase('complete'); // hepsi cache'te → istek yok, anında hazır
        return;
      }

      await ensureContentScript(tabId);
      await chrome.tabs.sendMessage(tabId, { action: 'SCRAPE_FULLTEXTS', decisions: missing });
    } catch {
      this.fail(
        'Tam metin çekimi başlatılamadı. Yargıtay sayfasının açık olduğundan emin olup ' +
          'tekrar deneyin.',
      );
    }
  }

  // ─── Content script mesajlarını işle ────────────────────────────────────

  handleContentMessage(msg: ContentToBackground): void {
    if (!this.job) return;

    switch (msg.action) {
      case 'METADATA_BATCH':    this.onMetadataBatch(msg.decisions, msg.recordsTotal); break;
      case 'FULLTEXT_BATCH':    this.onFulltextBatch(msg.decisions);                       break;
      case 'FULLTEXT_PROGRESS': this.onFulltextProgress(msg.done, msg.total, msg.throttled); break;
      case 'CONTENT_COMPLETE':  this.onContentComplete();                                  break;
      case 'CONTENT_ERROR':     this.onContentError(msg.error);                            break;
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private onMetadataBatch(decisions: DecisionMetadata[], recordsTotal: number): void {
    if (!this.job) return;

    const wasFirstBlock = this.metadataDecisions.length === 0;

    // Bloğu biriktir (cap yok — kullanıcı tüm sonuçlar boyunca sayfalayabilir).
    this.metadataDecisions = [...this.metadataDecisions, ...decisions];
    this.job.recordsTotal = Math.max(this.job.recordsTotal ?? 0, recordsTotal);

    const effectiveTotal = this.job.recordsTotal; // listelenebilecek = sitedeki toplam
    this.job.effectiveTotal = effectiveTotal;

    // Var olan tam metinleri koru (kullanıcı önceki blokta fulltext çekmiş olabilir).
    const existingText = new Map(
      this.job.decisions.filter((d) => d.fullText).map((d) => [d.id, d.fullText]),
    );
    this.job.decisions = this.metadataDecisions.map((d) => ({
      ...d,
      fullText: existingText.get(d.id) ?? '',
    }));

    this.job.canLoadMore = this.job.decisions.length < effectiveTotal;
    this.job.metadataProgress = { current: this.job.decisions.length, total: effectiveTotal };
    this.job.loadError = undefined; // blok başarıyla geldi
    this.setPhase('complete');

    // Geçmişe yalnızca İLK blokta yaz (arama anı snapshot'ı; sonraki bloklar yazmaz).
    if (wasFirstBlock) {
      const result: SearchResult = {
        id:          this.job.id,
        keywords:    this.job.keywords,
        criteria:    this.job.criteria,
        decisions:   this.job.decisions,
        totalCount:  this.job.decisions.length,
        recordsTotal: this.job.recordsTotal,
        scrapedAt:   this.job.startedAt,
        durationMs:  Date.now() - this.startedAt,
      };
      this.onComplete?.(result);
    }
  }

  private onFulltextBatch(decisions: Decision[]): void {
    if (!this.job) return;
    // id'ye göre birleştir: ilgili kararın fullText'ini güncelle.
    const byId = new Map(decisions.map((d) => [d.id, d]));
    this.job.decisions = this.job.decisions.map((d) => byId.get(d.id) ?? d);
    // Cache'e yaz — bir daha çekme.
    void putFulltexts(decisions.map((d) => ({ id: d.id, fullText: d.fullText })));
  }

  private onFulltextProgress(done: number, total: number, throttled: boolean): void {
    if (!this.job) return;
    // Content yalnızca eksik (cache-miss) id'leri sayar; cache'ten gelenleri taban al.
    this.job.fulltextProgress = {
      current: this.cachedCount + done,
      total: this.cachedCount + total,
    };
    this.job.throttled = throttled;
  }

  private onContentComplete(): void {
    if (!this.job || this.job.phase !== 'fulltext') return;
    // Tam metin fazı bitti. Geçmişi yeniden yazmıyoruz (metadata olarak kalır);
    // job.decisions artık seçili kararların tam metnini içeriyor (PDF için).
    this.job.throttled = false;
    this.setPhase('complete');
  }

  /**
   * Content'ten hata geldi. Sonraki blok çekimi (metadata fazı) sırasında elde
   * zaten sonuç varsa işi 'error'a düşürmeyiz — mevcut listeyi korur, 'complete'e
   * döner ve loadError işaretleriz; kullanıcı bekleyip "Tekrar dene" diyebilir
   * (otomatik tekrar denemeyiz → 429 döngüsü olmaz). İlk arama hatasında fail.
   */
  private onContentError(error: string): void {
    if (!this.job) return;
    if (this.job.phase === 'metadata' && this.metadataDecisions.length > 0) {
      this.job.loadError = error || 'Sonraki sayfa yüklenemedi (sunucu yoğun olabilir).';
      this.setPhase('complete');
      return;
    }
    this.fail(error);
  }

  private fail(error: string): void {
    if (!this.job) return;
    this.job.error = error;
    this.setPhase('error');
    this.onError?.(error);
  }

  private setPhase(phase: JobPhase): void {
    if (this.job) this.job.phase = phase;
  }
}
