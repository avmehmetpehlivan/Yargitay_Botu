// Kullanıcının oluşturduğu kategori (isim + renk) ve o kategoriye kaydettiği
// kararlar. Saved searches'ten (kayıtlı ARAMA) ayrıdır: burası kaydedilen tekil
// KARARLAR. Tam metin saklanmaz (boyut) — gerekince /getDokuman ile çekilir.

export interface DecisionCategory {
  id: string;
  name: string;
  color: string;   // hex, ör. "#ef4444"
  createdAt: string;
}

export interface SavedDecision {
  id: string;        // karar id'si (API'den)
  chamber: string;   // "9. Hukuk Dairesi"
  esasNo: string;
  kararNo: string;
  date: string;      // YYYY-MM-DD
  year: number;
  categoryIds: string[]; // karar aynı anda birden fazla kategoride olabilir
  keywords: string[]; // önizlemede vurgulamak için aramanın anahtar kelimeleri
  savedAt: string;
}
