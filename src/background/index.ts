import { ScrapingOrchestrator } from './ScrapingOrchestrator';
import { StorageManager } from './StorageManager';
import { AlarmScheduler } from './AlarmScheduler';
import { MessageRouter } from './MessageRouter';
import type { ContentToBackground } from '../shared/types/Messages';

// ─── Singleton instances ──────────────────────────────────────────────────────

const storage     = new StorageManager();
const orchestrator = new ScrapingOrchestrator();
const scheduler   = new AlarmScheduler(storage);
const router      = new MessageRouter(orchestrator, storage, scheduler);

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const action = (message as { action: string }).action;

  // Content script mesajları
  const contentActions = ['METADATA_BATCH', 'FULLTEXT_BATCH', 'FULLTEXT_PROGRESS', 'CONTENT_COMPLETE', 'CONTENT_ERROR'];
  if (contentActions.includes(action)) {
    orchestrator.handleContentMessage(message as ContentToBackground);
    sendResponse({ ok: true });
    return true;
  }

  // Popup mesajları
  return router.handle(message, sender, sendResponse);
});

// ─── Alarm listener ──────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  scheduler.onAlarm(alarm).catch(console.error);
});

// ─── Kurulum ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  scheduler.scheduleAll().catch(console.error);
});
