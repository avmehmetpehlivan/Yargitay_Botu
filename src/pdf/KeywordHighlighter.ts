import type { Content } from 'pdfmake/interfaces';

const HIGHLIGHT_COLOR = '#FFFF00'; // Sarı — hukuki standart

/**
 * Bir metni keyword parçalarına böler ve her parçayı pdfmake Content'e çevirir.
 * Bulunan keyword'ler sarı arka plan alır.
 */
export function highlightKeywords(text: string, keywords: string[]): Content {
  if (!keywords.length) {
    return { text, fontSize: 10, lineHeight: 1.5 };
  }

  // Büyük/küçük harf duyarsız regex; tüm keyword'leri birleştir
  const escaped = keywords.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(pattern);

  const inlineContent = parts.map((part): Content => {
    const isKeyword = keywords.some((kw) => kw.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return {
        text: part,
        background: HIGHLIGHT_COLOR,
        bold: false,
        fontSize: 10,
      };
    }
    return { text: part, fontSize: 10 };
  });

  return {
    text: inlineContent as Content[],
    lineHeight: 1.5,
  };
}
