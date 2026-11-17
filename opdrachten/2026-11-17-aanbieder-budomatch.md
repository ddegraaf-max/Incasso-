# Opdracht: Budomatch DANIËL DE GRAAF als aanbieder van sprzedamfakture.pl op de site

**Gemaakt:** 17 november 2026, bij de Google Ads-verificatie voor financiële diensten (Polen).
**Besluit van Daniël (17-11-2026):** de verificatie wordt aangevraagd op naam van **Budomatch DANIËL DE GRAAF** (NIP 7010869430, Białka 15, 09-550 Szczawin Kościelny), omdat het Google Ads-account op die naam geverifieerd is. G2 en Google controleren of de site dezelfde aanbieder noemt. Nu staat overal Creditline B.V.

## Waar Creditline nu staat
- `src/company.js` (bron van de bedrijfsgegevens): Creditline BV, Torenlaan 5B, 1402 AT Bussum, KvK …
- `views/polityka-prywatnosci.ejs` (beheerder van de gegevens)
- `src/aimail.js` (r. ~133 en ~245, systeemprompts: "Creditline BV, a Dutch company that buys…")
- `src/research.js` (r. ~306)
- `src/auth.js`, `src/i18n-app.js`, `README.md`

## Te doen
1. Zet in `src/company.js` de aanbieder op: **Budomatch DANIËL DE GRAAF**, NIP 7010869430, adres Białka 15, 09-550 Szczawin Kościelny, Polska. Alles wat op de site, in de regulamin, het privacybeleid, de footer, de mails en de facturen/cessiedocumenten staat, leest daaruit.
2. Pas de vaste teksten in `aimail.js` en `research.js` aan (aanbieder is een Poolse ondernemer, niet een Nederlands bedrijf).
3. Regulamin en polityka prywatności: aanbieder en beheerder van de gegevens = Budomatch DANIËL DE GRAAF. Zet een datum "obowiązuje od" bij de nieuwe versie.
4. **Niet wijzigen zonder Daniël:** bestaande, al getekende cessie- of incassodossiers op naam van Creditline B.V. blijven zoals ze zijn. Nieuwe dossiers vanaf de datum van de nieuwe regulamin lopen op Budomatch. Zet dat in je samenvatting, zodat Daniël het juridisch kan laten nakijken.
5. Zoek na afloop op `Creditline` en `Torenlaan` om te controleren dat er op de publieke pagina's niets meer van over is.

## Waarom het haast heeft
Google beperkt de advertenties van sprzedamfakture.pl als de verificatie niet binnen 30 dagen rond is. De G2-controle vergelijkt de naam en het NIP met CEIDG en met de site.
