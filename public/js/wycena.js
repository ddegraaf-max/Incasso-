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

// Klepsydra przedawnienia — leest hetzelfde "dni po terminie"-veld en de rodzaj-select
(function () {
  'use strict';
  var panel = document.querySelector('.hg-panel');
  if (!panel) return;
  var dniEl = document.getElementById('w-dni');
  var typeEl = document.getElementById('hg-type');
  var read = document.getElementById('hg-read');
  var top = document.getElementById('hg-sand-top'), bot = document.getElementById('hg-sand-bottom'), stream = document.getElementById('hg-stream');
  var dateEl = document.getElementById('hg-date'), leftEl = document.getElementById('hg-left'), msgEl = document.getElementById('hg-msg');
  var H = 93;
  function calc(dni, years) {
    var MS = 86400000;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var due = new Date(today.getTime() - dni * MS);
    var end = new Date(due); end.setFullYear(end.getFullYear() + years);
    if (years >= 2) end = new Date(end.getFullYear(), 11, 31);
    var total = Math.max(1, Math.round((end - due) / MS));
    var left = Math.floor((end - today) / MS);
    return { end: end, left: Math.max(0, left), fraction: Math.max(0, Math.min(1, left / total)), expired: left < 0 };
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function update() {
    var dni = parseInt(dniEl && dniEl.value, 10), example = false;
    if (!(dni > 0)) { dni = 45; example = true; }
    var r = calc(dni, parseInt(typeEl.value, 10) || 2);
    top.setAttribute('y', (111 - r.fraction * H).toFixed(1)); top.setAttribute('height', (r.fraction * H).toFixed(1));
    var hb = (1 - r.fraction) * H;
    bot.setAttribute('y', (206 - hb).toFixed(1)); bot.setAttribute('height', hb.toFixed(1));
    if (stream) stream.style.display = (r.expired || r.fraction <= 0 || r.fraction >= 1) ? 'none' : '';
    panel.classList.toggle('hg-danger', r.expired || r.fraction < 0.2);
    dateEl.textContent = read.getAttribute('data-result').replace('{date}', two(r.end.getDate()) + '.' + two(r.end.getMonth() + 1) + '.' + r.end.getFullYear());
    leftEl.textContent = r.expired ? '' : read.getAttribute('data-left').replace('{days}', r.left) + ' · ' + read.getAttribute('data-used').replace('{pct}', Math.round((1 - r.fraction) * 100));
    msgEl.textContent = r.expired ? read.getAttribute('data-expired') : (example ? read.getAttribute('data-example').replace('{days}', dni) : '');
  }
  if (dniEl) dniEl.addEventListener('input', update);
  typeEl.addEventListener('change', update);
  update();
})();
