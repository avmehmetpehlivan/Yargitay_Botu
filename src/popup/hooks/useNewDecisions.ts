import { useEffect } from 'react';
import { useSavedStore } from '../store/saved.store';

/**
 * Popup açıldığında kayıtlı aramaların yeni karar durumunu
 * lazy olarak kontrol eder (badge sayısını günceller).
 */
export function useNewDecisions() {
  const { items, load } = useSavedStore();

  useEffect(() => {
    load();
  }, [load]);

  const totalNew = items.reduce((sum, s) => sum + s.newDecisionCount, 0);

  // Extension badge'i güncelle
  useEffect(() => {
    if (totalNew > 0) {
      chrome.action.setBadgeText({ text: String(totalNew) });
      chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }, [totalNew]);

  return { totalNew };
}
