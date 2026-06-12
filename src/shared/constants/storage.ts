export const STORAGE_KEYS = {
  searchHistory: 'searchHistory',
  savedSearches: 'savedSearches',
  settings:      'settings',
} as const;

export const STORAGE_LIMITS = {
  maxHistoryItems: 50,
  maxSavedSearches: 100,
  // Tek seferde tam metni çekilip "Tam PDF"e basılabilecek karar üst sınırı.
  // Rate limit (429) ve makul PDF boyutu için bilinçli olarak düşük tutuldu.
  maxFulltextPerPdf: 25,
} as const;
