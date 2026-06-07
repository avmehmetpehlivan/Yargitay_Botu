export const STORAGE_KEYS = {
  searchHistory: 'searchHistory',
  savedSearches: 'savedSearches',
  settings:      'settings',
} as const;

export const STORAGE_LIMITS = {
  maxHistoryItems: 50,
  // settings.maxDecisions için TAVAN (kullanıcı bunu aşamaz). Varsayılan ayar 500.
  maxDecisionsPerSearch: 1000,
  maxSavedSearches: 100,
  // Tek seferde tam metni çekilip "Tam PDF"e basılabilecek karar üst sınırı.
  // Rate limit (429) ve makul PDF boyutu için bilinçli olarak düşük tutuldu.
  maxFulltextPerPdf: 25,
} as const;

// Kullanıcının seçebileceği metadata üst sınırı seçenekleri.
export const MAX_DECISIONS_OPTIONS = [250, 500, 1000] as const;

/** settings.maxDecisions'ı geçerli aralığa kıstırır. */
export function clampMaxDecisions(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 500;
  return Math.min(Math.floor(n), STORAGE_LIMITS.maxDecisionsPerSearch);
}

// Alarm adı kayıtlı arama id'sinden türetilir
export const alarmName = (savedId: string) => `new-decisions:${savedId}`;

// Yeni karar kontrolü sıklığı (dakika)
export const NEW_DECISION_CHECK_INTERVAL_MINUTES = 1440; // 24 saat
