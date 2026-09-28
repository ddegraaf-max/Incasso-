// sprzedamfakture.pl — Wezwanie online: bezpłatna, brandowana sommatie met eigen link
//
// Origineel aan dit product: het wezwanie is geen statisch PDF maar een "levende" pagina /w/<token>:
//   - de rente loopt dagelijks op (kwota × 14% × dni ÷ 365) en de dłużnik ziet altijd het bedrag van vandaag,
//   - de dłużnik reageert met één klik (zapłacone / obietnica zapłaty met datum / spór) — de wierzyciel
//     krijgt direct een mail; elke reactie is een schriftelijk spoor (uznanie długu bij obietnica),
//   - de wierzyciel ziet wanneer het wezwanie is geopend,
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

function newToken() {
  return crypto.randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 11) || crypto.randomBytes(6).toString('hex');
}

function isoDate(d) { const x = d instanceof Date ? d : new Date(d); return Number.isNaN(x.getTime()) ? null : x.toISOString().slice(0, 10); }
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.due_date) || new Date(row.due_date) > new Date()) errors.due_date = 'dDue';
  if (row.iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(row.iban)) errors.iban = 'dIban';
  return { row, errors };
}

async function create(body, lang) {
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
    try { saved = await db.insertDemand({ ...row, token: newToken(), status: 'wyslane', facts }); }
    catch (e) { if (!/duplicate|unique/i.test(e.message) || i === 2) throw e; }
  }
  return { demand: saved, facts };
}

async function byToken(token) {
  const t = String(token || '').replace(/[^A-Za-z0-9]/g, '');
  if (!t) return null;
  return db.getDemandByToken(t);
}

async function markOpened(d) {
  if (d.opened_at) return;
  d.opened_at = new Date();
  if (d.status === 'wyslane') d.status = 'otwarte';
  await db.updateDemand(d.id, { opened_at: d.opened_at, status: d.status }).catch(() => {});
}

// Reactie van de dłużnik: paid | promise (datum) | dispute (toelichting)
async function respond(d, { action, date, note }) {
  const map = { paid: 'zaplacone', promise: 'obietnica', dispute: 'spor' };
  const status = map[action];
  if (!status) throw new Error('rBad');
  const promised = action === 'promise' ? String(date || '').slice(0, 10) : null;
  if (action === 'promise' && !/^\d{4}-\d{2}-\d{2}$/.test(promised)) throw new Error('rDate');
  const n = String(note || '').trim().slice(0, 1000);
  if (action === 'dispute' && !n) throw new Error('rNote');
  d.status = status; d.promised_date = promised; d.response_note = n || null; d.responded_at = new Date();
  await db.updateDemand(d.id, { status, promised_date: promised, response_note: d.response_note, responded_at: d.responded_at });
  return d;
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

async function mailDebtor(d, c) {
  if (!d.debtor_email) return { ok: false, status: 'brak adresata' };
  const text = `Szanowni Państwo,

działając w imieniu wierzyciela ${d.creditor_company}, wzywamy do zapłaty należności z faktury ${d.invoice_nr}, której termin płatności (${d.due_date}) minął ${c.days} dni temu.

Należność główna: ${D.fmtN(c.amount)} zł
Odsetki ustawowe za opóźnienie w transakcjach handlowych (${c.rate}% rocznie, na dziś): ${D.fmtN(c.odsetki)} zł
Rekompensata za koszty odzyskiwania należności (art. 10 ustawy z 8.03.2013 r.): ${D.fmtN(c.rekomp)} zł
Razem na dziś: ${D.fmtN(c.total)} zł${d.iban ? '\nRachunek do zapłaty: ' + d.iban : ''}

Termin zapłaty: ${c.deadline}. Odsetki naliczane są dalej do dnia zapłaty — aktualną kwotę oraz możliwość potwierdzenia zapłaty, zadeklarowania terminu albo zgłoszenia zastrzeżeń znajdą Państwo pod adresem:
${c.url}

Brak zapłaty w terminie może skutkować skierowaniem sprawy do windykacji, zgłoszeniem do biura informacji gospodarczej oraz na drogę sądową — na koszt dłużnika.

sprzedamfakture.pl — wezwanie wygenerowane na zlecenie wierzyciela
Odpowiedzi prosimy kierować bezpośrednio do wierzyciela (odpowiedz na tę wiadomość) lub przez stronę wezwania.`;
  return Mailer.sendPlain({ from: 'sprzedamfakture.pl <' + FROM_EMAIL + '>', to: d.debtor_email, replyTo: d.creditor_email, subject: `Wezwanie do zapłaty — faktura ${d.invoice_nr} (${d.creditor_company})`, text, lang: 'pl' });
}

async function mailCreditor(d, c, facts) {
  const en = d.lang === 'en';
  const fs = factsSummary(facts);
  const text = en
    ? `Your free online demand for payment is ready.

Invoice ${d.invoice_nr} · debtor ${d.debtor_company} · ${D.fmtN(c.amount)} zł (+ interest ${D.fmtN(c.odsetki)} zł and recovery fee ${D.fmtN(c.rekomp)} zł as of today)

Link to the demand (send it to the debtor, or we already did if you gave an e-mail): ${c.url}
Printable version with QR code: ${c.printUrl}
${fs ? '\nDebtor register check: ' + fs + '\n' : ''}
The amount updates daily. When the debtor confirms payment, promises a date or disputes the invoice, you will receive an e-mail. You can check the status any time via the link.

Not paid within 7 days? Sell the invoice and have cash within 24 hours: ${SITE}/?lang=en#wycena

sprzedamfakture.pl — ${Company.C.name}`
    : `Twoje bezpłatne wezwanie online jest gotowe.

Faktura ${d.invoice_nr} · dłużnik ${d.debtor_company} · ${D.fmtN(c.amount)} zł (+ odsetki ${D.fmtN(c.odsetki)} zł i rekompensata ${D.fmtN(c.rekomp)} zł na dziś)

Link do wezwania (prześlij dłużnikowi — jeśli podałeś jego e-mail, już to zrobiliśmy): ${c.url}
Wersja do druku z kodem QR: ${c.printUrl}
${fs ? '\nWeryfikacja dłużnika w rejestrach: ' + fs + '\n' : ''}
Kwota aktualizuje się codziennie. Gdy dłużnik potwierdzi zapłatę, zadeklaruje termin albo zgłosi zastrzeżenia, otrzymasz e-mail. Status sprawdzisz w każdej chwili pod linkiem.

Brak zapłaty w 7 dni? Sprzedaj fakturę i miej gotówkę w 24 godziny: ${SITE}/#wycena

sprzedamfakture.pl — ${Company.C.name}`;
  return Mailer.sendPlain({ to: d.creditor_email, subject: en ? `Your online demand for invoice ${d.invoice_nr} is ready` : `Twoje wezwanie online — faktura ${d.invoice_nr}`, text, lang: d.lang });
}

async function mailResponse(d, c) {
  const en = d.lang === 'en';
  const label = { zaplacone: en ? 'confirms payment' : 'potwierdza zapłatę', obietnica: en ? 'promises to pay by ' + (d.promised_date || '—') : 'deklaruje zapłatę do ' + (d.promised_date || '—'), spor: en ? 'disputes the invoice' : 'zgłasza zastrzeżenia' }[d.status] || d.status;
  const text = (en
    ? `The debtor ${d.debtor_company} has responded to your demand for invoice ${d.invoice_nr}: ${label}.`
    : `Dłużnik ${d.debtor_company} odpowiedział na wezwanie do faktury ${d.invoice_nr}: ${label}.`)
    + (d.response_note ? '\n\n' + (en ? 'Note from the debtor:' : 'Treść od dłużnika:') + '\n' + d.response_note : '')
    + '\n\n' + (en ? 'Demand page: ' : 'Strona wezwania: ') + c.url
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

module.exports = { STATUSES, create, byToken, compute, markOpened, respond, mailDebtor, mailCreditor, mailResponse, toLead, factsSummary, daysOverdue };
