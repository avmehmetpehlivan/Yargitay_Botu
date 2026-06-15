/* React mount edilmeden önce <html>'e tema/accent uygular (ilk-boya flash'ını
   önler). MV3 CSP inline script'i engellediği için ayrı dosya. ui.store ile aynı
   anahtarları okur: yb-theme / yb-accent. */
(function () {
  try {
    var r = document.documentElement;
    r.dataset.theme = localStorage.getItem('yb-theme') === 'dark' ? 'dark' : 'light';
    var a = localStorage.getItem('yb-accent');
    if (a === 'neutral' || a === 'blue') r.dataset.accent = a;
  } catch (e) {
    /* localStorage erişilemezse varsayılan (açık/teal) kalır */
  }
})();
