const express = require('express');
const path = require('path');
const D = require('./src/data');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const TONES = ['Uprzejmy', 'Stanowczy', 'Prawniczy'];

function common(extra = {}) {
  return { D, SERVICE_FEE: D.SERVICE_FEE, ...extra };
}

// ── Marketing ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('landing', common({ page: 'landing' }));
});

// ── App ──────────────────────────────────────────────────────────────────
app.get('/app', (req, res) => res.redirect('/app/sprawy'));

app.get('/app/sprawy', (req, res) => {
  const sel = D.claims.find((c) => c.id === req.query.sel) || D.claims.find((c) => c.id === 'f2');
  const done = D.getDone();
  const stats = {
    portfolio: D.claims.reduce((s, c) => s + c.amount, 0),
    active: D.claims.length,
  };
  res.render('sprawy', common({ page: 'app', tab: 'sprawy', sel, done, stats }));
});

app.post('/app/sprawy/:id/:action', (req, res) => {
  const { id, action } = req.params;
  if (D.claims.some((c) => c.id === id) && ['collect', 'sell'].includes(action)) {
    D.setDone(id, action);
  }
  res.redirect('/app/sprawy?sel=' + encodeURIComponent(id));
});

app.get('/app/nowa', (req, res) => {
  res.render('nowa', common({ page: 'app', tab: 'nowa', nowaDone: D.getNowaDone() }));
});

app.post('/app/nowa/:action', (req, res) => {
  if (['collect', 'sell'].includes(req.params.action)) D.setNowaDone(req.params.action);
  res.redirect('/app/nowa');
});

app.get('/app/agent', (req, res) => {
  const tone = TONES.includes(req.query.ton) ? req.query.ton : 'Uprzejmy';
  res.render('agent', common({ page: 'app', tab: 'agent', tone, TONES, thread: D.thread(tone), feed: D.feed }));
});

app.get('/app/wykup', (req, res) => {
  res.render('wykup', common({ page: 'app', tab: 'wykup', done: D.getDone() }));
});

app.post('/app/wykup/:id/sprzedaj', (req, res) => {
  if (D.claims.some((c) => c.id === req.params.id)) D.setDone(req.params.id, 'sell');
  res.redirect('/app/wykup');
});

// ── Extra: publiczny kalkulator odsetek + rekompensaty ───────────────────
app.get('/kalkulator', (req, res) => {
  const amount = parseFloat(String(req.query.kwota || '').replace(',', '.')) || null;
  const days = parseInt(req.query.dni, 10) || null;
  let result = null;
  if (amount && days && amount > 0 && days > 0) {
    const odsetki = D.interestExact(amount, days);
    const rekompEur = D.rekomp(amount);
    result = { amount, days, odsetki, rekompEur, total: amount + odsetki };
  }
  res.render('kalkulator', common({ page: 'kalkulator', result, q: { kwota: req.query.kwota || '', dni: req.query.dni || '', nr: req.query.nr || '', dluznik: req.query.dluznik || '' } }));
});

// ── Extra: wezwanie do zapłaty (printbaar) ───────────────────────────────
app.get('/wezwanie', (req, res) => {
  const amount = parseFloat(String(req.query.kwota || '').replace(',', '.')) || 0;
  const days = parseInt(req.query.dni, 10) || 0;
  const odsetki = amount && days ? D.interestExact(amount, days) : 0;
  res.render('wezwanie', {
    D,
    nr: req.query.nr || '—',
    dluznik: req.query.dluznik || '—',
    amount, days, odsetki,
    rekompEur: amount ? D.rekomp(amount) : 40,
    today: new Date().toLocaleDateString('pl-PL'),
  });
});

app.listen(PORT, () => console.log('Creditline Poland draait op poort ' + PORT));
