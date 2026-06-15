import type { SearchHistoryItem } from './SearchResult';
import type { SavedSearch } from './SavedSearch';
import type { DecisionCategory, SavedDecision } from './Collection';

export interface UserSettings {
  autoSaveHistory: boolean;
}

export interface StorageSchema {
  searchHistory: SearchHistoryItem[];
  savedSearches: SavedSearch[];
  decisionCategories: DecisionCategory[];
  savedDecisions: SavedDecision[];
  settings: UserSettings;
}

export const DEFAULT_SETTINGS: UserSettings = {
  autoSaveHistory: true,
};
