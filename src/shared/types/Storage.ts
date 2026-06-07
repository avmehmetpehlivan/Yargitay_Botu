import type { SearchHistoryItem } from './SearchResult';
import type { SavedSearch } from './SavedSearch';

export interface UserSettings {
  maxDecisions: number;    // metadata üst sınırı (kullanıcı seçer; tavan STORAGE_LIMITS)
  autoSaveHistory: boolean;
}

export interface StorageSchema {
  searchHistory: SearchHistoryItem[];
  savedSearches: SavedSearch[];
  settings: UserSettings;
}

export const DEFAULT_SETTINGS: UserSettings = {
  maxDecisions: 500,
  autoSaveHistory: true,
};
