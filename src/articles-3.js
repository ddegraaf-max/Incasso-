// sprzedamfakture.pl — baza wiedzy, deel 3: artikelen rond het wezwanie online (PL + EN)
// Zelfde structuur als src/articles.js; wordt daar vooraan in ARTICLES gezet (unshift).
// Elk artikel beantwoordt één zoekvraag en stuurt door naar /wezwanie-online (cta.href).
const TOOL_PL = { h: 'Wyślij wezwanie online — bezpłatnie', p: 'Odsetki i rekompensata liczone na dziś, własny link i kod QR, odpowiedź dłużnika jednym kliknięciem. Bez rejestracji, gotowe w 2 minuty.', btn: 'Wygeneruj wezwanie', href: '/wezwanie-online' };
const TOOL_EN = { h: 'Send an online demand — free', p: 'Interest and the recovery fee calculated as of today, its own link and QR code, a one-click reply from the debtor. No registration, ready in 2 minutes.', btn: 'Create a demand', href: '/wezwanie-online' };

module.exports = [
  {
    slug: 'kontrahent-nie-placi-faktury-co-robic', date: '2026-09-29', updated: '2026-09-29',
    related: ['przypomnienie-o-platnosci-monit-wzor', 'przedsadowe-wezwanie-do-zaplaty', 'skup-faktur-jak-dziala-ile-kosztuje'],
    pl: {
      seoTitle: 'Kontrahent nie płaci faktury — co robić',
      title: 'Kontrahent nie płaci faktury — co robić krok po kroku',
      desc: 'Kontrahent nie płaci faktury? Sześć kroków: dokumenty, przypomnienie, wezwanie z odsetkami, sprawdzenie dłużnika, ostateczne wezwanie i wybór: sąd czy sprzedaż.',
      lead: 'Im dłużej faktura leży po terminie, tym mniejsza szansa na zapłatę. Poniżej kolejność działań, która kosztuje najmniej i zostawia po sobie dowody — od pierwszego dnia opóźnienia do decyzji o sądzie albo sprzedaży faktury.',
      sections: [
        { h: '1. Uporządkuj dokumenty', p: [
          'Zanim napiszesz do dłużnika, zbierz to, czego zażąda sąd albo nabywca faktury: fakturę, umowę lub zamówienie, dowód wykonania (WZ, CMR, protokół odbioru, korespondencję potwierdzającą dostawę) i dowód doręczenia faktury. Sprawdź też termin płatności — odsetki biegną od dnia następnego po nim.',
        ] },
        { h: '2. Przypomnij — krótko i uprzejmie', p: [
          'Kilka dni po terminie wyślij <a href="/baza-wiedzy/przypomnienie-o-platnosci-monit-wzor">przypomnienie o płatności</a>. Część opóźnień to zwykłe przeoczenie; uprzejmy monit załatwia sprawę bez psucia relacji. Poproś o datę przelewu — odpowiedź na piśmie przyda się później.',
        ] },
        { h: '3. Wyślij wezwanie do zapłaty z odsetkami', p: [
          'Brak reakcji po tygodniu to sygnał, żeby przejść do formalnego <a href="/baza-wiedzy/wezwanie-do-zaplaty-wzor">wezwania do zapłaty</a>. Dolicz <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">odsetki ustawowe za opóźnienie w transakcjach handlowych</a> i <a href="/baza-wiedzy/rekompensata-40-70-100-euro">rekompensatę 40, 70 lub 100 euro</a> — należą się z mocy ustawy, bez zapisu w umowie.',
          'Najszybciej zrobisz to przez <a href="/wezwanie-online">bezpłatne wezwanie online</a>: kwota aktualizuje się codziennie, a dłużnik może jednym kliknięciem potwierdzić zapłatę, zadeklarować termin albo zgłosić zastrzeżenia. Widzisz też, kiedy wezwanie zostało otwarte.',
        ] },
        { h: '4. Sprawdź, z kim masz do czynienia', p: [
          'Równolegle <a href="/baza-wiedzy/jak-sprawdzic-kontrahenta-krs-biala-lista-krz">sprawdź dłużnika w rejestrach</a>: biała lista VAT, KRS (zaległości, egzekucje, likwidacja) i Krajowy Rejestr Zadłużonych. Wpis o restrukturyzacji albo upadłości zmienia wszystko — wtedy liczy się czas zgłoszenia wierzytelności, a nie kolejne wezwania.',
        ] },
        { h: '5. Ostateczne wezwanie przedsądowe', p: [
          'Jeżeli termin z wezwania minął, wyślij <a href="/baza-wiedzy/przedsadowe-wezwanie-do-zaplaty">ostateczne przedsądowe wezwanie do zapłaty</a> listem poleconym za potwierdzeniem odbioru — z zapowiedzią pozwu i ostrzeżeniem o zamiarze <a href="/baza-wiedzy/wpis-dluznika-do-krd-big">wpisu do biura informacji gospodarczej</a>.',
        ] },
        { h: '6. Wybierz: sąd, windykacja albo sprzedaż faktury', ul: [
          '<strong>Sąd</strong> — w elektronicznym postępowaniu upominawczym (EPU) opłata wynosi 1,25% wartości roszczenia, nie mniej niż 30 zł; w zwykłym trybie 5% przy roszczeniach powyżej 20 000 zł i opłata stała poniżej tej kwoty. Do tego czas: od kilku tygodni do wielu miesięcy, a potem egzekucja.',
          '<strong>Windykacja</strong> — ma sens, gdy dłużnik jest wypłacalny, ale gra na zwłokę.',
          '<strong>Sprzedaż faktury</strong> — dostajesz gotówkę od razu, a ryzyko i dalsze kroki przechodzą na nabywcę. Zobacz, <a href="/baza-wiedzy/skup-faktur-jak-dziala-ile-kosztuje">jak działa skup faktur i ile kosztuje</a>.',
        ], p2: [
          'Pilnuj terminu <a href="/baza-wiedzy/przedawnienie-faktury-b2b">przedawnienia</a>: roszczenia między firmami przedawniają się co do zasady po 3 latach, a ze sprzedaży towarów po 2 latach. Samo wezwanie biegu przedawnienia nie przerywa.',
        ] },
      ],
      faq: [
        ['Po ilu dniach od terminu płatności wysłać wezwanie?', 'Przypomnienie warto wysłać po 1–3 dniach, a formalne wezwanie po około 7 dniach bez reakcji. Prawo nie wymaga czekania — odsetki i rekompensata należą się już od pierwszego dnia opóźnienia.'],
        ['Czy mogę odzyskać VAT z niezapłaconej faktury?', 'Tak, w ramach tzw. ulgi na złe długi: gdy faktura nie zostanie zapłacona w ciągu 90 dni od terminu płatności, wierzyciel może skorygować podstawę opodatkowania i podatek należny. Szczegóły warto ustalić z księgowym.'],
        ['Co, jeśli dłużnik twierdzi, że nie dostał faktury?', 'Wyślij ją ponownie razem z wezwaniem i zachowaj dowód. W wezwaniu online kopia faktury jest załącznikiem do e-maila i jest dostępna pod linkiem wezwania.'],
      ],
      cta: TOOL_PL,
    },
    en: {
      seoTitle: 'Polish customer not paying an invoice',
      title: 'Your Polish customer is not paying an invoice — what to do, step by step',
      desc: 'A Polish customer is not paying? Six steps: documents, a reminder, a demand with interest, a register check, a final demand and the choice: court or sale.',
      lead: 'The longer an invoice stays overdue, the lower the chance of payment. Below is the order of actions that costs the least and leaves evidence behind — from the first day of delay to the decision to sue or to sell the invoice.',
      sections: [
        { h: '1. Put the documents in order', p: [
          'Before writing to the debtor, collect what a court or an invoice buyer will ask for: the invoice, the contract or order, proof of performance (delivery note, CMR, acceptance report, correspondence confirming delivery) and proof that the invoice was delivered. Check the due date — interest runs from the following day.',
        ] },
        { h: '2. Remind — briefly and politely', p: [
          'A few days after the due date send a <a href="/baza-wiedzy/przypomnienie-o-platnosci-monit-wzor">payment reminder</a>. Some delays are a simple oversight; a polite reminder settles the matter without damaging the relationship. Ask for the transfer date — a written answer will be useful later.',
        ] },
        { h: '3. Send a demand for payment with interest', p: [
          'No reaction after a week means it is time for a formal <a href="/baza-wiedzy/wezwanie-do-zaplaty-wzor">demand for payment</a>. Add <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">statutory late-payment interest</a> and the <a href="/baza-wiedzy/rekompensata-40-70-100-euro">fixed recovery fee of EUR 40, 70 or 100</a> — both are due by law, without a contract clause.',
          'The fastest way is the <a href="/wezwanie-online">free online demand</a>: the amount updates daily and the debtor can confirm payment, promise a date or raise an objection with one click. You also see when the demand was opened. The letter itself is in Polish.',
        ] },
        { h: '4. Check who you are dealing with', p: [
          'In parallel, <a href="/baza-wiedzy/jak-sprawdzic-kontrahenta-krs-biala-lista-krz">check the debtor in the public registers</a>: the VAT white list, the National Court Register (arrears, enforcement, liquidation) and the National Debtors Register. An entry about restructuring or bankruptcy changes everything — then the deadline for filing your claim matters, not further demands.',
        ] },
        { h: '5. The final pre-court demand', p: [
          'If the deadline from the demand has passed, send a <a href="/baza-wiedzy/przedsadowe-wezwanie-do-zaplaty">final pre-court demand</a> by registered post with acknowledgement of receipt — announcing a court claim and warning of the intended <a href="/baza-wiedzy/wpis-dluznika-do-krd-big">listing in a credit information bureau</a>.',
        ] },
        { h: '6. Choose: court, collection or selling the invoice', ul: [
          '<strong>Court</strong> — in the electronic writ-of-payment procedure (EPU) the fee is 1.25% of the claim, at least PLN 30; in ordinary proceedings 5% for claims above PLN 20,000 and a fixed fee below that. Add time: from a few weeks to many months, followed by enforcement.',
          '<strong>Collection</strong> — makes sense when the debtor is solvent but playing for time.',
          '<strong>Selling the invoice</strong> — you receive cash at once, and the risk and further steps pass to the buyer. See <a href="/baza-wiedzy/skup-faktur-jak-dziala-ile-kosztuje">how invoice purchase works and what it costs</a>.',
        ], p2: [
          'Watch the <a href="/baza-wiedzy/przedawnienie-faktury-b2b">limitation period</a>: claims between businesses become time-barred after 3 years as a rule, and claims from the sale of goods after 2 years. A demand letter alone does not interrupt the limitation period.',
        ] },
      ],
      faq: [
        ['How many days after the due date should I send a demand?', 'A reminder is worth sending after 1–3 days and a formal demand after about 7 days without a reaction. The law does not require waiting — interest and the recovery fee are due from the first day of delay.'],
        ['Must the demand be in Polish?', 'It is not a legal requirement, but a demand in Polish leaves no room for the excuse that it was not understood, and Polish courts work in Polish. The online demand is generated in Polish; you fill in the form in English.'],
        ['What if the debtor says the invoice never arrived?', 'Send it again with the demand and keep the proof. In the online demand a copy of the invoice is attached to the e-mail and available under the demand link.'],
      ],
      cta: TOOL_EN,
    },
  },

  {
    slug: 'przedsadowe-wezwanie-do-zaplaty', date: '2026-09-29', updated: '2026-09-29',
    related: ['wezwanie-do-zaplaty-wzor', 'wezwanie-do-zaplaty-e-mailem', 'przedawnienie-faktury-b2b'],
    pl: {
      seoTitle: 'Przedsądowe wezwanie do zapłaty — wzór',
      title: 'Przedsądowe wezwanie do zapłaty — wzór, termin i co dalej, gdy dłużnik milczy',
      desc: 'Przedsądowe (ostateczne) wezwanie do zapłaty faktury: co musi zawierać, jaki termin wyznaczyć, jak je doręczyć i co zrobić, gdy termin minie bez zapłaty.',
      lead: 'Przedsądowe wezwanie do zapłaty to ostatnie pismo przed pozwem. Prawo nie definiuje go osobno — od zwykłego wezwania różni się tonem, krótkim terminem i jasną zapowiedzią: brak zapłaty oznacza sąd i koszty po stronie dłużnika.',
      sections: [
        { h: 'Co musi zawierać', ul: [
          'pełne dane wierzyciela i dłużnika (firma, adres, NIP);',
          'podstawę roszczenia: numer i datę faktury, kwotę oraz pierwotny termin płatności;',
          'kwotę do zapłaty na dzień wezwania: należność główną, <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">odsetki ustawowe za opóźnienie w transakcjach handlowych</a> i <a href="/baza-wiedzy/rekompensata-40-70-100-euro">rekompensatę 40/70/100 euro</a>;',
          'termin zapłaty — zwykle 7 dni, przy kolejnym wezwaniu nawet 3 dni — oraz numer rachunku;',
          'zapowiedź skierowania sprawy do sądu i obciążenia dłużnika kosztami procesu, zastępstwa i egzekucji;',
          'jeżeli planujesz wpis — ostrzeżenie o zamiarze przekazania danych do biura informacji gospodarczej, z nazwą i adresem biura;',
          'datę i podpis osoby uprawnionej do reprezentacji.',
        ] },
        { h: 'Czy wezwanie przed pozwem jest obowiązkowe', p: [
          'Przy fakturze z określonym terminem płatności — nie. Dłużnik popada w opóźnienie automatycznie, a odsetki biegną bez wezwania. Wezwanie opłaca się jednak z trzech powodów.',
        ], ul: [
          'W pozwie trzeba podać, czy strony próbowały rozwiązać spór pozasądowo (art. 187 § 1 pkt 3 KPC). Wezwanie jest taką próbą.',
          'Jeżeli dłużnik nie dał powodu do wytoczenia sprawy i uzna roszczenie przy pierwszej czynności, sąd może obciążyć kosztami wierzyciela (art. 101 KPC). Wezwanie z dowodem doręczenia zamyka tę furtkę.',
          'Gdy termin zapłaty nie był określony, roszczenie staje się wymagalne dopiero po wezwaniu (art. 455 KC).',
        ] },
        { h: 'Jak doręczyć', p: [
          'Listem poleconym za potwierdzeniem odbioru na adres z KRS lub CEIDG — to dowód, którego sąd nie kwestionuje. Równolegle wyślij wezwanie elektronicznie: e-mail dociera tego samego dnia, a <a href="/wezwanie-online">wezwanie online</a> pokazuje, kiedy dłużnik je otworzył, i zbiera jego odpowiedź. O tym, ile wart jest sam e-mail, piszemy w poradniku <a href="/baza-wiedzy/wezwanie-do-zaplaty-e-mailem">wezwanie do zapłaty e-mailem</a>.',
        ] },
        { h: 'Termin minął — co dalej', p: [
          'Masz trzy drogi: pozew (najtaniej w elektronicznym postępowaniu upominawczym), zlecenie windykacji albo <a href="/baza-wiedzy/skup-faktur-jak-dziala-ile-kosztuje">sprzedaż faktury</a>. Jeżeli dłużnik w odpowiedzi na wezwanie zadeklarował termin zapłaty albo poprosił o raty, zachowaj tę odpowiedź — to <a href="/baza-wiedzy/uznanie-dlugu">uznanie długu</a>, które przerywa bieg przedawnienia.',
        ] },
      ],
      faq: [
        ['Ile dni wyznaczyć w przedsądowym wezwaniu do zapłaty?', 'Zwyczajowo 7 dni od doręczenia. Przy kolejnym, ostatecznym wezwaniu dopuszczalne są 3 dni. Dłuższy termin tylko odwleka sprawę.'],
        ['Czy przedsądowe wezwanie do zapłaty przerywa bieg przedawnienia?', 'Nie. Przedawnienie przerywa czynność przed sądem (na przykład pozew) albo uznanie długu przez dłużnika; mediacja tylko zawiesza jego bieg. Samo wezwanie, nawet ostateczne, biegu przedawnienia nie zatrzymuje.'],
        ['Czy wezwanie musi podpisać prawnik?', 'Nie. Wezwanie może wysłać sam wierzyciel — ważne, żeby podpisała je osoba uprawniona do reprezentacji firmy.'],
      ],
      cta: TOOL_PL,
    },
    en: {
      seoTitle: 'Final demand before court in Poland',
      title: 'The final pre-court demand for payment in Poland — content, deadline and next steps',
      desc: 'The final (pre-court) demand for payment to a Polish debtor: what it must contain, which deadline to set, how to deliver it and what to do when it passes.',
      lead: 'A pre-court demand is the last letter before a claim is filed. Polish law does not define it separately — it differs from an ordinary demand in tone, a short deadline and a clear announcement: no payment means court, at the debtor\'s cost.',
      sections: [
        { h: 'What it must contain', ul: [
          'full details of the creditor and the debtor (company, address, tax ID);',
          'the basis of the claim: invoice number and date, the amount and the original due date;',
          'the amount due as of the date of the demand: principal, <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">statutory late-payment interest</a> and the <a href="/baza-wiedzy/rekompensata-40-70-100-euro">EUR 40/70/100 recovery fee</a>;',
          'the payment deadline — usually 7 days, in a repeated demand even 3 days — and the bank account;',
          'the announcement of a court claim and of charging the debtor with the costs of proceedings, representation and enforcement;',
          'if you plan a listing — a warning of the intention to pass the data to a credit information bureau, with the name and address of the bureau;',
          'the date and the signature of a person authorised to represent the company.',
        ] },
        { h: 'Is a demand before the claim mandatory', p: [
          'For an invoice with a fixed due date — no. The debtor is in delay automatically and interest runs without a demand. A demand still pays off for three reasons.',
        ], ul: [
          'The statement of claim must say whether the parties tried to settle out of court (art. 187 § 1(3) of the Code of Civil Procedure). The demand is such an attempt.',
          'If the debtor gave no cause for the action and admits the claim at the first step, the court may charge the creditor with the costs (art. 101 of the Code). A demand with proof of delivery closes that door.',
          'Where no payment date was agreed, the claim becomes due only after a demand (art. 455 of the Civil Code).',
        ] },
        { h: 'How to deliver it', p: [
          'By registered post with acknowledgement of receipt to the address in the court register (KRS) or the business register (CEIDG) — evidence a court does not question. Send it electronically in parallel: e-mail arrives the same day, and the <a href="/wezwanie-online">online demand</a> shows when the debtor opened it and collects the reply. What e-mail alone is worth is explained in <a href="/baza-wiedzy/wezwanie-do-zaplaty-e-mailem">demand for payment by e-mail</a>.',
        ] },
        { h: 'The deadline has passed — what next', p: [
          'There are three routes: a court claim (cheapest in the electronic writ-of-payment procedure), collection, or <a href="/baza-wiedzy/skup-faktur-jak-dziala-ile-kosztuje">selling the invoice</a>. If the debtor answered the demand by promising a date or asking for instalments, keep that answer — it is an <a href="/baza-wiedzy/uznanie-dlugu">acknowledgement of the debt</a>, which interrupts the limitation period.',
        ] },
      ],
      faq: [
        ['How many days should a pre-court demand give?', 'Customarily 7 days from delivery. In a repeated, final demand 3 days are acceptable. A longer deadline only delays matters.'],
        ['Does a pre-court demand interrupt the limitation period?', 'No. The period is interrupted by an action before a court (for example a statement of claim) or by the debtor\'s acknowledgement of the debt; mediation only suspends it. A demand alone, even a final one, does not stop it.'],
        ['Does a lawyer have to sign the demand?', 'No. The creditor can send it — what matters is that it is signed by a person authorised to represent the company.'],
      ],
      cta: TOOL_EN,
    },
  },

  {
    slug: 'wezwanie-do-zaplaty-e-mailem', date: '2026-09-29', updated: '2026-09-29',
    related: ['wezwanie-do-zaplaty-wzor', 'przedsadowe-wezwanie-do-zaplaty', 'uznanie-dlugu'],
    pl: {
      seoTitle: 'Wezwanie do zapłaty e-mailem — czy skuteczne',
      title: 'Wezwanie do zapłaty e-mailem — czy jest skuteczne i jak udowodnić, że dotarło',
      desc: 'Czy wezwanie do zapłaty wysłane e-mailem jest ważne? Kiedy uznaje się je za doręczone, jak to udowodnić i w jakich sprawach potrzebny jest list polecony.',
      lead: 'Wezwanie do zapłaty nie wymaga papieru ani pieczątki. Wysłane e-mailem jest w pełni skuteczne — kłopot zaczyna się dopiero wtedy, gdy dłużnik twierdzi, że niczego nie dostał. Dlatego liczy się nie forma, lecz dowód.',
      sections: [
        { h: 'Co mówią przepisy', p: [
          'Kodeks cywilny nie przewiduje dla wezwania do zapłaty żadnej szczególnej formy. Oświadczenie można złożyć także elektronicznie (art. 60 KC), a uważa się je za złożone z chwilą, gdy zostało wprowadzone do środka komunikacji elektronicznej w taki sposób, żeby adresat mógł zapoznać się z jego treścią (art. 61 § 2 KC). Nie trzeba więc udowadniać, że dłużnik wiadomość przeczytał — wystarczy, że mógł.',
        ] },
        { h: 'Słaby punkt: dowód doręczenia', p: [
          'List polecony zostawia zwrotkę. E-mail — nie. W sporze wierzyciel musi wykazać, że wiadomość trafiła na skrzynkę dłużnika. Pomagają w tym:',
        ], ul: [
          'wysyłka na adres, którego dłużnik sam używa w korespondencji albo który podał w umowie lub w rejestrze;',
          'odpowiedź dłużnika — każda, nawet „zajmiemy się tym w przyszłym tygodniu”;',
          'potwierdzenie odczytu albo zapis otwarcia strony z wezwaniem;',
          'zachowana kopia wiadomości z nagłówkami i załącznikami.',
        ] },
        { h: 'Wezwanie online: e-mail z dowodem', p: [
          '<a href="/wezwanie-online">Wezwanie online</a> łączy szybkość e-maila z dokumentacją. Wiadomość prowadzi do strony wezwania pod unikalnym adresem; w rejestrze zapisujemy datę, adres IP i przeglądarkę każdego otwarcia i każdej odpowiedzi. Dłużnik odpowiada jednym kliknięciem — a deklaracja terminu zapłaty to <a href="/baza-wiedzy/uznanie-dlugu">uznanie długu</a>. Wierzyciel potwierdza swój adres e-mail przed wysyłką, więc nikt nie wyśle wezwania w cudzym imieniu.',
        ] },
        { h: 'Kiedy sam e-mail nie wystarczy', ul: [
          '<strong>Wpis do biura informacji gospodarczej</strong> — ustawa wymaga wezwania z ostrzeżeniem o wpisie, wysłanego listem poleconym albo doręczonego do rąk własnych. Zobacz <a href="/baza-wiedzy/wpis-dluznika-do-krd-big">warunki wpisu do KRD/BIG</a>.',
          '<strong>Spodziewany spór sądowy</strong> — przy większych kwotach wyślij równolegle list polecony za potwierdzeniem odbioru.',
          '<strong>Umowa wymaga formy pisemnej</strong> — jeżeli strony zastrzegły ją dla oświadczeń, trzymaj się umowy.',
        ], p2: [
          'W praktyce najlepiej działa połączenie obu kanałów: wezwanie elektroniczne od razu, a list polecony jako <a href="/baza-wiedzy/przedsadowe-wezwanie-do-zaplaty">ostateczne wezwanie przedsądowe</a>.',
        ] },
      ],
      faq: [
        ['Czy wezwanie do zapłaty wysłane e-mailem jest ważne?', 'Tak. Prawo nie wymaga dla wezwania formy pisemnej. Wezwanie e-mailem jest skuteczne, jeżeli dotarło do dłużnika w taki sposób, że mógł się z nim zapoznać.'],
        ['Czy muszę mieć podpis elektroniczny?', 'Nie. Kwalifikowany podpis jest potrzebny tylko tam, gdzie przepis albo umowa wymaga formy pisemnej. Dla wezwania do zapłaty wystarcza zwykła wiadomość, z której wynika, kto i czego żąda.'],
        ['Czy wezwanie e-mailem przerywa bieg przedawnienia?', 'Nie — tak samo jak wezwanie listowne. Przedawnienie przerywa dopiero pozew albo uznanie długu przez dłużnika.'],
      ],
      cta: TOOL_PL,
    },
    en: {
      seoTitle: 'Demand for payment by e-mail in Poland',
      title: 'A demand for payment by e-mail in Poland — is it valid and how to prove it arrived',
      desc: 'Is a demand for payment sent by e-mail valid in Poland? When it counts as delivered, how to prove it and in which cases registered post is still needed.',
      lead: 'A demand for payment needs neither paper nor a stamp. Sent by e-mail it is fully effective — the trouble starts only when the debtor claims nothing arrived. What counts is not the form but the evidence.',
      sections: [
        { h: 'What the law says', p: [
          'The Polish Civil Code prescribes no special form for a demand for payment. A declaration can be made electronically (art. 60) and is deemed made when it is entered into a means of electronic communication in such a way that the addressee could read it (art. 61 § 2). You do not have to prove that the debtor read the message — only that they could.',
        ] },
        { h: 'The weak point: proof of delivery', p: [
          'Registered post leaves a receipt. E-mail does not. In a dispute the creditor must show that the message reached the debtor\'s mailbox. What helps:',
        ], ul: [
          'sending to the address the debtor uses in correspondence or gave in the contract or the register;',
          'the debtor\'s reply — any reply, even “we will look at it next week”;',
          'a read receipt or a record of the demand page being opened;',
          'a saved copy of the message with headers and attachments.',
        ] },
        { h: 'The online demand: e-mail with evidence', p: [
          'The <a href="/wezwanie-online">online demand</a> combines the speed of e-mail with documentation. The message leads to a demand page at a unique address; the record keeps the date, IP address and browser of every open and every reply. The debtor replies with one click — and a promised payment date is an <a href="/baza-wiedzy/uznanie-dlugu">acknowledgement of the debt</a>. The creditor confirms their e-mail address before anything is sent, so nobody can send a demand in someone else\'s name.',
        ] },
        { h: 'When e-mail alone is not enough', ul: [
          '<strong>Listing in a credit information bureau</strong> — the Act requires a demand with a warning about the listing, sent by registered post or delivered by hand. See the <a href="/baza-wiedzy/wpis-dluznika-do-krd-big">conditions for a KRD/BIG listing</a>.',
          '<strong>An expected court dispute</strong> — for larger amounts send registered post with acknowledgement of receipt in parallel.',
          '<strong>The contract requires written form</strong> — if the parties reserved it for declarations, follow the contract.',
        ], p2: [
          'In practice the combination works best: the electronic demand at once, and registered post as the <a href="/baza-wiedzy/przedsadowe-wezwanie-do-zaplaty">final pre-court demand</a>.',
        ] },
      ],
      faq: [
        ['Is a demand for payment sent by e-mail valid in Poland?', 'Yes. The law does not require written form for a demand. A demand by e-mail is effective if it reached the debtor in such a way that they could read it.'],
        ['Do I need an electronic signature?', 'No. A qualified signature is needed only where a provision or the contract requires written form. For a demand an ordinary message showing who demands what is enough.'],
        ['Does a demand by e-mail interrupt the limitation period?', 'No — just like a demand by post. The period is interrupted only by a court claim or the debtor\'s acknowledgement of the debt.'],
      ],
      cta: TOOL_EN,
    },
  },

  {
    slug: 'uznanie-dlugu', date: '2026-09-29', updated: '2026-09-29',
    related: ['przedawnienie-faktury-b2b', 'wezwanie-do-zaplaty-e-mailem', 'przedsadowe-wezwanie-do-zaplaty'],
    pl: {
      seoTitle: 'Uznanie długu — skutki i jak je uzyskać',
      title: 'Uznanie długu — co to jest, jak je uzyskać od dłużnika i co daje wierzycielowi',
      desc: 'Uznanie długu przerywa bieg przedawnienia i ułatwia proces. Czym różni się uznanie właściwe od niewłaściwego, jak je uzyskać i na co uważać.',
      lead: 'Jedno zdanie dłużnika — „zapłacę do końca miesiąca” — potrafi być warte więcej niż trzy wezwania. To uznanie długu: przerywa bieg przedawnienia i jest dowodem, że dłużnik nie kwestionuje należności.',
      sections: [
        { h: 'Dwa rodzaje uznania', ul: [
          '<strong>Uznanie właściwe</strong> — umowa, w której dłużnik potwierdza istnienie i wysokość długu, zwykle połączona z ugodą albo harmonogramem spłat.',
          '<strong>Uznanie niewłaściwe</strong> — każde zachowanie dłużnika, z którego wynika, że wie o długu i zamierza go spłacić: prośba o rozłożenie na raty albo odroczenie terminu, deklaracja daty zapłaty, potwierdzenie salda, zapłata części z zaznaczeniem, że to wpłata na poczet większej należności.',
        ] },
        { h: 'Skutek pierwszy: przedawnienie biegnie od nowa', p: [
          'Bieg przedawnienia przerywa się przez uznanie roszczenia przez osobę, przeciwko której ono przysługuje (art. 123 § 1 pkt 2 KC). Po przerwaniu termin biegnie od początku (art. 124 § 1 KC) — dla roszczeń między firmami to co do zasady 3 lata, a ze sprzedaży towarów 2 lata, liczone do końca roku kalendarzowego. Więcej w poradniku o <a href="/baza-wiedzy/przedawnienie-faktury-b2b">przedawnieniu faktury B2B</a>.',
          'To ważne, bo samo wezwanie do zapłaty przedawnienia nie przerywa. Przerywa je dopiero reakcja dłużnika.',
        ] },
        { h: 'Skutek drugi: mocny dowód', p: [
          'Dłużnik, który uznał dług, nie może wiarygodnie twierdzić w sądzie, że należność nie istnieje. Pisemne, podpisane oświadczenie o uznaniu długu razem z wezwaniem do zapłaty pozwala żądać nakazu zapłaty w postępowaniu nakazowym (art. 485 § 1 KPC), w którym opłata sądowa jest niższa. Oświadczenie złożone e-mailem albo przez stronę internetową ma formę dokumentową — nie zastąpi podpisanego pisma w postępowaniu nakazowym, ale jest pełnoprawnym dowodem w postępowaniu upominawczym i zwykłym.',
        ] },
        { h: 'Jak uzyskać uznanie długu', ul: [
          'Zapytaj o termin zapłaty na piśmie i poproś o odpowiedź e-mailem.',
          'Zaproponuj ugodę albo spłatę w ratach — z potwierdzeniem kwoty długu w treści.',
          'Wyślij potwierdzenie salda do podpisu.',
          'Użyj <a href="/wezwanie-online">wezwania online</a>: dłużnik jednym kliknięciem deklaruje „zapłacę do dnia…”, a my zapisujemy datę, adres IP i przeglądarkę odpowiedzi. Deklarację dostajesz e-mailem.',
        ] },
        { h: 'Na co uważać', ul: [
          'Oświadczenie musi pochodzić od osoby uprawnionej do reprezentacji dłużnika albo od jego pełnomocnika — nie od przypadkowego pracownika.',
          'Uznanie złożone po upływie terminu przedawnienia niczego już nie przerywa. Może być zrzeczeniem się zarzutu przedawnienia tylko wtedy, gdy taki zamiar dłużnika jest wyraźny.',
          'Sama częściowa wpłata bez komentarza nie zawsze oznacza uznanie całego długu — liczą się okoliczności.',
        ] },
      ],
      faq: [
        ['Czy e-mail dłużnika z prośbą o raty to uznanie długu?', 'Co do zasady tak — to uznanie niewłaściwe, o ile prośba pochodzi od osoby uprawnionej do reprezentacji i dotyczy konkretnej należności. Zachowaj wiadomość z nagłówkami.'],
        ['Czy uznanie długu musi być na piśmie?', 'Nie. Przepisy nie wymagają szczególnej formy, ale forma decyduje o sile dowodu: podpisane pismo otwiera drogę do postępowania nakazowego, a e-mail lub deklaracja online są dowodem w pozostałych trybach.'],
        ['Czy częściowa zapłata przerywa bieg przedawnienia?', 'Tak, jeżeli z okoliczności wynika, że dłużnik traktuje ją jako wpłatę na poczet większego długu — na przykład wskazuje fakturę w tytule przelewu i zapowiada resztę.'],
      ],
      cta: { ...TOOL_PL, h: 'Zdobądź deklarację dłużnika na piśmie — bezpłatnie' },
    },
    en: {
      seoTitle: 'Acknowledgement of debt in Poland',
      title: 'Acknowledgement of debt in Poland — what it is, how to obtain it and what it gives the creditor',
      desc: 'An acknowledgement of debt interrupts the limitation period in Poland and makes a court case easier. The two types, how to obtain one and what to watch out for.',
      lead: 'One sentence from the debtor — “we will pay by the end of the month” — can be worth more than three demand letters. It is an acknowledgement of the debt: it interrupts the limitation period and shows the debtor does not dispute the claim.',
      sections: [
        { h: 'Two types of acknowledgement', ul: [
          '<strong>Proper acknowledgement</strong> — an agreement in which the debtor confirms the existence and amount of the debt, usually combined with a settlement or a repayment schedule.',
          '<strong>Improper acknowledgement</strong> — any conduct of the debtor showing that they know about the debt and intend to pay it: a request for instalments or a later date, a promised payment date, a balance confirmation, a part payment marked as payment towards a larger amount.',
        ] },
        { h: 'First effect: the limitation period starts again', p: [
          'The limitation period is interrupted by the acknowledgement of the claim by the person against whom it lies (art. 123 § 1(2) of the Civil Code). After the interruption the period runs anew (art. 124 § 1) — for claims between businesses 3 years as a rule, and 2 years for the sale of goods, counted to the end of the calendar year. More in the guide to the <a href="/baza-wiedzy/przedawnienie-faktury-b2b">limitation of B2B invoices</a>.',
          'This matters because a demand for payment alone does not interrupt the period. Only the debtor\'s reaction does.',
        ] },
        { h: 'Second effect: strong evidence', p: [
          'A debtor who acknowledged the debt cannot credibly argue in court that the claim does not exist. A written, signed acknowledgement together with a demand for payment allows a payment order in the order-for-payment procedure (art. 485 § 1 of the Code of Civil Procedure), where the court fee is lower. A statement made by e-mail or through a web page has documentary form — it does not replace a signed letter in that procedure, but it is full evidence in writ-of-payment and ordinary proceedings.',
        ] },
        { h: 'How to obtain an acknowledgement', ul: [
          'Ask for the payment date in writing and request an answer by e-mail.',
          'Propose a settlement or instalments — with the amount of the debt confirmed in the text.',
          'Send a balance confirmation for signature.',
          'Use the <a href="/wezwanie-online">online demand</a>: with one click the debtor declares “I will pay by…”, and we record the date, IP address and browser of the reply. You receive the declaration by e-mail.',
        ] },
        { h: 'What to watch out for', ul: [
          'The statement must come from a person authorised to represent the debtor or from their attorney — not from a random employee.',
          'An acknowledgement made after the limitation period has expired interrupts nothing. It can be a waiver of the limitation defence only where that intention of the debtor is clear.',
          'A part payment without comment does not always mean the whole debt is acknowledged — the circumstances count.',
        ] },
      ],
      faq: [
        ['Is a debtor\'s e-mail asking for instalments an acknowledgement of the debt?', 'As a rule yes — it is an improper acknowledgement, provided the request comes from a person authorised to represent the debtor and concerns a specific claim. Keep the message with its headers.'],
        ['Must an acknowledgement of debt be in writing?', 'No. The law requires no special form, but the form decides the strength of the evidence: a signed letter opens the order-for-payment procedure, while an e-mail or an online declaration is evidence in the other procedures.'],
        ['Does a part payment interrupt the limitation period?', 'Yes, if the circumstances show that the debtor treats it as payment towards a larger debt — for example names the invoice in the transfer title and announces the rest.'],
      ],
      cta: { ...TOOL_EN, h: 'Get the debtor\'s declaration in writing — free' },
    },
  },

  {
    slug: 'przypomnienie-o-platnosci-monit-wzor', date: '2026-09-29', updated: '2026-09-29',
    related: ['kontrahent-nie-placi-faktury-co-robic', 'wezwanie-do-zaplaty-wzor', 'nota-odsetkowa-wzor'],
    pl: {
      seoTitle: 'Przypomnienie o płatności — wzór monitu',
      title: 'Przypomnienie o płatności (monit) — wzór, ton i kiedy przejść do wezwania',
      desc: 'Wzór przypomnienia o płatności faktury: co napisać, kiedy wysłać i jakim tonem. Czym monit różni się od wezwania do zapłaty i po ilu dniach eskalować.',
      lead: 'Przypomnienie o płatności to pierwszy i najtańszy krok po terminie. Nie straszy sądem — zakłada przeoczenie i daje dłużnikowi wygodną drogę do zapłaty. Dobrze napisane załatwia większość drobnych opóźnień.',
      sections: [
        { h: 'Kiedy wysłać', p: [
          'Między 1. a 3. dniem po terminie płatności. Wcześniej nie ma podstaw, później dłużnik uznaje, że nikt nie pilnuje terminów. Część firm wysyła też krótką informację na 2–3 dni przed terminem — to nie monit, tylko uprzejmość, która skraca opóźnienia.',
        ] },
        { h: 'Co napisać', ul: [
          'numer i datę faktury, kwotę oraz termin płatności, który minął;',
          'numer rachunku — najlepiej ten z faktury i z białej listy VAT;',
          'prośbę o zapłatę albo o informację, kiedy przelew zostanie zlecony;',
          'zdanie na wypadek, gdyby płatność była już w drodze;',
          'dane osoby do kontaktu.',
        ] },
        { h: 'Wzór przypomnienia', p: [
          '<strong>Temat:</strong> Przypomnienie o płatności — faktura nr [numer]',
          'Dzień dobry, uprzejmie przypominamy, że termin płatności faktury nr [numer] z dnia [data] na kwotę [kwota] zł minął [data terminu]. Prosimy o zapłatę na rachunek [numer rachunku] albo o informację o planowanej dacie przelewu. Jeżeli płatność została już zlecona, prosimy uznać tę wiadomość za nieaktualną. W razie pytań do faktury jesteśmy do dyspozycji.',
          'Z poważaniem, [imię i nazwisko, firma]',
        ] },
        { h: 'Monit a wezwanie do zapłaty', p: [
          'Przypomnienie jest uprzejme i nie zawiera żądań dodatkowych. <a href="/baza-wiedzy/wezwanie-do-zaplaty-wzor">Wezwanie do zapłaty</a> jest stanowcze: wyznacza termin, dolicza <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">odsetki</a> i <a href="/baza-wiedzy/rekompensata-40-70-100-euro">rekompensatę</a> oraz zapowiada dalsze kroki. Nie mieszaj obu tonów w jednym piśmie — monit z groźbą sądu brzmi niepoważnie, a wezwanie z przeprosinami nie działa.',
        ] },
        { h: 'Kiedy eskalować', p: [
          'Jeżeli po 7 dniach nie ma ani przelewu, ani odpowiedzi, wyślij wezwanie. Najprościej przez <a href="/wezwanie-online">bezpłatne wezwanie online</a> — dane z monitu wpisujesz raz, odsetki liczą się same, a dłużnik odpowiada jednym kliknięciem. Cały plan działania opisujemy w poradniku <a href="/baza-wiedzy/kontrahent-nie-placi-faktury-co-robic">kontrahent nie płaci faktury</a>.',
        ] },
      ],
      faq: [
        ['Czy za wysłanie przypomnienia mogę doliczyć opłatę?', 'Osobnej opłaty za monit nie ma, ale między firmami od pierwszego dnia opóźnienia należy się rekompensata 40, 70 lub 100 euro za koszty odzyskiwania należności — niezależnie od tego, czy wysłałeś przypomnienie.'],
        ['Czy przypomnienie jest obowiązkowe przed wezwaniem?', 'Nie. Możesz od razu wysłać wezwanie do zapłaty. Przypomnienie to wybór biznesowy — chroni relację z klientem, który zwykle płaci w terminie.'],
        ['Lepiej zadzwonić czy napisać?', 'Napisać. Rozmowa nie zostawia śladu, a odpowiedź na piśmie z datą zapłaty jest dowodem i może być uznaniem długu.'],
      ],
      cta: { ...TOOL_PL, h: 'Przypomnienie nie pomogło? Wyślij wezwanie online' },
    },
    en: {
      seoTitle: 'Payment reminder to a Polish customer',
      title: 'A payment reminder to a Polish customer — template, tone and when to escalate',
      desc: 'A payment reminder template for an overdue invoice: what to write, when to send it and in what tone. How a reminder differs from a demand and when to escalate.',
      lead: 'A payment reminder is the first and cheapest step after the due date. It does not threaten court — it assumes an oversight and gives the debtor an easy way to pay. Well written, it settles most minor delays.',
      sections: [
        { h: 'When to send it', p: [
          'Between the 1st and the 3rd day after the due date. Earlier there is no basis, later the debtor concludes that nobody watches the deadlines. Some companies also send a short note 2–3 days before the due date — not a reminder but a courtesy that shortens delays.',
        ] },
        { h: 'What to write', ul: [
          'the invoice number and date, the amount and the due date that has passed;',
          'the bank account — preferably the one on the invoice and on the VAT white list;',
          'a request to pay or to say when the transfer will be made;',
          'a sentence in case the payment is already on its way;',
          'the contact person.',
        ] },
        { h: 'Reminder template', p: [
          '<strong>Subject:</strong> Payment reminder — invoice no. [number]',
          'Dear Sir or Madam, we would like to remind you that invoice no. [number] of [date] for [amount] was due on [due date]. Please pay to account [account number] or let us know the planned transfer date. If the payment has already been made, please disregard this message. We are happy to answer any questions about the invoice.',
          'Kind regards, [name, company]',
        ] },
        { h: 'Reminder versus demand for payment', p: [
          'A reminder is polite and makes no additional claims. A <a href="/baza-wiedzy/wezwanie-do-zaplaty-wzor">demand for payment</a> is firm: it sets a deadline, adds <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">interest</a> and the <a href="/baza-wiedzy/rekompensata-40-70-100-euro">recovery fee</a> and announces further steps. Do not mix both tones in one letter — a reminder threatening court sounds unserious, and a demand with apologies does not work.',
        ] },
        { h: 'When to escalate', p: [
          'If after 7 days there is neither a transfer nor an answer, send a demand. The simplest way is the <a href="/wezwanie-online">free online demand</a> — you enter the details once, interest is calculated automatically and the debtor replies with one click. The whole plan is described in <a href="/baza-wiedzy/kontrahent-nie-placi-faktury-co-robic">your Polish customer is not paying</a>.',
        ] },
      ],
      faq: [
        ['Can I charge a fee for sending a reminder?', 'There is no separate reminder fee, but between businesses the recovery fee of EUR 40, 70 or 100 is due from the first day of delay — whether or not you sent a reminder.'],
        ['Is a reminder mandatory before a demand?', 'No. You can send a demand for payment straight away. A reminder is a business choice — it protects the relationship with a customer who usually pays on time.'],
        ['Is it better to call or to write?', 'To write. A call leaves no trace, while a written answer with a payment date is evidence and may be an acknowledgement of the debt.'],
      ],
      cta: { ...TOOL_EN, h: 'The reminder did not help? Send an online demand' },
    },
  },

  {
    slug: 'dostales-wezwanie-do-zaplaty-co-zrobic', date: '2026-09-29', updated: '2026-09-29',
    related: ['uznanie-dlugu', 'przedawnienie-faktury-b2b', 'rekompensata-40-70-100-euro'],
    pl: {
      seoTitle: 'Dostałeś wezwanie do zapłaty — co zrobić',
      title: 'Dostałeś wezwanie do zapłaty? Co zrobić i jak odpowiedzieć — także na wezwanie online',
      desc: 'Wezwanie do zapłaty w skrzynce: jak sprawdzić, czy jest prawdziwe, jakie masz możliwości i co oznacza odpowiedź na wezwanie z sprzedamfakture.pl.',
      lead: 'Wezwania do zapłaty nie warto ignorować — odsetki rosną każdego dnia, a brak reakcji prowadzi do sądu i wpisu do rejestru dłużników. Zacznij od sprawdzenia, czy wezwanie jest zasadne, a potem wybierz jedną z trzech odpowiedzi.',
      sections: [
        { h: 'Najpierw sprawdź', ul: [
          'Czy faktura istnieje, czy ją otrzymałeś i czy towar albo usługa zostały wykonane.',
          'Czy kwota się zgadza i czy faktura nie została już zapłacona — porównaj z wyciągiem.',
          'Czy rachunek bankowy z wezwania należy do wierzyciela — sprawdź go na białej liście VAT.',
          'Czy roszczenie nie jest przedawnione — zobacz <a href="/baza-wiedzy/przedawnienie-faktury-b2b">terminy przedawnienia faktur B2B</a>.',
        ] },
        { h: 'Wezwanie z sprzedamfakture.pl — czym jest', p: [
          'Jeżeli dostałeś wiadomość z adresu windykacja@sprzedamfakture.pl, to wezwanie wygenerował Twój kontrahent w naszym serwisie — wysyłamy je na jego zlecenie i w jego imieniu, po potwierdzeniu przez niego adresu e-mail. Link prowadzi do strony w domenie sprzedamfakture.pl/w/…, na której widać strony, numer faktury i kwotę na dziś.',
          'W wezwaniu online nie jesteśmy stroną sporu i <strong>nie przyjmujemy wpłat</strong>. Należność płacisz bezpośrednio wierzycielowi, na rachunek wskazany w wezwaniu. W razie wątpliwości skontaktuj się z kontrahentem — odpowiedź na e-mail z wezwaniem trafia prosto do niego.',
        ] },
        { h: 'Trzy możliwe odpowiedzi', ul: [
          '<strong>Zapłaciłem</strong> — podaj datę przelewu. Wierzyciel dostaje informację od razu.',
          '<strong>Zapłacę do dnia…</strong> — deklaracja terminu jest wiążącym oświadczeniem i <a href="/baza-wiedzy/uznanie-dlugu">uznaniem długu</a>: przerywa bieg przedawnienia. Składaj ją tylko wtedy, gdy nie kwestionujesz należności.',
          '<strong>Kwestionuję fakturę</strong> — opisz krótko powód: reklamacja, brak dostawy, błąd w kwocie, wcześniejsza zapłata. Dołącz dokumenty w odpowiedzi do wierzyciela.',
        ], p2: [
          'Na stronie wezwania odpowiedź można złożyć tylko raz; zapisujemy jej datę, adres IP i przeglądarkę.',
        ] },
        { h: 'Co grozi za brak reakcji', p: [
          'Między firmami wierzycielowi należą się <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">odsetki ustawowe za opóźnienie</a> i <a href="/baza-wiedzy/rekompensata-40-70-100-euro">rekompensata 40, 70 lub 100 euro</a> od każdej faktury — bez względu na to, czy było wezwanie. Dalej są: <a href="/baza-wiedzy/wpis-dluznika-do-krd-big">wpis do biura informacji gospodarczej</a>, pozew, koszty sądowe i egzekucja. Wierzyciel może też sprzedać fakturę — wtedy rozmawiasz już z nabywcą.',
        ] },
      ],
      faq: [
        ['Czy wezwanie do zapłaty wysłane e-mailem jest ważne?', 'Tak. Prawo nie wymaga dla wezwania formy pisemnej. Więcej w poradniku <a href="/baza-wiedzy/wezwanie-do-zaplaty-e-mailem">wezwanie do zapłaty e-mailem</a>.'],
        ['Czy muszę zapłacić rekompensatę 40 euro?', 'W transakcjach między firmami tak — rekompensata należy się wierzycielowi z mocy ustawy od dnia, w którym stały się wymagalne odsetki, bez wykazywania kosztów.'],
        ['Jak sprawdzić, czy wezwanie z sprzedamfakture.pl jest prawdziwe?', 'Adres strony zaczyna się od sprzedamfakture.pl/w/, a w wezwaniu są dane Twojego kontrahenta i numer faktury. Wezwanie online nigdy nie zawiera prośby o wpłatę na nasz rachunek ani o dane logowania. W razie wątpliwości zapytaj kontrahenta bezpośrednio.'],
      ],
      cta: { ...TOOL_PL, h: 'Masz własnych dłużników? Wyślij wezwanie online — bezpłatnie' },
    },
    en: {
      seoTitle: 'Received a demand for payment from Poland',
      title: 'Received a demand for payment from a Polish creditor? What to do and how to reply',
      desc: 'A demand for payment in your inbox: how to check it is genuine, what your options are and what a reply to a demand from sprzedamfakture.pl means.',
      lead: 'A demand for payment should not be ignored — interest grows every day, and no reaction leads to court and a listing in a debtors register. Start by checking whether the demand is justified, then choose one of three replies.',
      sections: [
        { h: 'Check first', ul: [
          'Whether the invoice exists, whether you received it and whether the goods or services were delivered.',
          'Whether the amount is right and the invoice has not been paid already — compare with your bank statement.',
          'Whether the bank account in the demand belongs to the creditor — check it on the Polish VAT white list.',
          'Whether the claim is time-barred — see the <a href="/baza-wiedzy/przedawnienie-faktury-b2b">limitation periods for B2B invoices</a>.',
        ] },
        { h: 'A demand from sprzedamfakture.pl — what it is', p: [
          'If you received a message from windykacja@sprzedamfakture.pl, your business partner generated the demand in our service — we send it at their request and in their name, after they confirmed their e-mail address. The link leads to a page at sprzedamfakture.pl/w/… showing the parties, the invoice number and the amount as of today.',
          'In an online demand we are not a party to the dispute and <strong>we do not accept payments</strong>. You pay the creditor directly, to the account given in the demand. If in doubt, contact your business partner — a reply to the e-mail goes straight to them.',
        ] },
        { h: 'Three possible replies', ul: [
          '<strong>I have paid</strong> — give the transfer date. The creditor is informed at once.',
          '<strong>I will pay by…</strong> — a promised date is a binding statement and an <a href="/baza-wiedzy/uznanie-dlugu">acknowledgement of the debt</a>: it interrupts the limitation period. Make it only if you do not dispute the claim.',
          '<strong>I dispute the invoice</strong> — describe the reason briefly: a complaint, no delivery, a wrong amount, an earlier payment. Attach documents in your reply to the creditor.',
        ], p2: [
          'On the demand page a reply can be given only once; we record its date, IP address and browser.',
        ] },
        { h: 'The risk of not reacting', p: [
          'Between businesses the creditor is owed <a href="/baza-wiedzy/odsetki-za-opoznienie-w-transakcjach-handlowych">statutory late-payment interest</a> and the <a href="/baza-wiedzy/rekompensata-40-70-100-euro">recovery fee of EUR 40, 70 or 100</a> per invoice — whether or not a demand was sent. Next come a <a href="/baza-wiedzy/wpis-dluznika-do-krd-big">listing in a credit information bureau</a>, a court claim, court costs and enforcement. The creditor may also sell the invoice — then you deal with the buyer.',
        ] },
      ],
      faq: [
        ['Is a demand for payment sent by e-mail valid?', 'Yes. Polish law does not require written form for a demand. More in <a href="/baza-wiedzy/wezwanie-do-zaplaty-e-mailem">demand for payment by e-mail</a>.'],
        ['Do I have to pay the EUR 40 recovery fee?', 'In transactions between businesses yes — the fee is due to the creditor by law from the day interest became due, without proof of costs.'],
        ['How do I check that a demand from sprzedamfakture.pl is genuine?', 'The page address starts with sprzedamfakture.pl/w/ and the demand shows your business partner\'s details and the invoice number. An online demand never asks for payment to our account or for login details. If in doubt, ask your business partner directly.'],
      ],
      cta: { ...TOOL_EN, h: 'Have debtors of your own? Send an online demand — free' },
    },
  },
];
