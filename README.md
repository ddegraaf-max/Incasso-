# Creditline Poland — AI windykacja należności

Node/Express/EJS-implementatie van de design handoff (Modernist design system: Archivo, flat, 2px rules, accent `#ec3013`). Railway-ready.

## Routes

| Route | Wat |
|---|---|
| `/` | Marketing one-pager (PL) |
| `/login` · `/rejestracja` | Inloggen / registratie (bcrypt, rate limiting) |
| `/2fa` · `/2fa/setup` | TOTP-verificatie / QR-setup (Google Authenticator e.d.) |
| `/admin` | Admin-dashboard (alleen rol admin, 2FA verplicht) |
| `/app/sprawy` | Zakenoverzicht + detail-aside (`?sel=f2`) |
| `/app/nowa` | Intake: KSeF / XML-PDF / e-mail + AI-analyse + beslissing |
| `/app/agent` | Agent-feed + negotiatiethread, toon-switcher (`?ton=Uprzejmy\|Stanowczy\|Prawniczy`) |
| `/app/wykup` | Wykup wierzytelności (AI-offertes, cesja) |
| `/kalkulator` | **Extra:** publieke kalkulator odsetek (14%) + rekompensata 40/70/100 € — leadmagnet/SEO |
| `/wezwanie` | **Extra:** printbaar wezwanie do zapłaty, gegenereerd vanuit de kalkulator |

## Lokaal draaien
```
npm install
npm start        # poort 3000, of PORT env var
```

## Deploy (Railway)
Standaard flow: repo → GitHub Desktop → Railway auto-deploy. Geen database nodig voor het concept.
Env vars: `PORT` (Railway zet die zelf), `SESSION_SECRET` (VERPLICHT in productie — lange random string), `ADMIN_EMAIL` + `ADMIN_PASSWORD` (admin-account), optioneel `SERVICE_FEE` (default 99), `EUR_PLN` (default 4.30), `DATABASE_URL` (Railway Postgres — activeert persistentie), `MONITOR_INTERVAL_MS` (default 60000) en `DEMO_EVENTS` (default 1; op 0 voor echte bronnen). Zet `NODE_ENV=production` voor secure cookies.

## Beveiliging
- **Wachtwoorden**: bcrypt, kosten 12; policy min. 10 tekens met kleine/hoofdletter + cijfer.
- **2FA (TOTP)**: via `speakeasy` (CommonJS — draait ook op Node 18, zoals Railway standaard gebruikt); verplicht bij registratie en voor admin (eerste login forceert QR-setup). Werkt met Google/Microsoft Authenticator, Aegis, enz.
- **Rate limiting**: 5 mislukte pogingen (per IP+e-mail) → 15 min blokkade, ook op de 2FA-stap.
- **Sessies**: httpOnly, sameSite=lax, secure achter Railway-proxy, 8 uur geldig, sessie-regeneratie bij login (anti session fixation).
- **Demo-account**: `demo@creditline.pl` / `Demo1234!` (zonder 2FA, alleen om te klikken) — **verwijderen vóór livegang** in `src/auth.js`.
- Gebruikers, sessies, acties, scores en events staan in PostgreSQL zodra `DATABASE_URL` gezet is.

## AIScore & monitoring
Elke dłużnik krijgt een **AIScore** (0–100, klasa A–E) — geen kredietscore van een biuro, maar een eigen AI-inschatting van de inbaarheid van déze vordering. Bepaalt de eerlijke wykup-oferta (formule in `src/aiscore.js`) en de rekomendacja: **windykacja** (≥60), **sprzedaż** (45–59) of **zamknięcie** (kansloos: upadłość of score <25, met odpis-optie in het detailpaneel).

Bronnen/connectors in `src/aiscore.js`:
- **KRZ** (krz.ms.gov.pl) — jawny en gratis: upadłości, restrukturyzacje, umorzone egzekucje. Geen officiële API (in de maak volgens MS); productie via MGBI-API of eigen poller. Nu gesimuleerd.
- **MF biała lista** — open API (wl-api.mf.gov.pl), echte call ingebouwd (actief bij `DEMO_EVENTS=0`).
- **KRS** (api-krs.ms.gov.pl) + **MSiG** — stubs, gedocumenteerd.
- **Let op**: individuele nakazy zapłaty zijn in Polen NIET centraal openbaar; KRD/BIG zijn commerciële API's (aansluitovereenkomst).

De **monitor** draait als continue loop over alle dłużnicy in de database (`MONITOR_INTERVAL_MS`, default 60s — niet letterlijk per seconde: registers publiceren batchgewijs en API's rate-limiten; het effect is hetzelfde). Nieuw obwieszczenie → event in het panel (Agent AI-tab + admin) → AIScore herberekend. Demo-tijdlijn: AgroSad krijgt na 1 tick een restrukturyzacja (47→12) en na 5 ticks een upadłość (→0, rekomendacja zamknięcie). `DEMO_EVENTS=0` schakelt naar echte bronnen.

## Status / architectuur
- **PostgreSQL-koppeling actief**: met `DATABASE_URL` (Railway Postgres-plugin) worden users, sessies (connect-pg-simple), zaakacties, AIScores en events persistent; schema wordt automatisch aangemaakt. Zonder `DATABASE_URL` draait alles in-memory (demo). In demo-modus wordt de KRZ-status bij herstart vers herberekend uit de bronnen (by design — events blijven wel staan).
- Rentevoet 14% (NBP 4% + 10 p.p., I półrocze 2026) staat in `src/data.js` (`INTEREST_RATE`) — halfjaarlijks bijwerken.

## Roadmap-ideeën (nog niet gebouwd)
1. **KSeF-koppeling** — echte API-integratie zodra klant-tokens beschikbaar; nu gestubd in intake.
2. **Anthropic API** voor de agent zelf: toon-afhankelijke e-mails genereren, XML/PDF-faktura's uitlezen (Claude Vision), scoring-samenvatting.
3. **Resend** voor przypomnienia + nota's per e-mail (zelfde patroon als je andere projecten).
4. **Stripe** voor de 99 zł serviceopłata (P24/BLIK voor de Poolse markt).
5. **KRZ-connector productie** (MGBI-API of portal-poller) + KRD/BIG-aansluiting voor niet-openbare data.
6. **Klantportaal-login** met TOTP/2FA (patroon uit bestelkozijnenopmaat hergebruiken).
7. Kalkulator uitbouwen met NBP-kurs-API voor de rekompensata in zł + noty odsetkowe als PDF.

## Let op (juridisch, even verifiëren)
B2B windykacja polubowna vereist in Polen op dit moment geen vergunning, maar er ligt al langer een wetsvoorstel (ustawa o działalności windykacyjnej) dat licenties voor windykacja-bedrijven zou invoeren. Wykup wierzytelności (cesja) is vrij. Check de actuele status vóór livegang, en of je dit onder Budomatch DANIËL DE GRAAF (NIP 7010869430) of een nieuwe sp. z o.o. wilt draaien — voor incasso-geloofwaardigheid richting dłużnicy is een Poolse sp. z o.o. sterker.
