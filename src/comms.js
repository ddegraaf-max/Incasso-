// sprzedamfakture.pl — communicatielaag van de agent
// E-mail: Resend (RESEND_API_KEY). SMS: SMSAPI.pl (SMSAPI_TOKEN).
// Teksten: Anthropic API (ANTHROPIC_API_KEY) of professionele PL-templates.
// Zonder keys: alles werkt in symulacja-modus, volledig gelogd — de flow is
// identiek, alleen de laatste verzendstap is dan een no-op.
const db = require('./db');
const D = require('./data');

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const SMSAPI_TOKEN = process.env.SMSAPI_TOKEN || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'windykacja@sprzedamfakture.pl';
const SMS_FROM = process.env.SMS_FROM || 'SprzedamFV';

// ── Tekstgeneratie ───────────────────────────────────────────────────────
function baseFacts(c) {
  const odsetki = D.interest(c.amount, c.days);
  return {
    odsetki,
    rekomp: D.rekompZl(c.amount),
    total: c.amount + odsetki,
    kwota: D.fmt(c.amount),
    dni: c.days,
  };
}

const TPL = {
  email: {
    Uprzejmy: (c, f) => ({
      subject: `Przypomnienie o płatności — faktura ${c.nr}`,
      body: `Dzień dobry,\n\nuprzejmie przypominamy o fakturze ${c.nr} na kwotę ${f.kwota}, której termin płatności minął ${f.dni} dni temu.\n\nByć może płatność umknęła w natłoku spraw — prosimy o uregulowanie należności w tym tygodniu lub kontakt, jeśli potrzebują Państwo innego terminu.\n\nZ poważaniem\nsprzedamfakture.pl — dział windykacji\nw imieniu wierzyciela`,
    }),
    Stanowczy: (c, f) => ({
      subject: `Wezwanie do zapłaty — faktura ${c.nr} (${f.dni} dni po terminie)`,
      body: `Szanowni Państwo,\n\ntermin płatności faktury ${c.nr} na kwotę ${f.kwota} minął ${f.dni} dni temu. Wzywamy do zapłaty w terminie 7 dni od otrzymania niniejszej wiadomości.\n\nDo należności głównej doliczamy odsetki ustawowe za opóźnienie (14% rocznie, obecnie ${D.fmt(f.odsetki)}) oraz rekompensatę za koszty odzyskiwania należności w wysokości ${D.fmt(f.rekomp)}.\n\nBrak wpłaty skutkować będzie zgłoszeniem do biura informacji gospodarczej (KRD/BIG) oraz skierowaniem sprawy na drogę sądową — na koszt dłużnika.\n\nsprzedamfakture.pl — dział windykacji`,
    }),
    Prawniczy: (c, f) => ({
      subject: `Ostateczne przedsądowe wezwanie do zapłaty — ${c.nr}`,
      body: `Szanowni Państwo,\n\ndziałając w imieniu wierzyciela, na podstawie art. 4a, 7 i 10 ustawy z dnia 8 marca 2013 r. o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych, wzywamy do zapłaty:\n\n— należność główna (faktura ${c.nr}): ${f.kwota}\n— odsetki ustawowe za opóźnienie (14% w skali roku): ${D.fmt(f.odsetki)}\n— rekompensata (art. 10 ustawy): ${D.fmt(f.rekomp)}\n\nw nieprzekraczalnym terminie 7 dni. Po bezskutecznym upływie terminu sprawa zostanie skierowana na drogę postępowania sądowego bez ponownego wezwania, wraz z wnioskiem o zasądzenie kosztów procesu i egzekucji od dłużnika.\n\nsprzedamfakture.pl`,
    }),
  },
  sms: {
    Uprzejmy: (c, f) => `sprzedamfakture.pl: przypominamy o fakturze ${c.nr} na ${f.kwota} (${f.dni} dni po terminie). Prosimy o wplate lub kontakt. Dziekujemy.`,
    Stanowczy: (c, f) => `sprzedamfakture.pl: faktura ${c.nr} na ${f.kwota} jest ${f.dni} dni po terminie. Prosimy o wplate w 7 dni — po tym terminie wpis do KRD i odsetki.`,
    Prawniczy: (c, f) => `sprzedamfakture.pl: ostateczne wezwanie ws. ${c.nr} (${f.kwota} + odsetki). Brak wplaty w 7 dni = sprawa sadowa na koszt dluznika.`,
  },
};

function callScript(c, f) {
  const eskalacja = c.days > 30;
  return {
    cel: `Uzyskać wiążącą deklarację zapłaty ${f.kwota}${eskalacja ? ` + odsetki ${D.fmt(f.odsetki)} i rekompensata ${D.fmt(f.rekomp)}` : ''} — najlepiej z konkretną datą przelewu.`,
    otwarcie: `Dzień dobry, [Twoje imię], sprzedamfakture.pl, w imieniu wierzyciela w sprawie faktury ${c.nr} na ${f.kwota} — termin minął ${f.dni} dni temu. Czy rozmawiam z osobą odpowiedzialną za płatności?`,
    argumenty: [
      `Odsetki naliczają się z mocy ustawy (14% rocznie) — dziś to już ${D.fmt(f.odsetki)}, każdy tydzień zwłoki podnosi kwotę.`,
      `Rekompensata ${D.fmt(f.rekomp)} należy się od każdej faktury po terminie — bez dowodu kosztów.`,
      eskalacja ? `Przy braku deklaracji jesteśmy zobowiązani zgłosić wpis do KRD — to widzą banki i kontrahenci.` : `Szybka wpłata zamyka sprawę bez dodatkowych kosztów i formalności.`,
    ],
    wymowki: [
      ['„Nie mamy teraz środków"', 'Rozumiem — zaproponujmy raty: pierwsza w tym tygodniu, harmonogram na piśmie. Uznanie długu przerywa bieg przedawnienia.'],
      ['„Faktura jest sporna"', 'Proszę o konkret na piśmie w 3 dni robocze — spór nie wstrzymuje odsetek od części bezspornej.'],
      ['„Zapłacimy w przyszłym miesiącu"', 'Potrzebuję konkretnej daty i potwierdzenia mailem dziś — inaczej procedura biegnie dalej.'],
      ['„Proszę dzwonić do księgowej"', 'Chętnie — poproszę o bezpośredni numer i imię. Do kogo mogę się powołać na tę rozmowę?'],
    ],
    zamkniecie: `Podsumuję mailem, co ustaliliśmy: [kwota / data / raty]. Brak wpłaty w ustalonym terminie oznacza automatyczną eskalację — bez kolejnego telefonu.`,
  };
}

async function aiGenerate(prompt, fallback) {
  if (!ANTHROPIC_KEY) return fallback;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json();
    const txt = (j.content || []).map((b) => b.text || '').join('').trim();
    return txt || fallback;
  } catch { return fallback; }
}

async function composeEmail(c, tone) {
  const f = baseFacts(c);
  const tpl = (TPL.email[tone] || TPL.email.Uprzejmy)(c, f);
  if (!ANTHROPIC_KEY) return { ...tpl, engine: 'szablon' };
  const body = await aiGenerate(
    `Napisz profesjonalny e-mail windykacyjny po polsku, ton: ${tone}. Faktura ${c.nr}, dłużnik ${c.debtor}, kwota ${f.kwota}, ${f.dni} dni po terminie, odsetki ${D.fmt(f.odsetki)}, rekompensata ${D.fmt(f.rekomp)}. Podstawa: ustawa z 8.03.2013. Zwróć wyłącznie treść e-maila, bez tematu, bez komentarzy. Podpis: sprzedamfakture.pl — dział windykacji.`,
    tpl.body
  );
  return { subject: tpl.subject, body, engine: 'AI' };
}

// ── Verzenden ────────────────────────────────────────────────────────────
async function sendEmail(c, tone) {
  const msg = await composeEmail(c, tone);
  let status = 'symulacja';
  if (RESEND_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({ from: FROM_EMAIL, to: c.email, subject: msg.subject, text: msg.body }),
        signal: AbortSignal.timeout(8000),
      });
      status = r.ok ? 'wysłano' : `błąd ${r.status}`;
    } catch (e) { status = 'błąd sieci'; }
  }
  await db.logComm({ case_id: c.id, channel: 'email', tone, subject: msg.subject, body: msg.body, status });
  await db.insertEvent({
    nip: c.nip, debtor: c.debtor, type: 'email',
    title: `E-mail (${tone}): ${msg.subject} — ${status}`, source: msg.engine === 'AI' ? 'agent AI + Resend' : 'szablon + Resend',
  }).catch(() => {});
  return { ...msg, status };
}

async function sendSms(c, tone) {
  const f = baseFacts(c);
  const body = (TPL.sms[tone] || TPL.sms.Uprzejmy)(c, f);
  let status = 'symulacja';
  if (SMSAPI_TOKEN) {
    try {
      const params = new URLSearchParams({ to: c.tel.replace(/\s/g, ''), from: SMS_FROM, message: body, format: 'json' });
      const r = await fetch('https://api.smsapi.pl/sms.do', {
        method: 'POST',
        headers: { authorization: `Bearer ${SMSAPI_TOKEN}`, 'content-type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(8000),
      });
      status = r.ok ? 'wysłano' : `błąd ${r.status}`;
    } catch { status = 'błąd sieci'; }
  }
  await db.logComm({ case_id: c.id, channel: 'sms', tone, subject: null, body, status });
  await db.insertEvent({
    nip: c.nip, debtor: c.debtor, type: 'sms',
    title: `SMS (${tone}) do ${c.tel} — ${status}`, source: 'SMSAPI.pl',
  }).catch(() => {});
  return { body, status };
}

// ── Belvoorbereiding + resultaat ─────────────────────────────────────────
function prepareCall(c, tone) {
  return callScript(c, baseFacts(c));
}

const OUTCOMES = {
  obietnica: 'Obietnica zapłaty',
  raty: 'Uzgodniono raty',
  sporna: 'Faktura sporna',
  odmowa: 'Odmowa zapłaty',
  brak: 'Brak kontaktu',
};

async function logCall(c, outcome, note, promisedDate) {
  const label = OUTCOMES[outcome] || outcome;
  const detail = [label, promisedDate ? `termin: ${promisedDate}` : null, note || null].filter(Boolean).join(' · ');
  await db.logComm({ case_id: c.id, channel: 'telefon', tone: null, subject: label, body: note || '', status: 'zarejestrowano', outcome: detail });
  await db.insertEvent({
    nip: c.nip, debtor: c.debtor, type: 'telefon',
    title: `Rozmowa telefoniczna: ${detail}`, source: 'rozmowa własna',
  }).catch(() => {});
  // wynik → fase van de zaak
  if (outcome === 'obietnica') { c.phase = 'Obietnica zapłaty'; c.tag = 'tag-neutral'; }
  if (outcome === 'raty') { c.phase = 'Harmonogram rat'; c.tag = 'tag-neutral'; }
  if (outcome === 'odmowa') { c.phase = 'Eskalacja'; c.tag = 'tag-accent'; }
  return detail;
}

module.exports = { sendEmail, sendSms, prepareCall, logCall, OUTCOMES, composeEmail };
