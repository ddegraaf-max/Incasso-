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
    odmowa_wykupu: { name: 'Odmowa wykupu + propozycja windykacji', subject: 'Decyzja w sprawie wykupu wierzytelności — {dluznik} ({kwota})', body:
`Szanowni Państwo,

dziękujemy za cierpliwość i za przesłane dokumenty. Zakończyliśmy pełną analizę sprawy: dokumentów, historii płatności oraz aktualnych danych rejestrowych dłużnika {dluznik}.

Po tej analizie nie możemy, niestety, złożyć oferty wykupu wierzytelności w kwocie {kwota}. Zdecydowały o tym łącznie następujące okoliczności:
- aktualne dane rejestrowe dłużnika oraz jego zachowanie płatnicze w ostatnich tygodniach wskazują na istotne ryzyko braku zapłaty,
- brak tytułu wykonawczego oznacza, że odzyskanie należności wymaga drogi sądowej, której czas i wynik nie są pewne,
- zapisy umowy z dłużnikiem dają mu argumenty do opóźniania zapłaty, które trzeba będzie odeprzeć w postępowaniu.

Wykup oznaczałby przeniesienie całego tego ryzyka na nas za cenę, która nie byłaby dla Państwa uczciwa. Dlatego proponujemy rozwiązanie, w którym koszty opóźnienia ponosi dłużnik, a nie Państwo: windykację na Państwa zlecenie, na następujących zasadach.

1. Bez opłat wstępnych. Naszym wynagrodzeniem jest prowizja wyłącznie od kwot faktycznie odzyskanych.
2. Dochodzimy pełnej kwoty {kwota} wraz z odsetkami ustawowymi za opóźnienie w transakcjach handlowych oraz rekompensatą za koszty odzyskiwania należności (równowartość 40 EUR). Te kwoty obciążają dłużnika.
3. Etap polubowny: wezwanie do zapłaty na aktualny adres siedziby dłużnika ujawniony w KRS oraz na adresy e-mail wskazane w umowie, z terminem 7 dni, a w razie potrzeby wpis dłużnika do rejestru BIG.
4. Etap sądowy: jeżeli dłużnik nie zapłaci, przygotowujemy pozew o nakaz zapłaty do sądu właściwego dla siedziby dłużnika, a po uzyskaniu tytułu wykonawczego — egzekucję komorniczą, w pierwszej kolejności z rachunków bankowych dłużnika ujawnionych w wykazie podatników VAT. Jeżeli egzekucja wobec spółki okaże się bezskuteczna, za jej długi odpowiadają osobiście członkowie zarządu (art. 299 Kodeksu spółek handlowych). Koszty etapu sądowego uzgadniamy z Państwem przed jego rozpoczęciem; sąd zasądza je od dłużnika.

Wezwaniem możemy objąć również inne niezapłacone kwoty od tego samego dłużnika, na przykład niedopłatę z wcześniejszej faktury. Prosimy o informację, czy takie kwoty istnieją.

Aby rozpocząć, wystarczy odpowiedzieć na tę wiadomość słowem „Zlecam”. Prześlemy wówczas do podpisu umowę zlecenia windykacji oraz pełnomocnictwo. Prosimy także o przesłanie korespondencji e-mail, w której dłużnik zlecał prace objęte fakturą, oraz numeru telefonu, z którego dłużnik kontaktował się z Państwem.

Przesłane dokumenty pozostają w aktach sprawy. Jeżeli zdecydują się Państwo nie korzystać z naszej pomocy, usuniemy je na Państwa życzenie.

{podpis}` },
    kontakt: { name: 'Prośba o wyjaśnienia', subject: 'W sprawie Państwa zgłoszenia — {company}', body:
`Dzień dobry,

nawiązując do zgłoszenia faktury na kwotę {kwota} wobec dłużnika {dluznik}, prosimy o odpowiedź na kilka pytań — wystarczy odpowiedzieć na tę wiadomość:

1. Czy dłużnik kwestionował fakturę lub jej część (jeśli tak — z jakiego powodu)?
2. Czy otrzymali Państwo od dłużnika jakąkolwiek obietnicę zapłaty lub propozycję rat?
3. Czy umowa z dłużnikiem zawiera zakaz cesji?
4. Czy faktura była już przekazana innej firmie windykacyjnej albo do sądu?

Całą korespondencję prowadzimy pisemnie — dzięki temu każde ustalenie jest udokumentowane.

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
    odmowa_wykupu: { name: 'Purchase declined + collection offer', subject: 'Decision on the purchase of your receivable — {dluznik} ({kwota})', body:
`Dear Sir or Madam,

thank you for your patience and for the documents you sent. We have completed a full review of the case: the documents, the payment history and the current register data of the debtor {dluznik}.

After this review we are unfortunately unable to make an offer to buy the receivable of {kwota}. Taken together, the following circumstances were decisive:
- the debtor's current register data and its payment behaviour in recent weeks indicate a significant risk of non-payment,
- without an enforceable title, recovery requires court proceedings whose duration and outcome are uncertain,
- the contract with the debtor contains provisions the debtor could use to delay payment, which would have to be rebutted in proceedings.

A purchase would transfer all of this risk to us at a price that would not be fair to you. We therefore propose a solution in which the debtor, not you, bears the cost of the delay: collection on your behalf, on the following terms.

1. No upfront fees. Our remuneration is a commission solely on the amounts actually recovered.
2. We claim the full amount of {kwota} together with statutory interest for late payment in commercial transactions and the recovery-cost compensation (equivalent of EUR 40). These amounts are charged to the debtor.
3. Amicable stage: a demand for payment sent to the debtor's current registered address shown in the KRS and to the e-mail addresses named in the contract, with a 7-day deadline, and if needed an entry of the debtor in the BIG debtor register.
4. Court stage: if the debtor does not pay, we prepare an application for an order for payment at the court competent for the debtor's seat and, once an enforceable title is obtained, enforcement by a bailiff, first of all against the debtor's bank accounts listed in the VAT taxpayer register. If enforcement against the company proves ineffective, the members of its management board are personally liable for its debts (Article 299 of the Commercial Companies Code). The costs of the court stage are agreed with you before it starts; the court awards them against the debtor.

The demand can also cover other unpaid amounts from the same debtor, for example a shortfall on an earlier invoice. Please let us know whether such amounts exist.

To start, simply reply to this message with the word "Proceed". We will then send you the collection mandate and the power of attorney for signature. Please also send the e-mail correspondence in which the debtor ordered the work covered by the invoice, and the phone number the debtor used to contact you.

The documents you sent remain on file. Should you decide not to use our help, we will delete them at your request.

{podpis}` },
    kontakt: { name: 'Request for clarification', subject: 'Regarding your request — {company}', body:
`Dear Sir or Madam,

regarding your invoice of {kwota} against the debtor {dluznik}, we have a few questions — simply reply to this e-mail:

1. Has the debtor disputed the invoice or part of it (if so, on what grounds)?
2. Have you received any promise to pay or instalment proposal from the debtor?
3. Does the contract with the debtor contain a non-assignment clause?
4. Has the invoice already been handed to another collection agency or to court?

We handle all correspondence in writing, so every agreement is documented.

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

const LEAD_KEYS = ['oferta', 'info', 'kontakt', 'odmowa', 'odmowa_wykupu', 'pusty'];
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
