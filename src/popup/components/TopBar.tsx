import type { ReactNode } from 'react';

/** Üst çubuk: başlık + mono alt-başlık (aktif arama özeti) + sağ slot. */
export function TopBar({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-line bg-surface pl-5 pr-4">
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="whitespace-nowrap text-[13.5px] font-semibold tracking-[-0.01em] text-fg">
          {title}
        </span>
        {sub && (
          <span className="max-w-[46vw] truncate font-mono text-[11.5px] text-fg-3">{sub}</span>
        )}
      </div>
      <div className="flex-1" />
      {right}
    </header>
  );
}

/** Canlı origin göstergesi (topbar sağında). */
export function OriginChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-fg-2">
      <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_0_3px_var(--accent-weak)]" />
      karararama.yargitay.gov.tr
    </span>
  );
}
