import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-fg-3">
      <div className="grid h-14 w-14 place-items-center rounded-[16px] border border-line bg-surface-2 text-fg-3">
        <Icon name={icon} size={26} stroke={1.4} />
      </div>
      <p className="text-[15px] font-semibold text-fg">{title}</p>
      {body && <p className="max-w-[320px] text-xs leading-relaxed text-fg-3">{body}</p>}
      {action}
    </div>
  );
}
