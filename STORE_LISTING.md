# Chrome Web Store — Listeleme Metinleri

Bu dosya, Web Store Developer Dashboard'da ilgili alanlara kopyalanmak içindir.
(Repo'ya dahil; yayınla ilgisi yok.)

---

## Ürün adı
Yargıtay Karar Arama Asistanı

## Kategori
Üretkenlik (Productivity)

## Dil
Türkçe

## Kısa açıklama (manifest.description ile aynı, ≤132 karakter)
Avukatlar için Yargıtay karar arama asistanı: toplu sonuç, istatistik grafikleri ve PDF/Word/Excel dışa aktarma.

## Detaylı açıklama (mağaza "Description" alanı)
Yargıtay Karar Arama Asistanı, avukatların karararama.yargitay.gov.tr üzerindeki Yargıtay
kararlarıyla çalışmasını hızlandırır. Sitedeki resmi arama servisini kullanır; yapay zekâ
veya hukuki yorum yoktur — yalnızca objektif, sayısal çıktılar sunar.

Özellikler:
• Temel ve detaylı arama: kurul/hukuk/ceza daireleri, esas ve karar no aralığı, tarih
  aralığı ve sıralama.
• Site kurallarına uygun anahtar kelime mantığı: "içersin/içermesin", VE/VEYA, birebir öbek
  (çift tırnak) — ne aradığınızı gösteren canlı önizleme ile.
• İstatistikler: yıllara ve dairelere göre dağılım grafikleri; grafiklerden tıklayarak
  listeyi filtreleme.
• İki PDF modu: hızlı "künye" PDF'i (anında) ve seçili kararların tam metinli PDF'i.
• Word (.doc) ve Excel (CSV) dışa aktarma.
• Arama geçmişi ve kayıtlı aramalar; kayıtlı aramaları tek tıkla yeniden yükleme.
• Çekilen karar metinleri cihazınızda önbelleğe alınır; aynı kararlar için tekrar indirme
  yapılmaz.

Gizlilik: Verileriniz cihazınızdan çıkmaz. Hiçbir analitik, reklam veya üçüncü taraf
paylaşımı yoktur. Uzantı yalnızca, zaten kullandığınız resmi Yargıtay sitesiyle iletişim kurar.

Not: Bu, bağımsız bir yardımcı araçtır. Yargıtay ile resmi bir bağlantısı, ortaklığı veya
onayı yoktur.

---

## Tek amaç beyanı (Single purpose)
karararama.yargitay.gov.tr üzerindeki Yargıtay kararlarını toplu toplamak, istatistiklerini
göstermek ve PDF/Word/CSV olarak dışa aktarmak.

## Gizlilik politikası URL'si
https://github.com/avmehmetpehlivan/Yargitay_Botu/blob/main/PRIVACY.md

---

## İzin gerekçeleri (her izin için dashboard sorar)

- storage — Arama geçmişi, kayıtlı aramalar ve ayarları kullanıcının cihazında saklamak.
- downloads — Üretilen PDF, Word ve CSV dosyalarını indirmek.
- tabs — Aktif sekmenin Yargıtay Karar Arama sayfası olup olmadığını kontrol etmek ve doğru
  sekmede çalışmak.
- scripting — Aramayı yürüten içerik betiğini, gerektiğinde Yargıtay sekmesine eklemek.
- host_permissions (karararama.yargitay.gov.tr) — Aramaları yalnızca bu resmi sitenin
  servisleri üzerinden yapmak. Başka hiçbir siteye erişilmez.

## Uzak kod (Remote code) kullanımı
HAYIR. Tüm kod uzantı paketinin içindedir; harici bir sunucudan kod indirilmez/çalıştırılmaz.

---

## Veri kullanımı beyanları (Privacy practices sekmesi)

Toplanan/işlenen veri:
- Kullanıcının girdiği arama terimleri ve filtreler (yalnızca cihazda saklanır).
- Yargıtay'dan çekilen karar bilgileri ve metinleri (yalnızca cihazda saklanır).

Beyanlar (işaretlenecek):
- [x] Toplanan veriler ÜÇÜNCÜ TARAFLARLA PAYLAŞILMAZ.
- [x] Veriler satılmaz / kredi notu gibi amaçlarla kullanılmaz.
- [x] Verilerin tamamı kullanıcının cihazında kalır; harici sunucuya GÖNDERİLMEZ.
- [x] Kullanım amacı dışında veri toplanmaz.

---

## Görseller (dashboard'a yüklenecek — uzantıdan ekran görüntüsü al)
- Uygulama ikonu: 128×128 (zaten pakette: icons/extension-icon128.png).
- Ekran görüntüsü: en az 1, en fazla 5 — 1280×800 veya 640×400 PNG/JPG.
  Öneri: (1) arama ekranı, (2) istatistik + grafikler, (3) sonuç listesi + PDF/Word/CSV
  butonları, (4) detaylı arama paneli, (5) ayarlar.
- (Opsiyonel) Küçük tanıtım görseli: 440×280.
