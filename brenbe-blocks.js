/* BRENBE: mejoras opcionales para las plantillas de contenido (paletas y antes/después).
   Todo funciona sin este archivo: los botones y el control deslizante empiezan ocultos y se muestran solo si hay JS. */
(function () {
  'use strict';

  /* Paleta: copiar el código hex e imprimir */
  var pal = document.querySelector('[data-pal]');
  if (pal) {
    var status = pal.querySelector('[data-pal-status]');
    var say = function (msg) { if (status) { status.textContent = ''; setTimeout(function () { status.textContent = msg; }, 30); } };
    var legacy = function (text) {
      return new Promise(function (ok, fail) {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy') ? ok() : fail(); } catch (e) { fail(e); } finally { document.body.removeChild(ta); }
      });
    };
    var copy = function (text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { return legacy(text); });
      return legacy(text);
    };
    Array.prototype.forEach.call(pal.querySelectorAll('.pal-copy'), function (btn) {
      btn.hidden = false;
      var label = btn.textContent;
      btn.addEventListener('click', function () {
        copy(btn.getAttribute('data-copy')).then(function () {
          btn.textContent = btn.getAttribute('data-done');
          say(btn.getAttribute('data-done') + ' ' + btn.getAttribute('data-copy'));
          setTimeout(function () { btn.textContent = label; }, 1800);
        }, function () {});
      });
    });
    var pr = pal.querySelector('.pal-print');
    if (pr) { pr.hidden = false; pr.addEventListener('click', function () { window.print(); }); }
  }

  /* Antes y después: control deslizante */
  Array.prototype.forEach.call(document.querySelectorAll('[data-ba]'), function (fig) {
    var pair = fig.querySelector('.ba-pair');
    var ctl = fig.querySelector('.ba-control');
    var input = ctl && ctl.querySelector('input');
    if (!pair || !input) return;
    var set = function (v) {
      v = Math.max(0, Math.min(100, v));
      fig.style.setProperty('--ba-pos', v + '%');
      input.value = v;
      input.setAttribute('aria-valuetext', Math.round(v) + ' %');
    };
    fig.classList.add('is-slider');
    ctl.hidden = false;
    set(50);
    input.addEventListener('input', function () { set(parseFloat(input.value)); });
    var drag = false;
    var move = function (e) {
      var r = pair.getBoundingClientRect();
      if (r.width) set(((e.clientX - r.left) / r.width) * 100);
    };
    pair.addEventListener('pointerdown', function (e) { drag = true; move(e); try { pair.setPointerCapture(e.pointerId); } catch (x) {} });
    pair.addEventListener('pointermove', function (e) { if (drag) move(e); });
    pair.addEventListener('pointerup', function () { drag = false; });
    pair.addEventListener('pointercancel', function () { drag = false; });
  });
})();
