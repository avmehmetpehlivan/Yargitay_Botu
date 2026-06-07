import { clsx } from 'clsx';
import type { View } from '../../App';

interface NavigationProps {
  active: View;
  onSelect: (v: View) => void;
  newDecisionCount: number;
}

const TABS: { id: View; label: string; icon: string }[] = [
  { id: 'search',  label: 'Arama',    icon: '🔍' },
  { id: 'results', label: 'Sonuçlar', icon: '📊' },
  { id: 'history', label: 'Geçmiş',   icon: '🕐' },
  { id: 'saved',   label: 'Kayıtlı',  icon: '⭐' },
];

export function Navigation({ active, onSelect, newDecisionCount }: NavigationProps) {
  return (
    <nav className="flex border-t border-slate-200 bg-white">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={clsx(
            'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
            active === tab.id
              ? 'text-brand-700 font-semibold'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <span className="text-base leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.id === 'saved' && newDecisionCount > 0 && (
            <span className="absolute right-3 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {newDecisionCount > 9 ? '9+' : newDecisionCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
