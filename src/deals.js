// sprzedamfakture.pl — wykup wierzytelności (transakcja op een lead, v0.27.0)
//
// Eén transactie per lead: cena → oferta → zaakceptowana → umowa → podpisana → wypłacona → zawiadomiony (of anulowana).
// - prefill():      velden uit het onderzoeksverslag (registers, uitgelezen factuur) en de lead
// - runProposal():  AI-voorstel aan de beheerder (NL): prijsband, sterke punten, risico's, voorwaarden, nog te checken
// - agreementBlocks()/noticeBlocks(): umowa przelewu wierzytelności (art. 509–518 KC) en zawiadomienie dłużnika
//                   (art. 512 KC) als tekstblokken → PDF (src/pdf.js) en HTML (views/deal-doc.ejs)
// - sendAgreement(): mail aan de cedent met de PDF's (antwoord met de getekende scan komt in de draad van de lead)
// - markPaid():      uitbetaling registreren → zaak (sprawa) met de gekochte vordering, PCC-3-termijn, mail aan de beheerder
// - notifyDebtor():  zawiadomienie aan de dłużnik met afleverstatus (comm_log), daarna is de transactie rond
const db = require('./db');
const D = require('./data');
const Company = require('./company');
const Mailer = require('./mailer');
const Mailbox = require('./mailbox');
const Pdf = require('./pdf');

const STATUSES = ['cena', 'oferta', 'zaakceptowana', 'umowa', 'podpisana', 'wyplacona', 'zawiadomiony', 'anulowana'];
const ORDER = STATUSES.slice(0, 7);
const VARIANTS = ['bez_regresu', 'z_regresem'];
const RECOURSE_DAYS = 90;   // z regresem: terugkoop als de dłużnik zoveel dagen na de overgang nog niet betaald heeft
const PAY_DAYS = 1;         // cena betaald binnen zoveel werkdagen na ontvangst van de getekende umowa
const OFFER_DAYS = 7;       // geldigheid van de prijs
const PCC_DAYS = 14;        // PCC-3 (1%) door de koper binnen 14 dagen na de umowa
const PCC_REMIND_BEFORE_DAYS = 7;
const DAY_MS = 86400000;

// Velden die de beheerder invult (whitelist voor toInput)
const FIELDS = ['variant', 'nominal', 'pct', 'cedent_name', 'cedent_nip', 'cedent_regon', 'cedent_address', 'cedent_corr_address', 'cedent_rep', 'cedent_email', 'cedent_account',
  'debtor_name', 'debtor_nip', 'debtor_krs', 'debtor_address', 'debtor_email', 'invoice_nr', 'invoice_date', 'due_date', 'contract_desc', 'last_payment_date', 'buyer_rep', 'buyer_account', 'note'];
// Zonder deze velden is er geen umowa te maken
const DOC_REQUIRED = ['cedent_name', 'cedent_nip', 'cedent_address', 'cedent_account', 'debtor_name', 'debtor_nip', 'invoice_nr', 'due_date', 'buyer_rep', 'buyer_account'];

// ── Helpers ──────────────────────────────────────────────────────────────
const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
function isoDate(d) {
  if (!d) return null;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); // lokale datumdelen: pg levert DATE als Date om lokale middernacht
}
function plDate(d) {
  const s = isoDate(d);
  if (!s) return '—';
  const [y, m, day] = s.split('-').map((v) => parseInt(v, 10));
  return day + ' ' + MONTHS[m - 1] + ' ' + y + ' r.';
}
function addDays(d, n) { const x = new Date(isoDate(d) + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
// altijd gegroepeerd ("8 500,00 zł"): pl-PL laat getallen onder 10 000 ongegroepeerd, in umowy en mails staat de spatie standaard
function money(n) { const v = Math.round((Number(n) || 0) * 100), a = Math.abs(v); return (v < 0 ? '-' : '') + String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ',' + String(a % 100).padStart(2, '0') + ' zł'; }
function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function fmtIban(s) { const c = String(s || '').replace(/\s+/g, '').toUpperCase(); return c ? c.replace(/(.{4})/g, '$1 ').trim() : ''; }

// Kwota słownie (złote i grosze), tot miliardy
const ONES = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
const TEENS = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
const TENS = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
const HUNDREDS = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];
const GROUPS = [null, ['tysiąc', 'tysiące', 'tysięcy'], ['milion', 'miliony', 'milionów'], ['miliard', 'miliardy', 'miliardów']];
function plural(n, forms) { if (n === 1) return forms[0]; const u = n % 10, t = n % 100; return u >= 2 && u <= 4 && !(t >= 12 && t <= 14) ? forms[1] : forms[2]; }
function words3(n) {
  const h = Math.floor(n / 100), r = n % 100, out = [HUNDREDS[h]];
  if (r >= 10 && r < 20) out.push(TEENS[r - 10]); else out.push(TENS[Math.floor(r / 10)], ONES[r % 10]);
  return out.filter(Boolean).join(' ');
}
function slownie(amount) {
  const total = Math.round((Number(amount) || 0) * 100);
  const zl = Math.floor(total / 100), gr = total % 100;
  const parts = [];
  let n = zl, g = 0;
  while (n > 0 && g < GROUPS.length) {
    const chunk = n % 1000;
    if (chunk) {
      if (g === 0) parts.unshift(words3(chunk));
      else parts.unshift((chunk === 1 ? '' : words3(chunk) + ' ') + plural(chunk, GROUPS[g]));
    }
    n = Math.floor(n / 1000); g++;
  }
  return (parts.length ? parts.join(' ') : 'zero') + ' ' + plural(zl, ['złoty', 'złote', 'złotych']) + ' ' + String(gr).padStart(2, '0') + '/100';
}

const COUNTRY = { NL: 'Holandia', PL: 'Polska', DE: 'Niemcy', BE: 'Belgia' };
function buyer() {
  const C = Company.C;
  return { name: C.name, address: [C.street, C.city, COUNTRY[C.country] || C.country].filter(Boolean).join(', '), kvk: C.kvk, vat: C.vat, email: C.email, brand: C.brand };
}
function priceOf(nominal, pct) { return round2((Number(nominal) || 0) * (Number(pct) || 0) / 100); }
function emails(s) { return String(s || '').split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)); }

// ── Invoer ───────────────────────────────────────────────────────────────
function toInput(body = {}) {
  const s = (k, n) => (body[k] === undefined ? undefined : String(body[k] == null ? '' : body[k]).trim().slice(0, n));
  const num = (k) => { if (body[k] === undefined) return undefined; const v = parseFloat(String(body[k]).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(v) ? v : null; };
  const date = (k) => { if (body[k] === undefined) return undefined; const v = String(body[k]).trim().slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; };
  const out = {};
  for (const k of FIELDS) {
    if (k === 'nominal' || k === 'pct') out[k] = num(k);
    else if (/_date$/.test(k)) out[k] = date(k);
    else if (k === 'variant') { const v = s(k, 20); out[k] = v === undefined ? undefined : (VARIANTS.includes(v) ? v : 'bez_regresu'); }
    else if (/_nip$/.test(k) || k === 'debtor_krs' || /_account$/.test(k)) { const v = s(k, 40); out[k] = v === undefined ? undefined : v.replace(/[^0-9A-Za-z]/g, '').toUpperCase(); }
    else if (k === 'debtor_email') { const v = s(k, 300); out[k] = v === undefined ? undefined : emails(v).join(', '); }
    else if (k === 'cedent_email') { const v = s(k, 200); out[k] = v === undefined ? undefined : v.toLowerCase(); }
    else out[k] = s(k, k === 'note' || k === 'contract_desc' ? 2000 : 300);
  }
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}
function validate(input, existing) {
  const nominal = input.nominal !== undefined ? input.nominal : existing && Number(existing.nominal);
  const pct = input.pct !== undefined ? input.pct : existing && Number(existing.pct);
  if (!(nominal > 0)) throw new Error('nominal');
  if (!(pct > 0 && pct <= 100)) throw new Error('pct');
  return { nominal: round2(nominal), pct: round2(pct), price: priceOf(nominal, pct) };
}
function missingForDocs(deal) { return DOC_REQUIRED.filter((k) => !String(deal[k] || '').trim()); }

// Velden vooraf invullen uit het verslag (registers + uitgelezen document) en de lead
function prefill(lead, report) {
  const Research = require('./research');
  const f = (report && report.facts) || {};
  const cl = f.client || {}, de = f.debtor || {}, doc = f.document || {};
  const ceidg = cl.ceidg && cl.ceidg.found ? cl.ceidg : null, cmf = cl.mf && cl.mf.found ? cl.mf : null;
  const dmf = de.mf && de.mf.found ? de.mf : null, krs = de.krs && de.krs.found ? de.krs : null;
  const note = Research.parseNote(lead);
  const docDebtor = doc.debtor || {}, docCreditor = doc.creditor || {};
  const iso = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '');
  let due = iso(doc.dueDate);
  if (!due && lead.dni != null && lead.dni !== '') due = addDays(new Date(), -parseInt(lead.dni, 10));
  const descr = doc.description ? String(doc.description).slice(0, 300) : '';
  return {
    variant: 'bez_regresu',
    nominal: Number(doc.amountGross) || Number(lead.kwota) || 0,
    pct: lead.oferta_pct != null ? Number(lead.oferta_pct) : 45,
    cedent_name: (ceidg && ceidg.name) || (cmf && cmf.name) || docCreditor.name || lead.company || '',
    cedent_nip: cl.nip || String(lead.client_nip || '').replace(/\D/g, '') || docCreditor.nip || '',
    cedent_regon: (cmf && cmf.regon) || (ceidg && ceidg.regon) || '',
    cedent_address: (ceidg && ceidg.address) || (cmf && cmf.address) || docCreditor.address || '',
    cedent_corr_address: '',
    cedent_rep: (ceidg && ceidg.owner) || '',
    cedent_email: lead.email || '',
    cedent_account: doc.bankAccount ? String(doc.bankAccount).replace(/\s+/g, '') : '',
    debtor_name: (krs && krs.name) || (dmf && dmf.name) || docDebtor.name || note.debtorName || note.registerName || '',
    debtor_nip: de.nip || docDebtor.nip || String(lead.nip || '').replace(/\D/g, '') || '',
    debtor_krs: (krs && krs.krs) || (dmf && dmf.krs) || '',
    debtor_address: (krs && krs.address) || (dmf && dmf.address) || docDebtor.address || '',
    debtor_email: (krs && krs.email) || '',
    invoice_nr: doc.number || '',
    invoice_date: iso(doc.issueDate),
    due_date: due,
    contract_desc: descr,
    last_payment_date: '',
    buyer_rep: process.env.COMPANY_REP || '',
    buyer_account: process.env.COMPANY_IBAN || '',
    note: '',
  };
}

// ── Transactie aanmaken / bijwerken / status ─────────────────────────────
async function byLead(leadId) { return db.getDealByLead(leadId); }

async function start(lead, body, report) {
  const existing = await db.getDealByLead(lead.id);
  if (existing) return existing;
  const input = { ...prefill(lead, report), ...toInput(body) };
  const v = validate(input);
  const row = { lead_id: lead.id, status: 'cena', ...input, ...v };
  const deal = await db.createDeal(row);
  await db.setLeadOfferPct(lead.id, Math.round(v.pct)).catch(() => {});
  await db.insertEvent({ nip: deal.debtor_nip || null, debtor: deal.debtor_name || null, type: 'wykup', title: `Wykup rozpoczęty — lead #${lead.id} · ${deal.invoice_nr || '—'} · ${money(deal.nominal)} · cena ${v.pct}% = ${money(v.price)}`, source: 'panel admin' }).catch(() => {});
  return deal;
}

async function update(deal, body) {
  const input = toInput(body);
  const v = validate(input, deal);
  const fields = { ...input, ...v, updated_at: new Date() };
  await db.updateDeal(deal.id, fields);
  Object.assign(deal, fields);
  if (deal.lead_id) await db.setLeadOfferPct(deal.lead_id, Math.round(v.pct)).catch(() => {});
  return deal;
}

// Toegestane overgangen via de knoppen (de mail- en betaalstappen zetten hun eigen status)
const NEXT = { cena: ['oferta', 'anulowana'], oferta: ['zaakceptowana', 'cena', 'anulowana'], zaakceptowana: ['oferta', 'anulowana'], umowa: ['zaakceptowana', 'anulowana'], podpisana: ['umowa', 'anulowana'], wyplacona: [], zawiadomiony: [], anulowana: ['cena'] };
async function setStatus(deal, to) {
  if (!(NEXT[deal.status] || []).includes(to)) throw new Error('status');
  const fields = { status: to, updated_at: new Date() };
  if (to === 'oferta') fields.offered_at = new Date();
  if (to === 'zaakceptowana') fields.accepted_at = new Date();
  await db.updateDeal(deal.id, fields);
  Object.assign(deal, fields);
  await db.insertEvent({ nip: deal.debtor_nip || null, debtor: deal.debtor_name || null, type: 'wykup', title: `Wykup — lead #${deal.lead_id}: status ${to}`, source: 'panel admin' }).catch(() => {});
  return deal;
}
// Een offertemail vanuit de composer (sjabloon „oferta”) zet de transactie vanzelf op „oferta wysłana”
async function offerMailed(leadId) {
  const deal = await db.getDealByLead(leadId).catch(() => null);
  if (!deal || deal.status !== 'cena') return null;
  const fields = { status: 'oferta', offered_at: new Date(), updated_at: new Date() };
  await db.updateDeal(deal.id, fields);
  return { ...deal, ...fields };
}
function stepIndex(status) { return ORDER.indexOf(status); }

// ── Documenten ───────────────────────────────────────────────────────────
function partyCedent(d) {
  return [d.cedent_name, d.cedent_nip ? 'NIP ' + d.cedent_nip : '', d.cedent_regon ? 'REGON ' + d.cedent_regon : '', d.cedent_address ? 'z siedzibą: ' + d.cedent_address : '',
    d.cedent_corr_address ? 'adres do korespondencji: ' + d.cedent_corr_address : '', d.cedent_rep ? 'reprezentowany(-a) przez: ' + d.cedent_rep : ''].filter(Boolean).join(', ');
}
function partyBuyer(d) {
  const b = buyer();
  return [b.name, 'z siedzibą: ' + b.address, 'nr rejestrowy (KvK) ' + b.kvk, 'NIP UE (VAT) ' + b.vat, 'reprezentowana przez: ' + (d.buyer_rep || '____________________')].filter(Boolean).join(', ');
}
function debtorLine(d) { return [d.debtor_name, d.debtor_nip ? 'NIP ' + d.debtor_nip : '', d.debtor_krs ? 'KRS ' + d.debtor_krs : '', d.debtor_address || ''].filter(Boolean).join(', '); }
function invoiceLine(d) { return 'fakturą VAT nr ' + d.invoice_nr + (d.invoice_date ? ' z dnia ' + plDate(d.invoice_date) : '') + ' na kwotę ' + money(d.nominal) + ' brutto, z terminem płatności ' + plDate(d.due_date); }

function agreementBlocks(d, opts = {}) {
  const b = buyer();
  const today = isoDate(opts.date || new Date());
  const price = money(d.price), pricePct = (Number(d.pct) % 1 === 0 ? Number(d.pct) : Number(d.pct).toFixed(2).replace('.', ',')) + '%';
  const recourse = d.variant === 'z_regresem';
  const blocks = [
    { type: 'title', text: 'UMOWA PRZELEWU WIERZYTELNOŚCI' },
    { type: 'sub', text: '(cesja — art. 509–518 Kodeksu cywilnego) · projekt sporządzony ' + plDate(today) + ' · nr ref. ' + ref(d) },
    { type: 'p', text: 'zawarta pomiędzy:' },
    { type: 'li', text: '1. ' + partyCedent(d) + ' — zwanym(-ą) dalej „Cedentem”,' },
    { type: 'li', text: '2. ' + partyBuyer(d) + ' — zwaną dalej „Cesjonariuszem”,' },
    { type: 'p', text: 'zwanymi dalej łącznie „Stronami”, o następującej treści:' },

    { type: 'h', text: '§ 1. Oświadczenia Cedenta' },
    { type: 'p', text: '1. Cedent oświadcza, że przysługuje mu wobec ' + debtorLine(d) + ' (dalej „Dłużnik”) wymagalna wierzytelność pieniężna w kwocie ' + money(d.nominal) + ' (słownie: ' + slownie(d.nominal) + ') z tytułu ' + (d.contract_desc || 'sprzedaży towarów lub świadczenia usług na rzecz Dłużnika') + ', stwierdzona ' + invoiceLine(d) + ' (dalej „Wierzytelność”).' },
    { type: 'p', text: '2. Cedent oświadcza, że: a) Wierzytelność istnieje, jest bezsporna i wymagalna, a Dłużnik nie kwestionował jej ani co do zasady, ani co do wysokości; b) Wierzytelność nie została wcześniej przelana, zastawiona, obciążona ani przekazana do faktoringu i nie jest przedmiotem potrącenia, korekty, postępowania sądowego, egzekucyjnego, restrukturyzacyjnego ani upadłościowego; c) umowa łącząca Cedenta z Dłużnikiem nie zawiera zastrzeżenia wyłączającego lub ograniczającego przelew wierzytelności (art. 509 § 1 KC); d) ' + (d.last_payment_date ? 'po dniu ' + plDate(d.last_payment_date) + ' Dłużnik nie dokonał żadnej wpłaty na poczet Wierzytelności' : 'Dłużnik nie dokonał żadnej wpłaty na poczet Wierzytelności') + '; e) dokumenty przekazane Cesjonariuszowi (umowa z Dłużnikiem, faktura, korespondencja, potwierdzenia przelewów) są prawdziwe i kompletne.' },

    { type: 'h', text: '§ 2. Przedmiot umowy' },
    { type: 'p', text: '1. Cedent przelewa na Cesjonariusza Wierzytelność wraz ze wszystkimi związanymi z nią prawami (art. 509 § 2 KC), w szczególności z roszczeniem o odsetki ustawowe za opóźnienie w transakcjach handlowych oraz o rekompensatę za koszty odzyskiwania należności (ustawa z dnia 8 marca 2013 r. o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych), a Cesjonariusz Wierzytelność nabywa.' },
    { type: 'p', text: '2. Wierzytelność przechodzi na Cesjonariusza z chwilą zapłaty Ceny, o której mowa w § 3 (art. 510 § 1 KC).' },

    { type: 'h', text: '§ 3. Cena' },
    { type: 'p', text: '1. Z tytułu przelewu Wierzytelności Cesjonariusz zapłaci Cedentowi cenę w kwocie ' + price + ' (słownie: ' + slownie(d.price) + '), tj. ' + pricePct + ' wartości nominalnej Wierzytelności (dalej „Cena”).' },
    { type: 'p', text: '2. Cena jest płatna przelewem na rachunek bankowy Cedenta nr ' + fmtIban(d.cedent_account) + ' w terminie ' + PAY_DAYS + ' dnia roboczego od dnia otrzymania przez Cesjonariusza niniejszej umowy podpisanej przez Cedenta.' },
    { type: 'p', text: '3. Cena wyczerpuje wszelkie roszczenia Cedenta wobec Cesjonariusza z tytułu przelewu Wierzytelności. Cedentowi nie przysługuje udział w kwotach odzyskanych od Dłużnika.' },

    { type: 'h', text: '§ 4. Odpowiedzialność Cedenta' },
    { type: 'p', text: '1. Cedent odpowiada wobec Cesjonariusza za to, że Wierzytelność mu przysługuje (art. 516 KC), oraz za prawdziwość oświadczeń złożonych w § 1.' },
    { type: 'p', text: recourse
      ? '2. Jeżeli Dłużnik nie zapłaci Wierzytelności w terminie ' + RECOURSE_DAYS + ' dni od dnia przejścia Wierzytelności na Cesjonariusza, Cedent na pisemne żądanie Cesjonariusza odkupi Wierzytelność za Cenę powiększoną o odsetki ustawowe za opóźnienie liczone od dnia zapłaty Ceny, w terminie 7 dni od żądania (przelew zwrotny).'
      : '2. Cedent nie odpowiada za wypłacalność Dłużnika. Ryzyko braku zapłaty przez Dłużnika ponosi Cesjonariusz.' },
    { type: 'p', text: '3. Jeżeli którekolwiek z oświadczeń z § 1 okaże się nieprawdziwe albo Dłużnik skutecznie podniesie wobec Cesjonariusza zarzut, który przysługiwał mu wobec Cedenta w chwili przelewu (art. 513 KC), Cedent zwróci Cesjonariuszowi Cenę wraz z odsetkami ustawowymi za opóźnienie liczonymi od dnia jej zapłaty, w terminie 7 dni od wezwania, oraz naprawi związaną z tym szkodę.' },

    { type: 'h', text: '§ 5. Obowiązki Cedenta po przelewie' },
    { type: 'p', text: '1. Cedent przekaże Cesjonariuszowi na jego żądanie oryginały lub poświadczone kopie dokumentów dotyczących Wierzytelności oraz złoży oświadczenia potrzebne do jej dochodzenia, w tym w postępowaniu sądowym i egzekucyjnym.' },
    { type: 'p', text: '2. Jeżeli po dniu przejścia Wierzytelności Cedent otrzyma od Dłużnika jakąkolwiek wpłatę na jej poczet, przekaże ją Cesjonariuszowi w terminie 3 dni roboczych na rachunek nr ' + fmtIban(d.buyer_account) + '.' },
    { type: 'p', text: '3. Cedent nie będzie prowadził z Dłużnikiem rozmów ani ustaleń dotyczących zapłaty Wierzytelności, a o każdym kontakcie Dłużnika w tej sprawie niezwłocznie poinformuje Cesjonariusza.' },
    { type: 'p', text: '4. Cedent podpisze zawiadomienie Dłużnika o przelewie Wierzytelności według wzoru stanowiącego Załącznik nr 1; Cesjonariusz doręczy je Dłużnikowi (art. 512 KC).' },

    { type: 'h', text: '§ 6. Dane osobowe' },
    { type: 'p', text: 'Strony przetwarzają dane osobowe zawarte w umowie i w dokumentach dotyczących Wierzytelności wyłącznie w celu wykonania umowy i dochodzenia Wierzytelności, zgodnie z RODO. Każda ze Stron jest odrębnym administratorem danych, które przetwarza w związku z umową.' },

    { type: 'h', text: '§ 7. Postanowienia końcowe' },
    { type: 'p', text: '1. Umowa podlega prawu polskiemu. Spory rozstrzyga sąd powszechny właściwy według przepisów ogólnych.' },
    { type: 'p', text: '2. Umowę sporządzono w dwóch egzemplarzach, po jednym dla każdej ze Stron. Strony uzgadniają, że wymiana podpisanych egzemplarzy w postaci skanów przesłanych pocztą elektroniczną na adresy ' + (d.cedent_email || '—') + ' oraz ' + b.email + ' jest wystarczająca do zawarcia umowy (art. 77² KC); za dzień zawarcia umowy uważa się dzień otrzymania przez Cesjonariusza skanu egzemplarza podpisanego przez Cedenta.' },
    { type: 'p', text: '3. Cedent oświadcza, że zawiera umowę jako przedsiębiorca, w związku z prowadzoną działalnością gospodarczą, w ramach której powstała Wierzytelność, oraz wnosi o zapłatę Ceny niezwłocznie, przed upływem 14 dni od zawarcia umowy.' },
    { type: 'p', text: '4. Zmiany umowy wymagają formy dokumentowej pod rygorem nieważności.' },
    { type: 'p', text: '5. Załącznik nr 1 — Zawiadomienie o przelewie wierzytelności — stanowi integralną część umowy.' },
    { type: 'sig', left: d.cedent_rep ? d.cedent_name + '\n' + d.cedent_rep : d.cedent_name, right: b.name + '\n' + (d.buyer_rep || ''), leftLabel: 'Cedent', rightLabel: 'Cesjonariusz' },
    { type: 'break' },
    ...noticeBlocks(d, { ...opts, attachment: true }),
  ];
  return blocks;
}

function noticeBlocks(d, opts = {}) {
  const b = buyer();
  const signed = d.signed_at ? plDate(d.signed_at) : '____________ 2026 r.';
  return [
    { type: 'title', text: (opts.attachment ? 'Załącznik nr 1 — ' : '') + 'ZAWIADOMIENIE O PRZELEWIE WIERZYTELNOŚCI' },
    { type: 'sub', text: 'art. 512 Kodeksu cywilnego · ' + ref(d) },
    { type: 'p', text: 'Do: ' + debtorLine(d) + (d.debtor_email ? ' · e-mail: ' + d.debtor_email : '') },
    { type: 'p', text: 'Działając jako dotychczasowy wierzyciel z tytułu ' + (d.contract_desc || 'sprzedaży towarów lub świadczenia usług') + ', stwierdzonej ' + invoiceLine(d) + ', zawiadamiam na podstawie art. 512 Kodeksu cywilnego, że umową przelewu wierzytelności zawartą dnia ' + signed + ' przeniosłem(-am) tę wierzytelność w kwocie ' + money(d.nominal) + ' (słownie: ' + slownie(d.nominal) + ') wraz z odsetkami ustawowymi za opóźnienie w transakcjach handlowych oraz rekompensatą za koszty odzyskiwania należności na rzecz:' },
    { type: 'p', text: b.name + ', ' + b.address + ', nr rejestrowy (KvK) ' + b.kvk + ', NIP UE (VAT) ' + b.vat + ' (dalej „Nabywca”).' },
    { type: 'p', text: 'Od dnia otrzymania niniejszego zawiadomienia wszelkie płatności z tytułu tej wierzytelności należy kierować wyłącznie na rachunek Nabywcy: ' + fmtIban(d.buyer_account) + ', odbiorca: ' + b.name + ', tytuł przelewu: ' + d.invoice_nr + '.' },
    { type: 'p', text: 'Zapłata do rąk dotychczasowego wierzyciela dokonana po otrzymaniu niniejszego zawiadomienia nie zwalnia ze zobowiązania wobec Nabywcy (art. 512 KC). Wszelką korespondencję w sprawie tej wierzytelności proszę kierować do Nabywcy: ' + b.email + '.' },
    { type: 'sig', left: d.cedent_rep ? d.cedent_name + '\n' + d.cedent_rep : d.cedent_name, right: b.name + '\n' + (d.buyer_rep || ''), leftLabel: 'Dotychczasowy wierzyciel (Cedent)', rightLabel: 'Nabywca (Cesjonariusz) — przyjmuję do wiadomości' },
  ];
}
function ref(d) { return 'W-' + String(d.lead_id || d.id || '').padStart(4, '0') + (d.invoice_nr ? ' · ' + d.invoice_nr : ''); }
function fileSlug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'dok'; }
function agreementPdf(d) { return Pdf.render(agreementBlocks(d), { title: 'Umowa przelewu wierzytelności ' + (d.invoice_nr || ''), footer: buyer().brand + ' · ' + buyer().name + ' · umowa przelewu wierzytelności ' + ref(d) }); }
function noticePdf(d) { return Pdf.render(noticeBlocks(d), { title: 'Zawiadomienie o przelewie wierzytelności ' + (d.invoice_nr || ''), footer: buyer().brand + ' · zawiadomienie o przelewie ' + ref(d) }); }
function agreementFilename(d) { return 'umowa-przelewu-' + fileSlug(d.invoice_nr) + '.pdf'; }
function noticeFilename(d) { return 'zawiadomienie-o-cesji-' + fileSlug(d.invoice_nr) + '.pdf'; }

// Nederlandse samenvatting voor de beheerder (naast het Poolse document)
function summaryNl(d) {
  const b = buyer();
  return [
    `Koop van de vordering ${d.invoice_nr || '—'} van ${money(d.nominal)} op ${d.debtor_name || '—'} (NIP ${d.debtor_nip || '—'}) door ${b.name} van ${d.cedent_name || '—'} (NIP ${d.cedent_nip || '—'}).`,
    `Prijs ${money(d.price)} (${Number(d.pct)}% van nominaal), betaald binnen ${PAY_DAYS} werkdag na ontvangst van de getekende scan op rekening ${fmtIban(d.cedent_account) || '—'}. De vordering gaat pas over bij betaling van de prijs (§ 2.2).`,
    d.variant === 'z_regresem' ? `Met regres: betaalt de dłużnik niet binnen ${RECOURSE_DAYS} dagen, dan koopt de cedent terug voor de prijs plus wettelijke rente (§ 4.2).` : 'Zonder regres: het risico dat de dłużnik niet betaalt ligt bij ons (§ 4.2). De cedent staat wel in voor het bestaan van de vordering en de juistheid van de verklaringen (§ 4.1 en 4.3).',
    'Rente en rekompensata gaan mee (§ 2.1). De cedent levert documenten aan, stort latere betalingen van de dłużnik binnen 3 werkdagen door en tekent het zawiadomienie (§ 5). Scan per e-mail volstaat als ondertekening (§ 7.2).',
    'Laten nakijken door de jurist: het herroepingsrecht van een JDG bij een op afstand gesloten overeenkomst (§ 7.3 vraagt om directe betaling) en of het contract met de dłużnik geen zakaz cesji bevat (§ 1.2 c).',
    `Na uitbetaling: PCC-3 (1% van de prijs, ${money(round2(d.price * 0.01))}) binnen ${PCC_DAYS} dagen aangeven en betalen.`,
  ].join('\n');
}

// ── Mails ────────────────────────────────────────────────────────────────
function agreementMailText(d) {
  const b = buyer();
  return [
    'Szanowni Państwo,',
    '',
    `zgodnie z zapowiedzią przesyłamy cenę wykupu oraz projekt umowy przelewu wierzytelności z ${invoiceLine(d).replace(/^fakturą/, 'faktury')} wobec ${d.debtor_name}${d.debtor_nip ? ' (NIP ' + d.debtor_nip + ')' : ''}.`,
    '',
    `Cena wykupu: ${money(d.price)} (${Number(d.pct)}% wartości nominalnej ${money(d.nominal)}), ${d.variant === 'z_regresem' ? 'z regresem (§ 4 ust. 2 umowy)' : 'bez regresu — ryzyko braku zapłaty przez dłużnika przejmujemy my'}.`,
    `Wypłata: przelewem na rachunek ${fmtIban(d.cedent_account)} w terminie ${PAY_DAYS} dnia roboczego od otrzymania podpisanej umowy.`,
    `Oferta jest ważna ${OFFER_DAYS} dni od daty tej wiadomości.`,
    '',
    'Co dalej:',
    '1. Prosimy zapoznać się z umową (załącznik: ' + agreementFilename(d) + ') — § 1 zawiera Państwa oświadczenia, § 3 cenę i termin wypłaty, § 4 zasady odpowiedzialności.',
    '2. Jeżeli treść jest zgodna z ustaleniami, prosimy wydrukować umowę oraz zawiadomienie dla dłużnika (załącznik: ' + noticeFilename(d) + '), podpisać oba dokumenty odręcznie w miejscach oznaczonych „Cedent” / „Dotychczasowy wierzyciel” i odesłać skany w odpowiedzi na tę wiadomość. Skan przesłany e-mailem wystarcza do zawarcia umowy (§ 7 ust. 2).',
    '3. Po otrzymaniu skanów podpisujemy umowę ze swojej strony, odsyłamy Państwu egzemplarz i wypłacamy cenę. Następnie doręczamy dłużnikowi zawiadomienie o przelewie — od tej chwili wszelkie płatności trafiają na nasz rachunek, a dalsze kroki wobec dłużnika prowadzimy na nasze ryzyko i koszt.',
    '',
    'Do czasu wypłaty prosimy o nieprowadzenie z dłużnikiem rozmów o zapłacie oraz o niezwłoczną informację, gdyby wpłynęła od niego jakakolwiek wpłata. Pytania do treści umowy prosimy kierować w odpowiedzi na tę wiadomość — chętnie wyjaśnimy każdy punkt.',
    '',
    'Z poważaniem,',
    b.brand + ' — ' + b.name,
    b.email,
  ].join('\n');
}
function noticeMailText(d) {
  const b = buyer();
  const days = Math.max(0, Math.floor((Date.now() - new Date(isoDate(d.due_date) + 'T00:00:00Z').getTime()) / DAY_MS));
  const interest = D.interest(Number(d.nominal) || 0, days);
  return [
    'Szanowni Państwo,',
    '',
    `w załączeniu przekazujemy zawiadomienie o przelewie wierzytelności z ${invoiceLine(d).replace(/^fakturą/, 'faktury')}, wystawionej przez ${d.cedent_name}${d.cedent_nip ? ' (NIP ' + d.cedent_nip + ')' : ''}. Na podstawie umowy przelewu wierzytelności${d.signed_at ? ' z dnia ' + plDate(d.signed_at) : ''} (art. 509–512 Kodeksu cywilnego) wierzytelność ta przysługuje obecnie ${b.name}.`,
    '',
    `Prosimy o zapłatę kwoty ${money(d.nominal)} wraz z odsetkami ustawowymi za opóźnienie w transakcjach handlowych (na dzień dzisiejszy ${D.fmt(interest)}, ${days} dni po terminie) w terminie 7 dni od otrzymania tej wiadomości, wyłącznie na rachunek:`,
    `${fmtIban(d.buyer_account)} · odbiorca: ${b.name} · tytuł: ${d.invoice_nr}`,
    '',
    'Zapłata do rąk dotychczasowego wierzyciela po otrzymaniu zawiadomienia nie zwalnia ze zobowiązania (art. 512 KC). Jeżeli należność została już uregulowana, prosimy o przesłanie potwierdzenia przelewu w odpowiedzi na tę wiadomość. W razie pytań co do kwoty lub dokumentów jesteśmy do dyspozycji wyłącznie drogą e-mailową.',
    '',
    'Z poważaniem,',
    b.brand + ' — ' + b.name,
    b.email,
  ].join('\n');
}

async function sendAgreement(deal, lead) {
  if (!['zaakceptowana', 'umowa', 'oferta', 'cena'].includes(deal.status)) throw new Error('status');
  const missing = missingForDocs(deal);
  if (missing.length) { const e = new Error('missing'); e.missing = missing; throw e; }
  const to = deal.cedent_email || lead.email;
  if (!to) throw new Error('email');
  const [agreement, notice] = await Promise.all([agreementPdf(deal), noticePdf(deal)]);
  const subject = `${deal.invoice_nr} (${money(deal.nominal)}) — cena wykupu ${money(deal.price)} i umowa przelewu wierzytelności do podpisu`;
  const text = agreementMailText(deal);
  const r = await Mailbox.send({ to, subject, text, lang: 'pl', branded: true, attachments: [
    { filename: agreementFilename(deal), content: agreement.toString('base64') },
    { filename: noticeFilename(deal), content: notice.toString('base64') },
  ] });
  await db.logComm({ case_id: 'L' + lead.id, channel: 'email', tone: null, subject, body: text + '\n\n[załączniki: ' + agreementFilename(deal) + ', ' + noticeFilename(deal) + ']', status: r.status, recipient: to, ...r.log,
    attachments: [{ filename: agreementFilename(deal), size: agreement.length, content_type: 'application/pdf' }, { filename: noticeFilename(deal), size: notice.length, content_type: 'application/pdf' }] }).catch(() => {});
  if (r.ok || r.simulated) {
    const fields = { status: 'umowa', agreement_sent_at: new Date(), updated_at: new Date() };
    await db.updateDeal(deal.id, fields); Object.assign(deal, fields);
    await db.moveLeadStatus(lead.id, ['nowy', 'kontakt'], 'oferta').catch(() => {});
    await db.insertEvent({ nip: deal.debtor_nip || null, debtor: deal.debtor_name || null, type: 'wykup', title: `Umowa przelewu wysłana do ${to} — lead #${lead.id} · ${deal.invoice_nr} · cena ${money(deal.price)}`, source: 'panel admin' }).catch(() => {});
  }
  return r;
}

async function markSigned(deal, { fileId, date }) {
  if (!['umowa', 'zaakceptowana'].includes(deal.status)) throw new Error('status');
  const signedAt = isoDate(date) || isoDate(new Date());
  const fields = { status: 'podpisana', signed_at: signedAt, signed_file_id: fileId ? parseInt(fileId, 10) || null : null, updated_at: new Date() };
  await db.updateDeal(deal.id, fields); Object.assign(deal, fields);
  await db.insertEvent({ nip: deal.debtor_nip || null, debtor: deal.debtor_name || null, type: 'wykup', title: `Umowa przelewu podpisana przez cedenta ${plDate(signedAt)} — lead #${deal.lead_id} · ${deal.invoice_nr}`, source: 'panel admin' }).catch(() => {});
  return deal;
}

// Uitbetaling → zaak met de gekochte vordering (wij zijn nu de wierzyciel), PCC-3-termijn, mail aan de beheerder
async function markPaid(deal, lead, { date, amount, ref: payRef }, ctx = {}) {
  if (deal.status !== 'podpisana') throw new Error('status');
  const Cases = require('./cases');
  const paidAt = isoDate(date) || isoDate(new Date());
  const paid = amount !== undefined && amount !== '' ? round2(parseFloat(String(amount).replace(/\s/g, '').replace(',', '.'))) : Number(deal.price);
  if (!(paid > 0)) throw new Error('amount');
  const b = buyer();
  let c = null;
  if (!deal.case_id) {
    c = await Cases.create({
      nr: deal.invoice_nr, debtor: deal.debtor_name, nip: deal.debtor_nip, amount: Number(deal.nominal), dueDate: isoDate(deal.due_date), email: emails(deal.debtor_email)[0] || '', tel: '',
      clientCompany: b.name, clientEmail: b.email,
      note: `Wierzytelność nabyta w drodze cesji od ${deal.cedent_name} (NIP ${deal.cedent_nip || '—'}): umowa przelewu podpisana ${plDate(deal.signed_at)}, cena ${money(paid)} (${Number(deal.pct)}% z ${money(deal.nominal)}) wypłacona ${plDate(paidAt)}${payRef ? ', ref. ' + payRef : ''}. Lead #${lead.id}.${deal.note ? ' ' + deal.note : ''}`,
    }, { user: ctx.user, lead, source: 'lead', ownerUserId: null });
    await db.moveLeadStatus(lead.id, ['nowy', 'kontakt', 'oferta'], 'zaakceptowany').catch(() => {});
  }
  const pccDue = addDays(deal.signed_at || paidAt, PCC_DAYS);
  const fields = { status: 'wyplacona', paid_at: paidAt, paid_amount: paid, paid_ref: String(payRef || '').slice(0, 120) || null, pcc_due: pccDue, case_id: c ? c.id : deal.case_id, updated_at: new Date() };
  await db.updateDeal(deal.id, fields); Object.assign(deal, fields);
  await db.insertEvent({ nip: deal.debtor_nip || null, debtor: deal.debtor_name || null, type: 'wykup', case_id: deal.case_id || null, title: `Cena wykupu ${money(paid)} wypłacona ${plDate(paidAt)} — ${deal.invoice_nr}; sprawa ${c ? c.nr : deal.case_id} założona; PCC-3 do ${plDate(pccDue)}`, source: 'panel admin' }).catch(() => {});
  await notifyAdmin('paid', deal, lead).catch(() => {});
  return { deal, caseObj: c };
}

async function notifyDebtor(deal, lead, { to } = {}) {
  if (!['wyplacona', 'zawiadomiony'].includes(deal.status)) throw new Error('status');
  const list = emails(to !== undefined ? to : deal.debtor_email);
  if (!list.length) throw new Error('email');
  const notice = await noticePdf(deal);
  const subject = `Zawiadomienie o przelewie wierzytelności — ${deal.invoice_nr} (${money(deal.nominal)}) · ${deal.cedent_name}`;
  const text = noticeMailText(deal);
  const r = await Mailbox.send({ to: list, subject, text, lang: 'pl', branded: true, attachments: [{ filename: noticeFilename(deal), content: notice.toString('base64') }] });
  const caseKey = deal.case_id || 'L' + lead.id;
  const row = await db.logComm({ case_id: caseKey, channel: 'email', tone: 'Zawiadomienie o cesji', subject, body: text + '\n\n[załącznik: ' + noticeFilename(deal) + ']', status: r.status, recipient: list.join(', '), ...r.log,
    attachments: [{ filename: noticeFilename(deal), size: notice.length, content_type: 'application/pdf' }] }).catch(() => null);
  if (r.ok || r.simulated) {
    const fields = { status: 'zawiadomiony', notified_at: new Date(), notify_comm_id: row ? row.id : null, debtor_email: list.join(', '), updated_at: new Date() };
    await db.updateDeal(deal.id, fields); Object.assign(deal, fields);
    await db.insertEvent({ nip: deal.debtor_nip || null, debtor: deal.debtor_name || null, type: 'wykup', case_id: deal.case_id || null, title: `Zawiadomienie o przelewie wysłane do dłużnika (${list.join(', ')}) — ${deal.invoice_nr} · ${r.status}`, source: 'panel admin' }).catch(() => {});
  }
  return r;
}

// Mail aan de beheerder (NL): uitbetaling met PCC-termijn, en de PCC-herinnering
async function notifyAdmin(kind, deal, lead) {
  if (!Mailer.MAIL_NOTIFY) return { ok: false, status: 'brak MAIL_NOTIFY' };
  const link = (Mailer.SITE || '') + '/admin/leady?sel=' + deal.lead_id;
  const head = kind === 'paid' ? 'Wykup uitbetaald' : 'PCC-3 herinnering';
  const subject = `${head}: ${deal.cedent_name} · ${deal.invoice_nr} · ${money(deal.price)}`;
  const lines = kind === 'paid'
    ? [`De koopprijs van ${money(deal.paid_amount || deal.price)} voor ${deal.invoice_nr} (${money(deal.nominal)} op ${deal.debtor_name}) is op ${plDate(deal.paid_at)} uitbetaald aan ${deal.cedent_name}.`, '',
      `Zaak: ${deal.case_id || '—'} is aangemaakt met de gekochte vordering.`,
      `PCC-3: 1% van de prijs = ${money(round2(Number(deal.price) * 0.01))}, aangifte en betaling uiterlijk ${plDate(deal.pcc_due)} (14 dagen na de umowa).`,
      'Volgende stap: zawiadomienie aan de dłużnik versturen vanuit de lead (knop „Zawiadom dłużnika”).', '', link]
    : [`Voor de koop van ${deal.invoice_nr} (prijs ${money(deal.price)}, uitbetaald ${plDate(deal.paid_at)}) moet de PCC-3 uiterlijk ${plDate(deal.pcc_due)} zijn aangegeven en betaald: ${money(round2(Number(deal.price) * 0.01))}.`, '', link];
  return Mailer.sendPlain({ to: Mailer.MAIL_NOTIFY, subject, text: lines.join('\n'), lang: 'pl' });
}
async function remindPcc() {
  const soon = addDays(new Date(), PCC_REMIND_BEFORE_DAYS);
  const list = await db.listDealsPccDue(soon).catch(() => []);
  let n = 0;
  for (const deal of list) {
    const r = await notifyAdmin('pcc', deal, null).catch(() => ({ ok: false }));
    if (r.ok || r.simulated) { await db.updateDeal(deal.id, { pcc_reminded_at: new Date() }).catch(() => {}); n++; }
  }
  return n;
}

// ── AI-voorstel aan de beheerder ─────────────────────────────────────────
const pendingProposals = new Set();
function isProposalPending(leadId) { return pendingProposals.has(parseInt(leadId, 10)); }
function proposalOf(deal) { if (!deal || !deal.proposal) return null; try { return JSON.parse(deal.proposal); } catch { return null; } }
async function runProposal(lead, deal, files, lang) {
  const AiMail = require('./aimail');
  const id = parseInt(lead.id, 10);
  if (pendingProposals.has(id) || !AiMail.available()) return false;
  pendingProposals.add(id);
  (async () => {
    try {
      const report = await db.getLeadReport(lead.id).catch(() => null);
      const ctx = await Mailbox.draftContext('L' + lead.id, null, files || []);
      const r = await AiMail.dealProposal({ lead, report, deal, thread: ctx.thread, docs: ctx.docs, docNames: ctx.docNames, docSkipped: ctx.docSkipped, lang: lang || 'nl' });
      const pct = Number(r.pct);
      await db.updateDeal(deal.id, { proposal: JSON.stringify(r), proposal_pct: Number.isFinite(pct) ? round2(pct) : null, proposal_at: new Date(), proposal_model: r.model || null, updated_at: new Date() });
      await db.insertEvent({ nip: deal.debtor_nip || null, debtor: deal.debtor_name || null, type: 'wykup', title: `Propozycja AI dla wykupu — lead #${lead.id}: ${Number.isFinite(pct) ? pct + '%' : '—'} (${r.variant || '—'})`, source: 'panel admin' }).catch(() => {});
    } catch (e) {
      const m = AiMail.mapApiError(e);
      console.error('[wykup] propozycja AI mislukt —', m.code || '', (m.message || String(m)).slice(0, 300));
      await db.updateDeal(deal.id, { proposal: JSON.stringify({ error: m.code || (m.message || String(m)).slice(0, 300) }), proposal_at: new Date(), updated_at: new Date() }).catch(() => {});
    } finally { pendingProposals.delete(id); }
  })();
  return true;
}

module.exports = { STATUSES, ORDER, VARIANTS, FIELDS, DOC_REQUIRED, PAY_DAYS, OFFER_DAYS, PCC_DAYS, RECOURSE_DAYS, byLead, prefill, toInput, start, update, setStatus, offerMailed, stepIndex, missingForDocs,
  agreementBlocks, noticeBlocks, agreementPdf, noticePdf, agreementFilename, noticeFilename, summaryNl, agreementMailText, noticeMailText,
  sendAgreement, markSigned, markPaid, notifyDebtor, remindPcc, notifyAdmin, runProposal, isProposalPending, proposalOf, slownie, plDate, money, priceOf, fmtIban, emails, ref };
