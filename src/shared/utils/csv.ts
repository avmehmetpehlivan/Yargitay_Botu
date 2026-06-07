import type { DecisionMetadata } from '../types/Decision';
import { formatDateTR } from './dateUtils';

// Türkçe Excel virgülü ondalık ayırıcı sayar; ';' ile daha güvenli açılır.
const SEP = ';';

function esc(v: string | number): string {
  const s = String(v ?? '');
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Kararların künye tablosunu CSV string'ine çevirir (metadata; tam metin gerekmez). */
export function buildDecisionsCsv(decisions: DecisionMetadata[]): string {
  const header = ['Sıra', 'Daire', 'Esas No', 'Karar No', 'Tarih'];
  const rows = decisions.map((d, i) => [
    i + 1,
    d.chamber,
    d.esasNo,
    d.kararNo,
    formatDateTR(d.date),
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(SEP)).join('\r\n');
}
