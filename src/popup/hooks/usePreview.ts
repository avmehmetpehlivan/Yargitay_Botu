import { useCallback, useState } from 'react';
import { MSG, type PreviewResponse } from '../../shared/types/Messages';

type PreviewState = 'idle' | 'loading' | 'done' | 'empty' | 'ratelimited' | 'offsite';

const YARGITAY_HOST = 'karararama.yargitay.gov.tr';

/**
 * Tek kararın tam metnini önizleme için çeker. Background önce IndexedDB cache'e
 * bakar; cache'te varsa aktif sekme Yargıtay olmasa da çalışır. Cache yoksa
 * content script (= açık Yargıtay sekmesi) gerekir.
 */
export function usePreview() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [state, setState] = useState<PreviewState>('idle');

  const open = useCallback(async (id: string) => {
    setPreviewId(id);
    setState('loading');
    setText('');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setState('offsite');
      return;
    }

    const res = (await chrome.runtime.sendMessage({
      action: MSG.PREVIEW_FULLTEXT,
      id,
      tabId: tab.id,
    })) as PreviewResponse | undefined;

    if (res?.rateLimited) setState('ratelimited');
    else if (res?.fullText) {
      setText(res.fullText);
      setState('done');
    } else {
      // Metin boş: cache'te yok + aktif sekme Yargıtay değilse çekilemez.
      setState(tab.url?.includes(YARGITAY_HOST) ? 'empty' : 'offsite');
    }
  }, []);

  const close = useCallback(() => {
    setPreviewId(null);
    setState('idle');
    setText('');
  }, []);

  return { previewId, text, state, open, close };
}
