// sprzedamfakture.pl — live wstępna wycena (progressive enhancement)
// Zonder JS werkt het formulier via GET /#wycena; met JS wordt /api/wycena live bevraagd.
(function () {
  'use strict';
  var form = document.getElementById('wycena-form');
  var box = document.getElementById('wycena-live');
  if (!form || !box || !window.fetch) return;

  var kwotaEl = document.getElementById('w-kwota');
  var dniEl = document.getElementById('w-dni');
  var main = box.querySelector('.swr-main .tnum');
  var sub = box.querySelector('.swr-sub');
  var tpl = sub ? sub.getAttribute('data-tpl') || '' : '';
  var timer = null, ctrl = null, last = '';

  function parseAmount(v) {
    return parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.'));
  }

  function update() {
    var kwota = parseAmount(kwotaEl.value);
    var dni = parseInt(dniEl.value, 10);
    if (!(kwota > 0) || !(dni > 0)) return;
    var key = kwota + ':' + dni;
    if (key === last) return;
    last = key;
    if (ctrl) ctrl.abort();
    ctrl = window.AbortController ? new AbortController() : null;
    fetch('/api/wycena?kwota=' + encodeURIComponent(kwota) + '&dni=' + encodeURIComponent(dni), {
      headers: { Accept: 'application/json' },
      signal: ctrl ? ctrl.signal : undefined,
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) return;
        if (main) main.textContent = j.amountLowFmt + ' – ' + j.amountFmt;
        if (sub) sub.textContent = tpl.replace('{low}', j.pctLow).replace('{high}', j.pct);
        box.hidden = false;
        box.classList.remove('live');
        void box.offsetWidth; // reflow → animatie opnieuw
        box.classList.add('live');
      })
      .catch(function () { /* netwerkfout: formulier blijft werken via submit */ });
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(update, 220);
  }

  kwotaEl.addEventListener('input', schedule);
  dniEl.addEventListener('input', schedule);

  // Met JS: submit → live update, geen reload
  form.addEventListener('submit', function (ev) {
    var kwota = parseAmount(kwotaEl.value), dni = parseInt(dniEl.value, 10);
    if (!(kwota > 0) || !(dni > 0)) return; // laat de browser-validatie het melden
    ev.preventDefault();
    last = '';
    update();
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
