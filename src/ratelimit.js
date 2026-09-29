// sprzedamfakture.pl — eenvoudige rate limiter (in-memory, per proces)
// Schuivend venster per sleutel (bv. 'wz:<ip>'). Eén Railway-instance, dus geen gedeelde opslag nodig;
// na een herstart begint de telling opnieuw.
//   check(key, max, windowMs) → mag er nog één bij? (telt niet mee)
//   hit(key, windowMs)        → tel een geslaagde actie
const buckets = new Map();

function recent(key, windowMs, now) {
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length) buckets.set(key, arr); else buckets.delete(key);
  return arr;
}

function check(key, max, windowMs) {
  return recent(key, windowMs, Date.now()).length < max;
}

function hit(key, windowMs) {
  const now = Date.now();
  const arr = recent(key, windowMs, now);
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) buckets.delete(buckets.keys().next().value);
}

module.exports = { check, hit };
