import type { SearchHistoryItem } from './SearchResult';
import type { SavedSearch } from './SavedSearch';

export interface UserSettings {
  autoSaveHistory: boolean;
}

export interface StorageSchema {
  searchHistory: SearchHistoryItem[];
  savedSearches: SavedSearch[];
  settings: UserSettings;
}

export const DEFAULT_SETTINGS: UserSettings = {
  autoSaveHistory: true,
};
