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
//   - de dłużnik wordt bij het aanmaken gecontroleerd in MF biała lista + KRS (gratis extra voor de wierzyciel).
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

// Bedragen van vandaag + termijn (7 dagen na aanmaak) + publieke URL
function compute(d) {
  const amount = Number(d.amount) || 0;
  const days = daysOverdue(d.due_date);
  const odsetki = D.interestExact(amount, days);
  const rekomp = D.rekompZl(amount);
  const created = new Date(d.created_at || Date.now());
  const deadline = new Date(created.getTime() + 7 * DAY_MS);
  return {
    amount, days, odsetki, rekomp, total: Math.round((amount + odsetki + rekomp) * 100) / 100,
    deadline: isoDate(deadline), issued: isoDate(created), url: SITE + '/w/' + d.token, printUrl: SITE + '/w/' + d.token + '/druk',
    creditorUrl: d.creditor_key ? SITE + '/w/' + d.token + '?k=' + d.creditor_key : null,
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

// Is dit de wierzyciel? Alleen met de sleutel uit zijn bevestigingsmail (/w/<token>?k=<sleutel>)
function isCreditor(d, key) {
  const a = Buffer.from(String(d.creditor_key || '')), b = Buffer.from(typeof key === 'string' ? key : '');
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Wie kijkt er? creditor (sleutel, of hetzelfde IP als bij het aanmaken) · bot · debtor
function actorOf(d, meta, key) {
  if (isCreditor(d, key)) return 'creditor';
  if (meta.ip && d.creator_ip && meta.ip === d.creator_ip) return 'creditor';
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
Odpowiedzi prosimy kierować bezpośrednio do wierzyciela (odpowiedz na tę wiadomość) lub przez stronę wezwania.`;
}
function debtorMailSubject(d) { return `Wezwanie do zapłaty — faktura ${d.invoice_nr} (${d.creditor_company})`; }

async function mailDebtor(d, c, file) {
  if (!d.debtor_email) return { ok: false, status: 'brak adresata' };
  const attachments = file && file.data ? [{ filename: file.filename || 'faktura.pdf', content: Buffer.from(file.data).toString('base64') }] : undefined;
  return Mailer.sendPlain({ from: 'sprzedamfakture.pl <' + FROM_EMAIL + '>', to: d.debtor_email, replyTo: d.creditor_email, subject: debtorMailSubject(d), text: debtorMailText(d, c, file), lang: 'pl', attachments });
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
    status: 'otwarte', opened_at: created, created_at: created, file_id: null, creditor_key: 'klucz-wierzyciela',
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

// Lead in het panel (bron 'wezwanie') — de funnel naar skup faktur
async function toLead(d, c, lang) {
  const est = AiScore.estimateOffer(c.amount, c.days);
  const lead = await db.saveLead({
    source: 'wezwanie', company: d.creditor_company, nip: d.debtor_nip || '', email: d.creditor_email, tel: '', kwota: c.amount, dni: c.days, oferta_pct: est.pct, forma: null,
    note: ['wezwanie ' + d.invoice_nr, 'dłużnik: ' + d.debtor_company, 'link: ' + c.url, 'lang=' + (lang === 'en' ? 'en' : 'pl')].join(' · '),
  }).catch(() => null);
  if (lead && lead.id) await db.updateDemand(d.id, { lead_id: lead.id }).catch(() => {});
  return lead;
}

module.exports = { STATUSES, validate: toRow, create, byToken, compute, isAnswered, isCreditor, markOpened, respond, history, fmtTs, mailDebtor, mailCreditor, mailResponse, toLead, factsSummary, daysOverdue, debtorMailText, debtorMailSubject, creditorMailText, creditorMailSubject, sample, FROM_EMAIL };
