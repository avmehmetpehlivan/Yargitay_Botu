import type { StorageSchema } from '../types/Storage';
import { DEFAULT_SETTINGS } from '../types/Storage';
import { STORAGE_KEYS } from '../constants/storage';
import type { SearchHistoryItem } from '../types/SearchResult';
import type { SavedSearch } from '../types/SavedSearch';
import type { DecisionCategory, SavedDecision } from '../types/Collection';
import type { UserSettings } from '../types/Storage';

// ─── Temel okuma/yazma ───────────────────────────────────────────────────────

async function get<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K]> {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

async function set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<SearchHistoryItem[]> {
  return (await get(STORAGE_KEYS.searchHistory)) ?? [];
}

export async function addHistory(item: SearchHistoryItem, maxItems: number): Promise<void> {
  const history = await getHistory();
  const deduped = history.filter((h) => h.id !== item.id);
  const updated = [item, ...deduped].slice(0, maxItems);
  await set(STORAGE_KEYS.searchHistory, updated);
}

export async function removeHistory(id: string): Promise<void> {
  const history = await getHistory();
  await set(STORAGE_KEYS.searchHistory, history.filter((h) => h.id !== id));
}

export async function clearHistory(): Promise<void> {
  await set(STORAGE_KEYS.searchHistory, []);
}

// ─── Saved Searches ───────────────────────────────────────────────────────────

export async function getSavedSearches(): Promise<SavedSearch[]> {
  return (await get(STORAGE_KEYS.savedSearches)) ?? [];
}

export async function saveSavedSearch(item: SavedSearch): Promise<void> {
  const list = await getSavedSearches();
  const deduped = list.filter((s) => s.id !== item.id);
  await set(STORAGE_KEYS.savedSearches, [...deduped, item]);
}

export async function updateSavedSearch(
  id: string,
  patch: Partial<SavedSearch>,
): Promise<void> {
  const list = await getSavedSearches();
  const updated = list.map((s) => (s.id === id ? { ...s, ...patch } : s));
  await set(STORAGE_KEYS.savedSearches, updated);
}

export async function removeSavedSearch(id: string): Promise<void> {
  const list = await getSavedSearches();
  await set(STORAGE_KEYS.savedSearches, list.filter((s) => s.id !== id));
}

// ─── Decision Categories (koleksiyonlar) ──────────────────────────────────────

export async function getCategories(): Promise<DecisionCategory[]> {
  return (await get(STORAGE_KEYS.decisionCategories)) ?? [];
}

export async function putCategory(cat: DecisionCategory): Promise<void> {
  const list = await getCategories();
  const deduped = list.filter((c) => c.id !== cat.id);
  await set(STORAGE_KEYS.decisionCategories, [...deduped, cat]);
}

/** Kategoriyi siler; bu kategori üyeliğini tüm kararlardan kaldırır, başka
 *  kategorisi kalmayan kararları tamamen siler. */
export async function removeCategory(id: string): Promise<void> {
  const cats = await getCategories();
  await set(STORAGE_KEYS.decisionCategories, cats.filter((c) => c.id !== id));
  const saved = await getSavedDecisions();
  const updated = saved
    .map((d) => ({ ...d, categoryIds: d.categoryIds.filter((c) => c !== id) }))
    .filter((d) => d.categoryIds.length > 0);
  await set(STORAGE_KEYS.savedDecisions, updated);
}

// ─── Saved Decisions (kaydedilen kararlar) ─────────────────────────────────────

export async function getSavedDecisions(): Promise<SavedDecision[]> {
  return (await get(STORAGE_KEYS.savedDecisions)) ?? [];
}

/** Kararı kaydeder/günceller (id'ye göre tekil — kategori değişikliği = taşıma). */
export async function putSavedDecision(item: SavedDecision): Promise<void> {
  const list = await getSavedDecisions();
  const deduped = list.filter((d) => d.id !== item.id);
  await set(STORAGE_KEYS.savedDecisions, [...deduped, item]);
}

export async function removeSavedDecision(id: string): Promise<void> {
  const list = await getSavedDecisions();
  await set(STORAGE_KEYS.savedDecisions, list.filter((d) => d.id !== id));
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  return (await get(STORAGE_KEYS.settings)) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await set(STORAGE_KEYS.settings, settings);
}
