/**
 * Body metninden karar içtihat metnini ayıklar.
 * "İçtihat Metni" ile başlayan kısmı alır,
 * "Önceki Karar" veya "Sonraki Karar" gelince keser.
 */
export function extractDecisionText(bodyText: string): string | null {
  const parts = bodyText.split('İçtihat Metni');
  if (parts.length < 2) return null;

  let text = 'İçtihat Metni' + parts[parts.length - 1];

  for (const marker of ['Önceki Karar', 'Sonraki Karar']) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      text = text.slice(0, idx);
      break;
    }
  }

  return text.trim() || null;
}

/**
 * Bir metinde verilen keyword'lerin kaç kez geçtiğini sayar (büyük/küçük harf duyarsız).
 */
export function countKeywordOccurrences(text: string, keywords: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  const lower = text.toLowerCase();

  for (const kw of keywords) {
    const re = new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result[kw] = (lower.match(re) ?? []).length;
  }

  return result;
}

/** Tablo hücresi metnini temizler */
export function cleanCellText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** UUID v4 benzeri basit ID üretir */
export function generateId(): string {
  return crypto.randomUUID();
}
