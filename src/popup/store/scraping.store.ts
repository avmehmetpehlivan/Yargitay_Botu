import { create } from 'zustand';
import type { ScrapingJob } from '../../shared/types/Decision';
import type { SearchResult } from '../../shared/types/SearchResult';

interface ScrapingState {
  job: ScrapingJob | null;
  lastResult: SearchResult | null;

  setJob: (job: ScrapingJob | null) => void;
  setLastResult: (result: SearchResult) => void;
  reset: () => void;
}

export const useScrapingStore = create<ScrapingState>((set) => ({
  job: null,
  lastResult: null,

  setJob: (job) => set({ job }),
  setLastResult: (lastResult) => set({ lastResult }),
  reset: () => set({ job: null, lastResult: null }),
}));
