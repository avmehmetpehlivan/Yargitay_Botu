import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SearchStatistics } from '../../../shared/types/SearchResult';

interface YearlyBarChartProps {
  data: SearchStatistics['byYear'];
  activeYears: number[];
  onToggleYear: (year: number) => void;
}

export function YearlyBarChart({ data, activeYears, onToggleYear }: YearlyBarChartProps) {
  if (!data.length) return null;

  const fillFor = (year: number) => {
    if (!activeYears.length) return '#5cc0c1'; // filtre yok → nötr teal
    return activeYears.includes(year) ? '#40aead' : '#d3f0f0'; // seçili koyu, diğerleri soluk
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Yıllara Göre Dağılım
      </h3>
      <p className="mb-2 text-[10px] text-slate-400">Filtrelemek için yıla tıklayın</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            labelStyle={{ fontWeight: 600 }}
            formatter={(v: number) => [`${v} karar`, '']}
            cursor={{ fill: '#f0fbfb' }}
          />
          <Bar
            dataKey="count"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
            cursor="pointer"
            onClick={(d: { year?: number; payload?: { year?: number } }) => {
              const y = d?.year ?? d?.payload?.year;
              if (y != null) onToggleYear(Number(y));
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.year} fill={fillFor(entry.year)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
