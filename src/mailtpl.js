// sprzedamfakture.pl — e-mailsjablonen voor de composer (mails aan klanten, PL/EN)
// Mails aan dłużnicy komen uit comms.js (tonen Uprzejmy/Stanowczy/Prawniczy, AI of sjabloon).
// Placeholders: {company} {kwota} {dni} {dluznik} {oferta_pct} {oferta_kwota} {sygnatura} {nr} {podpis}
const D = require('./data');
const Company = require('./company');
const Research = require('./research');

function signature(lang) {
  const c = Company.C;
  return (lang === 'en' ? 'Kind regards,' : 'Z poważaniem,') + '\n' + (c.rep ? c.rep + '\n' : '') + 'sprzedamfakture.pl — ' + c.name + '\n' + c.email;
}

const T = {
  pl: {
    oferta: { name: 'Oferta wykupu faktury', subject: 'Oferta wykupu faktury — {company}', body:
`Dzień dobry,

dziękujemy za zgłoszenie faktury na kwotę {kwota} ({dni} dni po terminie), wystawionej dłużnikowi {dluznik}.

Po analizie danych rejestrowych dłużnika proponujemy wykup wierzytelności za {oferta_pct}% wartości nominalnej, tj. {oferta_kwota}. Wypłata następuje w ciągu 24 godzin od podpisania umowy cesji online.

Co obejmuje oferta:
- należność główna wraz z odsetkami za opóźnienie przechodzi na nas,
- rekompensata 40/70/100 € pozostaje przy Państwu (z mocy ustawy jest niezbywalna),
- ryzyko niewypłacalności dłużnika przechodzi na nas.

Jeżeli oferta jest interesująca, proszę odpowiedzieć na tę wiadomość — prześlemy umowę cesji do podpisu. Oferta jest ważna 7 dni.

{podpis}` },
    info: { name: 'Prośba o dokumenty', subject: 'Prośba o dokumenty do zgłoszenia — {company}', body:
`Dzień dobry,

dziękujemy za zgłoszenie faktury na kwotę {kwota} wobec dłużnika {dluznik}. Aby przygotować wiążącą ofertę, prosimy o przesłanie w odpowiedzi na tę wiadomość:

- kopii faktury (PDF lub zdjęcie),
- umowy lub zamówienia, na podstawie którego wystawiono fakturę,
- potwierdzenia dostawy lub wykonania usługi (WZ, protokół, korespondencja),
- dotychczasowej korespondencji z dłużnikiem (wezwania, obietnice zapłaty),
- informacji, czy umowa z dłużnikiem zawiera zakaz cesji.

Po otrzymaniu dokumentów wrócimy z ofertą w ciągu jednego dnia roboczego.

{podpis}` },
    odmowa: { name: 'Odmowa oferty', subject: 'Zgłoszenie faktury — {company}', body:
`Dzień dobry,

dziękujemy za zgłoszenie faktury na kwotę {kwota} wobec dłużnika {dluznik}.

Po analizie niestety nie możemy złożyć oferty wykupu tej wierzytelności. Nie oznacza to, że należność jest stracona — chętnie omówimy windykację na Państwa zlecenie, w której koszty, odsetki i rekompensata obciążają dłużnika.

Jeżeli sytuacja dłużnika się zmieni albo pojawią się nowe dokumenty, prosimy o kontakt.

{podpis}` },
    kontakt: { name: 'Prośba o kontakt', subject: 'W sprawie Państwa zgłoszenia — {company}', body:
`Dzień dobry,

nawiązując do zgłoszenia faktury na kwotę {kwota} wobec dłużnika {dluznik}: mamy kilka pytań, które najszybciej wyjaśnimy w krótkiej rozmowie.

Proszę o odpowiedź z dogodnym terminem i numerem telefonu — oddzwonimy.

{podpis}` },
    wyrok: { name: 'Oferta — skup wyroku', subject: 'Oferta skupu wyroku — {sygnatura}', body:
`Dzień dobry,

dziękujemy za zgłoszenie tytułu wykonawczego ({sygnatura}) wobec dłużnika {dluznik}, należność główna {kwota}.

Po ocenie sprawy proponujemy nabycie wierzytelności za {oferta_kwota}. Cesję podpisujemy online, wypłata w ciągu 24 godzin. Do zawarcia umowy potrzebujemy oryginału tytułu wykonawczego z klauzulą wykonalności oraz postanowienia o umorzeniu egzekucji (jeśli była prowadzona).

Jeżeli oferta jest interesująca, proszę odpowiedzieć na tę wiadomość.

{podpis}` },
    status: { name: 'Aktualizacja sprawy', subject: 'Aktualizacja sprawy {nr}', body:
`Dzień dobry,

informujemy o postępach w sprawie faktury {nr} (dłużnik: {dluznik}, kwota {kwota}):

-

Kolejne kroki:

{podpis}` },
    pusty: { name: 'Pusta wiadomość', subject: '', body: `Dzień dobry,



{podpis}` },
  },
  en: {
    oferta: { name: 'Invoice buy-out offer', subject: 'Offer to buy your invoice — {company}', body:
`Dear Sir or Madam,

thank you for submitting your invoice of {kwota} ({dni} days overdue) issued to the debtor {dluznik}.

Having reviewed the debtor's register data, we offer to buy the receivable for {oferta_pct}% of its nominal value, i.e. {oferta_kwota}. Payment follows within 24 hours of signing the assignment agreement online.

What the offer covers:
- the principal together with late-payment interest passes to us,
- the EUR 40/70/100 recovery fee stays with you (it is non-assignable by law),
- the debtor's insolvency risk passes to us.

If the offer suits you, simply reply to this e-mail and we will send the assignment agreement for signature. The offer is valid for 7 days.

{podpis}` },
    info: { name: 'Request for documents', subject: 'Documents needed for your request — {company}', body:
`Dear Sir or Madam,

thank you for submitting your invoice of {kwota} against the debtor {dluznik}. To prepare a binding offer, please reply to this e-mail with:

- a copy of the invoice (PDF or photo),
- the contract or purchase order the invoice is based on,
- proof of delivery or performance (delivery note, acceptance report, correspondence),
- your correspondence with the debtor so far (demands, promises to pay),
- whether the contract with the debtor contains a non-assignment clause.

We will come back with an offer within one business day of receiving the documents.

{podpis}` },
    odmowa: { name: 'Decline', subject: 'Your invoice request — {company}', body:
`Dear Sir or Madam,

thank you for submitting your invoice of {kwota} against the debtor {dluznik}.

After review we are unfortunately unable to make an offer to buy this receivable. This does not mean the claim is lost — we would be glad to discuss collection on your behalf, where costs, interest and the recovery fee are charged to the debtor.

Should the debtor's situation change or new documents become available, please contact us.

{podpis}` },
    kontakt: { name: 'Request for a call', subject: 'Regarding your request — {company}', body:
`Dear Sir or Madam,

regarding your invoice of {kwota} against the debtor {dluznik}: we have a few questions that are easiest to clarify in a short call.

Please reply with a convenient time and a phone number — we will call you.

{podpis}` },
    wyrok: { name: 'Offer — judgment buy-out', subject: 'Offer for your judgment — {sygnatura}', body:
`Dear Sir or Madam,

thank you for submitting your enforceable title ({sygnatura}) against the debtor {dluznik}, principal {kwota}.

Having assessed the case, we offer to acquire the claim for {oferta_kwota}. The assignment is signed online and paid within 24 hours. To conclude the agreement we need the original enforceable title with the enforcement clause and the decision discontinuing enforcement (if any).

If the offer suits you, simply reply to this e-mail.

{podpis}` },
    status: { name: 'Case update', subject: 'Update on case {nr}', body:
`Dear Sir or Madam,

here is an update on invoice {nr} (debtor: {dluznik}, amount {kwota}):

-

Next steps:

{podpis}` },
    pusty: { name: 'Blank message', subject: '', body: `Dear Sir or Madam,



{podpis}` },
  },
};

const LEAD_KEYS = ['oferta', 'info', 'kontakt', 'odmowa', 'pusty'];
const WYROK_KEYS = ['wyrok', 'info', 'kontakt', 'odmowa', 'pusty'];
const CASE_CLIENT_KEYS = ['status', 'pusty'];

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? '' : String(vars[k])));
}

function list(kind, lang, isWyrok) {
  const L = T[lang === 'en' ? 'en' : 'pl'];
  const keys = kind === 'case' ? CASE_CLIENT_KEYS : (isWyrok ? WYROK_KEYS : LEAD_KEYS);
  return keys.map((key) => ({ key, name: L[key].name }));
}

// Concept voor een lead (mail aan de aanvrager/klant)
function forLead(lead, key, lang) {
  const L = T[lang === 'en' ? 'en' : 'pl'];
  const tpl = L[key];
  if (!tpl) return { subject: '', body: '' };
  const note = Research.parseNote(lead);
  const kw = Number(lead.kwota) || 0;
  const pct = lead.oferta_pct != null ? Number(lead.oferta_pct) : null;
  const vars = {
    company: lead.company || '', kwota: D.fmt(kw), dni: lead.dni != null ? lead.dni : '',
    dluznik: note.debtorName || note.registerName || (lead.nip ? 'NIP ' + lead.nip : '—'),
    oferta_pct: pct != null ? pct : '…', oferta_kwota: pct != null ? D.fmt(Math.round(kw * pct / 100)) : '… zł',
    sygnatura: note.sygnatura || '—', nr: '', podpis: signature(lang),
  };
  return { subject: fill(tpl.subject, vars), body: fill(tpl.body, vars) };
}

// Concept voor een zaak (mail aan de klant/eigenaar van de zaak)
function forCase(c, key, lang) {
  const L = T[lang === 'en' ? 'en' : 'pl'];
  const tpl = L[key];
  if (!tpl) return { subject: '', body: '' };
  const vars = {
    company: c.clientCompany || '', kwota: D.fmt(c.amount || 0), dni: c.days, dluznik: c.debtor || '—',
    oferta_pct: c.pct || '…', oferta_kwota: c.pct ? D.fmt(Math.round((c.amount || 0) * c.pct / 100)) : '… zł',
    sygnatura: c.nr || '—', nr: c.nr || '—', podpis: signature(lang),
  };
  return { subject: fill(tpl.subject, vars), body: fill(tpl.body, vars) };
}

module.exports = { list, forLead, forCase, signature };
