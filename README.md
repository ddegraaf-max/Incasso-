# sprzedamfakture.pl — sprzedaj fakturę, gotówka w 24 godziny

Node/Express/EJS-app achter **sprzedamfakture.pl**: wykup wierzytelności (instant AI-wycena, cesja online, uitbetaling in 24 uur) als hoofdpropositie, plus windykacja B2B op kosten van de dłużnik en een klantpanel met AI-agent. Design system "Granat & Złoto" (navy `#17233a`, goud `#b8892d`, Fraunces + Manrope). Railway-ready.

## Routes

| Route | Wat |
|---|---|
| `/` | **Strona główna** — sprzedaj fakturę: instant wycena-widget, 4-stappenflow, FAQ, leadformulier |
| `/windykacja` | Aanvullende landing (PL/EN via `?lang=en`): windykacja, faktoring, panel AI, wetgeving, bronnen |
| `/sprzedam` | Oude route → 301 naar `/` |
| `/login` · `/rejestracja` | Inloggen / registratie (bcrypt, rate limiting) |
| `/2fa` · `/2fa/setup` | TOTP-verificatie / QR-setup (Google Authenticator e.d.) |
| `/admin` | Admin-dashboard (alleen rol admin, 2FA verplicht) — incl. laatste leads, knop *Usuń ślady danych demo* |
| `/admin/leady` | **Leadbeheer**: alle zgłoszenia (faktura + wyrok) met detail, status (nowy / w kontakcie / oferta / zaakceptowany / odrzucony / spam), interne notitie, mailto-knop, verwijderen en **Załóż sprawę** (lead → echte zaak, `POST /admin/leady/:id/sprawa`) |
| `/baza-wiedzy` · `/baza-wiedzy/:slug` | **Baza wiedzy** (PL/EN): SEO-artikelen uit `src/articles.js` — odsetki, rekompensata, przedawnienie, wezwanie, cesja vs faktoring, KRD/BIG, poradnik voor buitenlandse wierzyciele. Article + BreadcrumbList + FAQPage JSON-LD, in de sitemap met lastmod |
| `/app/sprawy` | Zakenoverzicht + detail-aside (`?sel=c12` / demo `?sel=f2`). Echte zaken: tijdlijn uit `events.case_id`, **Edytuj dane sprawy** (`POST …/edytuj`, admin of eigenaar), **Usuń sprawę** (`POST …/usun`, admin); e-mail/SMS-knoppen uit zolang de dłużnik geen contactgegevens heeft |
| `/app/nowa` | **Nowa sprawa**: handmatig formulier → echte zaak (`POST /app/nowa`; klant = eigenaar, admin kan klant-e-mail opgeven); KSeF / XML-PDF / e-mail als concept-bronnen; demo-analyse alleen met `DEMO_CASES=1` |
| `/app/agent` | Agent-feed + negotiatiethread, toon-switcher (`?ton=Uprzejmy\|Stanowczy\|Prawniczy`) |
| `/app/wykup` | Wykup wierzytelności (AI-offertes, cesja) |
| `/kalkulator` | Publieke kalkulator odsetek (14%) + rekompensata 40/70/100 € — leadmagnet/SEO |
| `/skup-wyrokow` | **Skup starych wyroków** (PL/EN) — oude vonnissen/tytuły wykonawcze: waarom een oude titel waarde houdt (verjaring 6 jaar, herstart na bezskuteczność, art. 299 KSH; valkuil bezczynność wierzyciela), typisch 10–40% van nominaal, leadformulier → mail + admin-leads |
| `/wezwanie` | Printbaar wezwanie do zapłaty, gegenereerd vanuit de kalkulator |
| `/api/wycena?kwota=&dni=` | JSON voor de live wycena-widget (indicatieve oferta) |
| `/health` | JSON: versie, commit, uptime, db, mail/Resend- en Turnstile-status — voor deploy-checks |
| `/robots.txt` · `/sitemap.xml` | SEO (hreflang PL/EN in de sitemap) |

## Branding & logo
- **Beeldmerk**: factuur (navy) met gouden omgevouwen hoek + gouden munt met vinkje ("faktura → gotówka"). **Woordmerk**: `sprzedam**fakture**.pl` in Fraunces, `.pl` in goud; optionele tagline *Gotówka za fakturę w 24 h*.
- Inline in de site via `views/partials/logo.ejs` — opties: `size: 'sm'|'lg'`, `tagline`, `tagText`, `asLink`, `href`, `light` (voor donkere achtergrond). Styling: `.brand*` in `public/css/app.css`.
- Losse bestanden in `public/img/`: `favicon.svg` (dark-mode aware), `logo-mark.svg`, `logo.svg` (lockup; gebruikt Google Fonts — voor drukwerk tekst naar paden omzetten), `apple-touch-icon.png`, `og.png` (1200×630 social preview). Meta-tags in `views/partials/meta.ejs`.

## Taal (PL/EN, panel ook NL) en versienummer
- **Panel in het Nederlands**: het klantpanel en de admin (`/app/*`, `/admin*`, login/2FA) kennen een derde taal `nl` — alleen als paneltaal. Met cookie `lang=nl` blijven de publieke pagina's Pools, maar `t.app`, `t.tr` en `t.locale` komen uit het Nederlandse woordenboek in `src/i18n-app.js`. `ADMIN_LANG` (default `nl`) wordt bij elke admin-login als paneltaal gezet; in de panel-nav staat voor de admin een PL·EN·NL-schakelaar. `ADMIN_LANG=` (leeg) schakelt het afdwingen uit; `ADMIN_LANG=pl` maakt het panel voor de admin Pools. Teksten richting de dłużnik (e-mail, SMS, belscript) blijven altijd Pools.
- De hele site is tweetalig: publieke pagina's (`/`, `/windykacja`, nav/footer, 404) én het klantpanel (login, rejestracja, 2FA, sprawy, nowa, agent, wykup, rozmowa, admin). `?lang=pl|en` zet een cookie (1 jaar); de PL·EN-schakelaar staat in elke nav; zonder cookie is PL de standaard. Teksten: `src/i18n.js` (`common`, `home`, `error` + landing-keys) en `src/i18n-app.js` (panel: `t.app.*`, plus `t.tr()` voor demodata/statussen, `t.days(n)`, `t.locale`, `t.fill()`). Servermeldingen (login/2FA/flash) zijn ook vertaald. Alleen de kalkulator en teksten richting de dłużnik (e-mail/SMS-templates, belscript, wezwanie) blijven PL — dat is de taal van de dłużnik.
- Footer toont `v<versie> · <commit>`: versie uit `package.json`, commit uit Railway (`RAILWAY_GIT_COMMIT_SHA`) of lokaal uit git (`src/version.js`). Zelfde info op `/health`. Verhoog de versie in `package.json` bij een release; de CSS/JS-links krijgen automatisch `?v=<versie>` (cache-busting, statics cachen 7 dagen).

## Wat er verder in v0.2 zit
- Live wycena op de homepage (`public/js/wycena.js` → `/api/wycena`), werkt ook zonder JS via de gewone submit.
- Leadformulier: servervalidatie met foutmeldingen per veld, Poolse NIP-controlecijfer, honeypot tegen bots; ingevulde waarden blijven staan.
- Nette 404/500-pagina (`views/error.ejs`), security-headers, gzip (`compression`), canonical/hreflang, JSON-LD (Organization + FAQPage), skip-link en focus-stijlen.

## Lokaal draaien
```
npm install
npm start        # poort 3000, of PORT env var
```

## Deploy (Railway)
Standaard flow: repo → GitHub Desktop → Railway auto-deploy. Geen database nodig voor het concept. Custom domain `sprzedamfakture.pl` + `www` aan de service hangen en DNS bij dns.pl naar Railway wijzen.
Env vars: `PORT` (Railway zet die zelf), `SESSION_SECRET` (VERPLICHT in productie — lange random string), `ADMIN_EMAIL` + `ADMIN_PASSWORD` (admin-account), optioneel `SERVICE_FEE` (default 99), `EUR_PLN` (default 4.30), `DATABASE_URL` (Railway Postgres — activeert persistentie), `MONITOR_INTERVAL_MS` (default 60000) en `DEMO_EVENTS` (default 1; op 0 voor echte bronnen). `DEMO_ACCOUNT=0` verwijdert het demo-account en de hint op de loginpagina. `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `PLAUSIBLE_DOMAIN` (SEO, zie hieronder), `COMPANY_*` (bedrijfsgegevens, zie hieronder), `ADMIN_LANG` (paneltaal admin, default `nl`), `LEAD_RESEARCH`, `RESEARCH_MODEL`, `RESEARCH_LANG`, `RESEARCH_MAX_SEARCHES` (onderzoeksverslag, zie hieronder), `MONITOR_REAL_EVERY_TICKS` (default 60). `DEMO_CASES` bepaalt of de zes fictieve demo-zaken (Betmix, Kamex, … AgroSad) worden geladen: **standaard uit bij `NODE_ENV=production`**, aan daarbuiten; `DEMO_CASES=1` forceert aan, `0` uit. Zonder demo-zaken zijn panel, wykup, agent-feed en de admin-zakentabel leeg en start de monitor niet. `BOOKING_URL` (bv. een Calendly/Cal.com-link) maakt van "Umów rozmowę" op `/windykacja` een agenda-knop; zonder die variabele opent hij een e-mail naar kontakt@. Zet `NODE_ENV=production` voor secure cookies.

## Echte zaken (sprawy) — `src/cases.js`
- Tabel `cases` (nr, debtor, nip, amount, due_date, debtor_email/tel, client_company/email, owner_user_id, phase, tag, source, lead_id, note). Sleutel in de app: `c<id>` — `case_actions`, `comm_log` en `events.case_id` verwijzen ermee. Echte zaken staan in dezelfde lijst `D.claims` als de demo-zaken en hebben dezelfde vorm (`days` is een getter op `due_date`), plus `real: true`.
- **Aanmaken**: admin vanuit een lead (`/admin/leady` → *Załóż sprawę*, velden voorgevuld uit de lead; de lead krijgt `case_id`) of iedereen handmatig via `/app/nowa`. Bij aanmaken en bewerken wordt de AIScore berekend tegen echte bronnen (MF biała lista; KRZ nog stub).
- **Toegang**: admin ziet alles; een klant ziet demo-zaken plus zaken met zijn `owner_user_id` of met `client_email` gelijk aan zijn accountadres (dus ook zaken die de admin vóór registratie voor hem aanmaakte).
- **Fase** volgt de communicatie (e-mail/SMS → *Przypomnienia*, ton Prawniczy → *Eskalacja*, belresultaat → obietnica/raty/eskalacja) en wordt voor echte zaken in de DB bewaard. Acties (collect/sell/close/decline) en communicatie loggen een event op de zaak → tijdlijn in het detailpaneel.
- **Monitor**: echte zaken worden elke `MONITOR_REAL_EVERY_TICKS` ticks (default 60 ≈ 1 uur) herscoord tegen echte bronnen, ongeacht `DEMO_EVENTS`; verandering van score → event op de zaak.

## Bedrijfsgegevens exploitant (Creditline B.V.) — `src/company.js`
Onder de footer van elke pagina (ook homepage en landing) staat het identificatieblok van de exploitant: naam, adres, KvK, BTW-id, e-mail, telefoon — verplicht volgens art. 5 ustawy o świadczeniu usług drogą elektroniczną en de e-commercerichtlijn. De homepage zet dezelfde gegevens in het Organization-schema (`legalName`, `address`, `vatID`, KvK als `identifier`). Alles via Railway-variabelen, lege velden worden niet getoond:
Defaults in `src/company.js` zijn de echte gegevens: **Creditline Montage BV, Torenlaan 5B, 1402 AT Bussum, KvK 59683198, BTW NL853603108B01, kontakt@sprzedamfakture.pl, geen telefoon (contact uitsluitend per e-mail)**. Overschrijven kan met `COMPANY_NAME`, `COMPANY_STREET`, `COMPANY_CITY`, `COMPANY_COUNTRY` (ISO, default `NL`), `COMPANY_KVK`, `COMPANY_VAT`, `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_REP` (vertegenwoordiger, optioneel), `COMPANY_EXTRA` (vrije regel, bv. Poolse entiteit/NIP). `/health` → `company: true` zodra adres, KvK en BTW-id gevuld zijn.

## Onderzoeksverslag per aanvraag — `src/research.js`
Bij elke nieuwe lead (en op verzoek via de knop *Verslag opstellen* in `/admin/leady`) wordt op de achtergrond een due-diligence-verslag gemaakt over debiteur én aanvrager, opgeslagen in `lead_reports` en getoond in het leadbeheer en (ingeklapt) in de zaak die uit de lead komt:
1. **MF biała lista** (NIP): naam, btw-status, REGON, KRS, adres, btw-registratiedatum, vertegenwoordigers, aantal rekeningen op de witte lijst.
2. **KRS odpis aktualny** (via het KRS-nummer uit MF): rechtsvorm, kapitaal, bestuur (namen zijn in de open API gemaskeerd, functies niet), PKD, e-mail en website uit het register, en **dział 4/6-vlaggen** (zaległości, egzekucje, likwidacja, upadłość, restrukturyzacja). Het KRS-e-mailadres wordt voorgevuld in het lead→zaak-formulier.
3. **Websites**: van de aanvrager via het e-maildomein (gratis providers overgeslagen) en van de debiteur uit KRS — titel, omschrijving, taal.
4. **AI-verslag met webonderzoek** via de officiële Anthropic SDK (`@anthropic-ai/sdk`, model `RESEARCH_MODEL` default `claude-opus-5`, server tool `web_search`, max `RESEARCH_MAX_SEARCHES` = 8 zoekopdrachten): activiteiten, omvang, opinies, nieuws, insolventie/KRZ/MSiG, rechtszaken, plausibiliteit van de aanvraag, risicoscore 1–5 en advies (kopen / incasso / afwijzen / meer info). Taal `RESEARCH_LANG` (default `nl`). Bronnen (citaten + zoekresultaten) worden onder het verslag getoond. Zonder `ANTHROPIC_API_KEY` alleen stap 1–3. Server-side refusal-fallbacks staan aan (beta `server-side-fallback-2026-07-01`, `fallbacks: default`); bij een 400 valt de code terug op een gewone aanroep.
`LEAD_RESEARCH=0` zet het automatische onderzoek bij nieuwe leads uit (knop blijft). Duur: 1–3 minuten; de leadpagina vernieuwt zichzelf zolang het verslag in de maak is. `/health` → `research`. Kosten: één Opus-aanroep met tot 8 zoekopdrachten per verslag. De AI-teksten van de agent (e-mail) gebruiken sinds v0.8.0 dezelfde SDK.

## Zichtbaarheid op internet (SEO)
- **Per pagina**: eigen `<title>`, `meta description`, canonical, hreflang PL/EN, Open Graph — via `views/partials/head.ejs` (params `title`, `desc`, `ld`, `altLang`, `noindex`). Panel-, auth-, admin- en foutpagina's krijgen automatisch `noindex`.
- **Structured data**: Organization + FAQPage (home), FAQPage (wyroki), CollectionPage/Article/BreadcrumbList/FAQPage (baza wiedzy).
- **Sitemap** (`/sitemap.xml`): alle publieke pagina's + artikelen met `lastmod` en hreflang; `/windykacja` alleen als `WINDYKACJA_OFF` niet aan staat. `SITE_LASTMOD` in `server.js` bijwerken bij inhoudelijke wijzigingen van statische pagina's; artikelen hebben eigen `updated`.
- **Verificatie & analytics** via Railway-variabelen: `GOOGLE_SITE_VERIFICATION` (Search Console, HTML-tag-methode), `BING_SITE_VERIFICATION` (Bing Webmaster Tools, `msvalidate.01`), `PLAUSIBLE_DOMAIN` (bv. `sprzedamfakture.pl` — cookieloze analytics, geen cookiebanner nodig). `/health` → `seo.verification` / `seo.analytics`.
- **Na livegang**: sitemap indienen in Search Console én Bing; Google Business Profile aanmaken; artikelen delen op LinkedIn (PL + EN); nieuwe artikelen toevoegen in `src/articles.js` (slug, date/updated, pl/en) — ze komen automatisch in overzicht, sitemap en nav.

## Beveiliging
- **Wachtwoorden**: bcrypt, kosten 12; policy min. 10 tekens met kleine/hoofdletter + cijfer.
- **2FA (TOTP)**: via `speakeasy` (CommonJS — draait ook op Node 18, zoals Railway standaard gebruikt); verplicht bij registratie en voor admin (eerste login forceert QR-setup). Issuer in de authenticator-app: `sprzedamfakture.pl`.
- **Rate limiting**: 5 mislukte pogingen (per IP+e-mail) → 15 min blokkade, ook op de 2FA-stap.
- **Sessies**: httpOnly, sameSite=lax, secure achter Railway-proxy, 8 uur geldig, sessie-regeneratie bij login (anti session fixation).
- **Admin-login**: `/login` met `ADMIN_EMAIL` + `ADMIN_PASSWORD` uit Railway (defaults: `admin@sprzedamfakture.pl` / `Admin-Zmien-Mnie-1!`). De env-vars zijn leidend: een gewijzigd `ADMIN_PASSWORD` wordt bij start in de DB afgedwongen, en zodra `ADMIN_EMAIL` op een eigen adres staat wordt het default-adminaccount verwijderd. Eerste login vraagt QR-scan (TOTP, verplicht); de 2FA-koppeling blijft in de DB bewaard.
- **Demo-account**: `demo@sprzedamfakture.pl` / `Demo1234!` (zonder 2FA, alleen om te klikken; het oude `demo@creditline.pl` werkt als alias). Staat als hint op de loginpagina — **uitzetten vóór livegang** met env `DEMO_ACCOUNT=0`. Admin-default: `admin@sprzedamfakture.pl` (overschrijf met `ADMIN_EMAIL`). Bij een DB zijn DB-accounts leidend; seed-accounts die nog ontbreken krijgen een vrij id (geen botsing met oude Creditline-accounts).
- Gebruikers, sessies, acties, scores en events staan in PostgreSQL zodra `DATABASE_URL` gezet is.

## E-mail (Resend) — formulieren
Het leadformulier stuurt via **Resend** twee mails: een **notificatie naar jou** (`MAIL_NOTIFY`, met alle velden, taal van de klant en link naar `/admin`; reply-to = de klant) en een **bevestiging aan de klant** in PL of EN (samenvatting, wstępna oferta, vervolgstappen; reply-to = `MAIL_NOTIFY`). Bij registratie gaat een welkomstmail. Zonder `RESEND_API_KEY` draait alles in symulacja (alleen gelogd, formulier werkt gewoon). Code: `src/mailer.js`.

Instellen:
1. **Resend → Domains → Add domain** `sprzedamfakture.pl` (regio EU). Zet de getoonde DNS-records bij dns.pl: DKIM (`resend._domainkey` TXT), SPF/MX voor het `send.`-subdomein en liefst een DMARC-record (`_dmarc` TXT, `v=DMARC1; p=none`). Wacht op "Verified" — zonder geverifieerd domein kun je alleen naar je eigen Resend-adres sturen vanaf `onboarding@resend.dev`.
2. **Resend → API Keys → Create** (Sending access, domein sprzedamfakture.pl). Kopieer de key (`re_…`).
3. **Railway → Variables**: `RESEND_API_KEY=re_…`, `MAIL_FROM=sprzedamfakture.pl <kontakt@sprzedamfakture.pl>` (moet op het geverifieerde domein zitten), `MAIL_NOTIFY=jouw@inbox` (waar leads binnenkomen; fallback `ADMIN_EMAIL`), optioneel `SITE_URL`. Redeploy.
4. **Controleren**: `/admin` → blok *Integracje* → knop **Wyślij testowy e-mail** → status verschijnt bovenaan (`wysłano` of de foutmelding van Resend, bijv. domein niet geverifieerd). `/health` toont `mail`, `mailFrom`, `mailNotify`.
5. **Let op**: Resend verzendt alleen. Antwoorden van klanten komen binnen op `MAIL_NOTIFY` (reply-to). Wil je post op `kontakt@sprzedamfakture.pl` ontvangen, regel dan een mailbox of forwarding bij je domeinprovider.

Mails naar **dłużnicy** (agent-knop E-mail/SMS in het panel) gaan pas echt met `LIVE_COMMS=1` — anders symulacja, ook mét keys. De demo-zaken hebben fictieve adressen; zet dit pas aan met echte zaken.

## Anti-bot (Cloudflare Turnstile)
Het leadformulier en de registratie hebben een Turnstile-widget (naast de honeypot). Staat automatisch aan zodra beide variabelen in Railway staan; zonder keys geen widget en geen verificatie.
1. **Cloudflare dashboard → Turnstile → Add widget**: hostnames `sprzedamfakture.pl` en `www.sprzedamfakture.pl` (voeg ook je Railway-domein toe als je daar test), widget mode *Managed*.
2. **Railway → Variables**: `TURNSTILE_SITE_KEY=0x…` (site key) en `TURNSTILE_SECRET_KEY=0x…` (secret). Redeploy.
3. Controle: widget zichtbaar boven de verzendknop op `/` en `/rejestracja`; `/admin` → Integracje → *Cloudflare Turnstile*: Aktywne; `/health` → `turnstile: true`.
Server-side verificatie via `siteverify` in `src/turnstile.js`; bij weigering krijgt de gebruiker de melding „Weryfikacja antybotowa nie powiodła się” (EN: „Bot check failed”) en blijven de ingevulde velden staan. Testen zonder echte keys: Cloudflare-testkeys `1x00000000000000000000AA` / `1x0000000000000000000000000000000AA` (altijd ok) of secret `2x0000000000000000000000000000000AA` (altijd geweigerd).

## Sprzedaj fakturę (homepage)
Instant wycena-widget (indicatieve oferta via `AiScore.estimateOffer`, definitief na KRZ/KRS/biała lista-check), 4-stappenflow, FAQ (incl. zakaz cesji, rekompensata blijft bij verkoper, art. 512-notificatie, doorverwijzing naar windykacja) en een leadformulier → tabel `leads` + event in het admin-dashboard en de Agent-tab.

## AIScore & monitoring
Elke dłużnik krijgt een **AIScore** (0–100, klasa A–E) — geen kredietscore van een biuro, maar een eigen AI-inschatting van de inbaarheid van déze vordering. Bepaalt de eerlijke wykup-oferta (formule in `src/aiscore.js`) en de rekomendacja: **windykacja** (≥60), **sprzedaż** (45–59) of **zamknięcie** (kansloos: upadłość of score <25, met odpis-optie in het detailpaneel).

Bronnen/connectors in `src/aiscore.js`:
- **KRZ** (krz.ms.gov.pl) — jawny en gratis: upadłości, restrukturyzacje, umorzone egzekucje. Geen officiële API (in de maak volgens MS); productie via MGBI-API of eigen poller. Nu gesimuleerd.
- **MF biała lista** — open API (wl-api.mf.gov.pl), echte call ingebouwd (actief bij `DEMO_EVENTS=0`).
- **KRS** (api-krs.ms.gov.pl) + **MSiG** — stubs, gedocumenteerd.
- **Let op**: individuele nakazy zapłaty zijn in Polen NIET centraal openbaar; KRD/BIG zijn commerciële API's (aansluitovereenkomst).

De **monitor** draait als continue loop over alle dłużnicy in de database (`MONITOR_INTERVAL_MS`, default 60s — niet letterlijk per seconde: registers publiceren batchgewijs en API's rate-limiten; het effect is hetzelfde). Nieuw obwieszczenie → event in het panel (Agent AI-tab + admin) → AIScore herberekend. Demo-tijdlijn: AgroSad krijgt na 1 tick een restrukturyzacja (47→12) en na 5 ticks een upadłość (→0, rekomendacja zamknięcie). `DEMO_EVENTS=0` schakelt naar echte bronnen.

## Communicatielaag (agent-acties)
Vanuit het detailpaneel van elke zaak, in de gekozen toon (Uprzejmy/Stanowczy/Prawniczy):
- **E-mail** — treść genereert de agent (Anthropic API indien `ANTHROPIC_API_KEY` gezet, anders professionele PL-templates, ondertekend *sprzedamfakture.pl — dział windykacji*), verzending via **Resend** (`RESEND_API_KEY`, afzender `FROM_EMAIL`, default `windykacja@sprzedamfakture.pl`) — alleen met `LIVE_COMMS=1`. Zonder key of zonder `LIVE_COMMS`: symulacja-modus, volledig gelogd.
- **SMS** — via **SMSAPI.pl** (`SMSAPI_TOKEN`, afzendernaam `SMS_FROM`, default `SprzedamFV` — SMSAPI staat max. 11 alfanumerieke tekens toe, dus de volledige domeinnaam past niet; registreer de afzendernaam in het SMSAPI-panel). Zonder token: symulacja.
- **Telefoon** — jij belt zelf: knop "Zadzwoń — skrypt" opent de belvoorbereiding met klikbaar nummer (tel:), AI-gespreksscript (cel, otwarcie, argumenten met actuele odsetki/rekompensata, reacties op 4 standaard-wymówki, zamknięcie) en na afloop een resultaatformulier (obietnica/raty/sporna/odmowa/brak + termin + notatka). Het resultaat stuurt de zaakfase bij (raty → "Harmonogram rat", odmowa → "Eskalacja").

Alles wordt gelogd in `comm_log` (PostgreSQL/memory), verschijnt als "Historia komunikacji" in het detailpaneel en als event op de Agent AI-tab. Extra env vars: `RESEND_API_KEY`, `FROM_EMAIL`, `MAIL_FROM`, `MAIL_NOTIFY`, `LIVE_COMMS`, `SMSAPI_TOKEN`, `SMS_FROM`, `ANTHROPIC_API_KEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

## Database (Railway Postgres)
- Project *Creditline Incasso Polen* heeft een service **Postgres**. Koppeling = op de app-service (*Incasso-*) de variabele `DATABASE_URL` zetten als **referentie**: `${{Postgres.DATABASE_URL}}` (interne host `postgres.railway.internal`, geen egress-kosten). Railway redeployt automatisch. Zet tegelijk een lange random `SESSION_SECRET` (sessies staan dan in de tabel `session`).
- Schema (`users`, `case_actions`, `events`, `leads`, `comm_log`, `debtor_scores`, `session`) wordt bij start automatisch aangemaakt (`src/db.js`). SSL: automatisch aan voor Railway-URL's, met fallback zonder SSL; `PGSSLMODE=disable` / `PGSSL=1` forceren.
- Controle: `/health` → `db: true` en `dbStats` (ping in ms + aantallen users/leads/events/comms); `/admin` → Integracje → PostgreSQL: Aktywne. Logregel bij start: `DB: verbonden (SSL)` + `DB: PostgreSQL verbonden, schema klaar`.
- Lokaal tegen de Railway-DB testen: `railway variables -s Postgres --json` → `DATABASE_PUBLIC_URL` (publieke proxy) als `DATABASE_URL` meegeven.
- **Leads** hebben `status` (default `nowy`), `admin_note`, `updated_at` en `case_id` (idempotente migraties) — beheer via `/admin/leady`. **Bijlagen** (factuur/vonnis, PDF/JPG/PNG/XML ≤ 8 MB) staan sinds v0.7.2 in de tabel `lead_files` (bytea) en zijn te openen in `/admin/leady` (blok *Załączniki*, 📎 in de lijst) en in de zaak die uit de lead is gemaakt (`/app/sprawy/:id/zalacznik/:fid`, admin of eigenaar). De notificatiemail krijgt de bijlage ook nog steeds. Aanvragen van vóór 28-09-2026 hebben hun bijlage alleen in die mail.
- **Demo-sporen opruimen**: knop *Usuń ślady danych demo z bazy* op `/admin` verwijdert monitor-/KRZ-/MSiG-events, events op demo-NIP's, `comm_log`, `debtor_scores` en `case_actions` van de zes demo-zaken. Leads en lead-events blijven staan. Combineer met `DEMO_CASES=0` (of gewoon `NODE_ENV=production`), anders komen de monitor-events bij de volgende herstart terug.
- Bij de eerste start met een lege DB worden demo- en admin-account weggeschreven; daarna is de DB leidend (wachtwoorden/2FA blijven bewaard). **Zet vóór livegang `ADMIN_EMAIL` + `ADMIN_PASSWORD`**, anders staat het default-adminwachtwoord in de DB.

## Status / architectuur
- **PostgreSQL-koppeling actief**: met `DATABASE_URL` (Railway Postgres) worden users, sessies (connect-pg-simple), zaakacties, AIScores, events, leads en communicatielog persistent; schema wordt automatisch aangemaakt. Zonder `DATABASE_URL` draait alles in-memory (demo).
- **Echte zaken**: tabel `cases` + `src/cases.js`; lead → zaak vanuit `/admin/leady`, handmatig via `/app/nowa`. Demo-zaken (`src/data.js`) staan in productie uit (`DEMO_CASES`). In demo-modus wordt de KRZ-status bij herstart vers herberekend uit de bronnen (by design — events blijven wel staan).
- Rentevoet 14% (NBP 4% + 10 p.p., I półrocze 2026) staat in `src/data.js` (`INTEREST_RATE`) — halfjaarlijks bijwerken.

## Roadmap-ideeën (nog niet gebouwd)
1. **KSeF-koppeling** — echte API-integratie zodra klant-tokens beschikbaar; nu gestubd in intake.
2. **Claude Vision** voor XML/PDF-faktura's uitlezen bij intake.
3. **Stripe** voor de 99 zł serviceopłata (P24/BLIK voor de Poolse markt).
4. **KRZ-connector productie** (MGBI-API of portal-poller) + KRD/BIG-aansluiting voor niet-openbare data.
5. Kalkulator uitbouwen met NBP-kurs-API voor de rekompensata in zł + noty odsetkowe als PDF.
6. Cesja-flow met e-handtekening (Autenti/mObywatel) rechtstreeks vanuit het leadformulier.

## Let op (juridisch, even verifiëren)
**Incassobeleid (advies jurist, 31-08-2026): zolang er via de Nederlandse entiteit wordt geïncasseerd, alleen incasseren op rechtspersonen — de dłużnik moet een osoba prawna zijn (sp. z o.o., S.A., P.S.A., spółdzielnia/fundacja).** Afgedwongen op het leadformulier met het verplichte veld „forma prawna dłużnika” + servervalidatie (`DEBTOR_LEGAL_FORMS` in `server.js`); faktury op JDG, spółka cywilna, spółki osobowe of consumenten krijgen een nette weigering (PL/EN, ook als FAQ-item). De rechtsvorm van de dłużnik staat in de leadmail, in `/admin` en in de DB (kolom `leads.forma`, idempotente migratie). De klant (verkoper) mag elke rechtsvorm hebben.

B2B windykacja polubowna vereist in Polen op dit moment geen vergunning, maar er ligt al langer een wetsvoorstel (ustawa o działalności windykacyjnej) dat licenties voor windykacja-bedrijven zou invoeren. Wykup wierzytelności (cesja) is vrij. Check de actuele status vóór livegang, en of je dit onder Budomatch DANIËL DE GRAAF (NIP 7010869430) of een nieuwe sp. z o.o. wilt draaien — voor incasso-geloofwaardigheid richting dłużnicy is een Poolse sp. z o.o. sterker.
