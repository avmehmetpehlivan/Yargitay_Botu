import { useToastStore } from '../store/toast.store';
import { Icon } from './Icon';

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-[22px] right-[22px] z-[100] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 rounded-md border border-line-2 bg-surface px-3.5 py-2.5 text-[12.5px] font-medium text-fg shadow-md"
        >
          <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-accent text-on-accent">
            <Icon name="check" size={11} stroke={2.6} />
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
