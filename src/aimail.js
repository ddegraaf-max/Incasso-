// sprzedamfakture.pl — AI-concept voor de e-mailcomposer
//
// draft():     schrijft een mail (Pools of Engels) aan klant of dłużnik op basis van de aanvraag/zaak,
//              de registergegevens en het onderzoeksverslag, met de instructie van de verzender
//              (mag in het Nederlands) — en levert een vertaling in de paneltaal plus notities
//              (welke feiten gebruikt zijn, wat je moet nakijken).
// translate(): vertaalt de huidige tekst (na eigen bewerking) naar de paneltaal.
// Officiële Anthropic SDK, gestructureerde JSON-output (output_config.format); zonder
// ANTHROPIC_API_KEY is de functie niet beschikbaar (available() → false).
let Anthropic = null;
try { const m = require('@anthropic-ai/sdk'); Anthropic = m.default || m; } catch { Anthropic = null; }

const KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.RESEARCH_MODEL || 'claude-opus-5';
const FAKE = process.env.AIMAIL_FAKE === '1'; // alleen voor tests: vast antwoord zonder API
const client = KEY && Anthropic ? new Anthropic({ apiKey: KEY, timeout: 150000, maxRetries: 1 }) : null;

const LANG_NAME = { pl: 'Polish', en: 'English', nl: 'Dutch' };
const SCHEMA = {
  type: 'object',
  properties: { subject: { type: 'string' }, body: { type: 'string' }, translation: { type: 'string' }, notes: { type: 'string' } },
  required: ['subject', 'body', 'translation', 'notes'],
  additionalProperties: false,
};

function available() { return !!client || FAKE; }

// API-fout → herkenbare code voor de UI: limit (uitgavenlimiet van het Anthropic-account bereikt),
// rate (te veel verzoeken), auth (sleutel ongeldig); anders de oorspronkelijke fout.
function mapApiError(e) {
  const msg = (e && e.message) || String(e);
  const m = /regain access on ([0-9]{4}-[0-9]{2}-[0-9]{2}(?: at [0-9:]+ UTC)?)/.exec(msg);
  if (m || /usage limits?/i.test(msg)) { const err = new Error('limit'); err.code = 'limit'; err.until = m ? m[1] : ''; return err; }
  if (e && e.status === 429) { const err = new Error('rate'); err.code = 'rate'; return err; }
  if (e && (e.status === 401 || e.status === 403)) { const err = new Error('auth'); err.code = 'auth'; return err; }
  return e;
}

function parseJson(text) {
  try { return JSON.parse(text); } catch { /* val terug op het eerste JSON-object in de tekst */ }
  const m = /\{[\s\S]*\}/.exec(text || '');
  if (!m) throw new Error('geen JSON in het antwoord');
  return JSON.parse(m[0]);
}

async function call(system, user) {
  if (FAKE) {
    await new Promise((r) => setTimeout(r, 400));
    return { subject: 'FAKE: temat', body: 'FAKE: treść\n\n' + user.slice(0, 40), translation: 'FAKE: vertaling', notes: 'FAKE: notities', model: 'fake' };
  }
  if (!client) throw new Error('AI niet beschikbaar (geen ANTHROPIC_API_KEY)');
  const t0 = Date.now();
  const params = { model: MODEL, max_tokens: 6000, system, messages: [{ role: 'user', content: user }] };
  let resp;
  try {
    resp = await client.messages.create({ ...params, output_config: { format: { type: 'json_schema', schema: SCHEMA } } });
  } catch (e) {
    const mapped = mapApiError(e);
    if (mapped.code) throw mapped;
    if (e instanceof Anthropic.BadRequestError) {
      try { resp = await client.messages.create(params); } catch (e2) { throw mapApiError(e2); } // oudere API zonder structured outputs
    } else throw e;
  }
  if (resp.stop_reason === 'refusal') throw new Error('geweigerd door het model');
  const text = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const j = parseJson(text);
  console.log('[aimail] ok model=' + resp.model + ' in=' + (resp.usage ? resp.usage.input_tokens : '?') + ' out=' + (resp.usage ? resp.usage.output_tokens : '?') + ' ' + (Date.now() - t0) + 'ms');
  return { subject: String(j.subject || '').trim(), body: String(j.body || '').trim(), translation: String(j.translation || '').trim(), notes: String(j.notes || '').trim(), model: resp.model };
}

// ── Achtergrondtaken: de aanroep duurt 30–90 s; de composer wacht via een taak-id + auto-refresh ──
const jobs = new Map(); // id → { status: pending|done|error, state, result, error, createdAt }
const JOB_TTL_MS = 30 * 60 * 1000;
function startJob(fn, state) {
  for (const [k, j] of jobs) if (Date.now() - j.createdAt > JOB_TTL_MS) jobs.delete(k);
  const id = require('crypto').randomUUID();
  const job = { status: 'pending', state, result: null, error: null, createdAt: Date.now() };
  jobs.set(id, job);
  Promise.resolve().then(fn).then((r) => { job.status = 'done'; job.result = r; }).catch((e) => {
    const m = mapApiError(e);
    job.status = 'error'; job.errorCode = m.code || null; job.errorUntil = m.until || ''; job.error = (m.message || String(m)).slice(0, 300);
    console.error('[aimail] fout —', job.errorCode || '', job.error);
  });
  return id;
}
function getJob(id) { return id ? jobs.get(String(id)) || null : null; }
function finishJob(id) { jobs.delete(String(id)); }

function trim(s, n) { const t = String(s == null ? '' : s); return t.length > n ? t.slice(0, n) + '\n[…]' : t; }

// kind: 'lead' | 'case'; audience: 'klient' | 'dluznik'; lang: 'pl'|'en' (taal van de mail); trLang: 'nl'|'en'|null
async function draft({ kind, data, report, instruction, lang, trLang, audience, signature, to }) {
  const L = LANG_NAME[lang] || 'Polish';
  const TR = trLang && trLang !== lang ? LANG_NAME[trLang] : null;
  const system = [
    'You draft e-mails for sprzedamfakture.pl (Creditline Montage BV, a Dutch company that buys and collects overdue Polish B2B receivables and old judgments).',
    'Write the e-mail in ' + L + ': formal business register' + (lang === 'pl' ? ' (forma grzecznościowa „Państwo”)' : '') + ', concise and concrete, plain text with short paragraphs, no markdown, no placeholders, no subject line inside the body.',
    audience === 'dluznik'
      ? 'The recipient is the DEBTOR. Tone: firm but correct; refer to the invoice, amount, days overdue, statutory interest (14% p.a., Act of 8 March 2013) and the EUR 40/70/100 recovery fee only when they are in the data; state a clear deadline and next step (court, KRD listing) only if the instruction asks for it.'
      : 'The recipient is the CLIENT (the creditor who submitted the request). Tone: helpful, professional, commercial; explain clearly what we offer or need and what happens next.',
    'Use only facts from the provided data (request/case data, official register data, due-diligence report). Never invent amounts, dates, percentages or promises. If the instruction asks for something the data does not support, phrase it neutrally and flag it in notes.',
    'Do not reveal internal risk scores, internal notes or the fact that a due-diligence report exists; use its facts naturally.',
    'End the body with exactly this signature (verbatim, on its own lines):\n' + signature,
    'Return JSON with: "subject" (in ' + L + '), "body" (in ' + L + ', including the signature), "translation" (' + (TR ? 'a faithful, complete translation of subject and body into ' + TR + ', subject on the first line' : 'an empty string') + '), "notes" (2–3 sentences in ' + (TR || L) + ': which facts from the report or registers you used and what the sender should double-check before sending).',
  ].join('\n');
  const user = [
    'Recipient: ' + (audience === 'dluznik' ? 'debtor' : 'client') + (to ? ' <' + to + '>' : ''),
    'Instruction from the sender (may be written in Dutch): ' + (instruction && instruction.trim() ? instruction.trim() : '(none — write the message that fits the data best)'),
    '',
    'Data (' + kind + '):', trim(JSON.stringify(data, null, 1), 6000),
    '',
    'Official register facts (MF VAT white list / KRS / websites):', report && report.facts ? trim(JSON.stringify(report.facts, null, 1), 6000) : '(none)',
    '',
    'Due-diligence report:', report && report.report ? trim(report.report, 9000) : '(none)',
  ].join('\n');
  return call(system, user);
}

async function translate({ subject, body, from, to }) {
  const TR = LANG_NAME[to] || 'Dutch';
  const system = 'Translate the e-mail faithfully and completely into ' + TR + '. Keep names, amounts, dates, legal references and the signature unchanged. Return JSON: "subject" = the original subject unchanged, "body" = the original body unchanged, "translation" = the translated subject on the first line followed by a blank line and the translated body, "notes" = an empty string.';
  const user = 'Subject:\n' + subject + '\n\nBody:\n' + body;
  return call(system, user);
}

module.exports = { available, draft, translate, startJob, getJob, finishJob, mapApiError, MODEL };
