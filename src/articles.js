// sprzedamfakture.pl — baza wiedzy (SEO-artikelen, PL + EN)
//
// Elk artikel: slug (URL), date/updated (sitemap + Article-schema), related (slugs) en per taal:
// title, desc (meta), lead, sections [{ h, p: [...], ul: [...], p2: [...] }], faq [[q, a]], cta.
// Tekst mag eenvoudige HTML bevatten (<strong>, <a href>) — eigen content, gerenderd met <%- %>.
// Stan prawny: wrzesień 2026. Bij wijziging van stawka/przepisy: tekst én `updated` bijwerken.

const ARTICLES = [
  {
    slug: 'odsetki-za-opoznienie-w-transakcjach-handlowych', date: '2026-09-28', updated: '2026-09-29',
    related: ['rekompensata-40-70-100-euro', 'wezwanie-do-zaplaty-wzor', 'przedawnienie-faktury-b2b'],
    pl: {
      title: 'Odsetki ustawowe za opóźnienie w transakcjach handlowych — stawka 2026 i sposób liczenia',
      seoTitle: 'Odsetki za opóźnienie B2B 2026 — jak liczyć',
      desc: 'Ile wynoszą odsetki za opóźnienie w zapłacie faktury B2B w 2026 r. (14%), od kiedy się naliczają i jak je policzyć — z przykładem i kalkulatorem.',
      lead: 'Za każdy dzień zwłoki w zapłacie faktury między firmami wierzycielowi należą się odsetki ustawowe za opóźnienie w transakcjach handlowych. Nie trzeba ich zastrzegać w umowie ani wcześniej wzywać dłużnika — naliczają się z mocy ustawy.',
      sections: [
        { h: 'Jaka stawka obowiązuje w 2026 roku', p: [
          'Stawka to <strong>stopa referencyjna NBP + 10 punktów procentowych</strong> (art. 4 pkt 3 ustawy z 8 marca 2013 r. o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych). Gdy dłużnikiem jest publiczny podmiot leczniczy, dolicza się 8 p.p. Wysokość odsetek ogłasza Minister Finansów obwieszczeniem na każde półrocze — decyduje stopa referencyjna obowiązująca 1 stycznia i 1 lipca.',
          'W I półroczu 2026 r. stawka wynosi <strong>14% w skali roku</strong> (4% + 10 p.p.). Przed wystawieniem noty odsetkowej sprawdź aktualne obwieszczenie — stopa NBP zmienia się częściej, niż większość firm aktualizuje swoje wzory.',
        ] },
        { h: 'Od kiedy i jak liczyć', p: [
          'Odsetki biegną od dnia następnego po terminie płatności do dnia zapłaty włącznie. Wzór jest prosty:',
          '<strong>kwota × stawka × liczba dni ÷ 365</strong>',
          'Przykład: faktura na 12 400 zł, 44 dni po terminie, stawka 14%: 12 400 × 0,14 × 44 ÷ 365 = <strong>209,27 zł</strong>. Jeżeli stawka zmieniła się w trakcie opóźnienia, okres dzieli się na części i każdą liczy się osobno.',
        ] },
        { h: 'Bez wezwania, bez zapisu w umowie', p: [
          'Zgodnie z art. 7 ust. 1 ustawy odsetki przysługują, jeżeli wierzyciel spełnił swoje świadczenie (dostarczył towar, wykonał usługę) i nie otrzymał zapłaty w terminie. Wezwanie nie jest warunkiem — ma jednak sens praktyczny: przypomina dłużnikowi o konsekwencjach i jest dowodem w sądzie.',
          'Ustawa ogranicza też same terminy płatności: w relacjach B2B co do zasady maksymalnie 60 dni, a gdy dłużnikiem jest duży przedsiębiorca, a wierzycielem mikro-, mała lub średnia firma — sztywne 60 dni bez możliwości przedłużenia.',
        ] },
        { h: 'Czego nie wolno pominąć', ul: [
          'Odsetki za opóźnienie w transakcjach handlowych są <strong>wyższe</strong> od „zwykłych” odsetek ustawowych za opóźnienie z Kodeksu cywilnego — między firmami stosuj te z ustawy z 2013 r.',
          'Od odsetek nie nalicza się kolejnych odsetek (art. 482 KC) — dopiero od chwili wytoczenia powództwa.',
          'Razem z odsetkami należy się <a href="/baza-wiedzy/rekompensata-40-70-100-euro">rekompensata 40, 70 lub 100 euro</a> za koszty odzyskiwania należności — od każdej faktury.',
          'Odsetki przedawniają się najpóźniej razem z należnością główną — nie czekaj z ich naliczeniem do ostatniej chwili.',
        ] },
        { h: 'Jak dochodzić odsetek w praktyce', p: [
          'Najprościej: nota odsetkowa (nie faktura — odsetki nie podlegają VAT) wysłana razem z <a href="/baza-wiedzy/wezwanie-do-zaplaty-wzor">wezwaniem do zapłaty</a>. Kwotę na dowolny dzień policzysz w naszym <a href="/kalkulator">kalkulatorze</a>, a gotowe <a href="/wezwanie-online">wezwanie online</a> z odsetkami i rekompensatą wygenerujesz bezpłatnie w 2 minuty.',
          'Jeżeli dłużnik milczy, zostają dwie drogi: windykacja i pozew albo sprzedaż faktury — wtedy odsetki przechodzą na nabywcę razem z należnością główną, a Ty masz gotówkę od razu.',
        ] },
      ],
      faq: [
        ['Czy mogę naliczyć odsetki, jeśli w umowie nic o nich nie ma?', 'Tak. Odsetki ustawowe za opóźnienie w transakcjach handlowych należą się z mocy ustawy, także bez zapisu w umowie i bez wezwania.'],
        ['Czy odsetki liczę od kwoty brutto czy netto?', 'Od kwoty należnej do zapłaty, czyli od brutto — to cała kwota, której dłużnik nie zapłacił w terminie.'],
        ['Jak długo mogę dochodzić odsetek?', 'Odsetki przedawniają się najpóźniej z należnością główną — zwykle po 3 latach (przy sprzedaży 2 lata), z końcem roku kalendarzowego.'],
      ],
    },
    en: {
      title: 'Statutory interest for late payment in Polish B2B transactions — the 2026 rate and how to calculate it',
      seoTitle: 'Late-payment interest in Poland 2026',
      desc: 'How much late-payment interest a Polish business debtor owes in 2026 (14%), from which day it accrues and how to calculate it — with a free calculator.',
      lead: 'For every day a Polish company pays an invoice late, the creditor is entitled to statutory interest for late payment in commercial transactions. It does not have to be agreed in the contract and no prior demand is needed — it accrues by operation of law.',
      sections: [
        { h: 'The rate in 2026', p: [
          'The rate is the <strong>National Bank of Poland reference rate + 10 percentage points</strong> (art. 4(3) of the Act of 8 March 2013 on counteracting excessive delays in commercial transactions). Where the debtor is a public healthcare entity, 8 points are added instead. The Minister of Finance announces the rate for each half-year, based on the reference rate in force on 1 January and 1 July.',
          'In the first half of 2026 the rate is <strong>14% per annum</strong> (4% + 10 pp). Check the current announcement before issuing an interest note — the NBP rate changes more often than most companies update their templates.',
        ] },
        { h: 'From when, and how to calculate', p: [
          'Interest runs from the day after the due date until the day of payment inclusive. The formula:',
          '<strong>amount × rate × number of days ÷ 365</strong>',
          'Example: an invoice for PLN 12,400, 44 days overdue, at 14%: 12,400 × 0.14 × 44 ÷ 365 = <strong>PLN 209.27</strong>. If the rate changed during the delay, split the period and calculate each part separately.',
        ] },
        { h: 'No demand letter, no contract clause needed', p: [
          'Under art. 7(1) of the Act, interest is due when the creditor has performed (delivered the goods, rendered the service) and has not been paid on time. A demand letter is not a condition — but it is useful in practice: it reminds the debtor of the consequences and serves as evidence in court.',
          'The Act also caps payment terms: in B2B relations 60 days as a rule, and where the debtor is a large enterprise and the creditor an SME, a hard 60-day limit with no extension.',
        ] },
        { h: 'Points not to miss', ul: [
          'Commercial-transaction interest is <strong>higher</strong> than the ordinary statutory default interest of the Civil Code — between businesses, apply the 2013 Act.',
          'No interest on interest (art. 482 Civil Code) until a claim is filed in court.',
          'Alongside interest you are owed the <a href="/baza-wiedzy/rekompensata-40-70-100-euro">fixed recovery fee of EUR 40, 70 or 100</a> — per invoice.',
          'Interest becomes time-barred at the latest together with the principal — do not leave it to the last minute.',
        ] },
        { h: 'Claiming interest in practice', p: [
          'The simplest route: an interest note (not an invoice — interest is outside VAT) sent together with a <a href="/baza-wiedzy/wezwanie-do-zaplaty-wzor">demand for payment</a>. Our <a href="/kalkulator">calculator</a> gives the amount for any date and the <a href="/wezwanie-online">free online demand</a> sends the debtor a letter with interest and the recovery fee in 2 minutes.',
          'If the debtor stays silent, two routes remain: collection and a court claim, or selling the invoice — interest then passes to the buyer with the principal and you have cash immediately.',
        ] },
      ],
      faq: [
        ['Can I charge interest if the contract says nothing about it?', 'Yes. Statutory interest for late payment in commercial transactions is due by law, without a contract clause and without a demand letter.'],
        ['Is interest calculated on the gross or net amount?', 'On the amount due, i.e. gross — the whole sum the debtor failed to pay on time.'],
        ['How long can I claim interest?', 'Interest is time-barred at the latest with the principal — usually after 3 years (2 years for sales), at the end of the calendar year.'],
      ],
    },
  },

  {
    slug: 'rekompensata-40-70-100-euro', date: '2026-09-28', updated: '2026-09-29',
    related: ['odsetki-za-opoznienie-w-transakcjach-handlowych', 'sprzedaz-faktury-cesja-a-faktoring', 'wezwanie-do-zaplaty-wzor'],
    pl: {
      title: 'Rekompensata 40, 70 i 100 euro za koszty odzyskiwania należności — komu, kiedy i ile',
      seoTitle: 'Rekompensata 40/70/100 € za opóźnienie',
      desc: 'Za każdą fakturę po terminie należy się rekompensata 40, 70 lub 100 € — bez dowodu kosztów. Progi, kurs NBP, przedawnienie i dlaczego nie można jej sprzedać.',
      lead: 'Oprócz odsetek wierzycielowi w transakcji handlowej przysługuje od dłużnika stała rekompensata za koszty odzyskiwania należności. Nie trzeba niczego udowadniać ani wzywać — wystarczy, że termin płatności minął.',
      sections: [
        { h: 'Trzy progi', ul: [
          '<strong>40 euro</strong> — gdy należność nie przekracza 5 000 zł',
          '<strong>70 euro</strong> — gdy należność jest wyższa niż 5 000 zł, ale niższa niż 50 000 zł',
          '<strong>100 euro</strong> — gdy należność wynosi 50 000 zł lub więcej',
        ], p2: ['Podstawa: art. 10 ust. 1 ustawy z 8 marca 2013 r. Rekompensata przysługuje od każdej transakcji (faktury) osobno; jeżeli strony ustaliły płatność w częściach — od każdej niezapłaconej części.'] },
        { h: 'Przeliczenie na złote', p: [
          'Kwotę w euro przelicza się według <strong>średniego kursu euro NBP z ostatniego dnia roboczego miesiąca poprzedzającego miesiąc, w którym należność stała się wymagalna</strong>. Przy kursie ok. 4,30 zł daje to orientacyjnie 170, 300 i 430 zł — ale w nocie księgowej podaj kurs z konkretnego dnia.',
        ] },
        { h: 'Kiedy powstaje prawo do rekompensaty', p: [
          'Z dniem, w którym wierzyciel nabywa prawo do odsetek za opóźnienie — czyli dzień po terminie płatności. Bez wezwania i bez wykazywania jakichkolwiek kosztów. Jeżeli rzeczywiste, uzasadnione koszty odzyskiwania (kancelaria, firma windykacyjna) przewyższają rekompensatę, można dochodzić także nadwyżki (art. 10 ust. 2).',
        ] },
        { h: 'Rekompensaty nie da się sprzedać', p: [
          'Od 1 stycznia 2020 r. roszczenie o rekompensatę <strong>nie może być zbyte</strong> (art. 10 ust. 4). W praktyce: gdy sprzedajesz fakturę, na nabywcę przechodzi należność główna z odsetkami, a rekompensata zostaje u Ciebie — możesz jej dochodzić dalej albo z niej zrezygnować. Przy windykacji na Twoje zlecenie firma windykacyjna dochodzi rekompensaty w Twoim imieniu.',
        ] },
        { h: 'Praktyka', ul: [
          'Wystaw notę księgową (obciążeniową), nie fakturę — rekompensata, tak jak odsetki, nie podlega VAT.',
          'Ujmij ją w wezwaniu do zapłaty razem z odsetkami — nasz <a href="/kalkulator">kalkulator</a> i <a href="/wezwanie-online">bezpłatne wezwanie online</a> robią to automatycznie.',
          'Roszczenie o rekompensatę przedawnia się jak inne roszczenia z działalności gospodarczej — przyjmuje się 3 lata.',
          'Sądy uznają, że przy wielu drobnych fakturach (dziesiątki faktur na kilkadziesiąt złotych) dochodzenie rekompensaty od każdej z nich może być nadużyciem prawa — działaj proporcjonalnie.',
        ] },
      ],
      faq: [
        ['Czy rekompensata należy się od faktury zapłaconej z jednodniowym opóźnieniem?', 'Formalnie tak — prawo do rekompensaty powstaje z pierwszym dniem opóźnienia. Wiele firm rezygnuje z niej wtedy z powodów biznesowych, ale to Twoja decyzja.'],
        ['Czy dłużnik musi ją zapłacić, jeśli uregulował już fakturę?', 'Tak. Zapłata należności głównej po terminie nie uchyla roszczenia o rekompensatę ani o odsetki za okres opóźnienia.'],
      ],
    },
    en: {
      title: 'The EUR 40 / 70 / 100 fixed recovery fee for late payment in Poland — who gets it, when and how much',
      seoTitle: 'EUR 40/70/100 recovery fee in Poland',
      desc: 'Every invoice paid late in Poland carries a flat recovery fee of EUR 40, 70 or 100 — no proof of costs needed. Thresholds, exchange rate, limitation.',
      lead: 'On top of interest, a creditor in a commercial transaction is owed a fixed compensation for recovery costs. Nothing has to be proven and no demand sent — it is enough that the due date has passed.',
      sections: [
        { h: 'Three thresholds', ul: [
          '<strong>EUR 40</strong> — where the claim does not exceed PLN 5,000',
          '<strong>EUR 70</strong> — where the claim is above PLN 5,000 but below PLN 50,000',
          '<strong>EUR 100</strong> — where the claim is PLN 50,000 or more',
        ], p2: ['Legal basis: art. 10(1) of the Act of 8 March 2013. The fee is due per transaction (invoice); where payment in instalments was agreed, per unpaid instalment.'] },
        { h: 'Conversion into zloty', p: [
          'The euro amount is converted at the <strong>average EUR rate of the National Bank of Poland on the last business day of the month preceding the month in which the claim fell due</strong>. At roughly PLN 4.30 that is about PLN 170, 300 and 430 — but quote the exact rate of the relevant day in your debit note.',
        ] },
        { h: 'When the right arises', p: [
          'On the day the creditor becomes entitled to late-payment interest — the day after the due date. No demand letter and no evidence of costs. If your actual, reasonable recovery costs (lawyers, a collection agency) exceed the fee, the excess can be claimed as well (art. 10(2)).',
        ] },
        { h: 'The fee cannot be sold', p: [
          'Since 1 January 2020 the claim for the recovery fee <strong>cannot be assigned</strong> (art. 10(4)). In practice: when you sell an invoice, the principal and interest pass to the buyer while the fee stays with you — pursue it or waive it. When you outsource collection, the agency claims the fee on your behalf.',
        ] },
        { h: 'In practice', ul: [
          'Issue an accounting (debit) note, not an invoice — like interest, the fee is outside VAT.',
          'Include it in the demand for payment together with interest — our <a href="/kalkulator">calculator</a> and the <a href="/wezwanie-online">free online demand</a> do this automatically.',
          'The claim is time-barred like other business claims — 3 years is the accepted view.',
          'Courts have held that claiming the fee on dozens of tiny invoices may be an abuse of rights — act proportionately.',
        ] },
      ],
      faq: [
        ['Is the fee due on an invoice paid one day late?', 'Formally yes — the right arises on the first day of delay. Many companies waive it in that case for commercial reasons, but that is your call.'],
        ['Does the debtor still owe it after paying the invoice?', 'Yes. Late payment of the principal does not extinguish the claim for the fee or for interest over the period of delay.'],
      ],
    },
  },

  {
    slug: 'przedawnienie-faktury-b2b', date: '2026-09-28', updated: '2026-09-29',
    related: ['odsetki-za-opoznienie-w-transakcjach-handlowych', 'wezwanie-do-zaplaty-wzor', 'windykacja-w-polsce-dla-zagranicznych-wierzycieli'],
    pl: {
      title: 'Przedawnienie faktury B2B — terminy, przerwanie i zawieszenie biegu',
      seoTitle: 'Przedawnienie faktury B2B — terminy',
      desc: 'Po jakim czasie przedawnia się faktura wystawiona firmie: 3 lata, 2 lata dla sprzedaży, koniec roku. Co przerywa bieg przedawnienia, a co go tylko zawiesza.',
      lead: 'Nieopłacona faktura nie traci mocy z dnia na dzień, ale ma termin, po którym dłużnik może skutecznie odmówić zapłaty. W obrocie między firmami terminy są krótkie, a kilka reguł jest nieintuicyjnych.',
      sections: [
        { h: 'Podstawowe terminy', ul: [
          '<strong>3 lata</strong> — ogólny termin dla roszczeń związanych z prowadzeniem działalności gospodarczej (art. 118 KC): usługi, roboty budowlane, najem.',
          '<strong>2 lata</strong> — roszczenia z tytułu sprzedaży dokonanej w zakresie działalności sprzedawcy (art. 554 KC) oraz z umowy o dzieło (art. 646 KC).',
          '<strong>1 rok</strong> — roszczenia z umowy przewozu (art. 792 KC) i większość roszczeń z umowy spedycji.',
          '<strong>6 lat</strong> — roszczenie stwierdzone prawomocnym wyrokiem lub nakazem zapłaty (art. 125 KC); zasądzone odsetki za okres po wyroku — 3 lata.',
        ], p2: ['Bieg zaczyna się od dnia wymagalności, czyli dnia następnego po terminie płatności z faktury lub umowy.'] },
        { h: 'Koniec terminu = koniec roku', p: [
          'Od reformy z 2018 r. termin przedawnienia wynoszący co najmniej dwa lata upływa <strong>z ostatnim dniem roku kalendarzowego</strong> (art. 118 zd. 2 KC). Faktura sprzedażowa z terminem płatności 15 marca 2025 r. przedawni się więc nie 15 marca 2027 r., lecz 31 grudnia 2027 r.',
        ] },
        { h: 'Co przerywa bieg przedawnienia', p: ['Po przerwaniu termin biegnie od nowa (art. 124 KC). Przerywają go (art. 123 KC):'], ul: [
          'każda czynność przed sądem lub komornikiem przedsięwzięta bezpośrednio w celu dochodzenia roszczenia — pozew, wniosek o nadanie klauzuli wykonalności, wniosek egzekucyjny;',
          '<strong>uznanie roszczenia przez dłużnika</strong> — także „niewłaściwe”: prośba o rozłożenie na raty, częściowa wpłata z powołaniem na fakturę, e-mail „zapłacimy w przyszłym miesiącu”. To najtańszy sposób na przerwanie przedawnienia — dlatego w windykacji tak ważne jest, by dłużnik potwierdził dług na piśmie.',
        ], p2: ['Od 30 czerwca 2022 r. <strong>mediacja i zawezwanie do próby ugodowej nie przerywają</strong> biegu przedawnienia, a jedynie zawieszają go na czas postępowania (art. 121 pkt 5 i 6 KC). Wcześniej zawezwanie było popularnym, tanim sposobem „odnowienia” terminu — dziś już tak nie działa.'] },
        { h: 'Co się dzieje po przedawnieniu', p: [
          'Roszczenie nie wygasa. W sporze między przedsiębiorcami sąd <strong>nie bada przedawnienia z urzędu</strong> — dłużnik musi sam podnieść zarzut (inaczej niż wobec konsumentów, art. 117 § 2¹ KC). Przedawnioną fakturę B2B nadal można więc dochodzić, a nieświadomy lub niestaranny dłużnik często płaci. Nie można natomiast liczyć na egzekucję, jeśli zarzut zostanie skutecznie podniesiony.',
        ] },
        { h: 'Po wyroku: 6 lat i egzekucja', p: [
          'Tytuł wykonawczy przedawnia się po 6 latach, a każdy wniosek egzekucyjny przerywa ten termin. Uwaga na powód umorzenia egzekucji: po umorzeniu z powodu <strong>bezskuteczności</strong> termin biegnie od nowa, ale po umorzeniu z powodu <strong>bezczynności wierzyciela</strong> (art. 824 § 1 pkt 4 KPC) skutki przerwania upadają. Więcej w naszym <a href="/skup-wyrokow">poradniku o starych wyrokach</a>.',
        ] },
      ],
      faq: [
        ['Czy wystawienie noty odsetkowej albo wysłanie wezwania przerywa przedawnienie?', 'Nie. Wezwanie, nota, monit czy telefon nie przerywają biegu — robi to dopiero czynność przed sądem lub komornikiem albo <a href="/baza-wiedzy/uznanie-dlugu">uznanie długu</a> przez dłużnika.'],
        ['Jak przerwać przedawnienie tanio?', 'Uzyskaj pisemne uznanie długu (e-mail wystarczy) albo złóż pozew w elektronicznym postępowaniu upominawczym — opłata to czwarta część zwykłej opłaty sądowej (min. 30 zł).'],
      ],
    },
    en: {
      title: 'Limitation periods for unpaid invoices in Poland — 3 years, 2 years and the end-of-year rule',
      seoTitle: 'Limitation periods for Polish invoices',
      desc: 'When an invoice to a Polish company becomes time-barred: 3 years, 2 years for sales, end of the year. What interrupts limitation and what only suspends it.',
      lead: 'An unpaid invoice does not expire overnight, but there is a date after which the debtor can lawfully refuse to pay. In business-to-business dealings the periods are short and a few rules are counter-intuitive.',
      sections: [
        { h: 'The basic periods', ul: [
          '<strong>3 years</strong> — the general period for claims connected with business activity (art. 118 Civil Code): services, construction works, leases.',
          '<strong>2 years</strong> — claims from a sale made in the course of the seller’s business (art. 554) and from a contract for specific work (art. 646).',
          '<strong>1 year</strong> — claims from a contract of carriage (art. 792) and most forwarding claims.',
          '<strong>6 years</strong> — a claim confirmed by a final judgment or payment order (art. 125); interest awarded for the period after the judgment — 3 years.',
        ], p2: ['The period runs from the due date, i.e. the day after the payment deadline on the invoice or in the contract.'] },
        { h: 'The period ends at year end', p: [
          'Since the 2018 reform, a limitation period of at least two years expires <strong>on the last day of the calendar year</strong> (art. 118, second sentence). A sales invoice due on 15 March 2025 is therefore time-barred not on 15 March 2027 but on 31 December 2027.',
        ] },
        { h: 'What interrupts the period', p: ['After an interruption the period starts afresh (art. 124). It is interrupted by (art. 123):'], ul: [
          'any act before a court or bailiff taken directly to pursue the claim — a statement of claim, an application for an enforcement clause, an enforcement application;',
          '<strong>acknowledgement of the debt by the debtor</strong> — including an informal one: a request for instalments, a part-payment referring to the invoice, an e-mail saying “we will pay next month”. This is the cheapest way to interrupt limitation, which is why getting the debtor to confirm the debt in writing matters so much in collection.',
        ], p2: ['Since 30 June 2022 <strong>mediation and a court settlement summons no longer interrupt</strong> limitation; they only suspend it while the proceedings last (art. 121(5) and (6)). The summons used to be a popular, cheap way to “renew” the period — it no longer works that way.'] },
        { h: 'After the period has run out', p: [
          'The claim does not cease to exist. In a dispute between businesses the court <strong>does not examine limitation of its own motion</strong> — the debtor must raise the defence (unlike consumer cases, art. 117 § 2¹). A time-barred B2B invoice can therefore still be pursued, and an unaware or careless debtor often pays. Enforcement, however, will fail once the defence is properly raised.',
        ] },
        { h: 'After a judgment: 6 years and enforcement', p: [
          'An enforceable title becomes time-barred after 6 years, and every enforcement application interrupts that period. Watch the reason enforcement was discontinued: after discontinuation for <strong>ineffectiveness</strong> the period restarts, but after discontinuation for the <strong>creditor’s inaction</strong> (art. 824 § 1(4) Code of Civil Procedure) the interrupting effect falls away. More in our <a href="/skup-wyrokow">guide to old judgments</a>.',
        ] },
      ],
      faq: [
        ['Does an interest note or a demand letter interrupt limitation?', 'No. Demands, notes, reminders and phone calls do not interrupt the period — only an act before a court or bailiff, or an <a href="/baza-wiedzy/uznanie-dlugu">acknowledgement by the debtor</a>, does.'],
        ['What is the cheapest way to interrupt limitation?', 'Obtain a written acknowledgement of the debt (an e-mail suffices) or file a claim in the electronic writ-of-payment procedure — the fee is a quarter of the ordinary court fee (min. PLN 30).'],
      ],
    },
  },

  {
    slug: 'wezwanie-do-zaplaty-wzor', date: '2026-09-28', updated: '2026-09-29',
    related: ['przedsadowe-wezwanie-do-zaplaty', 'wezwanie-do-zaplaty-e-mailem', 'odsetki-za-opoznienie-w-transakcjach-handlowych'],
    pl: {
      title: 'Wezwanie do zapłaty — co musi zawierać, jak je wysłać i dlaczego warto (wzór)',
      seoTitle: 'Wezwanie do zapłaty — wzór i zasady',
      desc: 'Co musi zawierać wezwanie do zapłaty za fakturę B2B: kwota, odsetki, rekompensata, termin, ostrzeżenie o KRD. Jak wysłać z dowodem doręczenia. Generator.',
      lead: 'Wezwanie do zapłaty nie jest warunkiem naliczania odsetek, ale jest najtańszym narzędziem windykacji i standardowym załącznikiem do pozwu. Dobrze napisane odzyskuje pieniądze bez sądu — pod warunkiem, że zawiera to, co trzeba.',
      sections: [
        { h: 'Co musi zawierać', ul: [
          'dane wierzyciela i dłużnika (pełna nazwa, NIP, adres);',
          'numer i datę faktury, kwotę należności głównej i pierwotny termin płatności;',
          'odsetki ustawowe za opóźnienie w transakcjach handlowych naliczone na dzień wezwania (ze stawką) oraz <a href="/baza-wiedzy/rekompensata-40-70-100-euro">rekompensatę 40/70/100 euro</a>;',
          'nowy, krótki termin zapłaty (zwykle 7 dni) i numer rachunku;',
          'zapowiedź skutków: skierowanie sprawy do sądu z kosztami procesu obciążającymi dłużnika oraz — jeżeli planujesz wpis — <strong>ostrzeżenie o zamiarze przekazania danych do biura informacji gospodarczej</strong> z podaniem nazwy i adresu biura;',
          'podpis osoby uprawnionej i datę.',
        ] },
        { h: 'Trzy stopnie eskalacji', p: [
          'W praktyce sprawdza się sekwencja: <a href="/baza-wiedzy/przypomnienie-o-platnosci-monit-wzor"><strong>przypomnienie</strong></a> (uprzejme, e-mailem, kilka dni po terminie) → <strong>wezwanie do zapłaty</strong> (stanowcze, z odsetkami i rekompensatą) → <a href="/baza-wiedzy/przedsadowe-wezwanie-do-zaplaty"><strong>ostateczne przedsądowe wezwanie</strong></a> (z podstawą prawną i zapowiedzią pozwu w 7 dni). Każdy kolejny krok jest krótszy i bardziej formalny. Ton ma znaczenie — agent AI w naszym panelu generuje te trzy warianty automatycznie.',
        ] },
        { h: 'Jak wysłać, żeby mieć dowód', p: [
          'Listem poleconym za potwierdzeniem odbioru na adres z KRS lub CEIDG — i równolegle e-mailem na adres, którym dłużnik posługuje się w kontaktach. Zachowaj potwierdzenie nadania, zwrotkę i kopię pisma. Dla wpisu do BIG ustawa wymaga wezwania <strong>listem poleconym albo doręczonego do rąk własnych</strong>, a wpis jest możliwy najwcześniej miesiąc po jego wysłaniu.',
        ] },
        { h: 'Znaczenie w sądzie', p: [
          'Pozew musi zawierać informację, czy strony podjęły próbę pozasądowego rozwiązania sporu (art. 187 § 1 pkt 3 KPC) — wezwanie i odpowiedź dłużnika (lub jej brak) są właśnie tą próbą. Wezwanie z dowodem doręczenia to też standardowy załącznik do wniosku o nakaz zapłaty. Bez niego sąd może uznać koszty za niecelowe albo wezwać do uzupełnienia braków.',
        ] },
        { h: 'Gotowy wzór', p: [
          'Najprościej: <a href="/wezwanie-online">bezpłatne wezwanie online</a> — wezwanie dostaje własny link i kod QR, odsetki liczą się codziennie, a dłużnik może jednym kliknięciem potwierdzić zapłatę, zadeklarować termin (to uznanie długu) albo zgłosić zastrzeżenia; Ty dostajesz e-mail. Wersję do druku wygenerujesz też w <a href="/kalkulator">kalkulatorze</a>.',
        ] },
      ],
      faq: [
        ['Czy wezwanie e-mailem jest skuteczne?', 'Tak, o ile dotarło do dłużnika — ale dowód doręczenia e-maila bywa sporny. Do celów sądowych i wpisu do BIG wysyłaj list polecony. Więcej: <a href="/baza-wiedzy/wezwanie-do-zaplaty-e-mailem">wezwanie do zapłaty e-mailem</a>.'],
        ['Ile dni dać dłużnikowi?', 'Zwyczajowo 7 dni od doręczenia. Krótszy termin (3 dni) jest dopuszczalny przy ostatecznym wezwaniu; dłuższy tylko odwleka sprawę.'],
      ],
    },
    en: {
      title: 'Demand for payment to a Polish debtor (wezwanie do zapłaty) — what it must contain and how to send it',
      seoTitle: 'Demand for payment to a Polish debtor',
      desc: 'What a demand for payment of a Polish B2B invoice must contain: amount, interest, recovery fee, deadline, KRD warning. How to send it with proof of delivery.',
      lead: 'A demand for payment is not a condition for charging interest, but it is the cheapest collection tool and a standard attachment to a court claim. A well-drafted one recovers the money without court — provided it contains what it should.',
      sections: [
        { h: 'What it must contain', ul: [
          'the creditor’s and the debtor’s details (full name, tax ID / NIP, address);',
          'invoice number and date, the principal amount and the original due date;',
          'statutory commercial-transaction interest accrued up to the date of the demand (with the rate) and the <a href="/baza-wiedzy/rekompensata-40-70-100-euro">EUR 40/70/100 recovery fee</a>;',
          'a new, short payment deadline (usually 7 days) and the bank account number;',
          'the consequences: court proceedings with costs borne by the debtor and — if you intend to list the debtor — a <strong>warning that the data will be passed to a credit information bureau</strong>, naming the bureau and its address;',
          'signature of an authorised person and the date.',
        ] },
        { h: 'Three levels of escalation', p: [
          'A proven sequence: <a href="/baza-wiedzy/przypomnienie-o-platnosci-monit-wzor"><strong>reminder</strong></a> (polite, by e-mail, a few days after the due date) → <strong>demand for payment</strong> (firm, with interest and the recovery fee) → <a href="/baza-wiedzy/przedsadowe-wezwanie-do-zaplaty"><strong>final pre-court demand</strong></a> (with the legal basis and notice of a claim within 7 days). Each step is shorter and more formal. Tone matters — the AI agent in our panel generates all three variants automatically, in Polish.',
        ] },
        { h: 'How to send it and keep proof', p: [
          'By registered letter with acknowledgement of receipt to the address in the KRS or CEIDG register — and in parallel by e-mail to the address the debtor actually uses. Keep the posting receipt, the return slip and a copy. For a credit-bureau listing the law requires a demand sent <strong>by registered mail or delivered in person</strong>, and the listing is possible at the earliest one month after sending.',
        ] },
        { h: 'Why it matters in court', p: [
          'A statement of claim must state whether the parties attempted an out-of-court settlement (art. 187 § 1(3) Code of Civil Procedure) — the demand and the debtor’s reply (or silence) are that attempt. A demand with proof of delivery is also a standard attachment to an application for a payment order. Without it the court may refuse costs or ask you to cure defects.',
        ] },
        { h: 'Ready-made template', p: [
          'The simplest way: our <a href="/wezwanie-online">free online demand</a> — the demand gets its own link and QR code, interest is calculated daily, and the debtor can confirm payment, promise a date (an acknowledgement of the debt) or dispute with one click; you receive an e-mail. A printable version is also available in the <a href="/kalkulator">calculator</a>.',
        ] },
      ],
      faq: [
        ['Is a demand sent by e-mail effective?', 'Yes, as long as it reached the debtor — but proof of delivery of an e-mail is often disputed. For court and credit-bureau purposes send a registered letter. More: <a href="/baza-wiedzy/wezwanie-do-zaplaty-e-mailem">demand for payment by e-mail</a>.'],
        ['How many days should I give the debtor?', 'Customarily 7 days from delivery. A shorter period (3 days) is acceptable for a final demand; a longer one only delays matters.'],
      ],
    },
  },

  {
    slug: 'sprzedaz-faktury-cesja-a-faktoring', date: '2026-09-28', updated: '2026-09-28',
    related: ['rekompensata-40-70-100-euro', 'przedawnienie-faktury-b2b', 'windykacja-w-polsce-dla-zagranicznych-wierzycieli'],
    pl: {
      title: 'Sprzedaż faktury (cesja wierzytelności) a faktoring — czym się różnią i co przechodzi na nabywcę',
      seoTitle: 'Sprzedaż faktury (cesja) a faktoring',
      desc: 'Cesja wierzytelności z art. 509 KC krok po kroku: zgoda dłużnika, zakaz cesji, zawiadomienie. Sprzedaż przeterminowanej faktury a faktoring — co się opłaca.',
      lead: 'Sprzedaż faktury i faktoring to dwa różne narzędzia, choć oba zamieniają fakturę na gotówkę. Pierwsze rozwiązuje problem faktury, której dłużnik nie płaci; drugie finansuje bieżący obrót. Podstawą prawną w obu wypadkach jest przelew wierzytelności.',
      sections: [
        { h: 'Jak działa cesja (art. 509–518 KC)', p: [
          'Wierzyciel (cedent) przenosi wierzytelność na nabywcę (cesjonariusza) umową. Co do zasady <strong>zgoda dłużnika nie jest potrzebna</strong>. Razem z wierzytelnością przechodzą związane z nią prawa, w szczególności roszczenie o zaległe odsetki (art. 509 § 2 KC). Jeżeli wierzytelność jest stwierdzona pismem (faktura, umowa), umowa przelewu również powinna być stwierdzona pismem (art. 511 KC).',
        ] },
        { h: 'Kiedy cesja jest niemożliwa', ul: [
          'gdy umowa z dłużnikiem zawiera <strong>zakaz cesji</strong> (pactum de non cedendo) — częsty w umowach z sieciami handlowymi i dużymi zamawiającymi; sprawdź to przed sprzedażą;',
          'gdy sprzeciwia się to ustawie lub właściwości zobowiązania;',
          'w części dotyczącej <strong>rekompensaty 40/70/100 euro</strong> — to roszczenie jest z mocy ustawy niezbywalne i zostaje u sprzedawcy.',
        ] },
        { h: 'Zawiadomienie dłużnika', p: [
          'Dopóki dłużnik nie zostanie zawiadomiony o przelewie, może skutecznie zapłacić poprzedniemu wierzycielowi (art. 512 KC). Dlatego po podpisaniu umowy nabywca wysyła dłużnikowi zawiadomienie ze wskazaniem nowego rachunku. Zbywca odpowiada wobec nabywcy za to, że wierzytelność istnieje, ale <strong>nie za wypłacalność dłużnika</strong> — chyba że to na siebie przyjął (art. 516 KC). W modelu sprzedamfakture.pl ryzyko niewypłacalności przechodzi na nas.',
        ] },
        { h: 'Sprzedaż faktury a faktoring', ul: [
          '<strong>Sprzedaż (wykup) wierzytelności</strong>: pojedyncza, zwykle przeterminowana faktura; cena to procent wartości nominalnej zależny od ryzyka; jedna umowa, wypłata w 24 godziny; bez regresu — sprzedawca nie oddaje pieniędzy, gdy dłużnik nie zapłaci.',
          '<strong>Faktoring</strong>: umowa ramowa na finansowanie bieżących, nieprzeterminowanych faktur; zaliczka 80–90% i rozliczenie po zapłacie dłużnika; prowizje i odsetki; w wariancie z regresem ryzyko zostaje u Ciebie.',
          'Masz stały obrót i rzetelnych, choć spóźniających się kontrahentów — wybierz faktoring. Masz jedną trudną fakturę i chcesz zamknąć temat — sprzedaj ją.',
        ] },
        { h: 'Podatki i księgowość — sprawdź z księgowym', p: [
          'Sprzedaż wierzytelności własnej rodzi skutki w podatku dochodowym (strata na sprzedaży jest kosztem w granicach określonych ustawą), a sama umowa może podlegać PCC albo VAT zależnie od statusu nabywcy i konstrukcji transakcji. Te zasady bywają przedmiotem rozbieżnych interpretacji — przed podpisaniem umowy skonsultuj się z księgowym lub doradcą podatkowym.',
        ] },
      ],
      faq: [
        ['Czy dłużnik może się nie zgodzić na sprzedaż faktury?', 'Nie — zgoda dłużnika nie jest wymagana, chyba że umowa z nim zawiera zakaz cesji.'],
        ['Co się dzieje z rekompensatą 40 euro po sprzedaży?', 'Zostaje u sprzedawcy: roszczenie o rekompensatę nie może być zbyte (art. 10 ust. 4 ustawy z 2013 r.).'],
      ],
      cta: { href: '/#wycena' },
    },
    en: {
      title: 'Selling a Polish invoice (assignment of receivables) vs factoring — the differences and what passes to the buyer',
      seoTitle: 'Selling an invoice vs factoring (Poland)',
      desc: 'Assignment of receivables under Polish law step by step: debtor consent, non-assignment clauses, notification. Selling an overdue invoice vs factoring.',
      lead: 'Selling an invoice and factoring are two different tools, although both turn an invoice into cash. The first solves the problem of an invoice the debtor does not pay; the second finances ongoing turnover. The legal basis for both is the assignment of a receivable.',
      sections: [
        { h: 'How assignment works (arts. 509–518 Civil Code)', p: [
          'The creditor (assignor) transfers the receivable to the buyer (assignee) by contract. As a rule <strong>the debtor’s consent is not required</strong>. Rights connected with the receivable pass with it, in particular the claim for accrued interest (art. 509 § 2). If the receivable is evidenced in writing (invoice, contract), the assignment should also be evidenced in writing (art. 511).',
        ] },
        { h: 'When assignment is not possible', ul: [
          'where the contract with the debtor contains a <strong>non-assignment clause</strong> — common in contracts with retail chains and large buyers; check before selling;',
          'where it would be contrary to statute or to the nature of the obligation;',
          'as regards the <strong>EUR 40/70/100 recovery fee</strong> — that claim is non-assignable by law and stays with the seller.',
        ] },
        { h: 'Notifying the debtor', p: [
          'Until the debtor is notified of the assignment, payment to the previous creditor discharges the debt (art. 512). After signing, the buyer therefore notifies the debtor and indicates the new bank account. The seller is liable to the buyer for the receivable existing, but <strong>not for the debtor’s solvency</strong> — unless it assumed that risk (art. 516). In the sprzedamfakture.pl model the insolvency risk passes to us.',
        ] },
        { h: 'Selling an invoice vs factoring', ul: [
          '<strong>Sale (purchase) of a receivable</strong>: a single, usually overdue invoice; the price is a percentage of face value depending on risk; one contract, payout within 24 hours; non-recourse — the seller does not repay if the debtor defaults.',
          '<strong>Factoring</strong>: a framework agreement financing current, not-yet-overdue invoices; an 80–90% advance settled when the debtor pays; fees and interest; with recourse, the risk stays with you.',
          'Steady turnover with reliable but slow-paying customers — choose factoring. One difficult invoice you want to close — sell it.',
        ] },
        { h: 'Tax and accounting — check with your accountant', p: [
          'Selling your own receivable has income-tax consequences (a loss on the sale is deductible within statutory limits), and the contract itself may attract transfer tax (PCC) or VAT depending on the buyer’s status and the structure. These rules are subject to diverging interpretations — consult an accountant or tax adviser before signing.',
        ] },
      ],
      faq: [
        ['Can the debtor object to the sale of the invoice?', 'No — the debtor’s consent is not required unless the contract contains a non-assignment clause.'],
        ['What happens to the EUR 40 recovery fee after the sale?', 'It stays with the seller: the claim for the fee cannot be assigned (art. 10(4) of the 2013 Act).'],
      ],
      cta: { href: '/#wycena' },
    },
  },

  {
    slug: 'wpis-dluznika-do-krd-big', date: '2026-09-28', updated: '2026-09-28',
    related: ['wezwanie-do-zaplaty-wzor', 'przedawnienie-faktury-b2b', 'odsetki-za-opoznienie-w-transakcjach-handlowych'],
    pl: {
      title: 'Wpis dłużnika do KRD lub innego BIG — warunki, procedura i skutki',
      seoTitle: 'Wpis dłużnika do KRD/BIG — warunki',
      desc: 'Kiedy firma może wpisać dłużnika do KRD lub innego BIG: 500 zł, 30 dni, wezwanie z ostrzeżeniem i miesiąc odczekania. Jakie biura działają i co daje wpis.',
      lead: 'Zapowiedź wpisu do KRD to jeden z najskuteczniejszych argumentów w windykacji polubownej — bo wpis widzą banki, leasingodawcy i kontrahenci dłużnika. Ustawa stawia jednak konkretne warunki, których pominięcie naraża wierzyciela na odpowiedzialność.',
      sections: [
        { h: 'Biura informacji gospodarczej w Polsce', p: [
          'Działają na podstawie ustawy z 9 kwietnia 2010 r. o udostępnianiu informacji gospodarczych i wymianie danych gospodarczych. Największe: <strong>Krajowy Rejestr Długów BIG</strong>, <strong>BIG InfoMonitor</strong>, <strong>ERIF BIG</strong> i <strong>KBIG</strong>. Wpis w jednym biurze nie oznacza wpisu w pozostałych — dlatego profesjonalna windykacja sprawdza i raportuje w kilku.',
        ] },
        { h: 'Warunki wpisu dłużnika-przedsiębiorcy', p: ['Wierzyciel może przekazać informację o dłużniku niebędącym konsumentem, gdy łącznie (art. 15 ustawy):'], ul: [
          'zobowiązanie powstało w związku z określonym stosunkiem prawnym, w szczególności z umową;',
          'łączna kwota wymagalnych zobowiązań wobec wierzyciela wynosi co najmniej <strong>500 zł</strong>;',
          'należność jest wymagalna od co najmniej <strong>30 dni</strong>;',
          'upłynął co najmniej <strong>miesiąc</strong> od wysłania listem poleconym (lub doręczenia do rąk własnych) wezwania do zapłaty zawierającego <strong>ostrzeżenie o zamiarze przekazania danych do biura</strong>, z podaniem firmy i adresu tego biura.',
        ], p2: ['Wierzyciel musi mieć z biurem umowę o udostępnianiu informacji — jednorazowy wpis w praktyce robi się przez firmę windykacyjną albo ofertę biura dla małych firm.'] },
        { h: 'Procedura i obowiązki po wpisie', ul: [
          'Dłużnik może zgłosić sprzeciw, jeśli uważa, że dług nie istnieje albo jest sporny — biuro wstrzymuje wtedy ujawnianie informacji do wyjaśnienia.',
          'Po zapłacie (także częściowej) wierzyciel ma <strong>14 dni</strong> na aktualizację albo usunięcie wpisu. Zaniedbanie tego jest wykroczeniem zagrożonym grzywną do 30 000 zł.',
          'Nieprawdziwy wpis to odpowiedzialność odszkodowawcza wobec dłużnika — wpisuj tylko należności bezsporne i udokumentowane.',
        ] },
        { h: 'Co daje wpis', p: [
          'Informację o zadłużeniu widzi każdy, kto sprawdza kontrahenta: banki przy kredycie, leasingodawcy, dostawcy, platformy B2B. Dla wielu dłużników sama zapowiedź wpisu — w prawidłowo sformułowanym wezwaniu — wystarcza, by znaleźli pieniądze. Dlatego w naszym panelu ostrzeżenie o KRD pojawia się w stanowczym i prawniczym wariancie wezwania, a decyzja o wpisie zawsze pozostaje po stronie klienta.',
        ] },
      ],
      faq: [
        ['Czy mogę wpisać dłużnika, który kwestionuje fakturę?', 'Możesz, ale ryzykujesz sprzeciw i odpowiedzialność, jeśli dług okaże się niezasadny. Przy realnym sporze lepiej najpierw uzyskać nakaz zapłaty.'],
        ['Czy wpis w KRD przerywa przedawnienie?', 'Nie. Wpis to narzędzie nacisku, nie czynność przerywająca bieg przedawnienia.'],
      ],
    },
    en: {
      title: 'Listing a Polish debtor in KRD or another credit information bureau (BIG) — conditions, procedure and effects',
      seoTitle: 'Listing a Polish debtor in KRD/BIG',
      desc: 'When a company may list a business debtor in a Polish credit bureau: PLN 500, 30 days overdue, a demand with a warning, a one-month wait. What a listing does.',
      lead: 'Announcing a KRD listing is one of the most effective arguments in amicable collection — banks, lessors and the debtor’s customers all see it. The law sets specific conditions, and skipping them exposes the creditor to liability.',
      sections: [
        { h: 'Credit information bureaus in Poland', p: [
          'They operate under the Act of 9 April 2010 on the provision of economic information and exchange of economic data. The largest: <strong>Krajowy Rejestr Długów BIG</strong> (KRD), <strong>BIG InfoMonitor</strong>, <strong>ERIF BIG</strong> and <strong>KBIG</strong>. A listing in one bureau does not appear in the others — which is why professional collectors check and report in several.',
        ] },
        { h: 'Conditions for listing a business debtor', p: ['A creditor may report a non-consumer debtor when all of the following are met (art. 15 of the Act):'], ul: [
          'the obligation arose from a specific legal relationship, in particular a contract;',
          'the total overdue amount owed to the creditor is at least <strong>PLN 500</strong>;',
          'the debt has been due for at least <strong>30 days</strong>;',
          'at least <strong>one month</strong> has passed since a demand for payment containing a <strong>warning that the data will be passed to the bureau</strong>, naming the bureau and its address, was sent by registered mail (or delivered in person).',
        ], p2: ['The creditor also needs an agreement with the bureau — in practice a one-off listing is made through a collection agency or a bureau’s small-business offer.'] },
        { h: 'Procedure and duties after listing', ul: [
          'The debtor may object if it considers the debt non-existent or disputed — the bureau then withholds the information until clarified.',
          'After payment (even partial) the creditor has <strong>14 days</strong> to update or remove the entry. Failing to do so is an offence punishable by a fine of up to PLN 30,000.',
          'A false listing makes the creditor liable in damages to the debtor — list only undisputed, documented claims.',
        ] },
        { h: 'What a listing achieves', p: [
          'Anyone who checks a business sees the entry: banks assessing a loan, lessors, suppliers, B2B platforms. For many debtors the mere announcement of a listing — in a correctly drafted demand — is enough to find the money. That is why our panel includes the KRD warning in the firm and legal variants of the demand, while the decision to list always remains with the client.',
        ] },
      ],
      faq: [
        ['Can I list a debtor who disputes the invoice?', 'You can, but you risk an objection and liability if the debt turns out to be unfounded. Where there is a genuine dispute, obtain a payment order first.'],
        ['Does a KRD listing interrupt limitation?', 'No. A listing is a pressure tool, not an act that interrupts the limitation period.'],
      ],
    },
  },

  {
    slug: 'windykacja-w-polsce-dla-zagranicznych-wierzycieli', date: '2026-09-28', updated: '2026-09-29',
    related: ['odsetki-za-opoznienie-w-transakcjach-handlowych', 'wezwanie-do-zaplaty-wzor', 'sprzedaz-faktury-cesja-a-faktoring'],
    pl: {
      title: 'Windykacja należności od polskiej firmy — poradnik dla zagranicznych wierzycieli',
      seoTitle: 'Windykacja w Polsce — poradnik dla firm z UE',
      desc: 'Jak odzyskać pieniądze od firmy z Polski: weryfikacja w KRS i KRZ, odsetki i rekompensata, wezwanie, europejski nakaz zapłaty, sąd, komornik, sprzedaż długu.',
      lead: 'Polska firma nie płaci, a Ty jesteś w Holandii, Niemczech czy Wielkiej Brytanii? Procedura jest przewidywalna, a polskie przepisy są dla wierzyciela korzystniejsze, niż wielu zagranicznych przedsiębiorców sądzi.',
      sections: [
        { h: 'Krok 1: sprawdź dłużnika (bezpłatnie)', ul: [
          '<strong>KRS</strong> (ekrs.ms.gov.pl) — spółki: kto reprezentuje, kapitał, czy nie trwa likwidacja;',
          '<strong>CEIDG</strong> — jednoosobowe działalności;',
          '<strong>Biała lista VAT</strong> Ministerstwa Finansów — czy podmiot jest czynnym podatnikiem i jakie ma rachunki bankowe;',
          '<strong>KRZ</strong> (Krajowy Rejestr Zadłużonych) — upadłości, restrukturyzacje i bezskuteczne egzekucje. Otwarta restrukturyzacja lub upadłość zmienia wszystko: zamiast windykacji zgłaszasz wierzytelność w postępowaniu.',
        ] },
        { h: 'Krok 2: co Ci się należy', p: [
          'Jeżeli umowa podlega prawu polskiemu (albo strony tego nie uregulowały, a dostawa była do Polski), stosuje się ustawę z 2013 r.: <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">odsetki 14% rocznie</a> od dnia po terminie oraz <a href="/baza-wiedzy/rekompensata-40-70-100-euro">rekompensata 40/70/100 euro</a> od każdej faktury. Jeżeli umowa podlega prawu Twojego kraju, obowiązują tamtejsze przepisy implementujące dyrektywę 2011/7/UE — zbliżone, ale z własnymi stawkami.',
        ] },
        { h: 'Krok 3: wezwanie po polsku', p: [
          'Wezwanie do zapłaty wysłane po polsku, listem poleconym na adres z KRS, z odsetkami, rekompensatą, terminem 7 dni oraz zapowiedzią KRD i sądu — to często wystarcza. Dłużnicy ignorują zagraniczne monity w obcym języku; pismo, które wygląda jak początek polskiej procedury, traktują poważnie. Wersję elektroniczną po polsku przygotujesz w kilka minut przez <a href="/wezwanie-online">bezpłatne wezwanie online</a> — formularz jest też po angielsku.',
        ] },
        { h: 'Krok 4: sąd i komornik', ul: [
          '<strong>Europejski nakaz zapłaty</strong> (rozporządzenie 1896/2006) — dla spraw transgranicznych w UE, na formularzu, bez rozprawy; po uprawomocnieniu wykonalny w Polsce bez dodatkowej procedury.',
          '<strong>Polski sąd</strong> — postępowanie upominawcze lub nakazowe; nakaz zapłaty na podstawie faktury i dowodu doręczenia. Opłata sądowa: przy wartości do 20 000 zł stała (od 30 do 1 000 zł), powyżej 5% wartości; w elektronicznym postępowaniu upominawczym czwarta część tej opłaty. Zagraniczny wierzyciel działa z reguły przez polskiego pełnomocnika.',
          '<strong>Egzekucja</strong> — komornik sądowy; skuteczność zależy od majątku dłużnika, dlatego weryfikacja z kroku 1 jest tak ważna.',
          '<strong>Odpowiedzialność zarządu</strong> — gdy egzekucja przeciw sp. z o.o. okaże się bezskuteczna, członkowie zarządu odpowiadają osobiście (art. 299 KSH), o ile nie złożyli w terminie wniosku o upadłość.',
        ] },
        { h: 'Alternatywa: sprzedaj wierzytelność', p: [
          'Jeśli nie chcesz prowadzić sprawy w obcej jurysdykcji, możesz sprzedać wierzytelność polskiemu nabywcy. Na sprzedamfakture.pl wyceniamy fakturę w kilka minut, cesję podpisujesz online, a pieniądze masz w 24 godziny — ryzyko niewypłacalności przechodzi na nas. Skupujemy też <a href="/skup-wyrokow">stare wyroki i nakazy zapłaty</a>, których nie udało się wyegzekwować.',
        ] },
      ],
      faq: [
        ['Czy potrzebuję polskiego prawnika?', 'Do wezwania i europejskiego nakazu zapłaty — nie. Do postępowania przed polskim sądem i egzekucji — w praktyce tak (pełnomocnik, język postępowania, doręczenia).'],
        ['W jakim języku prowadzi się sprawę?', 'Po polsku. Dokumenty obcojęzyczne wymagają tłumaczenia przysięgłego.'],
      ],
      cta: { href: '/#wycena' },
    },
    en: {
      title: 'How to collect a debt from a Polish company — a practical guide for foreign creditors',
      seoTitle: 'Collecting a debt from a Polish company',
      desc: 'Recovering money from a Polish business step by step: free register checks, 14% interest, the EUR 40/70/100 fee, a Polish demand letter, EU payment order.',
      lead: 'A Polish company is not paying and you are in the Netherlands, Germany or the UK? The procedure is predictable, and Polish law is more creditor-friendly than many foreign businesses assume.',
      sections: [
        { h: 'Step 1: check the debtor (free of charge)', ul: [
          '<strong>KRS</strong> (ekrs.ms.gov.pl) — companies: who represents them, share capital, whether liquidation is pending;',
          '<strong>CEIDG</strong> — sole traders;',
          '<strong>The VAT “white list”</strong> of the Ministry of Finance — whether the entity is an active VAT payer and which bank accounts it holds;',
          '<strong>KRZ</strong> (National Register of Debtors) — bankruptcies, restructurings and failed enforcements. An open restructuring or bankruptcy changes everything: instead of collecting, you file your claim in the proceedings.',
        ] },
        { h: 'Step 2: what you are owed', p: [
          'If Polish law governs the contract (or nothing was agreed and delivery was to Poland), the 2013 Act applies: <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">interest at 14% per annum</a> from the day after the due date and a <a href="/baza-wiedzy/rekompensata-40-70-100-euro">fixed fee of EUR 40/70/100</a> per invoice. If your own law governs, your national rules implementing Directive 2011/7/EU apply — similar, with their own rates.',
        ] },
        { h: 'Step 3: a demand letter in Polish', p: [
          'A demand for payment written in Polish, sent by registered mail to the KRS address, with interest, the recovery fee, a 7-day deadline and notice of a KRD listing and court action — this alone often works. Debtors ignore foreign reminders in a foreign language; a letter that looks like the start of a Polish procedure gets taken seriously. You can prepare the electronic version in Polish in a few minutes with the <a href="/wezwanie-online?lang=en">free online demand</a> — the form is in English.',
        ] },
        { h: 'Step 4: court and bailiff', ul: [
          '<strong>European order for payment</strong> (Regulation 1896/2006) — for cross-border cases within the EU, on a form, without a hearing; once final it is enforceable in Poland without further procedure.',
          '<strong>Polish court</strong> — the writ-of-payment or order-for-payment procedure; a payment order based on the invoice and proof of delivery. Court fee: for claims up to PLN 20,000 a fixed fee (PLN 30–1,000), above that 5% of the claim; a quarter of that fee in the electronic procedure. A foreign creditor normally acts through a Polish attorney.',
          '<strong>Enforcement</strong> — a court bailiff (komornik); success depends on the debtor’s assets, which is why the checks in step 1 matter so much.',
          '<strong>Director liability</strong> — if enforcement against a limited company (sp. z o.o.) proves ineffective, the management board members are personally liable (art. 299 Commercial Companies Code) unless they filed for bankruptcy in time.',
        ] },
        { h: 'The alternative: sell the claim', p: [
          'If you would rather not litigate in a foreign jurisdiction, sell the receivable to a Polish buyer. At sprzedamfakture.pl we price the invoice within minutes, you sign the assignment online and receive the money within 24 hours — the insolvency risk passes to us. We also buy <a href="/skup-wyrokow">old judgments and payment orders</a> that could not be enforced.',
        ] },
      ],
      faq: [
        ['Do I need a Polish lawyer?', 'Not for the demand letter or the European order for payment. For proceedings before a Polish court and enforcement — in practice yes (representation, language of proceedings, service of documents).'],
        ['In what language are proceedings conducted?', 'In Polish. Foreign-language documents require a sworn translation.'],
      ],
      cta: { href: '/#wycena' },
    },
  },
];

// Deel 2 (commercieel + praktisch) vooraan: skup faktur, kontrahent sprawdzić, nota odsetkowa
ARTICLES.unshift(...require('./articles-2'));
// Deel 3 (rond het wezwanie online) daarvoor: kontrahent nie płaci, przedsądowe wezwanie, e-mail, uznanie długu, monit, dłużnik
ARTICLES.unshift(...require('./articles-3'));

function bySlug(slug) { return ARTICLES.find((a) => a.slug === slug) || null; }

module.exports = { ARTICLES, bySlug };
