import { create } from 'zustand';
import type { SavedSearch } from '../../shared/types/SavedSearch';
import type { SearchCriteria } from '../../shared/types/SearchCriteria';
import { getSavedSearches } from '../../shared/utils/chromeStorage';
import { MSG } from '../../shared/types/Messages';

interface SavedState {
  items: SavedSearch[];
  isLoaded: boolean;

  load: () => Promise<void>;
  save: (keywords: string[], criteria?: SearchCriteria, label?: string) => Promise<void>;
  updateLabel: (id: string, label: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  items: [],
  isLoaded: false,

  load: async () => {
    const items = await getSavedSearches();
    set({ items: items.sort((a, b) => b.savedAt.localeCompare(a.savedAt)), isLoaded: true });
  },

  save: async (keywords, criteria, label) => {
    await chrome.runtime.sendMessage({ action: MSG.SAVE_SEARCH, keywords, label, criteria });
    await get().load();
  },

  updateLabel: async (id, label) => {
    await chrome.runtime.sendMessage({ action: MSG.UPDATE_SAVED_LABEL, id, label });
    set({ items: get().items.map((s) => (s.id === id ? { ...s, label } : s)) });
  },

  remove: async (id) => {
    await chrome.runtime.sendMessage({ action: MSG.DELETE_SAVED_SEARCH, id });
    set({ items: get().items.filter((s) => s.id !== id) });
  },
}));
