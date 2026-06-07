import type { SearchResult } from '../../../shared/types/SearchResult';
import { computeStatistics } from '../../../shared/utils/statistics';
import { FilterChips } from '../FilterChips';
import { SummaryCard } from './SummaryCard';
import { YearlyBarChart } from './YearlyBarChart';
import { ChamberPieChart } from './ChamberPieChart';

interface StatisticsPanelProps {
  result: SearchResult;
  years: number[];
  chambers: string[];
  onToggleYear: (y: number) => void;
  onToggleChamber: (c: string) => void;
  onClearFilters: () => void;
}

export function StatisticsPanel({
  result,
  years,
  chambers,
  onToggleYear,
  onToggleChamber,
  onClearFilters,
}: StatisticsPanelProps) {
  // İstatistikler TÜM kararlar üzerinden hesaplanır; tıklama yalnızca alttaki
  // listeyi filtreler (çapraz-filtre deseni).
  const stats = computeStatistics(result.decisions);

  return (
    <div className="space-y-3">
      <SummaryCard stats={stats} keywords={result.keywords} />

      <FilterChips
        years={years}
        chambers={chambers}
        onToggleYear={onToggleYear}
        onToggleChamber={onToggleChamber}
        onClear={onClearFilters}
      />

      <YearlyBarChart data={stats.byYear} activeYears={years} onToggleYear={onToggleYear} />
      <ChamberPieChart
        data={stats.byChamber}
        activeChambers={chambers}
        onToggleChamber={onToggleChamber}
      />
    </div>
  );
}
