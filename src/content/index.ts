import type { BackgroundToContent, ContentToBackground } from '../shared/types/Messages';
import type { Decision, DecisionMetadata } from '../shared/types/Decision';
import type { SearchCriteria } from '../shared/types/SearchCriteria';
import { searchPage, fetchDecisionTextOnce, RateLimitError } from './api/YargitayApi';
import { sleep } from './utils/domHelpers';

// ─── Ayarlar ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100; // /aramalist sayfa başına kayıt
const DEFAULT_MAX_DECISIONS = 500; // mesajda gelmezse (ör. alarm) varsayılan
const METADATA_PAGE_DELAY_MS = 800; // /aramalist sayfaları arası (rate limit koruması)
const BATCH_SIZE = 5; // çökme koruması için fulltext batch boyutu

// AIMD adaptif throttle (getDokuman): başarıda yavaşça hızlan, 429'da katla.
const AIMD = {
  startMs: 1500,
  floorMs: 1000,
  ceilMs: 16000,
  decrementMs: 200, // her N başarıda azalt
  successesPerStep: 5,
  maxRetriesPerItem: 6,
} as const;

// ─── State ────────────────────────────────────────────────────────────────────

// Content script hem manifest ile statik, hem de background tarafından
// chrome.scripting ile dinamik enjekte edilebilir. İki kez yüklenirse dinleyici
// iki kez kaydolup mesajları çiftler — bu bayrakla ikinci kurulumu engelliyoruz.
const GLOBAL_FLAG = '__yargitayAsistaniLoaded';

let isStopped = false;

// ─── Helper: background'a mesaj gönder ───────────────────────────────────────

function send(msg: ContentToBackground): void {
  chrome.runtime.sendMessage(msg).catch(() => {
    // Popup kapanmışsa hata fırlatabilir — sessizce yoksay
  });
}

// ─── Faz 1: Metadata (hızlı) — /aramalist | /aramadetaylist ─────────────────────

async function scrapeMetadata(criteria: SearchCriteria, maxDecisions: number): Promise<void> {
  const hasQuery = criteria.keywords.some((k) => k.trim());
  const hasDetail =
    !!(criteria.kurullar?.length || criteria.hukukDaireleri?.length ||
      criteria.cezaDaireleri?.length || criteria.esasYil || criteria.kararYil ||
      criteria.baslangicTarihi || criteria.bitisTarihi ||
      criteria.esasIlkSiraNo || criteria.kararIlkSiraNo);
  // En az bir kriter olmalı (boş aramayı engelle).
  if (!hasQuery && !hasDetail) throw new Error('Arama kriteri girilmedi.');

  let pageNumber = 1;
  let collected = 0;

  while (!isStopped) {
    const { decisions, recordsTotal } = await searchPage(criteria, pageNumber, PAGE_SIZE);

    collected += decisions.length;
    const target = Math.min(recordsTotal, maxDecisions);
    const hasNext = !isStopped && decisions.length > 0 && collected < target;

    send({
      action: 'METADATA_BATCH',
      decisions,
      hasNextPage: hasNext,
      pageNum: pageNumber,
      recordsTotal,
    });

    if (!hasNext) break;
    pageNumber++;
    await sleep(METADATA_PAGE_DELAY_MS);
  }
}

// ─── Faz 2: Fulltext (yavaş) — /getDokuman ─────────────────────────────────────

async function scrapeFulltexts(decisions: DecisionMetadata[]): Promise<void> {
  const total = decisions.length;
  let batch: Decision[] = [];
  let batchIndex = 0;
  let done = 0;

  let delay: number = AIMD.startMs;
  let successStreak = 0;

  for (const meta of decisions) {
    if (isStopped) break;

    const fullText = await fetchOneWithAimd(meta.id, () => {
      // 429 görüldü: yavaşlat ve UI'a bildir.
      successStreak = 0;
      delay = Math.min(AIMD.ceilMs, delay * 2);
      send({ action: 'FULLTEXT_PROGRESS', done, total, throttled: true });
    });

    batch.push({ ...meta, fullText });
    done++;

    // Başarı: temkinli şekilde hızlan.
    if (++successStreak >= AIMD.successesPerStep) {
      successStreak = 0;
      delay = Math.max(AIMD.floorMs, delay - AIMD.decrementMs);
    }

    send({ action: 'FULLTEXT_PROGRESS', done, total, throttled: false });

    if (batch.length >= BATCH_SIZE) {
      send({ action: 'FULLTEXT_BATCH', decisions: [...batch], batchIndex });
      batchIndex++;
      batch = [];
    }

    if (!isStopped && done < total) await sleep(delay);
  }

  if (batch.length > 0) {
    send({ action: 'FULLTEXT_BATCH', decisions: batch, batchIndex });
  }
}

/**
 * Bir kararı çeker; 429'da onThrottle() çağırıp Retry-After (veya artan delay)
 * kadar bekleyip yeniden dener. maxRetriesPerItem aşılırsa boş metin döner.
 */
async function fetchOneWithAimd(id: string, onThrottle: () => void): Promise<string> {
  for (let attempt = 0; attempt <= AIMD.maxRetriesPerItem; attempt++) {
    if (isStopped) return '';
    try {
      return await fetchDecisionTextOnce(id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        onThrottle();
        const waitMs = e.retryAfterMs ?? Math.min(AIMD.ceilMs, AIMD.startMs * 2 ** attempt);
        await sleep(waitMs);
        continue;
      }
      return ''; // 429 dışı hata: bu kararı boş geç, akışı durdurma
    }
  }
  return ''; // denemeler tükendi
}

// ─── Message listener ─────────────────────────────────────────────────────────

const w = window as unknown as Record<string, boolean>;
if (w[GLOBAL_FLAG]) {
  // Zaten yüklü (statik enjeksiyon vardı) — ikinci dinleyiciyi kaydetme.
  console.debug('[Yargıtay Asistanı] content script zaten yüklü, atlanıyor');
} else {
  w[GLOBAL_FLAG] = true;
  console.log('[Yargıtay Asistanı] content script yüklendi ✓', location.href);
  registerListener();
}

function registerListener(): void {
  chrome.runtime.onMessage.addListener(
    (message: BackgroundToContent, _sender, sendResponse) => {
      switch (message.action) {
        case 'PING': {
          // Background, content script'in yüklü olup olmadığını bununla yoklar.
          sendResponse({ ok: true });
          break;
        }

        case 'SCRAPE_METADATA': {
          isStopped = false;
          scrapeMetadata(message.criteria, message.maxDecisions ?? DEFAULT_MAX_DECISIONS)
            .then(() => {
              if (!isStopped) send({ action: 'CONTENT_COMPLETE' });
            })
            .catch((err: Error) => {
              send({ action: 'CONTENT_ERROR', error: err.message });
            });
          sendResponse({ ok: true });
          break;
        }

        case 'SCRAPE_FULLTEXTS': {
          isStopped = false;
          scrapeFulltexts(message.decisions)
            .then(() => {
              if (!isStopped) send({ action: 'CONTENT_COMPLETE' });
            })
            .catch((err: Error) => {
              send({ action: 'CONTENT_ERROR', error: err.message });
            });
          sendResponse({ ok: true });
          break;
        }

        case 'STOP': {
          isStopped = true;
          sendResponse({ ok: true });
          break;
        }
      }
    },
  );
}
