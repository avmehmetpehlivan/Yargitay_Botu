import { clsx } from 'clsx';
import type { View } from '../App';
import { Icon, type IconName } from './Icon';

interface NavRailProps {
  view: View;
  onNavigate: (v: View) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  showResults: boolean;
  resultCount?: number | null;
  savedCount?: number | null;
}

const NAV: { id: View; icon: IconName; label: string }[] = [
  { id: 'search', icon: 'search', label: 'Ara' },
  { id: 'results', icon: 'results', label: 'Sonuçlar' },
  { id: 'collections', icon: 'bookmark', label: 'Koleksiyon' },
  { id: 'history', icon: 'clock', label: 'Geçmiş' },
  { id: 'saved', icon: 'star', label: 'Kayıtlı' },
];

function RailButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: IconName;
  label: string;
  badge?: number | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        'relative flex h-[50px] w-[52px] flex-col items-center justify-center gap-[3px] rounded-md transition-colors',
        active ? 'bg-accent-weak text-accent-text' : 'text-fg-3 hover:bg-surface-3 hover:text-fg',
      )}
    >
      {active && (
        <span className="absolute -left-2 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
      )}
      <Icon name={icon} size={19} stroke={active ? 1.9 : 1.6} />
      <span className="text-[9.5px] font-medium tracking-wide">{label}</span>
      {badge != null && badge > 0 && (
        <em className="absolute right-[9px] top-[7px] grid h-[15px] min-w-[15px] place-items-center rounded-full bg-accent px-1 text-[9px] font-semibold not-italic tabular-nums text-on-accent">
          {badge > 99 ? '99+' : badge}
        </em>
      )}
    </button>
  );
}

export function NavRail({
  view,
  onNavigate,
  theme,
  onToggleTheme,
  showResults,
  resultCount,
  savedCount,
}: NavRailProps) {
  const items = showResults ? NAV : NAV.filter((n) => n.id !== 'results');
  return (
    <nav className="flex w-[68px] shrink-0 flex-col items-center gap-0.5 border-r border-line bg-rail pb-3 pt-[14px]">
      <img
        src="/icons/extension-icon128.png"
        alt="Yargıtay Karar Asistanı"
        title="Yargıtay Karar Asistanı"
        className="mb-[14px] h-[38px] w-[38px] shrink-0 rounded-[11px] object-cover shadow-sm"
      />

      <div className="flex w-full flex-col items-center gap-[3px]">
        {items.map((n) => (
          <RailButton
            key={n.id}
            active={view === n.id}
            icon={n.icon}
            label={n.label}
            badge={n.id === 'results' ? resultCount : n.id === 'collections' ? savedCount : null}
            onClick={() => onNavigate(n.id)}
          />
        ))}
      </div>

      <div className="flex-1" />

      <RailButton
        active={false}
        icon={theme === 'dark' ? 'sun' : 'moon'}
        label={theme === 'dark' ? 'Açık' : 'Koyu'}
        onClick={onToggleTheme}
      />
      <RailButton
        active={view === 'settings'}
        icon="settings"
        label="Ayarlar"
        onClick={() => onNavigate('settings')}
      />
    </nav>
  );
}
