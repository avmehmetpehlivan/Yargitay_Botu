import { useMemo } from 'react';

/** Metinde anahtar kelimeleri <mark class="hl"> ile vurgular (Türkçe-duyarlı). */
export function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const parts = useMemo(() => {
    const t = terms.map((k) => k.trim()).filter((k) => k.length > 1);
    if (!t.length) return [text];
    const esc = t
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);
    return text.split(new RegExp(`(${esc.join('|')})`, 'gi'));
  }, [text, terms]);

  if (parts.length === 1) return <>{text}</>;

  const lower = new Set(terms.map((k) => k.trim().toLocaleLowerCase('tr')));
  return (
    <>
      {parts.map((p, i) =>
        lower.has(p.toLocaleLowerCase('tr')) ? (
          <mark className="hl" key={i}>
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
