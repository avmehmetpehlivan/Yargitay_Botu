import type { SavedSearch } from '../shared/types/SavedSearch';
import { alarmName, NEW_DECISION_CHECK_INTERVAL_MINUTES } from '../shared/constants/storage';
import type { StorageManager } from './StorageManager';
import { isoNow } from '../shared/utils/dateUtils';

export class AlarmScheduler {
  constructor(private storage: StorageManager) {}

  /** Tüm kayıtlı aramalar için alarm oluşturur */
  async scheduleAll(): Promise<void> {
    const saved = await this.storage.getSavedSearches();
    for (const s of saved) {
      await this.schedule(s);
    }
  }

  async schedule(saved: SavedSearch): Promise<void> {
    const name = alarmName(saved.id);
    const existing = await chrome.alarms.get(name);
    if (existing) return; // Zaten planlandı

    chrome.alarms.create(name, {
      delayInMinutes: NEW_DECISION_CHECK_INTERVAL_MINUTES,
      periodInMinutes: NEW_DECISION_CHECK_INTERVAL_MINUTES,
    });
  }

  async unschedule(savedId: string): Promise<void> {
    await chrome.alarms.clear(alarmName(savedId));
  }

  /**
   * Alarm tetiklendiğinde çağrılır.
   * Kaydedilen aramayı bulur; sayısını aktif sekme üzerinden kontrol eder.
   * (Lazy check: sekme açıksa kontrol edilir, yoksa atlanır.)
   */
  async onAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    if (!alarm.name.startsWith('new-decisions:')) return;

    const savedId = alarm.name.replace('new-decisions:', '');
    const saved = (await this.storage.getSavedSearches()).find((s) => s.id === savedId);
    if (!saved) return;

    const tabs = await chrome.tabs.query({
      url: '*://karararama.yargitay.gov.tr/*',
    });

    if (tabs.length === 0) return; // Site açık değil; alarm bir sonrakinde tekrar dener

    const tab = tabs[0];
    if (!tab.id) return;

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'SCRAPE_METADATA',
        criteria: { keywords: saved.keywords },
      });

      if (response?.ok) {
        // Gerçek sayı METADATA_BATCH mesajlarında gelir; burada sadece timestamp güncellenir
        await this.storage.updateSavedSearch(savedId, { lastCheckedAt: isoNow() });
      }
    } catch {
      // Tab content script yüklü değil — yoksay
    }
  }

  /** Yeni karar sayısını günceller ve bildirim gönderir */
  async updateNewDecisionCount(savedId: string, newCount: number): Promise<void> {
    const saved = (await this.storage.getSavedSearches()).find((s) => s.id === savedId);
    if (!saved) return;

    const diff = newCount - saved.lastCheckedCount;
    if (diff <= 0) return;

    await this.storage.updateSavedSearch(savedId, {
      lastCheckedCount: newCount,
      lastCheckedAt: isoNow(),
      newDecisionCount: diff,
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Yargıtay Karar Asistanı',
      message: `"${saved.keywords.join(', ')}" aramasında ${diff} yeni karar bulundu.`,
    });
  }
}
