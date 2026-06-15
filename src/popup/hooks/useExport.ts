import { useCallback, useState } from 'react';
import type { Decision } from '../../shared/types/Decision';
import { buildWordHtml } from '../export/word';

type ExportState = 'idle' | 'busy' | 'done' | 'error';

async function downloadTextFile(content: string, filename: string, mime: string): Promise<void> {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({ url, filename, saveAs: false });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function useExport() {
  const [state, setState] = useState<ExportState>('idle');

  const exportWord = useCallback(async (decisions: Decision[], keywords: string[]) => {
    setState('busy');
    try {
      await downloadTextFile(
        buildWordHtml(decisions, keywords),
        `Yargitay_Kararlar_${stamp()}.doc`,
        'application/msword',
      );
      setState('done');
    } catch {
      setState('error');
    }
  }, []);

  const reset = useCallback(() => setState('idle'), []);

  return { state, exportWord, reset };
}
