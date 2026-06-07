import type { Decision } from '../../shared/types/Decision';
import { formatDateTR, formatDateTimeTR, isoNow } from '../../shared/utils/dateUtils';

/**
 * Seçili kararların tam metnini Word'de açılabilen bir .doc (HTML tabanlı) belgeye
 * çevirir. Harici kütüphane yok: Word, charset'i UTF-8 olan HTML belgeleri açar;
 * kullanıcı isterse "Farklı kaydet → .docx" diyebilir.
 */
export function buildWordHtml(decisions: Decision[], keywords: string[]): string {
  const body = decisions
    .map((d, i) => {
      const text = highlight(escapeHtml(d.fullText || '(Karar metni alınamadı)'), keywords).replace(
        /\n/g,
        '<br>',
      );
      return `
        <h3 style="color:#1f5b5a;margin:18pt 0 4pt">${i + 1}. ${escapeHtml(d.chamber)} — ${escapeHtml(d.esasNo)}</h3>
        <p style="color:#555;font-size:10pt;margin:0 0 8pt">Karar No: ${escapeHtml(d.kararNo)} · Tarih: ${formatDateTR(d.date)}</p>
        <div style="text-align:justify">${text}</div>`;
    })
    .join('\n<hr style="border:none;border-top:1px solid #ccc;margin:14pt 0">\n');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Yargıtay Kararları</title>
</head>
<body style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.4">
  <h1 style="text-align:center;font-size:18pt">Yargıtay Kararları</h1>
  <p style="text-align:center;color:#555">Arama: "${escapeHtml(keywords.join(' • '))}" — ${decisions.length} karar — ${formatDateTimeTR(isoNow())}</p>
  ${body}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Anahtar kelimeleri (büyük/küçük harf duyarsız) sarı vurgular. */
function highlight(html: string, keywords: string[]): string {
  let out = html;
  for (const kw of keywords) {
    const term = kw.trim().replace(/^["+-]+|["]+$/g, ''); // operatör/tırnak temizle
    if (!term) continue;
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    out = out.replace(re, '<span style="background-color:#ffff00">$1</span>');
  }
  return out;
}
