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
      navHome: 'Strona główna', navSell: 'Sprzedaj fakturę', navCollection: 'Windykacja', navCalc: 'Kalkulator odsetek', navPanel: 'Panel klienta',
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
          ['Czy każda faktura się kwalifikuje?', 'Kupujemy bezsporne faktury B2B. Sprawdzamy, czy umowa z dłużnikiem nie zawiera zakazu cesji (art. 509 § 1 KC) i czy dłużnik nie jest w upadłości — wtedy oferta nie jest możliwa.'],
          ['Co z rekompensatą 40/70/100 €?', 'Ta pozostaje przy Tobie — z mocy ustawy (art. 10 ust. 4) nie podlega cesji. Możesz jej dochodzić samodzielnie, oferta dotyczy należności głównej z odsetkami.'],
          ['Czy dłużnik się dowie?', 'Tak — po cesji zawiadamiamy dłużnika na piśmie (art. 512 KC). Od tego momentu płaci wyłącznie nam.'],
          ['Wolę nie sprzedawać — tylko odzyskać pieniądze?', 'Też możemy: <a href="/windykacja">windykacja na koszt dłużnika</a> — Ty płacisz {fee} zł od sprawy, odsetki (14%), rekompensatę i koszty pokrywa dłużnik. Agent AI prowadzi sprawę w panelu.'],
        ],
      },
      form: {
        kicker: 'Sprzedaj fakturę', company: 'Twoja firma', nip: 'NIP dłużnika', amount: 'Kwota faktury (zł)', days: 'Dni po terminie', email: 'E-mail', tel: 'Telefon',
        btn: 'Wyślij do wyceny',
        note: 'Wysłanie formularza nie zobowiązuje do sprzedaży. Ofertę możesz odrzucić bez kosztów.',
        ok: 'Dziękujemy! Analizujemy dłużnika — ofertę wyślemy w ciągu kilku godzin roboczych na podany e-mail.',
        errors: {
          generic: 'Popraw zaznaczone pola.', company: 'Podaj nazwę firmy.', nip: 'Podaj poprawny 10-cyfrowy NIP (błędna suma kontrolna).',
          amount: 'Podaj kwotę faktury większą od 0.', days: 'Podaj liczbę dni po terminie (co najmniej 1).', email: 'Podaj poprawny adres e-mail.', tel: 'Podaj numer telefonu.', captcha: 'Weryfikacja antybotowa nie powiodła się — spróbuj ponownie.',
        },
      },
      footer: {
        collection: 'Windykacja i faktoring', calc: 'Kalkulator odsetek', panel: 'Panel klienta',
        legal: '© 2026 sprzedamfakture.pl · kontakt@sprzedamfakture.pl · Podstawa: art. 509–512 KC, ustawa z 8.03.2013 r. o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych.',
      },
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
      navHome: 'Home', navSell: 'Sell an invoice', navCollection: 'Debt collection', navCalc: 'Interest calculator', navPanel: 'Client panel',
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
          ['Does every invoice qualify?', 'We buy undisputed B2B invoices. We check that your contract with the debtor does not prohibit assignment (art. 509 § 1 Civil Code) and that the debtor is not in bankruptcy — in that case no offer is possible.'],
          ['What about the €40/70/100 recovery fee?', 'It stays with you — by law (art. 10(4)) it cannot be assigned. You can claim it yourself; our offer covers the principal plus interest.'],
          ['Will the debtor find out?', 'Yes — after assignment we notify the debtor in writing (art. 512 Civil Code). From then on they pay only us.'],
          ['I\'d rather not sell — just recover the money?', 'We can do that too: <a href="/windykacja">debt collection at the debtor\'s expense</a> — you pay {fee} zł per case; interest (14%), the recovery fee and costs are borne by the debtor. The AI agent runs the case in the panel.'],
        ],
      },
      form: {
        kicker: 'Sell an invoice', company: 'Your company', nip: 'Debtor\'s NIP', amount: 'Invoice amount (PLN)', days: 'Days overdue', email: 'E-mail', tel: 'Phone',
        btn: 'Send for a quote',
        note: 'Sending the form does not oblige you to sell. You can decline the offer at no cost.',
        ok: 'Thank you! We are analysing the debtor — we\'ll e-mail the offer within a few business hours.',
        errors: {
          generic: 'Please correct the highlighted fields.', company: 'Enter your company name.', nip: 'Enter a valid 10-digit NIP (checksum failed).',
          amount: 'Enter an invoice amount greater than 0.', days: 'Enter the number of days overdue (at least 1).', email: 'Enter a valid e-mail address.', tel: 'Enter a phone number.', captcha: 'Bot check failed — please try again.',
        },
      },
      footer: {
        collection: 'Debt collection & factoring', calc: 'Interest calculator', panel: 'Client panel',
        legal: '© 2026 sprzedamfakture.pl · kontakt@sprzedamfakture.pl · Legal basis: arts. 509–512 of the Polish Civil Code; Act of 8 March 2013 on counteracting excessive delays in commercial transactions.',
      },
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
