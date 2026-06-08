import { clsx } from 'clsx';
import type { View } from '../../App';

interface NavigationProps {
  active: View;
  onSelect: (v: View) => void;
}

const TABS: { id: View; label: string; icon: string }[] = [
  { id: 'search',  label: 'Arama',    icon: '🔍' },
  { id: 'results', label: 'Sonuçlar', icon: '📊' },
  { id: 'history', label: 'Geçmiş',   icon: '🕐' },
  { id: 'saved',   label: 'Kayıtlı',  icon: '⭐' },
];

export function Navigation({ active, onSelect }: NavigationProps) {
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
        </button>
      ))}
    </nav>
  );
}
