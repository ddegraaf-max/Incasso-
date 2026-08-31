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
const FORMA_LABELS = { spzoo: 'Sp. z o.o.', sa: 'S.A.', psa: 'P.S.A.', 'inna-op': 'inna osoba prawna / other legal entity' };

function configured() { return !!RESEND_KEY; }

// Herkent half geplakte/placeholder-configuratie vóórdat er iets crasht.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function configProblems() {
  const p = [];
  if (RESEND_KEY && !/^re_[A-Za-z0-9_-]{10,}$/.test(RESEND_KEY)) p.push('RESEND_API_KEY looks invalid (placeholder pasted?) — expected re_ followed by ~30+ characters');
  if (MAIL_NOTIFY && !EMAIL_RE.test(MAIL_NOTIFY)) p.push('MAIL_NOTIFY is not a valid e-mail address: "' + MAIL_NOTIFY + '"');
  if (!MAIL_FROM.includes('@')) p.push('MAIL_FROM has no e-mail address');
  return p;
}

function status() {
  return {
    resend: !!RESEND_KEY,
    from: MAIL_FROM,
    notify: MAIL_NOTIFY || null,
    liveComms: process.env.LIVE_COMMS === '1',
    problems: configProblems(),
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
  const problems = configProblems();
  if (problems.length) {
    console.error('[mail] configuratiefout:', problems.join(' | '));
    return { ok: false, status: 'błąd konfiguracji: ' + problems[0] };
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
function layout(bodyHtml, lang, preheader) {
  const en = lang === 'en';
  const mailto = '<a href="mailto:kontakt@sprzedamfakture.pl" style="color:#8a6415;text-decoration:none">kontakt@sprzedamfakture.pl</a>';
  const foot = en
    ? `sprzedamfakture.pl · ${mailto} · Legal basis: arts. 509–512 of the Polish Civil Code.`
    : `sprzedamfakture.pl · ${mailto} · Podstawa: art. 509–512 KC.`;
  const tagline = en ? 'Cash for your invoice in 24 h' : 'Gotówka za fakturę w 24 h';
  // preheader: onzichtbare previewtekst die mailclients naast het onderwerp tonen
  const pre = preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : '';
  return `<!doctype html><html lang="${lang}"><body style="margin:0;padding:0;background:#f6f4ef">
${pre}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f6f4ef" style="background:#f6f4ef"><tr><td align="center" style="padding:32px 12px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e0d3;border-radius:14px;overflow:hidden">
<tr><td bgcolor="#17233a" style="background:#17233a;padding:24px 32px 20px;border-radius:14px 14px 0 0">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#fdfcf8;letter-spacing:-.2px">sprzedam<b>fakture</b><span style="color:#d9b45e">.pl</span></div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#d9b45e;margin-top:6px">${tagline}</div>
</td></tr>
<tr><td height="4" bgcolor="#b8892d" style="height:4px;background:linear-gradient(90deg,#b8892d,#e6c56f);font-size:0;line-height:0"> </td></tr>
<tr><td style="padding:30px 32px 26px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#17233a">${bodyHtml}</td></tr>
<tr><td style="padding:16px 32px 20px;border-top:1px solid #eee9db;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8577;line-height:1.6">${foot}</td></tr>
</table>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#b5ae9d;padding:14px 0 6px">© 2026 sprzedamfakture.pl</div>
</td></tr></table></body></html>`;
}
function rows(pairs) {
  // [label, waarde] of [label, waarde, true] voor een goud gemarkeerde rij (bv. de oferta)
  const cells = pairs.map(([k, v, hl]) => hl
    ? `<tr bgcolor="#f7efdd"><td style="padding:11px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8a6415;font-weight:bold;white-space:nowrap">${esc(k)}</td><td align="right" style="padding:11px 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#17233a;font-weight:bold">${esc(v)}</td></tr>`
    : `<tr><td style="padding:9px 14px 9px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;white-space:nowrap;border-bottom:1px solid #f0ece0">${esc(k)}</td><td align="right" style="padding:9px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#17233a;font-weight:600;border-bottom:1px solid #f0ece0">${esc(v)}</td></tr>`
  ).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 20px">${cells}</table>`;
}
function button(href, label) {
  return `<a href="${esc(href)}" style="display:inline-block;background:#17233a;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:999px;font-size:14px">${esc(label)}</a>`;
}

// ── Teksten (PL/EN) ──────────────────────────────────────────────────────
const T = {
  pl: {
    confirmSubject: 'Dziękujemy — Twoja faktura jest w wycenie · sprzedamfakture.pl',
    confirmPre: 'Podsumowanie zgłoszenia i wstępna oferta — ostateczną ofertę wyślemy w ciągu kilku godzin roboczych.',
    confirmHi: (l) => `Dzień dobry,`,
    confirmIntro: 'dziękujemy za przesłanie faktury do wyceny. Oto podsumowanie zgłoszenia:',
    fields: { company: 'Twoja firma', nip: 'NIP dłużnika', forma: 'Forma prawna dłużnika', amount: 'Kwota faktury', days: 'Dni po terminie', email: 'E-mail', tel: 'Telefon', offer: 'Wstępna oferta', lang: 'Język' },
    confirmNext: 'Co dalej? Agent AI sprawdza dłużnika w KRZ, KRS i na białej liście MF. Ostateczną ofertę wyślemy w ciągu kilku godzin roboczych na ten adres. Wstępna wycena ma charakter orientacyjny i nie stanowi oferty w rozumieniu art. 66 KC.',
    confirmReply: 'Masz pytania? Wystarczy odpowiedzieć na tę wiadomość.',
    sign: 'Zespół sprzedamfakture.pl',
    notifySubject: (l, est) => `Nowy lead: ${l.company} · ${D.fmt(l.kwota)} · ${l.dni} dni · wstępnie ${est.pctLow}–${est.pct}%`,
    notifyIntro: 'Nowe zgłoszenie z formularza „Sprzedaj fakturę”:',
    notifyCta: 'Otwórz panel admina',
    wyrok: {
      confirmSubject: 'Dziękujemy — Twój wyrok jest w ocenie · sprzedamfakture.pl',
      confirmIntro: 'dziękujemy za zgłoszenie tytułu wykonawczego do wykupu. Podsumowanie zgłoszenia:',
      confirmNext: 'Co dalej? Sprawdzamy tytuł, bieg przedawnienia (w tym powód umorzenia poprzedniej egzekucji) i profil dłużnika. Ofertę — zazwyczaj 10–40% wartości nominalnej — wyślemy w ciągu kilku dni roboczych. Wycena nie stanowi oferty w rozumieniu art. 66 KC.',
      notifySubject: (l) => 'Nowe zgłoszenie skupu wyroku: ' + l.sygnatura + ' · ' + D.fmt(l.kwota),
      notifyIntro: 'Nowe zgłoszenie z formularza „Skup starych wyroków”:',
      notifyWarn: 'Uwaga przy wycenie: powód umorzenia decyduje o biegu przedawnienia (bezskuteczność = termin biegnie od nowa; bezczynność wierzyciela = przerwanie upada). Odsetki przedawniają się po 3 latach.',
      fields: { company: 'Zgłaszający', email: 'E-mail', tel: 'Telefon', sygnatura: 'Sygnatura akt', sad: 'Sąd', data: 'Data wyroku', amount: 'Kwota nominalna', dluznik: 'Dłużnik', nip: 'NIP dłużnika', forma: 'Forma prawna dłużnika', egzekucja: 'Wcześniejsza egzekucja', rok: 'Rok umorzenia', uwagi: 'Uwagi', lang: 'Język' },
    },
    welcomeSubject: 'Witamy w sprzedamfakture.pl — konto utworzone',
    welcomeBody: (u) => `<p>Dzień dobry,</p><p>konto dla firmy <strong>${esc(u.company || u.email)}</strong> zostało utworzone. Logowanie: <strong>${esc(u.email)}</strong>.</p><p>Dla bezpieczeństwa Twoich należności logowanie wymaga weryfikacji dwuetapowej (aplikacja typu Google Authenticator) — skonfigurujesz ją przy pierwszym logowaniu.</p>`,
    welcomeCta: 'Przejdź do panelu',
    testSubject: 'Test: sprzedamfakture.pl ↔ Resend działa',
    testBody: (info) => `<p>Ta wiadomość została wysłana z panelu admina sprzedamfakture.pl.</p>${rows([['Nadawca', info.from], ['Wersja', info.version], ['Czas', info.time]])}<p>Jeśli ją czytasz, Resend jest poprawnie skonfigurowany.</p>`,
  },
  en: {
    confirmSubject: 'Thank you — your invoice is being valued · sprzedamfakture.pl',
    confirmPre: 'Your request summary and preliminary offer — the final offer follows within a few business hours.',
    confirmHi: () => 'Hello,',
    confirmIntro: 'thank you for sending your invoice for a quote. Here is a summary of your request:',
    fields: { company: 'Your company', nip: "Debtor's NIP", forma: "Debtor's legal form", amount: 'Invoice amount', days: 'Days overdue', email: 'E-mail', tel: 'Phone', offer: 'Preliminary offer', lang: 'Language' },
    confirmNext: 'What happens next? The AI agent checks the debtor in KRZ, KRS and the MF VAT white list. We will e-mail the final offer to this address within a few business hours. The preliminary quote is indicative and does not constitute a binding offer (art. 66 Civil Code).',
    confirmReply: 'Questions? Just reply to this e-mail.',
    sign: 'The sprzedamfakture.pl team',
    notifySubject: (l, est) => `New lead: ${l.company} · ${D.fmt(l.kwota)} · ${l.dni} days · preliminary ${est.pctLow}–${est.pct}%`,
    notifyIntro: 'New request from the "Sell an invoice" form:',
    notifyCta: 'Open the admin panel',
    wyrok: {
      confirmSubject: 'Thank you — your judgment is being assessed · sprzedamfakture.pl',
      confirmIntro: 'thank you for submitting an enforceable title for purchase. Here is a summary of your submission:',
      confirmNext: 'What happens next? We check the title, the limitation status (including why the previous enforcement was discontinued) and the debtor profile. We will e-mail our offer — typically 10–40% of nominal value — within a few working days. The assessment does not constitute a binding offer (art. 66 Civil Code).',
      notifySubject: (l) => 'New old-judgment lead: ' + l.sygnatura + ' · ' + D.fmt(l.kwota),
      notifyIntro: 'New request from the "We buy old judgments" form:',
      notifyWarn: 'Assessment note: the reason for discontinuation drives the limitation period (fruitless = restarts; creditor inactivity = interruption lapses). Interest is time-barred after 3 years.',
      fields: { company: 'Submitted by', email: 'E-mail', tel: 'Phone', sygnatura: 'Case number', sad: 'Court', data: 'Judgment date', amount: 'Nominal amount', dluznik: 'Debtor', nip: "Debtor's NIP", forma: "Debtor's legal form", egzekucja: 'Previous enforcement', rok: 'Year discontinued', uwagi: 'Notes', lang: 'Language' },
    },
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
  const pairs = [
    [tx.fields.company, l.company], [tx.fields.nip, l.nip], [tx.fields.amount, D.fmt(l.kwota)], [tx.fields.days, String(l.dni)],
    [tx.fields.email, l.email], [tx.fields.tel, l.tel || '—'], [tx.fields.offer, offerTxt(est), true],
  ];
  if (l.forma) pairs.splice(2, 0, [tx.fields.forma, FORMA_LABELS[l.forma] || l.forma]);
  return pairs;
}
function textOf(pairs) { return pairs.map(([k, v]) => `${k}: ${v}`).join('\n'); }

// ── Skup wyroków: paren, bevestiging en notificatie ──────────────────────
const EGZ_LABELS = { none: 'nigdy nie prowadzona / never attempted', bezskutecznosc: 'umorzona — bezskuteczność', inna: 'umorzona — inny powód / other reason', nie_wiem: 'nie wiadomo / unknown' };
function wyrokPairs(l, tx) {
  const f = tx.wyrok.fields;
  return [
    [f.company, l.company], [f.sygnatura, l.sygnatura], [f.sad, l.sad || '—'], [f.data, l.data_wyroku || '—'],
    [f.amount, D.fmt(l.kwota)], [f.dluznik, l.dluznik], [f.nip, l.nip || '—'], [f.forma, FORMA_LABELS[l.forma] || l.forma || '—'],
    [f.egzekucja, EGZ_LABELS[l.egzekucja] || l.egzekucja || '—'], [f.rok, l.egzekucja_rok || '—'],
    [f.email, l.email], [f.tel, l.tel || '—'],
  ];
}
async function wyrokConfirm(lead, lang) {
  const L = lang === 'en' ? 'en' : 'pl';
  const tx = T[L];
  const pairs = wyrokPairs(lead, tx);
  const text = `${tx.confirmHi(lead)}\n\n${tx.wyrok.confirmIntro}\n\n${textOf(pairs)}\n\n${tx.wyrok.confirmNext}\n\n${tx.confirmReply}\n\n${tx.sign}`;
  const html = layout(`<p>${esc(tx.confirmHi(lead))}</p><p>${esc(tx.wyrok.confirmIntro)}</p>${rows(pairs)}<p>${esc(tx.wyrok.confirmNext)}</p><p>${esc(tx.confirmReply)}</p><p>${esc(tx.sign)}</p>`, L, tx.wyrok.confirmIntro);
  return send({ to: lead.email, subject: tx.wyrok.confirmSubject, text, html, replyTo: MAIL_NOTIFY || undefined });
}
async function wyrokNotify(lead, lang) {
  if (!MAIL_NOTIFY) return { ok: false, status: 'brak MAIL_NOTIFY' };
  const tx = T.pl; // interne notificatie in het Pools, met de taal van de indiener erbij
  const pairs = wyrokPairs(lead, tx).concat([[tx.wyrok.fields.lang, (lang || 'pl').toUpperCase()]]);
  if (lead.uwagi) pairs.push([tx.wyrok.fields.uwagi, lead.uwagi.slice(0, 500)]);
  const text = `${tx.wyrok.notifyIntro}\n\n${textOf(pairs)}\n\n${tx.wyrok.notifyWarn}\n\n${SITE}/admin`;
  const html = layout(`<p>${esc(tx.wyrok.notifyIntro)}</p>${rows(pairs)}<p style="font-size:13px;color:#6b7280">${esc(tx.wyrok.notifyWarn)}</p><p>${button(SITE + '/admin', tx.notifyCta)}</p>`, 'pl', tx.wyrok.notifyIntro);
  return send({ to: MAIL_NOTIFY, subject: tx.wyrok.notifySubject(lead), text, html, replyTo: lead.email });
}

// ── Bevestiging aan de klant (PL/EN) ─────────────────────────────────────
async function leadConfirm(lead, est, lang) {
  const L = lang === 'en' ? 'en' : 'pl';
  const tx = T[L];
  const pairs = leadPairs(lead, est, tx);
  const text = `${tx.confirmHi(lead)}\n\n${tx.confirmIntro}\n\n${textOf(pairs)}\n\n${tx.confirmNext}\n\n${tx.confirmReply}\n\n${tx.sign}`;
  const html = layout(`<p>${esc(tx.confirmHi(lead))}</p><p>${esc(tx.confirmIntro)}</p>${rows(pairs)}<p>${esc(tx.confirmNext)}</p><p>${esc(tx.confirmReply)}</p><p>${esc(tx.sign)}</p>`, L, tx.confirmPre);
  return send({ to: lead.email, subject: tx.confirmSubject, text, html, replyTo: MAIL_NOTIFY || undefined });
}

// ── Notificatie naar de eigenaar ─────────────────────────────────────────
async function leadNotify(lead, est, lang) {
  if (!MAIL_NOTIFY) return { ok: false, status: 'brak MAIL_NOTIFY' };
  const tx = T.pl; // interne notificatie: PL (taal van het product), met taal van de klant erbij
  const pairs = leadPairs(lead, est, tx).concat([[tx.fields.lang, (lang || 'pl').toUpperCase()]]);
  const subject = tx.notifySubject(lead, est);
  const text = `${tx.notifyIntro}\n\n${textOf(pairs)}\n\n${SITE}/admin`;
  const html = layout(`<p>${esc(tx.notifyIntro)}</p>${rows(pairs)}<p>${button(SITE + '/admin', tx.notifyCta)}</p>`, 'pl', tx.notifyIntro);
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

module.exports = { configured, status, send, leadConfirm, leadNotify, wyrokConfirm, wyrokNotify, welcome, testMail, MAIL_FROM, MAIL_NOTIFY };
