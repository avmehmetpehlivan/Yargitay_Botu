import type { Decision } from './Decision';
import type { SearchCriteria } from './SearchCriteria';

export interface SearchResult {
  id: string;
  keywords: string[];
  criteria?: SearchCriteria; // detaylı arama parametreleri (varsa)
  decisions: Decision[];
  totalCount: number;        // toplanan (≤500)
  recordsTotal?: number;     // sitedeki gerçek toplam
  scrapedAt: string;
  durationMs: number;
}

// Geçmişte saklanacak hafif format (fullText hariç)
export interface SearchHistoryItem {
  id: string;
  keywords: string[];
  criteria?: SearchCriteria; // gösterimde parametreleri özetlemek için
  totalCount: number;
  recordsTotal?: number;
  scrapedAt: string;
  durationMs: number;
}
