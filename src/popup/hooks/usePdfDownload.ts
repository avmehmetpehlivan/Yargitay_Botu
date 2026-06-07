import { useState, useCallback } from 'react';
import type { Decision } from '../../shared/types/Decision';

type PdfState = 'idle' | 'generating' | 'done' | 'error';
type PdfMode = 'full' | 'summary';

export function usePdfDownload() {
  const [state, setState] = useState<PdfState>('idle');
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (decisions: Decision[], keywords: string[], mode: PdfMode = 'full') => {
      setState('generating');
      setError(null);

      try {
        const mod = await import('../../pdf/PdfGenerator');
        const blob =
          mode === 'summary'
            ? await mod.generateSummaryPdf(decisions, keywords)
            : await mod.generatePdf(decisions, keywords);

        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0, 10);
        const suffix = mode === 'summary' ? 'Kunye' : 'TamMetin';

        await chrome.downloads.download({
          url,
          filename: `Yargitay_Kararlari_${suffix}_${timestamp}.pdf`,
          saveAs: false,
        });

        // Blob URL'yi temizle (kısa gecikme ile — download başlayana kadar bekle)
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        setState('done');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'PDF oluşturulamadı');
        setState('error');
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return { state, error, download, reset };
}
