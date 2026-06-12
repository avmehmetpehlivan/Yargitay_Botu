import { ScrapingOrchestrator } from './ScrapingOrchestrator';
import { StorageManager } from './StorageManager';
import { MessageRouter } from './MessageRouter';
import type { ContentToBackground } from '../shared/types/Messages';

// ─── Singleton instances ──────────────────────────────────────────────────────

const storage     = new StorageManager();
const orchestrator = new ScrapingOrchestrator();
const router      = new MessageRouter(orchestrator, storage);

// Araç çubuğu ikonuna basınca yan panel açılsın (popup yerine). Yan panel
// odak kaybında kapanmaz → kullanıcı kararları önizlerken arayüz açık kalır.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((e) => console.error('[Background] sidePanel setPanelBehavior:', e));

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
