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
  files: [],     // bijlagen bij leads (buffer in geheugen)
  reports: [],   // onderzoeksverslagen per lead (nieuwste eerst)
  demands: [],   // wezwania online (bezpłatne sommaties)
  demandLog: [], // bewijslog van wezwania (weergaven + reacties, oudste eerst)
  cases: [],     // echte zaken (nieuwste eerst)
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_files (
      id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      filename TEXT,
      mimetype TEXT,
      size INT,
      data BYTEA,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS demands (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      lang TEXT,
      creditor_company TEXT, creditor_nip TEXT, creditor_email TEXT,
      debtor_company TEXT, debtor_nip TEXT, debtor_email TEXT,
      invoice_nr TEXT, amount NUMERIC, due_date DATE, iban TEXT,
      status TEXT DEFAULT 'wyslane',
      response_note TEXT, promised_date DATE,
      opened_at TIMESTAMPTZ, responded_at TIMESTAMPTZ,
      facts JSONB, lead_id INT, file_id INT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query('ALTER TABLE demands ADD COLUMN IF NOT EXISTS file_id INT');
  await pool.query('ALTER TABLE demands ADD COLUMN IF NOT EXISTS paid_date DATE');
  await pool.query('ALTER TABLE demands ADD COLUMN IF NOT EXISTS creditor_key TEXT');
  await pool.query('ALTER TABLE demands ADD COLUMN IF NOT EXISTS creator_ip TEXT');
  // E-mailverificatie van de wierzyciel: een wezwanie is pas actief na bevestiging (confirmed_at).
  // Eenmalig bij het toevoegen van de kolom: wat er al stond is al verstuurd en geldt als bevestigd.
  const hasConfirmed = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'demands' AND column_name = 'confirmed_at'");
  if (!hasConfirmed.rowCount) {
    await pool.query('ALTER TABLE demands ADD COLUMN confirmed_at TIMESTAMPTZ');
    await pool.query('UPDATE demands SET confirmed_at = created_at');
  }
  await pool.query('ALTER TABLE demands ADD COLUMN IF NOT EXISTS confirm_ip TEXT');
  // Bewijslog per wezwanie: elke weergave en elke reactie, met IP en user-agent (nooit overschreven)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS demand_log (
      id SERIAL PRIMARY KEY,
      demand_id INT NOT NULL,
      type TEXT,
      actor TEXT,
      ip TEXT,
      user_agent TEXT,
      data JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS demand_log_demand_idx ON demand_log (demand_id, id)');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_reports (
      id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      lang TEXT,
      model TEXT,
      status TEXT,
      facts JSONB,
      report TEXT,
      sources JSONB,
      error TEXT,
      usage JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cases (
      id SERIAL PRIMARY KEY,
      nr TEXT,
      debtor TEXT,
      nip TEXT,
      amount NUMERIC,
      due_date DATE,
      debtor_email TEXT,
      debtor_tel TEXT,
      client_company TEXT,
      client_email TEXT,
      owner_user_id INT,
      phase TEXT,
      tag TEXT,
      source TEXT DEFAULT 'admin',
      lead_id INT,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ
    );
  `);
  // idempotente migraties voor bestaande databases
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS forma TEXT');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS case_id TEXT');
  await pool.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS case_id TEXT');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS recipient TEXT');
  // Postvak van het paneel (src/mailbox.js): richting, afleverstatus, leesstatus en antwoorden
  await pool.query("ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'out'");
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS sender TEXT');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS provider_id TEXT');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS reply_key TEXT');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS in_reply_to INT');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS delivery TEXT');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS delivery_at TIMESTAMPTZ');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS open_count INT DEFAULT 0');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ');
  await pool.query('ALTER TABLE comm_log ADD COLUMN IF NOT EXISTS attachments JSONB');
  await pool.query('CREATE INDEX IF NOT EXISTS comm_log_reply_key_idx ON comm_log (reply_key)');
  await pool.query('CREATE INDEX IF NOT EXISTS comm_log_provider_idx ON comm_log (provider_id)');
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
      "SELECT (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM leads) AS leads, (SELECT count(*)::int FROM events) AS events, (SELECT count(*)::int FROM comm_log) AS comms, (SELECT count(*)::int FROM cases) AS cases"
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
    'INSERT INTO events (nip, debtor, type, title, source, case_id) VALUES ($1,$2,$3,$4,$5,$6)',
    [e.nip, e.debtor, e.type, e.title, e.source, e.case_id || null]
  );
  return ev;
}

// Tijdlijn van één zaak (echte zaken): events met case_id, oudste eerst
async function listCaseEvents(caseId, limit = 40) {
  if (!pool) return mem.events.filter((e) => e.case_id === caseId).slice(0, limit).reverse();
  const r = await pool.query('SELECT * FROM events WHERE case_id=$1 ORDER BY created_at ASC LIMIT $2', [caseId, limit]);
  return r.rows;
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
  const r = await pool.query(
    'INSERT INTO leads (source, company, nip, email, tel, kwota, dni, oferta_pct, note, forma) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
    [l.source || 'sprzedamfakture', l.company, l.nip, l.email, l.tel, l.kwota, l.dni, l.oferta_pct, l.note || null, l.forma || null]
  );
  row.id = r.rows[0].id;
  return row;
}

// ── Bijlagen bij leads (factuur/vonnis uit het formulier) ────────────────
// Naast de kopie in de notificatiemail bewaren we het bestand in de DB (max 8 MB, zie multer),
// zodat het in /admin/leady en in de zaak (via lead_id) te openen is.
let memFileId = 1;
async function saveLeadFile(leadId, file) {
  const n = parseInt(leadId, 10);
  const row = { lead_id: n, filename: file.originalname || 'zalacznik', mimetype: file.mimetype || 'application/octet-stream', size: file.size || (file.buffer ? file.buffer.length : 0), created_at: new Date() };
  if (!pool) { row.id = memFileId++; row.data = file.buffer; mem.files.push(row); return row; }
  const r = await pool.query('INSERT INTO lead_files (lead_id, filename, mimetype, size, data) VALUES ($1,$2,$3,$4,$5) RETURNING id', [n, row.filename, row.mimetype, row.size, file.buffer]);
  row.id = r.rows[0].id;
  return row;
}

async function listLeadFiles(leadId) {
  const n = parseInt(leadId, 10);
  if (!Number.isInteger(n)) return [];
  if (!pool) return mem.files.filter((f) => f.lead_id === n).map(({ data, ...rest }) => rest);
  const r = await pool.query('SELECT id, lead_id, filename, mimetype, size, created_at FROM lead_files WHERE lead_id=$1 ORDER BY id', [n]);
  return r.rows;
}

async function getLeadFile(id) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return null;
  if (!pool) return mem.files.find((f) => f.id === n) || null;
  const r = await pool.query('SELECT * FROM lead_files WHERE id=$1', [n]);
  return r.rows[0] || null;
}

// ── Onderzoeksverslagen per lead (src/research.js) ───────────────────────
let memReportId = 1;
async function saveLeadReport(r) {
  const row = { ...r, created_at: new Date() };
  if (!pool) { row.id = memReportId++; mem.reports.unshift(row); return row; }
  const q = await pool.query(
    'INSERT INTO lead_reports (lead_id, lang, model, status, facts, report, sources, error, usage) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at',
    [r.lead_id, r.lang || null, r.model || null, r.status || null, JSON.stringify(r.facts || {}), r.report || null, JSON.stringify(r.sources || []), r.error || null, JSON.stringify(r.usage || null)]
  );
  row.id = q.rows[0].id; row.created_at = q.rows[0].created_at;
  return row;
}

// Nieuwste verslag van een lead
async function getLeadReport(leadId) {
  const n = parseInt(leadId, 10);
  if (!Number.isInteger(n)) return null;
  if (!pool) return mem.reports.find((x) => x.lead_id === n) || null;
  const r = await pool.query('SELECT * FROM lead_reports WHERE lead_id=$1 ORDER BY created_at DESC LIMIT 1', [n]);
  return r.rows[0] || null;
}

// { lead_id: status } van het nieuwste verslag — voor het icoon in de leadlijst
async function latestReports() {
  const out = {};
  if (!pool) { for (const x of mem.reports) if (!(x.lead_id in out)) out[x.lead_id] = x.status; return out; }
  const r = await pool.query('SELECT DISTINCT ON (lead_id) lead_id, status FROM lead_reports ORDER BY lead_id, created_at DESC');
  r.rows.forEach((x) => { out[x.lead_id] = x.status; });
  return out;
}

// { lead_id: aantal } — voor het paperclip-icoon in de leadlijst
async function countLeadFiles() {
  const out = {};
  if (!pool) { mem.files.forEach((f) => { out[f.lead_id] = (out[f.lead_id] || 0) + 1; }); return out; }
  const r = await pool.query('SELECT lead_id, count(*)::int AS n FROM lead_files GROUP BY lead_id');
  r.rows.forEach((x) => { out[x.lead_id] = x.n; });
  return out;
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

// Notitie van het formulier bijwerken (bv. wezwanie: e-mail bevestigd); admin_note blijft van de beheerder
async function setLeadNote(id, note) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return;
  if (!pool) { const l = mem.leads.find((x) => x.id === n); if (l) l.note = note; return; }
  await pool.query('UPDATE leads SET note=$2 WHERE id=$1', [n, note]);
}

async function setLeadCase(id, caseId) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return;
  if (!pool) { const l = mem.leads.find((x) => x.id === n); if (l) l.case_id = caseId; return; }
  await pool.query('UPDATE leads SET case_id=$2, updated_at=now() WHERE id=$1', [n, caseId]);
}

async function deleteLead(id) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return false;
  if (!pool) {
    const before = mem.leads.length;
    mem.leads = mem.leads.filter((x) => x.id !== n);
    mem.files = mem.files.filter((f) => f.lead_id !== n);
    mem.reports = mem.reports.filter((x) => x.lead_id !== n);
    mem.comms = mem.comms.filter((x) => x.case_id !== 'L' + n);
    return mem.leads.length < before;
  }
  await pool.query('DELETE FROM lead_files WHERE lead_id=$1', [n]);
  await pool.query('DELETE FROM lead_reports WHERE lead_id=$1', [n]);
  await pool.query('DELETE FROM comm_log WHERE case_id=$1', ['L' + n]);
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
    mem.events = mem.events.filter((e) => e.type === 'lead' || !(nips.includes(e.nip) || caseIds.includes(e.case_id) || (!e.case_id && DEMO_EVENT_SOURCES.includes(e.source))));
    const cm0 = mem.comms.length;
    mem.comms = mem.comms.filter((c) => !caseIds.includes(c.case_id));
    let scores = 0; for (const n of nips) if (mem.scores[n]) { delete mem.scores[n]; scores++; }
    let actions = 0; for (const id of caseIds) if (mem.actions[id]) { delete mem.actions[id]; actions++; }
    return { events: ev0 - mem.events.length, comms: cm0 - mem.comms.length, scores, actions };
  }
  const ev = await pool.query(
    "DELETE FROM events WHERE type IS DISTINCT FROM 'lead' AND (nip = ANY($2) OR case_id = ANY($3) OR (case_id IS NULL AND source = ANY($1)))",
    [DEMO_EVENT_SOURCES, nips, caseIds]
  );
  const cm = await pool.query('DELETE FROM comm_log WHERE case_id = ANY($1)', [caseIds]);
  const sc = await pool.query('DELETE FROM debtor_scores WHERE nip = ANY($1)', [nips]);
  const ac = await pool.query('DELETE FROM case_actions WHERE case_id = ANY($1)', [caseIds]);
  return { events: ev.rowCount, comms: cm.rowCount, scores: sc.rowCount, actions: ac.rowCount };
}

// ── Communicatielog ──────────────────────────────────────────────────────
let memCommId = 1;
async function logComm(e) {
  const row = { direction: 'out', open_count: 0, ...e, created_at: new Date() };
  if (!pool) { row.id = memCommId++; mem.comms.unshift(row); mem.comms = mem.comms.slice(0, 500); return row; }
  const r = await pool.query(
    `INSERT INTO comm_log (case_id, channel, tone, subject, body, status, outcome, recipient, direction, sender, provider_id, reply_key, in_reply_to, delivery, attachments)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
    [e.case_id, e.channel, e.tone || null, e.subject || null, e.body || null, e.status || null, e.outcome || null, e.recipient || null,
      row.direction, e.sender || null, e.provider_id || null, e.reply_key || null, e.in_reply_to || null, e.delivery || null, e.attachments ? JSON.stringify(e.attachments) : null]
  );
  row.id = r.rows[0].id;
  return row;
}

// ── Postvak: leesstatus, afleverstatus en antwoorden (src/mailbox.js) ─────
const COMM_FIELDS = ['delivery', 'delivery_at', 'opened_at', 'open_count', 'read_at', 'provider_id', 'attachments'];
async function updateComm(id, fields) {
  const keys = Object.keys(fields).filter((k) => COMM_FIELDS.includes(k));
  if (!keys.length) return false;
  if (!pool) { const c = mem.comms.find((x) => x.id === id); if (!c) return false; for (const k of keys) c[k] = fields[k]; return true; }
  const r = await pool.query(`UPDATE comm_log SET ${keys.map((k, i) => k + '=$' + (i + 2)).join(', ')} WHERE id=$1`, [id, ...keys.map((k) => (k === 'attachments' && fields[k] ? JSON.stringify(fields[k]) : fields[k]))]);
  return r.rowCount > 0;
}
async function getCommByKey(key) {
  if (!key) return null;
  if (!pool) return mem.comms.find((x) => x.reply_key === key) || null;
  const r = await pool.query('SELECT * FROM comm_log WHERE reply_key=$1 LIMIT 1', [key]);
  return r.rows[0] || null;
}
async function getCommByProvider(pid) {
  if (!pid) return null;
  if (!pool) return mem.comms.find((x) => x.provider_id === pid) || null;
  const r = await pool.query('SELECT * FROM comm_log WHERE provider_id=$1 LIMIT 1', [pid]);
  return r.rows[0] || null;
}
async function getCommById(id) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return null;
  if (!pool) return mem.comms.find((x) => x.id === n) || null;
  const r = await pool.query('SELECT * FROM comm_log WHERE id=$1', [n]);
  return r.rows[0] || null;
}
// Laatste e-mail die wij naar dit adres stuurden — om een losse mail van een bekende afzender bij de juiste draad te leggen
async function lastCommTo(address) {
  const a = String(address || '').trim().toLowerCase();
  if (!a) return null;
  if (!pool) return mem.comms.find((x) => x.channel === 'email' && x.direction !== 'in' && String(x.recipient || '').toLowerCase() === a) || null;
  const r = await pool.query("SELECT * FROM comm_log WHERE channel='email' AND COALESCE(direction, 'out') <> 'in' AND lower(recipient)=$1 ORDER BY id DESC LIMIT 1", [a]);
  return r.rows[0] || null;
}
// Eén open-registratie: eerste keer zet opened_at, elke keer telt mee
async function markCommOpened(id) {
  if (!pool) { const c = mem.comms.find((x) => x.id === id); if (!c) return false; if (!c.opened_at) c.opened_at = new Date(); c.open_count = (c.open_count || 0) + 1; return true; }
  const r = await pool.query('UPDATE comm_log SET opened_at = COALESCE(opened_at, now()), open_count = COALESCE(open_count, 0) + 1 WHERE id=$1', [id]);
  return r.rowCount > 0;
}
// Binnengekomen berichten, nieuwste eerst (voor /admin/poczta)
async function listInbound(limit = 100) {
  if (!pool) return mem.comms.filter((x) => x.direction === 'in').slice(0, limit);
  const r = await pool.query("SELECT * FROM comm_log WHERE direction='in' ORDER BY id DESC LIMIT $1", [limit]);
  return r.rows;
}
// Ongelezen antwoorden per draad: { 'L3': 1, 'c7': 2, … }
async function unreadReplies() {
  const out = {};
  const rows = pool
    ? (await pool.query("SELECT case_id, count(*)::int AS n FROM comm_log WHERE direction='in' AND read_at IS NULL GROUP BY case_id")).rows
    : Object.entries(mem.comms.filter((x) => x.direction === 'in' && !x.read_at).reduce((a, x) => { a[x.case_id] = (a[x.case_id] || 0) + 1; return a; }, {})).map(([case_id, n]) => ({ case_id, n }));
  for (const r of rows) out[r.case_id] = r.n;
  return out;
}

// Eén bericht uit het communicatielog (om terug te lezen); caseKey moet kloppen (toegang)
async function getComm(id, caseKey) {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n)) return null;
  if (!pool) return mem.comms.find((x) => x.id === n && x.case_id === caseKey) || null;
  const r = await pool.query('SELECT * FROM comm_log WHERE id=$1 AND case_id=$2', [n, caseKey]);
  return r.rows[0] || null;
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

// ── Zaken (echte sprawy) ─────────────────────────────────────────────────
// Sleutel in de app: 'c<id>' (string, net als de demo-ids f1..f6) — case_actions, comm_log en
// events verwijzen met die sleutel. Kolommen in snake_case; hydratatie in src/cases.js.
const CASE_COLS = ['nr', 'debtor', 'nip', 'amount', 'due_date', 'debtor_email', 'debtor_tel', 'client_company', 'client_email', 'owner_user_id', 'phase', 'tag', 'source', 'lead_id', 'note'];
let memCaseId = 1;
async function listCases() {
  if (!pool) return mem.cases.slice();
  const r = await pool.query('SELECT * FROM cases ORDER BY created_at DESC');
  return r.rows;
}

async function insertCase(c) {
  const row = {}; for (const k of CASE_COLS) row[k] = c[k] === undefined ? null : c[k];
  if (!pool) { row.id = memCaseId++; row.created_at = new Date(); mem.cases.unshift(row); return row; }
  const r = await pool.query(
    `INSERT INTO cases (${CASE_COLS.join(', ')}) VALUES (${CASE_COLS.map((_, i) => '$' + (i + 1)).join(', ')}) RETURNING *`,
    CASE_COLS.map((k) => row[k])
  );
  return r.rows[0];
}

async function updateCase(id, fields) {
  const keys = Object.keys(fields).filter((k) => CASE_COLS.includes(k));
  if (!keys.length) return false;
  if (!pool) {
    const c = mem.cases.find((x) => x.id === id);
    if (!c) return false;
    for (const k of keys) c[k] = fields[k];
    c.updated_at = new Date();
    return true;
  }
  const r = await pool.query(
    `UPDATE cases SET ${keys.map((k, i) => k + '=$' + (i + 2)).join(', ')}, updated_at=now() WHERE id=$1`,
    [id, ...keys.map((k) => fields[k])]
  );
  return r.rowCount > 0;
}

// Zaak + alle sporen (communicatie, acties, events) weg; leads verliezen alleen de koppeling
async function deleteCase(id, caseKey) {
  if (!pool) {
    mem.cases = mem.cases.filter((x) => x.id !== id);
    mem.comms = mem.comms.filter((x) => x.case_id !== caseKey);
    mem.events = mem.events.filter((x) => x.case_id !== caseKey);
    delete mem.actions[caseKey];
    mem.leads.forEach((l) => { if (l.case_id === caseKey) l.case_id = null; });
    return true;
  }
  await pool.query('DELETE FROM comm_log WHERE case_id=$1', [caseKey]);
  await pool.query('DELETE FROM events WHERE case_id=$1', [caseKey]);
  await pool.query('DELETE FROM case_actions WHERE case_id=$1', [caseKey]);
  await pool.query('UPDATE leads SET case_id=NULL WHERE case_id=$1', [caseKey]);
  const r = await pool.query('DELETE FROM cases WHERE id=$1', [id]);
  return r.rowCount > 0;
}

// ── Wezwania online (src/demands.js) ─────────────────────────────────────
const DEMAND_COLS = ['token', 'lang', 'creditor_company', 'creditor_nip', 'creditor_email', 'debtor_company', 'debtor_nip', 'debtor_email', 'invoice_nr', 'amount', 'due_date', 'iban', 'status', 'response_note', 'promised_date', 'paid_date', 'opened_at', 'responded_at', 'facts', 'lead_id', 'file_id', 'creditor_key', 'creator_ip', 'confirmed_at', 'confirm_ip'];
const DEMAND_DATES = ['due_date', 'promised_date', 'paid_date'];
// pg geeft DATE-kolommen terug als Date (lokale middernacht) — de brief en de mails willen JJJJ-MM-DD
function demandRow(r) {
  if (!r) return null;
  for (const k of DEMAND_DATES) {
    const v = r[k];
    if (v instanceof Date) r[k] = Number.isNaN(v.getTime()) ? null : v.getFullYear() + '-' + String(v.getMonth() + 1).padStart(2, '0') + '-' + String(v.getDate()).padStart(2, '0');
  }
  return r;
}
let memDemandId = 1;
async function insertDemand(d) {
  const row = {}; for (const k of DEMAND_COLS) row[k] = d[k] === undefined ? null : d[k];
  if (!pool) {
    if (mem.demands.some((x) => x.token === row.token)) throw new Error('duplicate token');
    row.id = memDemandId++; row.created_at = new Date(); mem.demands.unshift(row); return row;
  }
  const r = await pool.query(
    `INSERT INTO demands (${DEMAND_COLS.join(', ')}) VALUES (${DEMAND_COLS.map((_, i) => '$' + (i + 1)).join(', ')}) RETURNING *`,
    DEMAND_COLS.map((k) => (k === 'facts' ? JSON.stringify(row[k]) : row[k]))
  );
  return demandRow(r.rows[0]);
}
async function getDemandByToken(token) {
  if (!pool) return mem.demands.find((x) => x.token === token) || null;
  const r = await pool.query('SELECT * FROM demands WHERE token=$1', [token]);
  return demandRow(r.rows[0]);
}
// Reactie van de dłużnik vastleggen — alleen zolang er nog niet is gereageerd (ook bij dubbel klikken telt de eerste)
const DEMAND_OPEN = ['wyslane', 'otwarte'];
async function answerDemand(id, fields) {
  const keys = Object.keys(fields).filter((k) => DEMAND_COLS.includes(k));
  if (!keys.length) return false;
  if (!pool) {
    const d = mem.demands.find((x) => x.id === id);
    if (!d || !DEMAND_OPEN.includes(d.status || 'wyslane')) return false;
    for (const k of keys) d[k] = fields[k];
    return true;
  }
  const r = await pool.query(
    `UPDATE demands SET ${keys.map((k, i) => k + '=$' + (i + 3)).join(', ')} WHERE id=$1 AND COALESCE(status, 'wyslane') = ANY($2)`,
    [id, DEMAND_OPEN, ...keys.map((k) => fields[k])]
  );
  return r.rowCount > 0;
}
// Bevestiging door de wierzyciel — alleen de eerste klik telt (true), zodat de mails één keer vertrekken
async function confirmDemand(id, ip) {
  if (!pool) {
    const d = mem.demands.find((x) => x.id === id);
    if (!d || d.confirmed_at) return false;
    d.confirmed_at = new Date(); d.confirm_ip = ip || null;
    return true;
  }
  const r = await pool.query('UPDATE demands SET confirmed_at=now(), confirm_ip=$2 WHERE id=$1 AND confirmed_at IS NULL', [id, ip || null]);
  return r.rowCount > 0;
}
// Onbevestigde wezwania van vóór `before` verwijderen, met hun bewijslog. De lead (en zijn bijlage) blijft
// staan — die beheert de admin in /admin/leady. Geeft de verwijderde rijen terug ({ id, lead_id }).
async function purgeUnconfirmedDemands(before) {
  if (!pool) {
    const gone = mem.demands.filter((x) => !x.confirmed_at && new Date(x.created_at) < before);
    const ids = gone.map((x) => x.id);
    mem.demands = mem.demands.filter((x) => !ids.includes(x.id));
    mem.demandLog = mem.demandLog.filter((x) => !ids.includes(x.demand_id));
    return gone.map((x) => ({ id: x.id, lead_id: x.lead_id }));
  }
  const r = await pool.query('DELETE FROM demands WHERE confirmed_at IS NULL AND created_at < $1 RETURNING id, lead_id', [before]);
  if (r.rowCount) await pool.query('DELETE FROM demand_log WHERE demand_id = ANY($1)', [r.rows.map((x) => x.id)]);
  return r.rows;
}
// Aantal bevestigde (dus verstuurde) wezwania naar hetzelfde e-mailadres van een dłużnik sinds een tijdstip (rem op misbruik)
async function countDemandsTo(email, since) {
  if (!email) return 0;
  if (!pool) return mem.demands.filter((x) => x.debtor_email === email && x.confirmed_at && new Date(x.confirmed_at) >= since).length;
  const r = await pool.query('SELECT count(*)::int AS n FROM demands WHERE debtor_email=$1 AND confirmed_at >= $2', [email, since]);
  return r.rows[0].n;
}
let memDemandLogId = 1;
async function logDemand(demandId, e) {
  const row = { demand_id: demandId, type: e.type, actor: e.actor || null, ip: e.ip || null, user_agent: e.user_agent || null, data: e.data || null, created_at: new Date() };
  if (!pool) { row.id = memDemandLogId++; mem.demandLog.push(row); mem.demandLog = mem.demandLog.slice(-2000); return row; }
  await pool.query(
    'INSERT INTO demand_log (demand_id, type, actor, ip, user_agent, data) VALUES ($1,$2,$3,$4,$5,$6)',
    [row.demand_id, row.type, row.actor, row.ip, row.user_agent, row.data ? JSON.stringify(row.data) : null]
  );
  return row;
}
// Oudste eerst; de laatste `limit` regels
async function listDemandLog(demandId, limit = 200) {
  if (!pool) return mem.demandLog.filter((x) => x.demand_id === demandId).slice(-limit);
  const r = await pool.query('SELECT * FROM (SELECT * FROM demand_log WHERE demand_id=$1 ORDER BY id DESC LIMIT $2) t ORDER BY id', [demandId, limit]);
  return r.rows;
}
async function updateDemand(id, fields) {
  const keys = Object.keys(fields).filter((k) => DEMAND_COLS.includes(k));
  if (!keys.length) return false;
  if (!pool) { const d = mem.demands.find((x) => x.id === id); if (!d) return false; for (const k of keys) d[k] = fields[k]; return true; }
  const r = await pool.query(`UPDATE demands SET ${keys.map((k, i) => k + '=$' + (i + 2)).join(', ')} WHERE id=$1`, [id, ...keys.map((k) => (k === 'facts' ? JSON.stringify(fields[k]) : fields[k]))]);
  return r.rowCount > 0;
}
async function countDemands() {
  if (!pool) return mem.demands.length;
  const r = await pool.query('SELECT count(*)::int AS n FROM demands');
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
  insertEvent, listEvents, listCaseEvents,
  listCases, insertCase, updateCase, deleteCase,
  saveScore, loadScores,
  logComm, getComm, listComms, countComms,
  updateComm, getCommByKey, getCommByProvider, getCommById, lastCommTo, markCommOpened, listInbound, unreadReplies,
  saveLead, listLeads, getLead, updateLead, deleteLead, setLeadCase, setLeadNote,
  saveLeadFile, listLeadFiles, getLeadFile, countLeadFiles,
  saveLeadReport, getLeadReport, latestReports,
  insertDemand, getDemandByToken, updateDemand, countDemands,
  answerDemand, confirmDemand, purgeUnconfirmedDemands, countDemandsTo, logDemand, listDemandLog,
  purgeDemo,
};
