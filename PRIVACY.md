# Gizlilik Politikası — Yargıtay Karar Arama Asistanı

_Son güncelleme: 7 Haziran 2026_

Bu Chrome uzantısı, avukatların `karararama.yargitay.gov.tr` üzerindeki Yargıtay kararlarını
toplamasına, istatistiklerini görmesine ve PDF/Word/CSV olarak dışa aktarmasına yardımcı olur.
**Verileriniz cihazınızdan çıkmaz.**

## Topladığımız veriler

- Girdiğiniz arama terimleri ve filtreler.
- Yargıtay sitesinden çekilen karar bilgileri (daire, esas/karar no, tarih) ve seçtiğiniz
  kararların tam metinleri.

## Verileriniz nerede saklanır?

**Yalnızca kendi tarayıcınızda, yerel olarak.** Hiçbir veri bizim veya üçüncü bir tarafın
sunucusuna gönderilmez.

- `chrome.storage.local`: arama geçmişi, kayıtlı aramalar, ayarlar.
- `IndexedDB`: çekilen karar metinlerinin önbelleği (tekrar indirmemek için).

## Üçüncü taraflar ve takip

Analitik, reklam, izleme veya üçüncü taraf veri paylaşımı **yoktur**. Uzantı yalnızca, sizin
zaten kullandığınız resmi `karararama.yargitay.gov.tr` sitesiyle, kendi oturumunuz üzerinden
iletişim kurar.

## İzinler ve gerekçeleri

- `storage` — geçmiş, kayıtlı aramalar ve ayarları cihazınızda tutmak.
- `downloads` — PDF/Word/CSV dosyalarını indirmek.
- `tabs`, `scripting` — yalnızca Yargıtay sekmesinde çalışmak ve aramayı yürütmek.
- `alarms`, `notifications` — kayıtlı aramalarda yeni karar bildirimi (isteğe bağlı).
- `host_permissions` (`karararama.yargitay.gov.tr`) — yalnızca bu siteye erişim.

## Verilerinizi silme

Uzantı içindeki **Ayarlar** ekranından önbelleği ve arama geçmişini temizleyebilir, ya da
uzantıyı kaldırarak tüm yerel verileri silebilirsiniz.

## İletişim

Sorularınız için: _samet.mollaoglu85@gmail.com_
