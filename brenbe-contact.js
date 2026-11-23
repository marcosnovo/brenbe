/* Formulario de contacto: mejora progresiva. Sin JS el formulario hace un POST normal a /api/contacto (redirige a /gracias/).
   Con JS: validación por campo, envío con fetch, mensaje de éxito en la misma página y Turnstile (si hay sitekey). */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var live = $('cf-live'), banner = $('contact-error'), okBox = $('cf-success'), btn = $('cf-submit');
  var msgs = form.dataset;
  var btnText = btn.textContent;
  var sitekey = form.dataset.sitekey || '';
  var fields = ['nombre', 'email', 'mensaje', 'consent'];

  form.setAttribute('novalidate', ''); // con JS mostramos nuestros mensajes, localizados y por campo
  form.elements.ts.value = String(Date.now());
  try {
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      var v = q.get(k);
      if (v && form.elements[k]) form.elements[k].value = v.slice(0, 100);
    });
  } catch (e) { /* sin UTM */ }

  // Turnstile: se carga recién cuando la persona se acerca al formulario (no frena la carga de la página).
  var slot = form.querySelector('[data-turnstile-slot]');
  var widgetId = null;
  function renderWidget() {
    if (!slot || widgetId !== null || !window.turnstile) return;
    widgetId = window.turnstile.render(slot, { sitekey: sitekey, appearance: 'interaction-only', size: 'flexible', language: tsLang });
  }
  var tsLang = (document.querySelector('script[data-ts-lang]') || { dataset: {} }).dataset.tsLang || 'es';
  var loading = false;
  function loadTurnstile() {
    if (!slot || !sitekey || loading) return;
    loading = true;
    window.__brenbeTsReady = renderWidget;
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__brenbeTsReady';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  }
  if (slot && sitekey) {
    form.addEventListener('focusin', loadTurnstile, { once: true });
    form.addEventListener('pointerdown', loadTurnstile, { once: true });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); loadTurnstile(); } }, { rootMargin: '300px' });
      io.observe(form);
    }
  }

  function setError(name, text) {
    var err = $('cf-err-' + name), input = form.elements[name];
    if (!err || !input) return;
    err.textContent = text || '';
    err.hidden = !text;
    if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function clearErrors() { fields.forEach(function (f) { setError(f, ''); }); banner.classList.remove('is-on'); banner.textContent = banner.dataset.orig || banner.textContent; }
  banner.dataset.orig = banner.textContent;

  function showBanner(text) {
    banner.textContent = text;
    banner.classList.add('is-on');
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 50);
  }

  function localValidate() {
    var bad = {};
    var f = form.elements;
    if (!f.nombre.value.trim()) bad.nombre = msgs.mRequired;
    var em = f.email.value.trim();
    if (!em) bad.email = msgs.mRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) bad.email = msgs.mEmail;
    var m = f.mensaje.value.trim();
    if (!m) bad.mensaje = msgs.mRequired;
    else if (m.length < 10) bad.mensaje = msgs.mShort;
    else if (m.length > 4000) bad.mensaje = msgs.mLong;
    if (!f.consent.checked) bad.consent = msgs.mConsent;
    return bad;
  }
  function showFieldErrors(bad) {
    var first = null;
    fields.forEach(function (n) {
      setError(n, bad[n] || '');
      if (bad[n] && !first) first = n;
    });
    if (first) {
      form.elements[first].focus();
      live.textContent = '';
      var all = fields.filter(function (n) { return bad[n]; }).map(function (n) { return bad[n]; }).join(' ');
      setTimeout(function () { live.textContent = all; }, 50);
    }
  }
  function serverFieldMsg(code) {
    return { required: msgs.mRequired, invalid: msgs.mEmail, short: msgs.mShort, long: msgs.mLong }[code] || msgs.mRequired;
  }

  fields.forEach(function (n) {
    var el = form.elements[n];
    el.addEventListener(n === 'consent' ? 'change' : 'input', function () { if (el.getAttribute('aria-invalid')) setError(n, ''); });
  });

  function resetCaptcha() { try { if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId); } catch (e) { /* nada */ } }
  function busy(on) {
    btn.disabled = on;
    btn.textContent = on ? msgs.sending : btnText;
    form.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function track() {
    try {
      // Colector propio en /c (si todavía no existe, no pasa nada).
      if (navigator.sendBeacon) navigator.sendBeacon('/c', new Blob([JSON.stringify({ e: 'contact_submit', p: location.pathname, l: form.elements.locale.value })], { type: 'text/plain' }));
    } catch (e) { /* no-op */ }
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearErrors();
    banner.style.display = '';
    var bad = localValidate();
    if (Object.keys(bad).length) { showFieldErrors(bad); return; }
    busy(true);
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'omit' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'bad' }; }).then(function (d) { return { status: r.status, d: d }; }); })
      .then(function (x) {
        if (x.d && x.d.ok) {
          form.hidden = true;
          banner.classList.remove('is-on');
          banner.style.display = 'none';
          okBox.hidden = false;
          okBox.focus();
          live.textContent = okBox.textContent.replace(/\s+/g, ' ').trim();
          track();
          return;
        }
        busy(false);
        resetCaptcha();
        var d = x.d || {};
        if (d.fields) {
          var b = {};
          Object.keys(d.fields).forEach(function (k) { if (fields.indexOf(k) > -1) b[k] = k === 'consent' ? msgs.mConsent : serverFieldMsg(d.fields[k]); });
          if (Object.keys(b).length) { showFieldErrors(b); return; }
        }
        var map = { captcha: msgs.mCaptcha, too_fast: msgs.mFast, rate_limited: msgs.mRate };
        showBanner(map[d.error] || msgs.mGeneric);
      })
      .catch(function () { busy(false); resetCaptcha(); showBanner(msgs.mGeneric); });
  });
})();
