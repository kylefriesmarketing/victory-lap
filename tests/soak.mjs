// VICTORY LAP — headless soak. Run: node tests/soak.mjs [nSeeds]
// The authority on sim health: plays the REAL Game via the shared policy bot.

import { soakRun, Game, T } from '../js/game.js';

const N = parseInt(process.argv[2] || '48', 10);
const results = [];
let failed = 0;

for (let seed = 1; seed <= N; seed++) {
  const r = soakRun(seed);
  results.push(r);
  if (r.errors.length) {
    failed++;
    console.error(`✗ seed ${seed}: ${r.errors.join(' | ')}`);
  }
}

const byEnding = {};
for (const r of results) byEnding[r.ending || 'NONE'] = (byEnding[r.ending] || 0) + 1;

console.log(`\nVICTORY LAP soak — ${N} seeds`);
console.log('endings:', JSON.stringify(byEnding));
console.log('avg cash at end:', Math.round(results.reduce((a, r) => a + r.cash, 0) / N));
console.log('avg crates sold:', (results.reduce((a, r) => a + r.crates, 0) / N).toFixed(2));
console.log('runs with rip use:', results.filter(r => r.rip > 0).length);
console.log('runs with skim:', results.filter(r => r.skimmed > 0).length);

// --- assertions -------------------------------------------------------------
const problems = [];
if (failed > 0) problems.push(`${failed} seeds threw or stalled`);
for (const key of ['WALKING', 'BUSTED', 'BODIED']) {
  if (!byEnding[key]) problems.push(`ending ${key} never reached in ${N} seeds`);
}
if (!byEnding.STUCK && !byEnding.WALKING) problems.push('neither timeout ending reachable');
if (byEnding.NONE) problems.push(`${byEnding.NONE} runs ended with no ending`);

// determinism: same seed twice ⇒ identical result
const a = soakRun(999), b = soakRun(999);
const fpA = JSON.stringify([a.ending, a.day, a.cash, a.heat, a.crates, a.skimmed]);
const fpB = JSON.stringify([b.ending, b.day, b.cash, b.heat, b.crates, b.skimmed]);
if (fpA !== fpB) problems.push(`determinism broke: ${fpA} vs ${fpB}`);
else console.log('determinism: seed 999 twice ->', fpA, '✓');

// meta accrual: run 3 fails through one meta object, counters must climb
const meta = { runs: 0, cred: 0, scars: 0, lessons: 0, rep: 0, cashBanked: 0,
               knows: { window: false, blind: false, drop: false, dog: false } };
for (let s = 21; s < 27; s++) soakRun(s, { meta });
if (meta.runs !== 6) problems.push(`meta.runs=${meta.runs}, want 6`);
if (meta.cred + meta.scars + meta.lessons + meta.rep <= 0) problems.push('no meta currency accrued over 6 runs');
console.log('meta after 6 runs:', JSON.stringify(meta));

// unit checks on a fresh game
const g = new Game({ seed: 5 });
g.act('enter', 'qwikstop'); g.act('buy', 'rip'); g.act('leave');
if (g.player.inv.rip !== 1) problems.push('buy rip failed');
g.act('useRip');
if (g.bonusBlocks !== 1) problems.push('rip bonus block missing');
const cash0 = g.player.cash;
g.act('enter', 'wingbarn');
g.block = 1; // afternoon so the shift is legal
const sh = g.act('shiftAuto', 0);
if (!sh.ok || g.player.cash <= cash0) problems.push('shift did not pay');
if (g.heat !== 0) problems.push('clean play generated heat');

console.log('');
if (problems.length) { console.error('✗✗ SOAK FAILED:'); for (const p of problems) console.error('  -', p); process.exit(1); }
console.log(`✓ soak green — ${N} seeds, all endings reachable, determinism holds, meta accrues.`);
