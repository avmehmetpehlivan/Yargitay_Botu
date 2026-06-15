export const STORAGE_KEYS = {
  searchHistory:      'searchHistory',
  savedSearches:      'savedSearches',
  decisionCategories: 'decisionCategories',
  savedDecisions:     'savedDecisions',
  settings:           'settings',
} as const;

// Kategori renk paleti (kullanıcı bunlardan seçer veya özel renk girer).
export const COLLECTION_COLORS = [
  '#FFFF00', '#FF0000', '#FFA500', '#A52A2A', '#008000',
  '#0000FF', '#800080', '#FFC0CB', '#000000', '#808080',
] as const;

export const STORAGE_LIMITS = {
  maxHistoryItems: 50,
  maxSavedSearches: 100,
  // Tek seferde tam metni çekilip "Tam PDF"e basılabilecek karar üst sınırı.
  // Rate limit (429) ve makul PDF boyutu için bilinçli olarak düşük tutuldu.
  maxFulltextPerPdf: 25,
} as const;
