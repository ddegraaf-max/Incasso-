// sprzedamfakture.pl — postvak van het paneel: leesstatus, afleverstatus en antwoorden op e-mails
//
// Elke e-mail uit het paneel (lead- en zaakmails) krijgt een sleutel (comm_log.reply_key):
//   - leesstatus: een onzichtbaar plaatje /t/<sleutel>.gif in de HTML-versie; het laden ervan telt als
//     "geopend". Dat is een indicatie, geen bewijs: mailclients die plaatjes blokkeren tellen niet mee,
//     en sommige (Apple Mail, beveiligingsscanners) laden plaatjes zonder dat iemand de mail leest.
//   - afleverstatus: Resend (GET /emails/<id>), opgevraagd wanneer het paneel de berichten toont, en
//     via de webhook als die op de afleverevents is geabonneerd.
//   - antwoorden: met INBOUND_DOMAIN gaat de reply-to naar odp-<sleutel>@<INBOUND_DOMAIN>. Resend ontvangt
//     de mail (MX-record van het domein) en meldt hem via de webhook POST /api/resend/webhook
//     (event email.received). Het antwoord komt in comm_log (direction 'in') bij dezelfde lead of zaak,
//     bijlagen gaan naar de bestanden van de lead, en MAIL_NOTIFY krijgt een kopie.
// Veiligheid: het antwoordadres wordt alleen gebruikt als het domein aantoonbaar mail ontvangt bij Resend
// (MX-record, elk kwartier gecontroleerd) — anders zouden antwoorden onbestelbaar terugkomen. Een mail zonder
// sleutel met een afzender die niet door SPF/DKIM/DMARC komt, wordt niet bij een lead of zaak gelegd.
// Env: INBOUND_DOMAIN (leeg = antwoorden gaan zoals voorheen rechtstreeks naar MAIL_NOTIFY),
//      RESEND_WEBHOOK_SECRET (whsec_…, ondertekening van de webhook),
//      INBOUND_MX_CHECK=0 (alleen voor tests: MX-controle overslaan).
const crypto = require('crypto');
const dns = require('dns').promises;
const db = require('./db');
const Mailer = require('./mailer');

const INBOUND_DOMAIN = String(process.env.INBOUND_DOMAIN || '').trim().toLowerCase().replace(/^@/, '');
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';
const REPLY_PREFIX = 'odp-';
const INBOX = 'INBOX'; // case_id van binnengekomen mail die bij geen lead of zaak hoort
const MAX_FILE = 8 * 1024 * 1024; // zelfde grens als de formulieren
// Beveiligingsscanners van mailservers halen plaatjes op bij aflevering — geen teken dat iemand las
const SCANNER_RE = /barracuda|proofpoint|mimecast|symantec|forcepoint|trendmicro|sophos|fireeye|bot|crawl|spider|curl|wget|python|headless/i;
const OPEN_MIN_AGE_MS = 5000;
const UNVERIFIED = 'nadawca niezweryfikowany (SPF/DKIM) — adres mógł zostać podrobiony';

const MX_CHECK = process.env.INBOUND_MX_CHECK !== '0';
let mxOk = !MX_CHECK, mxInfo = MX_CHECK ? 'nog niet gecontroleerd' : 'controle uit';
// Ontvangt het domein mail bij Resend? (Resend ontvangt via Amazon SES: inbound-smtp.<regio>.amazonaws.com)
async function lookupMx(domain) {
  try { return (await dns.resolveMx(domain)).map((m) => ({ priority: m.priority, exchange: String(m.exchange).toLowerCase() })); }
  catch (e) {
    if (e.code === 'ENODATA' || e.code === 'ENOTFOUND') return [];
    // eigen resolver onbereikbaar → DNS-over-HTTPS (Cloudflare) als tweede route
    const r = await fetch('https://cloudflare-dns.com/dns-query?type=MX&name=' + encodeURIComponent(domain), { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error('DNS ' + r.status);
    const j = await r.json();
    return (j.Answer || []).filter((a) => a.type === 15).map((a) => { const p = String(a.data).trim().split(/\s+/); return { priority: parseInt(p[0], 10), exchange: String(p[1] || '').replace(/\.$/, '').toLowerCase() }; });
  }
}
async function checkMx() {
  if (!INBOUND_DOMAIN || !MX_CHECK) return mxOk;
  try {
    const mx = await lookupMx(INBOUND_DOMAIN);
    mxOk = mx.some((m) => /inbound-smtp\.[a-z0-9-]+\.amazonaws\.com$|resend/i.test(m.exchange));
    mxInfo = mx.map((m) => m.priority + ' ' + m.exchange).join(', ') || 'geen MX-record';
  } catch (e) {
    // DNS even onbereikbaar: de laatste stand blijft gelden (bij de start is dat "uit")
    if (mxInfo === 'nog niet gecontroleerd') mxInfo = 'controle mislukt (' + (e.code || e.message) + ')';
  }
  return mxOk;
}

function enabled() { return !!(INBOUND_DOMAIN && WEBHOOK_SECRET && Mailer.configured() && mxOk); }
function status() { return { inbound: enabled(), domain: INBOUND_DOMAIN || null, webhookSecret: !!WEBHOOK_SECRET, mail: Mailer.configured(), mx: mxOk, mxInfo: INBOUND_DOMAIN ? mxInfo : null }; }

function newKey() { return crypto.randomBytes(10).toString('hex'); }
function replyAddress(key) { return enabled() && key ? REPLY_PREFIX + key + '@' + INBOUND_DOMAIN : null; }
// Wat in de reply-to van een nieuwe mail komt: het ontvangstadres, anders de mailbox van de beheerder
function replyTo(key) { const a = replyAddress(key); return a ? 'sprzedamfakture.pl <' + a + '>' : (Mailer.MAIL_NOTIFY || undefined); }
function replyToLabel() { return enabled() ? REPLY_PREFIX + '…@' + INBOUND_DOMAIN : (Mailer.MAIL_NOTIFY || ''); }
function pixelUrl(key) { return Mailer.SITE + '/t/' + key + '.gif'; }
function keyFromAddress(addr) { const m = /(?:^|[<\s,;])odp-([a-f0-9]{20})@/i.exec(' ' + String(addr || '')); return m ? m[1].toLowerCase() : null; }
function addressOf(s) { const m = /<([^>]+)>/.exec(String(s || '')); return (m ? m[1] : String(s || '')).trim().toLowerCase(); }

// ── Versturen met sleutel ────────────────────────────────────────────────
// branded: huisstijl-layout (mails aan klanten); anders een sobere HTML-versie (mails aan dłużnicy).
// Geeft het resultaat van Mailer.send terug, aangevuld met de velden voor comm_log.
async function send({ from, to, subject, text, lang, branded }) {
  const key = newKey();
  const pixel = pixelUrl(key);
  const r = branded
    ? await Mailer.sendPlain({ from, to, subject, text, lang, replyTo: replyTo(key), pixel })
    : await Mailer.send({ from, to, subject, text, html: Mailer.plainHtml(text, pixel), replyTo: replyTo(key) });
  return { ...r, log: { reply_key: key, provider_id: r.id || null, delivery: r.ok && !r.simulated ? 'sent' : null } };
}

// ── Leesstatus ───────────────────────────────────────────────────────────
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
async function recordOpen(key, meta = {}) {
  const c = await db.getCommByKey(String(key || '').toLowerCase()).catch(() => null);
  if (!c || c.direction === 'in') return false;
  if (SCANNER_RE.test(meta.ua || '') || Date.now() - new Date(c.created_at).getTime() < OPEN_MIN_AGE_MS) return false;
  await db.markCommOpened(c.id).catch(() => {});
  return true;
}

// ── Afleverstatus ────────────────────────────────────────────────────────
const RANK = { sent: 1, delivery_delayed: 2, delivered: 3, opened: 4, clicked: 5 };
const FAILED = ['bounced', 'complained', 'failed'];
async function applyDelivery(c, event) {
  const ev = String(event || '');
  if (!ev || !(RANK[ev] || FAILED.includes(ev))) return false;
  const cur = c.delivery || '';
  // een latere, lagere status (events komen niet altijd op volgorde) overschrijft een hogere niet
  const keep = !FAILED.includes(ev) && (FAILED.includes(cur) || (RANK[cur] || 0) >= RANK[ev]);
  const fields = { delivery_at: new Date() };
  if (!keep) fields.delivery = ev;
  if ((ev === 'opened' || ev === 'clicked') && !c.opened_at) { fields.opened_at = new Date(); fields.open_count = Math.max(1, c.open_count || 0); }
  Object.assign(c, fields);
  return db.updateComm(c.id, fields).catch(() => false);
}
// Status bij Resend opvragen voor de berichten die het paneel gaat tonen: alleen verstuurde mails die
// nog kunnen veranderen en niet net zijn gecontroleerd. Fouten worden genegeerd (het paneel toont dan de oude stand).
async function refresh(comms) {
  const now = Date.now();
  const due = (comms || []).filter((c) => c.channel === 'email' && c.direction !== 'in' && c.provider_id
    && !FAILED.includes(c.delivery || '') && now - new Date(c.created_at).getTime() < 14 * 86400000
    && (!c.delivery_at || now - new Date(c.delivery_at).getTime() > (c.delivery === 'delivered' || c.delivery === 'opened' ? 30 : 2) * 60000)).slice(0, 8);
  await Promise.all(due.map(async (c) => { const ev = await Mailer.fetchStatus(c.provider_id).catch(() => null); if (ev) await applyDelivery(c, ev); }));
  return comms;
}

// Stand van één bericht voor de schermen: reply | new | opened | delivered | delayed | failed | sent | simulated | error | other
function stateOf(c) {
  if (c.direction === 'in') return c.read_at ? 'reply' : 'new';
  if (c.channel !== 'email') return 'other';
  if (FAILED.includes(c.delivery || '')) return 'failed';
  if (c.opened_at || c.delivery === 'opened' || c.delivery === 'clicked') return 'opened';
  if (c.delivery === 'delivered') return 'delivered';
  if (c.delivery === 'delivery_delayed') return 'delayed';
  if (c.status === 'symulacja') return 'simulated';
  if (c.status === 'wysłano') return 'sent';
  return 'error';
}

// ── Webhook van Resend (Svix-ondertekening) ──────────────────────────────
function verifyWebhook(headers, raw) {
  if (!WEBHOOK_SECRET) return false;
  const id = headers['svix-id'], ts = headers['svix-timestamp'], sig = headers['svix-signature'];
  if (!id || !ts || !sig || !Buffer.isBuffer(raw)) return false;
  if (!(Math.abs(Date.now() / 1000 - Number(ts)) <= 300)) return false;
  const secret = Buffer.from(WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', secret).update(Buffer.concat([Buffer.from(id + '.' + ts + '.'), raw])).digest();
  return String(sig).split(' ').some((part) => {
    const i = part.indexOf(',');
    if (i < 0 || part.slice(0, i) !== 'v1') return false;
    const got = Buffer.from(part.slice(i + 1), 'base64');
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  });
}

async function handleEvent(ev) {
  const type = String((ev && ev.type) || ''), d = (ev && ev.data) || {};
  if (type === 'email.received') return receive(d);
  const m = /^email\.(sent|delivered|delivery_delayed|bounced|complained|opened|clicked|failed)$/.exec(type);
  if (!m || !d.email_id) return { ignored: type || 'onbekend' };
  const c = await db.getCommByProvider(d.email_id);
  if (!c) return { ignored: 'mail van een ander project' }; // het Resend-account wordt door meer sites gebruikt
  await applyDelivery(c, m[1]);
  return { ok: true, comm: c.id, delivery: m[1] };
}

function htmlToText(html) {
  return String(html || '').replace(/<(style|script)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Binnengekomen mail: bij de juiste draad leggen, bijlagen bewaren, kopie naar de beheerder
async function receive(d) {
  if (!d.email_id) return { ignored: 'geen email_id' };
  if (await db.getCommByProvider(d.email_id)) return { duplicate: true }; // Resend herhaalt de melding als wij te laat antwoorden
  const full = await Mailer.fetchReceived(d.email_id);
  if (!full) throw new Error('inhoud van de ontvangen mail niet op te halen');
  const rcpts = [].concat(full.to || d.to || [], full.received_for || d.received_for || [], full.cc || d.cc || []).map(addressOf).filter(Boolean);
  if (INBOUND_DOMAIN && !rcpts.some((a) => a.endsWith('@' + INBOUND_DOMAIN))) return { ignored: 'mail voor een ander domein' };

  const fromRaw = (full.headers && (full.headers.from || full.headers.From)) || full.from || d.from || '';
  const from = addressOf(full.from || d.from || fromRaw);
  // afzender gecontroleerd? alleen "nee" als Resend de uitslag meegeeft en niets slaagt
  const auth = full.authentication || null;
  const verified = !auth || ['spf', 'dkim', 'dmarc'].some((k) => String(auth[k] || '').toLowerCase() === 'pass');
  const key = rcpts.map(keyFromAddress).find(Boolean);
  let parent = key ? await db.getCommByKey(key).catch(() => null) : null;
  // zonder sleutel leggen we de mail alleen bij een draad als de afzender echt is (een From-adres is te vervalsen)
  if (!parent && from && verified) parent = await db.lastCommTo(from).catch(() => null);
  const caseId = parent ? parent.case_id : INBOX;
  const subject = String(full.subject || d.subject || '').slice(0, 300);
  const body = String(full.text || htmlToText(full.html) || '').slice(0, 60000);

  // bijlagen: bij een lead (of een zaak die uit een lead komt) bewaren we ze bij de bestanden van de lead
  const leadId = await leadIdFor(caseId);
  const list = await Mailer.fetchReceivedAttachments(d.email_id).catch(() => []);
  const attachments = [], forward = [];
  for (const a of list) {
    if (a.content_disposition === 'inline' && /^image\//.test(a.content_type || '')) continue; // logo's en handtekeningen
    const item = { filename: String(a.filename || 'zalacznik').slice(0, 200), size: a.size || 0, content_type: a.content_type || '' };
    if (a.download_url && (a.size || 0) <= MAX_FILE) {
      const buf = await fetch(a.download_url, { signal: AbortSignal.timeout(20000) }).then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => (b ? Buffer.from(b) : null)).catch(() => null);
      if (buf) {
        if (leadId) { const saved = await db.saveLeadFile(leadId, { originalname: item.filename, mimetype: item.content_type || 'application/octet-stream', size: buf.length, buffer: buf }).catch(() => null); if (saved) item.file_id = saved.id; }
        if (forward.reduce((n, f) => n + f.size, 0) + buf.length <= 15 * 1024 * 1024) forward.push({ filename: item.filename, content: buf.toString('base64'), size: buf.length });
      }
    }
    attachments.push(item);
  }

  const row = await db.logComm({ case_id: caseId, channel: 'email', direction: 'in', subject, body, status: 'odebrano', outcome: verified ? null : UNVERIFIED, sender: String(fromRaw || from).slice(0, 300), recipient: rcpts[0] || null,
    provider_id: d.email_id, in_reply_to: parent ? parent.id : null, attachments: attachments.length ? attachments : null });
  await db.insertEvent({ nip: null, debtor: null, type: 'email', case_id: /^L\d+$|^INBOX$/.test(caseId) ? null : caseId,
    title: `Odpowiedź e-mail od ${from || '—'}: ${subject || '—'}`, source: 'poczta przychodząca' }).catch(() => {});
  await notify(row, { from, fromRaw, subject, body, caseId, attachments, forward, verified }).catch((e) => console.error('[postvak] kopie naar MAIL_NOTIFY mislukt —', e.message));
  return { ok: true, comm: row.id, thread: caseId };
}

async function leadIdFor(caseId) {
  const m = /^L(\d+)$/.exec(caseId || '');
  if (m) return parseInt(m[1], 10);
  const c = /^c(\d+)$/.exec(caseId || '');
  if (!c) return null;
  const rows = await db.listCases().catch(() => []);
  const hit = rows.find((x) => String(x.id) === c[1]);
  return hit && hit.lead_id ? hit.lead_id : null;
}

// Waar het bericht in het paneel staat (voor links in de kopie en op de schermen)
function panelPath(c) {
  const id = c.case_id || '';
  if (/^L\d+$/.test(id)) return '/admin/leady/' + id.slice(1) + '/mail/' + c.id;
  if (id === INBOX) return '/admin/poczta/' + c.id;
  return '/app/sprawy/' + encodeURIComponent(id) + '/mail/' + c.id;
}

// Kopie van een antwoord naar de mailbox van de beheerder — antwoorden doe je in het paneel, dan blijft de draad compleet
async function notify(row, m) {
  if (!Mailer.MAIL_NOTIFY) return null;
  const where = /^L\d+$/.test(m.caseId) ? 'lead #' + m.caseId.slice(1) : (m.caseId === INBOX ? 'bez przypisania' : 'sprawa ' + m.caseId);
  const names = m.attachments.map((a) => a.filename).join(', ');
  const text = `Nowa odpowiedź w panelu (${where}).\n\n${m.verified ? '' : 'UWAGA: ' + UNVERIFIED + '.\n'}Od: ${m.fromRaw || m.from}\nTemat: ${m.subject || '—'}${names ? '\nZałączniki: ' + names : ''}\n\n${m.body || '(brak treści)'}\n\n—\nOtwórz i odpowiedz w panelu: ${Mailer.SITE}${panelPath(row)}`;
  return Mailer.send({ to: Mailer.MAIL_NOTIFY, subject: `[Odpowiedź · ${where}] ${m.subject || ''}`.slice(0, 200), text, replyTo: m.from || undefined,
    attachments: m.forward.map((f) => ({ filename: f.filename, content: f.content })) });
}

// Antwoord vanuit het paneel op een binnengekomen bericht: onderwerp en geciteerde tekst
function replyDraft(m) {
  const subject = /^\s*(re|odp)\s*:/i.test(m.subject || '') ? m.subject : 'Re: ' + (m.subject || '');
  const when = new Date(m.created_at).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'medium', timeStyle: 'short' });
  const quoted = String(m.body || '').split('\n').slice(0, 60).map((l) => '> ' + l).join('\n');
  return { to: addressOf(m.sender), subject: String(subject).slice(0, 200), body: `\n\n${when}, ${m.sender || ''}:\n${quoted}` };
}

module.exports = { enabled, status, checkMx, send, replyToLabel, replyAddress, keyFromAddress, recordOpen, refresh, applyDelivery, stateOf, verifyWebhook, handleEvent, receive, panelPath, replyDraft, PIXEL, INBOX, INBOUND_DOMAIN };
