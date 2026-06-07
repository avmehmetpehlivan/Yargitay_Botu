import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { SearchStatistics } from '../../../shared/types/SearchResult';

// Teal tonları (marka rengi #40aead etrafında)
const COLORS = [
  '#40aead', '#338e8f', '#5cc0c1', '#28706f', '#6fcccd',
  '#49b4b5', '#98dadb', '#c2e9ea', '#1f5b5a', '#86d0d1',
];

const OTHER = 'Diğer';

interface ChamberPieChartProps {
  data: SearchStatistics['byChamber'];
  activeChambers: string[];
  onToggleChamber: (chamber: string) => void;
}

export function ChamberPieChart({ data, activeChambers, onToggleChamber }: ChamberPieChartProps) {
  if (!data.length) return null;

  // En fazla 8 daire göster; geri kalanları "Diğer" olarak grupla
  const MAX = 8;
  const visible = data.slice(0, MAX);
  const rest = data.slice(MAX);
  const chartData =
    rest.length > 0
      ? [...visible, { chamber: OTHER, count: rest.reduce((s, d) => s + d.count, 0) }]
      : visible;

  const shorten = (s: string) => s.replace('Hukuk Dairesi', 'HD').replace('Ceza Dairesi', 'CD');

  // "Diğer" filtrelenemez (birden çok daireyi temsil eder).
  const toggle = (chamber: string) => chamber !== OTHER && onToggleChamber(chamber);
  const opacityFor = (chamber: string) =>
    !activeChambers.length || activeChambers.includes(chamber) ? 1 : 0.25;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Dairelere Göre Dağılım
      </h3>
      <p className="mb-2 text-[10px] text-slate-400">Filtrelemek için daireye tıklayın</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="chamber"
            cx="50%"
            cy="50%"
            outerRadius={60}
            innerRadius={28}
            cursor="pointer"
            onClick={(d: { chamber?: string; payload?: { chamber?: string } }) => {
              const ch = d?.chamber ?? d?.payload?.chamber;
              if (ch) toggle(ch);
            }}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={entry.chamber}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={opacityFor(entry.chamber)}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(v: number, name: string) => [`${v} karar`, shorten(name)]}
          />
          <Legend
            onClick={(e: { value?: string }) => e?.value && toggle(e.value)}
            formatter={(v) => (
              <span style={{ fontSize: 10, cursor: 'pointer' }}>{shorten(v)}</span>
            )}
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
