/**
 * "Sitede N karar bulundu — ilk X listelendi" gibi okunur bir özet üretir.
 * recordsTotal yoksa (eski kayıt) toplananı gösterir.
 */
export function recordsTotalLabel(totalCount: number, recordsTotal?: number): string {
  const fmt = (n: number) => n.toLocaleString('tr-TR');
  const total = recordsTotal ?? totalCount;

  if (total > totalCount) {
    return `Sitede ${fmt(total)} karar bulundu — ilk ${fmt(totalCount)} tanesi listelendi`;
  }
  return `${fmt(total)} karar`;
}
