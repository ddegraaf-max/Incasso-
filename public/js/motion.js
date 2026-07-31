// Creditline Poland — motion-laag (landing)
// Subtiel en performant: respecteert prefers-reduced-motion, pauzeert buiten beeld.
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches;

  // ── 1. Hero: goud netwerk-canvas ──────────────────────────────────────
  var canvas = document.getElementById('hero-net');
  if (canvas && !reduced) {
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var W, H, pts = [];
    var N = 46, MAXD = 150;

    function resize() {
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    function seed() {
      pts = [];
      for (var i = 0; i < N; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
          r: 1.2 + Math.random() * 1.8,
        });
      }
    }
    var running = true;
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < N; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(184,137,45,0.4)';
        ctx.fill();
        for (var j = i + 1; j < N; j++) {
          var q = pts[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAXD) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(184,137,45,' + (0.14 * (1 - d / MAXD)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }
    resize(); seed(); frame();
    window.addEventListener('resize', function () { resize(); seed(); });
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !running) { running = true; frame(); }
      if (!vis) running = false;
    }).observe(hero);
  }

  // ── 2. Tellende cijfers (alleen het tekst-node — <sup> blijft intact) ──
  function animateCount(el) {
    if (el.getAttribute('data-count-done')) return;
    var node = null;
    for (var k = 0; k < el.childNodes.length; k++) {
      var n = el.childNodes[k];
      if (n.nodeType === 3 && /\d/.test(n.nodeValue)) { node = n; break; }
    }
    if (!node) return;
    var raw = node.nodeValue;
    var m2 = raw.match(/^([^0-9]*)([\d\s.,\u00a0]*\d)(.*)$/);
    if (!m2) return;
    var pre = m2[1], numStr = m2[2], post = m2[3];
    var thousandsComma = /^\d{1,3}(,\d{3})+$/.test(numStr);
    var thousandsSpace = /\d[\s\u00a0]\d/.test(numStr);
    var decimalComma = /^\d+,\d{1,2}$/.test(numStr);
    var clean = numStr.replace(/[\s\u00a0]/g, '');
    if (thousandsComma) clean = clean.replace(/,/g, '');
    else if (decimalComma) clean = clean.replace(',', '.');
    var target = parseFloat(clean);
    if (isNaN(target)) return;
    el.setAttribute('data-count-done', '1');
    if (reduced) return;
    var decimals = decimalComma || /\.\d/.test(clean) ? 1 : 0;
    function fmt(v) {
      var s = decimals ? v.toFixed(1).replace('.', ',') : Math.round(v).toString();
      if (thousandsComma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      else if (thousandsSpace) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
      return s;
    }
    var t0 = null, DUR = 1300;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / DUR);
      var e = 1 - Math.pow(1 - p, 3);
      node.nodeValue = pre + fmt(target * e) + post;
      if (p < 1) requestAnimationFrame(step);
      else node.nodeValue = raw;
    }
    requestAnimationFrame(step);
  }

  // ── 3. Scroll-reveal ──────────────────────────────────────────────────
  var revealables = document.querySelectorAll(
    '.stats-strip .cell, .svc .cell, .law-grid .cell, .path-grid .cell, ' +
    '.model-grid .cell, .why-grid .cell, .now-row, .closing h2, .hero h1, .hero .sub, .hero .cta'
  );
  revealables.forEach(function (el, i) { el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 70 + 'ms'; });
  if (reduced) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          e.target.querySelectorAll('.v, .n-v').forEach(animateCount);
          if (e.target.matches('.stats-strip .cell, .law-grid .cell')) {
            var v = e.target.querySelector('.v'); if (v) animateCount(v);
          }
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  // ── 4. 3D-tilt op kaarten ─────────────────────────────────────────────
  if (!reduced && !isTouch) {
    document.querySelectorAll('.stats-strip .cell, .svc .cell, .model-grid .cell').forEach(function (card) {
      card.classList.add('tilt');
      card.addEventListener('mousemove', function (ev) {
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 4) + 'deg) rotateY(' + (px * 5) + 'deg) translateY(-2px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  // ── 5. Hero-kaart parallax ────────────────────────────────────────────
  var heroCard = document.querySelector('.hero-card');
  if (heroCard && !reduced && !isTouch) {
    var heroEl = heroCard.closest('.hero');
    heroEl.addEventListener('mousemove', function (ev) {
      var r = heroEl.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width - 0.5;
      var py = (ev.clientY - r.top) / r.height - 0.5;
      heroCard.style.setProperty('--mx', (px * 9) + 'deg');
      heroCard.style.setProperty('--my', (-py * 7) + 'deg');
    });
    heroEl.addEventListener('mouseleave', function () {
      heroCard.style.setProperty('--mx', '0deg');
      heroCard.style.setProperty('--my', '0deg');
    });
  }
})();
