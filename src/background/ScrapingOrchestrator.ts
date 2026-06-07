import type { ScrapingJob, Decision, DecisionMetadata } from '../shared/types/Decision';
import type { ContentToBackground } from '../shared/types/Messages';
import type { SearchCriteria } from '../shared/types/SearchCriteria';
import type { SearchResult } from '../shared/types/SearchResult';
import { generateId } from '../shared/utils/textUtils';
import { isoNow } from '../shared/utils/dateUtils';
import { clampMaxDecisions } from '../shared/constants/storage';
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
  private metadataDecisions: DecisionMetadata[] = [];
  private startedAt = 0;
  private cachedCount = 0; // tam metin fazında cache'ten gelen sayı (ilerleme tabanı)
  private maxDecisions = 500; // metadata üst sınırı (kullanıcı ayarından)

  onComplete: ((result: SearchResult) => void) | null = null;
  onError:    ((error: string) => void) | null = null;

  // ─── Public API ──────────────────────────────────────────────────────────

  start(tabId: number, criteria: SearchCriteria, maxDecisions = 500): void {
    this.tabId = tabId;
    this.metadataDecisions = [];
    this.startedAt = Date.now();
    this.maxDecisions = clampMaxDecisions(maxDecisions);

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

    void this.beginMetadata(tabId, criteria);
  }

  /**
   * Content script'in sayfaya yüklü olduğundan emin olduktan sonra metadata
   * scraping'i başlatır. Statik enjeksiyon (manifest) bazen olmaz — örn. sayfa
   * uzantı yüklenmeden önce açılmışsa. Bu durumda chrome.scripting ile dinamik
   * enjekte ederiz.
   */
  private async beginMetadata(tabId: number, criteria: SearchCriteria): Promise<void> {
    try {
      await ensureContentScript(tabId);
      await chrome.tabs.sendMessage(tabId, {
        action: 'SCRAPE_METADATA',
        criteria,
        maxDecisions: this.maxDecisions,
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
      case 'METADATA_BATCH':    this.onMetadataBatch(msg.decisions, msg.hasNextPage, msg.recordsTotal); break;
      case 'FULLTEXT_BATCH':    this.onFulltextBatch(msg.decisions);                       break;
      case 'FULLTEXT_PROGRESS': this.onFulltextProgress(msg.done, msg.total, msg.throttled); break;
      case 'CONTENT_COMPLETE':  this.onContentComplete();                                  break;
      case 'CONTENT_ERROR':     this.fail(msg.error);                                      break;
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private onMetadataBatch(
    decisions: DecisionMetadata[],
    hasNextPage: boolean,
    recordsTotal: number,
  ): void {
    if (!this.job) return;

    this.metadataDecisions = [...this.metadataDecisions, ...decisions];
    this.job.recordsTotal = Math.max(this.job.recordsTotal ?? 0, recordsTotal);
    this.job.metadataProgress = {
      current: this.metadataDecisions.length,
      total:   this.metadataDecisions.length,
    };

    if (hasNextPage) return;

    // Metadata tamamlandı. Tam metni OTOMATİK çekmiyoruz (429 koruması) —
    // kullanıcı seçip "Tam PDF" derse fetchFulltexts ile talep üzerine çekilir.
    const limited = this.metadataDecisions.slice(0, this.maxDecisions);
    this.metadataDecisions = limited;
    this.job.metadataProgress = { current: limited.length, total: limited.length };

    // Metadata'yı boş fullText'li Decision olarak tut — seçim/künye için yeterli.
    this.job.decisions = limited.map((d) => ({ ...d, fullText: '' }));

    this.setPhase('complete');
    const result: SearchResult = {
      id:          this.job.id,
      keywords:    this.job.keywords,
      criteria:    this.job.criteria,
      decisions:   this.job.decisions,
      totalCount:  limited.length,
      recordsTotal: this.job.recordsTotal,
      scrapedAt:   this.job.startedAt,
      durationMs:  Date.now() - this.startedAt,
    };
    this.onComplete?.(result); // geçmişe yalnızca metadata yazılır
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
