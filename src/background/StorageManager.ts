import type { SearchResult, SearchHistoryItem } from '../shared/types/SearchResult';
import type { SavedSearch } from '../shared/types/SavedSearch';
import type { SearchCriteria } from '../shared/types/SearchCriteria';
import type { UserSettings } from '../shared/types/Storage';
import {
  addHistory,
  removeHistory,
  getHistory,
  getSavedSearches,
  saveSavedSearch,
  updateSavedSearch,
  removeSavedSearch,
  getSettings,
} from '../shared/utils/chromeStorage';
import { STORAGE_LIMITS } from '../shared/constants/storage';
import { generateId } from '../shared/utils/textUtils';
import { isoNow } from '../shared/utils/dateUtils';

export class StorageManager {
  async getSettings(): Promise<UserSettings> {
    return getSettings();
  }

  async persistSearchResult(result: SearchResult): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.autoSaveHistory) return;

    const item: SearchHistoryItem = {
      id: result.id,
      keywords: result.keywords,
      criteria: result.criteria,
      totalCount: result.totalCount,
      recordsTotal: result.recordsTotal,
      scrapedAt: result.scrapedAt,
      durationMs: result.durationMs,
    };

    await addHistory(item, STORAGE_LIMITS.maxHistoryItems);
  }

  async getHistory(): Promise<SearchHistoryItem[]> {
    return getHistory();
  }

  async deleteHistoryItem(id: string): Promise<void> {
    await removeHistory(id);
  }

  async getSavedSearches(): Promise<SavedSearch[]> {
    return getSavedSearches();
  }

  async saveSearch(
    keywords: string[],
    label?: string,
    criteria?: SearchCriteria,
  ): Promise<SavedSearch> {
    const key = (kw: string[], c?: SearchCriteria) => `${kw.join('|')}#${JSON.stringify(c ?? {})}`;
    const existing = await getSavedSearches();
    const dup = existing.find((s) => key(s.keywords, s.criteria) === key(keywords, criteria));
    if (dup) return dup;

    const item: SavedSearch = {
      id: generateId(),
      keywords,
      criteria,
      label,
      savedAt: isoNow(),
      lastCheckedAt: isoNow(),
      lastCheckedCount: 0,
      newDecisionCount: 0,
    };

    await saveSavedSearch(item);
    return item;
  }

  async updateSavedSearch(id: string, patch: Partial<SavedSearch>): Promise<void> {
    await updateSavedSearch(id, patch);
  }

  async deleteSavedSearch(id: string): Promise<void> {
    await removeSavedSearch(id);
  }
}
