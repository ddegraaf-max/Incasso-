// Creditline Poland — authenticatie & beveiliging
// Concept: in-memory store (reset bij redeploy). Productie: PostgreSQL.
const bcrypt = require('bcryptjs');
const otp = require('otplib');

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
  return u;
}

function findUser(email) {
  return users.get(String(email || '').toLowerCase().trim()) || null;
}

function findUserById(id) {
  for (const u of users.values()) if (u.id === id) return u;
  return null;
}

function allUsers() { return Array.from(users.values()); }

// ── Seeds ────────────────────────────────────────────────────────────────
// Demo-klant (zonder 2FA, alleen om te testen — verwijderen vóór livegang)
addUser({ email: 'demo@creditline.pl', password: 'Demo1234!', company: 'Twoja Firma Sp. z o.o.', nip: '521-000-00-00', role: 'client' });
// Admin uit env vars; 2FA wordt bij eerste login verplicht ingesteld
addUser({
  email: process.env.ADMIN_EMAIL || 'admin@creditline.pl',
  password: process.env.ADMIN_PASSWORD || 'Admin-Zmien-Mnie-1!',
  company: 'Creditline Poland', role: 'admin',
});

// ── Wachtwoordcontrole ───────────────────────────────────────────────────
function checkPassword(user, password) {
  return bcrypt.compareSync(password || '', user.passHash);
}

function passwordPolicy(pw) {
  if (!pw || pw.length < 10) return 'Hasło musi mieć co najmniej 10 znaków.';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return 'Hasło musi zawierać małą literę, wielką literę i cyfrę.';
  }
  return null;
}

// ── TOTP / 2FA ───────────────────────────────────────────────────────────
function newTotpSecret() { return otp.generateSecret(); }
function totpUri(user, secret) {
  return otp.generateURI({ secret, issuer: 'Creditline Poland', label: user.email });
}
function verifyTotp(secret, token) {
  try {
    const r = otp.verifySync({ secret, token: String(token || '').replace(/\s/g, ''), window: 1 });
    return !!(r && r.valid);
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
  addUser, findUser, findUserById, allUsers,
  checkPassword, passwordPolicy,
  newTotpSecret, totpUri, verifyTotp,
  isLocked, registerFail, registerSuccess,
  currentUser, requireAuth, requireAdmin,
};
