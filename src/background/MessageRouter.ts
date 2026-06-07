import type { PopupToBackground, ContentToBackground, StatusResponse, GenericResponse } from '../shared/types/Messages';
import type { ScrapingOrchestrator } from './ScrapingOrchestrator';
import type { StorageManager } from './StorageManager';
import type { AlarmScheduler } from './AlarmScheduler';
import type { SearchResult } from '../shared/types/SearchResult';
import { isoNow } from '../shared/utils/dateUtils';

type SendResponse = (response: StatusResponse | GenericResponse | SearchResult | null) => void;

export class MessageRouter {
  private lastResult: SearchResult | null = null;

  constructor(
    private orchestrator: ScrapingOrchestrator,
    private storage: StorageManager,
    private scheduler: AlarmScheduler,
  ) {}

  /** chrome.runtime.onMessage handler — sync wrapper */
  handle(
    message: PopupToBackground | ContentToBackground,
    _sender: chrome.runtime.MessageSender,
    sendResponse: SendResponse,
  ): boolean {
    this.dispatch(message as PopupToBackground, sendResponse).catch(console.error);
    return true; // async response
  }

  setLastResult(result: SearchResult): void {
    this.lastResult = result;
  }

  // ─── Content Script mesajları (background kendi içinde yönlendirir) ────────

  handleContentMessage(msg: ContentToBackground): void {
    this.orchestrator.handleContentMessage(msg);
  }

  // ─── Popup mesajları ──────────────────────────────────────────────────────

  private async dispatch(msg: PopupToBackground, sendResponse: SendResponse): Promise<void> {
    switch (msg.action) {
      case 'START_SCRAPING': {
        if (this.orchestrator.isRunning()) {
          sendResponse({ ok: false, error: 'Zaten çalışıyor' });
          return;
        }

        this.orchestrator.onComplete = (result) => {
          this.lastResult = result;
          this.storage.persistSearchResult(result);
        };
        this.orchestrator.onError = (err) => console.error('[Background] Scraping error:', err);
        const { maxDecisions } = await this.storage.getSettings();
        this.orchestrator.start(msg.tabId, msg.criteria, maxDecisions);

        sendResponse({ ok: true });
        break;
      }

      case 'FETCH_FULLTEXTS': {
        this.orchestrator.fetchFulltexts(msg.tabId, msg.ids);
        sendResponse({ ok: true });
        break;
      }

      case 'STOP_SCRAPING': {
        this.orchestrator.stop();
        sendResponse({ ok: true });
        break;
      }

      case 'GET_STATUS': {
        const job = this.orchestrator.getJob();
        sendResponse({ job } as StatusResponse);
        break;
      }

      case 'SAVE_SEARCH': {
        const saved = await this.storage.saveSearch(msg.keywords, msg.label, msg.criteria);
        await this.scheduler.schedule(saved);
        sendResponse({ ok: true });
        break;
      }

      case 'UPDATE_SAVED_LABEL': {
        await this.storage.updateSavedSearch(msg.id, { label: msg.label });
        sendResponse({ ok: true });
        break;
      }

      case 'DELETE_SAVED_SEARCH': {
        await this.storage.deleteSavedSearch(msg.id);
        await this.scheduler.unschedule(msg.id);
        sendResponse({ ok: true });
        break;
      }

      case 'DELETE_HISTORY_ITEM': {
        await this.storage.deleteHistoryItem(msg.id);
        sendResponse({ ok: true });
        break;
      }

      case 'CHECK_NEW_DECISIONS': {
        // Lazy check: mevcut sonuç varsa karşılaştır
        if (this.lastResult && this.lastResult.keywords.join('|') === msg.saved.keywords.join('|')) {
          const newCount = this.lastResult.totalCount;
          const diff = newCount - msg.saved.lastCheckedCount;
          await this.storage.updateSavedSearch(msg.saved.id, {
            lastCheckedAt: isoNow(),
            lastCheckedCount: newCount,
            newDecisionCount: diff > 0 ? diff : 0,
          });
        }
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Bilinmeyen mesaj' });
    }
  }
}
