import type { Decision, DecisionMetadata, ScrapingJob } from './Decision';
import type { SearchCriteria } from './SearchCriteria';

// ─── Action sabitleri ────────────────────────────────────────────────────────

export const MSG = {
  // Popup → Background
  START_SCRAPING:        'START_SCRAPING',
  FETCH_FULLTEXTS:       'FETCH_FULLTEXTS',
  STOP_SCRAPING:         'STOP_SCRAPING',
  GET_STATUS:            'GET_STATUS',
  SAVE_SEARCH:           'SAVE_SEARCH',
  UPDATE_SAVED_LABEL:    'UPDATE_SAVED_LABEL',
  DELETE_SAVED_SEARCH:   'DELETE_SAVED_SEARCH',
  DELETE_HISTORY_ITEM:   'DELETE_HISTORY_ITEM',

  // Background → Content Script
  SCRAPE_METADATA:       'SCRAPE_METADATA',
  SCRAPE_FULLTEXTS:      'SCRAPE_FULLTEXTS',
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
  | { action: 'FETCH_FULLTEXTS'; ids: string[]; tabId: number }
  | { action: 'STOP_SCRAPING' }
  | { action: 'GET_STATUS' }
  | { action: 'SAVE_SEARCH'; keywords: string[]; label?: string; criteria?: SearchCriteria }
  | { action: 'UPDATE_SAVED_LABEL'; id: string; label: string }
  | { action: 'DELETE_SAVED_SEARCH'; id: string }
  | { action: 'DELETE_HISTORY_ITEM'; id: string };

// ─── Discriminated union: Background → Content Script ────────────────────────

export type BackgroundToContent =
  | { action: 'PING' }
  | { action: 'SCRAPE_METADATA'; criteria: SearchCriteria; maxDecisions?: number }
  | { action: 'SCRAPE_FULLTEXTS'; decisions: DecisionMetadata[] }
  | { action: 'STOP' };

// ─── Discriminated union: Content Script → Background ────────────────────────

export type ContentToBackground =
  | { action: 'METADATA_BATCH'; decisions: DecisionMetadata[]; hasNextPage: boolean; pageNum: number; recordsTotal: number }
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
