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
const Cases = require('./src/cases');
const Articles = require('./src/articles');
const Company = require('./src/company');
const Research = require('./src/research');
const MD = require('./src/md');
const MailTpl = require('./src/mailtpl');
const AiMail = require('./src/aimail');
const pgSession = require('connect-pg-simple')(session);
const compression = require('compression');
const VER = require('./src/version');
const i18n = require('./src/i18n');

const app = express();
const PORT = process.env.PORT || 3000;
// Zichtbaarheid op internet: Search Console / Bing-verificatie en Plausible-analytics via env
const SEO = { google: process.env.GOOGLE_SITE_VERIFICATION || '', bing: process.env.BING_SITE_VERIFICATION || '', plausible: process.env.PLAUSIBLE_DOMAIN || '' };
const SITE_LASTMOD = '2026-09-28'; // laatste inhoudelijke wijziging van de statische pagina's (sitemap)

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

// ── Taal: ?lang=… zet een cookie (1 jaar); anders cookie; anders PL ──
// Publieke site: PL/EN. Panel bovendien NL (voor de beheerder): met cookie lang=nl blijven de publieke
// pagina's Pools, maar t.app/t.tr/t.locale komen uit het Nederlandse woordenboek. ADMIN_LANG (default nl)
// wordt bij elke admin-login als paneltaal gezet; leeg = niets afdwingen.
const LANGS = ['pl', 'en', 'nl'];
const LANG_COOKIE = { maxAge: 365 * 24 * 3600 * 1000, sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' };
const ADMIN_LANG = process.env.ADMIN_LANG === undefined ? 'nl' : process.env.ADMIN_LANG;
const appI18n = require('./src/i18n-app');
const T_NL = { ...i18n.pl, app: appI18n.nl, locale: appI18n.nl.locale, tr: appI18n.nl.tr };
app.use((req, res, next) => {
  let lang;
  if (typeof req.query.lang === 'string' && LANGS.includes(req.query.lang)) {
    lang = req.query.lang;
    res.cookie('lang', lang, LANG_COOKIE);
  } else {
    const m = /(?:^|;\s*)lang=(pl|en|nl)(?:;|$)/.exec(req.headers.cookie || '');
    lang = m ? m[1] : 'pl';
  }
  res.locals.panelLang = lang;                 // taal van het panel (pl/en/nl)
  const siteLang = lang === 'nl' ? 'pl' : lang; // publieke site kent geen NL
  res.locals.lang = siteLang;
  res.locals.t = lang === 'nl' ? T_NL : i18n[siteLang];
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
  res.locals.site = SITE;
  res.locals.canonicalPath = req.path.length > 1 ? req.path.replace(/\/+$/, '') : '/';
  res.locals.seo = SEO;
  res.locals.company = Company.C;
  res.locals.companyLd = Company.jsonLd(SITE);
  res.locals.md = MD.render;
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
// Geldige bijlage bij de lead bewaren (naast de kopie in de notificatiemail)
async function storeLeadFile(savedLead, req) {
  if (!savedLead || !savedLead.id || !req.file || req.zalacznikError || !ALLOWED_UPLOAD.includes(req.file.mimetype)) return;
  await db.saveLeadFile(savedLead.id, req.file).catch((e) => console.error('Lead-bijlage opslaan mislukt —', e.message));
}
function sendLeadFile(res, f) {
  const mime = f.mimetype || 'application/octet-stream';
  const name = String(f.filename || 'zalacznik');
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
  res.set('Content-Type', mime);
  res.set('Content-Disposition', (mime === 'application/pdf' || /^image\//.test(mime) ? 'inline' : 'attachment') + '; filename="' + ascii + '"; filename*=UTF-8\'\'' + encodeURIComponent(name));
  res.set('Cache-Control', 'private, no-store');
  res.send(f.data);
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
    if (user.role === 'admin' && ADMIN_LANG && LANGS.includes(ADMIN_LANG)) res.cookie('lang', ADMIN_LANG, LANG_COOKIE);
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
  const leads = await db.listLeads(8).catch(() => []);
  res.render('admin', common({ page: 'admin', user: req.user, usersList: Auth.allUsers(), done: D.getDone(), events, leads, claims: D.claims, demoCases: D.DEMO_CASES, flash: req.query.msg || null, integr: { ...Mailer.status(), db: db.hasDb(), turnstile: Turnstile.enabled(), problems: [...Mailer.status().problems, ...Turnstile.problems()] } }));
});

// Testmail naar MAIL_NOTIFY — om de Resend-koppeling na deploy te controleren
app.post('/admin/test-mail', Auth.requireAdmin, async (req, res) => {
  const r = await Mailer.testMail(res.locals.lang, VER.version).catch((e) => ({ status: 'błąd: ' + e.message, to: null }));
  const msg = res.locals.t.app.admin.testMailResult + ': ' + res.locals.t.tr(r.status) + (r.to ? ' → ' + r.to : '');
  res.redirect('/admin?msg=' + encodeURIComponent(msg));
});

// Sporen van de demo-zaken uit de DB (events, comm_log, scores, acties) — leads blijven
app.post('/admin/demo/usun', Auth.requireAdmin, async (req, res) => {
  const M = res.locals.t.app.admin;
  const r = await db.purgeDemo({ caseIds: D.DEMO_IDS, nips: D.DEMO_NIPS }).catch((e) => ({ error: e.message }));
  const msg = r.error ? 'błąd: ' + r.error : res.locals.t.fill(M.demoDone, r);
  res.redirect('/admin?msg=' + encodeURIComponent(msg));
});

// Leadbeheer: alle zgłoszenia uit de formulieren, met status, notitie en verwijderen
const LEAD_STATUSES = ['nowy', 'kontakt', 'oferta', 'zaakceptowany', 'odrzucony', 'spam'];
app.get('/admin/leady', Auth.requireAdmin, async (req, res) => {
  const leads = await db.listLeads(300).catch(() => []);
  const selId = parseInt(req.query.sel, 10);
  const sel = leads.find((l) => l.id === selId) || leads[0] || null;
  const files = sel ? await db.listLeadFiles(sel.id).catch(() => []) : [];
  const fileCounts = await db.countLeadFiles().catch(() => ({}));
  const report = sel ? await db.getLeadReport(sel.id).catch(() => null) : null;
  const reportMap = await db.latestReports().catch(() => ({}));
  const researchPending = sel ? Research.isPending(sel.id) : false;
  const pendingIds = leads.filter((l) => Research.isPending(l.id)).map((l) => l.id);
  const mails = sel ? await db.listComms('L' + sel.id, 10).catch(() => []) : [];
  res.render('admin-leady', common({ page: 'admin', user: req.user, leads, sel, files, fileCounts, report, reportMap, researchPending, pendingIds, mails, LEAD_STATUSES, flash: req.query.msg || null }));
});

// ── E-mailcomposer ───────────────────────────────────────────────────────
// Vanuit een lead (admin → aanvrager) of een zaak (admin/eigenaar → dłużnik of klant).
// Sjablonen: src/mailtpl.js (klant, PL/EN) en Comms.composeEmail (dłużnik, tonen).
const EMAIL_OK = (s) => EMAIL_RE.test(String(s || '').trim());
function tplLang(req, fallback) { return req.query.tl === 'en' || req.body?.tl === 'en' ? 'en' : (req.query.tl === 'pl' || req.body?.tl === 'pl' ? 'pl' : fallback); }

// Lopende AI-taak (?job=…) → invoer terugzetten en pending/resultaat/fout tonen
function applyJob(req, res, over) {
  const Mm = res.locals.t.app.mail;
  const id = req.query.job;
  if (!id) return over;
  const job = AiMail.getJob(id);
  if (!job) return { ...over, error: Mm.aiExpired };
  const st = job.state || {};
  const base = { ...over, ...st };
  if (job.status === 'pending') return { ...base, aiPending: true, aiMode: st.mode || 'draft' };
  if (job.status === 'error') {
    AiMail.finishJob(id);
    const msg = job.errorCode === 'limit' ? Mm.aiLimit.replace('{until}', job.errorUntil || '—') : job.errorCode === 'rate' ? Mm.aiRate : job.errorCode === 'auth' ? Mm.aiAuth : Mm.aiFailed + ': ' + job.error;
    return { ...base, error: msg };
  }
  AiMail.finishJob(id);
  const r = job.result || {};
  if (st.mode === 'translate') return { ...base, translation: r.translation || '', notes: '' };
  return { ...base, subject: r.subject || st.subject, body: r.body || st.body, translation: r.translation || '', notes: r.notes || '' };
}

async function renderLeadComposer(req, res, lead, over = {}) {
  const Mm = res.locals.t.app.mail;
  over = applyJob(req, res, over);
  const tl = over.tl || tplLang(req, Research.parseNote(lead).lang === 'en' ? 'en' : 'pl');
  const tpl = over.tpl !== undefined ? over.tpl : String(req.query.tpl || '');
  let draft = tpl ? MailTpl.forLead(lead, tpl, tl) : { subject: '', body: '' };
  if (req.query.reuse && over.subject === undefined) { const prev = await db.getComm(req.query.reuse, 'L' + lead.id).catch(() => null); if (prev) draft = { subject: prev.subject || '', body: prev.body || '' }; }
  const history = await db.listComms('L' + lead.id, 10).catch(() => []);
  res.status(over.error ? 400 : 200).render('mail', common({
    page: 'admin', user: req.user, ctx: { label: lead.company + ' · #' + lead.id },
    action: '/admin/leady/' + lead.id + '/mail', backUrl: '/admin/leady?sel=' + lead.id, base: '/admin/leady/' + lead.id + '/mail',
    to: over.to !== undefined ? over.to : (lead.email || ''), subject: over.subject !== undefined ? over.subject : draft.subject, body: over.body !== undefined ? over.body : draft.body,
    tpl, tl, aud: 'klient', audiences: [], templates: MailTpl.list('lead', tl, lead.source === 'skup-wyrokow'), history,
    instruction: over.instruction || '', translation: over.translation || '', notes: over.notes || '', aiOk: AiMail.available(), aiPending: !!over.aiPending, aiMode: over.aiMode || 'draft',
    error: over.error || null, fromAddr: Mailer.MAIL_FROM, replyTo: Mailer.MAIL_NOTIFY, mailOk: Mailer.configured(), live: true,
  }));
}

// Vertaaltaal voor het AI-concept: de paneltaal, tenzij die gelijk is aan de mailtaal
function trLangFor(res, mailLang) { const p = res.locals.panelLang || 'pl'; return p === mailLang ? null : p; }
function composerState(req) {
  return { to: String(req.body.to || '').trim(), subject: String(req.body.subject || '').trim().slice(0, 200), body: String(req.body.body || '').trim().slice(0, 20000), instruction: String(req.body.instruction || '').trim().slice(0, 2000), tpl: String(req.body.tpl || '') };
}

// AI-concept / vertaling voor een lead-mail (aan de klant)
app.post('/admin/leady/:id/mail/ai', Auth.requireAdmin, async (req, res) => {
  const Mm = res.locals.t.app.mail;
  const lead = await db.getLead(req.params.id).catch(() => null);
  if (!lead) return res.redirect('/admin/leady');
  const st = composerState(req);
  const tl = tplLang(req, 'pl');
  const mode = req.body.mode === 'translate' ? 'translate' : 'draft';
  if (mode === 'translate' && !st.body) return renderLeadComposer(req, res, lead, { ...st, tl, error: Mm.aiNothing });
  if (!AiMail.available()) return renderLeadComposer(req, res, lead, { ...st, tl, error: Mm.aiUnavailable });
  const trLang = trLangFor(res, tl);
  const report = await db.getLeadReport(lead.id).catch(() => null);
  const files = await db.listLeadFiles(lead.id).catch(() => []);
  const data = { ...lead, attachments: files.map((f) => f.filename), noteParsed: Research.parseNote(lead) };
  const jobId = AiMail.startJob(
    () => (mode === 'translate'
      ? AiMail.translate({ subject: st.subject, body: st.body, from: tl, to: trLang || 'nl' })
      : AiMail.draft({ kind: 'lead', data, report, instruction: st.instruction, lang: tl, trLang, audience: 'klient', signature: MailTpl.signature(tl), to: st.to || lead.email })),
    { ...st, tl, mode }
  );
  res.redirect('/admin/leady/' + lead.id + '/mail?job=' + jobId);
});

app.get('/admin/leady/:id/mail', Auth.requireAdmin, async (req, res) => {
  const lead = await db.getLead(req.params.id).catch(() => null);
  if (!lead) return res.redirect('/admin/leady');
  renderLeadComposer(req, res, lead);
});

// Verstuurde mail van een lead teruglezen
app.get('/admin/leady/:id/mail/:cid', Auth.requireAdmin, async (req, res, next) => {
  const lead = await db.getLead(req.params.id).catch(() => null);
  if (!lead) return res.redirect('/admin/leady');
  if (!/^\d+$/.test(req.params.cid)) return next();
  const m = await db.getComm(req.params.cid, 'L' + lead.id).catch(() => null);
  if (!m) return next();
  const history = await db.listComms('L' + lead.id, 20).catch(() => []);
  res.render('mail-view', common({ page: 'admin', user: req.user, ctx: { label: lead.company + ' · #' + lead.id }, m, history, historyBase: '/admin/leady/' + lead.id + '/mail',
    backUrl: '/admin/leady?sel=' + lead.id, reuseUrl: m.channel === 'email' ? '/admin/leady/' + lead.id + '/mail?reuse=' + m.id : null, fromAddr: Mailer.MAIL_FROM }));
});

app.post('/admin/leady/:id/mail', Auth.requireAdmin, async (req, res) => {
  const Mm = res.locals.t.app.mail;
  const lead = await db.getLead(req.params.id).catch(() => null);
  if (!lead) return res.redirect('/admin/leady');
  const to = String(req.body.to || '').trim(), subject = String(req.body.subject || '').trim().slice(0, 200), body = String(req.body.body || '').trim().slice(0, 20000);
  const tl = tplLang(req, 'pl'), tpl = String(req.body.tpl || '');
  if (!to || !subject || !body) return renderLeadComposer(req, res, lead, { to, subject, body, tl, tpl, error: Mm.missing });
  if (!EMAIL_OK(to)) return renderLeadComposer(req, res, lead, { to, subject, body, tl, tpl, error: Mm.badTo });
  const r = await Comms.sendLeadMail(lead, { to, subject, body, lang: tl }).catch((e) => ({ ok: false, status: 'błąd: ' + e.message }));
  const msg = r.simulated ? res.locals.t.fill(Mm.simulated, { to }) : (r.ok ? res.locals.t.fill(Mm.sent, { to }) : res.locals.t.fill(Mm.failed, { status: res.locals.t.tr(r.status) }));
  res.redirect('/admin/leady?sel=' + lead.id + '&msg=' + encodeURIComponent(msg));
});

async function renderCaseComposer(req, res, c, over = {}) {
  const Mm = res.locals.t.app.mail;
  over = applyJob(req, res, over);
  const isAdmin = req.user.role === 'admin';
  const audiences = isAdmin ? [{ key: 'dluznik', label: Mm.audDebtor }, { key: 'klient', label: Mm.audClient }] : [{ key: 'dluznik', label: Mm.audDebtor }];
  const aud = over.aud || (req.query.aud === 'klient' && isAdmin ? 'klient' : 'dluznik');
  const tl = over.tl || tplLang(req, 'pl');
  const tpl = over.tpl !== undefined ? over.tpl : String(req.query.tpl || '');
  let draft = { subject: '', body: '' };
  if (tpl && aud === 'dluznik' && TONES.includes(tpl)) draft = await Comms.composeEmail(c, tpl).catch(() => ({ subject: '', body: '' }));
  else if (tpl && aud === 'klient') draft = MailTpl.forCase(c, tpl, tl);
  if (req.query.reuse && over.subject === undefined) { const prev = await db.getComm(req.query.reuse, c.id).catch(() => null); if (prev) draft = { subject: prev.subject || '', body: prev.body || '' }; }
  const templates = aud === 'dluznik' ? TONES.map((k) => ({ key: k, name: res.locals.t.app.tones[k] + ' · PL' })) : MailTpl.list('case', tl, false);
  const history = await db.listComms(c.id, 10).catch(() => []);
  res.status(over.error ? 400 : 200).render('mail', common({
    page: 'app', tab: 'sprawy', user: req.user, ctx: { label: c.nr + ' · ' + c.debtor },
    action: '/app/sprawy/' + c.id + '/mail', backUrl: '/app/sprawy?sel=' + c.id, base: '/app/sprawy/' + c.id + '/mail',
    to: over.to !== undefined ? over.to : (aud === 'klient' ? (c.clientEmail || '') : (c.email || '')), subject: over.subject !== undefined ? over.subject : draft.subject, body: over.body !== undefined ? over.body : draft.body,
    tpl, tl, aud, audiences, templates, history,
    instruction: over.instruction || '', translation: over.translation || '', notes: over.notes || '', aiOk: AiMail.available(), aiPending: !!over.aiPending, aiMode: over.aiMode || 'draft',
    error: over.error || null, fromAddr: aud === 'klient' ? Mailer.MAIL_FROM : Comms.FROM_EMAIL, replyTo: Mailer.MAIL_NOTIFY, mailOk: Mailer.configured(), live: aud === 'klient' || c.real || Comms.LIVE_COMMS,
  }));
}

// AI-concept / vertaling voor een zaak-mail (dłużnik of klant)
app.post('/app/sprawy/:id/mail/ai', Auth.requireAuth, async (req, res) => {
  const Mm = res.locals.t.app.mail;
  const c = caseById(req.params.id, req.user);
  if (!c) return res.redirect('/app/sprawy');
  const isAdmin = req.user.role === 'admin';
  const aud = req.body.aud === 'klient' && isAdmin ? 'klient' : 'dluznik';
  const st = composerState(req);
  const tl = tplLang(req, 'pl');
  const mode = req.body.mode === 'translate' ? 'translate' : 'draft';
  if (mode === 'translate' && !st.body) return renderCaseComposer(req, res, c, { ...st, tl, aud, error: Mm.aiNothing });
  if (!AiMail.available()) return renderCaseComposer(req, res, c, { ...st, tl, aud, error: Mm.aiUnavailable });
  const trLang = trLangFor(res, tl);
  {
    const report = c.real && c.leadId ? await db.getLeadReport(c.leadId).catch(() => null) : null;
    const comms = await db.listComms(c.id, 8).catch(() => []);
    const data = {
      nr: c.nr, debtor: c.debtor, nip: c.nip, amount: c.amount, daysOverdue: c.days, dueDate: c.dueDate || null, phase: c.phase,
      interest: D.interest(c.amount, c.days), recoveryFeePln: D.rekompZl(c.amount), aiScore: c.ai ? { score: c.ai.score, grade: c.ai.grade, reco: c.ai.reco } : null,
      client: { company: c.clientCompany, email: c.clientEmail }, note: c.note,
      history: comms.map((k) => ({ date: k.created_at, channel: k.channel, tone: k.tone, subject: k.subject, outcome: k.outcome, status: k.status })),
    };
    const jobId = AiMail.startJob(
      () => (mode === 'translate'
        ? AiMail.translate({ subject: st.subject, body: st.body, from: tl, to: trLang || 'nl' })
        : AiMail.draft({ kind: 'case', data, report, instruction: st.instruction, lang: tl, trLang, audience: aud, signature: aud === 'klient' ? MailTpl.signature(tl) : 'sprzedamfakture.pl — dział windykacji\nw imieniu wierzyciela', to: st.to })),
      { ...st, tl, aud, mode }
    );
    res.redirect('/app/sprawy/' + encodeURIComponent(c.id) + '/mail?job=' + jobId);
  }
});

app.get('/app/sprawy/:id/mail', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id, req.user);
  if (!c) return res.redirect('/app/sprawy');
  renderCaseComposer(req, res, c);
});

// Verstuurd bericht (e-mail/SMS) van een zaak teruglezen
app.get('/app/sprawy/:id/mail/:cid', Auth.requireAuth, async (req, res, next) => {
  const c = caseById(req.params.id, req.user);
  if (!c) return res.redirect('/app/sprawy');
  if (!/^\d+$/.test(req.params.cid)) return next();
  const m = await db.getComm(req.params.cid, c.id).catch(() => null);
  if (!m) return next();
  const history = await db.listComms(c.id, 20).catch(() => []);
  const aud = m.recipient && c.clientEmail && m.recipient === c.clientEmail ? 'klient' : 'dluznik';
  res.render('mail-view', common({ page: 'app', tab: 'sprawy', user: req.user, ctx: { label: c.nr + ' · ' + c.debtor }, m, history, historyBase: '/app/sprawy/' + c.id + '/mail',
    backUrl: '/app/sprawy?sel=' + c.id, reuseUrl: m.channel === 'email' ? '/app/sprawy/' + c.id + '/mail?reuse=' + m.id + '&aud=' + aud : null,
    fromAddr: aud === 'klient' ? Mailer.MAIL_FROM : Comms.FROM_EMAIL, smsFrom: process.env.SMS_FROM || 'SprzedamFV' }));
});

app.post('/app/sprawy/:id/mail', Auth.requireAuth, async (req, res) => {
  const Mm = res.locals.t.app.mail;
  const c = caseById(req.params.id, req.user);
  if (!c) return res.redirect('/app/sprawy');
  const isAdmin = req.user.role === 'admin';
  const aud = req.body.aud === 'klient' && isAdmin ? 'klient' : 'dluznik';
  const to = String(req.body.to || '').trim(), subject = String(req.body.subject || '').trim().slice(0, 200), body = String(req.body.body || '').trim().slice(0, 20000);
  const tl = tplLang(req, 'pl'), tpl = String(req.body.tpl || '');
  if (!to || !subject || !body) return renderCaseComposer(req, res, c, { to, subject, body, tl, tpl, aud, error: Mm.missing });
  if (!EMAIL_OK(to)) return renderCaseComposer(req, res, c, { to, subject, body, tl, tpl, aud, error: Mm.badTo });
  const tone = aud === 'dluznik' && TONES.includes(tpl) ? tpl : null;
  const r = await Comms.sendComposed(c, { to, subject, body, tone, audience: aud, lang: tl }).catch((e) => ({ status: 'błąd: ' + e.message }));
  const msg = r.status === 'symulacja' ? res.locals.t.fill(Mm.simulated, { to }) : (r.status === 'wysłano' ? res.locals.t.fill(Mm.sent, { to }) : res.locals.t.fill(Mm.failed, { status: res.locals.t.tr(r.status) }));
  res.redirect('/app/sprawy?sel=' + encodeURIComponent(c.id) + '&msg=' + encodeURIComponent(msg));
});

// Onderzoeksverslag (opnieuw) opstellen — draait op de achtergrond, de pagina vernieuwt zichzelf
app.post('/admin/leady/:id/raport', Auth.requireAdmin, async (req, res) => {
  const L = res.locals.t.app.admin.leads;
  const lead = await db.getLead(req.params.id).catch(() => null);
  if (!lead) return res.redirect('/admin/leady?msg=' + encodeURIComponent(L.notFound));
  Research.runForLead(lead, { lang: Research.LANG }).catch((e) => console.error('Research:', e.message));
  res.redirect('/admin/leady?sel=' + encodeURIComponent(lead.id) + '&msg=' + encodeURIComponent(L.research.started));
});

// Bijlage van een lead openen (admin)
app.get('/admin/leady/:id/zalacznik/:fid', Auth.requireAdmin, async (req, res, next) => {
  const f = await db.getLeadFile(req.params.fid).catch(() => null);
  if (!f || f.lead_id !== parseInt(req.params.id, 10)) return next();
  sendLeadFile(res, f);
});

app.post('/admin/leady/:id/usun', Auth.requireAdmin, async (req, res) => {
  const L = res.locals.t.app.admin.leads;
  const ok = await db.deleteLead(req.params.id).catch(() => false);
  res.redirect('/admin/leady?msg=' + encodeURIComponent(ok ? res.locals.t.fill(L.deleted, { id: req.params.id }) : L.notFound));
});

// Lead → echte zaak (admin): velden uit het formulier, klant = e-mail van de lead (gekoppeld aan account als dat bestaat)
app.post('/admin/leady/:id/sprawa', Auth.requireAdmin, async (req, res) => {
  const L = res.locals.t.app.admin.leads;
  const lead = await db.getLead(req.params.id).catch(() => null);
  if (!lead) return res.redirect('/admin/leady?msg=' + encodeURIComponent(L.notFound));
  if (lead.case_id && Cases.byId(lead.case_id)) return res.redirect('/app/sprawy?sel=' + encodeURIComponent(lead.case_id));
  try {
    const clientEmail = String(req.body.clientEmail || lead.email || '').trim();
    const owner = Auth.findUser(clientEmail);
    const c = await Cases.create({ ...req.body, clientCompany: req.body.clientCompany || lead.company, clientEmail }, { user: req.user, lead, source: 'lead', ownerUserId: owner ? owner.id : null });
    res.redirect('/app/sprawy?sel=' + encodeURIComponent(c.id) + '&msg=' + encodeURIComponent(res.locals.t.fill(L.caseCreated, { id: lead.id })));
  } catch (e) {
    const err = res.locals.t.app.sprawy.real.errors[e.message] || e.message;
    res.redirect('/admin/leady?sel=' + encodeURIComponent(lead.id) + '&msg=' + encodeURIComponent(err));
  }
});

app.post('/admin/leady/:id', Auth.requireAdmin, async (req, res) => {
  const L = res.locals.t.app.admin.leads;
  const status = LEAD_STATUSES.includes(req.body.status) ? req.body.status : 'nowy';
  const admin_note = String(req.body.admin_note || '').trim().slice(0, 2000) || null;
  const ok = await db.updateLead(req.params.id, { status, admin_note }).catch(() => false);
  res.redirect('/admin/leady?sel=' + encodeURIComponent(req.params.id) + '&msg=' + encodeURIComponent(ok ? res.locals.t.fill(L.saved, { id: req.params.id }) : L.notFound));
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
  if (form.tel && form.tel.replace(/\D/g, '').length < 7) errors.tel = msg.tel; // telefoon optioneel: contact gaat per e-mail
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
  const savedLead = await db.saveLead({ ...lead, oferta_pct: est.pct, note: 'lang=' + res.locals.lang + (lead.rejestr ? ' · ' + lead.rejestr : '') }).catch(() => null);
  await storeLeadFile(savedLead, req);
  if (Research.AUTO && savedLead) Research.runForLead(savedLead).catch((e) => console.error('Research:', e.message));
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
  if (form.tel && form.tel.replace(/\D/g, '').length < 7) errors.tel = msg.tel; // telefoon optioneel: contact gaat per e-mail
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
  const savedLead = await db.saveLead({
    source: 'skup-wyrokow', company: form.company, nip: lead.nip, email: form.email, tel: form.tel,
    kwota: kw, dni: 0, oferta_pct: null, forma: form.forma,
    note: ['wyrok ' + form.sygnatura, form.sad, form.data_wyroku, 'dłużnik: ' + form.dluznik,
      'egzekucja: ' + form.egzekucja + (form.egzekucja_rok ? ' (' + form.egzekucja_rok + ')' : ''), form.uwagi]
      .filter(Boolean).join(' · ').slice(0, 900) + ' · lang=' + res.locals.lang,
  }).catch(() => null);
  await storeLeadFile(savedLead, req);
  if (Research.AUTO && savedLead) Research.runForLead(savedLead).catch((e) => console.error('Research:', e.message));
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

// ── Baza wiedzy (SEO-artikelen, PL/EN) ─────────────────────────────────
app.get('/baza-wiedzy', (req, res) => {
  res.render('baza-wiedzy', common({ page: 'kb', articles: Articles.ARTICLES }));
});
app.get('/baza-wiedzy/:slug', (req, res, next) => {
  const a = Articles.bySlug(req.params.slug);
  if (!a) return next();
  res.render('artykul', common({ page: 'kb', a, articles: Articles.ARTICLES }));
});

app.get('/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const m = Mailer.status();
  const dbs = await db.stats().catch((e) => ({ connected: false, error: e.message }));
  res.json({ ok: true, name: 'sprzedamfakture.pl', version: VER.version, commit: VER.commit, startedAt: VER.startedAt, uptimeSec: Math.round(process.uptime()), db: db.hasDb(), dbStats: dbs, mail: m.resend ? 'resend' : 'simulation', mailFrom: m.from, mailNotify: !!m.notify, mailProblems: m.problems, liveComms: m.liveComms, smsapi: m.smsapi, anthropic: m.anthropic, turnstile: Turnstile.enabled(), turnstileProblems: Turnstile.problems(), cases: D.claims.filter((c) => c.real).length, demoCases: D.DEMO_CASES, articles: Articles.ARTICLES.length, company: Company.complete(), research: Research.status(), seo: { verification: !!(SEO.google || SEO.bing), analytics: !!SEO.plausible } });
});

const SITE = 'https://sprzedamfakture.pl';
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(['User-agent: *', 'Allow: /', 'Disallow: /app/', 'Disallow: /admin', 'Disallow: /login', 'Disallow: /2fa', 'Disallow: /api/', '', 'Sitemap: ' + SITE + '/sitemap.xml', ''].join('\n'));
});
app.get('/sitemap.xml', (req, res) => {
  const urls = [
    { loc: SITE + '/', alt: true, prio: '1.0', mod: SITE_LASTMOD },
    { loc: SITE + '/kalkulator', prio: '0.7', mod: SITE_LASTMOD },
    { loc: SITE + '/skup-wyrokow', alt: true, prio: '0.8', mod: SITE_LASTMOD },
    { loc: SITE + '/baza-wiedzy', alt: true, prio: '0.8', mod: Articles.ARTICLES.reduce((m, a) => (a.updated > m ? a.updated : m), SITE_LASTMOD) },
    ...Articles.ARTICLES.map((a) => ({ loc: SITE + '/baza-wiedzy/' + a.slug, alt: true, prio: '0.7', mod: a.updated })),
  ];
  if (process.env.WINDYKACJA_OFF !== '1') urls.splice(1, 0, { loc: SITE + '/windykacja', alt: true, prio: '0.8', mod: SITE_LASTMOD });
  const alt = (loc) => '<xhtml:link rel="alternate" hreflang="pl" href="' + loc + '?lang=pl"/><xhtml:link rel="alternate" hreflang="en" href="' + loc + '?lang=en"/>';
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    .concat(urls.map((u) => '<url><loc>' + u.loc + '</loc>' + (u.alt ? alt(u.loc) : '') + '<lastmod>' + u.mod + '</lastmod><priority>' + u.prio + '</priority></url>'))
    .concat(['</urlset>', '']).join('\n');
  res.type('application/xml').send(xml);
});

// ── App ──────────────────────────────────────────────────────────────────
app.get('/app', Auth.requireAuth, (req, res) => res.redirect('/app/sprawy'));

app.get('/app/sprawy', Auth.requireAuth, async (req, res) => {
  const claims = Cases.visibleFor(req.user);
  const sel = claims.find((c) => c.id === req.query.sel) || claims.find((c) => c.id === 'f2') || claims[0] || null;
  const done = D.getDone();
  const comms = sel ? await db.listComms(sel.id, 6).catch(() => []) : [];
  const timeline = sel && sel.real ? await db.listCaseEvents(sel.id, 40).catch(() => []) : [];
  const files = sel && sel.real && sel.leadId ? await db.listLeadFiles(sel.leadId).catch(() => []) : [];
  const report = sel && sel.real && sel.leadId ? await db.getLeadReport(sel.leadId).catch(() => null) : null;
  const flash = req.query.msg || null;
  const stats = {
    portfolio: claims.reduce((s, c) => s + c.amount, 0),
    active: claims.length,
  };
  res.render('sprawy', common({ user: req.user, page: 'app', tab: 'sprawy', claims, sel, done, stats, comms, timeline, files, report, flash }));
});

// Bijlage uit de aanvraag openen vanuit de zaak (admin of eigenaar van de zaak)
app.get('/app/sprawy/:id/zalacznik/:fid', Auth.requireAuth, async (req, res, next) => {
  const c = caseById(req.params.id, req.user);
  if (!c || !c.real || !c.leadId) return res.redirect('/app/sprawy');
  const f = await db.getLeadFile(req.params.fid).catch(() => null);
  if (!f || f.lead_id !== c.leadId) return next();
  sendLeadFile(res, f);
});

// ── Agent-acties: e-mail / sms / rozmowa ─────────────────────────────────
// Alleen zaken waar de gebruiker bij mag (demo-zaken: iedereen; echte: admin of eigenaar)
const caseById = (id, user) => { const c = Cases.byId(id); return c && Cases.canAccess(user, c) ? c : null; };

app.post('/app/sprawy/:id/email', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id, req.user);
  if (!c) return res.redirect('/app/sprawy');
  const tone = TONES.includes(req.body.ton) ? req.body.ton : 'Uprzejmy';
  const r = await Comms.sendEmail(c, tone).catch(() => ({ status: 'błąd' }));
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent(res.locals.t.app.msg.flashEmail + ' (' + res.locals.t.app.tones[tone] + '): ' + res.locals.t.tr(r.status)));
});

app.post('/app/sprawy/:id/sms', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id, req.user);
  if (!c) return res.redirect('/app/sprawy');
  const tone = TONES.includes(req.body.ton) ? req.body.ton : 'Uprzejmy';
  const r = await Comms.sendSms(c, tone).catch(() => ({ status: 'błąd' }));
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent(res.locals.t.app.msg.flashSms + ' (' + res.locals.t.app.tones[tone] + '): ' + res.locals.t.tr(r.status)));
});

app.get('/app/sprawy/:id/rozmowa', Auth.requireAuth, (req, res) => {
  const c = caseById(req.params.id, req.user);
  if (!c) return res.redirect('/app/sprawy');
  res.render('rozmowa', common({ user: req.user, page: 'app', tab: 'sprawy', c, script: Comms.prepareCall(c), OUTCOMES: Comms.OUTCOMES }));
});

app.post('/app/sprawy/:id/rozmowa', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id, req.user);
  if (!c) return res.redirect('/app/sprawy');
  const detail = await Comms.logCall(c, req.body.wynik, req.body.notatka, req.body.termin).catch(() => 'zapisano');
  res.redirect('/app/sprawy?sel=' + c.id + '&msg=' + encodeURIComponent(res.locals.t.app.msg.flashCall + ': ' + res.locals.t.tr(detail)));
});

// Echte zaak bewerken (admin of eigenaar); klantvelden alleen door admin
app.post('/app/sprawy/:id/edytuj', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id, req.user);
  const Rl = res.locals.t.app.sprawy.real;
  if (!c || !c.real) return res.redirect('/app/sprawy');
  try {
    const input = { ...req.body };
    if (req.user.role !== 'admin') { delete input.clientCompany; delete input.clientEmail; }
    await Cases.update(c, input);
    res.redirect('/app/sprawy?sel=' + encodeURIComponent(c.id) + '&msg=' + encodeURIComponent(Rl.saved));
  } catch (e) {
    res.redirect('/app/sprawy?sel=' + encodeURIComponent(c.id) + '&msg=' + encodeURIComponent(Rl.errors[e.message] || e.message));
  }
});

app.post('/app/sprawy/:id/usun', Auth.requireAdmin, async (req, res) => {
  const c = Cases.byId(req.params.id);
  const Rl = res.locals.t.app.sprawy.real;
  if (c && c.real) await Cases.remove(c).catch((e) => console.error('Cases: verwijderen mislukt —', e.message));
  res.redirect('/app/sprawy?msg=' + encodeURIComponent(Rl.deleted));
});

app.post('/app/sprawy/:id/:action', Auth.requireAuth, async (req, res) => {
  const { id, action } = req.params;
  const c = caseById(id, req.user);
  if (c && ['collect', 'sell', 'close'].includes(action)) {
    D.setDone(id, action);
    const title = action === 'collect' ? 'Zlecono windykację' : action === 'sell' ? 'Oferta wykupu przyjęta' : 'Sprawa zamknięta i odpisana';
    await db.insertEvent({ nip: c.nip, debtor: c.debtor, type: 'decyzja', case_id: c.real ? c.id : null, title: title + ' — ' + c.nr, source: 'panel klienta' }).catch(() => {});
  }
  res.redirect('/app/sprawy?sel=' + encodeURIComponent(id));
});

app.get('/app/nowa', Auth.requireAuth, (req, res) => {
  res.render('nowa', common({ user: req.user, page: 'app', tab: 'nowa', nowaDone: D.getNowaDone(), flash: req.query.msg || null }));
});

// Handmatig een echte zaak aanmaken: klant = eigenaar; admin kan een klant (e-mail) opgeven
app.post('/app/nowa', Auth.requireAuth, async (req, res) => {
  const Rl = res.locals.t.app.sprawy.real;
  const isAdmin = req.user.role === 'admin';
  try {
    const clientEmail = isAdmin ? String(req.body.clientEmail || '').trim() : req.user.email;
    const owner = isAdmin ? (clientEmail ? Auth.findUser(clientEmail) : null) : req.user;
    const c = await Cases.create({
      ...req.body,
      clientCompany: isAdmin ? (req.body.clientCompany || '') : req.user.company,
      clientEmail,
    }, { user: req.user, source: 'panel', ownerUserId: owner ? owner.id : null });
    res.redirect('/app/sprawy?sel=' + encodeURIComponent(c.id) + '&msg=' + encodeURIComponent(Rl.created));
  } catch (e) {
    res.redirect('/app/nowa?msg=' + encodeURIComponent(Rl.errors[e.message] || e.message));
  }
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
  res.render('wykup', common({ user: req.user, page: 'app', tab: 'wykup', claims: Cases.visibleFor(req.user), done: D.getDone() }));
});

app.post('/app/wykup/:id/sprzedaj', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id, req.user);
  if (c) {
    D.setDone(c.id, 'sell');
    await db.insertEvent({ nip: c.nip, debtor: c.debtor, type: 'wykup', case_id: c.real ? c.id : null, title: 'Oferta wykupu przyjęta — ' + c.nr, source: 'panel klienta' }).catch(() => {});
  }
  res.redirect('/app/wykup');
});

// Oferta afwijzen: alleen als er nog geen definitieve actie is; windykacja loopt gewoon door
app.post('/app/wykup/:id/odrzuc', Auth.requireAuth, async (req, res) => {
  const c = caseById(req.params.id, req.user);
  const st = D.getDone()[req.params.id];
  if (c && (!st || st === 'decline')) {
    D.setDone(c.id, 'decline');
    await db.insertEvent({ nip: c.nip, debtor: c.debtor, type: 'wykup', case_id: c.real ? c.id : null, title: 'Oferta wykupu odrzucona przez klienta — ' + c.nr, source: 'panel klienta' }).catch(() => {});
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
  await Cases.init().catch((e) => console.error('Cases init:', e.message));
  await AiScore.init(D.claims).catch((e) => console.error('AIScore init:', e.message));
  app.listen(PORT, () => console.log('sprzedamfakture.pl draait op poort ' + PORT));
}
start();
