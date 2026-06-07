/**
 * Arama kriterleri. Temel arama yalnızca `keywords` kullanır; geri kalan alanlar
 * "Detaylı Arama" panelinden gelir ve /aramadetaylist payload'ına çevrilir
 * (bkz. content/api/YargitayApi.ts).
 */
export interface SearchCriteria {
  keywords: string[];          // İÇERSİN — pozitif anahtar kelimeler/öbekler
  excludeKeywords?: string[];  // İÇERMESİN — site kuralındaki "-" (hariç)
  matchMode?: 'all' | 'any';   // include'lar: 'all'=VE(+), 'any'=VEYA(boşluk). Vars. 'all'

  // Birim filtreleri — seçilen daire/kurul ADLARI ("9. Hukuk Dairesi" gibi).
  kurullar?: string[];
  hukukDaireleri?: string[];
  cezaDaireleri?: string[];

  // Esas / Karar numarası aralıkları
  esasYil?: string;
  esasIlkSiraNo?: string;
  esasSonSiraNo?: string;
  kararYil?: string;
  kararIlkSiraNo?: string;
  kararSonSiraNo?: string;

  // Karar tarihi aralığı (DD.MM.YYYY)
  baslangicTarihi?: string;
  bitisTarihi?: string;

  // Sıralama: 1=Esas No, 2=Karar No, 3=Karar Tarihi
  siralama?: '1' | '2' | '3';
  siralamaDirection?: 'asc' | 'desc';
}

/** Detaylı alanların boş olup olmadığını yardımcı tip için kısaltma. */
export type DetailFields = Omit<SearchCriteria, 'keywords'>;
