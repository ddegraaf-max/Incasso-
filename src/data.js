// sprzedamfakture.pl — demodata & businesslogica
// Rentevoet transacties handlowe: NBP referencyjna (4%) + 10 p.p. = 14% (I półrocze 2026)
const INTEREST_RATE = 0.14;
const SERVICE_FEE = parseInt(process.env.SERVICE_FEE || '99', 10);

const claims = [
  { id: 'f6', tel: '+48 61 852 33 10', email: 'ksiegowosc@betmix.pl', nr: 'FV 2026/07/233', debtor: 'Betmix Beton Sp. z o.o.', nip: '527-020-38-15', amount: 23400, days: 5, phase: 'Nowa · analiza AI', tag: 'tag-outline', score: 'B', pct: 86, sim: { histDays: 20, krz: null, ageYears: 9 },
    timeline: [
      { text: 'Faktura zaimportowana z KSeF', date: 'dziś 12:14' },
      { text: 'Scoring B · prognoza 91% w 21 dni', date: 'dziś 12:15' },
      { text: 'Pierwsze przypomnienie e-mail', date: 'jutro 9:00', planned: true },
    ] },
  { id: 'f5', tel: '+48 61 447 82 20', email: 'faktury@kamex.pl', nr: 'FV 2026/07/156', debtor: 'Kamex Instalacje Sp. z o.o.', nip: '779-238-11-40', amount: 8150, days: 2, phase: 'Monitoring', tag: 'tag-neutral', score: 'A', pct: 91, sim: { histDays: 7, krz: null, ageYears: 12 },
    timeline: [
      { text: 'Faktura zaimportowana z KSeF', date: '13 lip' },
      { text: 'Scoring dłużnika: ryzyko niskie', date: '13 lip' },
      { text: 'Uprzejme przypomnienie e-mail', date: '16 lip' },
      { text: 'Zaplanowano telefon AI', date: '21 lip', planned: true },
    ] },
  { id: 'f1', tel: '+48 62 735 11 40', email: 'biuro@drewbud.pl', nr: 'FV 2026/07/201', debtor: 'Drewbud Meble Sp. z o.o.', nip: '618-004-32-77', amount: 3980, days: 9, phase: 'Przypomnienia', tag: 'tag-neutral', score: 'B+', pct: 88, sim: { histDays: 13, krz: null, ageYears: 7 },
    timeline: [
      { text: 'Faktura zaimportowana z KSeF', date: '3 lip' },
      { text: 'Przypomnienie e-mail — odczytane', date: '9 lip' },
      { text: 'SMS do działu księgowości', date: '14 lip' },
      { text: 'Nota odsetkowa w przygotowaniu', date: '20 lip', planned: true },
    ] },
  { id: 'f3', tel: '+48 32 209 44 55', email: 'ksiegowosc@stalmet.pl', nr: 'FV 2026/07/114', debtor: 'Stalmet Sp. z o.o.', nip: '634-113-98-02', amount: 48250, days: 21, phase: 'Negocjacje AI', tag: 'tag-outline', score: 'B', pct: 84, sim: { histDays: 15, krz: null, ageYears: 15 },
    timeline: [
      { text: 'Faktura zaimportowana z KSeF', date: '26 cze' },
      { text: 'Dwa przypomnienia — bez wpłaty', date: '4 lip' },
      { text: 'Rozmowa AI: dłużnik proponuje raty', date: '11 lip' },
      { text: 'Agent analizuje harmonogram rat', date: '16 lip' },
    ] },
  { id: 'f2', tel: '+48 22 631 90 05', email: 'platnosci@translog.pl', nr: 'FV 2026/06/089', debtor: 'TransLog Polska S.A.', nip: '521-301-77-19', amount: 12400, days: 44, phase: 'Eskalacja', tag: 'tag-accent', score: 'C', pct: 78, sim: { histDays: 20, krz: null, ageYears: 11 },
    timeline: [
      { text: 'Faktura zaimportowana z KSeF', date: '2 cze' },
      { text: 'Trzy przypomnienia — bez reakcji', date: '18 cze' },
      { text: 'Rozmowa AI z księgowością dłużnika', date: '30 cze' },
      { text: 'Nota: rekompensata + odsetki', date: '8 lip' },
      { text: 'Zapowiedź wpisu do KRD', date: 'za 6 dni', planned: true },
    ] },
  { id: 'f4', tel: '+48 81 524 77 30', email: 'biuro@agrosad.pl', nr: 'FV 2026/05/047', debtor: 'AgroSad Hurt S.A.', nip: '946-208-55-13', amount: 67800, days: 92, phase: 'Rekomendacja: sprzedaż', tag: 'tag-accent', score: 'E', pct: 58, sim: { histDays: 22, krz: null, ageYears: 6 },
    timeline: [
      { text: 'Faktura zaimportowana z KSeF', date: '14 kwi' },
      { text: 'Pełna ścieżka polubowna — bez wpłaty', date: 'maj–cze' },
      { text: 'Scoring: ryzyko niewypłacalności wysokie', date: '1 lip' },
      { text: 'Agent rekomenduje sprzedaż wierzytelności', date: '2 lip' },
    ] },
];

const toneOpeners = {
  'Uprzejmy': 'Dzień dobry, uprzejmie przypominamy o fakturze FV 2026/06/089 na 12 400 zł. Czy możemy liczyć na wpłatę w tym tygodniu?',
  'Stanowczy': 'Termin płatności FV 2026/06/089 (12 400 zł) minął 44 dni temu. Wzywamy do zapłaty w ciągu 7 dni — po tym terminie naliczymy rekompensatę i zgłosimy wpis do KRD.',
  'Prawniczy': 'Na podstawie art. 4a i 7 ustawy z 8.03.2013 r. wzywamy do zapłaty FV 2026/06/089 wraz z odsetkami ustawowymi za opóźnienie (14% rocznie) oraz rekompensatą ok. 300 zł.',
};

function thread(tone) {
  return [
    { label: 'Agent AI · e-mail · 18 cze', text: toneOpeners[tone] || toneOpeners['Uprzejmy'], agent: true },
    { label: 'Dłużnik · odpowiedź · 30 cze', text: 'Mamy przejściowe problemy z płynnością. Czy możliwe jest rozłożenie na raty?', agent: false },
    { label: 'Agent AI · rozmowa tel. · 30 cze', text: 'Uzgodniono 3 raty po 4 133 zł, pierwsza do 15 lipca. Harmonogram wysłany do podpisu — uznanie długu przerywa bieg przedawnienia.', agent: true },
    { label: 'Agent AI · nota · 8 lip', text: 'Pierwsza rata nie wpłynęła. Wystawiono notę: rekompensata 300 zł + odsetki 597 zł. Za 6 dni zapowiedź wpisu do KRD — czeka na Twoją zgodę.', agent: true },
  ];
}

const feed = [
  { time: '9:12', text: 'Wysłano uprzejme przypomnienie e-mail — otwarte po 11 minutach', ref: 'FV 2026/07/156 · Kamex Instalacje' },
  { time: '9:40', text: 'Rozmowa AI: dłużnik potwierdza raty 3× — harmonogram wysłany do akceptacji', ref: 'FV 2026/07/114 · Stalmet' },
  { time: '10:05', text: 'Wystawiono notę obciążeniową: rekompensata 300 zł + odsetki 597 zł', ref: 'FV 2026/06/089 · TransLog Polska' },
  { time: '11:30', text: 'Scoring zaktualizowany: ryzyko wysokie — rekomendacja sprzedaży wierzytelności', ref: 'FV 2026/05/047 · AgroSad Hurt' },
  { time: '12:14', text: 'Nowa faktura z KSeF — sprawa założona automatycznie, scoring B', ref: 'FV 2026/07/233 · Betmix Beton' },
  { time: '14:00', text: 'Ostatnie wezwanie przed wpisem do KRD — czeka na Twoją zgodę', ref: 'FV 2026/06/089 · TransLog Polska', planned: true },
];

// ── helpers ──────────────────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString('pl-PL') + ' zł';
const fmtN = (n) => n.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
const interest = (amount, days) => Math.round(amount * INTEREST_RATE * days / 365);
const interestExact = (amount, days) => Math.round(amount * INTEREST_RATE * days / 365 * 100) / 100;
// Rekompensata art. 10 ustawy: 40/70/100 € (do 5 tys. / 5–50 tys. / od 50 tys. zł)
// Klantzijde tonen we złoty — przeliczenie wg kursu NBP (instelbaar, halfjaarlijks bijwerken)
const EUR_PLN = parseFloat(process.env.EUR_PLN || '4.30');
const rekomp = (amount) => amount < 5000 ? 40 : (amount < 50000 ? 70 : 100);
const rekompZl = (amount) => Math.round(rekomp(amount) * EUR_PLN / 10) * 10;
const daysFmt = (d) => d + (d === 1 ? ' dzień' : ' dni');

// Przedawnienie (verjaring): termijn vanaf termin płatności (wymagalność);
// terminy >= 2 jaar eindigen op 31 december van dat jaar (art. 118 KC, na de reforma 2018).
function przedawnienie(dniPoTerminie, years = 2) {
  const MS = 86400000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(today.getTime() - (dniPoTerminie || 0) * MS);
  let end = new Date(due); end.setFullYear(end.getFullYear() + years);
  if (years >= 2) end = new Date(end.getFullYear(), 11, 31);
  const total = Math.max(1, Math.round((end - due) / MS));
  const left = Math.floor((end - today) / MS);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    end, endFmt: pad(end.getDate()) + '.' + pad(end.getMonth() + 1) + '.' + end.getFullYear(),
    daysLeft: Math.max(0, left), totalDays: total,
    fraction: Math.max(0, Math.min(1, left / total)), expired: left < 0,
  };
}

// actiestatus: write-through naar PostgreSQL indien aanwezig
const db = require('./db');
let done = {};   // { caseId: 'collect' | 'sell' | 'close' }
let nowaDone = null;
async function initActions() { done = await db.loadActions().catch(() => ({})); }

module.exports = {
  INTEREST_RATE, SERVICE_FEE, EUR_PLN, claims, toneOpeners, thread, feed,
  fmt, fmtN, interest, interestExact, rekomp, rekompZl, daysFmt, przedawnienie,
  getDone: () => done,
  setDone: (id, action) => { done[id] = action; db.saveAction(id, action).catch(() => {}); },
  initActions,
  getNowaDone: () => nowaDone,
  setNowaDone: (a) => { nowaDone = a; },
};
