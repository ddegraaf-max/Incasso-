// sprzedamfakture.pl — Wezwanie online: bezpłatna, brandowana sommatie met eigen link
//
// Origineel aan dit product: het wezwanie is geen statisch PDF maar een "levende" pagina /w/<token>:
//   - de rente loopt dagelijks op (kwota × 14% × dni ÷ 365) en de dłużnik ziet altijd het bedrag van vandaag,
//   - de dłużnik reageert met één klik (zapłacone / obietnica zapłaty met datum / spór) — de wierzyciel
//     krijgt direct een mail; elke reactie is een schriftelijk spoor (uznanie długu bij obietnica),
//   - de wierzyciel ziet wanneer het wezwanie is geopend — via zijn eigen link /w/<token>?k=<sleutel>
//     (podgląd wierzyciela); zijn eigen bezoeken en bots/linkscanners tellen niet als "geopend",
//   - elke weergave en elke reactie komt met IP en user-agent in de bewijslog (tabel demand_log),
//   - de printversie draagt een QR-code naar dezelfde pagina,
//   - de dłużnik wordt bij het aanmaken gecontroleerd in MF biała lista + KRS (gratis extra voor de wierzyciel),
//   - e-mailverificatie: het wezwanie is pas actief (pagina zichtbaar, mail naar de dłużnik) nadat de wierzyciel
//     via de link in zijn eigen mailbox heeft bevestigd (/w/<token>/potwierdz?k=<sleutel>, knop = POST);
//     wie na 24 uur nog niet heeft bevestigd krijgt één herinnering (remindUnconfirmed, elk uur vanuit server.js).
// Elk aangemaakt wezwanie wordt ook een lead (bron 'wezwanie') in /admin/leady — de funnel naar skup faktur.
const crypto = require('crypto');
const db = require('./db');
const D = require('./data');
const Research = require('./research');
const Mailer = require('./mailer');
const AiScore = require('./aiscore');
const Company = require('./company');

const SITE = (process.env.SITE_URL || 'https://sprzedamfakture.pl').replace(/\/$/, '');
const FROM_EMAIL = process.env.FROM_EMAIL || 'windykacja@sprzedamfakture.pl';
const DAY_MS = 86400000;
const CONFIRM_DAYS = 7; // geldigheid van de bevestigingslink
const RESEND_MAX = 3;   // zo vaak kan de bevestigingsmail per wezwanie opnieuw worden gestuurd
const PURGE_DAYS = 30;  // onbevestigde wezwania worden na zoveel dagen verwijderd
const REMIND_AFTER_H = 24; // na zoveel uur zonder bevestiging krijgt de wierzyciel één herinnering
const REMIND = process.env.DEMAND_REMIND !== '0';
// Stand van de e-mailverificatie in de notitie van de lead
const LEAD_WAIT = 'e-mail: czeka na potwierdzenie', LEAD_OK = 'e-mail: potwierdzony', LEAD_GONE = 'e-mail: niepotwierdzony — wezwanie usunięte';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STATUSES = ['wyslane', 'otwarte', 'obietnica', 'zaplacone', 'spor'];
const ANSWERED = ['obietnica', 'zaplacone', 'spor'];
// Linkscanners van mailservers, previews van chat-apps en scripts: geen bewijs dat de dłużnik heeft gekeken
const BOT_RE = /bot|crawl|spider|slurp|preview|scan|fetch|monitor|headless|curl|wget|python|java\/|go-http|okhttp|axios|facebookexternalhit|whatsapp|telegram|skype|safelinks|proofpoint|mimecast|barracuda/i;

function newToken() {
  return crypto.randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 11) || crypto.randomBytes(6).toString('hex');
}
function newKey() { return crypto.randomBytes(16).toString('base64url'); }

function isoDate(d) { const x = d instanceof Date ? d : new Date(d); return Number.isNaN(x.getTime()) ? null : x.toISOString().slice(0, 10); }
// Bestaande kalenderdag in de vorm JJJJ-MM-DD (2026-02-31 valt af)
function isDay(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && isoDate(s) === s; }
// Tijdstip voor mails en de podgląd wierzyciela: JJJJ-MM-DD UU:MM, Poolse tijd
function fmtTs(d) { const x = d instanceof Date ? d : new Date(d); return Number.isNaN(x.getTime()) ? '' : x.toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).slice(0, 16); }
function daysOverdue(due) {
  if (!due) return 0;
  const d = new Date(due); d.setHours(0, 0, 0, 0);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((t - d) / DAY_MS));
}

// Bedragen van vandaag + termijn (7 dagen na bevestiging door de wierzyciel) + publieke URL
function compute(d) {
  const amount = Number(d.amount) || 0;
  const days = daysOverdue(d.due_date);
  const odsetki = D.interestExact(amount, days);
  const rekomp = D.rekompZl(amount);
  const created = new Date(d.confirmed_at || d.created_at || Date.now());
  const deadline = new Date(created.getTime() + 7 * DAY_MS);
  return {
    amount, days, odsetki, rekomp, total: Math.round((amount + odsetki + rekomp) * 100) / 100,
    deadline: isoDate(deadline), issued: isoDate(created), url: SITE + '/w/' + d.token, printUrl: SITE + '/w/' + d.token + '/druk',
    creditorUrl: d.creditor_key ? SITE + '/w/' + d.token + '?k=' + d.creditor_key : null,
    confirmUrl: d.creditor_key ? SITE + '/w/' + d.token + '/potwierdz?k=' + d.creditor_key : null,
    rate: Math.round(D.INTEREST_RATE * 100),
  };
}

// Formulier → rij; gooit Error met i18n-sleutel bij ongeldige invoer
function toRow(b, lang) {
  const s = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const row = {
    lang: lang === 'en' ? 'en' : 'pl',
    creditor_company: s(b.creditor_company, 200), creditor_nip: s(b.creditor_nip, 20).replace(/\D/g, ''), creditor_email: s(b.creditor_email, 200).toLowerCase(),
    debtor_company: s(b.debtor_company, 200), debtor_nip: s(b.debtor_nip, 20).replace(/\D/g, ''), debtor_email: s(b.debtor_email, 200).toLowerCase(),
    invoice_nr: s(b.invoice_nr, 60), amount: parseFloat(s(b.amount, 20).replace(/\s/g, '').replace(',', '.')), due_date: s(b.due_date, 10), iban: s(b.iban, 40).replace(/\s/g, '').toUpperCase(),
  };
  const errors = {};
  if (!row.creditor_company) errors.creditor_company = 'dCreditor';
  if (!EMAIL_RE.test(row.creditor_email)) errors.creditor_email = 'dEmail';
  if (row.creditor_nip && row.creditor_nip.length !== 10) errors.creditor_nip = 'dNip';
  if (!row.debtor_company) errors.debtor_company = 'dDebtor';
  if (row.debtor_nip && row.debtor_nip.length !== 10) errors.debtor_nip = 'dNip';
  if (row.debtor_email && !EMAIL_RE.test(row.debtor_email)) errors.debtor_email = 'dDebtorEmail';
  if (!row.invoice_nr) errors.invoice_nr = 'dNr';
  if (!(row.amount > 0) || row.amount > 1e9) errors.amount = 'dAmount';
  if (!isDay(row.due_date) || new Date(row.due_date) > new Date()) errors.due_date = 'dDue';
  if (row.iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(row.iban)) errors.iban = 'dIban';
  return { row, errors };
}

// meta = { ip, ua } van de aanmaker: het IP herkent later zijn eigen bezoeken, beide gaan in de bewijslog
async function create(body, lang, meta = {}) {
  const { row, errors } = toRow(body, lang);
  if (Object.keys(errors).length) return { errors, row };
  // gratis registercheck van de dłużnik (best effort, snel)
  let facts = null;
  if (row.debtor_nip) {
    const mf = await Research.mfLookup(row.debtor_nip).catch(() => null);
    const krs = mf && mf.found && mf.krs ? await Research.krsLookup(mf.krs).catch(() => null) : null;
    facts = { mf, krs };
    if (!row.debtor_email && krs && krs.found && krs.email) row.debtor_email_krs = krs.email; // suggestie, niet automatisch gebruikt
  }
  let saved = null;
  for (let i = 0; i < 3 && !saved; i++) {
    try { saved = await db.insertDemand({ ...row, token: newToken(), creditor_key: newKey(), creator_ip: meta.ip || null, status: 'wyslane', facts }); }
    catch (e) { if (!/duplicate|unique/i.test(e.message) || i === 2) throw e; }
  }
  await log(saved, 'created', meta, 'creditor');
  return { demand: saved, facts };
}

async function byToken(token) {
  const t = String(token || '').replace(/[^A-Za-z0-9]/g, '');
  if (!t) return null;
  return db.getDemandByToken(t);
}

function isAnswered(d) { return ANSWERED.includes(d.status); }
function isConfirmed(d) { return !!d.confirmed_at; }
function confirmExpired(d) { return !d.confirmed_at && Date.now() - new Date(d.created_at).getTime() > CONFIRM_DAYS * DAY_MS; }

// Bevestiging door de wierzyciel (klik op de knop na de link uit zijn mail). true = deze klik heeft bevestigd;
// false = was al bevestigd (dubbel klikken) — dan vertrekken de mails niet nog een keer.
async function confirm(d, meta = {}) {
  if (!(await db.confirmDemand(d.id, meta.ip))) return false;
  d.confirmed_at = new Date(); d.confirm_ip = meta.ip || null;
  await log(d, 'confirmed', meta, 'creditor');
  return true;
}

// Is dit de wierzyciel? Alleen met de sleutel uit zijn bevestigingsmail (/w/<token>?k=<sleutel>)
function isCreditor(d, key) {
  const a = Buffer.from(String(d.creditor_key || '')), b = Buffer.from(typeof key === 'string' ? key : '');
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Wie kijkt er? creditor (sleutel, of hetzelfde IP als bij het aanmaken of bevestigen) · bot · debtor
function actorOf(d, meta, key) {
  if (isCreditor(d, key)) return 'creditor';
  if (meta.ip && (meta.ip === d.creator_ip || meta.ip === d.confirm_ip)) return 'creditor';
  if (meta.head || !meta.ua || BOT_RE.test(meta.ua)) return 'bot';
  return 'debtor';
}

// Regel in de bewijslog (tabel demand_log); het voorbeeld (id 0) wordt niet gelogd
async function log(d, type, meta = {}, actor, data) {
  if (!d || !d.id) return;
  await db.logDemand(d.id, { type, actor, ip: meta.ip, user_agent: meta.ua, data }).catch((e) => console.error('Wezwanie: log mislukt —', e.message));
}

// Weergave vastleggen (type: open | print | attachment). Alleen een weergave van de brief door de dłużnik
// zet de status op 'otwarte' — de wierzyciel zelf en bots/linkscanners tellen niet mee.
async function markOpened(d, meta = {}, key, type = 'open') {
  const actor = actorOf(d, meta, key);
  await log(d, type, meta, actor);
  if (type !== 'open' || actor !== 'debtor' || d.opened_at) return actor;
  d.opened_at = new Date();
  if (d.status === 'wyslane') d.status = 'otwarte';
  await db.updateDemand(d.id, { opened_at: d.opened_at, status: d.status }).catch(() => {});
  return actor;
}

// Reactie van de dłużnik: paid (datum van de overboeking, optioneel) | promise (datum) | dispute (toelichting).
// Eén reactie per wezwanie: de eerste telt en wordt nooit overschreven; elke poging komt in de bewijslog.
async function respond(d, { action, date, note }, meta = {}) {
  const map = { paid: 'zaplacone', promise: 'obietnica', dispute: 'spor' };
  const status = map[action];
  const day = String(date || '').trim().slice(0, 10);
  const n = String(note || '').trim().slice(0, 1000);
  const entry = { action: String(action || '').slice(0, 20), date: day || null, note: n || null };
  if (isAnswered(d)) { await log(d, 'response_rejected', meta, 'debtor', entry); throw new Error('rDone'); }
  if (!status) throw new Error('rBad');
  if (action === 'promise' && (!isDay(day) || day < isoDate(Date.now() - DAY_MS))) throw new Error('rDate');
  if (action === 'paid' && day && (!isDay(day) || day > isoDate(Date.now() + DAY_MS))) throw new Error('rPaidDate');
  if (action === 'dispute' && !n) throw new Error('rNote');
  const fields = { status, promised_date: action === 'promise' ? day : null, paid_date: action === 'paid' && day ? day : null, response_note: n || null, responded_at: new Date() };
  if (!(await db.answerDemand(d.id, fields))) { await log(d, 'response_rejected', meta, 'debtor', entry); throw new Error('rDone'); }
  Object.assign(d, fields);
  await log(d, 'response', meta, 'debtor', { ...entry, status });
  return d;
}

// Voor de podgląd wierzyciela: hoe vaak de dłużnik keek en wat hij antwoordde (zonder IP's)
async function history(d) {
  const rows = await db.listDemandLog(d.id, 500).catch(() => []);
  const opens = rows.filter((r) => r.type === 'open' && r.actor === 'debtor');
  return {
    opens: opens.length,
    firstOpen: d.opened_at || (opens[0] && opens[0].created_at) || null,
    lastOpen: opens.length ? opens[opens.length - 1].created_at : null,
    responses: rows.filter((r) => r.type === 'response').map((r) => ({ at: r.created_at, ...(r.data || {}) })),
  };
}

// ── Mails ────────────────────────────────────────────────────────────────
function factsSummary(facts) {
  if (!facts) return null;
  const mf = facts.mf, krs = facts.krs;
  if (!mf) return null;
  if (!mf.found) return 'NIP ' + mf.nip + ': brak na białej liście VAT';
  const parts = [mf.name, 'VAT: ' + (mf.statusVat || '—')];
  if (krs && krs.found) { parts.push(krs.form || 'KRS ' + krs.krs); if (krs.flags && krs.flags.length) parts.push('UWAGA: ' + krs.flags.join(', ')); }
  return parts.join(' · ');
}

// Tekst van de mail aan de dłużnik (ook gebruikt door de voorbeeldpagina)
function debtorMailText(d, c, file) {
  return `Szanowni Państwo,

działając w imieniu wierzyciela ${d.creditor_company}, wzywamy do zapłaty należności z faktury ${d.invoice_nr}, której termin płatności (${d.due_date}) minął ${c.days} dni temu.

Należność główna: ${D.fmtN(c.amount)} zł
Odsetki ustawowe za opóźnienie w transakcjach handlowych (${c.rate}% rocznie, na dziś): ${D.fmtN(c.odsetki)} zł
Rekompensata za koszty odzyskiwania należności (art. 10 ustawy z 8.03.2013 r.): ${D.fmtN(c.rekomp)} zł
Razem na dziś: ${D.fmtN(c.total)} zł${d.iban ? '\nRachunek do zapłaty: ' + d.iban : ''}

${file ? 'W załączeniu kopia faktury (' + (file.filename || 'faktura') + ') — dostępna też pod adresem ' + c.url + '/zalacznik\n\n' : ''}Termin zapłaty: ${c.deadline}. Odsetki naliczane są dalej do dnia zapłaty — aktualną kwotę oraz możliwość potwierdzenia zapłaty, zadeklarowania terminu albo zgłoszenia zastrzeżeń znajdą Państwo pod adresem:
${c.url}

Brak zapłaty w terminie może skutkować skierowaniem sprawy do windykacji, zgłoszeniem do biura informacji gospodarczej oraz na drogę sądową — na koszt dłużnika.

sprzedamfakture.pl — wezwanie wygenerowane na zlecenie wierzyciela
Odpowiedzi prosimy kierować bezpośrednio do wierzyciela (odpowiedz na tę wiadomość) lub przez stronę wezwania.

Informacja RODO (art. 14): administratorem danych jest ${Company.C.name}, ${[Company.C.street, Company.C.city].filter(Boolean).join(', ')} (${Company.C.email}). Dane Państwa firmy (nazwa, NIP, adres e-mail, dane faktury) przekazał wierzyciel ${d.creditor_company}; uzupełniamy je danymi z białej listy VAT i KRS. Cel: przekazanie wezwania w imieniu wierzyciela i dowód doręczenia (prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO). Przysługuje Państwu prawo dostępu, sprostowania, ograniczenia, sprzeciwu oraz skargi do Prezesa UODO. Szczegóły i okres przechowywania: ${SITE}/polityka-prywatnosci`;
}
function debtorMailSubject(d) { return `Wezwanie do zapłaty — faktura ${d.invoice_nr} (${d.creditor_company})`; }

async function mailDebtor(d, c, file) {
  if (!d.debtor_email) return { ok: false, status: 'brak adresata' };
  const attachments = file && file.data ? [{ filename: file.filename || 'faktura.pdf', content: Buffer.from(file.data).toString('base64') }] : undefined;
  return Mailer.sendPlain({ from: 'sprzedamfakture.pl <' + FROM_EMAIL + '>', to: d.debtor_email, replyTo: d.creditor_email, subject: debtorMailSubject(d), text: debtorMailText(d, c, file), lang: 'pl', attachments });
}

// Eerste mail aan de wierzyciel: bevestig je adres — pas daarna wordt het wezwanie actief en verstuurd
function confirmMailText(d, c) {
  const en = d.lang === 'en';
  return en
    ? `Confirm your demand for payment.

Invoice ${d.invoice_nr} · debtor ${d.debtor_company} · ${D.fmtN(c.amount)} zł (+ interest ${D.fmtN(c.odsetki)} zł and recovery fee ${D.fmtN(c.rekomp)} zł as of today)
${d.debtor_email ? 'After you confirm, we send the demand to the debtor: ' + d.debtor_email : 'No debtor e-mail was given — after you confirm, you get the link to send yourself.'}

Confirm here: ${c.confirmUrl}

The demand is activated${d.debtor_email ? ' and sent to the debtor' : ''} only after you confirm. The link is valid for ${CONFIRM_DAYS} days.

Not you? Someone entered this address in the form on sprzedamfakture.pl — ignore this message and nothing will be sent.

sprzedamfakture.pl — ${Company.C.name}`
    : `Potwierdź swoje wezwanie do zapłaty.

Faktura ${d.invoice_nr} · dłużnik ${d.debtor_company} · ${D.fmtN(c.amount)} zł (+ odsetki ${D.fmtN(c.odsetki)} zł i rekompensata ${D.fmtN(c.rekomp)} zł na dziś)
${d.debtor_email ? 'Po potwierdzeniu wyślemy wezwanie do dłużnika na adres: ' + d.debtor_email : 'Nie podano adresu e-mail dłużnika — po potwierdzeniu otrzymasz link do samodzielnego przesłania.'}

Potwierdź tutaj: ${c.confirmUrl}

Wezwanie zostanie aktywowane${d.debtor_email ? ' i wysłane do dłużnika' : ''} dopiero po potwierdzeniu. Link jest ważny ${CONFIRM_DAYS} dni.

To nie Ty? Ktoś podał ten adres w formularzu na sprzedamfakture.pl — zignoruj tę wiadomość, a nic nie zostanie wysłane.

sprzedamfakture.pl — ${Company.C.name}`;
}
function confirmMailSubject(d) { return d.lang === 'en' ? `Confirm your demand — invoice ${d.invoice_nr}` : `Potwierdź wezwanie do zapłaty — faktura ${d.invoice_nr}`; }

async function mailConfirm(d, c) {
  return Mailer.sendPlain({ to: d.creditor_email, subject: confirmMailSubject(d), text: confirmMailText(d, c), lang: d.lang });
}

// Bevestigingsmail opnieuw sturen (knop op de wachtpagina) — hooguit RESEND_MAX keer per wezwanie,
// geteld in de bewijslog zodat de grens een herstart overleeft.
async function resendConfirm(d, meta = {}) {
  const rows = await db.listDemandLog(d.id, 500).catch(() => []);
  if (rows.filter((r) => r.type === 'confirm_resent').length >= RESEND_MAX) return { ok: false, limit: true };
  const r = await mailConfirm(d, compute(d));
  if (r.ok) await log(d, 'confirm_resent', meta, 'creditor');
  return r;
}

// Herinnering aan de wierzyciel: REMIND_AFTER_H uur na het aanmaken nog niet bevestigd → één keer een mail met dezelfde
// bevestigingslink, zolang die geldig is (CONFIRM_DAYS). Geteld in de bewijslog (confirm_reminded, actor 'system'); dubbel
// ingediende wezwania (zelfde e-mail + factuurnummer) krijgen samen één herinnering. Alleen overdag (Poolse tijd 7–21 u),
// de uurlijkse tick haalt de rest later in. DEMAND_REMIND=0 zet het uit.
function remindMailText(d, c) {
  const en = d.lang === 'en';
  const until = isoDate(new Date(new Date(d.created_at).getTime() + CONFIRM_DAYS * DAY_MS));
  return en
    ? `Your demand for payment is still waiting for confirmation.

Invoice ${d.invoice_nr} · debtor ${d.debtor_company} · ${D.fmtN(c.amount)} zł (+ interest ${D.fmtN(c.odsetki)} zł and recovery fee ${D.fmtN(c.rekomp)} zł as of today)

You filled in the form on sprzedamfakture.pl on ${fmtTs(d.created_at)} (Polish time), but the demand has not been confirmed yet — so it is not active${d.debtor_email ? ' and has not been sent to the debtor' : ''}.

Confirm here: ${c.confirmUrl}
The link is valid until ${until}. After that it expires and you would have to fill in the form again.

Would you rather have us handle this invoice (purchase or collection)? Simply reply to this e-mail.

Not you? Someone entered this address in the form — ignore this message and nothing will be sent.

sprzedamfakture.pl — ${Company.C.name}`
    : `Twoje wezwanie do zapłaty wciąż czeka na potwierdzenie.

Faktura ${d.invoice_nr} · dłużnik ${d.debtor_company} · ${D.fmtN(c.amount)} zł (+ odsetki ${D.fmtN(c.odsetki)} zł i rekompensata ${D.fmtN(c.rekomp)} zł na dziś)

Formularz na sprzedamfakture.pl wypełniono ${fmtTs(d.created_at)}, ale wezwanie nie zostało jeszcze potwierdzone — nie jest więc aktywne${d.debtor_email ? ' i nie trafiło do dłużnika' : ''}.

Potwierdź tutaj: ${c.confirmUrl}
Link jest ważny do ${until}. Potem wygaśnie i trzeba będzie wypełnić formularz ponownie.

Wolisz, żebyśmy zajęli się tą fakturą (skup albo windykacja)? Po prostu odpowiedz na tę wiadomość.

To nie Ty? Ktoś podał ten adres w formularzu — zignoruj tę wiadomość, a nic nie zostanie wysłane.

sprzedamfakture.pl — ${Company.C.name}`;
}
function remindMailSubject(d) { return d.lang === 'en' ? `Reminder: confirm your demand — invoice ${d.invoice_nr}` : `Przypomnienie: potwierdź wezwanie do zapłaty — faktura ${d.invoice_nr}`; }
async function mailRemind(d, c) {
  return Mailer.sendPlain({ to: d.creditor_email, subject: remindMailSubject(d), text: remindMailText(d, c), lang: d.lang });
}
function warsawHour() { return Number(new Date().toLocaleString('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', hour12: false })) % 24; }
async function remindUnconfirmed() {
  if (!REMIND) return 0;
  const h = warsawHour();
  if (h < 7 || h >= 21) return 0;
  const now = Date.now();
  const rows = await db.listUnreminded(new Date(now - CONFIRM_DAYS * DAY_MS), new Date(now - REMIND_AFTER_H * 3600000));
  let n = 0;
  const sent = new Map(); // e-mail|factuur → id van het wezwanie waarvoor de herinnering is gegaan
  for (const d of rows) {
    if (!EMAIL_RE.test(d.creditor_email || '')) continue;
    const dup = (d.creditor_email + '|' + d.invoice_nr).toLowerCase();
    if (!sent.has(dup)) {
      const r = await mailRemind(d, compute(d)).catch((e) => ({ ok: false, status: 'błąd: ' + e.message }));
      if (!r.ok) { console.error('Wezwanie: herinnering aan ' + d.creditor_email + ' mislukt — ' + r.status); continue; }
      if (r.simulated) console.log('[wezwanie] herinnering in simulatie — bevestigingslink: ' + compute(d).confirmUrl);
      sent.set(dup, d.id); n++;
    }
    await log(d, 'confirm_reminded', {}, 'system', sent.get(dup) === d.id ? null : { via: sent.get(dup) });
  }
  return n;
}

// Opruimen: onbevestigde wezwania ouder dan PURGE_DAYS verdwijnen met hun log (de link was na CONFIRM_DAYS
// al verlopen). De lead blijft; zijn notitie zegt dat het wezwanie is verwijderd.
async function purgeUnconfirmed() {
  const gone = await db.purgeUnconfirmedDemands(new Date(Date.now() - PURGE_DAYS * DAY_MS));
  for (const g of gone) {
    if (!g.lead_id) continue;
    const lead = await db.getLead(g.lead_id).catch(() => null);
    if (lead && lead.note) await db.setLeadNote(lead.id, String(lead.note).replace(LEAD_WAIT, LEAD_GONE)).catch(() => {});
  }
  return gone.length;
}

function creditorMailText(d, c, facts) {
  const en = d.lang === 'en';
  const fs = factsSummary(facts);
  return en
    ? `Your free online demand for payment is ready.

Invoice ${d.invoice_nr} · debtor ${d.debtor_company} · ${D.fmtN(c.amount)} zł (+ interest ${D.fmtN(c.odsetki)} zł and recovery fee ${D.fmtN(c.rekomp)} zł as of today)

Link to the demand (send it to the debtor, or we already did if you gave an e-mail): ${c.url}
Printable version with QR code: ${c.printUrl}
${c.creditorUrl ? 'Your creditor view — status, opens and the debtor\'s reply (do not forward this link): ' + c.creditorUrl + '\n' : ''}${fs ? '\nDebtor register check: ' + fs + '\n' : ''}
The amount updates daily. When the debtor confirms payment, promises a date or disputes the invoice, you will receive an e-mail. You can check the status any time ${c.creditorUrl ? 'in your creditor view' : 'via the link'}.

Not paid within 7 days? Sell the invoice and have cash within 24 hours: ${SITE}/?lang=en#wycena

sprzedamfakture.pl — ${Company.C.name}`
    : `Twoje bezpłatne wezwanie online jest gotowe.

Faktura ${d.invoice_nr} · dłużnik ${d.debtor_company} · ${D.fmtN(c.amount)} zł (+ odsetki ${D.fmtN(c.odsetki)} zł i rekompensata ${D.fmtN(c.rekomp)} zł na dziś)

Link do wezwania (prześlij dłużnikowi — jeśli podałeś jego e-mail, już to zrobiliśmy): ${c.url}
Wersja do druku z kodem QR: ${c.printUrl}
${c.creditorUrl ? 'Twój podgląd wierzyciela — status, otwarcia i odpowiedź dłużnika (nie przekazuj tego linku dalej): ' + c.creditorUrl + '\n' : ''}${fs ? '\nWeryfikacja dłużnika w rejestrach: ' + fs + '\n' : ''}
Kwota aktualizuje się codziennie. Gdy dłużnik potwierdzi zapłatę, zadeklaruje termin albo zgłosi zastrzeżenia, otrzymasz e-mail. Status sprawdzisz w każdej chwili ${c.creditorUrl ? 'w podglądzie wierzyciela' : 'pod linkiem'}.

Brak zapłaty w 7 dni? Sprzedaj fakturę i miej gotówkę w 24 godziny: ${SITE}/#wycena

sprzedamfakture.pl — ${Company.C.name}`;
}
function creditorMailSubject(d) { return d.lang === 'en' ? `Your online demand for invoice ${d.invoice_nr} is ready` : `Twoje wezwanie online — faktura ${d.invoice_nr}`; }

async function mailCreditor(d, c, facts) {
  return Mailer.sendPlain({ to: d.creditor_email, subject: creditorMailSubject(d), text: creditorMailText(d, c, facts), lang: d.lang });
}

// Voorbeeld voor /wezwanie-online/przyklad: fictieve partijen, realistische bedragen, 44 dagen te laat
function sample(lang) {
  const created = new Date();
  const due = new Date(created.getTime() - 44 * DAY_MS);
  const d = {
    id: 0, token: 'PRZYKLAD', lang: lang === 'en' ? 'en' : 'pl',
    creditor_company: 'Twoja Firma Sp. z o.o.', creditor_nip: '5213456789', creditor_email: 'faktury@twojafirma.pl',
    debtor_company: 'Przykładowy Dłużnik Sp. z o.o.', debtor_nip: '7740001454', debtor_email: 'ksiegowosc@dluznik.pl',
    invoice_nr: 'FV 2026/06/089', amount: 12400, due_date: isoDate(due), iban: 'PL61109010140000071219812874',
    status: 'otwarte', opened_at: created, created_at: created, confirmed_at: created, file_id: null, creditor_key: 'klucz-wierzyciela',
  };
  const facts = { mf: { found: true, nip: '7740001454', name: 'PRZYKŁADOWY DŁUŻNIK SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', statusVat: 'Czynny', krs: '0000012345' }, krs: { found: true, krs: '0000012345', form: 'SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', flags: [] } };
  const file = { filename: 'faktura-FV-2026-06-089.pdf', size: 184320 };
  return { d, k: compute(d), facts, file };
}

async function mailResponse(d, c) {
  const en = d.lang === 'en';
  const paidOn = d.paid_date ? (en ? ' (transfer date: ' : ' (data przelewu: ') + d.paid_date + ')' : '';
  const label = { zaplacone: (en ? 'confirms payment' : 'potwierdza zapłatę') + paidOn, obietnica: en ? 'promises to pay by ' + (d.promised_date || '—') : 'deklaruje zapłatę do ' + (d.promised_date || '—'), spor: en ? 'disputes the invoice' : 'zgłasza zastrzeżenia' }[d.status] || d.status;
  const text = (en
    ? `The debtor ${d.debtor_company} has responded to your demand for invoice ${d.invoice_nr}: ${label}.`
    : `Dłużnik ${d.debtor_company} odpowiedział na wezwanie do faktury ${d.invoice_nr}: ${label}.`)
    + (d.response_note ? '\n\n' + (en ? 'Note from the debtor:' : 'Treść od dłużnika:') + '\n' + d.response_note : '')
    + '\n\n' + (en
      ? `Reply submitted: ${fmtTs(d.responded_at)} (Polish time). The date, IP address and browser of the reply are kept in the demand's record.`
      : `Odpowiedź złożono: ${fmtTs(d.responded_at)}. Data, adres IP i przeglądarka odpowiedzi są zapisane w rejestrze wezwania.`)
    + '\n\n' + (c.creditorUrl ? (en ? 'Your creditor view: ' : 'Twój podgląd wierzyciela: ') + c.creditorUrl : (en ? 'Demand page: ' : 'Strona wezwania: ') + c.url)
    + '\n\n' + (d.status === 'obietnica' ? (en ? 'A written promise to pay is an acknowledgement of the debt — keep this e-mail; it interrupts the limitation period.' : 'Pisemna deklaracja zapłaty to uznanie długu — zachowaj ten e-mail; przerywa bieg przedawnienia.') : '')
    + (d.status === 'spor' ? (en ? 'A disputed invoice is hard to sell; check the objection against your documents.' : 'Sporną fakturę trudno sprzedać — zweryfikuj zastrzeżenia z dokumentami.') : '')
    + '\n\nsprzedamfakture.pl';
  return Mailer.sendPlain({ to: d.creditor_email, subject: en ? `Debtor response — invoice ${d.invoice_nr}: ${label}` : `Odpowiedź dłużnika — faktura ${d.invoice_nr}: ${label}`, text, lang: d.lang });
}

// Lead in het panel (bron 'wezwanie') — de funnel naar skup faktur. Ontstaat bij het aanmaken;
// de notitie zegt of de wierzyciel zijn e-mailadres al heeft bevestigd (leadConfirmed werkt hem bij).
async function leadConfirmed(d) {
  if (!d.lead_id) return;
  const lead = await db.getLead(d.lead_id).catch(() => null);
  if (lead && lead.note) await db.setLeadNote(lead.id, String(lead.note).replace(LEAD_WAIT, LEAD_OK)).catch(() => {});
}
// Stand van een wezwanie-lead voor het leadbeheer (dm = nieuwste wezwanie van de lead, uit db.demandsByLead):
//   waiting (bevestigingslink geldig tot `until`) · expired (link verlopen) · gone (na PURGE_DAYS opgeruimd) · confirmed (+ status van de brief)
function leadState(lead, dm) {
  if (!lead || lead.source !== 'wezwanie') return null;
  if (!dm) return String(lead.note || '').includes(LEAD_GONE) ? { key: 'gone' } : null;
  if (dm.confirmed_at) return { key: 'confirmed', at: dm.confirmed_at, status: dm.status, opened_at: dm.opened_at, responded_at: dm.responded_at };
  const until = new Date(new Date(dm.created_at).getTime() + CONFIRM_DAYS * DAY_MS);
  return { key: until.getTime() > Date.now() ? 'waiting' : 'expired', until };
}
// Archief van het leadbeheer: afgehandeld (zaak aangemaakt, afgewezen, spam) of een wezwanie waarvan de bevestigingslink
// verliep terwijl de lead nog 'nowy' was. Een verlopen lead die de beheerder al oppakte (kontakt/oferta) blijft actueel.
const LEAD_DONE = ['zaakceptowany', 'odrzucony', 'spam'];
function leadArchived(lead, dm) {
  if (LEAD_DONE.includes(lead.status)) return true;
  if (lead.status && lead.status !== 'nowy') return false;
  const s = leadState(lead, dm);
  return !!s && (s.key === 'expired' || s.key === 'gone');
}
async function toLead(d, c, lang) {
  const est = AiScore.estimateOffer(c.amount, c.days);
  const lead = await db.saveLead({
    source: 'wezwanie', company: d.creditor_company, nip: d.debtor_nip || '', email: d.creditor_email, tel: '', kwota: c.amount, dni: c.days, oferta_pct: est.pct, forma: null,
    note: ['wezwanie ' + d.invoice_nr, 'dłużnik: ' + d.debtor_company, 'link: ' + c.url, isConfirmed(d) ? LEAD_OK : LEAD_WAIT, 'lang=' + (lang === 'en' ? 'en' : 'pl')].join(' · '),
  }).catch(() => null);
  if (lead && lead.id) { d.lead_id = lead.id; await db.updateDemand(d.id, { lead_id: lead.id }).catch(() => {}); }
  return lead;
}

module.exports = { STATUSES, validate: toRow, create, byToken, compute, isAnswered, isConfirmed, confirmExpired, confirm, isCreditor, markOpened, respond, history, fmtTs, mailDebtor, mailCreditor, mailConfirm, resendConfirm, remindUnconfirmed, purgeUnconfirmed, mailResponse, toLead, leadConfirmed, leadState, leadArchived, factsSummary, daysOverdue, debtorMailText, debtorMailSubject, creditorMailText, creditorMailSubject, confirmMailText, confirmMailSubject, CONFIRM_DAYS, RESEND_MAX, PURGE_DAYS, REMIND_AFTER_H, sample, FROM_EMAIL };
