import { create } from 'zustand';
import type { DecisionCategory, SavedDecision } from '../../shared/types/Collection';
import type { Decision } from '../../shared/types/Decision';
import { generateId } from '../../shared/utils/textUtils';
import { isoNow } from '../../shared/utils/dateUtils';
import {
  getCategories,
  putCategory,
  removeCategory,
  getSavedDecisions,
  putSavedDecision,
  removeSavedDecision,
} from '../../shared/utils/chromeStorage';

type DecisionInput = Pick<Decision, 'id' | 'chamber' | 'esasNo' | 'kararNo' | 'date' | 'year'>;

function newEntry(d: DecisionInput, keywords: string[], categoryIds: string[]): SavedDecision {
  return {
    id: d.id,
    chamber: d.chamber,
    esasNo: d.esasNo,
    kararNo: d.kararNo,
    date: d.date,
    year: d.year,
    categoryIds,
    keywords,
    savedAt: isoNow(),
  };
}

interface CollectionsState {
  categories: DecisionCategory[];
  saved: SavedDecision[];
  isLoaded: boolean;

  load: () => Promise<void>;
  createCategory: (name: string, color: string) => Promise<DecisionCategory>;
  updateCategory: (id: string, patch: Partial<Pick<DecisionCategory, 'name' | 'color'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  /** Tek karar için bir kategori üyeliğini aç/kapat (yoksa ekler, varsa çıkarır). */
  toggleDecisionCategory: (decision: DecisionInput, keywords: string[], categoryId: string) => Promise<void>;
  /** Birden çok kararı bir kategoriye ekler (floating bar — toplu). */
  addDecisionsToCategory: (decisions: DecisionInput[], keywords: string[], categoryId: string) => Promise<void>;
  /** Kararı yalnızca bir kategoriden çıkarır (son kategoriyse tamamen siler). */
  removeFromCategory: (decisionId: string, categoryId: string) => Promise<void>;
  /** Kararı tüm kategorilerden çıkarır (tamamen kaldırır). */
  unsaveDecision: (id: string) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  categories: [],
  saved: [],
  isLoaded: false,

  load: async () => {
    const [categories, saved] = await Promise.all([getCategories(), getSavedDecisions()]);
    categories.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    set({ categories, saved, isLoaded: true });
  },

  createCategory: async (name, color) => {
    const cat: DecisionCategory = { id: generateId(), name: name.trim(), color, createdAt: isoNow() };
    await putCategory(cat);
    set({ categories: [...get().categories, cat] });
    return cat;
  },

  updateCategory: async (id, patch) => {
    const cat = get().categories.find((c) => c.id === id);
    if (!cat) return;
    const updated = { ...cat, ...patch };
    await putCategory(updated);
    set({ categories: get().categories.map((c) => (c.id === id ? updated : c)) });
  },

  deleteCategory: async (id) => {
    await removeCategory(id);
    set({
      categories: get().categories.filter((c) => c.id !== id),
      saved: get()
        .saved.map((d) => ({ ...d, categoryIds: d.categoryIds.filter((c) => c !== id) }))
        .filter((d) => d.categoryIds.length > 0),
    });
  },

  toggleDecisionCategory: async (decision, keywords, categoryId) => {
    const existing = get().saved.find((d) => d.id === decision.id);
    if (existing) {
      const has = existing.categoryIds.includes(categoryId);
      const categoryIds = has
        ? existing.categoryIds.filter((c) => c !== categoryId)
        : [...existing.categoryIds, categoryId];
      if (categoryIds.length === 0) {
        await removeSavedDecision(decision.id);
        set({ saved: get().saved.filter((d) => d.id !== decision.id) });
        return;
      }
      const entry = { ...existing, categoryIds };
      await putSavedDecision(entry);
      set({ saved: get().saved.map((d) => (d.id === entry.id ? entry : d)) });
    } else {
      const entry = newEntry(decision, keywords, [categoryId]);
      await putSavedDecision(entry);
      set({ saved: [...get().saved, entry] });
    }
  },

  addDecisionsToCategory: async (decisions, keywords, categoryId) => {
    const byId = new Map(get().saved.map((d) => [d.id, d]));
    for (const dec of decisions) {
      const existing = byId.get(dec.id);
      const entry = existing
        ? { ...existing, categoryIds: existing.categoryIds.includes(categoryId) ? existing.categoryIds : [...existing.categoryIds, categoryId] }
        : newEntry(dec, keywords, [categoryId]);
      await putSavedDecision(entry);
      byId.set(dec.id, entry);
    }
    set({ saved: [...byId.values()] });
  },

  removeFromCategory: async (decisionId, categoryId) => {
    const existing = get().saved.find((d) => d.id === decisionId);
    if (!existing) return;
    const categoryIds = existing.categoryIds.filter((c) => c !== categoryId);
    if (categoryIds.length === 0) {
      await removeSavedDecision(decisionId);
      set({ saved: get().saved.filter((d) => d.id !== decisionId) });
    } else {
      const entry = { ...existing, categoryIds };
      await putSavedDecision(entry);
      set({ saved: get().saved.map((d) => (d.id === decisionId ? entry : d)) });
    }
  },

  unsaveDecision: async (id) => {
    await removeSavedDecision(id);
    set({ saved: get().saved.filter((d) => d.id !== id) });
  },
}));
