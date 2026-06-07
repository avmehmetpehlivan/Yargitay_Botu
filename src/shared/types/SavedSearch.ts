import type { SearchCriteria } from './SearchCriteria';

export interface SavedSearch {
  id: string;
  keywords: string[];
  criteria?: SearchCriteria; // detaylı arama parametreleri (varsa)
  label?: string;           // Kullanıcının verdiği isim: "Müvekkil A - İşe İade"
  savedAt: string;          // ISO 8601
  lastCheckedAt: string;    // Son kontrol zamanı
  lastCheckedCount: number; // O andaki karar sayısı
  newDecisionCount: number; // Fark (0 → yeni karar yok)
}
