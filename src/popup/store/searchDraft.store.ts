import { create } from 'zustand';
import type { SearchCriteria } from '../../shared/types/SearchCriteria';

/**
 * Kayıtlı/geçmiş bir aramayı "Toplamaya Başla"yı otomatik tetiklemeden arama
 * ekranına yüklemek için kullanılır. SavedView taslağı yazar, SearchView mount
 * olunca alanlarını doldurur ve taslağı temizler.
 */
interface SearchDraftState {
  draft: SearchCriteria | null;
  setDraft: (c: SearchCriteria) => void;
  clearDraft: () => void;
}

export const useSearchDraftStore = create<SearchDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
