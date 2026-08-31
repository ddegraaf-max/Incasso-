// sprzedamfakture.pl — teksten PL/EN
// - top-level keys: landing /windykacja (windykacja, faktoring, panel AI)
// - common: nav/footer op alle publieke pagina's
// - home: strona główna (sprzedaj fakturę)
// - error: 404/500
// Placeholders: {fee} = SERVICE_FEE, {low}/{high} = oferta-percentages.
module.exports = {
  pl: {
    langName: 'PL', otherLang: 'en', otherLangName: 'EN', htmlLang: 'pl',
    metaTitle: 'Windykacja B2B, faktoring i panel AI — sprzedamfakture.pl',
    metaDesc: 'Windykacja B2B, faktoring i software AI do należności. Ty płacisz stałą opłatę — odsetki, rekompensatę i koszty pokrywa dłużnik.',
    navServices: 'Usługi', navWhy: 'Dlaczego my', navContact: 'Kontakt', navCalc: 'Kalkulator odsetek', navSell: 'Sprzedaj fakturę', navApp: 'Panel klienta',
    heroH1: 'Faktura wystawiona. Pieniądze odzyskane.',
    heroSub: 'sprzedamfakture.pl łączy holenderską dyscyplinę płatniczą z realiami polskiego rynku: sprzedaż faktur, windykacja B2B, faktoring i oprogramowanie AI do zarządzania należnościami — od pierwszego przypomnienia po odzyskane środki.',
    ctaTalk: 'Porozmawiajmy', ctaSee: 'Zobacz, jak pracujemy',
    stats: [
      ['38%', 'faktur B2B w Polsce jest przeterminowanych', '1'],
      ['54 dni', 'średni termin płatności — najdłuższy od 2017 r.', '2'],
      ['6 566', 'niewypłacalności firm w 2025 r. — rekord', '2'],
      ['68%', 'polskich firm zgłasza problemy z opóźnieniami płatności', '3'],
    ],
    svcKicker: 'Co robimy',
    services: [
      ['01', 'Windykacja polubowna i sądowa', 'Monitoring, wezwania do zapłaty, negocjacje i wpis dłużnika do rejestru BIG — a gdy trzeba, droga sądowa z naszymi partnerami prawnymi. Rozliczenie od skuteczności: prowizja wyłącznie od kwot faktycznie odzyskanych.'],
      ['02', 'Faktoring — płynność bez czekania', 'Zamień faktury z terminem 30–90 dni na gotówkę w 48 godzin. Finansujemy pojedyncze faktury i całe portfele — z przejęciem ryzyka niewypłacalności lub bez.'],
      ['03', 'Software AI do należności', 'Wgrywasz fakturę — resztą zajmuje się agent AI: monitoruje termin, wysyła przypomnienia we właściwym tonie i czasie, eskaluje do windykacji, gdy trzeba. Twój zespół widzi pełną historię, robi mniej. Gotowe na KSeF od pierwszego dnia.'],
      ['04', 'Wykup wierzytelności — gotówka od ręki', 'Chcesz zamknąć temat? Agent AI wycenia wierzytelność w kilka minut i składa ofertę wykupu. Akceptujesz — pieniądze masz w 24 godziny, ryzyko przechodzi na nas.'],
    ],
    lawKicker: 'Prawo jest po stronie wierzyciela',
    law: [
      ['14%', 'Odsetki za opóźnienie, rocznie', 'Naliczane bez wezwania, od dnia następującego po terminie płatności. Stopa referencyjna NBP + 10 p.p. — stawka na I półrocze 2026.', '5'],
      ['170–430 zł', 'Rekompensata od każdej faktury', '170, 300 lub 430 zł — zależnie od kwoty faktury (do 5 tys. zł / 5–50 tys. zł / od 50 tys. zł), przeliczenie wg kursu NBP. Bez dowodu poniesionych kosztów.', '6'],
      ['100%', 'Kosztów windykacji ponad ryczałt', 'Uzasadnione koszty odzyskiwania należności przewyższające ryczałt również pokrywa dłużnik — podobnie jak koszty komornika w egzekucji.', '6'],
    ],
    calcLink: 'Policz odsetki i rekompensatę dla swojej faktury →',
    pathKicker: 'Ścieżka eskalacji',
    path: [
      ['01 · Dzień 1', 'Wezwanie do zapłaty + nota odsetkowa'],
      ['02 · +30 dni', 'Zapowiedź wpisu do rejestru BIG'],
      ['03 · 2 tyg.–3 mies.', 'Nakaz zapłaty z sądu'],
      ['04 · Egzekucja', 'Komornik — na koszt dłużnika'],
    ],
    modelKicker: 'Model rozliczenia',
    model: [
      ['Ty płacisz', 'Stałą opłatę serwisową od sprawy', 'Przewidywalny koszt zlecenia — bez procentu od odzyskanej kwoty.'],
      ['Dłużnik płaci', 'Odsetki, rekompensatę i koszty', 'Zgodnie z ustawą — windykacja realnie na koszt dłużnika.'],
      ['Albo', 'Sprzedajesz wierzytelność', 'Oferta wykupu od agenta AI, wypłata w 24 godziny.'],
    ],
    whyKicker: 'Dlaczego my',
    whyH: 'Holenderska kultura płatnicza. Polski rynek.',
    whyP: 'W Holandii problemy z opóźnieniami zgłasza 30% firm — w Polsce 68%. Przenosimy procesy z jednego z najzdrowszych płatniczo rynków Europy: stanowczo wobec dłużnika, z szacunkiem dla relacji handlowych.',
    whySup: '3',
    nowKicker: 'Dlaczego teraz',
    now: [
      ['KSeF 2026', 'Obowiązkowe e-fakturowanie zamienia należności w dane — łatwiejsze do monitorowania, wyceny i finansowania.', '4'],
      ['34%', 'firm zleca już windykację na zewnątrz — i ten odsetek rośnie z roku na rok.', '2'],
      ['8,5%', 'tylko tyle firm nie ma żadnych zaległości — rok wcześniej było to 14,6%.', '2'],
    ],
    closingH: 'Przestań darmowo kredytować swoich kontrahentów.',
    ctaCall: 'Umów rozmowę', ctaPanel: 'Wypróbuj panel', ctaSell: 'Sprzedaj fakturę — wycena od razu',
    srcKicker: 'Źródła',
    sources: [
      'Atradius, B2B Payment Practices Trends: Poland, 2025.',
      'Coface, Poland Payment Survey, 2026 (badanie za 2025 r.).',
      'EU Payment Observatory, Komisja Europejska, 2025.',
      'Ministerstwo Finansów, harmonogram wdrożenia KSeF, 2026.',
      'Biznes.gov.pl — odsetki ustawowe za opóźnienie w transakcjach handlowych, stawka na I półrocze 2026 (stopa ref. NBP 4% + 10 p.p.).',
      'Ustawa z dnia 8 marca 2013 r. o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych, art. 7 i 10.',
    ],
    copyright: '© 2026 sprzedamfakture.pl',

    common: {
      navHome: 'Strona główna', navSell: 'Sprzedaj fakturę', navCollection: 'Windykacja', navCalc: 'Kalkulator odsetek', navPanel: 'Panel klienta', navJudgments: 'Skup wyroków', footJudgments: 'skup starych wyroków',
      footerModel: 'Nasz model: Ty płacisz {fee} zł za sprawę — odsetki, rekompensatę i koszty pokrywa dłużnik. Albo sprzedajesz fakturę i masz gotówkę w 24 godziny.',
      footCollection: 'windykacja', footCalc: 'kalkulator odsetek', footConcept: 'koncept produktu',
      versionTitle: 'Wersja serwisu · commit', skip: 'Przejdź do treści', tagline: 'Gotówka za fakturę w 24 h',
    },

    home: {
      metaTitle: 'sprzedamfakture.pl — Sprzedaj fakturę. Gotówka w 24 godziny.',
      metaDesc: 'Sprzedaj przeterminowaną fakturę B2B na sprzedamfakture.pl. Wycena AI w kilka minut, cesja online, przelew w 24 godziny. Ryzyko niewypłacalności dłużnika przechodzi na nas.',
      ogDesc: 'Kontrahent nie płaci? Sprzedaj nam fakturę B2B: wycena AI w kilka minut, cesja online, przelew następnego dnia roboczego.',
      nav: { how: 'Jak to działa', quote: 'Wycena', faq: 'FAQ', collection: 'Windykacja', panel: 'Panel klienta', cta: 'Sprzedaj fakturę' },
      heroH1: ['Sprzedaj fakturę.', 'Gotówka w 24 godziny.'],
      heroSub: 'Kontrahent nie płaci? Nie czekaj miesiącami na windykację. Sprzedaj nam przeterminowaną fakturę B2B — wycena AI w kilka minut, cesja online, przelew następnego dnia roboczego. Ryzyko niewypłacalności przechodzi na nas.',
      ctaQuote: 'Sprawdź wycenę', ctaHow: 'Jak to działa',
      card: { title: 'Oferta wykupu', invoice: 'Faktura', overdue: '45 dni po terminie', score: 'AIScore 67', offer: 'Nasza oferta', foot: 'Cesja online · przelew w 24 godziny', chipA: '76% wartości', chipB: 'Ryzyko: nasze', seal: '24h' },
      steps: {
        kicker: 'Jak to działa',
        items: [
          ['01 · 2 minuty', 'Wyślij fakturę i NIP dłużnika'],
          ['02 · Kilka minut', 'AI sprawdza KRZ, KRS i białą listę — dostajesz ofertę'],
          ['03 · Online', 'Podpisujesz cesję elektronicznie'],
          ['04 · 24 godziny', 'Pieniądze na Twoim koncie'],
        ],
      },
      quote: {
        kicker: 'Wstępna wycena — od razu', labelAmount: 'Kwota faktury (zł)', labelDays: 'Dni po terminie', phAmount: 'np. 12400', phDays: 'np. 45',
        btn: 'Policz ofertę',
        resultSub: 'wstępna oferta ({low}–{high}% wartości) — ostateczna po weryfikacji dłużnika w KRZ, KRS i białej liście. Odsetki nabywamy razem z wierzytelnością (art. 509 § 2 KC).',
        resultCta: 'Przyjmuję — wyślij fakturę',
        hint: 'Oferta liczy się na bieżąco podczas wpisywania. Wycena ma charakter orientacyjny i nie stanowi oferty w rozumieniu art. 66 KC.',
      },
      why: {
        kicker: 'Dlaczego warto sprzedać',
        items: [
          ['Płynność', 'Gotówka od ręki', 'Zamiast czekać 3–12 miesięcy na windykację lub sąd, masz pieniądze następnego dnia roboczego.'],
          ['Ryzyko', 'Upadłość? Nasz problem', 'Po cesji ryzyko niewypłacalności dłużnika w całości przechodzi na nas — bez regresu.'],
          ['Spokój', 'Czysty bilans, zero windykacji', 'Koniec telefonów, wezwań i pilnowania terminów. Wierzytelność znika z Twoich ksiąg.'],
        ],
      },
      faq: {
        kicker: 'FAQ', h: 'Najczęstsze pytania',
        items: [
          ['Ile dostanę za fakturę?', 'Zależnie od AIScore dłużnika: zwykle 55–90% wartości. Im krótsze opóźnienie i czystszy dłużnik w rejestrach, tym wyższa oferta. Odsetki za opóźnienie przechodzą na nas razem z wierzytelnością.'],
          ['Na kogo musi być wystawiona faktura?', 'Dłużnikiem musi być osoba prawna — najczęściej sp. z o.o. lub S.A. Faktur wystawionych na jednoosobowe działalności (JDG), spółki cywilne, spółki osobowe lub konsumentów obecnie nie skupujemy. Twoja firma (sprzedający) może mieć dowolną formę prawną.'],
          ['Czy każda faktura się kwalifikuje?', 'Kupujemy bezsporne faktury B2B. Sprawdzamy, czy umowa z dłużnikiem nie zawiera zakazu cesji (art. 509 § 1 KC) i czy dłużnik nie jest w upadłości — wtedy oferta nie jest możliwa.'],
          ['Co z rekompensatą 40/70/100 €?', 'Ta pozostaje przy Tobie — z mocy ustawy (art. 10 ust. 4) nie podlega cesji. Możesz jej dochodzić samodzielnie, oferta dotyczy należności głównej z odsetkami.'],
          ['Czy dłużnik się dowie?', 'Tak — po cesji zawiadamiamy dłużnika na piśmie (art. 512 KC). Od tego momentu płaci wyłącznie nam.'],
          ['Mam stary wyrok albo nakaz zapłaty — też kupicie?', 'Tak — prowadzimy <a href="/skup-wyrokow">skup starych wyroków</a>: wierzytelności stwierdzone tytułem wykonawczym wyceniamy osobno, zazwyczaj na 10–40% wartości nominalnej, po sprawdzeniu biegu przedawnienia i powodu umorzenia poprzedniej egzekucji.'],
          ['Wolę nie sprzedawać — tylko odzyskać pieniądze?', 'Też możemy: <a href="/windykacja">windykacja na koszt dłużnika</a> — Ty płacisz {fee} zł od sprawy, odsetki (14%), rekompensatę i koszty pokrywa dłużnik. Agent AI prowadzi sprawę w panelu.'],
        ],
      },
      form: {
        kicker: 'Sprzedaj fakturę', company: 'Twoja firma', nip: 'NIP dłużnika', amount: 'Kwota faktury (zł)', days: 'Dni po terminie', email: 'E-mail', tel: 'Telefon',
        forma: 'Forma prawna dłużnika', formaPh: '— wybierz —',
        formaNote: 'Skupujemy wierzytelności wobec spółek posiadających osobowość prawną (np. sp. z o.o., S.A.). Twoja firma może mieć dowolną formę.',
        formaOptions: [['spzoo', 'Spółka z o.o.'], ['sa', 'Spółka akcyjna (S.A.)'], ['psa', 'Prosta spółka akcyjna (P.S.A.)'], ['inna-op', 'Inna osoba prawna (spółdzielnia, fundacja…)'], ['jdg', 'Jednoosobowa działalność (JDG)'], ['sc', 'Spółka cywilna'], ['osobowa', 'Spółka jawna / partnerska / komandytowa']],
        btn: 'Wyślij do wyceny',
        note: 'Wysłanie formularza nie zobowiązuje do sprzedaży. Ofertę możesz odrzucić bez kosztów.',
        ok: 'Dziękujemy! Analizujemy dłużnika — ofertę wyślemy w ciągu kilku godzin roboczych na podany e-mail.',
        errors: {
          generic: 'Popraw zaznaczone pola.', company: 'Podaj nazwę firmy.', nip: 'Podaj poprawny 10-cyfrowy NIP (błędna suma kontrolna).',
          amount: 'Podaj kwotę faktury większą od 0.', days: 'Podaj liczbę dni po terminie (co najmniej 1).', email: 'Podaj poprawny adres e-mail.', tel: 'Podaj numer telefonu.', captcha: 'Weryfikacja antybotowa nie powiodła się — spróbuj ponownie.',
          forma: 'Obecnie skupujemy wyłącznie wierzytelności wobec osób prawnych (np. sp. z o.o., S.A.). Faktury wystawione na JDG, spółki cywilne, spółki osobowe lub konsumentów nie kwalifikują się.',
        },
      },
      footer: {
        collection: 'Windykacja i faktoring', calc: 'Kalkulator odsetek', panel: 'Panel klienta',
        legal: '© 2026 sprzedamfakture.pl · kontakt@sprzedamfakture.pl · Podstawa: art. 509–512 KC, ustawa z 8.03.2013 r. o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych.',
      },
    },

    // Skup starych wyroków (oude vonnissen): /skup-wyrokow
    wyroki: {
      metaTitle: 'Skup starych wyroków i nakazów zapłaty — sprzedamfakture.pl',
      metaDesc: 'Masz prawomocny wyrok albo nakaz zapłaty, po którym komornik umorzył egzekucję? Skupujemy stare tytuły wykonawcze — zazwyczaj za 10–40% wartości nominalnej, po ocenie każdej sprawy.',
      kicker: 'Skup starych wyroków',
      h1: 'Stary wyrok wciąż ma wartość',
      lead: 'Prawomocny wyrok lub nakaz zapłaty, po którym egzekucja okazała się bezskuteczna, to nie makulatura — to opcja na przyszłość. Skupujemy stare tytuły wykonawcze: pojedyncze wyroki i małe pakiety, także od wierzycieli z Holandii i Niemiec.',
      why: {
        h: 'Dlaczego stary tytuł wciąż jest coś wart',
        p1: 'Roszczenie stwierdzone prawomocnym wyrokiem przedawnia się z upływem <strong>sześciu lat</strong> (art. 125 Kodeksu cywilnego); odsetki — jako świadczenie okresowe — <strong>po trzech latach</strong>.',
        p2: 'Złożenie wniosku egzekucyjnego <strong>przerywa</strong> bieg przedawnienia, a gdy komornik umarza egzekucję z powodu <strong>bezskuteczności</strong> (art. 824 § 1 pkt 3 KPC), sześcioletni termin biegnie <strong>od nowa</strong> — od dnia umorzenia. Tytuł wraca do wierzyciela i pozostaje w mocy.',
        p3: 'Przy kolejnej próbie może się okazać, że dłużnik ma już pracę, odziedziczył majątek albo prowadzi nową działalność — i komornik nagle ma z czego egzekwować. Dlatego wyceniamy tytuły, które na papierze wyglądają na stracone.',
      },
      caveat: {
        items: [
          ['Bezczynność wierzyciela', 'Egzekucja umorzona wskutek bezczynności traktowana jest tak, jakby wniosku nie złożono — przerwanie przedawnienia upada z mocą wsteczną.'],
          ['Badanie przedawnienia', 'Od 21 sierpnia 2019 r. komornik z urzędu bada przedawnienie i odmawia wszczęcia egzekucji przedawnionego tytułu.'],
          ['Odsetki: 3 lata', 'Narosłe odsetki przedawniają się po trzech latach — im dłużej tytuł leży w szufladzie, tym większa ich część przepada.'],
        ],
        note: 'Właśnie dlatego pytamy w formularzu, dlaczego poprzednia egzekucja została umorzona — to różnica między ważnym tytułem a bezwartościowym papierem.',
      },
      check: {
        h: 'Co sprawdzamy przy wycenie',
        items: [
          'Powód umorzenia poprzedniej egzekucji (bezskuteczność czy bezczynność) — na podstawie postanowienia komornika.',
          'Bieg przedawnienia należności głównej i odsetek.',
          'Formę prawną dłużnika — przy sp. z o.o. dochodzi droga z art. 299 KSH.',
          'Profil dłużnika: aktualna działalność, rejestry (KRZ, KRS, biała lista), sygnały majątkowe.',
        ],
      },
      ksh: {
        h: 'Sp. z o.o. bez majątku? Zarząd odpowiada',
        p: 'Gdy egzekucja przeciwko spółce z o.o. okazuje się bezskuteczna, wierzyciel może dochodzić zapłaty od <strong>członków zarządu</strong> z ich majątku prywatnego (art. 299 KSH). Martwa wierzytelność wobec pustej spółki potrafi stać się żywą wierzytelnością wobec konkretnej osoby. Gdy majątek wyprowadzono, w grę wchodzi skarga pauliańska (art. 527 KC). Żadna z tych dróg nie działa automatycznie — ale właśnie je wyceniamy.',
      },
      price: {
        h: 'Ile płacimy',
        p1: 'Zazwyczaj 10–40% wartości nominalnej — zależnie od jakości tytułu i profilu dłużnika. Każdy tytuł oceniamy osobno; ofertę wysyłamy w ciągu kilku dni roboczych. Zgłoszenie jest bezpłatne i do niczego nie zobowiązuje.',
        p2: 'Wielcy gracze skupują portfele banków i telekomów. My patrzymy na pojedyncze wyroki i małe pakiety B2B — także od wierzycieli z Holandii i Niemiec, którzy lata temu procesowali się w Polsce i spisali sprawę na straty.',
      },
      faqLd: [
        ['Czy stary wyrok po bezskutecznej egzekucji ma jeszcze wartość?', 'Tak. Po umorzeniu egzekucji z powodu bezskuteczności sześcioletni termin przedawnienia biegnie od nowa, a tytuł wykonawczy pozostaje w mocy — egzekucję można ponowić, gdy sytuacja dłużnika się poprawi.'],
        ['Ile mogę dostać za stary wyrok?', 'Zazwyczaj 10–40% wartości nominalnej, zależnie od jakości tytułu i profilu dłużnika. Wycena następuje po ocenie każdej sprawy.'],
      ],
      form: {
        kicker: 'Zgłoś wyrok do bezpłatnej wyceny',
        company: 'Twoja firma (wierzyciel)', email: 'E-mail', tel: 'Telefon',
        sygnatura: 'Sygnatura akt', sygnaturaPh: 'np. VI GNc 1234/19',
        sad: 'Sąd, który wydał orzeczenie', sadPh: 'np. Sąd Rejonowy dla m.st. Warszawy',
        dataWyroku: 'Data wyroku / nakazu zapłaty',
        amount: 'Należność główna (zł)',
        dluznik: 'Dłużnik (nazwa)', nip: 'NIP dłużnika (jeśli znasz)',
        egzekucja: 'Czy była prowadzona egzekucja?',
        egzekucjaOptions: [['none', 'Nigdy nie prowadzona'], ['bezskutecznosc', 'Umorzona — bezskuteczność'], ['inna', 'Umorzona — inny powód'], ['nie_wiem', 'Nie wiem']],
        rok: 'Rok umorzenia egzekucji (jeśli była)', rokPh: 'np. 2021',
        uwagi: 'Uwagi (opcjonalnie)', uwagiPh: 'Np. co wiesz o sytuacji dłużnika, częściowe wpłaty, kilka tytułów wobec tego samego dłużnika…',
        hint: 'Powód umorzenia decyduje o wartości: po bezskuteczności sześcioletnie przedawnienie biegnie od nowa; po umorzeniu z powodu bezczynności wierzyciela przerwanie przedawnienia upada.',
        btn: 'Wyślij do bezpłatnej wyceny',
        note: 'Zgłoszenie jest bezpłatne i niezobowiązujące. Wysyłając formularz, zgadzasz się na przetwarzanie danych — wraz z danymi dłużnika — w celu przygotowania wyceny. Masz więcej tytułów? Wymień je w polu „Uwagi” albo wyślij osobne zgłoszenia.',
        ok: 'Dziękujemy! Sprawdzamy tytuł i bieg przedawnienia — ofertę wyślemy w ciągu kilku dni roboczych na podany e-mail.',
        errors: {
          company: 'Podaj nazwę firmy.', email: 'Podaj poprawny adres e-mail.', tel: 'Podaj numer telefonu.',
          sygnatura: 'Podaj sygnaturę akt.', amount: 'Podaj należność główną większą od 0.', dluznik: 'Podaj nazwę dłużnika.',
          nip: 'Podaj poprawny 10-cyfrowy NIP (albo zostaw pole puste).', egzekucja: 'Wybierz, czy egzekucja była prowadzona.',
          rok: 'Podaj rok z zakresu 1990–2100.', data: 'Podaj poprawną datę.',
        },
      },
      legal: 'Podstawa prawna: art. 125 i 527 Kodeksu cywilnego, art. 824 § 1 pkt 3 KPC, art. 299 Kodeksu spółek handlowych, art. 509–512 KC (cesja). Treść strony ma charakter informacyjny i nie stanowi porady prawnej ani oferty w rozumieniu art. 66 KC.',
    },

    error: {
      notFoundH: 'Nie znaleziono strony', notFoundP: 'Adres może być błędny albo strona została przeniesiona.',
      errorH: 'Coś poszło nie tak', errorP: 'Spróbuj ponownie za chwilę. Jeśli problem się powtarza, napisz na kontakt@sprzedamfakture.pl.',
      back: 'Wróć na stronę główną',
    },
  },

  en: {
    langName: 'EN', otherLang: 'pl', otherLangName: 'PL', htmlLang: 'en',
    metaTitle: 'B2B debt collection, factoring and AI panel — sprzedamfakture.pl',
    metaDesc: 'B2B debt collection, factoring and AI receivables software in Poland. You pay a flat fee — interest, the fixed recovery fee and costs are borne by the debtor.',
    navServices: 'Services', navWhy: 'Why us', navContact: 'Contact', navCalc: 'Interest calculator', navSell: 'Sell an invoice', navApp: 'Client panel',
    heroH1: 'Invoice issued. Money recovered.',
    heroSub: 'sprzedamfakture.pl brings Dutch payment discipline to the Polish market: invoice purchase, B2B debt collection, factoring and AI receivables software — from the first reminder to recovered funds.',
    ctaTalk: "Let's talk", ctaSee: 'See how we work',
    stats: [
      ['38%', 'of B2B invoices in Poland are overdue', '1'],
      ['54 days', 'average payment term — the longest since 2017', '2'],
      ['6,566', 'corporate insolvencies in 2025 — a record', '2'],
      ['68%', 'of Polish companies report late-payment problems', '3'],
    ],
    svcKicker: 'What we do',
    services: [
      ['01', 'Amicable and court collection', 'Monitoring, demand letters, negotiation and BIG debt-register listing — and the court route with our legal partners when it has to come to that. Success-based pricing: commission only on what we actually recover.'],
      ['02', 'Factoring — liquidity without the wait', 'Turn 30–90-day invoices into cash within 48 hours. We finance single invoices and whole portfolios — with or without insolvency risk transfer.'],
      ['03', 'AI receivables software', 'Export the invoice — an AI agent takes it from there: it monitors the due date, sends reminders in the right tone at the right time, and escalates to collection when needed. Your team sees the full history and does less. KSeF-ready from day one.'],
      ['04', 'Claim purchase — instant cash', 'Want it off your books? The AI agent prices the claim in minutes and makes a purchase offer. Accept, and the cash lands within 24 hours — the risk moves to us.'],
    ],
    lawKicker: 'The law sides with the creditor',
    law: [
      ['14%', 'Late-payment interest, per year', 'Accrues without a demand letter, from the day after the due date. NBP reference rate + 10 pp — the H1 2026 rate.', '5'],
      ['PLN 170–430', 'Fixed recovery fee, per invoice', 'PLN 170, 300 or 430 per invoice, depending on invoice value (up to PLN 5k / 5–50k / 50k and above), converted at the NBP rate. No proof of actual costs required.', '6'],
      ['100%', 'Of collection costs above the flat fee', 'Justified recovery costs beyond the lump sum are also borne by the debtor — as are bailiff costs in enforcement.', '6'],
    ],
    calcLink: 'Calculate interest and the recovery fee for your invoice →',
    pathKicker: 'Escalation path',
    path: [
      ['01 · Day 1', 'Demand letter + interest note'],
      ['02 · +30 days', 'BIG debt-register warning'],
      ['03 · 2 wks–3 mos', 'Court payment order'],
      ['04 · Enforcement', "Bailiff — at the debtor's expense"],
    ],
    modelKicker: 'Pricing model',
    model: [
      ['You pay', 'A flat service fee per case', 'A predictable cost per claim — no percentage of what we recover.'],
      ['The debtor pays', 'Interest, the fixed fee and costs', 'As the law provides — collection genuinely at the debtor\'s expense.'],
      ['Or', 'Sell us the claim', 'A purchase offer from the AI agent, paid out within 24 hours.'],
    ],
    whyKicker: 'Why us',
    whyH: 'Dutch payment culture. Polish market.',
    whyP: "In the Netherlands, 30% of companies report late-payment problems — in Poland it is 68%. We bring processes from one of Europe's healthiest payment markets: firm with debtors, careful with trading relationships.",
    whySup: '3',
    nowKicker: 'Why now',
    now: [
      ['KSeF 2026', 'Mandatory e-invoicing turns receivables into data — easier to monitor, price and finance.', '4'],
      ['34%', 'of companies already outsource collections — and the share grows every year.', '2'],
      ['8.5%', 'of companies are entirely free of overdue receivables — down from 14.6% a year earlier.', '2'],
    ],
    closingH: 'Stop financing your clients for free.',
    ctaCall: 'Book a call', ctaPanel: 'Try the panel', ctaSell: 'Sell an invoice — instant quote',
    srcKicker: 'Sources',
    sources: [
      'Atradius, B2B Payment Practices Trends: Poland, 2025.',
      'Coface, Poland Payment Survey, 2026 (covering 2025).',
      'EU Payment Observatory, European Commission, 2025.',
      'Ministry of Finance (PL), KSeF implementation timeline, 2026.',
      'Biznes.gov.pl — statutory interest for late payment in commercial transactions, H1 2026 rate (NBP reference rate 4% + 10 pp).',
      'Act of 8 March 2013 on counteracting excessive delays in commercial transactions, arts. 7 and 10.',
    ],
    copyright: '© 2026 sprzedamfakture.pl',

    common: {
      navHome: 'Home', navSell: 'Sell an invoice', navCollection: 'Debt collection', navCalc: 'Interest calculator', navPanel: 'Client panel', navJudgments: 'Old judgments', footJudgments: 'we buy old judgments',
      footerModel: 'Our model: you pay {fee} zł per case — interest, the recovery fee and costs are borne by the debtor. Or sell the invoice and have cash within 24 hours.',
      footCollection: 'debt collection', footCalc: 'interest calculator', footConcept: 'product concept',
      versionTitle: 'Site version · commit', skip: 'Skip to content', tagline: 'Cash for your invoice in 24 h',
    },

    home: {
      metaTitle: 'sprzedamfakture.pl — Sell your invoice. Cash in 24 hours.',
      metaDesc: 'Sell an overdue B2B invoice on sprzedamfakture.pl. AI valuation in minutes, assignment signed online, payout within 24 hours. The debtor\'s insolvency risk passes to us.',
      ogDesc: 'Customer not paying? Sell us the B2B invoice: AI valuation in minutes, assignment signed online, transfer the next business day.',
      nav: { how: 'How it works', quote: 'Quote', faq: 'FAQ', collection: 'Debt collection', panel: 'Client panel', cta: 'Sell an invoice' },
      heroH1: ['Sell your invoice.', 'Cash in 24 hours.'],
      heroSub: 'Customer not paying? Don\'t wait months for debt collection. Sell us your overdue B2B invoice — AI valuation in minutes, assignment signed online, transfer the next business day. The insolvency risk passes to us.',
      ctaQuote: 'Get a quote', ctaHow: 'How it works',
      card: { title: 'Purchase offer', invoice: 'Invoice', overdue: '45 days overdue', score: 'AIScore 67', offer: 'Our offer', foot: 'Online assignment · payout in 24 hours', chipA: '76% of face value', chipB: 'Risk: ours', seal: '24h' },
      steps: {
        kicker: 'How it works',
        items: [
          ['01 · 2 minutes', 'Send the invoice and the debtor\'s NIP'],
          ['02 · A few minutes', 'AI checks KRZ, KRS and the VAT white list — you get an offer'],
          ['03 · Online', 'You sign the assignment electronically'],
          ['04 · 24 hours', 'Money in your account'],
        ],
      },
      quote: {
        kicker: 'Instant preliminary quote', labelAmount: 'Invoice amount (PLN)', labelDays: 'Days overdue', phAmount: 'e.g. 12400', phDays: 'e.g. 45',
        btn: 'Calculate offer',
        resultSub: 'preliminary offer ({low}–{high}% of face value) — final after we verify the debtor in KRZ, KRS and the VAT white list. Late-payment interest transfers to us together with the claim (art. 509 § 2 Civil Code).',
        resultCta: 'Accept — send the invoice',
        hint: 'The offer updates as you type. The quote is indicative and does not constitute a binding offer (art. 66 Civil Code).',
      },
      why: {
        kicker: 'Why sell',
        items: [
          ['Liquidity', 'Cash on hand', 'Instead of waiting 3–12 months for collection or court, you have the money the next business day.'],
          ['Risk', 'Debtor bankrupt? Our problem', 'After assignment, the debtor\'s insolvency risk passes entirely to us — no recourse.'],
          ['Peace of mind', 'Clean books, zero collection', 'No more calls, demand letters or chasing deadlines. The receivable disappears from your books.'],
        ],
      },
      faq: {
        kicker: 'FAQ', h: 'Frequently asked questions',
        items: [
          ['How much will I get for my invoice?', 'Depending on the debtor\'s AIScore: usually 55–90% of face value. The shorter the delay and the cleaner the debtor\'s record in the registers, the higher the offer. Late-payment interest transfers to us together with the claim.'],
          ['Who must the invoice be issued to?', 'The debtor must be a legal entity — typically a sp. z o.o. or S.A. We currently do not buy invoices issued to sole traders (JDG), civil-law or general partnerships, or consumers. Your own company (the seller) can have any legal form.'],
          ['Does every invoice qualify?', 'We buy undisputed B2B invoices. We check that your contract with the debtor does not prohibit assignment (art. 509 § 1 Civil Code) and that the debtor is not in bankruptcy — in that case no offer is possible.'],
          ['What about the €40/70/100 recovery fee?', 'It stays with you — by law (art. 10(4)) it cannot be assigned. You can claim it yourself; our offer covers the principal plus interest.'],
          ['Will the debtor find out?', 'Yes — after assignment we notify the debtor in writing (art. 512 Civil Code). From then on they pay only us.'],
          ['I have an old judgment or payment order — do you buy those too?', 'Yes — see <a href="/skup-wyrokow">we buy old judgments</a>: claims confirmed by an enforceable title are priced separately, typically at 10–40% of nominal value, after checking the limitation period and why the previous enforcement was discontinued.'],
          ['I\'d rather not sell — just recover the money?', 'We can do that too: <a href="/windykacja">debt collection at the debtor\'s expense</a> — you pay {fee} zł per case; interest (14%), the recovery fee and costs are borne by the debtor. The AI agent runs the case in the panel.'],
        ],
      },
      form: {
        kicker: 'Sell an invoice', company: 'Your company', nip: 'Debtor\'s NIP', amount: 'Invoice amount (PLN)', days: 'Days overdue', email: 'E-mail', tel: 'Phone',
        forma: 'Debtor\'s legal form', formaPh: '— select —',
        formaNote: 'We buy claims against companies with legal personality (e.g. sp. z o.o., S.A.). Your own company can have any form.',
        formaOptions: [['spzoo', 'Sp. z o.o. (limited company)'], ['sa', 'S.A. (joint-stock company)'], ['psa', 'P.S.A. (simple joint-stock)'], ['inna-op', 'Other legal entity (co-op, foundation…)'], ['jdg', 'Sole trader (JDG)'], ['sc', 'Civil-law partnership'], ['osobowa', 'General / limited partnership']],
        btn: 'Send for a quote',
        note: 'Sending the form does not oblige you to sell. You can decline the offer at no cost.',
        ok: 'Thank you! We are analysing the debtor — we\'ll e-mail the offer within a few business hours.',
        errors: {
          generic: 'Please correct the highlighted fields.', company: 'Enter your company name.', nip: 'Enter a valid 10-digit NIP (checksum failed).',
          amount: 'Enter an invoice amount greater than 0.', days: 'Enter the number of days overdue (at least 1).', email: 'Enter a valid e-mail address.', tel: 'Enter a phone number.', captcha: 'Bot check failed — please try again.',
          forma: 'We currently buy only claims against legal entities (e.g. sp. z o.o., S.A.). Invoices issued to sole traders (JDG), civil-law or general partnerships, or consumers do not qualify.',
        },
      },
      footer: {
        collection: 'Debt collection & factoring', calc: 'Interest calculator', panel: 'Client panel',
        legal: '© 2026 sprzedamfakture.pl · kontakt@sprzedamfakture.pl · Legal basis: arts. 509–512 of the Polish Civil Code; Act of 8 March 2013 on counteracting excessive delays in commercial transactions.',
      },
    },

    // We buy old judgments: /skup-wyrokow
    wyroki: {
      metaTitle: 'We buy old Polish judgments and payment orders — sprzedamfakture.pl',
      metaDesc: 'Holding a final Polish judgment the bailiff could not enforce? We buy old enforceable titles (tytuły wykonawcze) — typically for 10–40% of nominal value, after a per-case assessment.',
      kicker: 'We buy old judgments',
      h1: 'An old judgment still has value',
      lead: 'A final judgment or payment order that enforcement could not collect is not waste paper — it is an option on the future. We buy old enforceable titles: single judgments and small portfolios, including from Dutch and German creditors with titles against Polish debtors. Correspondence in English.',
      why: {
        h: 'Why an old title is still worth money',
        p1: 'A claim confirmed by a final judgment becomes time-barred after <strong>six years</strong> (art. 125 of the Polish Civil Code); accrued interest — as a periodic claim — after <strong>three years</strong>.',
        p2: 'Filing an enforcement request <strong>interrupts</strong> the limitation period, and when the bailiff (komornik) discontinues enforcement as fruitless (<strong>bezskuteczność</strong>, art. 824 § 1 pt 3 of the Civil Procedure Code), the six years start running <strong>anew</strong> from that decision. The title returns to the creditor and remains valid.',
        p3: 'At the next attempt the debtor may turn out to have a job, an inheritance or a new business — and the bailiff suddenly has something to enforce against. That is why we price titles that look lost on paper.',
      },
      caveat: {
        items: [
          ['Creditor inactivity', 'Enforcement discontinued because the creditor stayed inactive is treated as never filed — the interruption of limitation lapses retroactively.'],
          ['Limitation check', 'Since 21 August 2019 the bailiff must check limitation and refuses to enforce a time-barred title.'],
          ['Interest: 3 years', 'Accrued interest becomes time-barred after three years — the longer a title sits in a drawer, the more of it is lost.'],
        ],
        note: 'That is exactly why the form asks why the previous enforcement was discontinued — it is the difference between a valid title and worthless paper.',
      },
      check: {
        h: 'What we assess',
        items: [
          'Why the previous enforcement was discontinued (fruitless or creditor inactivity) — based on the bailiff\'s decision.',
          'The limitation status of the principal and of the interest.',
          'The debtor\'s legal form — for an sp. z o.o. the art. 299 CCC route comes into play.',
          'The debtor\'s profile: current activity, registers (KRZ, KRS, VAT white list), asset signals.',
        ],
      },
      ksh: {
        h: 'Empty sp. z o.o.? The board is liable',
        p: 'When enforcement against a Polish limited company proves fruitless, the creditor can pursue the <strong>management board members</strong> personally (art. 299 of the Commercial Companies Code). A dead claim against an empty company can become a live claim against a person with private assets. Where assets were siphoned off, the actio pauliana (art. 527 Civil Code) may apply. None of these routes is automatic — but they are exactly what we price.',
      },
      price: {
        h: 'What we pay',
        p1: 'Typically 10–40% of nominal value — depending on the quality of the title and the debtor profile. Every title is assessed individually; we send an offer within a few working days. Submitting is free and does not oblige you to sell.',
        p2: 'The big players buy bank and telecom portfolios. We look at single judgments and small B2B portfolios — including from Dutch and German creditors who litigated in Poland years ago and wrote the case off. Scans of the title and the discontinuation decision are enough to start.',
      },
      faqLd: [
        ['Is an old judgment still worth anything after fruitless enforcement?', 'Yes. After discontinuation for fruitlessness the six-year limitation period restarts and the enforceable title remains valid — enforcement can be repeated when the debtor\'s situation improves.'],
        ['How much can I get for an old judgment?', 'Typically 10–40% of nominal value, depending on the quality of the title and the debtor profile, after a per-case assessment.'],
      ],
      form: {
        kicker: 'Submit a judgment for a free assessment',
        company: 'Your company (the creditor)', email: 'E-mail', tel: 'Phone',
        sygnatura: 'Case number (sygnatura akt)', sygnaturaPh: 'e.g. VI GNc 1234/19',
        sad: 'Court that issued the ruling', sadPh: 'e.g. District Court for Warsaw',
        dataWyroku: 'Date of the judgment / payment order',
        amount: 'Principal amount (PLN)',
        dluznik: 'Debtor (name)', nip: 'Debtor\'s NIP (if known)',
        egzekucja: 'Was enforcement attempted?',
        egzekucjaOptions: [['none', 'Never attempted'], ['bezskutecznosc', 'Discontinued — no assets (bezskuteczność)'], ['inna', 'Discontinued — other reason'], ['nie_wiem', 'I don\'t know']],
        rok: 'Year enforcement was discontinued (if any)', rokPh: 'e.g. 2021',
        uwagi: 'Notes (optional)', uwagiPh: 'E.g. what you know about the debtor, partial payments, several titles against the same debtor…',
        hint: 'Why the previous enforcement was discontinued determines the value: after bezskuteczność the six-year limitation restarts; after discontinuation for creditor inactivity the interruption lapses.',
        btn: 'Send for a free assessment',
        note: 'Submitting is free and non-binding. By sending the form you agree to the processing of the data — including the debtor\'s data — to prepare an assessment. More titles? List them under "Notes" or send separate submissions.',
        ok: 'Thank you! We are checking the title and the limitation status — we will e-mail our offer within a few working days.',
        errors: {
          company: 'Enter your company name.', email: 'Enter a valid e-mail address.', tel: 'Enter a phone number.',
          sygnatura: 'Enter the case number.', amount: 'Enter a principal amount greater than 0.', dluznik: 'Enter the debtor\'s name.',
          nip: 'Enter a valid 10-digit NIP (or leave the field empty).', egzekucja: 'Select whether enforcement was attempted.',
          rok: 'Enter a year between 1990 and 2100.', data: 'Enter a valid date.',
        },
      },
      legal: 'Legal basis: arts. 125 and 527 of the Civil Code, art. 824 § 1 pt 3 of the Civil Procedure Code, art. 299 of the Commercial Companies Code, arts. 509–512 of the Civil Code (assignment). This page is information, not legal advice, and does not constitute a binding offer (art. 66 Civil Code).',
    },

    error: {
      notFoundH: 'Page not found', notFoundP: 'The address may be wrong or the page has moved.',
      errorH: 'Something went wrong', errorP: 'Please try again in a moment. If the problem persists, write to kontakt@sprzedamfakture.pl.',
      back: 'Back to home',
    },
  },
};

// Klantpanel (PL/EN) + helpers: t.app, t.locale, t.days, t.tr, t.fill
const appI18n = require('./i18n-app');
for (const l of ['pl', 'en']) {
  const a = appI18n[l];
  module.exports[l].app = a;
  module.exports[l].locale = a.locale;
  module.exports[l].tr = a.tr;
  module.exports[l].fill = appI18n.fill;
}
