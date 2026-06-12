import { describe, it, expect } from 'vitest';
import { normalizeDate, extractYear, formatDateTR } from '../shared/utils/dateUtils';
import { extractDecisionText, countKeywordOccurrences } from '../shared/utils/textUtils';
import { buildKeywordQuery } from '../shared/utils/keywordQuery';

describe('buildKeywordQuery (site kuralları)', () => {
  it('çok kelimeli terimi öbek olarak tırnaklar', () => {
    expect(buildKeywordQuery({ keywords: ['işe iade'] })).toBe('"işe iade"');
  });

  it('tek kelimeyi tırnaklamaz', () => {
    expect(buildKeywordQuery({ keywords: ['kıdem'] })).toBe('kıdem');
  });

  it('VE modunda sonraki terimlere + ekler', () => {
    expect(buildKeywordQuery({ keywords: ['işe iade', 'kıdem'], matchMode: 'all' })).toBe(
      '"işe iade" +kıdem',
    );
  });

  it('VEYA modunda boşlukla birleştirir', () => {
    expect(buildKeywordQuery({ keywords: ['işe iade', 'kıdem'], matchMode: 'any' })).toBe(
      '"işe iade" kıdem',
    );
  });

  it('hariç terimleri - ile ekler', () => {
    expect(
      buildKeywordQuery({ keywords: ['işe iade'], excludeKeywords: ['fesih', 'bozma sebebi'] }),
    ).toBe('"işe iade" -fesih -"bozma sebebi"');
  });

  it('kullanıcının yazdığı operatöre dokunmaz', () => {
    expect(buildKeywordQuery({ keywords: ['"tam öbek"'] })).toBe('"tam öbek"');
  });
});

describe('dateUtils', () => {
  it('DD.MM.YYYY formatını ISO ya çevirir', () => {
    expect(normalizeDate('15.03.2024')).toBe('2024-03-15');
  });

  it('ISO formatını değiştirmez', () => {
    expect(normalizeDate('2024-03-15')).toBe('2024-03-15');
  });

  it('geçersiz format için boş string döner', () => {
    expect(normalizeDate('geçersiz')).toBe('');
  });

  it('yıl çıkarır', () => {
    expect(extractYear('2024-03-15')).toBe(2024);
  });

  it('TR formatında gösterir', () => {
    expect(formatDateTR('2024-03-15')).toBe('15.03.2024');
  });
});

describe('textUtils', () => {
  it('karar metnini ayıklar', () => {
    const body = 'Başka metin İçtihat Metni\nAsıl karar içeriği buradadır.\nÖnceki Karar Buton';
    const result = extractDecisionText(body);
    expect(result).toContain('İçtihat Metni');
    expect(result).not.toContain('Önceki Karar');
  });

  it('İçtihat Metni yoksa null döner', () => {
    expect(extractDecisionText('Sadece rastgele metin')).toBeNull();
  });

  it('keyword sayısını doğru sayar', () => {
    const text = 'işe iade davası açılmış, işe iade kararı verilmiş';
    const counts = countKeywordOccurrences(text, ['işe iade', 'fazla mesai']);
    expect(counts['işe iade']).toBe(2);
    expect(counts['fazla mesai']).toBe(0);
  });
});
