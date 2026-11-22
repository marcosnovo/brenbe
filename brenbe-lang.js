/* BRENBE: selector de idioma (cookie brenbe_loc) y banner de sugerencia no bloqueante.
   Solo se carga si hay más de un idioma publicado. Nunca redirige; si algo falla, no hace nada. */
(function () {
  'use strict';
  var COOKIE = 'brenbe_loc';
  var cfgEl = document.getElementById('brenbe-loc'), cfg;
  if (!cfgEl) return;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }

  function getCookie() {
    var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function setCookie(value, days) {
    try {
      document.cookie = COOKIE + '=' + encodeURIComponent(value) + '; Path=/; Max-Age=' + (days * 86400) +
        '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    } catch (e) {}
  }

  // 1) Selector: al elegir un idioma se recuerda la elección (el enlace funciona igual sin JS).
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[data-loc]') : null;
    if (a) setCookie(a.getAttribute('data-loc'), 365);
    var open = document.querySelector('details.lang-switch[open]');
    if (open && !(ev.target.closest && ev.target.closest('details.lang-switch'))) open.removeAttribute('open');
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { var o = document.querySelector('details.lang-switch[open]'); if (o) { o.removeAttribute('open'); } }
  });

  // 2) Banner: solo si no hay elección guardada y no es un bot.
  var ua = navigator.userAgent || '';
  if (!ua || /bot|crawl|spider|slurp|bing|google|duckduck|yandex|baidu|facebookexternalhit|twitterbot|linkedin|whatsapp|telegram|slack|pinterest|preview|embedly|lighthouse|pagespeed|gtmetrix|headless|curl|wget|python|go-http|monitor|uptime|ahrefs|semrush/i.test(ua)) return;
  if (getCookie() || document.getElementById('loc-banner')) return;
  var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  var first = String(langs[0] || '').toLowerCase();
  if (!first) return;

  var BY_COUNTRY = { AR: 'es-ar', MX: 'es-mx', ES: 'es-es', BR: 'pt-br', US: 'en', CA: 'en', GB: 'en', IE: 'en', AU: 'en', NZ: 'en', ZA: 'en', SG: 'en' };
  var LANG_OK = { 'es-ar': ['es'], 'es-mx': ['es'], 'es-es': ['es', 'ca', 'gl', 'eu'], 'pt-br': ['pt'], en: ['en'] };

  function byLanguage(tag) {
    var l = tag.split('-')[0];
    if (/-ar$/.test(tag)) return 'es-ar';
    if (l === 'pt') return 'pt-br';
    if (l === 'en') return 'en';
    if (tag === 'es-mx' || tag === 'es-us') return 'es-mx';
    if (tag === 'es-es') return 'es-es';
    return '';
  }
  function decide(country) {
    var l = first.split('-')[0], c = BY_COUNTRY[country] || '';
    if (/-ar$/.test(first)) return 'es-ar';
    if (country === 'US' && l === 'es') c = 'es-mx';
    if (c && LANG_OK[c] && LANG_OK[c].indexOf(l) > -1) return c;
    return byLanguage(first);
  }

  function show(target) {
    var t = cfg.locales[target];
    if (!t || target === cfg.current || document.getElementById('loc-banner')) return;
    var bar = document.createElement('div');
    bar.id = 'loc-banner'; bar.className = 'loc-banner'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', t.aria); bar.lang = t.lang;
    var txt = document.createElement('span'); txt.textContent = t.text;
    var go = document.createElement('a'); go.className = 'loc-go'; go.href = t.url; go.setAttribute('data-loc', target); go.setAttribute('hreflang', t.lang); go.textContent = t.go;
    var stay = document.createElement('button'); stay.type = 'button'; stay.className = 'loc-stay'; stay.textContent = t.stay;
    var close = document.createElement('button'); close.type = 'button'; close.className = 'loc-close'; close.setAttribute('aria-label', t.close); close.innerHTML = '&times;';
    function dismiss() { setCookie(cfg.current, 90); bar.remove(); document.body.classList.remove('has-loc-banner'); }
    stay.addEventListener('click', dismiss); close.addEventListener('click', dismiss);
    bar.appendChild(txt); bar.appendChild(go); bar.appendChild(stay); bar.appendChild(close);
    document.body.appendChild(bar); document.body.classList.add('has-loc-banner');
  }

  function run() {
    var done = false;
    function finish(country) { if (done) return; done = true; try { show(decide(country)); } catch (e) {} }
    try {
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); finish(''); }, 2000);
      fetch('/cdn-cgi/trace', { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (txt) { clearTimeout(timer); var m = /^loc=([A-Z]{2})$/m.exec(txt || ''); finish(m ? m[1] : ''); })
        .catch(function () { clearTimeout(timer); finish(''); });
    } catch (e) { finish(''); }
  }
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 }); else setTimeout(run, 800);
})();
