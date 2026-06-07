import { useCallback, useState } from 'react';
import type { Decision, DecisionMetadata } from '../../shared/types/Decision';
import { buildDecisionsCsv } from '../../shared/utils/csv';
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

  const exportCsv = useCallback(async (decisions: DecisionMetadata[]) => {
    setState('busy');
    try {
      // BOM → Excel UTF-8'i (Türkçe karakterler) doğru açar.
      await downloadTextFile(
        '﻿' + buildDecisionsCsv(decisions),
        `Yargitay_Kunye_${stamp()}.csv`,
        'text/csv;charset=utf-8',
      );
      setState('done');
    } catch {
      setState('error');
    }
  }, []);

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

  return { state, exportCsv, exportWord };
}
