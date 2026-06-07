import type { SearchCriteria } from '../types/SearchCriteria';

const SIRALAMA_LABEL: Record<string, string> = {
  '1': 'Esas No',
  '2': 'Karar No',
  '3': 'Karar Tarihi',
};

/** "2013/6-15" gibi yıl/sıra aralığı etiketi üretir (boş parçaları atlar). */
function rangeLabel(yil?: string, ilk?: string, son?: string): string {
  const range = [ilk, son].filter(Boolean).join('-');
  if (yil && range) return `${yil}/${range}`;
  return yil || range || '';
}

/**
 * Detaylı arama parametrelerini kullanıcıya gösterilecek kısa parçalara çevirir.
 * keywords burada YOK — onlar zaten ayrı badge olarak gösteriliyor.
 */
export function summarizeCriteria(c?: SearchCriteria): string[] {
  if (!c) return [];
  const parts: string[] = [];

  if (c.matchMode === 'any' && (c.keywords?.length ?? 0) > 1) {
    parts.push('Eşleşme: herhangi biri (VEYA)');
  }
  if (c.excludeKeywords?.length) {
    parts.push(`Hariç: ${c.excludeKeywords.join(', ')}`);
  }

  const units = [
    ...(c.kurullar ?? []),
    ...(c.hukukDaireleri ?? []),
    ...(c.cezaDaireleri ?? []),
  ];
  if (units.length) {
    parts.push('Birim: ' + (units.length <= 2 ? units.join(', ') : `${units.length} birim`));
  }

  const esas = rangeLabel(c.esasYil, c.esasIlkSiraNo, c.esasSonSiraNo);
  if (esas) parts.push(`Esas: ${esas}`);

  const karar = rangeLabel(c.kararYil, c.kararIlkSiraNo, c.kararSonSiraNo);
  if (karar) parts.push(`Karar: ${karar}`);

  if (c.baslangicTarihi || c.bitisTarihi) {
    parts.push(`Tarih: ${c.baslangicTarihi ?? '…'} – ${c.bitisTarihi ?? '…'}`);
  }

  const sortChanged =
    (c.siralama && c.siralama !== '1') || (c.siralamaDirection && c.siralamaDirection !== 'desc');
  if (sortChanged) {
    const dir = c.siralamaDirection === 'asc' ? '↑' : '↓';
    parts.push(`Sıralama: ${SIRALAMA_LABEL[c.siralama ?? '1']} ${dir}`);
  }

  return parts;
}
