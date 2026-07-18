# Creditline Poland — AI windykacja należności

Node/Express/EJS-implementatie van de design handoff (Modernist design system: Archivo, flat, 2px rules, accent `#ec3013`). Railway-ready.

## Routes

| Route | Wat |
|---|---|
| `/` | Marketing one-pager (PL) |
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
Env vars: `PORT` (Railway zet die zelf), optioneel `SERVICE_FEE` (default 99).

## Status / architectuur
- Actiestatus (windykacja zgezet / verkocht) is **in-memory** — reset bij redeploy. Prima voor demo; voor productie: PostgreSQL (tabellen `cases`, `actions`, `orgs`) + sessies.
- Rentevoet 14% (NBP 4% + 10 p.p., I półrocze 2026) staat in `src/data.js` (`INTEREST_RATE`) — halfjaarlijks bijwerken.

## Roadmap-ideeën (nog niet gebouwd)
1. **KSeF-koppeling** — echte API-integratie zodra klant-tokens beschikbaar; nu gestubd in intake.
2. **Anthropic API** voor de agent zelf: toon-afhankelijke e-mails genereren, XML/PDF-faktura's uitlezen (Claude Vision), scoring-samenvatting.
3. **Resend** voor przypomnienia + nota's per e-mail (zelfde patroon als je andere projecten).
4. **Stripe** voor de 99 zł serviceopłata (P24/BLIK voor de Poolse markt).
5. **KRD/BIG-API** voor echte debiteurchecks en wpisy.
6. **Klantportaal-login** met TOTP/2FA (patroon uit bestelkozijnenopmaat hergebruiken).
7. Kalkulator uitbouwen met NBP-kurs-API voor de rekompensata in zł + noty odsetkowe als PDF.

## Let op (juridisch, even verifiëren)
B2B windykacja polubowna vereist in Polen op dit moment geen vergunning, maar er ligt al langer een wetsvoorstel (ustawa o działalności windykacyjnej) dat licenties voor windykacja-bedrijven zou invoeren. Wykup wierzytelności (cesja) is vrij. Check de actuele status vóór livegang, en of je dit onder Budomatch DANIËL DE GRAAF (NIP 7010869430) of een nieuwe sp. z o.o. wilt draaien — voor incasso-geloofwaardigheid richting dłużnicy is een Poolse sp. z o.o. sterker.
