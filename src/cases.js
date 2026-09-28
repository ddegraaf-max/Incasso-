// sprzedamfakture.pl — echte zaken (sprawy)
//
// Eén lijst `D.claims` voor het hele panel: demo-zaken (hard-coded, alleen met DEMO_CASES) plus
// echte zaken uit de tabel `cases`. Echte zaken krijgen dezelfde vorm als de demo-zaken (id, nr,
// debtor, nip, amount, days, tel, email, phase, tag, ai) zodat views, comms en AIScore niets
// hoeven te weten van het verschil — plus `real: true`, `dbId` en klantgegevens.
//
// Toegang: admin ziet alles; een klant ziet demo-zaken en zaken waarvan hij eigenaar is
// (owner_user_id) of waarvan het klant-e-mailadres overeenkomt met zijn account.
const db = require('./db');
const D = require('./data');
const AiScore = require('./aiscore');

const PHASE_NEW = 'Nowa · analiza AI';
const DAY_MS = 86400000;

function isoDate(d) {
  const x = d instanceof Date ? d : new Date(d);
  return Number.isNaN(x.getTime()) ? null : x.toISOString().slice(0, 10);
}

function daysSince(dueDate) {
  if (!dueDate) return 0;
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today - due) / DAY_MS));
}

// DB-rij → zaakobject in de vorm van de demo-zaken
function hydrate(row) {
  const c = {
    id: 'c' + row.id,
    dbId: row.id,
    real: true,
    nr: row.nr || ('#' + row.id),
    debtor: row.debtor || '—',
    nip: row.nip || '',
    amount: Number(row.amount) || 0,
    dueDate: isoDate(row.due_date),
    email: row.debtor_email || '',
    tel: row.debtor_tel || '',
    clientCompany: row.client_company || '',
    clientEmail: (row.client_email || '').toLowerCase(),
    ownerUserId: row.owner_user_id || null,
    phase: row.phase || PHASE_NEW,
    tag: row.tag || 'tag-outline',
    source: row.source || 'admin',
    leadId: row.lead_id || null,
    note: row.note || '',
    createdAt: row.created_at || new Date(),
    sim: {},        // geen gesimuleerde signalen: echte connectors
    timeline: [],   // tijdlijn komt uit events (case_id) — zie server /app/sprawy
  };
  // dagen na termijn altijd actueel
  Object.defineProperty(c, 'days', { enumerable: true, get() { return daysSince(c.dueDate); } });
  return c;
}

function byId(id) { return D.claims.find((c) => c.id === id) || null; }

function canAccess(user, c) {
  if (!user || !c) return false;
  if (!c.real) return true;
  if (user.role === 'admin') return true;
  if (c.ownerUserId && c.ownerUserId === user.id) return true;
  return !!(c.clientEmail && user.email && c.clientEmail === String(user.email).toLowerCase());
}

function visibleFor(user) {
  return D.claims.filter((c) => canAccess(user, c));
}

// Invoer (formulier) → DB-velden; gooit een Error met i18n-sleutel bij ongeldige kern-velden
function toRow(input, existing) {
  const s = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const amount = parseFloat(s(input.amount, 20).replace(/\s/g, '').replace(',', '.'));
  let due = s(input.dueDate, 10);
  if (!due && input.days != null && input.days !== '') {
    const d = parseInt(input.days, 10);
    if (Number.isInteger(d) && d >= 0) due = isoDate(new Date(Date.now() - d * DAY_MS));
  }
  if (existing && !due) due = existing.dueDate;
  const row = {
    nr: s(input.nr, 60),
    debtor: s(input.debtor, 200),
    nip: s(input.nip, 20).replace(/\D/g, ''),
    amount,
    due_date: due || null,
    debtor_email: s(input.email, 200).toLowerCase(),
    debtor_tel: s(input.tel, 40),
    note: s(input.note, 2000),
  };
  if (!row.debtor) throw new Error('caseDebtor');
  if (!(amount > 0) || amount > 1e9) throw new Error('caseAmount');
  if (!row.due_date || !/^\d{4}-\d{2}-\d{2}$/.test(row.due_date)) throw new Error('caseDue');
  if (row.debtor_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(row.debtor_email)) throw new Error('caseEmail');
  if (row.nip && row.nip.length !== 10) throw new Error('caseNip');
  return row;
}

async function init() {
  const rows = await db.listCases().catch((e) => { console.error('Cases: laden mislukt —', e.message); return []; });
  // nieuwste eerst, vóór de demo-zaken
  for (const row of rows.slice().reverse()) D.claims.unshift(hydrate(row));
  console.log('Cases: ' + rows.length + ' echte zaak/zaken geladen');
  return rows.length;
}

// Nieuwe zaak: uit een lead (admin) of handmatig (panel). ctx: { user, lead, source }
async function create(input, ctx = {}) {
  const row = toRow(input);
  const s = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  row.client_company = s(input.clientCompany, 200);
  row.client_email = s(input.clientEmail, 200).toLowerCase();
  row.owner_user_id = ctx.ownerUserId || null;
  row.phase = PHASE_NEW;
  row.tag = 'tag-outline';
  row.source = ctx.source || 'admin';
  row.lead_id = ctx.lead ? ctx.lead.id : null;
  const saved = await db.insertCase(row);
  const c = hydrate(saved);
  D.claims.unshift(c);
  await AiScore.scoreClaim(c).catch((e) => console.error('Cases: scoring mislukt —', e.message));
  if (ctx.lead) await db.setLeadCase(ctx.lead.id, c.id).catch(() => {});
  await db.insertEvent({
    nip: c.nip, debtor: c.debtor, type: 'sprawa', case_id: c.id,
    title: 'Sprawa założona' + (ctx.lead ? ' z leada #' + ctx.lead.id : ' ręcznie') + ' — ' + c.nr + ' · ' + D.fmt(c.amount) + (c.ai ? ' · AIScore ' + c.ai.score : ''),
    source: ctx.source === 'lead' ? 'admin' : 'panel klienta',
  }).catch(() => {});
  return c;
}

async function update(c, input) {
  if (!c.real) return false;
  const row = toRow(input, c);
  const s = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  if (input.clientCompany !== undefined) row.client_company = s(input.clientCompany, 200);
  if (input.clientEmail !== undefined) row.client_email = s(input.clientEmail, 200).toLowerCase();
  await db.updateCase(c.dbId, row);
  c.nr = row.nr || c.nr; c.debtor = row.debtor; c.nip = row.nip; c.amount = row.amount; c.dueDate = row.due_date;
  c.email = row.debtor_email; c.tel = row.debtor_tel; c.note = row.note;
  if (row.client_company !== undefined) c.clientCompany = row.client_company;
  if (row.client_email !== undefined) c.clientEmail = row.client_email;
  await AiScore.scoreClaim(c).catch(() => {});
  await db.insertEvent({ nip: c.nip, debtor: c.debtor, type: 'sprawa', case_id: c.id, title: 'Dane sprawy zaktualizowane — ' + c.nr, source: 'panel klienta' }).catch(() => {});
  return true;
}

async function setPhase(c, phase, tag) {
  c.phase = phase; if (tag) c.tag = tag;
  if (c.real) await db.updateCase(c.dbId, { phase: c.phase, tag: c.tag }).catch(() => {});
}

async function remove(c) {
  if (!c.real) return false;
  await db.deleteCase(c.dbId, c.id);
  const i = D.claims.indexOf(c);
  if (i >= 0) D.claims.splice(i, 1);
  return true;
}

module.exports = { PHASE_NEW, init, create, update, setPhase, remove, byId, canAccess, visibleFor, hydrate, daysSince };
