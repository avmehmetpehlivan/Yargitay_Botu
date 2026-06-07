import { normalizeDate, extractYear } from '../../shared/utils/dateUtils';
import { extractDecisionText } from '../../shared/utils/textUtils';
import { sleep } from '../utils/domHelpers';
import { KURULLAR, HUKUK_DAIRELERI, CEZA_DAIRELERI } from '../../shared/constants/yargitayUnits';
import { buildKeywordQuery } from '../../shared/utils/keywordQuery';
import type { DecisionMetadata } from '../../shared/types/Decision';
import type { SearchCriteria } from '../../shared/types/SearchCriteria';

/**
 * karararama.yargitay.gov.tr resmi arama API'si.
 *
 * Site bir Angular SPA'sı; arama butonu DOM'da form submit etmez, aşağıdaki
 * JSON endpoint'lerine XHR atar. Content script aynı origin'de çalıştığı için
 * bu endpoint'leri doğrudan (oturum çerezleriyle) çağırabiliyoruz — DOM
 * tıklatmaktan çok daha hızlı ve güvenilir.
 *
 *   POST /aramalist           → arama sonuç listesi (metadata + toplam sayı)
 *   GET  /getDokuman?id=<id>  → tek kararın tam metni (HTML)
 */

interface AramaListItem {
  id: string;
  daire: string;
  esasNo: string;
  kararNo: string;
  kararTarihi: string; // "17.02.2014"
  arananKelime: string;
}

interface AramaListResponse {
  data: {
    data: AramaListItem[];
    recordsTotal: number;
    recordsFiltered: number;
  };
  metadata: { FMTY: string; FMTE?: string };
}

interface GetDokumanResponse {
  data: string; // HTML
  metadata: { FMTY: string; FMTE?: string };
}

const BASE = location.origin; // https://karararama.yargitay.gov.tr

// Rate limit (HTTP 429) yönetimi: sunucu istekleri kısarsa Retry-After'a uyup
// üstel backoff ile yeniden dener.
const MAX_RETRIES = 4;
const BACKOFF_BASE_MS = 1500;

/**
 * fetch sarmalayıcı: 429/503 durumunda bekleyip yeniden dener.
 * Tüm denemeler tükenirse son yanıtı döner (çağıran hata fırlatır).
 */
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 && res.status !== 503) return res;
    if (attempt >= MAX_RETRIES) return res;

    const retryAfter = Number(res.headers.get('Retry-After'));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : BACKOFF_BASE_MS * 2 ** attempt;
    await sleep(waitMs);
  }
}

export interface SearchPage {
  decisions: DecisionMetadata[];
  recordsTotal: number;
}

/** Detaylı kriter var mı? Varsa /aramadetaylist, yoksa /aramalist kullanılır. */
function isDetailed(c: SearchCriteria): boolean {
  return !!(
    c.kurullar?.length ||
    c.hukukDaireleri?.length ||
    c.cezaDaireleri?.length ||
    c.esasYil || c.esasIlkSiraNo || c.esasSonSiraNo ||
    c.kararYil || c.kararIlkSiraNo || c.kararSonSiraNo ||
    c.baslangicTarihi || c.bitisTarihi ||
    (c.siralama && c.siralama !== '1') ||
    (c.siralamaDirection && c.siralamaDirection !== 'desc')
  );
}

/** /aramadetaylist payload'ının data nesnesini kurar. */
function buildDetailedData(
  c: SearchCriteria,
  query: string,
  pageNumber: number,
  pageSize: number,
) {
  const anyUnit =
    (c.kurullar?.length ?? 0) +
      (c.hukukDaireleri?.length ?? 0) +
      (c.cezaDaireleri?.length ?? 0) >
    0;
  const join = (arr: string[] | undefined, all: readonly string[]) =>
    anyUnit ? (arr && arr.length ? arr.join('+') : '') : all.join('+');

  return {
    arananKelime: query,
    yargitayMah: '',
    hukuk: '',
    ceza: '',
    esasYil: c.esasYil ?? '',
    esasIlkSiraNo: c.esasIlkSiraNo ?? '',
    esasSonSiraNo: c.esasSonSiraNo ?? '',
    kararYil: c.kararYil ?? '',
    kararIlkSiraNo: c.kararIlkSiraNo ?? '',
    kararSonSiraNo: c.kararSonSiraNo ?? '',
    baslangicTarihi: c.baslangicTarihi ?? '',
    bitisTarihi: c.bitisTarihi ?? '',
    siralama: c.siralama ?? '1',
    siralamaDirection: c.siralamaDirection ?? 'desc',
    birimYrgKurulDaire: join(c.kurullar, KURULLAR),
    birimYrgHukukDaire: join(c.hukukDaireleri, HUKUK_DAIRELERI),
    birimYrgCezaDaire: join(c.cezaDaireleri, CEZA_DAIRELERI),
    pageSize,
    pageNumber,
  };
}

/** Tek sayfa arama sonucu döner ve item'ları DecisionMetadata'ya çevirir. */
export async function searchPage(
  criteria: SearchCriteria,
  pageNumber: number,
  pageSize: number,
): Promise<SearchPage> {
  const query = buildKeywordQuery(criteria);
  const detailed = isDetailed(criteria);

  const data = detailed
    ? buildDetailedData(criteria, query, pageNumber, pageSize)
    : { aranan: query, arananKelime: query, pageSize, pageNumber };

  const res = await fetchWithRetry(`${BASE}/${detailed ? 'aramadetaylist' : 'aramalist'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ data }),
  });

  if (res.status === 429) {
    throw new Error(
      'Yargıtay sunucusu çok fazla istek nedeniyle aramayı geçici olarak kısıtladı (429). ' +
        'Lütfen birkaç dakika bekleyip tekrar deneyin.',
    );
  }
  if (!res.ok) throw new Error(`Arama isteği başarısız (HTTP ${res.status}).`);

  const json = (await res.json()) as AramaListResponse;
  if (json.metadata?.FMTY === 'ERROR') {
    throw new Error(json.metadata.FMTE || 'Arama sunucusu hata döndürdü.');
  }

  const items = json.data?.data ?? [];
  const scrapedAt = new Date().toISOString();

  const decisions: DecisionMetadata[] = items.map((it) => {
    const date = normalizeDate(it.kararTarihi);
    return {
      id: it.id,
      title: `${it.daire} — ${it.esasNo}`,
      chamber: it.daire || 'Bilinmiyor',
      date,
      year: date ? extractYear(date) : new Date().getFullYear(),
      esasNo: it.esasNo,
      kararNo: it.kararNo,
      keywords: criteria.keywords,
      scrapedAt,
    };
  });

  return { decisions, recordsTotal: json.data?.recordsTotal ?? decisions.length };
}

/** Sunucu 429 döndüğünde fırlatılır; çağıran AIMD ile yavaşlar. */
export class RateLimitError extends Error {
  constructor(public retryAfterMs: number | null) {
    super('rate-limited (429)');
    this.name = 'RateLimitError';
  }
}

/**
 * Tek kararın tam metnini döner. TEK deneme yapar — 429'da RateLimitError
 * fırlatır ki çağıran (content loop) adaptif throttle (AIMD) uygulayabilsin.
 */
export async function fetchDecisionTextOnce(id: string): Promise<string> {
  const res = await fetch(`${BASE}/getDokuman?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (res.status === 429 || res.status === 503) {
    const ra = Number(res.headers.get('Retry-After'));
    throw new RateLimitError(Number.isFinite(ra) && ra > 0 ? ra * 1000 : null);
  }
  if (!res.ok) throw new Error(`Karar metni alınamadı (HTTP ${res.status}).`);

  const json = (await res.json()) as GetDokumanResponse;
  const text = htmlToText(json.data ?? '');
  return extractDecisionText(text) ?? text;
}

/** API'den gelen karar HTML'ini satır sonlarını koruyarak düz metne çevirir. */
function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n');

  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  const text = doc.body?.textContent ?? '';

  return text
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
