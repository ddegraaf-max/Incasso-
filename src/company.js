// sprzedamfakture.pl — bedrijfsgegevens van de exploitant (Creditline B.V.)
//
// Wettelijk verplichte identificatie (PL: art. 5 ustawy o świadczeniu usług drogą elektroniczną;
// NL/EU: e-commercerichtlijn) op elke pagina in de footer + in het Organization-schema van de homepage.
// Alle velden via Railway-variabelen, zodat ze zonder deploy te wijzigen zijn. Lege velden worden
// niet getoond; `complete()` zegt of de kernset (adres, KvK, BTW) is ingevuld — zie /health → company.
const C = {
  name: process.env.COMPANY_NAME || 'Creditline B.V.',
  brand: 'sprzedamfakture.pl',
  street: process.env.COMPANY_STREET || '',   // bv. 'Voorbeeldstraat 1'
  city: process.env.COMPANY_CITY || '',       // bv. '1234 AB Amsterdam'
  country: (process.env.COMPANY_COUNTRY || 'NL').toUpperCase(), // ISO-landcode
  kvk: process.env.COMPANY_KVK || '',         // KvK-nummer
  vat: process.env.COMPANY_VAT || '',         // BTW-id, bv. NL123456789B01 (= NIP UE)
  email: process.env.COMPANY_EMAIL || 'kontakt@sprzedamfakture.pl',
  phone: process.env.COMPANY_PHONE || '',     // bv. '+31 20 123 4567'
  rep: process.env.COMPANY_REP || '',         // vertegenwoordiger / bestuurder (optioneel)
  extra: process.env.COMPANY_EXTRA || '',     // vrije regel, bv. Poolse entiteit of NIP (optioneel)
};

function complete() { return !!(C.street && C.city && C.kvk && C.vat); }

// schema.org Organization voor de homepage (JSON-LD)
function jsonLd(site) {
  const o = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: C.brand, legalName: C.name, url: site + '/', logo: site + '/img/logo.svg', email: C.email,
    brand: { '@type': 'Brand', name: C.brand },
    areaServed: ['PL', 'NL', 'EU'],
    knowsLanguage: ['pl', 'en', 'nl'],
  };
  if (C.phone) o.telephone = C.phone;
  if (C.vat) o.vatID = C.vat;
  if (C.kvk) o.identifier = { '@type': 'PropertyValue', propertyID: 'KvK', value: C.kvk };
  if (C.street || C.city) o.address = { '@type': 'PostalAddress', streetAddress: C.street || undefined, addressLocality: C.city || undefined, addressCountry: C.country };
  if (C.rep) o.founder = { '@type': 'Person', name: C.rep };
  return o;
}

module.exports = { C, complete, jsonLd };
