import type { Decision, DecisionMetadata, ScrapingJob } from './Decision';
import type { SearchCriteria } from './SearchCriteria';

// ─── Action sabitleri ────────────────────────────────────────────────────────

export const MSG = {
  // Popup → Background
  START_SCRAPING:        'START_SCRAPING',
  LOAD_MORE:             'LOAD_MORE',
  FETCH_FULLTEXTS:       'FETCH_FULLTEXTS',
  PREVIEW_FULLTEXT:      'PREVIEW_FULLTEXT',
  STOP_SCRAPING:         'STOP_SCRAPING',
  GET_STATUS:            'GET_STATUS',
  SAVE_SEARCH:           'SAVE_SEARCH',
  UPDATE_SAVED_LABEL:    'UPDATE_SAVED_LABEL',
  DELETE_SAVED_SEARCH:   'DELETE_SAVED_SEARCH',
  DELETE_HISTORY_ITEM:   'DELETE_HISTORY_ITEM',

  // Background → Content Script
  SCRAPE_BLOCK:          'SCRAPE_BLOCK',
  SCRAPE_FULLTEXTS:      'SCRAPE_FULLTEXTS',
  PREVIEW_ONE:           'PREVIEW_ONE',
  STOP:                  'STOP',

  // Content Script → Background
  METADATA_BATCH:        'METADATA_BATCH',
  FULLTEXT_BATCH:        'FULLTEXT_BATCH',
  CONTENT_COMPLETE:      'CONTENT_COMPLETE',
  CONTENT_ERROR:         'CONTENT_ERROR',
} as const;

export type MsgKey = typeof MSG[keyof typeof MSG];

// ─── Discriminated union: Popup → Background ─────────────────────────────────

export type PopupToBackground =
  | { action: 'START_SCRAPING'; criteria: SearchCriteria; tabId: number }
  | { action: 'LOAD_MORE'; tabId: number }
  | { action: 'FETCH_FULLTEXTS'; ids: string[]; tabId: number }
  | { action: 'PREVIEW_FULLTEXT'; id: string; tabId: number }
  | { action: 'STOP_SCRAPING' }
  | { action: 'GET_STATUS' }
  | { action: 'SAVE_SEARCH'; keywords: string[]; label?: string; criteria?: SearchCriteria }
  | { action: 'UPDATE_SAVED_LABEL'; id: string; label: string }
  | { action: 'DELETE_SAVED_SEARCH'; id: string }
  | { action: 'DELETE_HISTORY_ITEM'; id: string };

// ─── Discriminated union: Background → Content Script ────────────────────────

export type BackgroundToContent =
  | { action: 'PING' }
  // startOffset'ten başlayan TEK 100'lük bloğu çeker (API pageSize max 100; 429'a
  // yol açmamak için blok başına yalnızca bir /aramalist isteği atılır).
  | { action: 'SCRAPE_BLOCK'; criteria: SearchCriteria; startOffset: number }
  | { action: 'SCRAPE_FULLTEXTS'; decisions: DecisionMetadata[] }
  | { action: 'PREVIEW_ONE'; id: string }
  | { action: 'STOP' };

// ─── Discriminated union: Content Script → Background ────────────────────────

export type ContentToBackground =
  | { action: 'METADATA_BATCH'; decisions: DecisionMetadata[]; recordsTotal: number; hasMore: boolean }
  | { action: 'FULLTEXT_BATCH'; decisions: Decision[]; batchIndex: number }
  | { action: 'FULLTEXT_PROGRESS'; done: number; total: number; throttled: boolean }
  | { action: 'CONTENT_COMPLETE' }
  | { action: 'CONTENT_ERROR'; error: string };

// ─── Responses ────────────────────────────────────────────────────────────────

export interface StatusResponse {
  job: ScrapingJob | null;
}

export interface GenericResponse {
  ok: boolean;
  error?: string;
}

/** PREVIEW_FULLTEXT / PREVIEW_ONE yanıtı: tek kararın tam metni. */
export interface PreviewResponse {
  ok: boolean;
  fullText: string;
  rateLimited?: boolean;
}
