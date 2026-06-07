import { create } from 'zustand';
import type { SearchHistoryItem } from '../../shared/types/SearchResult';
import { getHistory, removeHistory, clearHistory } from '../../shared/utils/chromeStorage';

interface HistoryState {
  items: SearchHistoryItem[];
  isLoaded: boolean;

  load: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  isLoaded: false,

  load: async () => {
    const items = await getHistory();
    set({ items: items.sort((a, b) => b.scrapedAt.localeCompare(a.scrapedAt)), isLoaded: true });
  },

  remove: async (id: string) => {
    await removeHistory(id);
    set({ items: get().items.filter((h) => h.id !== id) });
  },

  clear: async () => {
    await clearHistory();
    set({ items: [] });
  },
}));
