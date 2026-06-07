/**
 * Karar tam metinleri için kalıcı IndexedDB cache (uzantı origin'inde).
 *
 * Hem background (yazma, okuma) hem popup (Ayarlar: temizle/say) erişir — ikisi
 * de aynı uzantı origin'inde olduğu için aynı IndexedDB'yi paylaşır.
 *
 * Yalnızca `id → fullText` saklanır; metadata zaten job'ta vardır. Karar metinleri
 * değişmez, bu yüzden TTL yok — yalnızca üst sınır aşılınca en eski kayıtlar atılır.
 */

const DB_NAME = 'yargitay-asistani';
const STORE = 'fulltexts';
const VERSION = 1;
const MAX_ENTRIES = 5000;

interface CacheEntry {
  id: string;
  fullText: string;
  cachedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('cachedAt', 'cachedAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Verilen id'lerin cache'teki tam metinlerini döner (id → fullText). */
export async function getCachedFulltexts(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      let remaining = ids.length;
      for (const id of ids) {
        const r = store.get(id);
        r.onsuccess = () => {
          const e = r.result as CacheEntry | undefined;
          if (e?.fullText) map.set(id, e.fullText);
          if (--remaining === 0) resolve();
        };
        r.onerror = () => {
          if (--remaining === 0) resolve();
        };
      }
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
  return map;
}

/** Tam metni dolu kararları cache'e yazar (boş metinler atlanır → tekrar denenir). */
export async function putFulltexts(items: { id: string; fullText: string }[]): Promise<void> {
  const valid = items.filter((i) => i.fullText);
  if (valid.length === 0) return;

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const now = Date.now();
      for (const i of valid) store.put({ id: i.id, fullText: i.fullText, cachedAt: now });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }

  await prune().catch(() => {});
}

/** Cache'teki kayıt sayısını döner (Ayarlar'da göstermek için). */
export async function countCache(): Promise<number> {
  const db = await openDb();
  try {
    return await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } finally {
    db.close();
  }
}

/** Tüm cache'i temizler (yalnızca karar metinleri; geçmiş/kayıtlı/ayarlar etkilenmez). */
export async function clearCache(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Üst sınır aşılırsa en eski kayıtları siler. */
async function prune(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const countReq = store.count();
      countReq.onsuccess = () => {
        let over = countReq.result - MAX_ENTRIES;
        if (over <= 0) return resolve();
        const cursorReq = store.index('cachedAt').openCursor(); // en eskiden başlar
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor && over > 0) {
            cursor.delete();
            over--;
            cursor.continue();
          } else {
            resolve();
          }
        };
        cursorReq.onerror = () => resolve();
      };
      countReq.onerror = () => resolve();
    });
  } finally {
    db.close();
  }
}
