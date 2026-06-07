import { describe, it, expect } from 'vitest';
import { normalizeDate, extractYear, formatDateTR } from '../shared/utils/dateUtils';
import { extractDecisionText, countKeywordOccurrences } from '../shared/utils/textUtils';
import { computeStatistics } from '../shared/utils/statistics';
import { buildKeywordQuery } from '../shared/utils/keywordQuery';
import { buildDecisionsCsv } from '../shared/utils/csv';
import type { DecisionMetadata } from '../shared/types/Decision';

describe('buildDecisionsCsv', () => {
  const d = (over: Partial<DecisionMetadata>): DecisionMetadata => ({
    id: '1', title: '', chamber: '9. Hukuk Dairesi', date: '2014-02-17', year: 2014,
    esasNo: '2013/6829', kararNo: '2014/4579', keywords: [], scrapedAt: '', ...over,
  });

  it('başlık + satırları ; ile üretir, tarihi TR formatına çevirir', () => {
    const csv = buildDecisionsCsv([d({})]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Sıra;Daire;Esas No;Karar No;Tarih');
    expect(lines[1]).toBe('1;9. Hukuk Dairesi;2013/6829;2014/4579;17.02.2014');
  });

  it('ayırıcı/tırnak içeren alanı kaçışlar', () => {
    const csv = buildDecisionsCsv([d({ chamber: 'A; "B"' })]);
    expect(csv.split('\r\n')[1]).toContain('"A; ""B"""');
  });
});

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

describe('computeStatistics', () => {
  const decisions: DecisionMetadata[] = [
    {
      id: '1', title: 'T1', chamber: '2. Hukuk Dairesi',
      date: '2023-05-10', year: 2023, esasNo: 'E1', kararNo: 'K1',
      keywords: ['işe iade'], scrapedAt: '',
    },
    {
      id: '2', title: 'T2', chamber: '9. Hukuk Dairesi',
      date: '2024-01-15', year: 2024, esasNo: 'E2', kararNo: 'K2',
      keywords: ['işe iade'], scrapedAt: '',
    },
    {
      id: '3', title: 'T3', chamber: '2. Hukuk Dairesi',
      date: '2024-06-20', year: 2024, esasNo: 'E3', kararNo: 'K3',
      keywords: ['işe iade'], scrapedAt: '',
    },
  ];

  it('toplam sayıyı doğru hesaplar', () => {
    expect(computeStatistics(decisions).totalCount).toBe(3);
  });

  it('tarih aralığını doğru bulur', () => {
    const stats = computeStatistics(decisions);
    expect(stats.firstDecisionDate).toBe('2023-05-10');
    expect(stats.lastDecisionDate).toBe('2024-06-20');
  });

  it('yıl dağılımını doğru hesaplar', () => {
    const stats = computeStatistics(decisions);
    const y2024 = stats.byYear.find((y) => y.year === 2024);
    expect(y2024?.count).toBe(2);
  });

  it('daire dağılımını en yüksekten sıralar', () => {
    const stats = computeStatistics(decisions);
    expect(stats.byChamber[0].chamber).toBe('2. Hukuk Dairesi');
    expect(stats.byChamber[0].count).toBe(2);
  });
});
