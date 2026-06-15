import type { PopupToBackground, ContentToBackground, StatusResponse, GenericResponse, PreviewResponse } from '../shared/types/Messages';
import type { ScrapingOrchestrator } from './ScrapingOrchestrator';
import type { StorageManager } from './StorageManager';
import type { SearchResult } from '../shared/types/SearchResult';

type SendResponse = (response: StatusResponse | GenericResponse | SearchResult | PreviewResponse | null) => void;

export class MessageRouter {
  constructor(
    private orchestrator: ScrapingOrchestrator,
    private storage: StorageManager,
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

  // ─── Content Script mesajları (background kendi içinde yönlendirir) ────────

  handleContentMessage(msg: ContentToBackground): void {
    this.orchestrator.handleContentMessage(msg);
  }

  // ─── Popup mesajları ──────────────────────────────────────────────────────

  private async dispatch(msg: PopupToBackground, sendResponse: SendResponse): Promise<void> {
    // SW yeniden başlamış olabilir → job'ı oturum-belleğinden geri yükle (loadMore,
    // GET_STATUS, FETCH_FULLTEXTS, PREVIEW sonrası bellek boşsa kurtarır).
    await this.orchestrator.hydrate();

    switch (msg.action) {
      case 'START_SCRAPING': {
        if (this.orchestrator.isRunning()) {
          sendResponse({ ok: false, error: 'Zaten çalışıyor' });
          return;
        }

        this.orchestrator.onComplete = (result) => this.storage.persistSearchResult(result);
        this.orchestrator.onError = (err) => console.error('[Background] Scraping error:', err);
        this.orchestrator.start(msg.tabId, msg.criteria);

        sendResponse({ ok: true });
        break;
      }

      case 'LOAD_MORE': {
        this.orchestrator.loadMore(msg.tabId);
        sendResponse({ ok: true });
        break;
      }

      case 'FETCH_FULLTEXTS': {
        this.orchestrator.fetchFulltexts(msg.tabId, msg.ids);
        sendResponse({ ok: true });
        break;
      }

      case 'PREVIEW_FULLTEXT': {
        const { fullText, rateLimited } = await this.orchestrator.previewFulltext(msg.tabId, msg.id);
        sendResponse({ ok: true, fullText, rateLimited });
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
        await this.storage.saveSearch(msg.keywords, msg.label, msg.criteria);
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
        sendResponse({ ok: true });
        break;
      }

      case 'DELETE_HISTORY_ITEM': {
        await this.storage.deleteHistoryItem(msg.id);
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Bilinmeyen mesaj' });
    }
  }
}
