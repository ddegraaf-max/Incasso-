// sprzedamfakture.pl — authenticatie & beveiliging
// Concept: in-memory store (reset bij redeploy). Productie: PostgreSQL.
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const db = require('./db');

// ── Gebruikersstore ──────────────────────────────────────────────────────
// user: { id, email, passHash, company, nip, role: 'client'|'admin', totpSecret, totpConfirmed }
const users = new Map(); // key: email (lowercase)
let nextId = 1;

function addUser({ email, password, company, nip, role }) {
  const u = {
    id: nextId++,
    email: email.toLowerCase().trim(),
    passHash: bcrypt.hashSync(password, 12),
    company: company || '',
    nip: nip || '',
    role: role || 'client',
    totpSecret: null,
    totpConfirmed: false,
    createdAt: new Date(),
  };
  users.set(u.email, u);
  if (persistNew) db.saveUser(u).catch(() => {});
  return u;
}
let persistNew = false;

async function initFromDb() {
  const rows = await db.loadUsers().catch(() => []);
  // DB is leidend: rijen behouden hun id; seeds (demo/admin) die nog niet in de DB staan krijgen
  // een vrij id en worden weggeschreven — ook bij een lege DB, anders raakt o.a. de 2FA-koppeling
  // van de admin bij elke herstart kwijt. (Voorkomt ook id-botsingen na een rename.)
  const seeds = Array.from(users.values());
  users.clear();
  rows.forEach((u) => { users.set(u.email, u); if (u.id >= nextId) nextId = u.id + 1; });
  for (const s of seeds) {
    if (users.has(s.email)) continue;
    s.id = nextId++;
    users.set(s.email, s);
    await db.saveUser(s).catch((e) => console.error('DB: seed-user opslaan mislukt —', e.message));
  }
  persistNew = true;
}

function findUser(email) {
  const key = String(email || '').toLowerCase().trim();
  return users.get(key) || (LEGACY_EMAILS[key] ? users.get(LEGACY_EMAILS[key]) : null) || null;
}

function findUserById(id) {
  for (const u of users.values()) if (u.id === id) return u;
  return null;
}

function allUsers() { return Array.from(users.values()); }

// ── Seeds ────────────────────────────────────────────────────────────────
// Demo-klant (zonder 2FA, alleen om te testen — uitzetten met DEMO_ACCOUNT=0 vóór livegang)
const DEMO = process.env.DEMO_ACCOUNT === '0' ? null : { email: 'demo@sprzedamfakture.pl', password: 'Demo1234!' };
if (DEMO) addUser({ email: DEMO.email, password: DEMO.password, company: 'Twoja Firma Sp. z o.o.', nip: '521-000-00-00', role: 'client' });
// Oud demo-adres (vóór de rebrand) blijft werken als alias
const LEGACY_EMAILS = { 'demo@creditline.pl': 'demo@sprzedamfakture.pl' };
// Admin uit env vars; 2FA wordt bij eerste login verplicht ingesteld
addUser({
  email: process.env.ADMIN_EMAIL || 'admin@sprzedamfakture.pl',
  password: process.env.ADMIN_PASSWORD || 'Admin-Zmien-Mnie-1!',
  company: 'sprzedamfakture.pl', role: 'admin',
});

// ── Wachtwoordcontrole ───────────────────────────────────────────────────
function checkPassword(user, password) {
  return bcrypt.compareSync(password || '', user.passHash);
}

function passwordPolicy(pw) {
  // geeft een i18n-sleutel terug (t.app.msg.pwLen / pwChars)
  if (!pw || pw.length < 10) return 'pwLen';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'pwChars';
  return null;
}

// ── TOTP / 2FA ───────────────────────────────────────────────────────────
function newTotpSecret() { return speakeasy.generateSecret({ length: 20 }).base32; }
function totpUri(user, secret) {
  return speakeasy.otpauthURL({ secret, encoding: 'base32', label: user.email, issuer: 'sprzedamfakture.pl' });
}
function verifyTotp(secret, token) {
  try {
    return speakeasy.totp.verify({
      secret, encoding: 'base32',
      token: String(token || '').replace(/\s/g, ''),
      window: 1, // ±30s klokafwijking toestaan
    });
  } catch { return false; }
}

// ── Rate limiting (brute force-bescherming) ──────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 min
const attempts = new Map(); // key: ip|email → { count, lockedUntil }

function rlKey(ip, email) { return ip + '|' + String(email || '').toLowerCase().trim(); }

function isLocked(ip, email) {
  const a = attempts.get(rlKey(ip, email));
  if (!a) return false;
  if (a.lockedUntil && a.lockedUntil > Date.now()) return true;
  if (a.lockedUntil && a.lockedUntil <= Date.now()) attempts.delete(rlKey(ip, email));
  return false;
}

function registerFail(ip, email) {
  const k = rlKey(ip, email);
  const a = attempts.get(k) || { count: 0, lockedUntil: null };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) a.lockedUntil = Date.now() + LOCK_MS;
  attempts.set(k, a);
}

function registerSuccess(ip, email) { attempts.delete(rlKey(ip, email)); }

// ── Middleware ───────────────────────────────────────────────────────────
function currentUser(req) {
  if (!req.session || !req.session.userId || req.session.pending2fa) return null;
  return findUserById(req.session.userId);
}

function requireAuth(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  req.user = u;
  next();
}

function requireAdmin(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  if (u.role !== 'admin') return res.status(403).send('Brak dostępu');
  req.user = u;
  next();
}

module.exports = {
  DEMO,
  addUser, findUser, findUserById, allUsers, initFromDb,
  checkPassword, passwordPolicy,
  newTotpSecret, totpUri, verifyTotp,
  isLocked, registerFail, registerSuccess,
  currentUser, requireAuth, requireAdmin,
};
