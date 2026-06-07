/**
 * Yargıtay birim listeleri (Detaylı Arama dropdown'ları).
 * Değerler API'ye birebir bu metinlerle, '+' ile birleştirilerek gönderilir
 * (bkz. /aramadetaylist payload, birimYrg* alanları).
 */

export const KURULLAR = [
  'Hukuk Genel Kurulu',
  'Ceza Genel Kurulu',
  'Ceza Daireleri Başkanlar Kurulu',
  'Hukuk Daireleri Başkanlar Kurulu',
  'Büyük Genel Kurulu',
] as const;

export const HUKUK_DAIRELERI = Array.from(
  { length: 23 },
  (_, i) => `${i + 1}. Hukuk Dairesi`,
);

export const CEZA_DAIRELERI = Array.from(
  { length: 23 },
  (_, i) => `${i + 1}. Ceza Dairesi`,
);
