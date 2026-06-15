import type { Decision } from '../../shared/types/Decision';
import { formatDateTR } from '../../shared/utils/dateUtils';
import { Icon } from './Icon';
import { Highlighted } from './Highlighted';

type PreviewState = 'idle' | 'loading' | 'done' | 'empty' | 'ratelimited' | 'offsite';

interface Props {
  decision: Decision;
  terms: string[];
  state: PreviewState;
  text: string;
  saved: boolean;
  savedColor?: string;
  backMode: boolean;
  pdfBusy?: boolean;
  onClose: () => void;
  onSave?: () => void;
  onCopy: () => void;
  onPdf: () => void;
}

const ICON_BTN =
  'grid h-8 w-8 place-items-center rounded-sm border border-line bg-surface text-fg-2 transition-colors hover:bg-surface-2 hover:border-line-2';

export function ReadingPane({
  decision,
  terms,
  state,
  text,
  saved,
  savedColor,
  backMode,
  pdfBusy,
  onClose,
  onSave,
  onCopy,
  onPdf,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-[5] flex items-start gap-3.5 border-b border-line bg-surface px-[26px] py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold tracking-[-0.015em] text-fg">{decision.chamber}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-[7px] font-mono text-xs text-fg-3">
            <span className="whitespace-nowrap"><b className="mr-[3px] font-semibold text-fg-2">Esas</b>{decision.esasNo}</span>
            <span className="text-fg-faint">·</span>
            <span className="whitespace-nowrap"><b className="mr-[3px] font-semibold text-fg-2">Karar</b>{decision.kararNo}</span>
            <span className="text-fg-faint">·</span>
            <span className="whitespace-nowrap">{formatDateTR(decision.date)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onSave && (
            <button
              onClick={onSave}
              title={saved ? 'Koleksiyonda — düzenle' : 'Koleksiyona kaydet'}
              className={saved ? ICON_BTN + ' border-accent-weak-2 bg-accent-weak text-accent' : ICON_BTN}
            >
              <Icon name="bookmark" size={16} style={savedColor ? { fill: savedColor, color: savedColor } : undefined} />
            </button>
          )}
          <button onClick={onCopy} title="Metni kopyala" className={ICON_BTN} disabled={state !== 'done'}>
            <Icon name="copy" size={16} />
          </button>
          <button
            onClick={onPdf}
            title="Bu kararı PDF indir"
            disabled={state !== 'done' || pdfBusy}
            className="inline-flex items-center gap-1.5 rounded-md border border-line-2 bg-surface px-[11px] py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            <Icon name="pdf" size={15} /> PDF
          </button>
          <button onClick={onClose} title={backMode ? 'Listeye dön' : 'Önizlemeyi kapat'} className="grid h-8 w-8 place-items-center rounded-sm text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg">
            <Icon name={backMode ? 'arrowLeft' : 'x'} size={17} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {state === 'loading' && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-fg-3">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
            <p className="text-xs">Karar metni getiriliyor…</p>
          </div>
        )}
        {state === 'ratelimited' && (
          <Note icon="⏳" title="Sunucu yoğun" body="Yargıtay sunucusu kısa süreli hız sınırı uyguladı. Birkaç saniye sonra tekrar deneyin." />
        )}
        {state === 'offsite' && (
          <Note icon="🔗" title="Yargıtay sekmesi gerekli" body="Bu karar henüz önbellekte yok. Önizlemek için karararama.yargitay.gov.tr açık bir sekmede olmalı." />
        )}
        {state === 'empty' && <Note icon="📄" title="Metin alınamadı" body="Bu kararın metni getirilemedi. Daha sonra tekrar deneyebilirsiniz." />}
        {state === 'done' && (
          <article className="mx-auto max-w-[720px] whitespace-pre-wrap break-words px-[26px] pb-[120px] pt-[34px] font-read text-[16.5px] leading-[1.78] text-fg">
            <Highlighted text={text} terms={terms} />
          </article>
        )}
      </div>
    </div>
  );
}

function Note({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-fg-3">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="max-w-[320px] text-xs">{body}</p>
    </div>
  );
}
