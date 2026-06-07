/**
 * "15.03.2024" veya "2024-03-15" gibi formatları "YYYY-MM-DD"ye çevirir.
 * Geçersiz giriş için boş string döner.
 */
export function normalizeDate(raw: string): string {
  const trimmed = raw.trim();

  // DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m}-${d}`;
  }

  // YYYY-MM-DD (zaten standart)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  return '';
}

export function extractYear(date: string): number {
  return parseInt(date.slice(0, 4), 10);
}

export function formatDateTR(isoDate: string): string {
  if (!isoDate) return '-';
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

export function formatDateTimeTR(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}
