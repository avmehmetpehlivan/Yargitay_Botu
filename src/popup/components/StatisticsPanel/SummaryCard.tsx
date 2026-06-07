import type { SearchStatistics } from '../../../shared/types/SearchResult';
import { formatDateTR } from '../../../shared/utils/dateUtils';

interface SummaryCardProps {
  stats: SearchStatistics;
  keywords: string[];
}

export function SummaryCard({ stats, keywords }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Özet</h3>
        <div className="flex flex-wrap gap-1 justify-end">
          {keywords.map((kw) => (
            <span key={kw} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
              {kw}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Toplam Karar" value={String(stats.totalCount)} />
        <Metric label="İlk Karar" value={stats.firstDecisionDate ? formatDateTR(stats.firstDecisionDate) : '-'} />
        <Metric label="Son Karar"  value={stats.lastDecisionDate  ? formatDateTR(stats.lastDecisionDate)  : '-'} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
