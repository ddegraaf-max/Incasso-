// sprzedamfakture.pl — onderzoeksverslag per aanvraag (lead): debiteur + aanvrager
//
// Bronnen, in volgorde:
//   1. MF biała lista (NIP → naam, btw-status, REGON, KRS, adres, btw-registratie, vertegenwoordigers,
//      aantal bankrekeningen) — open API, gratis.
//   2. KRS odpis aktualny (rechtsvorm, kapitaal, bestuur, PKD, e-mail/website uit het register,
//      dział 4 en 6: zaległości, egzekucje, likwidacja, upadłość, restrukturyzacja) — open API, gratis.
//   3. Website van de aanvrager (via het e-maildomein) en van de debiteur (uit KRS): titel/omschrijving.
//   4. AI-verslag met webonderzoek (Anthropic SDK, server tool web_search): activiteiten, omvang,
//      opinies, nieuws, insolventie/KRZ/MSiG, rechtszaken, plausibiliteit van de aanvraag, advies.
// Zonder ANTHROPIC_API_KEY alleen 1–3. Resultaat in tabel lead_reports (nieuwste per lead telt).
// Draait asynchroon (fire-and-forget) bij elke nieuwe lead (LEAD_RESEARCH=0 zet dat uit) en op
// verzoek via POST /admin/leady/:id/raport. Taal van het verslag: RESEARCH_LANG (default nl).
const db = require('./db');

let Anthropic = null;
try { const m = require('@anthropic-ai/sdk'); Anthropic = m.default || m; } catch { Anthropic = null; }

const KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.RESEARCH_MODEL || 'claude-opus-5';
const LANG = (process.env.RESEARCH_LANG || 'nl').toLowerCase();
const AUTO = process.env.LEAD_RESEARCH !== '0';
const MAX_SEARCHES = Math.max(1, parseInt(process.env.RESEARCH_MAX_SEARCHES || '8', 10));
const UA = 'Mozilla/5.0 (compatible; sprzedamfakture-research/1.0; +https://sprzedamfakture.pl)';
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'wp.pl', 'onet.pl', 'onet.eu', 'o2.pl', 'interia.pl', 'interia.eu', 'op.pl', 'poczta.fm', 'poczta.onet.pl', 'tlen.pl', 'vp.pl', 'gazeta.pl', 'go2.pl', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'yahoo.com', 'yahoo.pl', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'ziggo.nl', 'kpnmail.nl', 'hetnet.nl', 'planet.nl', 'home.nl', 'hotmail.nl', 'live.nl', 'outlook.nl', 'gmx.de', 'gmx.net', 'web.de', 'mail.com']);

// ── Hulpfuncties ─────────────────────────────────────────────────────────
async function fetchJson(url, ms = 7000) {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { accept: 'application/json', 'user-agent': UA } });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

function domainFromEmail(email) {
  const m = /@([a-z0-9.-]+\.[a-z]{2,})$/i.exec(String(email || '').trim());
  if (!m) return null;
  const d = m[1].toLowerCase();
  return FREE_MAIL.has(d) ? null : d;
}

function hostOf(s) {
  return String(s || '').trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '') || null;
}

// ── 1. MF biała lista ────────────────────────────────────────────────────
async function mfLookup(nip) {
  const clean = String(nip || '').replace(/\D/g, '');
  if (clean.length !== 10) return null;
  const date = new Date().toISOString().slice(0, 10);
  const j = await fetchJson('https://wl-api.mf.gov.pl/api/search/nip/' + clean + '?date=' + date).catch(() => null);
  const s = j && j.result && j.result.subject;
  if (!s) return { found: false, nip: clean };
  const person = (p) => [p.firstName, p.lastName, p.companyName].filter(Boolean).join(' ');
  return {
    found: true, nip: clean, name: s.name, statusVat: s.statusVat, regon: s.regon || null, krs: s.krs || null,
    address: s.workingAddress || s.residenceAddress || null,
    registrationLegalDate: s.registrationLegalDate || null, removalDate: s.removalDate || null, restorationDate: s.restorationDate || null,
    vatRemoved: !!(s.removalDate && !s.restorationDate),
    representatives: (s.representatives || []).map(person).filter(Boolean),
    partners: (s.partners || []).map(person).filter(Boolean),
    accounts: (s.accountNumbers || []).length, hasVirtualAccounts: !!s.hasVirtualAccounts,
  };
}

// ── 2. KRS odpis aktualny ────────────────────────────────────────────────
const FLAG_KEYS = {
  likwidacja: 'likwidacja', postepowanieUpadlosciowe: 'upadłość', postepowanieRestrukturyzacyjne: 'restrukturyzacja', postepowanieNaprawcze: 'postępowanie naprawcze',
  zawieszenieDzialalnosci: 'zawieszenie działalności', informacjaOUmorzeniuEgzekucji: 'umorzenie egzekucji (bezskuteczność)', umorzenieEgzekucji: 'umorzona egzekucja',
  zaleglosci: 'zaległości podatkowe / celne / ZUS', wierzytelnosci: 'wierzytelności / egzekucja', informacjeOZabezpieczeniuMajatku: 'zabezpieczenie majątku', oddalenieWnioskuOUpadlosc: 'oddalony wniosek o upadłość (brak majątku)',
};
async function krsLookup(krs) {
  const k = String(krs || '').replace(/\D/g, '').padStart(10, '0');
  if (k.length !== 10 || !/[1-9]/.test(k)) return null;
  const j = await fetchJson('https://api-krs.ms.gov.pl/api/krs/OdpisAktualny/' + k + '?rejestr=P&format=json', 9000).catch(() => null);
  const o = j && j.odpis;
  if (!o || !o.dane) return { found: false, krs: k };
  const d = o.dane, d1 = d.dzial1 || {}, d2 = d.dzial2 || {}, d3 = d.dzial3 || {}, d4 = d.dzial4 || {}, d6 = d.dzial6 || {};
  const pod = d1.danePodmiotu || {}, sa = d1.siedzibaIAdres || {}, adr = sa.adres || {};
  const street = [adr.ulica, adr.nrDomu].filter(Boolean).join(' ') + (adr.nrLokalu ? '/' + adr.nrLokalu : '');
  const address = [street.trim(), [adr.kodPocztowy, adr.miejscowosc].filter(Boolean).join(' ')].filter(Boolean).join(', ') || null;
  const cap = d1.kapital && d1.kapital.wysokoscKapitaluZakladowego;
  const vals = (obj) => (obj && typeof obj === 'object' ? Object.values(obj).filter((v) => typeof v === 'string').join(' ') : '');
  const board = ((d2.reprezentacja || {}).sklad || []).map((m) => [vals(m.imiona), vals(m.nazwisko)].filter(Boolean).join(' ') + (m.funkcjaWOrganie ? ' — ' + m.funkcjaWOrganie : '')).filter(Boolean);
  const pkdArr = ((d3.przedmiotDzialalnosci || {}).przedmiotPrzewazajacejDzialalnosci || []);
  const pkd = pkdArr.length ? [pkdArr[0].kodDzial, pkdArr[0].kodKlasa, pkdArr[0].kodPodklasa].filter(Boolean).join('.') + ' ' + (pkdArr[0].opis || '') : null;
  const flags = [];
  for (const [sec, obj] of [['dział 4', d4], ['dział 6', d6]]) {
    for (const [key, v] of Object.entries(obj || {})) {
      if (key === 'polaczeniePodzialPrzeksztalcenie') continue;
      const nonEmpty = Array.isArray(v) ? v.length > 0 : (v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v);
      if (nonEmpty) flags.push((FLAG_KEYS[key] || key) + ' (' + sec + ')');
    }
  }
  const head = o.naglowekA || {};
  return {
    found: true, krs: k, name: pod.nazwa || null, form: pod.formaPrawna || null, address,
    email: sa.adresPocztyElektronicznej ? String(sa.adresPocztyElektronicznej).toLowerCase() : null,
    website: sa.adresStronyInternetowej ? String(sa.adresStronyInternetowej).toLowerCase() : null,
    capital: cap && cap.wartosc ? cap.wartosc + ' ' + (cap.waluta || 'PLN') : null,
    representation: (d2.reprezentacja || {}).sposobReprezentacji || null,
    board, pkd, registered: head.dataRejestracjiWKRS || null, lastEntry: head.dataOstatniegoWpisu || null, asOf: head.stanZDnia || null,
    flags, raw46: flags.length ? JSON.stringify({ dzial4: d4, dzial6: d6 }).slice(0, 4000) : null,
  };
}

// ── 3. Website ───────────────────────────────────────────────────────────
async function siteInfo(hostOrUrl) {
  const host = hostOf(hostOrUrl);
  if (!host) return null;
  for (const proto of ['https://', 'http://']) {
    try {
      const r = await fetch(proto + host, { signal: AbortSignal.timeout(7000), redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
      if (!r.ok) continue;
      const html = (await r.text()).slice(0, 300000);
      const pick = (re) => { const m = re.exec(html); return m ? m[1].replace(/\s+/g, ' ').trim().slice(0, 300) : null; };
      return {
        ok: true, url: r.url, host,
        title: pick(/<title[^>]*>([^<]*)<\/title>/i),
        description: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i) || pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i),
        lang: pick(/<html[^>]+lang=["']([a-zA-Z-]+)["']/i),
      };
    } catch { /* volgende protocol */ }
  }
  return { ok: false, host, url: 'https://' + host };
}

// ── Feiten verzamelen ────────────────────────────────────────────────────
function parseNote(lead) {
  const out = { lang: null, registerName: null, vatLine: null, debtorName: null, sygnatura: null, enforcement: null, remarks: [] };
  for (const p of String(lead.note || '').split(' · ')) {
    let m;
    if ((m = /^lang=(\w+)$/.exec(p))) out.lang = m[1];
    else if ((m = /^dłużnik: (.+)$/.exec(p))) out.debtorName = m[1];
    else if ((m = /^wyrok (.+)$/.exec(p))) out.sygnatura = m[1];
    else if ((m = /^egzekucja: (.+)$/.exec(p))) out.enforcement = m[1];
    else if (/^VAT: /.test(p)) out.vatLine = p;
    else if (lead.source !== 'skup-wyrokow' && !out.registerName) out.registerName = p;
    else if (p) out.remarks.push(p);
  }
  return out;
}

async function collectFacts(lead) {
  const note = parseNote(lead);
  const isWyrok = lead.source === 'skup-wyrokow';
  const mf = await mfLookup(lead.nip).catch(() => null);
  const krs = mf && mf.found && mf.krs ? await krsLookup(mf.krs).catch(() => null) : null;
  const debtorSite = krs && krs.found && krs.website ? await siteInfo(krs.website).catch(() => null) : null;
  const domain = domainFromEmail(lead.email);
  const clientSite = domain ? await siteInfo(domain).catch(() => null) : null;
  return {
    collectedAt: new Date().toISOString(),
    request: {
      id: lead.id, source: isWyrok ? 'skup-wyrokow (opkoop vonnis)' : 'sprzedaj fakturę (verkoop factuur)', submitted: lead.created_at,
      amount: Number(lead.kwota) || 0, daysOverdue: lead.dni, debtorLegalForm: lead.forma || null, offerPct: lead.oferta_pct,
      sygnatura: note.sygnatura, enforcement: note.enforcement, remarks: note.remarks, adminNote: lead.admin_note || null, status: lead.status,
    },
    debtor: { nip: lead.nip || null, nameFromRequest: note.debtorName || note.registerName || null, mf, krs, site: debtorSite },
    client: { company: lead.company, email: lead.email, phone: lead.tel, domain, site: clientSite },
  };
}

// ── 4. AI-verslag met webonderzoek ───────────────────────────────────────
const LANG_NAME = { nl: 'Dutch (Nederlands)', pl: 'Polish (polski)', en: 'English' };
const HEADERS = {
  nl: ['## Samenvatting en risico', '## Debiteur', '## Aanvrager (klant)', '## Signalen en aandachtspunten', '## Vervolgstappen'],
  pl: ['## Podsumowanie i ryzyko', '## Dłużnik', '## Zgłaszający (klient)', '## Sygnały i uwagi', '## Dalsze kroki'],
  en: ['## Summary and risk', '## Debtor', '## Requesting client', '## Signals and points of attention', '## Next steps'],
};

function systemPrompt(lang) {
  const L = LANG_NAME[lang] || LANG_NAME.nl;
  const H = HEADERS[lang] || HEADERS.nl;
  return [
    'You are a senior credit and collections analyst at Creditline BV (brand sprzedamfakture.pl), a Dutch company that buys and collects overdue Polish B2B receivables and old judgments. The company works exclusively in writing (e-mail), never by phone — recommended next steps must be written steps.',
    'For each incoming request you write a concise, factual due-diligence report on (1) the debtor (dłużnik) and (2) the requesting client (the creditor who wants to sell or collect).',
    'Ground truth is the official register data supplied in the message (MF VAT white list, KRS extract, website metadata). Use web search to add what the registers do not show: what the company does, size and age, website and contact channels, management, reviews and opinions (e.g. Google, GoWork, Aleo, Panorama Firm, ALEO, Rejestr.io), news, insolvency or restructuring (KRZ, MSiG, court announcements), enforcement problems, KRD/BIG mentions and any red flags. For the client: does it exist, does the invoice fit its activity, is the request plausible, any signs of fraud. Search in Polish for Polish entities and in Dutch/English for foreign ones.',
    'Rules: never invent facts or numbers; when something could not be verified say so explicitly; name your sources (site or URL) inline; be concise (about 500–700 words); no tables; no preamble — output only the report.',
    'Write the entire report in ' + L + '. Use Markdown with exactly these five section headers, in this order: ' + H.join(' · ') + '.',
    'In the first section give a risk score from 1 (low risk, collectable) to 5 (very high risk / uncollectable) and one recommendation: buy the receivable / collect on behalf of the client / decline / more information needed — with one sentence of reasoning.',
  ].join('\n');
}

async function aiReport(facts, lang) {
  if (!KEY || !Anthropic) return { text: null, sources: [], model: null, note: 'no_key' };
  const client = new Anthropic({ apiKey: KEY, timeout: 240000, maxRetries: 1 });
  const base = {
    model: MODEL, max_tokens: 8000,
    system: systemPrompt(lang),
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: MAX_SEARCHES }],
  };
  const userText = 'Request (lead) data — official register data and form input as JSON:\n\n' + JSON.stringify(facts, null, 1) +
    '\n\nResearch both parties online (at most ' + MAX_SEARCHES + ' searches) and write the report as instructed.';
  let messages = [{ role: 'user', content: userText }];
  let useFallbacks = true;
  let resp = null;
  const cited = new Map(); const found = new Map(); const texts = [];
  let searches = 0;
  for (let i = 0; i < 6; i++) {
    try {
      resp = useFallbacks
        ? await client.beta.messages.create({ ...base, messages, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
        : await client.messages.create({ ...base, messages });
    } catch (e) {
      if (useFallbacks && e instanceof Anthropic.BadRequestError) { useFallbacks = false; continue; } // oudere API/proxy zonder fallbacks
      throw e;
    }
    for (const b of resp.content || []) {
      if (b.type === 'text') {
        texts.push(b.text);
        for (const c of b.citations || []) if (c.url) cited.set(c.url, { url: c.url, title: c.title || c.url });
      } else if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
        for (const r of b.content) if (r.type === 'web_search_result' && r.url) found.set(r.url, { url: r.url, title: r.title || r.url });
      }
    }
    const stu = resp.usage && resp.usage.server_tool_use;
    if (stu && stu.web_search_requests) searches += stu.web_search_requests;
    if (resp.stop_reason === 'pause_turn') { messages = [...messages, { role: 'assistant', content: resp.content }]; continue; }
    break;
  }
  if (!resp) throw new Error('geen antwoord van de API');
  if (resp.stop_reason === 'refusal') return { text: null, sources: [], model: resp.model, error: 'refusal' + (resp.stop_details && resp.stop_details.category ? ' (' + resp.stop_details.category + ')' : '') };
  const sources = [...cited.values()];
  for (const s of found.values()) if (!cited.has(s.url) && sources.length < 20) sources.push(s);
  return {
    text: texts.join('').trim() || null, // tekstblokken zijn per citaat gesplitst: aaneenplakken zonder extra regelbreuken
    sources, model: resp.model, stop: resp.stop_reason,
    usage: { input: resp.usage ? resp.usage.input_tokens : null, output: resp.usage ? resp.usage.output_tokens : null, searches },
  };
}

// ── Orchestratie ─────────────────────────────────────────────────────────
const pending = new Set();
function isPending(leadId) { return pending.has(parseInt(leadId, 10)); }

async function runForLead(lead, opts = {}) {
  if (!lead || !lead.id) return null;
  const id = parseInt(lead.id, 10);
  if (pending.has(id)) return null;
  pending.add(id);
  const lang = (opts.lang || LANG);
  try {
    const facts = await collectFacts(lead);
    let ai;
    try { ai = await aiReport(facts, lang); }
    catch (e) {
      const msg = (e && e.message) || String(e);
      const lim = /regain access on ([0-9]{4}-[0-9]{2}-[0-9]{2}(?: at [0-9:]+ UTC)?)/.exec(msg);
      const friendly = lim || /usage limits?/i.test(msg) ? 'Anthropic usage limit reached' + (lim ? ' — access resumes ' + lim[1] : '') : (e && e.status === 429 ? 'Anthropic rate limit — try again in a minute' : msg.slice(0, 300));
      ai = { text: null, sources: [], model: MODEL, error: friendly };
      console.error('Research: AI-verslag mislukt —', friendly);
    }
    const row = {
      lead_id: id, lang, model: ai.model || null,
      status: ai.text ? 'ok' : (ai.note === 'no_key' ? 'no_ai' : 'error'),
      facts, report: ai.text || null, sources: ai.sources || [], error: ai.error || null, usage: ai.usage || null,
    };
    return await db.saveLeadReport(row);
  } finally {
    pending.delete(id);
  }
}

function status() { return { ai: !!(KEY && Anthropic), auto: AUTO, model: MODEL, lang: LANG, pending: pending.size }; }

module.exports = { AUTO, LANG, MODEL, runForLead, isPending, status, collectFacts, mfLookup, krsLookup, siteInfo, domainFromEmail, parseNote };
