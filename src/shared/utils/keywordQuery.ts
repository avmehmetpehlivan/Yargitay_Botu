import type { SearchCriteria } from '../types/SearchCriteria';

type KwParts = Pick<SearchCriteria, 'keywords' | 'excludeKeywords' | 'matchMode'>;

/**
 * Tek bir terimi site kuralına göre biçimlendirir:
 *  - Kullanıcı zaten tırnak/operatör koymuşsa olduğu gibi bırak.
 *  - Çok kelimeli ise birebir öbek olsun diye tırnakla ("...").
 *  - Tek kelime ise olduğu gibi.
 */
function formatTerm(raw: string): string {
  const k = raw.trim();
  if (!k) return '';
  if (k.startsWith('"') || k.startsWith('+') || k.startsWith('-')) return k;
  return /\s/.test(k) ? `"${k}"` : k;
}

/**
 * arananKelime string'ini karararama kurallarına göre üretir:
 *   boşluk = VEYA, + = VE, - = hariç, "..." = birebir öbek.
 *
 * Örnekler:
 *   include=["işe iade","kıdem"], mode=all  → `"işe iade" +kıdem`
 *   include=["işe iade","kıdem"], mode=any  → `"işe iade" kıdem`
 *   + exclude=["fesih"]                      → `… -fesih`
 */
export function buildKeywordQuery(c: KwParts): string {
  const inc = (c.keywords ?? []).map(formatTerm).filter(Boolean);
  const exc = (c.excludeKeywords ?? [])
    .map(formatTerm)
    .filter(Boolean)
    .map((t) => (t.startsWith('-') ? t : `-${t}`));

  let q = '';
  if (inc.length) {
    q =
      c.matchMode === 'any'
        ? inc.join(' ') // VEYA: boşlukla
        : inc.map((t, i) => (i === 0 ? t : `+${t}`)).join(' '); // VE: sonrakilere +
  }
  if (exc.length) q = (q ? `${q} ` : '') + exc.join(' ');

  return q.trim();
}

/** Gösterim için terimi tırnaklar (çok kelimeliyse). */
function quoteForDisplay(raw: string): string {
  const k = raw.trim();
  if (!k) return '';
  if (k.startsWith('"')) return k;
  return /\s/.test(k) ? `"${k}"` : k;
}

/**
 * Aramanın ne anlama geldiğini kullanıcıya açıklayan Türkçe cümle üretir.
 * Örn: İçinde "işe iade" ve "kıdem tazminatı" geçen, "fesih" geçmeyen kararlar
 */
export function describeSearch(c: KwParts): string {
  const inc = (c.keywords ?? []).map(quoteForDisplay).filter(Boolean);
  const exc = (c.excludeKeywords ?? []).map(quoteForDisplay).filter(Boolean);
  if (!inc.length && !exc.length) return '';

  const joiner = c.matchMode === 'any' ? ' veya ' : ' ve ';
  const clauses: string[] = [];
  if (inc.length) clauses.push(`${inc.join(joiner)} geçen`);
  if (exc.length) clauses.push(`${exc.join(' ve ')} geçmeyen`);
  return `İçinde ${clauses.join(', ')} kararlar`;
}
