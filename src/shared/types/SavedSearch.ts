import type { SearchCriteria } from './SearchCriteria';

export interface SavedSearch {
  id: string;
  keywords: string[];
  criteria?: SearchCriteria; // detaylı arama parametreleri (varsa)
  label?: string;           // Kullanıcının verdiği isim: "Müvekkil A - İşe İade"
  savedAt: string;          // ISO 8601
}
