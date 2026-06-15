import { useCallback, useEffect } from 'react';
import { useScrapingStore } from '../store/scraping.store';
import { useHistoryStore } from '../store/history.store';
import { MSG } from '../../shared/types/Messages';
import type { StatusResponse } from '../../shared/types/Messages';
import type { SearchCriteria } from '../../shared/types/SearchCriteria';

const POLL_INTERVAL_MS = 600;
const YARGITAY_HOST = 'karararama.yargitay.gov.tr';

/**
 * Açık Yargıtay sekmesinin id'sini bulur. AKTİF sekmeye bakmaz — yan panel kalıcı
 * olduğundan kullanıcı başka sekmeye/devtools'a geçmiş olabilir; karararama sekmesi
 * arka planda açık olduğu sürece sayfalama/çekim çalışmalı. (host izni url filtresine
 * yeter; `tabs` izni gerekmez.)
 */
async function findYargitayTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ url: `*://${YARGITAY_HOST}/*` });
  return tabs.find((t) => t.id != null)?.id ?? null;
}

export function useScraping() {
  const store = useScrapingStore();
  const historyStore = useHistoryStore();

  const phase = store.job?.phase ?? 'idle';
  const isRunning = phase === 'metadata' || phase === 'fulltext';

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const response = (await chrome.runtime.sendMessage({
          action: MSG.GET_STATUS,
        })) as StatusResponse;

        if (!response?.job) return;
        store.setJob(response.job);

        if (response.job.phase === 'complete') historyStore.load();
      } catch {
        // Service worker uyumuşsa — bir sonraki tick'te tekrar dener
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isRunning, store, historyStore]);

  // ── Başlat ────────────────────────────────────────────────────────────────
  const start = useCallback(
    async (criteria: SearchCriteria) => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id || !tab.url?.includes(YARGITAY_HOST)) {
        // Doğru sayfada değil — SearchView zaten uyarı gösteriyor, burada sessiz kal
        return;
      }

      await chrome.runtime.sendMessage({
        action: MSG.START_SCRAPING,
        criteria,
        tabId: tab.id,
      });

      const response = (await chrome.runtime.sendMessage({
        action: MSG.GET_STATUS,
      })) as StatusResponse;

      if (response?.job) store.setJob(response.job);
    },
    [store],
  );

  // ── Sonraki 100'lük bloğu çek (kullanıcı sayfalarken talep üzerine) ────────
  const loadMore = useCallback(async () => {
    const tabId = await findYargitayTabId();
    if (tabId == null) return;

    await chrome.runtime.sendMessage({ action: MSG.LOAD_MORE, tabId });

    const response = (await chrome.runtime.sendMessage({
      action: MSG.GET_STATUS,
    })) as StatusResponse;
    if (response?.job) store.setJob(response.job);
  }, [store]);

  // ── Seçili kararların tam metnini çek (talep üzerine) ──────────────────────
  const fetchFulltexts = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const tabId = await findYargitayTabId();
      if (tabId == null) return;

      await chrome.runtime.sendMessage({ action: MSG.FETCH_FULLTEXTS, ids, tabId });

      const response = (await chrome.runtime.sendMessage({
        action: MSG.GET_STATUS,
      })) as StatusResponse;
      if (response?.job) store.setJob(response.job);
    },
    [store],
  );

  // ── Tam metin çekimini iptal et (sonuç listesini koruyarak) ────────────────
  const cancelFulltext = useCallback(async () => {
    await chrome.runtime.sendMessage({ action: MSG.STOP_SCRAPING });
    const response = (await chrome.runtime.sendMessage({
      action: MSG.GET_STATUS,
    })) as StatusResponse;
    if (response?.job) store.setJob(response.job);
  }, [store]);

  // ── Durdur ────────────────────────────────────────────────────────────────
  const stop = useCallback(async () => {
    await chrome.runtime.sendMessage({ action: MSG.STOP_SCRAPING });
    store.reset();
  }, [store]);

  return {
    job: store.job,
    phase,
    isRunning,
    lastResult: store.lastResult,
    start,
    stop,
    loadMore,
    fetchFulltexts,
    cancelFulltext,
    reset: store.reset,
  };
}
