const express = require('express');
const path = require('path');
const session = require('express-session');
const QRCode = require('qrcode');
const D = require('./src/data');
const Auth = require('./src/auth');
const db = require('./src/db');
const AiScore = require('./src/aiscore');
const Comms = require('./src/comms');
const Mailer = require('./src/mailer');
const Turnstile = require('./src/turnstile');
const pgSession = require('connect-pg-simple')(session);
const compression = require('compression');
const VER = require('./src/version');
const i18n = require('./src/i18n');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // Railway zit achter een proxy
app.disable('x-powered-by');
app.use(compression());
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  if (process.env.NODE_ENV === 'production') res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// ── Taal (PL/EN): ?lang=… zet een cookie (1 jaar); anders cookie; anders PL ──
const LANGS = ['pl', 'en'];
app.use((req, res, next) => {
  let lang;
  if (typeof req.query.lang === 'string' && LANGS.includes(req.query.lang)) {
    lang = req.query.lang;
    res.cookie('lang', lang, { maxAge: 365 * 24 * 3600 * 1000, sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  } else {
    const m = /(?:^|;\s*)lang=(pl|en)(?:;|$)/.exec(req.headers.cookie || '');
    lang = m ? m[1] : 'pl';
  }
  res.locals.lang = lang;
  res.locals.t = i18n[lang];
  res.locals.langUrl = (l) => {
    const isGet = req.method === 'GET';
    const q = new URLSearchParams(isGet ? req.query : {});
    q.set('lang', l);
    return (isGet ? req.path : '/') + '?' + q.toString();
  };
  // WINDYKACJA_OFF=1: incasso-gedeelte tijdelijk dicht (pauzepagina, links verborgen, registratie dicht)
  res.locals.windykacjaOff = process.env.WINDYKACJA_OFF === '1';
  // "Umów rozmowę": BOOKING_URL (bv. Calendly/Cal.com) of anders gewoon mailen
  res.locals.bookingUrl = process.env.BOOKING_URL || 'mailto:kontakt@sprzedamfakture.pl';
  res.locals.version = VER.version;
  res.locals.commit = VER.commit;
  res.locals.turnstile = { enabled: Turnstile.enabled(), siteKey: Turnstile.SITE_KEY };
  next();
});
app.use(express.urlencoded({ extended: true }));
const sessionOpts = {
  secret: process.env.SESSION_SECRET || 'sprzedamfakture-dev-secret-zmien-mnie',
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

// ── Bijlagen bij formulieren (factuur/vonnis): in-memory, gaat alleen mee per mail ──
const multer = require('multer');
const ALLOWED_UPLOAD = ['application/pdf', 'image/jpeg', 'image/png', 'text/xml', 'application/xml'];
const uploadZalacznik = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } }).single('zalacznik');
function zalacznikMw(req, res, next) {
  uploadZalacznik(req, res, (err) => {
    if (err) req.zalacznikError = true; // te groot/kapot → nette veldfout
    next();
  });
}

// ── MF biała lista: bedrijfsnaam + VAT-status bij een NIP (open API, gecachet) ──
const NIP_CACHE = new Map();
async function nipRegisterLookup(nip) {
  const clean = String(nip || '').replace(/\D/g, '');
  if (clean.length !== 10) return null;
  const hit = NIP_CACHE.get(clean);
  if (hit && Date.now() - hit.t < 6 * 3600 * 1000) return hit.data;
  const date = new Date().toISOString().slice(0, 10);
  const r = await fetch('https://wl-api.mf.gov.pl/api/search/nip/' + clean + '?date=' + date, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  const s = j && j.result && j.result.subject;
  const data = s ? { name: s.name, statusVat: s.statusVat, line: s.name + (s.statusVat ? ' · VAT: ' + s.statusVat : '') } : null;
  NIP_CACHE.set(clean, { t: Date.now(), data });
  if (NIP_CACHE.size > 500) NIP_CACHE.delete(NIP_CACHE.keys().next().value);
  return data;
}

const TONES = ['Uprzejmy', 'Stanowczy', 'Prawniczy'];
// Advies jurist: incasseren alleen op rechtspersonen — de dłużnik moet een osoba prawna zijn
// Alle rechtsvormen toegestaan (besluit 2026-09: ook JDG, spółka cywilna en osobowe)
const DEBTOR_LEGAL_FORMS = ['spzoo', 'sa', 'psa', 'inna-op', 'jdg', 'sc', 'osobowa'];

function common(extra = {}) {
  return { D, SERVICE_FEE: D.SERVICE_FEE, user: null, ...extra };
}

function safeNext(n) {
  return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/app/sprawy';
}

// ── Auth ─────────────────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  if (Auth.currentUser(req)) return res.redirect('/app/sprawy');
  res.render('login', common({ page: 'auth', error: null, email: '', next: safeNext(req.query.next), demo: Auth.DEMO }));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const next = safeNext(req.body.next);
  const ip = req.ip;
  const fail = (msg) => res.status(401).render('login', common({ page: 'auth', error: msg, email: email || '', next, demo: Auth.DEMO }));

  if (Auth.isLocked(ip, email)) {
    return fail(res.locals.t.app.msg.tooMany);
  }
  const user = Auth.findUser(email);
  if (!user || !Auth.checkPassword(user, password)) {
    Auth.registerFail(ip, email);
    return fail(res.locals.t.app.msg.badCreds);
  }
  Auth.registerSuccess(ip, email);

  req.session.regenerate((err) => {
    if (err) return fail(res.locals.t.app.msg.sessionErr);
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
  if (res.locals.windykacjaOff) return res.render('przerwa', common({ page: 'przerwa' }));
  res.render('rejestracja', common({ page: 'auth', error: null, form: { company: '', nip: '', email: '' } }));
});

app.post('/rejestracja', async (req, res) => {
  if (res.locals.windykacjaOff) return res.render('przerwa', common({ page: 'przerwa' }));
  const { company, nip, email, password, password2 } = req.body;
  const form = { company: company || '', nip: nip || '', email: email || '' };
  const fail = (msg) => res.status(400).render('rejestracja', common({ page: 'auth', error: msg, form }));

  const ts = await Turnstile.verify(req.body['cf-turnstile-response'], req.ip);
  if (!ts.ok) return fail(res.locals.t.app.msg.captcha);

  if (!company || !email) return fail(res.locals.t.app.msg.fillCompanyEmail);
  if (Auth.findUser(email)) return fail(res.locals.t.app.msg.exists);
  const policyErr = Auth.passwordPolicy(password);
  if (policyErr) return fail(res.locals.t.app.msg[policyErr] || policyErr);
  if (password !== password2) return fail(res.locals.t.app.msg.pwMismatch);

  const user = Auth.addUser({ email, password, company, nip, role: 'client' });
  Mailer.welcome(user, res.locals.lang).catch(() => {});
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
    return res.status(401).render('twofa-setup', common({ page: 'auth', error: res.locals.t.app.msg.badCodeRetry, qr, secret: req.session.totpSecret }));
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
    return res.status(401).render('twofa', common({ page: 'auth', error: res.locals.t.app.msg.tooManyCodes, next }));
  }
  if (!Auth.verifyTotp(user.totpSecret, req.body.token)) {
    Auth.registerFail(ip, user.email + ':2fa');
    return res.status(401).render('twofa', common({ page: 'auth', error: res.locals.t.app.msg.badCode, next }));
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
  res.render('admin', common({ page: 'admin', user: req.user, usersList: Auth.allUsers(), done: D.getDone(), events, leads, flash: req.query.msg || null, integr: { ...Mailer.status(), db: db.hasDb(), turnstile: Turnstile.enabled(), problems: [...Mailer.status().problems, ...Turnstile.problems()] } }));
});

// Testmail naar MAIL_NOTIFY — om de Resend-koppeling na deploy te controleren
app.post('/admin/test-mail', Auth.requireAdmin, async (req, res) => {
  const r = await Mailer.testMail(res.locals.lang, VER.version).catch((e) => ({ status: 'błąd: ' + e.message, to: null }));
  const msg = res.locals.t.app.admin.testMailResult + ': ' + res.locals.t.tr(r.status) + (r.to ? ' → ' + r.to : '');
  res.redirect('/admin?msg=' + encodeURIComponent(msg));
});

// ── Marketing ────────────────────────────────────────────────────────────

// Strona główna: sprzedaż faktur (instant wycena + leadformulier)
function renderHome(req, res, extra = {}) {
  const kwota = parseFloat(String(req.query.kwota || '').replace(/\s/g, '').replace(',', '.')) || null;
  const dni = parseInt(req.query.dni, 10) || null;
  const est = kwota && dni && kwota > 0 && dni > 0 ? AiScore.estimateOffer(kwota, dni) : null;
  res.render('sprzedam', common({
    page: 'sprzedam', est,
    q: { kwota: req.query.kwota || '', dni: req.query.dni || '' },
    leadOk: req.query.lead === 'ok',
    form: {}, errors: {},
    ...extra,
  }));
}

app.get('/', (req, res) => renderHome(req, res));

// Oude route van de aparte sprzedam-landing blijft werken
app.get('/sprzedam', (req, res) => {
  const qs = req.url.indexOf('?') >= 0 ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(301, '/' + qs);
});

// Windykacja, faktoring, panel AI — aanvullende landing (PL/EN via taalcookie)
app.get('/windykacja', (req, res) => {
  if (res.locals.windykacjaOff) return res.render('przerwa', common({ page: 'przerwa' }));
  res.render('landing', common({ page: 'landing', lang: res.locals.lang, t: res.locals.t }));
});

// Live wycena (JSON) voor de widget op de homepage
app.get('/api/wycena', (req, res) => {
  const kwota = parseFloat(String(req.query.kwota || '').replace(/\s/g, '').replace(',', '.'));
  const dni = parseInt(req.query.dni, 10);
  res.set('Cache-Control', 'no-store');
  if (!(kwota > 0) || !(dni > 0) || kwota > 1e9 || dni > 3650) {
    return res.status(400).json({ ok: false, error: 'invalid_input' });
  }
  const est = AiScore.estimateOffer(kwota, dni);
  res.json({ ok: true, ...est, amountFmt: D.fmt(est.amount), amountLowFmt: D.fmt(est.amountLow) });
});

// Live NIP-check voor de formulieren (biała lista via onze proxy — CORS)
app.get('/api/nip', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const clean = String(req.query.nip || '').replace(/\D/g, '');
  if (!validNip(clean)) return res.json({ ok: false, error: 'invalid_nip' });
  const data = await nipRegisterLookup(clean).catch(() => null);
  if (!data) return res.json({ ok: false, error: 'not_found' });
  res.json({ ok: true, name: data.name, statusVat: data.statusVat });
});

// Poolse NIP: 10 cijfers + modulo-11-controlecijfer
function validNip(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length !== 10) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = w.reduce((s, wi, i) => s + wi * parseInt(d[i], 10), 0);
  return sum % 11 === parseInt(d[9], 10);
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

app.post('/sprzedaj', zalacznikMw, async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.redirect('/?lead=ok#formularz'); // honeypot: bot → doen alsof het gelukt is
  const ts = await Turnstile.verify(b['cf-turnstile-response'], req.ip);
  const form = {
    company: String(b.company || '').trim().slice(0, 200),
    nip: String(b.nip || '').trim().slice(0, 20),
    kwota: String(b.kwota || '').trim().slice(0, 20),
    dni: String(b.dni || '').trim().slice(0, 6),
    email: String(b.email || '').trim().slice(0, 200),
    tel: String(b.tel || '').trim().slice(0, 40),
    forma: String(b.forma || '').trim().slice(0, 20),
  };
  const kw = parseFloat(form.kwota.replace(/\s/g, '').replace(',', '.')) || 0;
  const dn = parseInt(form.dni, 10) || 0;
  const msg = res.locals.t.home.form.errors;
  const errors = {};
  if (!form.company) errors.company = msg.company;
  if (!validNip(form.nip)) errors.nip = msg.nip;
  if (!DEBTOR_LEGAL_FORMS.includes(form.forma)) errors.forma = msg.forma;
  if (!(kw > 0) || kw > 1e9) errors.kwota = msg.amount;
  if (!(dn > 0) || dn > 3650) errors.dni = msg.days;
  if (!EMAIL_RE.test(form.email)) errors.email = msg.email;
  if (form.tel.replace(/\D/g, '').length < 7) errors.tel = msg.tel;
  if (req.zalacznikError || (req.file && !ALLOWED_UPLOAD.includes(req.file.mimetype))) errors.zalacznik = msg.zalacznik;
  if (!ts.ok) errors.captcha = msg.captcha;
  if (Object.keys(errors).length) {
    res.status(400);
    return renderHome(req, res, { form, errors });
  }
  const est = AiScore.estimateOffer(kw, dn);
  const nip = form.nip.replace(/\D/g, '');
  const lead = { company: form.company, nip, forma: form.forma, email: form.email, tel: form.tel, kwota: kw, dni: dn };
  const reg = await nipRegisterLookup(nip).catch(() => null);
  if (reg) lead.rejestr = reg.line;
  await db.saveLead({ ...lead, oferta_pct: est.pct, note: 'lang=' + res.locals.lang + (lead.rejestr ? ' · ' + lead.rejestr : '') }).catch(() => {});
  // e-mails: notificatie naar MAIL_NOTIFY + bevestiging aan de klant (PL/EN); fouten blokkeren het formulier niet
  const [notify, confirm] = await Promise.all([
    Mailer.leadNotify(lead, est, res.locals.lang, errors.zalacznik ? null : req.file).catch((e) => ({ status: 'błąd: ' + e.message })),
    Mailer.leadConfirm(lead, est, res.locals.lang).catch((e) => ({ status: 'błąd: ' + e.message })),
  ]);
  await db.insertEvent({
    nip, debtor: form.company, type: 'lead',
    title: 'Nowy lead sprzedamfakture.pl: ' + D.fmt(kw) + ' · ' + dn + ' dni · wstępnie ' + est.pct + '% · mail: ' + notify.status + ' / ' + confirm.status,
    source: 'sprzedamfakture.pl',
  }).catch(() => {});
  res.redirect('/?lead=ok#formularz');
});

// ── Health, robots, sitemap ──────────────────────────────────────────────

// ── Skup starych wyroków ─────────────────────────────────────────────────
// Oude vonnissen/tytuły wykonawcze: uitleg + leadformulier. De kern van de wycena:
// waarom is de vorige egzekucja umorzona (bezskuteczność = verjaring loopt opnieuw;
// bezczynność wierzyciela = stuiting vervalt) — zie i18n t.wyroki.
function renderWyroki(req, res, extra = {}) {
  res.render('wyroki', common({
    page: 'wyroki',
    leadOk: req.query.lead === 'ok',
    form: {}, errors: {},
    ...extra,
  }));
}
app.get('/skup-wyrokow', (req, res) => renderWyroki(req, res));

const WYROK_EGZEKUCJA = ['none', 'bezskutecznosc', 'inna', 'nie_wiem'];
app.post('/skup-wyrokow', zalacznikMw, async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.redirect('/skup-wyrokow?lead=ok#formularz'); // honeypot
  const ts = await Turnstile.verify(b['cf-turnstile-response'], req.ip);
  const form = {
    company: String(b.company || '').trim().slice(0, 200),
    email: String(b.email || '').trim().slice(0, 200),
    tel: String(b.tel || '').trim().slice(0, 40),
    sygnatura: String(b.sygnatura || '').trim().slice(0, 60),
    sad: String(b.sad || '').trim().slice(0, 120),
    data_wyroku: String(b.data_wyroku || '').trim().slice(0, 10),
    kwota: String(b.kwota || '').trim().slice(0, 20),
    dluznik: String(b.dluznik || '').trim().slice(0, 160),
    nip: String(b.nip || '').trim().slice(0, 20),
    forma: String(b.forma || '').trim().slice(0, 20),
    egzekucja: String(b.egzekucja || '').trim().slice(0, 20),
    egzekucja_rok: String(b.egzekucja_rok || '').trim().slice(0, 4),
    uwagi: String(b.uwagi || '').trim().slice(0, 2000),
  };
  const kw = parseFloat(form.kwota.replace(/\s/g, '').replace(',', '.')) || 0;
  const rok = parseInt(form.egzekucja_rok, 10) || 0;
  const msg = res.locals.t.wyroki.form.errors;
  const errors = {};
  if (!form.company) errors.company = msg.company;
  if (!EMAIL_RE.test(form.email)) errors.email = msg.email;
  if (form.tel.replace(/\D/g, '').length < 7) errors.tel = msg.tel;
  if (req.zalacznikError || (req.file && !ALLOWED_UPLOAD.includes(req.file.mimetype))) errors.zalacznik = msg.zalacznik;
  if (!form.sygnatura) errors.sygnatura = msg.sygnatura;
  if (!(kw > 0) || kw > 1e9) errors.kwota = msg.amount;
  if (!form.dluznik) errors.dluznik = msg.dluznik;
  if (form.nip && !validNip(form.nip)) errors.nip = msg.nip; // NIP optioneel: buitenlandse wierzyciel kent hem niet altijd
  if (!DEBTOR_LEGAL_FORMS.includes(form.forma)) errors.forma = res.locals.t.home.form.errors.forma;
  if (!WYROK_EGZEKUCJA.includes(form.egzekucja)) errors.egzekucja = msg.egzekucja;
  if (form.egzekucja_rok && !(rok >= 1990 && rok <= 2100)) errors.egzekucja_rok = msg.rok;
  if (form.data_wyroku && !/^\d{4}-\d{2}-\d{2}$/.test(form.data_wyroku)) errors.data_wyroku = msg.data;
  if (!ts.ok) errors.captcha = res.locals.t.home.form.errors.captcha;
  if (Object.keys(errors).length) {
    res.status(400);
    return renderWyroki(req, res, { form, errors });
  }
  const lead = { ...form, nip: form.nip.replace(/\D/g, ''), kwota: kw };
  await db.saveLead({
    source: 'skup-wyrokow', company: form.company, nip: lead.nip, email: form.email, tel: form.tel,
    kwota: kw, dni: 0, oferta_pct: null, forma: form.forma,
    note: ['wyrok ' + form.sygnatura, form.sad, form.data_wyroku, 'dłużnik: ' + form.dluznik,
      'egzekucja: ' + form.egzekucja + (form.egzekucja_rok ? ' (' + form.egzekucja_rok + ')' : ''), form.uwagi]
      .filter(Boolean).join(' · ').slice(0, 900) + ' · lang=' + res.locals.lang,
  }).catch(() => {});
  const [notify, confirm] = await Promise.all([
    Mailer.wyrokNotify(lead, res.locals.lang, req.zalacznikError ? null : req.file).catch((e) => ({ status: 'błąd: ' + e.message })),
    Mailer.wyrokConfirm(lead, res.locals.lang).catch((e) => ({ status: 'błąd: ' + e.message })),
  ]);
  await db.insertEvent({
    nip: lead.nip, debtor: form.dluznik, type: 'lead',
    title: 'Nowe zgłoszenie skupu wyroku: ' + form.sygnatura + ' · ' + D.fmt(kw) + ' · mail: ' + notify.status + ' / ' + confirm.status,
    source: 'skup-wyrokow',
  }).catch(() => {});
  res.redirect('/skup-wyrokow?lead=ok#formularz');
});

app.get('/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const m = Mailer.status();
  const dbs = await db.stats().catch((e) => ({ connected: false, error: e.message }));
  res.json({ ok: true, name: 'sprzedamfakture.pl', version: VER.version, commit: VER.commit, startedAt: VER.startedAt, uptimeSec: Math.round(process.uptime()), db: db.hasDb(), dbStats: dbs, mail: m.resend ? 'resend' : 'simulation', mailFrom: m.from, mailNotify: !!m.notify, mailProblems: m.problems, liveComms: m.liveComms, smsapi: m.smsapi, anthropic: m.anthropic, turnstile: Turnstile.enabled(), turnstileProblems: Turnstile.problems() });
});

const SITE = 'https://sprzedamfakture.pl';
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(['User-agent: *', 'Allow: /', 'Disallow: /app/', 'Disallow: /admin', 'Disallow: /login', 'Disallow: /2fa', 'Disallow: /api/', '', 'Sitemap: ' + SITE + '/sitemap.xml', ''].join('\n'));
});
app.get('/sitemap.xml', (req, res) => {
  const urls = [
    { loc: SITE + '/', alt: true, prio: '1.0' },
    { loc: SITE + '/windykacja', alt: true, prio: '0.8' },
    { loc: SITE + '/kalkulator', prio: '0.7' },
    { loc: SITE + '/skup-wyrokow', alt: true, prio: '0.8' },
  ];
  const alt = (loc) => '<xhtml:link rel="alternate" hreflang="pl" href="' + loc + '?lang=pl"/><xhtml:link rel="alternate" hreflang="en" href="' + loc + '?lang=en"/>';
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    .concat(urls.map((u) => '<url><loc>' + u.loc + '</loc>' + (u.alt ? alt(u.loc) : '') + '<priority>' + u.prio + '</priority></url>'))
    .concat(['</urlset>', '']).join('\n');
  res.type('application/xml').send(xml);
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
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent(res.locals.t.app.msg.flashEmail + ' (' + res.locals.t.app.tones[tone] + '): ' + res.locals.t.tr(r.status)));
});

app.post('/app/sprawy/:id/sms', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id);
  if (!c) return res.redirect('/app/sprawy');
  const tone = TONES.includes(req.body.ton) ? req.body.ton : 'Uprzejmy';
  const r = await Comms.sendSms(c, tone).catch(() => ({ status: 'błąd' }));
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent(res.locals.t.app.msg.flashSms + ' (' + res.locals.t.app.tones[tone] + '): ' + res.locals.t.tr(r.status)));
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
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent(res.locals.t.app.msg.flashCall + ': ' + res.locals.t.tr(detail)));
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

// Oferta afwijzen: alleen als er nog geen definitieve actie is; windykacja loopt gewoon door
app.post('/app/wykup/:id/odrzuc', Auth.requireAuth, async (req, res) => {
  const c = D.claims.find((x) => x.id === req.params.id);
  const st = D.getDone()[req.params.id];
  if (c && (!st || st === 'decline')) {
    D.setDone(c.id, 'decline');
    await db.insertEvent({ nip: c.nip, debtor: c.debtor, type: 'wykup', title: 'Oferta wykupu odrzucona przez klienta — ' + c.nr, source: 'panel klienta' }).catch(() => {});
  }
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

// ── 404 & fouten ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', common({ page: 'error', code: 404 }));
});
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).render('error', common({ page: 'error', code: 500 }));
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
  app.listen(PORT, () => console.log('sprzedamfakture.pl draait op poort ' + PORT));
}
start();
