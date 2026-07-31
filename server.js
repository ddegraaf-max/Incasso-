const express = require('express');
const path = require('path');
const session = require('express-session');
const QRCode = require('qrcode');
const D = require('./src/data');
const Auth = require('./src/auth');
const db = require('./src/db');
const AiScore = require('./src/aiscore');
const Comms = require('./src/comms');
const pgSession = require('connect-pg-simple')(session);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // Railway zit achter een proxy
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
const sessionOpts = {
  secret: process.env.SESSION_SECRET || 'creditline-dev-secret-zmien-mnie',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000, // 8 uur
  },
};
let sessionMiddleware = null;
app.use((req, res, next) => sessionMiddleware(req, res, next));

const TONES = ['Uprzejmy', 'Stanowczy', 'Prawniczy'];

function common(extra = {}) {
  return { D, SERVICE_FEE: D.SERVICE_FEE, user: null, ...extra };
}

function safeNext(n) {
  return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/app/sprawy';
}

// ── Auth ─────────────────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  if (Auth.currentUser(req)) return res.redirect('/app/sprawy');
  res.render('login', common({ page: 'auth', error: null, email: '', next: safeNext(req.query.next) }));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const next = safeNext(req.body.next);
  const ip = req.ip;
  const fail = (msg) => res.status(401).render('login', common({ page: 'auth', error: msg, email: email || '', next }));

  if (Auth.isLocked(ip, email)) {
    return fail('Zbyt wiele nieudanych prób. Spróbuj ponownie za 15 minut.');
  }
  const user = Auth.findUser(email);
  if (!user || !Auth.checkPassword(user, password)) {
    Auth.registerFail(ip, email);
    return fail('Nieprawidłowy e-mail lub hasło.');
  }
  Auth.registerSuccess(ip, email);

  req.session.regenerate((err) => {
    if (err) return fail('Błąd sesji — spróbuj ponownie.');
    req.session.userId = user.id;
    // Admin zonder 2FA → verplichte setup; klant met 2FA → verificatie
    if (user.totpConfirmed) {
      req.session.pending2fa = true;
      return res.redirect('/2fa?next=' + encodeURIComponent(next));
    }
    if (user.role === 'admin') {
      req.session.pending2fa = true;
      req.session.setup2fa = true;
      return res.redirect('/2fa/setup');
    }
    req.session.pending2fa = false;
    res.redirect(next);
  });
});

app.get('/rejestracja', (req, res) => {
  res.render('rejestracja', common({ page: 'auth', error: null, form: { company: '', nip: '', email: '' } }));
});

app.post('/rejestracja', (req, res) => {
  const { company, nip, email, password, password2 } = req.body;
  const form = { company: company || '', nip: nip || '', email: email || '' };
  const fail = (msg) => res.status(400).render('rejestracja', common({ page: 'auth', error: msg, form }));

  if (!company || !email) return fail('Uzupełnij nazwę firmy i e-mail.');
  if (Auth.findUser(email)) return fail('Konto z tym adresem już istnieje. Zaloguj się.');
  const policyErr = Auth.passwordPolicy(password);
  if (policyErr) return fail(policyErr);
  if (password !== password2) return fail('Hasła nie są identyczne.');

  const user = Auth.addUser({ email, password, company, nip, role: 'client' });
  req.session.regenerate(() => {
    req.session.userId = user.id;
    req.session.pending2fa = true;
    req.session.setup2fa = true;
    res.redirect('/2fa/setup');
  });
});

app.get('/2fa/setup', async (req, res) => {
  const user = req.session.userId ? Auth.findUserById(req.session.userId) : null;
  if (!user || !req.session.setup2fa) return res.redirect('/login');
  if (!req.session.totpSecret) req.session.totpSecret = Auth.newTotpSecret();
  const uri = Auth.totpUri(user, req.session.totpSecret);
  const qr = await QRCode.toDataURL(uri, { margin: 0, width: 196 });
  res.render('twofa-setup', common({ page: 'auth', error: null, qr, secret: req.session.totpSecret }));
});

app.post('/2fa/setup', async (req, res) => {
  const user = req.session.userId ? Auth.findUserById(req.session.userId) : null;
  if (!user || !req.session.setup2fa || !req.session.totpSecret) return res.redirect('/login');
  if (!Auth.verifyTotp(req.session.totpSecret, req.body.token)) {
    const uri = Auth.totpUri(user, req.session.totpSecret);
    const qr = await QRCode.toDataURL(uri, { margin: 0, width: 196 });
    return res.status(401).render('twofa-setup', common({ page: 'auth', error: 'Nieprawidłowy kod — spróbuj ponownie.', qr, secret: req.session.totpSecret }));
  }
  user.totpSecret = req.session.totpSecret;
  user.totpConfirmed = true;
  db.updateUserTotp(user).catch(() => {});
  delete req.session.totpSecret;
  delete req.session.setup2fa;
  req.session.pending2fa = false;
  res.redirect(user.role === 'admin' ? '/admin' : '/app/sprawy');
});

app.get('/2fa', (req, res) => {
  if (!req.session.userId || !req.session.pending2fa) return res.redirect('/login');
  res.render('twofa', common({ page: 'auth', error: null, next: safeNext(req.query.next) }));
});

app.post('/2fa', (req, res) => {
  const user = req.session.userId ? Auth.findUserById(req.session.userId) : null;
  const next = safeNext(req.body.next);
  if (!user || !req.session.pending2fa) return res.redirect('/login');
  const ip = req.ip;
  if (Auth.isLocked(ip, user.email + ':2fa')) {
    return res.status(401).render('twofa', common({ page: 'auth', error: 'Zbyt wiele prób. Spróbuj za 15 minut.', next }));
  }
  if (!Auth.verifyTotp(user.totpSecret, req.body.token)) {
    Auth.registerFail(ip, user.email + ':2fa');
    return res.status(401).render('twofa', common({ page: 'auth', error: 'Nieprawidłowy kod.', next }));
  }
  Auth.registerSuccess(ip, user.email + ':2fa');
  req.session.pending2fa = false;
  res.redirect(user.role === 'admin' && next === '/app/sprawy' ? '/admin' : next);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ── Admin ────────────────────────────────────────────────────────────────
app.get('/admin', Auth.requireAdmin, async (req, res) => {
  const events = await db.listEvents(15).catch(() => []);
  const leads = await db.listLeads(15).catch(() => []);
  res.render('admin', common({ page: 'admin', user: req.user, usersList: Auth.allUsers(), done: D.getDone(), events, leads }));
});

// ── Marketing (host-routing: creditline vs sprzedamfakture) ──────────────
const i18n = require('./src/i18n');
const SPRZEDAM_HOSTS = (process.env.SPRZEDAM_HOSTS || 'sprzedamfakture.pl,www.sprzedamfakture.pl').split(',');

function isSprzedamHost(req) {
  const host = (req.hostname || '').toLowerCase();
  return SPRZEDAM_HOSTS.includes(host);
}

function renderSprzedam(req, res, extra = {}) {
  const kwota = parseFloat(String(req.query.kwota || '').replace(',', '.')) || null;
  const dni = parseInt(req.query.dni, 10) || null;
  const est = kwota && dni && kwota > 0 && dni > 0 ? AiScore.estimateOffer(kwota, dni) : null;
  res.render('sprzedam', common({
    page: 'sprzedam', est,
    q: { kwota: req.query.kwota || '', dni: req.query.dni || '' },
    leadOk: req.query.lead === 'ok',
    ...extra,
  }));
}

app.get('/', (req, res) => {
  if (isSprzedamHost(req)) return renderSprzedam(req, res);
  const lang = req.query.lang === 'en' ? 'en' : 'pl';
  res.render('landing', common({ page: 'landing', lang, t: i18n[lang] }));
});

// preview op hoofddomein + eigen route
app.get('/sprzedam', (req, res) => renderSprzedam(req, res));

app.post('/sprzedaj', async (req, res) => {
  const { company, nip, kwota, dni, email, tel } = req.body;
  const kw = parseFloat(String(kwota || '').replace(',', '.')) || 0;
  const dn = parseInt(dni, 10) || 0;
  if (!company || !email || !kw || !dn) {
    return res.redirect((isSprzedamHost(req) ? '/' : '/sprzedam') + '#formularz');
  }
  const est = AiScore.estimateOffer(kw, dn);
  await db.saveLead({ company, nip, email, tel, kwota: kw, dni: dn, oferta_pct: est.pct }).catch(() => {});
  await db.insertEvent({
    nip, debtor: company, type: 'lead',
    title: 'Nowy lead sprzedamfakture.pl: ' + D.fmt(kw) + ' · ' + dn + ' dni · wstępnie ' + est.pct + '%',
    source: 'sprzedamfakture.pl',
  }).catch(() => {});
  res.redirect((isSprzedamHost(req) ? '/' : '/sprzedam') + '?lead=ok#formularz');
});

// ── App ──────────────────────────────────────────────────────────────────
app.get('/app', Auth.requireAuth, (req, res) => res.redirect('/app/sprawy'));

app.get('/app/sprawy', Auth.requireAuth, async (req, res) => {
  const sel = D.claims.find((c) => c.id === req.query.sel) || D.claims.find((c) => c.id === 'f2');
  const done = D.getDone();
  const comms = await db.listComms(sel.id, 6).catch(() => []);
  const flash = req.query.msg || null;
  const stats = {
    portfolio: D.claims.reduce((s, c) => s + c.amount, 0),
    active: D.claims.length,
  };
  res.render('sprawy', common({ user: req.user, page: 'app', tab: 'sprawy', sel, done, stats, comms, flash }));
});

// ── Agent-acties: e-mail / sms / rozmowa ─────────────────────────────────
const caseById = (id) => D.claims.find((c) => c.id === id);

app.post('/app/sprawy/:id/email', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id);
  if (!c) return res.redirect('/app/sprawy');
  const tone = TONES.includes(req.body.ton) ? req.body.ton : 'Uprzejmy';
  const r = await Comms.sendEmail(c, tone).catch(() => ({ status: 'błąd' }));
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent('E-mail (' + tone + '): ' + r.status));
});

app.post('/app/sprawy/:id/sms', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id);
  if (!c) return res.redirect('/app/sprawy');
  const tone = TONES.includes(req.body.ton) ? req.body.ton : 'Uprzejmy';
  const r = await Comms.sendSms(c, tone).catch(() => ({ status: 'błąd' }));
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent('SMS (' + tone + '): ' + r.status));
});

app.get('/app/sprawy/:id/rozmowa', Auth.requireAuth, (req, res) => {
  const c = caseById(req.params.id);
  if (!c) return res.redirect('/app/sprawy');
  res.render('rozmowa', common({ user: req.user, page: 'app', tab: 'sprawy', c, script: Comms.prepareCall(c), OUTCOMES: Comms.OUTCOMES }));
});

app.post('/app/sprawy/:id/rozmowa', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id);
  if (!c) return res.redirect('/app/sprawy');
  const detail = await Comms.logCall(c, req.body.wynik, req.body.notatka, req.body.termin).catch(() => 'zapisano');
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent('Rozmowa: ' + detail));
});

app.post('/app/sprawy/:id/:action', Auth.requireAuth, (req, res) => {
  const { id, action } = req.params;
  if (D.claims.some((c) => c.id === id) && ['collect', 'sell', 'close'].includes(action)) {
    D.setDone(id, action);
  }
  res.redirect('/app/sprawy?sel=' + encodeURIComponent(id));
});

app.get('/app/nowa', Auth.requireAuth, (req, res) => {
  res.render('nowa', common({ user: req.user, page: 'app', tab: 'nowa', nowaDone: D.getNowaDone() }));
});

app.post('/app/nowa/:action', Auth.requireAuth, (req, res) => {
  if (['collect', 'sell'].includes(req.params.action)) D.setNowaDone(req.params.action);
  res.redirect('/app/nowa');
});

app.get('/app/agent', Auth.requireAuth, async (req, res) => {
  const tone = TONES.includes(req.query.ton) ? req.query.ton : 'Uprzejmy';
  const events = await db.listEvents(10).catch(() => []);
  res.render('agent', common({ user: req.user, page: 'app', tab: 'agent', tone, TONES, thread: D.thread(tone), feed: D.feed, events }));
});

app.get('/app/wykup', Auth.requireAuth, (req, res) => {
  res.render('wykup', common({ user: req.user, page: 'app', tab: 'wykup', done: D.getDone() }));
});

app.post('/app/wykup/:id/sprzedaj', Auth.requireAuth, (req, res) => {
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
    const rekompZl = D.rekompZl(amount);
    result = { amount, days, odsetki, rekompZl, total: amount + odsetki + rekompZl };
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
    rekompZl: amount ? D.rekompZl(amount) : 170,
    today: new Date().toLocaleDateString('pl-PL'),
  });
});

async function start() {
  await db.init().catch((e) => console.error('DB init:', e.message));
  if (db.hasDb()) {
    sessionOpts.store = new pgSession({ pool: db.getPool(), createTableIfMissing: true });
  }
  sessionMiddleware = session(sessionOpts);
  await Auth.initFromDb().catch(() => {});
  await D.initActions().catch(() => {});
  await AiScore.init(D.claims).catch((e) => console.error('AIScore init:', e.message));
  app.listen(PORT, () => console.log('Creditline Poland draait op poort ' + PORT));
}
start();
