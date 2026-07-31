// Creditline Poland — AIScore-engine + monitoring
//
// AIScore (0–100, klasa A–E): geen kredietscore van een biuro, maar een eigen
// AI-inschatting van de INBAARHEID van deze concrete vordering, op basis van
// openbare Poolse bronnen + eigen betaalhistorie. Bepaalt:
//   - eerlijk wykup-percentage (oferta AI)
//   - rekomendacja: windykacja / sprzedaż / zamknięcie (kansloos)
//
// Openbare bronnen (connectors):
//   KRZ  — Krajowy Rejestr Zadłużonych (jawny, gratis): upadłości,
//          restrukturyzacje, umorzone egzekucje. Geen officiële API (in de
//          maak volgens MS-FAQ) → productie: MGBI-API of eigen portal-poller.
//   MF   — Biała lista podatników VAT: open API wl-api.mf.gov.pl (gratis).
//   KRS  — api-krs.ms.gov.pl: odpis aktualny (open, gratis).
//   MSiG — Monitor Sądowy i Gospodarczy: obwieszczenia (openbaar).
// NB: individuele nakazy zapłaty zijn in Polen NIET centraal openbaar;
//     KRD/BIG-registers zijn commercieel (aansluitovereenkomst vereist).
//
// DEMO_EVENTS=1 (default): connectors gesimuleerd + deterministische events,
// zodat het concept live oogt zonder externe afhankelijkheden.

const db = require('./db');

const MONITOR_INTERVAL_MS = parseInt(process.env.MONITOR_INTERVAL_MS || '60000', 10);
const DEMO = process.env.DEMO_EVENTS !== '0';

let claimsRef = [];
let tick = 0;
let timer = null;

// ── Connectors (productie: echte calls; demo: simulatie) ─────────────────
async function checkBialaLista(nip) {
  // Open MF-API, gratis: /api/search/nip/{nip}?date=YYYY-MM-DD
  if (DEMO) return { vatActive: true, source: 'MF biała lista (sim)' };
  try {
    const date = new Date().toISOString().slice(0, 10);
    const clean = String(nip).replace(/[^0-9]/g, '');
    const r = await fetch(`https://wl-api.mf.gov.pl/api/search/nip/${clean}?date=${date}`, { signal: AbortSignal.timeout(4000) });
    const j = await r.json();
    const status = j?.result?.subject?.statusVat;
    return { vatActive: status === 'Czynny', source: 'MF biała lista' };
  } catch { return { vatActive: null, source: 'MF biała lista (niedostępna)' }; }
}

async function checkKRZ(nip, sim) {
  // Geen officiële API — productie via MGBI of portal-poller (krz.ms.gov.pl).
  // sim: null | 'restrukturyzacja' | 'upadlosc' | 'egzekucja_umorzona'
  return { krz: DEMO ? (sim || null) : null, source: 'KRZ' };
}

async function checkKRS(_nip) {
  // api-krs.ms.gov.pl vereist KRS-nummer; koppeling NIP→KRS via REGON-API (GUS).
  return { active: true, source: 'KRS' };
}

// ── Scoring ──────────────────────────────────────────────────────────────
function grade(score) {
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'E';
}

function offerPct(score) {
  return Math.max(35, Math.min(93, Math.round(score * 0.62 + 34)));
}

function recommendation(score, krz) {
  if (krz === 'upadlosc' || score < 25) return 'zamknij';
  if (score < 60) return 'sprzedaz';
  return 'windykacja';
}

const RECO_TXT = {
  windykacja: 'Ścieżka polubowna — wysokie prawdopodobieństwo odzyskania.',
  sprzedaz: 'Ryzyko podwyższone — rekomendacja: sprzedaż wierzytelności.',
  zamknij: 'Sprawa praktycznie nieściągalna — rekomendacja: zamknięcie i odpis.',
};

async function computeScore(c) {
  const sim = c.sim || {};
  const [wl, krz] = await Promise.all([checkBialaLista(c.nip), checkKRZ(c.nip, sim.krz)]);

  let score = 100;
  const signals = [];

  const dayPenalty = Math.min(35, Math.round(c.days * 0.4));
  score -= dayPenalty;
  signals.push({ label: `${c.days} dni po terminie`, impact: -dayPenalty });

  const hist = sim.histDays ?? 10;
  const histPenalty = Math.min(15, Math.max(0, hist - 5));
  score -= histPenalty;
  signals.push({ label: `Historia: płaci śr. ${hist} dni po terminie`, impact: -histPenalty });

  if (krz.krz === 'upadlosc') { score -= 55; signals.push({ label: 'KRZ: postępowanie upadłościowe', impact: -55 }); }
  else if (krz.krz === 'restrukturyzacja') { score -= 35; signals.push({ label: 'KRZ: otwarta restrukturyzacja', impact: -35 }); }
  else if (krz.krz === 'egzekucja_umorzona') { score -= 30; signals.push({ label: 'KRZ: umorzona egzekucja (bezskuteczna)', impact: -30 }); }
  else signals.push({ label: 'KRZ: brak wpisów', impact: 0 });

  if (wl.vatActive === false) { score -= 20; signals.push({ label: 'MF: podatnik VAT nieaktywny', impact: -20 }); }
  else if (wl.vatActive === true) signals.push({ label: 'MF: czynny podatnik VAT', impact: 0 });

  if ((sim.ageYears ?? 10) < 2) { score -= 8; signals.push({ label: 'KRS: firma młodsza niż 2 lata', impact: -8 }); }
  if (c.amount >= 50000) { score -= 3; signals.push({ label: 'Koncentracja: kwota ≥ 50 tys. zł', impact: -3 }); }

  score = Math.max(0, Math.min(100, score));
  const g = grade(score);
  const pct = offerPct(score);
  const reco = recommendation(score, krz.krz);
  return { score, grade: g, pct, reco, recoTxt: RECO_TXT[reco], signals };
}

async function scoreClaim(c) {
  const ai = await computeScore(c);
  c.ai = ai;
  c.score = ai.grade;   // bestaande views blijven werken
  c.pct = ai.pct;
  await db.saveScore(c.nip, ai).catch(() => {});
  return ai;
}

// ── Monitor: continue loop over alle dłużnicy in de database ─────────────
// Interval i.p.v. letterlijk elke seconde: openbare bronnen rate-limiten en
// registers publiceren batchgewijs; het effect (melding binnen minuten van
// een nieuw obwieszczenie) is hetzelfde. Interval via MONITOR_INTERVAL_MS.
const DEMO_TIMELINE = [
  { atTick: 1, claimId: 'f4', type: 'KRZ', title: 'Nowe obwieszczenie: otwarcie postępowania restrukturyzacyjnego', krz: 'restrukturyzacja' },
  { atTick: 3, claimId: 'f2', type: 'MSiG', title: 'Wzmianka w MSiG: zwołanie zgromadzenia wierzycieli kontrahenta', krz: null },
  { atTick: 5, claimId: 'f4', type: 'KRZ', title: 'Nowe obwieszczenie: ogłoszenie upadłości', krz: 'upadlosc' },
];

async function monitorTick() {
  tick += 1;
  for (const step of DEMO_TIMELINE) {
    if (DEMO && step.atTick === tick) {
      const c = claimsRef.find((x) => x.id === step.claimId);
      if (!c) continue;
      if (step.krz) { c.sim = { ...(c.sim || {}), krz: step.krz }; }
      const before = c.ai ? c.ai.score : null;
      await scoreClaim(c);
      await db.insertEvent({
        nip: c.nip, debtor: c.debtor, type: step.type,
        title: `${step.title} — AIScore ${before !== null ? before + ' → ' : ''}${c.ai.score}`,
        source: step.type === 'KRZ' ? 'krz.ms.gov.pl' : 'MSiG',
      }).catch(() => {});
    }
  }
  if (!DEMO) {
    // Productie: herbereken periodiek en vergelijk; bij wijziging → event.
    for (const c of claimsRef) {
      const prev = c.ai ? c.ai.score : null;
      await scoreClaim(c);
      if (prev !== null && c.ai.score !== prev) {
        await db.insertEvent({
          nip: c.nip, debtor: c.debtor, type: 'AIScore',
          title: `Zmiana AIScore: ${prev} → ${c.ai.score}`, source: 'monitor',
        }).catch(() => {});
      }
    }
  }
}

async function init(claims) {
  claimsRef = claims;
  // Herstel eerder berekende scores (persistentie) en herbereken vers
  const saved = await db.loadScores().catch(() => ({}));
  for (const c of claims) {
    if (saved[c.nip] && saved[c.nip].signals) c.ai = saved[c.nip];
    await scoreClaim(c);
  }
  await db.insertEvent({
    nip: null, debtor: null, type: 'system',
    title: `Agent AI: monitoring uruchomiony (${claims.length} dłużników, interwał ${Math.round(MONITOR_INTERVAL_MS / 1000)}s)`,
    source: 'monitor',
  }).catch(() => {});
  timer = setInterval(() => { monitorTick().catch(() => {}); }, MONITOR_INTERVAL_MS);
  if (timer.unref) timer.unref();
}

// Indicatieve wycena vóór KRZ-check (sprzedamfakture.pl)
function estimateOffer(kwota, dni) {
  let score = 100;
  score -= Math.min(35, Math.round(dni * 0.4));
  score -= 7; // gemiddelde betaalhistorie, nog onbekend
  if (kwota >= 50000) score -= 3;
  score = Math.max(0, Math.min(100, score));
  const pct = offerPct(score);
  return { score, pct, pctLow: Math.max(35, pct - 4), amount: Math.round(kwota * pct / 100), amountLow: Math.round(kwota * Math.max(35, pct - 4) / 100) };
}

module.exports = { init, computeScore, scoreClaim, monitorTick, RECO_TXT, estimateOffer };
