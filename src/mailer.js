// sprzedamfakture.pl — e-mail via Resend
// Formulier-mails (lead-notificatie + bevestiging), welkomstmail, testmail, en de
// verzendfunctie die comms.js gebruikt voor mails naar dłużnicy.
// Env: RESEND_API_KEY (zonder key: symulacja, alleen gelogd), MAIL_FROM (afzender op het
// geverifieerde domein), MAIL_NOTIFY (jouw inbox voor leads; fallback ADMIN_EMAIL), SITE_URL.
const D = require('./data');

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'sprzedamfakture.pl <kontakt@sprzedamfakture.pl>';
const MAIL_NOTIFY = process.env.MAIL_NOTIFY || process.env.ADMIN_EMAIL || '';
const SITE = (process.env.SITE_URL || 'https://sprzedamfakture.pl').replace(/\/$/, '');

function configured() { return !!RESEND_KEY; }

function status() {
  return {
    resend: !!RESEND_KEY,
    from: MAIL_FROM,
    notify: MAIL_NOTIFY || null,
    liveComms: process.env.LIVE_COMMS === '1',
    smsapi: !!process.env.SMSAPI_TOKEN,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  };
}

// ── Verzenden ────────────────────────────────────────────────────────────
// Resultaat: { ok, status, id?, simulated? } — status is een korte PL-tekst voor logs/UI
// ('wysłano', 'symulacja', 'błąd 403: …', 'błąd sieci', 'brak adresata').
async function send({ to, subject, text, html, replyTo, from }) {
  if (!to) return { ok: false, status: 'brak adresata' };
  const payload = { from: from || MAIL_FROM, to: Array.isArray(to) ? to : [to], subject, text };
  if (html) payload.html = html;
  if (replyTo) payload.reply_to = replyTo;
  if (!RESEND_KEY) {
    console.log(`[mail] symulacja → ${payload.to.join(', ')} | ${subject}`);
    return { ok: true, status: 'symulacja', simulated: true };
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, status: 'wysłano', id: j.id };
    const msg = j.message || j.error || ('HTTP ' + r.status);
    console.error(`[mail] Resend ${r.status}: ${msg}`);
    return { ok: false, status: `błąd ${r.status}: ${msg}` };
  } catch (e) {
    console.error('[mail] netwerkfout:', e.message);
    return { ok: false, status: 'błąd sieci' };
  }
}

// ── HTML-layout (eenvoudig, inline styles — werkt in elke mailclient) ────
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function layout(bodyHtml, lang) {
  const foot = lang === 'en'
    ? 'sprzedamfakture.pl · kontakt@sprzedamfakture.pl · Legal basis: arts. 509–512 of the Polish Civil Code.'
    : 'sprzedamfakture.pl · kontakt@sprzedamfakture.pl · Podstawa: art. 509–512 KC.';
  return `<!doctype html><html lang="${lang}"><body style="margin:0;background:#f6f4ef;font-family:Manrope,Segoe UI,Arial,sans-serif;color:#17233a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e5e0d3;border-radius:14px">
<tr><td style="padding:22px 28px;border-bottom:1px solid #e5e0d3"><span style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#17233a">sprzedam<b>fakture</b><span style="color:#a3781f">.pl</span></span>
<div style="font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#8a6415;margin-top:4px">${lang === 'en' ? 'Cash for your invoice in 24 h' : 'Gotówka za fakturę w 24 h'}</div></td></tr>
<tr><td style="padding:26px 28px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e5e0d3;font-size:12px;color:#6b7280">${foot}</td></tr>
</table></td></tr></table></body></html>`;
}
function rows(pairs) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0 18px">' +
    pairs.map(([k, v]) => `<tr><td style="padding:5px 18px 5px 0;color:#6b7280;white-space:nowrap">${esc(k)}</td><td style="padding:5px 0;font-weight:600">${esc(v)}</td></tr>`).join('') + '</table>';
}
function button(href, label) {
  return `<a href="${esc(href)}" style="display:inline-block;background:#17233a;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:999px;font-size:14px">${esc(label)}</a>`;
}

// ── Teksten (PL/EN) ──────────────────────────────────────────────────────
const T = {
  pl: {
    confirmSubject: 'Dziękujemy — Twoja faktura jest w wycenie · sprzedamfakture.pl',
    confirmHi: (l) => `Dzień dobry,`,
    confirmIntro: 'dziękujemy za przesłanie faktury do wyceny. Oto podsumowanie zgłoszenia:',
    fields: { company: 'Twoja firma', nip: 'NIP dłużnika', amount: 'Kwota faktury', days: 'Dni po terminie', email: 'E-mail', tel: 'Telefon', offer: 'Wstępna oferta', lang: 'Język' },
    confirmNext: 'Co dalej? Agent AI sprawdza dłużnika w KRZ, KRS i na białej liście MF. Ostateczną ofertę wyślemy w ciągu kilku godzin roboczych na ten adres. Wstępna wycena ma charakter orientacyjny i nie stanowi oferty w rozumieniu art. 66 KC.',
    confirmReply: 'Masz pytania? Wystarczy odpowiedzieć na tę wiadomość.',
    sign: 'Zespół sprzedamfakture.pl',
    notifySubject: (l, est) => `Nowy lead: ${l.company} · ${D.fmt(l.kwota)} · ${l.dni} dni · wstępnie ${est.pctLow}–${est.pct}%`,
    notifyIntro: 'Nowe zgłoszenie z formularza „Sprzedaj fakturę”:',
    notifyCta: 'Otwórz panel admina',
    welcomeSubject: 'Witamy w sprzedamfakture.pl — konto utworzone',
    welcomeBody: (u) => `<p>Dzień dobry,</p><p>konto dla firmy <strong>${esc(u.company || u.email)}</strong> zostało utworzone. Logowanie: <strong>${esc(u.email)}</strong>.</p><p>Dla bezpieczeństwa Twoich należności logowanie wymaga weryfikacji dwuetapowej (aplikacja typu Google Authenticator) — skonfigurujesz ją przy pierwszym logowaniu.</p>`,
    welcomeCta: 'Przejdź do panelu',
    testSubject: 'Test: sprzedamfakture.pl ↔ Resend działa',
    testBody: (info) => `<p>Ta wiadomość została wysłana z panelu admina sprzedamfakture.pl.</p>${rows([['Nadawca', info.from], ['Wersja', info.version], ['Czas', info.time]])}<p>Jeśli ją czytasz, Resend jest poprawnie skonfigurowany.</p>`,
  },
  en: {
    confirmSubject: 'Thank you — your invoice is being valued · sprzedamfakture.pl',
    confirmHi: () => 'Hello,',
    confirmIntro: 'thank you for sending your invoice for a quote. Here is a summary of your request:',
    fields: { company: 'Your company', nip: "Debtor's NIP", amount: 'Invoice amount', days: 'Days overdue', email: 'E-mail', tel: 'Phone', offer: 'Preliminary offer', lang: 'Language' },
    confirmNext: 'What happens next? The AI agent checks the debtor in KRZ, KRS and the MF VAT white list. We will e-mail the final offer to this address within a few business hours. The preliminary quote is indicative and does not constitute a binding offer (art. 66 Civil Code).',
    confirmReply: 'Questions? Just reply to this e-mail.',
    sign: 'The sprzedamfakture.pl team',
    notifySubject: (l, est) => `New lead: ${l.company} · ${D.fmt(l.kwota)} · ${l.dni} days · preliminary ${est.pctLow}–${est.pct}%`,
    notifyIntro: 'New request from the "Sell an invoice" form:',
    notifyCta: 'Open the admin panel',
    welcomeSubject: 'Welcome to sprzedamfakture.pl — account created',
    welcomeBody: (u) => `<p>Hello,</p><p>the account for <strong>${esc(u.company || u.email)}</strong> has been created. Login: <strong>${esc(u.email)}</strong>.</p><p>To protect your receivables, logging in requires two-factor verification (an app such as Google Authenticator) — you will set it up at your first login.</p>`,
    welcomeCta: 'Go to the panel',
    testSubject: 'Test: sprzedamfakture.pl ↔ Resend works',
    testBody: (info) => `<p>This message was sent from the sprzedamfakture.pl admin panel.</p>${rows([['From', info.from], ['Version', info.version], ['Time', info.time]])}<p>If you can read this, Resend is configured correctly.</p>`,
  },
};

function offerTxt(est) {
  return `${D.fmt(est.amountLow)} – ${D.fmt(est.amount)} (${est.pctLow}–${est.pct}%)`;
}
function leadPairs(l, est, tx) {
  return [
    [tx.fields.company, l.company], [tx.fields.nip, l.nip], [tx.fields.amount, D.fmt(l.kwota)], [tx.fields.days, String(l.dni)],
    [tx.fields.email, l.email], [tx.fields.tel, l.tel || '—'], [tx.fields.offer, offerTxt(est)],
  ];
}
function textOf(pairs) { return pairs.map(([k, v]) => `${k}: ${v}`).join('\n'); }

// ── Bevestiging aan de klant (PL/EN) ─────────────────────────────────────
async function leadConfirm(lead, est, lang) {
  const L = lang === 'en' ? 'en' : 'pl';
  const tx = T[L];
  const pairs = leadPairs(lead, est, tx);
  const text = `${tx.confirmHi(lead)}\n\n${tx.confirmIntro}\n\n${textOf(pairs)}\n\n${tx.confirmNext}\n\n${tx.confirmReply}\n\n${tx.sign}`;
  const html = layout(`<p>${esc(tx.confirmHi(lead))}</p><p>${esc(tx.confirmIntro)}</p>${rows(pairs)}<p>${esc(tx.confirmNext)}</p><p>${esc(tx.confirmReply)}</p><p>${esc(tx.sign)}</p>`, L);
  return send({ to: lead.email, subject: tx.confirmSubject, text, html, replyTo: MAIL_NOTIFY || undefined });
}

// ── Notificatie naar de eigenaar ─────────────────────────────────────────
async function leadNotify(lead, est, lang) {
  if (!MAIL_NOTIFY) return { ok: false, status: 'brak MAIL_NOTIFY' };
  const tx = T.pl; // interne notificatie: PL (taal van het product), met taal van de klant erbij
  const pairs = leadPairs(lead, est, tx).concat([[tx.fields.lang, (lang || 'pl').toUpperCase()]]);
  const subject = tx.notifySubject(lead, est);
  const text = `${tx.notifyIntro}\n\n${textOf(pairs)}\n\n${SITE}/admin`;
  const html = layout(`<p>${esc(tx.notifyIntro)}</p>${rows(pairs)}<p>${button(SITE + '/admin', tx.notifyCta)}</p>`, 'pl');
  return send({ to: MAIL_NOTIFY, subject, text, html, replyTo: lead.email });
}

// ── Welkomstmail bij registratie ─────────────────────────────────────────
async function welcome(user, lang) {
  const L = lang === 'en' ? 'en' : 'pl';
  const tx = T[L];
  const html = layout(`${tx.welcomeBody(user)}<p>${button(SITE + '/login', tx.welcomeCta)}</p><p>${esc(tx.sign)}</p>`, L);
  const text = tx.welcomeBody(user).replace(/<[^>]+>/g, '') + `\n\n${SITE}/login\n\n${tx.sign}`;
  return send({ to: user.email, subject: tx.welcomeSubject, text, html, replyTo: MAIL_NOTIFY || undefined });
}

// ── Testmail vanuit admin ────────────────────────────────────────────────
async function testMail(lang, version) {
  if (!MAIL_NOTIFY) return { ok: false, status: 'brak MAIL_NOTIFY', to: null };
  const L = lang === 'en' ? 'en' : 'pl';
  const tx = T[L];
  const info = { from: MAIL_FROM, version: 'v' + (version || '?'), time: new Date().toISOString() };
  const r = await send({ to: MAIL_NOTIFY, subject: tx.testSubject, text: tx.testBody(info).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), html: layout(tx.testBody(info), L) });
  return { ...r, to: MAIL_NOTIFY };
}

module.exports = { configured, status, send, leadConfirm, leadNotify, welcome, testMail, MAIL_FROM, MAIL_NOTIFY };
