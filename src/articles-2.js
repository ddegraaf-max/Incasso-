// sprzedamfakture.pl — baza wiedzy, deel 2: commerciële en praktische artikelen (PL + EN)
// Zelfde structuur als src/articles.js; wordt daar vooraan in ARTICLES gezet (unshift).
module.exports = [
  {
    slug: 'skup-faktur-jak-dziala-ile-kosztuje', date: '2026-09-28', updated: '2026-09-28',
    related: ['sprzedaz-faktury-cesja-a-faktoring', 'rekompensata-40-70-100-euro', 'jak-sprawdzic-kontrahenta-krs-biala-lista-krz'],
    pl: {
      seoTitle: 'Skup faktur — jak działa i ile kosztuje',
      title: 'Skup faktur — jak działa, ile kosztuje i kiedy sprzedaż przeterminowanej faktury się opłaca',
      desc: 'Skup faktur krok po kroku: zgłoszenie, wycena, cesja online, wypłata w 24 h. Od czego zależy cena, czym różni się od faktoringu i windykacji, kiedy się opłaca.',
      lead: 'Skup faktur to sprzedaż wierzytelności z przeterminowanej faktury: zamiast czekać na dłużnika, dostajesz gotówkę teraz, a ryzyko przechodzi na nabywcę. Poniżej cały proces, czynniki ceny i sytuacje, w których to najlepsza decyzja.',
      sections: [
        { h: 'Jak działa skup faktur', ul: [
          '<strong>Zgłoszenie</strong> — podajesz kwotę, liczbę dni po terminie i NIP dłużnika; wstępną wycenę widzisz od razu.',
          '<strong>Weryfikacja dłużnika</strong> — sprawdzamy rejestry publiczne: białą listę VAT, KRS (w tym dział 4 i 6: zaległości, egzekucje, likwidacja, upadłość), KRZ i MSiG, a także historię i opinie w internecie.',
          '<strong>Oferta</strong> — konkretny procent wartości nominalnej, zwykle w ciągu kilku godzin roboczych, bez zobowiązań.',
          '<strong>Cesja online</strong> — umowa przelewu wierzytelności (art. 509 KC) podpisywana elektronicznie; dłużnik dostaje zawiadomienie z nowym rachunkiem do zapłaty.',
          '<strong>Wypłata</strong> — w ciągu 24 godzin od podpisania. Od tej chwili dochodzeniem należności zajmuje się nabywca, na własne ryzyko.',
        ] },
        { h: 'Ile kosztuje — od czego zależy cena', p: ['Skup faktur nie ma opłaty: „kosztem” jest różnica między wartością nominalną a ceną. Cena zależy przede wszystkim od:'], ul: [
          '<strong>wieku długu</strong> — faktura 30 dni po terminie jest warta więcej niż ta sprzed roku;',
          '<strong>profilu dłużnika</strong> — forma prawna, kapitał, status VAT, wpisy w KRZ/KRS, historia płatnicza; spółka z o.o. z czystymi rejestrami i majątkiem to inna cena niż JDG bez majątku;',
          '<strong>dokumentacji</strong> — faktura, umowa lub zamówienie, dowód dostawy, korespondencja; uznanie długu przez dłużnika podnosi wartość;',
          '<strong>ryzyka prawnego</strong> — zakaz cesji w umowie, spór co do jakości, potrącenia, bieg przedawnienia;',
          '<strong>kwoty</strong> — większe wierzytelności wobec solidnych dłużników wyceniamy korzystniej.',
        ], p2: ['Orientacyjnie: świeże, dobrze udokumentowane faktury wobec wypłacalnych spółek osiągają najwyższe wyceny; im starszy dług i słabszy dłużnik, tym niżej. <a href="/skup-wyrokow">Stare wyroki</a> po umorzonej egzekucji to zwykle 10–40% nominału.'] },
        { h: 'Co przechodzi na nabywcę, a co zostaje', ul: [
          'Przechodzi <strong>należność główna z odsetkami</strong> za opóźnienie (art. 509 § 2 KC) — nabywca dochodzi ich od dłużnika.',
          'Zostaje u Ciebie <strong>rekompensata 40/70/100 €</strong> — jest z mocy ustawy niezbywalna (art. 10 ust. 4 ustawy z 2013 r.).',
          'Nie odpowiadasz za <strong>wypłacalność dłużnika</strong> — tylko za to, że wierzytelność istnieje i nie jest sporna (art. 516 KC). Sprzedaż bez regresu: pieniędzy nie oddajesz, jeśli dłużnik nie zapłaci.',
        ] },
        { h: 'Skup faktur a faktoring i windykacja', p: [
          '<strong>Faktoring</strong> finansuje bieżące, nieprzeterminowane faktury w ramach umowy ramowej i prowizji; przy faktoringu z regresem ryzyko zostaje u Ciebie. <strong>Windykacja na zlecenie</strong> odzyskuje dług w Twoim imieniu za opłatę lub prowizję, ale pieniądze przychodzą dopiero, gdy dłużnik zapłaci. <strong>Skup faktury</strong> zamyka temat od razu: jedna umowa, gotówka w 24 godziny, ryzyko po stronie nabywcy. Więcej w poradniku <a href="/baza-wiedzy/sprzedaz-faktury-cesja-a-faktoring">cesja a faktoring</a>.',
        ] },
        { h: 'Kiedy sprzedaż faktury się opłaca', ul: [
          'gdy płynność jest ważniejsza niż ostatnie kilkanaście procent nominału — pensje, ZUS, dostawcy nie czekają;',
          'gdy nie masz czasu ani zespołu na wezwania, negocjacje i sąd;',
          'gdy dłużnik zwleka, ale jest wypłacalny — wtedy cena jest najlepsza;',
          'gdy chcesz zamknąć zły dług księgowo i podatkowo zamiast ciągnąć sprawę latami.',
        ] },
      ],
      faq: [
        ['Czy dłużnik dowie się o sprzedaży faktury?', 'Tak — po cesji dłużnik otrzymuje zawiadomienie o przelewie z nowym rachunkiem (art. 512 KC). Dopóki nie zostanie zawiadomiony, może skutecznie płacić Tobie.'],
        ['Czy potrzebuję zgody dłużnika?', 'Nie, chyba że umowa z dłużnikiem zawiera zakaz cesji. Sprawdź to przed zgłoszeniem — zakaz cesji wyklucza sprzedaż.'],
        ['Co ze sporną fakturą?', 'Fakturę, którą dłużnik kwestionuje co do zasady (jakość, brak dostawy), zwykle wyceniamy znacznie niżej albo proponujemy windykację na zlecenie zamiast skupu.'],
        ['Jak szybko dostanę pieniądze?', 'Wypłata następuje w ciągu 24 godzin od podpisania cesji online. Od zgłoszenia do oferty mija zazwyczaj kilka godzin roboczych.'],
      ],
      cta: { href: '/#wycena' },
    },
    en: {
      seoTitle: 'Selling invoices in Poland — how it works',
      title: 'Selling a Polish invoice — how invoice purchase works, what it costs and when it pays off',
      desc: 'Invoice purchase step by step: request, valuation, online assignment, payout in 24 h. What drives the price and how it differs from factoring and collection.',
      lead: 'Invoice purchase means selling the receivable from an overdue invoice: instead of waiting for the debtor you get cash now, and the risk passes to the buyer. Here is the full process, the price factors and the situations where it is the best decision.',
      sections: [
        { h: 'How invoice purchase works', ul: [
          '<strong>Request</strong> — you enter the amount, days overdue and the debtor’s NIP; a preliminary valuation appears immediately.',
          '<strong>Debtor check</strong> — we verify the public registers: the VAT white list, KRS (including sections 4 and 6: tax arrears, enforcement, liquidation, bankruptcy), KRZ and MSiG, plus history and reviews online.',
          '<strong>Offer</strong> — a concrete percentage of face value, usually within a few business hours, without obligation.',
          '<strong>Online assignment</strong> — an assignment agreement (art. 509 Civil Code) signed electronically; the debtor is notified with the new account for payment.',
          '<strong>Payout</strong> — within 24 hours of signing. From then on the buyer pursues the claim at its own risk.',
        ] },
        { h: 'What it costs — the price factors', p: ['There is no fee: the “cost” is the difference between face value and price. The price depends mainly on:'], ul: [
          '<strong>age of the debt</strong> — an invoice 30 days overdue is worth more than one from a year ago;',
          '<strong>the debtor’s profile</strong> — legal form, capital, VAT status, KRZ/KRS entries, payment history; a limited company with clean registers and assets prices differently from a sole trader without assets;',
          '<strong>documentation</strong> — invoice, contract or order, proof of delivery, correspondence; an acknowledgement of the debt raises the value;',
          '<strong>legal risk</strong> — a non-assignment clause, quality disputes, set-offs, the limitation period;',
          '<strong>amount</strong> — larger claims against solid debtors are priced more favourably.',
        ], p2: ['As a rule of thumb: fresh, well-documented invoices against solvent companies get the highest valuations; the older the debt and the weaker the debtor, the lower. <a href="/skup-wyrokow">Old judgments</a> after discontinued enforcement typically fetch 10–40% of face value.'] },
        { h: 'What passes to the buyer and what stays with you', ul: [
          'The <strong>principal with late-payment interest</strong> passes (art. 509 § 2) — the buyer claims them from the debtor.',
          'The <strong>EUR 40/70/100 recovery fee</strong> stays with you — it is non-assignable by law (art. 10(4) of the 2013 Act).',
          'You are not liable for the <strong>debtor’s solvency</strong> — only for the receivable existing and being undisputed (art. 516). Non-recourse: you do not repay if the debtor defaults.',
        ] },
        { h: 'Invoice purchase vs factoring and collection', p: [
          '<strong>Factoring</strong> finances current, not-yet-overdue invoices under a framework agreement with fees; with recourse factoring the risk stays with you. <strong>Collection on your behalf</strong> recovers the debt in your name for a fee or commission, but the money arrives only when the debtor pays. <strong>Selling the invoice</strong> closes the matter at once: one agreement, cash within 24 hours, risk on the buyer. More in our guide <a href="/baza-wiedzy/sprzedaz-faktury-cesja-a-faktoring">assignment vs factoring</a>.',
        ] },
        { h: 'When selling pays off', ul: [
          'when liquidity matters more than the last few percent of face value — wages, taxes and suppliers do not wait;',
          'when you have neither the time nor the team for demands, negotiations and court;',
          'when the debtor is slow but solvent — that is when the price is best;',
          'when you want to close a bad debt for accounting and tax purposes instead of dragging it on for years.',
        ] },
      ],
      faq: [
        ['Will the debtor learn that the invoice was sold?', 'Yes — after the assignment the debtor receives a notification with the new account (art. 512). Until notified, the debtor can validly pay you.'],
        ['Do I need the debtor’s consent?', 'No, unless the contract with the debtor contains a non-assignment clause. Check this before submitting — such a clause rules out a sale.'],
        ['What about a disputed invoice?', 'An invoice the debtor disputes on the merits (quality, non-delivery) is usually priced much lower, or we propose collection on your behalf instead of a purchase.'],
        ['How fast do I get the money?', 'Payout follows within 24 hours of signing the online assignment. From request to offer usually takes a few business hours.'],
      ],
      cta: { href: '/#wycena' },
    },
  },

  {
    slug: 'jak-sprawdzic-kontrahenta-krs-biala-lista-krz', date: '2026-09-28', updated: '2026-09-28',
    related: ['skup-faktur-jak-dziala-ile-kosztuje', 'wpis-dluznika-do-krd-big', 'przedawnienie-faktury-b2b'],
    pl: {
      seoTitle: 'Jak sprawdzić kontrahenta za darmo',
      title: 'Jak sprawdzić kontrahenta za darmo: KRS, biała lista VAT, KRZ, CEIDG i sygnały ostrzegawcze',
      desc: 'Bezpłatne rejestry do sprawdzenia firmy przed transakcją i windykacją: KRS, CEIDG, biała lista VAT, KRZ, MSiG. Na co patrzeć i jakie sygnały ostrzegają.',
      lead: 'Większość strat na fakturach zaczyna się od kontrahenta, którego nikt nie sprawdził. Pięć bezpłatnych, oficjalnych rejestrów wystarczy, by w kwadrans zobaczyć, z kim masz do czynienia — przed podpisaniem umowy i zanim zdecydujesz, jak odzyskać dług.',
      sections: [
        { h: 'KRS — spółki', p: ['W <strong>eKRS</strong> (ekrs.ms.gov.pl) pobierzesz bezpłatnie odpis aktualny każdej spółki. Sprawdź: datę rejestracji, kapitał zakładowy, kto reprezentuje spółkę i jak (jedno- czy dwuosobowo), przedmiot działalności oraz — najważniejsze — <strong>dział 4</strong> (zaległości podatkowe i ZUS, wierzyciele, egzekucje) i <strong>dział 6</strong> (likwidacja, upadłość, restrukturyzacja). Niedawna zmiana zarządu, adresu lub nazwy tuż przed terminem płatności to sygnał ostrzegawczy.'] },
        { h: 'CEIDG — jednoosobowe działalności', p: ['Dla JDG i wspólników spółek cywilnych: status (aktywna, zawieszona, wykreślona), data rozpoczęcia, adres i zakaz prowadzenia działalności. Pamiętaj, że przedsiębiorca-osoba fizyczna odpowiada całym majątkiem — to plus przy windykacji, ale zawieszona działalność często oznacza brak środków.'] },
        { h: 'Biała lista VAT', p: ['Wykaz podatników VAT Ministerstwa Finansów (podatki.gov.pl) pokazuje, czy firma jest <strong>czynnym podatnikiem</strong>, kiedy została zarejestrowana lub wykreślona, i jakie ma rachunki bankowe. Płatność powyżej 15 000 zł na rachunek spoza listy grozi utratą kosztu podatkowego i odpowiedzialnością solidarną za VAT. Wykreślenie z VAT lub brak rachunków to poważny sygnał.'] },
        { h: 'KRZ i MSiG — niewypłacalność', p: ['<strong>Krajowy Rejestr Zadłużonych</strong> (krz.ms.gov.pl) jest jawny i bezpłatny: upadłości, restrukturyzacje, umorzone egzekucje z powodu bezskuteczności. Otwarta restrukturyzacja zmienia wszystko — zamiast windykacji zgłaszasz wierzytelność w postępowaniu. <strong>Monitor Sądowy i Gospodarczy</strong> publikuje obwieszczenia, m.in. o zwołaniu zgromadzenia wierzycieli.'] },
        { h: 'Poza rejestrami', ul: [
          '<strong>Strona WWW i domena</strong> — czy istnieje, od kiedy, czy e-mail kontrahenta jest w domenie firmy, czy z darmowej poczty;',
          '<strong>Opinie</strong> — Google, GoWork, Aleo, Panorama Firm; szukaj powtarzalnych skarg na płatności;',
          '<strong>Raport z BIG/KRD</strong> — płatny, ale pokazuje zaległości zgłoszone przez innych wierzycieli;',
          '<strong>Sprawozdania finansowe</strong> — spółki składają je do KRS; dostępne bezpłatnie w eKRS (przeglądarka dokumentów finansowych).',
        ] },
        { h: 'Sygnały ostrzegawcze', ul: [
          'wpisy w dziale 4 lub 6 KRS, wykreślenie z VAT, zawieszona działalność;',
          'kapitał zakładowy 5 000 zł, spółka młodsza niż 2 lata, częste zmiany zarządu lub siedziby;',
          'brak strony WWW, kontakt wyłącznie z darmowej poczty, adres w wirtualnym biurze;',
          'prośba o wydłużony termin płatności przy pierwszym zamówieniu.',
        ], p2: ['Tę weryfikację robimy automatycznie dla każdej faktury zgłoszonej do <a href="/baza-wiedzy/skup-faktur-jak-dziala-ile-kosztuje">skupu</a> — wynik decyduje o cenie i o tym, czy windykacja ma sens.'] },
      ],
      faq: [
        ['Czy sprawdzenie firmy w KRS, CEIDG i na białej liście jest darmowe?', 'Tak. Odpis z KRS, wpis w CEIDG, wykaz podatników VAT, KRZ i MSiG są bezpłatne i dostępne online bez rejestracji.'],
        ['Czy mogę sprawdzić firmę w KRD bez jej zgody?', 'Informacje o przedsiębiorcy (nie-konsumencie) można pobrać z biura informacji gospodarczej bez jego zgody, ale wymaga to umowy z biurem i jest płatne.'],
      ],
    },
    en: {
      seoTitle: 'How to check a Polish company for free',
      title: 'How to check a Polish company for free: KRS, VAT white list, KRZ, CEIDG and warning signs',
      desc: 'Free official registers to check a Polish business before a deal or collection: KRS, CEIDG, the VAT white list, KRZ, MSiG. What to look at and the warning.',
      lead: 'Most invoice losses start with a business partner nobody checked. Five free, official registers are enough to see in fifteen minutes whom you are dealing with — before signing a contract and before deciding how to recover a debt.',
      sections: [
        { h: 'KRS — companies', p: ['At <strong>eKRS</strong> (ekrs.ms.gov.pl) you can download a current extract of any company free of charge. Check: registration date, share capital, who represents the company and how (one or two signatures), the business scope and — most importantly — <strong>section 4</strong> (tax and social-security arrears, creditors, enforcement) and <strong>section 6</strong> (liquidation, bankruptcy, restructuring). A recent change of management, address or name just before a payment deadline is a warning sign.'] },
        { h: 'CEIDG — sole traders', p: ['For sole traders and partners of civil-law partnerships: status (active, suspended, deleted), start date, address and any prohibition of business activity. A sole trader is liable with all personal assets — a plus in collection — but a suspended business often means no funds.'] },
        { h: 'The VAT white list', p: ['The Ministry of Finance register (podatki.gov.pl) shows whether a company is an <strong>active VAT payer</strong>, when it was registered or removed, and which bank accounts it holds. Paying more than PLN 15,000 to an account not on the list risks losing the tax deduction and joint VAT liability. Removal from VAT or no accounts at all is a serious signal.'] },
        { h: 'KRZ and MSiG — insolvency', p: ['The <strong>National Register of Debtors</strong> (krz.ms.gov.pl) is public and free: bankruptcies, restructurings, enforcement discontinued for ineffectiveness. An open restructuring changes everything — instead of collecting, you file your claim in the proceedings. The <strong>Court and Commercial Gazette</strong> (MSiG) publishes announcements such as creditors’ meetings.'] },
        { h: 'Beyond the registers', ul: [
          '<strong>Website and domain</strong> — does it exist, since when, is the partner’s e-mail on the company domain or a free provider;',
          '<strong>Reviews</strong> — Google, GoWork, Aleo, Panorama Firm; look for recurring complaints about payments;',
          '<strong>A BIG/KRD report</strong> — paid, but it shows arrears reported by other creditors;',
          '<strong>Financial statements</strong> — companies file them with KRS; available free in the eKRS document browser.',
        ] },
        { h: 'Warning signs', ul: [
          'entries in KRS sections 4 or 6, removal from VAT, a suspended business;',
          'share capital of PLN 5,000, a company younger than 2 years, frequent changes of management or seat;',
          'no website, contact only from a free e-mail account, a virtual-office address;',
          'a request for extended payment terms on the very first order.',
        ], p2: ['We run this verification automatically for every invoice submitted for <a href="/baza-wiedzy/skup-faktur-jak-dziala-ile-kosztuje">purchase</a> — the result drives the price and whether collection makes sense.'] },
      ],
      faq: [
        ['Is checking a company in KRS, CEIDG and the white list free?', 'Yes. The KRS extract, the CEIDG entry, the VAT register, KRZ and MSiG are free and available online without registration.'],
        ['Can I check a company in KRD without its consent?', 'Information on a business (non-consumer) can be obtained from a credit information bureau without its consent, but it requires an agreement with the bureau and is paid.'],
      ],
    },
  },

  {
    slug: 'nota-odsetkowa-wzor', date: '2026-09-28', updated: '2026-09-28',
    related: ['odsetki-za-opoznienie-w-transakcjach-handlowych', 'rekompensata-40-70-100-euro', 'wezwanie-do-zaplaty-wzor'],
    pl: {
      seoTitle: 'Nota odsetkowa — wzór i jak wystawić',
      title: 'Nota odsetkowa i nota obciążeniowa — jak wystawić, co musi zawierać, VAT i księgowanie',
      desc: 'Nota odsetkowa krok po kroku: elementy, wzór, różnica od faktury, VAT (odsetki i rekompensata poza VAT), moment przychodu w podatku dochodowym. Z kalkulatorem.',
      lead: 'Odsetek za opóźnienie i rekompensaty nie fakturujesz — dokumentujesz je notą. To prosty dokument, ale musi zawierać właściwe dane, żeby dłużnik nie miał pretekstu do odmowy, a księgowość mogła go poprawnie ująć.',
      sections: [
        { h: 'Nota, nie faktura', p: ['Odsetki za opóźnienie i rekompensata za koszty odzyskiwania należności nie są wynagrodzeniem za dostawę towaru ani usługę — nie podlegają VAT. Dlatego nie wystawia się na nie faktury, lecz <strong>notę księgową</strong> (odsetkową lub obciążeniową). Nota nie trafia do KSeF ani do JPK_VAT.'] },
        { h: 'Co musi zawierać nota odsetkowa', ul: [
          'numer i data wystawienia, dane wierzyciela i dłużnika (nazwa, NIP, adres);',
          'podstawa: numer i data faktury, kwota, termin płatności, data zapłaty (lub „do dnia wystawienia noty”);',
          'liczba dni opóźnienia, stawka (14% w I półroczu 2026 r.) i podstawa prawna (art. 4a i 7 ustawy z 8 marca 2013 r. — dla transakcji handlowych);',
          'kwota odsetek, ewentualnie rekompensata 40/70/100 € z kursem NBP i kwotą w złotych (art. 10);',
          'termin zapłaty i numer rachunku, podpis osoby wystawiającej.',
        ], p2: ['Kwotę na dowolny dzień policzysz w <a href="/kalkulator">kalkulatorze</a> — wynik możesz od razu przenieść do noty i do <a href="/baza-wiedzy/wezwanie-do-zaplaty-wzor">wezwania do zapłaty</a>.'] },
        { h: 'Kiedy wystawić', p: ['Najczęściej po wpłacie należności głównej po terminie (odsetki „za okres opóźnienia”) albo razem z wezwaniem, na dzień wezwania, z zastrzeżeniem dalszego naliczania do dnia zapłaty. Nota nie jest warunkiem dochodzenia odsetek — one należą się z mocy ustawy — ale porządkuje roszczenie i jest dowodem w sądzie.'] },
        { h: 'Podatek dochodowy i księgowanie', p: ['Odsetki są przychodem dopiero <strong>w momencie otrzymania</strong> — naliczone, ale niezapłacone nie stanowią przychodu (art. 12 ust. 4 pkt 2 CIT, analogicznie w PIT). U dłużnika są kosztem w dacie zapłaty. Rekompensatę ujmuje się na podobnych zasadach, choć praktyka bywa różna — potwierdź z księgową. W księgach nota trafia na pozostałe przychody operacyjne (lub finansowe, zależnie od polityki rachunkowości).'] },
        { h: 'Wzór noty odsetkowej', p: ['<strong>NOTA ODSETKOWA nr 3/2026</strong> z dnia 28.09.2026<br>Wystawca: [Twoja firma, NIP] · Odbiorca: [dłużnik, NIP]<br>Dotyczy: faktura FV 2026/06/089 z 02.06.2026, kwota 12 400,00 zł, termin płatności 16.06.2026<br>Opóźnienie: 104 dni (17.06.2026–28.09.2026) · stawka 14% (art. 4a i 7 ustawy z 8.03.2013 r.)<br>Odsetki: 12 400 × 14% × 104 ÷ 365 = 494,60 zł<br>Rekompensata (art. 10): 70 € × 4,30 zł = 301,00 zł<br><strong>Do zapłaty: 795,60 zł</strong> w terminie 7 dni na rachunek …<br>Podpis'] },
      ],
      faq: [
        ['Czy nota odsetkowa musi być podpisana?', 'Przepisy nie wymagają podpisu do ważności noty jako dokumentu księgowego, ale podpis osoby uprawnionej ułatwia dowód w sądzie. Nota wysłana e-mailem w PDF jest w praktyce wystarczająca.'],
        ['Czy dłużnik może odmówić przyjęcia noty?', 'Odmowa przyjęcia nie uchyla obowiązku zapłaty — odsetki i rekompensata należą się z mocy ustawy. Nota tylko dokumentuje wysokość roszczenia.'],
      ],
    },
    en: {
      seoTitle: 'Interest note in Poland — how to issue one',
      title: 'Interest note and debit note in Poland — how to issue one, what it must contain, VAT and accounting',
      desc: 'The Polish interest note step by step: elements, template, why it is not an invoice, VAT treatment, income-tax timing. With a free calculator.',
      lead: 'Late-payment interest and the recovery fee are not invoiced in Poland — they are documented with a note. A simple document, but it must contain the right data so the debtor has no excuse to refuse and your accountant can book it correctly.',
      sections: [
        { h: 'A note, not an invoice', p: ['Late-payment interest and the fixed recovery fee are not consideration for goods or services — they are outside VAT. That is why they are not invoiced but documented with an <strong>accounting note</strong> (interest note or debit note). The note does not go into the KSeF e-invoicing system or the VAT return.'] },
        { h: 'What an interest note must contain', ul: [
          'number and date of issue, the creditor’s and the debtor’s details (name, NIP, address);',
          'basis: invoice number and date, amount, due date, payment date (or “up to the date of this note”);',
          'days of delay, the rate (14% in the first half of 2026) and the legal basis (arts. 4a and 7 of the Act of 8 March 2013 — for commercial transactions);',
          'the interest amount and, if claimed, the EUR 40/70/100 recovery fee with the NBP rate and the PLN amount (art. 10);',
          'payment deadline and bank account, signature of the issuer.',
        ], p2: ['Our <a href="/kalkulator">calculator</a> gives the amount for any date — copy it into the note and the <a href="/baza-wiedzy/wezwanie-do-zaplaty-wzor">demand for payment</a>.'] },
        { h: 'When to issue it', p: ['Usually after the principal was paid late (interest “for the period of delay”) or together with the demand, as at the date of the demand, reserving further accrual until payment. The note is not a condition for claiming interest — it is due by law — but it structures the claim and serves as evidence in court.'] },
        { h: 'Income tax and bookkeeping', p: ['Interest is taxable income only <strong>when received</strong> — accrued but unpaid interest is not income (art. 12(4)(2) CIT Act, analogously in PIT). For the debtor it is a cost when paid. The recovery fee is treated similarly, although practice varies — confirm with your accountant. In the books the note goes to other operating (or financial) income depending on the accounting policy.'] },
        { h: 'Interest note template', p: ['<strong>INTEREST NOTE no. 3/2026</strong> dated 28.09.2026<br>Issuer: [your company, NIP] · Recipient: [debtor, NIP]<br>Re: invoice FV 2026/06/089 of 02.06.2026, PLN 12,400.00, due 16.06.2026<br>Delay: 104 days (17.06.2026–28.09.2026) · rate 14% (arts. 4a and 7 of the Act of 8 March 2013)<br>Interest: 12,400 × 14% × 104 ÷ 365 = PLN 494.60<br>Recovery fee (art. 10): EUR 70 × 4.30 = PLN 301.00<br><strong>Total due: PLN 795.60</strong> within 7 days to account …<br>Signature'] },
      ],
      faq: [
        ['Does an interest note have to be signed?', 'The law does not require a signature for the note to be valid as an accounting document, but a signature of an authorised person helps as evidence in court. A PDF note sent by e-mail is sufficient in practice.'],
        ['Can the debtor refuse to accept the note?', 'Refusing to accept it does not remove the obligation to pay — interest and the recovery fee are due by law. The note only documents the amount of the claim.'],
      ],
    },
  },
];
