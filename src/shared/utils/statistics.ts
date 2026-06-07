import type { DecisionMetadata } from '../types/Decision';
import type { SearchStatistics } from '../types/SearchResult';

export function computeStatistics(decisions: DecisionMetadata[]): SearchStatistics {
  const yearMap: Record<number, number> = {};
  const chamberMap: Record<string, number> = {};
  let firstDate: string | null = null;
  let lastDate: string | null = null;

  for (const d of decisions) {
    // Yıl dağılımı
    yearMap[d.year] = (yearMap[d.year] ?? 0) + 1;

    // Daire dağılımı
    const chamber = d.chamber || 'Bilinmiyor';
    chamberMap[chamber] = (chamberMap[chamber] ?? 0) + 1;

    // Tarih aralığı
    if (d.date) {
      if (!firstDate || d.date < firstDate) firstDate = d.date;
      if (!lastDate || d.date > lastDate) lastDate = d.date;
    }
  }

  const byYear = Object.entries(yearMap)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year);

  const byChamber = Object.entries(chamberMap)
    .map(([chamber, count]) => ({ chamber, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCount: decisions.length,
    firstDecisionDate: firstDate,
    lastDecisionDate: lastDate,
    byYear,
    byChamber,
  };
}
