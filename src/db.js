// sprzedamfakture.pl — databaselaag
// Met DATABASE_URL (Railway PostgreSQL): volledige persistentie.
// Zonder: in-memory fallback zodat lokaal/demo alles blijft werken.
const { Pool } = require('pg');

let pool = null;

// In-memory fallback stores
const mem = {
  users: [],
  actions: {},   // caseId → action
  events: [],    // nieuwste eerst
  scores: {},    // nip → { score, grade, pct, reco, signals, checkedAt }
  comms: [],     // communicatielog
  leads: [],     // sprzedamfakture-leads
};

async function init() {
  if (!process.env.DATABASE_URL) {
    console.log('DB: geen DATABASE_URL — in-memory modus (concept)');
    return false;
  }
  // SSL: Railway-Postgres (intern *.railway.internal of publiek *.rlwy.net) accepteert TLS met een
  // self-signed cert. PGSSLMODE=disable forceert uit; PGSSL=1 forceert aan. Bij 'server does not
  // support SSL' proberen we automatisch zonder SSL.
  const url = process.env.DATABASE_URL;
  const wantSsl = process.env.PGSSLMODE === 'disable' ? false
    : (process.env.PGSSL === '1' || /railway|rlwy\.net|sslmode=require/i.test(url));
  let useSsl = wantSsl;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      pool = new Pool({ connectionString: url, ssl: useSsl ? { rejectUnauthorized: false } : false, connectionTimeoutMillis: 8000 });
      await pool.query('SELECT 1');
      console.log(`DB: verbonden (${useSsl ? 'SSL' : 'zonder SSL'})`);
      break;
    } catch (e) {
      console.error(`DB: poging ${attempt}/4 mislukt — ${e.message}`);
      try { await pool.end(); } catch {}
      pool = null;
      if (/SSL/i.test(e.message)) useSsl = !useSsl; // wissel SSL aan/uit en probeer opnieuw
      if (attempt < 4) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  if (!pool) {
    console.error('DB: onbereikbaar — fallback naar in-memory modus');
    return false;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      pass_hash TEXT NOT NULL,
      company TEXT DEFAULT '',
      nip TEXT DEFAULT '',
      role TEXT DEFAULT 'client',
      totp_secret TEXT,
      totp_confirmed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS case_actions (
      case_id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      nip TEXT,
      debtor TEXT,
      type TEXT,
      title TEXT,
      source TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      source TEXT DEFAULT 'sprzedamfakture',
      company TEXT,
      nip TEXT,
      email TEXT,
      tel TEXT,
      kwota NUMERIC,
      dni INT,
      oferta_pct INT,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS comm_log (
      id SERIAL PRIMARY KEY,
      case_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      tone TEXT,
      subject TEXT,
      body TEXT,
      status TEXT,
      outcome TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS debtor_scores (
      nip TEXT PRIMARY KEY,
      score INT,
      grade TEXT,
      pct INT,
      reco TEXT,
      signals JSONB,
      checked_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // idempotente migraties voor bestaande databases
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS forma TEXT');
  await pool.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'nowy'");
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS admin_note TEXT');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ');
  console.log('DB: PostgreSQL verbonden, schema klaar');
  return true;
}

function hasDb() { return !!pool; }
function getPool() { return pool; }

// Ping + tellingen voor /health en het admin-panel
async function stats() {
  if (!pool) return { connected: false };
  const t0 = Date.now();
  try {
    const r = await pool.query(
      "SELECT (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM leads) AS leads, (SELECT count(*)::int FROM events) AS events, (SELECT count(*)::int FROM comm_log) AS comms"
    );
    return { connected: true, pingMs: Date.now() - t0, ...r.rows[0] };
  } catch (e) {
    return { connected: false, error: e.message };
  }
}

// ── Users ────────────────────────────────────────────────────────────────
async function loadUsers() {
  if (!pool) return mem.users;
  const r = await pool.query('SELECT * FROM users ORDER BY id');
  return r.rows.map((x) => ({
    id: x.id, email: x.email, passHash: x.pass_hash, company: x.company,
    nip: x.nip, role: x.role, totpSecret: x.totp_secret,
    totpConfirmed: x.totp_confirmed, createdAt: x.created_at,
  }));
}

async function saveUser(u) {
  if (!pool) { mem.users.push(u); return u; }
  const r = await pool.query(
    `INSERT INTO users (email, pass_hash, company, nip, role, totp_secret, totp_confirmed)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (email) DO UPDATE SET pass_hash=$2, company=$3, nip=$4, role=$5
     RETURNING id`,
    [u.email, u.passHash, u.company, u.nip, u.role, u.totpSecret, u.totpConfirmed]
  );
  u.id = r.rows[0].id;
  return u;
}

async function updateUserPassword(u) {
  if (!pool) return;
  await pool.query('UPDATE users SET pass_hash=$1 WHERE email=$2', [u.passHash, u.email]);
}

async function deleteUser(email) {
  const key = String(email || '').toLowerCase().trim();
  if (!pool) { mem.users = mem.users.filter((u) => u.email !== key); return; }
  await pool.query('DELETE FROM users WHERE email=$1', [key]);
}

async function updateUserTotp(u) {
  if (!pool) return;
  await pool.query('UPDATE users SET totp_secret=$1, totp_confirmed=$2 WHERE email=$3',
    [u.totpSecret, u.totpConfirmed, u.email]);
}

// ── Case actions ─────────────────────────────────────────────────────────
async function loadActions() {
  if (!pool) return { ...mem.actions };
  const r = await pool.query('SELECT case_id, action FROM case_actions');
  const out = {};
  r.rows.forEach((x) => { out[x.case_id] = x.action; });
  return out;
}

async function saveAction(caseId, action) {
  if (!pool) { mem.actions[caseId] = action; return; }
  await pool.query(
    `INSERT INTO case_actions (case_id, action) VALUES ($1,$2)
     ON CONFLICT (case_id) DO UPDATE SET action=$2, created_at=now()`,
    [caseId, action]
  );
}

// ── Events (monitoring) ──────────────────────────────────────────────────
async function insertEvent(e) {
  const ev = { ...e, created_at: new Date() };
  if (!pool) { mem.events.unshift(ev); mem.events = mem.events.slice(0, 200); return ev; }
  // demo-/monitor-events komen bij elke herstart terug: oude identieke titel eerst weg
  if (e.dedupe) await pool.query('DELETE FROM events WHERE title=$1', [e.title]).catch(() => {});
  await pool.query(
    'INSERT INTO events (nip, debtor, type, title, source) VALUES ($1,$2,$3,$4,$5)',
    [e.nip, e.debtor, e.type, e.title, e.source]
  );
  return ev;
}

async function listEvents(limit = 20) {
  if (!pool) return mem.events.slice(0, limit);
  const r = await pool.query('SELECT * FROM events ORDER BY created_at DESC LIMIT $1', [limit]);
  return r.rows;
}

// ── Leads (sprzedamfakture.pl) ───────────────────────────────────────────
// status: nowy | kontakt | oferta | zaakceptowany | odrzucony | spam (beheer in /admin/leady)
let memLeadId = 1;
async function saveLead(l) {
  const row = { ...l, status: 'nowy', admin_note: null, created_at: new Date() };
  if (!pool) { row.id = memLeadId++; mem.leads.unshift(row); return row; }
  await pool.query(
    'INSERT INTO leads (source, company, nip, email, tel, kwota, dni, oferta_pct, note, forma) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [l.source || 'sprzedamfakture', l.company, l.nip, l.email, l.tel, l.kwota, l.dni, l.oferta_pct, l.note || null, l.forma || null]
  );
  return row;
}

async function listLeads(limit = 30) {
  if (!pool) return mem.leads.slice(0, limit);
  const r = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT $1', [limit]);
  return r.rows;
}

async function getLead(id) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return null;
  if (!pool) return mem.leads.find((l) => l.id === n) || null;
  const r = await pool.query('SELECT * FROM leads WHERE id=$1', [n]);
  return r.rows[0] || null;
}

async function updateLead(id, { status, admin_note }) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return false;
  if (!pool) {
    const l = mem.leads.find((x) => x.id === n);
    if (!l) return false;
    l.status = status; l.admin_note = admin_note; l.updated_at = new Date();
    return true;
  }
  const r = await pool.query('UPDATE leads SET status=$2, admin_note=$3, updated_at=now() WHERE id=$1', [n, status, admin_note]);
  return r.rowCount > 0;
}

async function deleteLead(id) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return false;
  if (!pool) {
    const before = mem.leads.length;
    mem.leads = mem.leads.filter((x) => x.id !== n);
    return mem.leads.length < before;
  }
  const r = await pool.query('DELETE FROM leads WHERE id=$1', [n]);
  return r.rowCount > 0;
}

// ── Demo-sporen opruimen ─────────────────────────────────────────────────
// Verwijdert wat de demo-zaken (fictieve dłużnicy) in de DB hebben achtergelaten: monitor-,
// KRZ- en MSiG-events, events op demo-NIP's, communicatielog, AIScores en zaakacties.
// Leads en lead-events blijven staan.
const DEMO_EVENT_SOURCES = ['monitor', 'krz.ms.gov.pl', 'MSiG', 'panel klienta', 'agent AI + Resend', 'szablon + Resend', 'SMSAPI.pl', 'rozmowa własna'];
async function purgeDemo({ caseIds = [], nips = [] }) {
  if (!pool) {
    const ev0 = mem.events.length;
    mem.events = mem.events.filter((e) => e.type === 'lead' || !(DEMO_EVENT_SOURCES.includes(e.source) || nips.includes(e.nip)));
    const cm0 = mem.comms.length;
    mem.comms = mem.comms.filter((c) => !caseIds.includes(c.case_id));
    let scores = 0; for (const n of nips) if (mem.scores[n]) { delete mem.scores[n]; scores++; }
    let actions = 0; for (const id of caseIds) if (mem.actions[id]) { delete mem.actions[id]; actions++; }
    return { events: ev0 - mem.events.length, comms: cm0 - mem.comms.length, scores, actions };
  }
  const ev = await pool.query(
    "DELETE FROM events WHERE type IS DISTINCT FROM 'lead' AND (source = ANY($1) OR nip = ANY($2))",
    [DEMO_EVENT_SOURCES, nips]
  );
  const cm = await pool.query('DELETE FROM comm_log WHERE case_id = ANY($1)', [caseIds]);
  const sc = await pool.query('DELETE FROM debtor_scores WHERE nip = ANY($1)', [nips]);
  const ac = await pool.query('DELETE FROM case_actions WHERE case_id = ANY($1)', [caseIds]);
  return { events: ev.rowCount, comms: cm.rowCount, scores: sc.rowCount, actions: ac.rowCount };
}

// ── Communicatielog ──────────────────────────────────────────────────────
async function logComm(e) {
  const row = { ...e, created_at: new Date() };
  if (!pool) { mem.comms.unshift(row); mem.comms = mem.comms.slice(0, 500); return row; }
  await pool.query(
    'INSERT INTO comm_log (case_id, channel, tone, subject, body, status, outcome) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [e.case_id, e.channel, e.tone || null, e.subject || null, e.body || null, e.status || null, e.outcome || null]
  );
  return row;
}

async function listComms(caseId, limit = 10) {
  if (!pool) return mem.comms.filter((x) => x.case_id === caseId).slice(0, limit);
  const r = await pool.query('SELECT * FROM comm_log WHERE case_id=$1 ORDER BY created_at DESC LIMIT $2', [caseId, limit]);
  return r.rows;
}

async function countComms() {
  if (!pool) return mem.comms.length;
  const r = await pool.query('SELECT count(*)::int AS n FROM comm_log');
  return r.rows[0].n;
}

// ── AIScores ─────────────────────────────────────────────────────────────
async function saveScore(nip, s) {
  if (!pool) { mem.scores[nip] = { ...s, checkedAt: new Date() }; return; }
  await pool.query(
    `INSERT INTO debtor_scores (nip, score, grade, pct, reco, signals, checked_at)
     VALUES ($1,$2,$3,$4,$5,$6,now())
     ON CONFLICT (nip) DO UPDATE SET score=$2, grade=$3, pct=$4, reco=$5, signals=$6, checked_at=now()`,
    [nip, s.score, s.grade, s.pct, s.reco, JSON.stringify(s.signals || [])]
  );
}

async function loadScores() {
  if (!pool) return { ...mem.scores };
  const r = await pool.query('SELECT * FROM debtor_scores');
  const out = {};
  r.rows.forEach((x) => {
    out[x.nip] = { score: x.score, grade: x.grade, pct: x.pct, reco: x.reco, signals: x.signals, checkedAt: x.checked_at };
  });
  return out;
}

module.exports = {
  init, hasDb, getPool, stats,
  loadUsers, saveUser, updateUserTotp, updateUserPassword, deleteUser,
  loadActions, saveAction,
  insertEvent, listEvents,
  saveScore, loadScores,
  logComm, listComms, countComms,
  saveLead, listLeads, getLead, updateLead, deleteLead,
  purgeDemo,
};
