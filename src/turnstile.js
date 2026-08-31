// sprzedamfakture.pl — Cloudflare Turnstile (anti-bot op formulieren)
// Env: TURNSTILE_SITE_KEY (publiek, in de widget) + TURNSTILE_SECRET_KEY (server-side verificatie).
// Zonder beide keys: uitgeschakeld — formulieren werken zonder widget.
// Testkeys van Cloudflare: site 1x00000000000000000000AA / secret 1x0000000000000000000000000000000AA (altijd ok),
// secret 2x0000000000000000000000000000000AA (altijd geweigerd).
const SITE_KEY = process.env.TURNSTILE_SITE_KEY || '';
const SECRET = process.env.TURNSTILE_SECRET_KEY || '';

function enabled() { return !!(SITE_KEY && SECRET); }

// Resultaat: { ok, skipped?, codes? } — bij netwerkfout 'fail closed' (gebruiker kan opnieuw proberen)
async function verify(token, ip) {
  if (!enabled()) return { ok: true, skipped: true };
  if (!token) return { ok: false, codes: ['missing-input-response'] };
  try {
    const body = new URLSearchParams({ secret: SECRET, response: String(token).slice(0, 2048) });
    if (ip) body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json().catch(() => ({}));
    if (j.success) return { ok: true };
    const codes = j['error-codes'] || ['unknown'];
    console.warn('[turnstile] geweigerd:', codes.join(','));
    return { ok: false, codes };
  } catch (e) {
    console.error('[turnstile] netwerkfout:', e.message);
    return { ok: false, codes: ['network-error'] };
  }
}

module.exports = { enabled, verify, SITE_KEY };
