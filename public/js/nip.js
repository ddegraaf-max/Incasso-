// sprzedamfakture.pl — live NIP-check tegen de biała lista (MF) via /api/nip
// Toont bedrijfsnaam + VAT-status onder elk NIP-veld zodra het controlecijfer klopt.
(function () {
  'use strict';
  if (!window.fetch) return;
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'pl';
  var TXT = {
    pl: { found: 'W rejestrze MF: ', vat: ' · czynny podatnik VAT ✓', vatNot: ' · status VAT: ', notFound: 'Nie znaleziono NIP w wykazie MF — sprawdź numer.', checking: 'Sprawdzam w rejestrze…' },
    en: { found: 'MF register: ', vat: ' · active VAT taxpayer ✓', vatNot: ' · VAT status: ', notFound: 'NIP not found in the MF register — check the number.', checking: 'Checking the register…' },
  }[LANG];

  function validNip(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length !== 10) return null;
    var w = [6, 5, 7, 2, 3, 4, 5, 6, 7], s = 0;
    for (var i = 0; i < 9; i++) s += w[i] * parseInt(d[i], 10);
    return s % 11 === parseInt(d[9], 10) ? d : null;
  }

  document.querySelectorAll('input[name="nip"]').forEach(function (input) {
    var box = document.createElement('p');
    box.className = 'nip-check';
    box.hidden = true;
    input.insertAdjacentElement('afterend', box);
    var timer = null, last = '';
    function check() {
      var nip = validNip(input.value);
      if (!nip) { box.hidden = true; last = ''; return; }
      if (nip === last) return;
      last = nip;
      box.hidden = false; box.className = 'nip-check'; box.textContent = TXT.checking;
      fetch('/api/nip?nip=' + nip, { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (last !== nip) return;
          if (j && j.ok) {
            box.className = 'nip-check nip-ok';
            box.textContent = TXT.found + j.name + (j.statusVat === 'Czynny' ? TXT.vat : (j.statusVat ? TXT.vatNot + j.statusVat : ''));
          } else {
            box.className = 'nip-check nip-miss';
            box.textContent = TXT.notFound;
          }
        })
        .catch(function () { box.hidden = true; });
    }
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(check, 400); });
    check();
  });
})();
