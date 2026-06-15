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
Yargıtay karar arama sitesinde kararları arayın, tam metnini okuyun, oluşturduğunuz koleksiyonlarda saklayın ve PDF/Word olarak indirin.

## Detaylı açıklama (mağaza "Description" alanı)
Yargıtay Karar Arama Asistanı, avukatların karararama.yargitay.gov.tr üzerindeki Yargıtay
kararlarıyla çalışmasını hızlandıran bir çalışma alanıdır. Sitedeki resmi arama servisini
kullanır; yapay zekâ veya hukuki yorum yoktur — yalnızca objektif çıktılar sunar.

Tarayıcının yan panelinde açılır: solda sonuç listesi, sağda kararın tam metnini okuduğunuz
serif okuma sütunu.

Özellikler:
• Temel ve detaylı arama: kurul/hukuk/ceza daireleri, esas ve karar no aralığı, tarih
  aralığı ve sıralama.
• Site kurallarına uygun anahtar kelime mantığı: "içersin/içermesin", VE/VEYA, birebir öbek
  (çift tırnak) — ne aradığınızı gösteren canlı önizleme ile.
• Sayfalı sonuçlar (sayfa başına 10/25/50/100); listeyi daire ve tarihe göre filtreleme,
  esas/karar/tarihe göre sıralama.
• Karar okuma: tam metni serif okuma sütununda okuyun, arama terimleri vurgulanır; metni
  panoya kopyalayın.
• Koleksiyonlar: kararları isim ve renk verdiğiniz kategorilerde toplayın; bir karar aynı
  anda birden fazla kategoride yer alabilir.
• Dışa aktarma: seçili kararların tam metinli PDF'i ve Word (.doc) belgesi.
• Arama geçmişi ve kayıtlı aramalar; kayıtlı aramaları tek tıkla yeniden yükleme.
• Açık/koyu tema ve vurgu rengi seçenekleri.
• Çekilen karar metinleri cihazınızda önbelleğe alınır; aynı kararlar için tekrar indirme
  yapılmaz.

Gizlilik: Verileriniz cihazınızdan çıkmaz. Hiçbir analitik, reklam veya üçüncü taraf
paylaşımı yoktur. Uzantı yalnızca, zaten kullandığınız resmi Yargıtay sitesiyle iletişim kurar.

Not: Bu, bağımsız bir yardımcı araçtır. Yargıtay ile resmi bir bağlantısı, ortaklığı veya
onayı yoktur.

---

## Tek amaç beyanı (Single purpose)
karararama.yargitay.gov.tr üzerindeki Yargıtay kararlarını aramak, tam metnini okumak,
koleksiyonlara kaydetmek ve PDF/Word olarak dışa aktarmak.

## Gizlilik politikası URL'si
https://github.com/avmehmetpehlivan/Yargitay_Botu/blob/main/PRIVACY.md

---

## İzin gerekçeleri (her izin için dashboard sorar)

- storage — Arama geçmişi, kayıtlı aramalar, koleksiyonlar ve ayarları kullanıcının
  cihazında saklamak.
- downloads — Üretilen PDF ve Word dosyalarını indirmek.
- scripting — Aramayı yürüten içerik betiğini, gerektiğinde Yargıtay sekmesine eklemek.
- sidePanel — Uzantı arayüzünü tarayıcının yan panelinde açmak.
- host_permissions (karararama.yargitay.gov.tr) — Aramaları yalnızca bu resmi sitenin
  servisleri üzerinden yapmak ve açık Yargıtay sekmesini bulmak. Başka hiçbir siteye erişilmez.

## Uzak kod (Remote code) kullanımı
HAYIR. Tüm kod (ve fontlar) uzantı paketinin içindedir; harici bir sunucudan kod
indirilmez/çalıştırılmaz.

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
  Öneri: (1) arama ekranı, (2) sonuçlar — 30/70 split + serif okuma sütunu + vurgu,
  (3) seçili kararlarla PDF/Word dışa aktarma, (4) koleksiyonlar (renkli kategoriler),
  (5) ayarlar — açık/koyu tema + vurgu rengi.
- (Opsiyonel) Küçük tanıtım görseli: 440×280.
