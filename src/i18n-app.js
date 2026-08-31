// sprzedamfakture.pl — teksten klantpanel (PL/EN)
// Gebruik in views: t.app.<sectie>.<key>, t.app.days(n), t.locale, t.tr(dynamischeTekst)
// t.tr vertaalt demodata/statussen (fasen, tijdlijn, feed, AI-signalen) — PL is identiteit,
// EN via woordenboek + regels. Teksten richting de dłużnik (e-mail/SMS/belscript) blijven PL.

const pl = {
  locale: 'pl-PL',
  days: (n) => n + (n === 1 ? ' dzień' : ' dni'),
  tr: (s) => s,
  nav: { admin: 'Admin', panel: 'Panel', logout: 'Wyloguj', tabs: { sprawy: 'Sprawy', nowa: 'Nowa sprawa', agent: 'Agent AI', wykup: 'Wykup' } },
  titles: { login: 'Logowanie', register: 'Rejestracja', twofa: 'Weryfikacja', twofaSetup: 'Konfiguracja 2FA', sprawy: 'Sprawy', nowa: 'Nowa sprawa', agent: 'Agent AI', wykup: 'Wykup wierzytelności', rozmowa: 'Rozmowa', admin: 'Admin' },
  tones: { Uprzejmy: 'Uprzejmy', Stanowczy: 'Stanowczy', Prawniczy: 'Prawniczy' },
  outcomes: { obietnica: 'Obietnica zapłaty', raty: 'Uzgodniono raty', sporna: 'Faktura sporna', odmowa: 'Odmowa zapłaty', brak: 'Brak kontaktu' },
  msg: {
    tooMany: 'Zbyt wiele nieudanych prób. Spróbuj ponownie za 15 minut.', badCreds: 'Nieprawidłowy e-mail lub hasło.', sessionErr: 'Błąd sesji — spróbuj ponownie.',
    fillCompanyEmail: 'Uzupełnij nazwę firmy i e-mail.', exists: 'Konto z tym adresem już istnieje. Zaloguj się.',
    pwLen: 'Hasło musi mieć co najmniej 10 znaków.', pwChars: 'Hasło musi zawierać małą literę, wielką literę i cyfrę.', pwMismatch: 'Hasła nie są identyczne.',
    badCodeRetry: 'Nieprawidłowy kod — spróbuj ponownie.', tooManyCodes: 'Zbyt wiele prób. Spróbuj za 15 minut.', badCode: 'Nieprawidłowy kod.',
    flashEmail: 'E-mail', flashSms: 'SMS', flashCall: 'Rozmowa',
    captcha: 'Weryfikacja antybotowa nie powiodła się — spróbuj ponownie.',
  },
  login: {
    kicker: 'Panel klienta', h: 'Zaloguj się', helper: 'Dostęp do spraw, agenta AI i ofert wykupu.', email: 'E-mail', password: 'Hasło', btn: 'Zaloguj się',
    noAccount: 'Nie masz konta?', register: 'Zarejestruj firmę',
    note: 'Logowanie chronione: hasła haszowane (bcrypt), weryfikacja dwuetapowa (TOTP), blokada po 5 nieudanych próbach.',
    demoTitle: 'Konto demo', demoText: 'Do testów, bez 2FA:', demoFill: 'Wypełnij dane demo',
  },
  register: {
    kicker: 'Nowe konto', h: 'Zarejestruj firmę',
    helper: 'Po rejestracji skonfigurujesz weryfikację dwuetapową (aplikacja typu Google Authenticator) — obowiązkową dla bezpieczeństwa Twoich należności.',
    company: 'Nazwa firmy', nip: 'NIP (opcjonalnie)', email: 'E-mail', password: 'Hasło (min. 10 znaków, mała i wielka litera, cyfra)', password2: 'Powtórz hasło',
    btn: 'Utwórz konto', have: 'Masz już konto?', login: 'Zaloguj się',
  },
  twofa: {
    kicker: 'Weryfikacja dwuetapowa', h: 'Wpisz kod', helper: 'Otwórz aplikację uwierzytelniającą i wpisz aktualny 6-cyfrowy kod.',
    code: 'Kod z aplikacji', btn: 'Zweryfikuj', cancel: 'Anuluj i wyloguj',
  },
  twofaSetup: {
    kicker: 'Weryfikacja dwuetapowa', h: 'Skonfiguruj 2FA',
    helper: 'Zeskanuj kod QR w aplikacji uwierzytelniającej (Google Authenticator, Microsoft Authenticator, Aegis), a następnie wpisz 6-cyfrowy kod, aby potwierdzić.',
    qrAlt: 'Kod QR TOTP', manual: 'Klucz ręczny (jeśli nie możesz skanować)', code: 'Kod z aplikacji', btn: 'Potwierdź i włącz 2FA',
  },
  sprawy: {
    stats: { portfolio: 'Portfel po terminie', active: 'Aktywne sprawy', amicable: 'Zamknięte polubownie', avgTime: 'Śr. czas odzyskania', avgTimeVal: '18 dni' },
    importKsef: 'Importuj z KSeF', upload: 'Wgraj XML / PDF',
    kicker: 'Sprawy', helper: 'Agent AI czyta każdą zaimportowaną fakturę i sam zakłada sprawę. Kliknij wiersz, aby zobaczyć działania agenta.',
    th: { invoice: 'Faktura', debtor: 'Dłużnik', amount: 'Kwota', overdue: 'Po terminie', agent: 'Agent AI' },
    caseKicker: 'Sprawa {nr} · AIScore {score} · klasa {grade}', meta: '{days} po terminie · odsetki naliczone: {interest}',
    aiLabel: 'AIScore — analiza danych publicznych', grade: 'klasa {grade}',
    channelsLabel: 'Akcje agenta — kanały', emailBtn: 'E-mail', smsBtn: 'SMS', callBtn: 'Zadzwoń — skrypt',
    channelsHelper: 'E-mail i SMS generuje agent AI w wybranym tonie; telefon wykonujesz sam — ze skryptem i rejestracją wyniku.',
    commsLabel: 'Historia komunikacji', actionsLabel: 'Działania agenta AI',
    close: { h: 'Zamknij sprawę — wierzytelność nieściągalna', p: 'AIScore {score}: wpisy w KRZ wskazują na brak realnych szans odzyskania. Odpis pozwala rozliczyć stratę podatkowo (art. 16 ust. 1 pkt 25 CIT) zamiast dopłacać do windykacji.', btn: 'Zamknij i odpisz' },
    collect: { h: 'Windykacja — Ty płacisz tylko opłatę serwisową', p: 'Odsetki 14%, rekompensata {rekomp} zł i koszty obciążają dłużnika. Odzyskana kwota w całości trafia do Ciebie.', btn: 'Zleć windykację — {fee} zł' },
    sell: { h: 'Albo sprzedaj wierzytelność', p: 'Wycena agenta AI: {pct}% wartości. Wypłata w 24 godziny, ryzyko przechodzi na nas.', btn: 'Przyjmij ofertę — {amount}' },
    done: { collect: 'Zlecono windykację — agent AI przejął sprawę.', close: 'Sprawa zamknięta — wierzytelność odpisana (rekomendacja AI).', sell: 'Oferta przyjęta — wypłata w ciągu 24 godzin.' },
  },
  nowa: {
    k1: '01 · Źródło', h1: 'Trzy drogi do założenia sprawy — wybierz wygodną dla siebie.',
    sources: [
      ['KSeF — synchronizacja', 'Auto', 'Każda faktura po terminie pojawia się tu automatycznie.'],
      ['Plik XML / PDF', 'Ręcznie', 'Przeciągnij fakturę tutaj — agent AI odczyta dane i założy sprawę.'],
      ['E-mail', 'Przekaż', 'Prześlij fakturę na sprawy@sprzedamfakture.pl — resztą zajmie się agent.'],
    ],
    k2: '02 · Analiza AI', h2: 'Przykład: tak agent czyta świeżo zaimportowaną fakturę.',
    fields: { debtor: 'Dłużnik', nip: 'NIP', amount: 'Kwota', due: 'Termin', dueVal: '12 lip · 5 dni po terminie' },
    signals: ['KRD / BIG: brak wpisów, KRS aktywny', 'Historia: płaci średnio 12 dni po terminie', 'AIScore 83 · klasa B · prognoza odzyskania 91% w 21 dni'],
    k3: '03 · Decyzja', h3: 'Rekomendacja agenta: ścieżka polubowna — wysokie prawdopodobieństwo szybkiej wpłaty.',
    run: { h: 'Uruchom agenta AI', p: 'Monitoring, przypomnienia, negocjacje i eskalacja — odsetki 14%, rekompensata 300 zł i koszty obciążają dłużnika.', btn: 'Uruchom — {fee} zł' },
    sell: { h: 'Albo sprzedaj od razu', p: 'Wycena agenta AI: 86% wartości. Wypłata w 24 godziny, ryzyko przechodzi na nas.', btn: 'Przyjmij ofertę — 20 124 zł' },
    done: { collect: 'Agent AI uruchomiony — pierwsze przypomnienie jutro o 9:00.', sell: 'Oferta przyjęta — cesja do podpisu, wypłata w 24 godziny.' },
  },
  agent: {
    monKicker: 'Monitoring — dane publiczne na żywo',
    monHelper: 'Agent w pętli sprawdza KRZ, MSiG i białą listę dla każdego dłużnika w bazie. Nowe obwieszczenie = zdarzenie + przeliczenie AIScore.',
    noEvents: 'Brak zdarzeń — monitoring aktywny.', todayKicker: 'Dziś — praca agenta',
    todayHelper: 'Każde działanie zapisane, każdy krok widoczny — kluczowe decyzje zawsze za Twoją zgodą.',
    negKicker: 'Negocjacje — FV 2026/06/089 · TransLog Polska S.A.', toneLabel: 'Ton agenta', rulesLabel: 'Zasady agenta',
    rules: ['Ton komunikacji: {tone}', 'Kontakt: dni robocze 8:00–18:00, PL / EN', 'Wpis do KRD i pozew: zawsze za Twoją zgodą', 'Każdy krok zapisany w historii sprawy'],
  },
  wykup: {
    kicker: 'Wykup wierzytelności',
    intro: 'Agent AI wycenia każdą wierzytelność na żywo — na podstawie scoringu dłużnika, historii płatności i etapu sprawy. Akceptujesz ofertę, podpisujesz cesję online, pieniądze masz w 24 godziny. Ryzyko niewypłacalności przechodzi na nas.',
    th: { invoice: 'Faktura', debtor: 'Dłużnik', amount: 'Kwota', aiscore: 'AIScore', offer: 'Oferta AI' },
    sold: 'Sprzedana · wypłata do 24 h', accept: 'Przyjmij',
    note: 'Cesja obejmuje należność główną i odsetki. Rekompensata (170/300/430 zł) jest z mocy ustawy niezbywalna — przy windykacji serwisowej agent dochodzi jej w Twoim imieniu.',
  },
  rozmowa: {
    kicker: 'Przygotowanie rozmowy · {nr} · AIScore {score}', meta: '{amount} · {days} po terminie · odsetki {interest} · rekompensata {rekomp}',
    goal: 'Cel rozmowy', opening: 'Otwarcie', args: 'Argumenty', objections: 'Reakcje na wymówki', closing: 'Zamknięcie', scriptNote: '',
    resultKicker: 'Po rozmowie — zarejestruj wynik', resultHelper: 'Wynik trafia do historii sprawy i sterowania agentem (kolejne kroki, ton, eskalacja).',
    outcome: 'Wynik', promised: 'Obiecany termin (opcjonalnie)', note: 'Notatka', notePh: 'Z kim rozmawiano, co ustalono…', save: 'Zapisz wynik', back: '← Wróć do sprawy',
  },
  admin: {
    stats: { clients: 'Klienci', cases: 'Sprawy', collections: 'Zlecone windykacje', bought: 'Wykupione' },
    usersKicker: 'Użytkownicy', usersHelper: 'Konta klientów i administratorów. Store w pamięci — po restarcie pozostają tylko konta seedowane (produkcja: PostgreSQL).',
    th: { company: 'Firma', email: 'E-mail', nip: 'NIP', role: 'Rola', twofa: '2FA', invoice: 'Faktura', amount: 'Kwota', status: 'Status' },
    on: 'Włączone', off: 'Brak', casesKicker: 'Sprawy — status akcji', stCollect: 'Windykacja', stSold: 'Sprzedana',
    leadsLabel: 'Leady — formularz „Sprzedaj fakturę”', noLeads: 'Brak leadów.', leadLine: '{kwota} · {dni} dni · wstępnie {pct}%', leadNip: 'NIP dłużnika: {nip}',
    eventsLabel: 'Zdarzenia monitoringu', system: 'system', secLabel: 'Bezpieczeństwo',
    sec: ['Hasła: bcrypt (koszt 12)', '2FA: TOTP, obowiązkowe dla admina i nowych kont', 'Blokada: 5 nieudanych prób → 15 minut', 'Sesje: httpOnly, sameSite=lax'],
    integrLabel: 'Integracje', integrOn: 'Aktywne', integrOff: 'Brak', notSet: 'nie ustawiono',
    integr: { resend: 'Resend — e-mail z formularzy', from: 'Nadawca', notify: 'Powiadomienia o leadach →', live: 'Wysyłka do dłużników (LIVE_COMMS)', sms: 'SMSAPI — SMS', ai: 'Anthropic — teksty AI', db: 'PostgreSQL', turnstile: 'Cloudflare Turnstile — antybot na formularzach' },
    testMail: 'Wyślij testowy e-mail', testMailResult: 'Test e-mail', testMailHint: 'Wysyła wiadomość na adres MAIL_NOTIFY przez Resend.',
  },
};

// ── EN ───────────────────────────────────────────────────────────────────
const DICT = {
  // fasen / statussen
  'Nowa · analiza AI': 'New · AI analysis', 'Monitoring': 'Monitoring', 'Przypomnienia': 'Reminders', 'Negocjacje AI': 'AI negotiation',
  'Eskalacja': 'Escalation', 'Rekomendacja: sprzedaż': 'Recommendation: sell', 'Harmonogram rat': 'Instalment schedule',
  'email': 'e-mail', 'sms': 'SMS', 'telefon': 'phone', 'symulacja': 'simulation', 'wysłano': 'sent', 'zarejestrowano': 'logged', 'błąd': 'error',
  // tijdlijn
  'Faktura zaimportowana z KSeF': 'Invoice imported from KSeF', 'Scoring B · prognoza 91% w 21 dni': 'Score B · 91% forecast within 21 days',
  'Pierwsze przypomnienie e-mail': 'First e-mail reminder', 'Scoring dłużnika: ryzyko niskie': 'Debtor score: low risk',
  'Uprzejme przypomnienie e-mail': 'Polite e-mail reminder', 'Zaplanowano telefon AI': 'AI call scheduled',
  'Przypomnienie e-mail — odczytane': 'E-mail reminder — read', 'SMS do działu księgowości': 'SMS to the accounts department',
  'Nota odsetkowa w przygotowaniu': 'Interest note in preparation', 'Dwa przypomnienia — bez wpłaty': 'Two reminders — no payment',
  'Rozmowa AI: dłużnik proponuje raty': 'AI call: debtor proposes instalments', 'Agent analizuje harmonogram rat': 'Agent reviewing the instalment schedule',
  'Trzy przypomnienia — bez reakcji': 'Three reminders — no response', 'Rozmowa AI z księgowością dłużnika': "AI call with the debtor's accounts department",
  'Nota: rekompensata + odsetki': 'Note: recovery fee + interest', 'Zapowiedź wpisu do KRD': 'KRD listing notice',
  'Pełna ścieżka polubowna — bez wpłaty': 'Full amicable route — no payment', 'Scoring: ryzyko niewypłacalności wysokie': 'Score: high insolvency risk',
  'Agent rekomenduje sprzedaż wierzytelności': 'Agent recommends selling the claim',
  // feed
  'Wysłano uprzejme przypomnienie e-mail — otwarte po 11 minutach': 'Polite e-mail reminder sent — opened after 11 minutes',
  'Rozmowa AI: dłużnik potwierdza raty 3× — harmonogram wysłany do akceptacji': 'AI call: debtor confirms 3 instalments — schedule sent for approval',
  'Wystawiono notę obciążeniową: rekompensata 300 zł + odsetki 597 zł': 'Debit note issued: 300 zł recovery fee + 597 zł interest',
  'Scoring zaktualizowany: ryzyko wysokie — rekomendacja sprzedaży wierzytelności': 'Score updated: high risk — recommendation to sell the claim',
  'Nowa faktura z KSeF — sprawa założona automatycznie, scoring B': 'New invoice from KSeF — case opened automatically, score B',
  'Ostatnie wezwanie przed wpisem do KRD — czeka na Twoją zgodę': 'Final demand before KRD listing — awaiting your approval',
  // negotiatiethread
  'Dłużnik · odpowiedź · 30 cze': 'Debtor · reply · 30 Jun', 'Agent AI · rozmowa tel. · 30 cze': 'AI agent · phone call · 30 Jun',
  'Agent AI · e-mail · 18 cze': 'AI agent · e-mail · 18 Jun', 'Agent AI · nota · 8 lip': 'AI agent · note · 8 Jul',
  'Dzień dobry, uprzejmie przypominamy o fakturze FV 2026/06/089 na 12 400 zł. Czy możemy liczyć na wpłatę w tym tygodniu?': 'Good morning, this is a friendly reminder about invoice FV 2026/06/089 for 12 400 zł. Can we count on payment this week?',
  'Termin płatności FV 2026/06/089 (12 400 zł) minął 44 dni temu. Wzywamy do zapłaty w ciągu 7 dni — po tym terminie naliczymy rekompensatę i zgłosimy wpis do KRD.': 'The due date of FV 2026/06/089 (12 400 zł) passed 44 days ago. We demand payment within 7 days — after that we will charge the recovery fee and file a KRD listing.',
  'Na podstawie art. 4a i 7 ustawy z 8.03.2013 r. wzywamy do zapłaty FV 2026/06/089 wraz z odsetkami ustawowymi za opóźnienie (14% rocznie) oraz rekompensatą ok. 300 zł.': 'Pursuant to arts. 4a and 7 of the Act of 8 March 2013, we demand payment of FV 2026/06/089 together with statutory late-payment interest (14% p.a.) and a recovery fee of approx. 300 zł.',
  'Mamy przejściowe problemy z płynnością. Czy możliwe jest rozłożenie na raty?': 'We have temporary liquidity problems. Could the amount be split into instalments?',
  'Uzgodniono 3 raty po 4 133 zł, pierwsza do 15 lipca. Harmonogram wysłany do podpisu — uznanie długu przerywa bieg przedawnienia.': '3 instalments of 4 133 zł agreed, the first due 15 July. Schedule sent for signature — acknowledging the debt interrupts the limitation period.',
  'Pierwsza rata nie wpłynęła. Wystawiono notę: rekompensata 300 zł + odsetki 597 zł. Za 6 dni zapowiedź wpisu do KRD — czeka na Twoją zgodę.': 'The first instalment has not arrived. Note issued: 300 zł recovery fee + 597 zł interest. KRD listing notice in 6 days — awaiting your approval.',
  // AIScore-signalen en rekomendacje
  'KRZ: postępowanie upadłościowe': 'KRZ: bankruptcy proceedings', 'KRZ: otwarta restrukturyzacja': 'KRZ: restructuring opened',
  'KRZ: umorzona egzekucja (bezskuteczna)': 'KRZ: enforcement discontinued (ineffective)', 'KRZ: brak wpisów': 'KRZ: no entries',
  'MF: podatnik VAT nieaktywny': 'MF: VAT taxpayer inactive', 'MF: czynny podatnik VAT': 'MF: active VAT taxpayer',
  'KRS: firma młodsza niż 2 lata': 'KRS: company younger than 2 years', 'Koncentracja: kwota ≥ 50 tys. zł': 'Concentration: amount ≥ 50k zł',
  'Ścieżka polubowna — wysokie prawdopodobieństwo odzyskania.': 'Amicable route — high probability of recovery.',
  'Ryzyko podwyższone — rekomendacja: sprzedaż wierzytelności.': 'Elevated risk — recommendation: sell the claim.',
  'Sprawa praktycznie nieściągalna — rekomendacja: zamknięcie i odpis.': 'Practically uncollectable — recommendation: close and write off.',
};

const MONTHS = { sty: 'Jan', lut: 'Feb', mar: 'Mar', kwi: 'Apr', maj: 'May', cze: 'Jun', lip: 'Jul', sie: 'Aug', wrz: 'Sep', 'paź': 'Oct', lis: 'Nov', gru: 'Dec' };

// Regels voor variabele teksten (getallen/datums erin)
const RULES = [
  [/^(\d+) dni po terminie$/, '$1 days overdue'],
  [/^Historia: płaci śr\. (\d+) dni po terminie$/, 'History: pays on average $1 days late'],
  [/^za (\d+) dni$/, 'in $1 days'],
  [/^Nowy lead sprzedamfakture\.pl: (.*) · (\d+) dni · wstępnie (\d+)%(.*)$/, 'New lead sprzedamfakture.pl: $1 · $2 days · preliminary $3%$4'],
  [/^Rozmowa telefoniczna: (.*)$/, 'Phone call: $1'],
];

// Losse fragmenten binnen langere dynamische teksten (events van de monitor e.d.)
const FRAGMENTS = [
  // events van comms/aiscore (dynamisch, met namen en bedragen)
  ['Przypomnienie o płatności — faktura', 'Payment reminder — invoice'], ['Wezwanie do zapłaty — faktura', 'Demand for payment — invoice'],
  ['Ostateczne przedsądowe wezwanie do zapłaty —', 'Final pre-court demand for payment —'], ['dni po terminie', 'days overdue'],
  ['(Uprzejmy)', '(Polite)'], ['(Stanowczy)', '(Firm)'], ['(Prawniczy)', '(Legal)'], [') do +', ') to +'],
  ['— symulacja', '— simulation'], ['— wysłano', '— sent'], ['— błąd', '— error'], ['Rozmowa telefoniczna:', 'Phone call:'],
  ['monitoring uruchomiony', 'monitoring started'], ['dłużników, interwał', 'debtors, interval'], ['rozmowa własna', 'own call'], ['szablon + Resend', 'template + Resend'],
  ['Nowe obwieszczenie: otwarcie postępowania restrukturyzacyjnego', 'New announcement: restructuring proceedings opened'],
  ['Wzmianka w MSiG: zwołanie zgromadzenia wierzycieli kontrahenta', "MSiG mention: creditors' meeting convened"],
  ['Nowe obwieszczenie: ogłoszenie upadłości', 'New announcement: bankruptcy declared'], ['Zmiana AIScore:', 'AIScore change:'],
  ['MF biała lista', 'MF white list'], ['(niedostępna)', '(unavailable)'],
  ['postępowanie upadłościowe', 'bankruptcy proceedings'], ['otwarta restrukturyzacja', 'restructuring opened'], ['umorzona egzekucja', 'enforcement discontinued'],
  ['brak wpisów', 'no entries'], ['podatnik VAT nieaktywny', 'VAT taxpayer inactive'], ['czynny podatnik VAT', 'active VAT taxpayer'],
  ['AIScore przeliczony', 'AIScore recalculated'], ['rekomendacja: zamknięcie', 'recommendation: close'], ['rekomendacja: sprzedaż', 'recommendation: sell'],
  ['Obietnica zapłaty', 'Promise to pay'], ['Uzgodniono raty', 'Instalments agreed'], ['Faktura sporna', 'Invoice disputed'], ['Odmowa zapłaty', 'Refusal to pay'], ['Brak kontaktu', 'No contact'],
  ['mail: wysłano', 'mail: sent'], ['mail: symulacja', 'mail: simulation'], ['/ wysłano', '/ sent'], ['/ symulacja', '/ simulation'],
  ['brak MAIL_NOTIFY', 'MAIL_NOTIFY not set'], ['brak adresata', 'no recipient'], ['błąd sieci', 'network error'], ['błąd ', 'error '], ['błąd:', 'error:'],
  ['termin:', 'date:'], ['dziś', 'today'], ['jutro', 'tomorrow'],
];

function trEn(s) {
  if (s == null) return s;
  const str = String(s);
  if (DICT[str] !== undefined) return DICT[str];
  let out = str;
  for (const [re, rep] of RULES) if (re.test(out)) { out = out.replace(re, rep); break; }
  for (const [a, b] of FRAGMENTS) out = out.split(a).join(b);
  // datums: "13 lip", "maj–cze", "dziś 12:14"
  out = out.replace(/(sty|lut|mar|kwi|maj|cze|lip|sie|wrz|paź|lis|gru)/g, (m) => MONTHS[m] || m);
  out = out.replace(/za (d+) dni/g, 'in $1 days').replace(/(d+) dni/g, '$1 days');
  return out;
}

const en = {
  locale: 'en-GB',
  days: (n) => n + (n === 1 ? ' day' : ' days'),
  tr: trEn,
  nav: { admin: 'Admin', panel: 'Panel', logout: 'Log out', tabs: { sprawy: 'Cases', nowa: 'New case', agent: 'AI agent', wykup: 'Buy-out' } },
  titles: { login: 'Log in', register: 'Register', twofa: 'Verification', twofaSetup: '2FA setup', sprawy: 'Cases', nowa: 'New case', agent: 'AI agent', wykup: 'Claim buy-out', rozmowa: 'Call', admin: 'Admin' },
  tones: { Uprzejmy: 'Polite', Stanowczy: 'Firm', Prawniczy: 'Legal' },
  outcomes: { obietnica: 'Promise to pay', raty: 'Instalments agreed', sporna: 'Invoice disputed', odmowa: 'Refusal to pay', brak: 'No contact' },
  msg: {
    tooMany: 'Too many failed attempts. Try again in 15 minutes.', badCreds: 'Invalid e-mail or password.', sessionErr: 'Session error — please try again.',
    fillCompanyEmail: 'Enter your company name and e-mail.', exists: 'An account with this address already exists. Please log in.',
    pwLen: 'The password must be at least 10 characters long.', pwChars: 'The password must contain a lower-case letter, an upper-case letter and a digit.', pwMismatch: 'The passwords do not match.',
    badCodeRetry: 'Invalid code — try again.', tooManyCodes: 'Too many attempts. Try again in 15 minutes.', badCode: 'Invalid code.',
    flashEmail: 'E-mail', flashSms: 'SMS', flashCall: 'Call',
    captcha: 'Bot check failed — please try again.',
  },
  login: {
    kicker: 'Client panel', h: 'Log in', helper: 'Access to your cases, the AI agent and buy-out offers.', email: 'E-mail', password: 'Password', btn: 'Log in',
    noAccount: "Don't have an account?", register: 'Register your company',
    note: 'Protected login: hashed passwords (bcrypt), two-factor verification (TOTP), lockout after 5 failed attempts.',
    demoTitle: 'Demo account', demoText: 'For testing, no 2FA:', demoFill: 'Fill in demo details',
  },
  register: {
    kicker: 'New account', h: 'Register your company',
    helper: 'After registering you will set up two-factor verification (an app such as Google Authenticator) — mandatory to protect your receivables.',
    company: 'Company name', nip: 'NIP (optional)', email: 'E-mail', password: 'Password (min. 10 characters, lower and upper case, a digit)', password2: 'Repeat password',
    btn: 'Create account', have: 'Already have an account?', login: 'Log in',
  },
  twofa: {
    kicker: 'Two-factor verification', h: 'Enter the code', helper: 'Open your authenticator app and enter the current 6-digit code.',
    code: 'Code from the app', btn: 'Verify', cancel: 'Cancel and log out',
  },
  twofaSetup: {
    kicker: 'Two-factor verification', h: 'Set up 2FA',
    helper: 'Scan the QR code in your authenticator app (Google Authenticator, Microsoft Authenticator, Aegis), then enter the 6-digit code to confirm.',
    qrAlt: 'TOTP QR code', manual: 'Manual key (if you cannot scan)', code: 'Code from the app', btn: 'Confirm and enable 2FA',
  },
  sprawy: {
    stats: { portfolio: 'Overdue portfolio', active: 'Active cases', amicable: 'Settled amicably', avgTime: 'Avg. recovery time', avgTimeVal: '18 days' },
    importKsef: 'Import from KSeF', upload: 'Upload XML / PDF',
    kicker: 'Cases', helper: "The AI agent reads every imported invoice and opens the case itself. Click a row to see the agent's actions.",
    th: { invoice: 'Invoice', debtor: 'Debtor', amount: 'Amount', overdue: 'Overdue', agent: 'AI agent' },
    caseKicker: 'Case {nr} · AIScore {score} · grade {grade}', meta: '{days} overdue · interest accrued: {interest}',
    aiLabel: 'AIScore — public-data analysis', grade: 'grade {grade}',
    channelsLabel: 'Agent actions — channels', emailBtn: 'E-mail', smsBtn: 'SMS', callBtn: 'Call — script',
    channelsHelper: 'E-mail and SMS are generated by the AI agent in the chosen tone; you make the call yourself — with a script and outcome logging.',
    commsLabel: 'Communication history', actionsLabel: 'AI agent actions',
    close: { h: 'Close the case — uncollectable claim', p: 'AIScore {score}: KRZ entries indicate no realistic chance of recovery. Writing it off lets you book the loss for tax purposes (art. 16(1)(25) CIT Act) instead of paying for collection.', btn: 'Close and write off' },
    collect: { h: 'Debt collection — you pay only the service fee', p: 'Interest at 14%, the {rekomp} zł recovery fee and costs are charged to the debtor. The recovered amount goes to you in full.', btn: 'Order collection — {fee} zł' },
    sell: { h: 'Or sell the claim', p: 'AI agent valuation: {pct}% of face value. Payout within 24 hours, the risk passes to us.', btn: 'Accept the offer — {amount}' },
    done: { collect: 'Collection ordered — the AI agent has taken over the case.', close: 'Case closed — claim written off (AI recommendation).', sell: 'Offer accepted — payout within 24 hours.' },
  },
  nowa: {
    k1: '01 · Source', h1: 'Three ways to open a case — pick the one that suits you.',
    sources: [
      ['KSeF — sync', 'Auto', 'Every overdue invoice appears here automatically.'],
      ['XML / PDF file', 'Manual', 'Drag the invoice here — the AI agent reads the data and opens the case.'],
      ['E-mail', 'Forward', 'Forward the invoice to sprawy@sprzedamfakture.pl — the agent takes it from there.'],
    ],
    k2: '02 · AI analysis', h2: 'Example: this is how the agent reads a freshly imported invoice.',
    fields: { debtor: 'Debtor', nip: 'NIP', amount: 'Amount', due: 'Due date', dueVal: '12 Jul · 5 days overdue' },
    signals: ['KRD / BIG: no entries, KRS active', 'History: pays on average 12 days late', 'AIScore 83 · grade B · 91% recovery forecast within 21 days'],
    k3: '03 · Decision', h3: 'Agent recommendation: amicable route — high probability of quick payment.',
    run: { h: 'Start the AI agent', p: 'Monitoring, reminders, negotiation and escalation — 14% interest, the 300 zł recovery fee and costs are charged to the debtor.', btn: 'Start — {fee} zł' },
    sell: { h: 'Or sell right away', p: 'AI agent valuation: 86% of face value. Payout within 24 hours, the risk passes to us.', btn: 'Accept the offer — 20 124 zł' },
    done: { collect: 'AI agent started — first reminder tomorrow at 9:00.', sell: 'Offer accepted — assignment ready for signature, payout within 24 hours.' },
  },
  agent: {
    monKicker: 'Monitoring — live public data',
    monHelper: 'The agent continuously checks KRZ, MSiG and the VAT white list for every debtor in the database. A new announcement = an event + AIScore recalculation.',
    noEvents: 'No events — monitoring active.', todayKicker: "Today — the agent's work",
    todayHelper: 'Every action logged, every step visible — key decisions always with your approval.',
    negKicker: 'Negotiation — FV 2026/06/089 · TransLog Polska S.A.', toneLabel: 'Agent tone', rulesLabel: 'Agent rules',
    rules: ['Communication tone: {tone}', 'Contact: business days 8:00–18:00, PL / EN', 'KRD listing and lawsuit: always with your approval', 'Every step logged in the case history'],
  },
  wykup: {
    kicker: 'Claim buy-out',
    intro: "The AI agent prices every claim live — based on the debtor's score, payment history and case stage. Accept the offer, sign the assignment online, and the money is yours within 24 hours. The insolvency risk passes to us.",
    th: { invoice: 'Invoice', debtor: 'Debtor', amount: 'Amount', aiscore: 'AIScore', offer: 'AI offer' },
    sold: 'Sold · payout within 24 h', accept: 'Accept',
    note: 'The assignment covers the principal and interest. The recovery fee (170/300/430 zł) is non-transferable by law — with service collection the agent claims it on your behalf.',
  },
  rozmowa: {
    kicker: 'Call preparation · {nr} · AIScore {score}', meta: '{amount} · {days} overdue · interest {interest} · recovery fee {rekomp}',
    goal: 'Call objective', opening: 'Opening', args: 'Arguments', objections: 'Handling objections', closing: 'Closing',
    scriptNote: "The script is in Polish — the debtor's language.",
    resultKicker: 'After the call — log the outcome', resultHelper: 'The outcome goes into the case history and steers the agent (next steps, tone, escalation).',
    outcome: 'Outcome', promised: 'Promised date (optional)', note: 'Note', notePh: 'Who you spoke to, what was agreed…', save: 'Save outcome', back: '← Back to the case',
  },
  admin: {
    stats: { clients: 'Clients', cases: 'Cases', collections: 'Collections ordered', bought: 'Bought out' },
    usersKicker: 'Users', usersHelper: 'Client and admin accounts. In-memory store — after a restart only seeded accounts remain (production: PostgreSQL).',
    th: { company: 'Company', email: 'E-mail', nip: 'NIP', role: 'Role', twofa: '2FA', invoice: 'Invoice', amount: 'Amount', status: 'Status' },
    on: 'Enabled', off: 'None', casesKicker: 'Cases — action status', stCollect: 'Collection', stSold: 'Sold',
    leadsLabel: 'Leads — "Sell an invoice" form', noLeads: 'No leads.', leadLine: '{kwota} · {dni} days · preliminary {pct}%', leadNip: 'Debtor NIP: {nip}',
    eventsLabel: 'Monitoring events', system: 'system', secLabel: 'Security',
    sec: ['Passwords: bcrypt (cost 12)', '2FA: TOTP, mandatory for admin and new accounts', 'Lockout: 5 failed attempts → 15 minutes', 'Sessions: httpOnly, sameSite=lax'],
    integrLabel: 'Integrations', integrOn: 'Active', integrOff: 'None', notSet: 'not set',
    integr: { resend: 'Resend — form e-mails', from: 'Sender', notify: 'Lead notifications →', live: 'Sending to debtors (LIVE_COMMS)', sms: 'SMSAPI — SMS', ai: 'Anthropic — AI texts', db: 'PostgreSQL', turnstile: 'Cloudflare Turnstile — bot protection on forms' },
    testMail: 'Send a test e-mail', testMailResult: 'Test e-mail', testMailHint: 'Sends a message to the MAIL_NOTIFY address via Resend.',
  },
};

// kleine helper voor {placeholders}
function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
}

module.exports = { pl, en, fill };
