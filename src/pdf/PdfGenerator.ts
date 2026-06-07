import type { TDocumentDefinitions, StyleDictionary } from 'pdfmake/interfaces';
import type { Decision } from '../shared/types/Decision';
import { formatDateTR, formatDateTimeTR, isoNow } from '../shared/utils/dateUtils';
import { buildTableOfContents } from './TableOfContents';
import { highlightKeywords } from './KeywordHighlighter';

const STYLES: StyleDictionary = {
  coverTitle: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 8] },
  coverSub:   { fontSize: 12, alignment: 'center', color: '#475569' },
  coverMeta:  { fontSize: 10, alignment: 'center', color: '#64748b', margin: [0, 2, 0, 0] },
  tocHeader:  { fontSize: 16, bold: true, margin: [0, 0, 0, 12] },
  tocColHeader: { fontSize: 9, bold: true, color: '#64748b', fillColor: '#f8fafc' },
  tocIndex:   { fontSize: 9, color: '#64748b' },
  tocChamber: { fontSize: 9 },
  tocEsas:    { fontSize: 9, color: '#2563eb' },
  tocDate:    { fontSize: 9, color: '#475569' },
  tocPage:    { fontSize: 9, color: '#94a3b8' },
  decisionHeader: { fontSize: 14, bold: true, margin: [0, 0, 0, 6], color: '#1e3a8a' },
  decisionMeta:   { fontSize: 9, color: '#64748b', margin: [0, 0, 0, 12] },
};

/**
 * Kararları PDF blob olarak üretir.
 * pdfmake dinamik import ile yüklenir — ilk çağrıda ~1-2sn gecikme olabilir.
 */
export async function generatePdf(
  decisions: Decision[],
  keywords: string[],
): Promise<Blob> {
  // Lazy load — pdfmake büyük bir kütüphane
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (pdfMakeModule as any).default ?? pdfMakeModule;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (pdfFontsModule as any).default ?? pdfFontsModule;

  pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs;

  const dd: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [56, 56, 56, 56],
    styles: STYLES,

    content: [
      buildCoverPage(decisions, keywords),
      { text: '', pageBreak: 'after' },
      buildTableOfContents(decisions),
      { text: '', pageBreak: 'after' },
      ...buildDecisionPages(decisions, keywords),
    ],

    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Yargıtay Karar Asistanı — ${formatDateTimeTR(isoNow())}`, fontSize: 8, color: '#94a3b8', margin: [56, 0, 0, 0] },
        { text: `${currentPage} / ${pageCount}`, fontSize: 8, color: '#94a3b8', alignment: 'right', margin: [0, 0, 56, 0] },
      ],
    }),
  };

  return new Promise((resolve, reject) => {
    const pdf = pdfMake.createPdf(dd);
    pdf.getBlob((blob: Blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PDF oluşturulamadı'));
    });
  });
}

function buildCoverPage(decisions: Decision[], keywords: string[], subtitle?: string) {
  return {
    stack: [
      { text: '\n\n\n\n' },
      { text: 'Yargıtay Karar Asistanı', style: 'coverTitle' },
      ...(subtitle ? [{ text: subtitle, style: 'coverSub' }] : []),
      { text: '\n' },
      { text: `Arama: "${keywords.join(' • ')}"`, style: 'coverSub' },
      { text: `Toplam karar: ${decisions.length}`, style: 'coverMeta' },
      { text: `Oluşturma tarihi: ${formatDateTimeTR(isoNow())}`, style: 'coverMeta' },
    ],
    pageBreak: undefined,
  };
}

/**
 * Künye (özet) PDF: yalnızca metadata — kararların tam metnini ÇEKMEDEN üretilir.
 * Başlık + dağılım özeti + tüm kararların künye tablosu. 0 getDokuman isteği.
 */
export async function generateSummaryPdf(
  decisions: Decision[],
  keywords: string[],
): Promise<Blob> {
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (pdfMakeModule as any).default ?? pdfMakeModule;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (pdfFontsModule as any).default ?? pdfFontsModule;
  pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs;

  const dd: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [56, 56, 56, 56],
    styles: STYLES,
    content: [
      buildCoverPage(decisions, keywords, 'Künye Listesi'),
      { text: '', pageBreak: 'after' },
      buildDistribution(decisions),
      { text: '\n' },
      buildTableOfContents(decisions),
    ],
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Yargıtay Karar Asistanı — ${formatDateTimeTR(isoNow())}`, fontSize: 8, color: '#94a3b8', margin: [56, 0, 0, 0] },
        { text: `${currentPage} / ${pageCount}`, fontSize: 8, color: '#94a3b8', alignment: 'right', margin: [0, 0, 56, 0] },
      ],
    }),
  };

  return new Promise((resolve, reject) => {
    pdfMake.createPdf(dd).getBlob((blob: Blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PDF oluşturulamadı'));
    });
  });
}

/** Yıl ve daire dağılımının kısa metin özeti (tam metin gerektirmez). */
function buildDistribution(decisions: Decision[]) {
  const byYear = countBy(decisions.map((d) => String(d.year || '—')));
  const byChamber = countBy(decisions.map((d) => d.chamber || 'Bilinmiyor'));

  const fmt = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} (${v})`)
      .join('   ');

  return {
    stack: [
      { text: 'Dağılım', style: 'tocHeader' },
      { text: `Yıl: ${fmt(byYear)}`, style: 'decisionMeta' },
      { text: `Daire: ${fmt(byChamber)}`, style: 'decisionMeta' },
    ],
  };
}

function countBy(values: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

function buildDecisionPages(decisions: Decision[], keywords: string[]) {
  return decisions.flatMap((d, i) => {
    const isLast = i === decisions.length - 1;
    return [
      {
        id: `decision-${d.id}`,
        stack: [
          {
            text: `${i + 1}. ${d.chamber} — ${d.esasNo}`,
            style: 'decisionHeader',
          },
          {
            text: [
              `Karar No: ${d.kararNo}   `,
              `Tarih: ${formatDateTR(d.date)}`,
            ],
            style: 'decisionMeta',
          },
          highlightKeywords(d.fullText || '(Karar metni alınamadı)', keywords),
        ],
        pageBreak: isLast ? undefined : ('after' as const),
      },
    ];
  });
}
