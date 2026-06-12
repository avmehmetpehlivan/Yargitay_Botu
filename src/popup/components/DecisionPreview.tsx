import { useMemo } from 'react';
import type { Decision } from '../../shared/types/Decision';
import { formatDateTR } from '../../shared/utils/dateUtils';

type PreviewState = 'idle' | 'loading' | 'done' | 'empty' | 'ratelimited' | 'offsite';

interface Props {
  decision: Decision;
  keywords: string[];
  state: PreviewState;
  text: string;
  onClose: () => void;
  /** true: listenin sağında bir pane olarak (geniş panel); false: tam-yüzey katman. */
  inline?: boolean;
}

/**
 * Kararın tam metnini gösterir. İki yerleşim: dar panelde tam-yüzey katman
 * (geri tuşuyla listeye dönülür), geniş panelde (≥992px) listenin sağında pane.
 * Yan panel odak kaybında kapanmadığı için kullanıcı metni okurken arayüz kapanmaz.
 */
export function DecisionPreview({ decision, keywords, state, text, onClose, inline = false }: Props) {
  return (
    <div
      className={
        inline
          ? 'flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white'
          : 'fixed inset-0 z-50 flex flex-col bg-white'
      }
    >
      {/* Başlık */}
      <header className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="mx-auto flex w-full max-w-2xl items-start gap-2">
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            title={inline ? 'Önizlemeyi kapat' : 'Listeye dön'}
            aria-label={inline ? 'Önizlemeyi kapat' : 'Listeye dön'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {inline ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M19 12H5M12 19l-7-7 7-7" />}
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{decision.chamber}</p>
            <p className="text-xs text-slate-500">
              {decision.esasNo} · {decision.kararNo} · {formatDateTR(decision.date)}
            </p>
          </div>
        </div>
      </header>

      {/* Gövde — okunabilir sütun: geniş panelde ortalanır, satırlar uzamaz. */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto h-full w-full max-w-2xl px-4 py-3">
        {state === 'loading' && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            <p className="text-xs">Karar metni getiriliyor…</p>
          </div>
        )}

        {state === 'ratelimited' && (
          <PreviewNote
            icon="⏳"
            title="Sunucu yoğun"
            body="Yargıtay sunucusu kısa süreli hız sınırı uyguladı. Birkaç saniye sonra tekrar deneyin."
          />
        )}

        {state === 'offsite' && (
          <PreviewNote
            icon="🔗"
            title="Yargıtay sekmesi gerekli"
            body="Bu karar henüz önbellekte yok. Önizlemek için karararama.yargitay.gov.tr sayfasının açık bir sekmede olması gerekir."
          />
        )}

        {state === 'empty' && (
          <PreviewNote
            icon="📄"
            title="Metin alınamadı"
            body="Bu kararın metni getirilemedi. Daha sonra tekrar deneyebilirsiniz."
          />
        )}

        {state === 'done' && (
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-800">
            <Highlighted text={text} keywords={keywords} />
          </p>
        )}
        </div>
      </div>
    </div>
  );
}

function PreviewNote({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-slate-500">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs">{body}</p>
    </div>
  );
}

/** Anahtar kelimeleri sarı zeminle vurgular (hukuki standart). */
function Highlighted({ text, keywords }: { text: string; keywords: string[] }) {
  const parts = useMemo(() => {
    const terms = keywords.map((k) => k.trim()).filter((k) => k.length > 1);
    if (terms.length === 0) return [text];

    const escaped = terms
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length); // uzun öbekler önce
    const re = new RegExp(`(${escaped.join('|')})`, 'gi');
    return text.split(re);
  }, [text, keywords]);

  if (parts.length === 1) return <>{text}</>;

  const lower = new Set(keywords.map((k) => k.trim().toLocaleLowerCase('tr')));
  return (
    <>
      {parts.map((part, i) =>
        lower.has(part.toLocaleLowerCase('tr')) ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-slate-900">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
