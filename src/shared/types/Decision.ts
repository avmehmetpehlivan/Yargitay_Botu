import type { SearchCriteria } from './SearchCriteria';

export interface Decision {
  id: string;
  title: string;
  chamber: string;    // "2. Hukuk Dairesi"
  date: string;       // "YYYY-MM-DD"
  year: number;
  esasNo: string;
  kararNo: string;
  fullText: string;
  keywords: string[];
  scrapedAt: string;
}

// Phase-1 sonucu: fullText henüz yok
export type DecisionMetadata = Omit<Decision, 'fullText'>;

export type ScrapingPhase = 'idle' | 'metadata' | 'fulltext' | 'complete' | 'error';

export interface Progress {
  current: number;
  total: number;
}

export interface ScrapingJob {
  id: string;
  keywords: string[];
  phase: ScrapingPhase;
  metadataProgress: Progress;
  fulltextProgress: Progress;
  decisions: Decision[];
  startedAt: string;
  error: string | null;
  criteria?: SearchCriteria; // aramada kullanılan parametreler (kaydetme/gösterim için)
  recordsTotal?: number;     // sitedeki toplam sonuç (toplananlardan fazla olabilir)
  // Tam metin (fulltext) fazı UX'i için
  fulltextStartedAt?: string | null; // ETA hesabı için
  throttled?: boolean;               // sunucu 429 ile yavaşlattıysa true
}
