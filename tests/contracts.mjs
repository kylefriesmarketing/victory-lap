// VICTORY LAP — contracts + upgrades test
//
// ⚠️ THE POINT OF THIS FILE: the soak proves a run does not throw. It cannot
// prove a contract is REACHABLE — a job whose test never passes still deals,
// still expires and still hashes, and the run stays green forever while the
// feature does nothing. That is exactly how the wish system shipped two dead
// powers in the toybox. Every contract below is DRIVEN to completion through
// the real sim, and every upgrade is measured against a control run.
//
//   node tests/contracts.mjs

import { Game, CONTRACTS, UPGRADES, UPGRADE_LANES } from '../js/game.js';

let pass = 0, fail = 0;
const ok = (cond, label, detail = '') => {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + label + (detail ? '  — ' + detail : '')); }
};
const head = t => console.log('\n' + t);

const freshMeta = (up = []) => ({ runs: 0, cred: 0, scars: 0, lessons: 0, rep: 0,
                                  cashBanked: 0, up, knows: { window: false, blind: false, drop: false, dog: false } });

// ── 1. the deck is well formed ─────────────────────────────────────────────
head('deck integrity');
{
  const ids = new Set();
  for (const c of CONTRACTS) {
    ok(!ids.has(c.id), 'unique id', c.id); ids.add(c.id);
    ok(typeof c.test === 'function', 'has test', c.id);
    ok(typeof c.snap === 'function', 'has snap', c.id);
    ok(typeof c.done === 'string' && c.done.length > 10, 'has done copy', c.id);
    ok(typeof c.fail === 'string' && c.fail.length > 10, 'has fail copy', c.id);
    ok(c.due >= 1 && c.due <= 5, 'sane due', c.id);
    // ⚠️ a contract whose reward is nothing at all is a bug, not a design choice
    // — except bev-sunday, which pays only rep and is the whole point of the game.
    ok((c.pay || 0) + (c.rep || 0) + (c.cred || 0) + (c.lessons || 0) > 0, 'pays something', c.id);
  }
  const upIds = new Set();
  for (const u of UPGRADES) {
    ok(!upIds.has(u.id), 'unique upgrade id', u.id); upIds.add(u.id);
    ok(UPGRADE_LANES.some(l => l.key === u.lane), 'lane exists', u.id);
    ok(!u.needs || upIds.has(u.needs) || UPGRADES.some(x => x.id === u.needs), 'prereq exists', u.id);
  }
}

// ── 2. no test or snap touches rng ─────────────────────────────────────────
// The cheapest possible proof: run every test twice against the same frozen
// game and assert the rng cursor did not move.
head('tests are pure reads (no rng)');
{
  const g = new Game({ seed: 5, meta: freshMeta() });
  const before = g._rs;
  for (const c of CONTRACTS) { try { c.snap(g); c.test(g, c.snap(g)); } catch {} }
  ok(g._rs === before, 'rng cursor unmoved by every test+snap', `${before} -> ${g._rs}`);
}

// ── 3. every contract can actually be COMPLETED ────────────────────────────
// Each driver pushes the real sim into the state the contract asks for, using
// only public state the game itself writes. If a driver cannot satisfy a test,
// that contract is undeliverable and the player would never see it complete.
head('every contract is completable');
const DRIVERS = {
  'peanut-one':     g => { g.scheme.sold += 1; },
  'dale-shift':     g => { g.stats.shifts = (g.stats.shifts || 0) + 1; },
  'madison-tip':    g => { g.stats.lattes = (g.stats.lattes || 0) + 2; },
  'earl-honest':    g => { g.stats.shifts = (g.stats.shifts || 0) + 3; },
  'yolanda-wings':  g => { g.player.inv.wings = 2; g.player.x = 1300; g.player.y = 1345; },
  'roxy-show':      g => { g.player.cash = 350; g.room = 'cashking'; },
  'gary-quiet':     g => { g.day = 4; g.heat = 5; },
  'darnell-part':   g => { g.stats.freight = (g.stats.freight || 0) + 1; },
  'dee-dry':        g => { g.day += 3; },
  'whit-bet':       g => { g.stats.koGiven = (g.stats.koGiven || 0) + 2; },
  'wanda-rush':     g => { g.stats.dockShifts = (g.stats.dockShifts || 0) + 3; g.player.fired = false; },
  'moose-standing': g => { g.fox.tips += 3; },
  'trevor-friend':  g => { g.htcc.classes += 2; },
  'vern-three':     g => { g.stats.burgled = (g.stats.burgled || 0) + 3; },
  'ruthie-home':    g => { g.stats.slept = (g.stats.slept || 0) + 3; },
  'sal-round':      g => { g.stats.rounds = (g.stats.rounds || 0) + 1; },
  'bunny-binder':   g => { g.stats.leaked = (g.stats.leaked || 0) + 1; },
  'bev-sunday':     g => { g.day = 6; g.player.cash = 500; },
};
for (const def of CONTRACTS) {
  const g = new Game({ seed: 11, meta: freshMeta() });
  g.day = def.day;
  // force this exact contract onto the board, taken
  g.contracts = [{ id: def.id, state: 'open', snap: null, dueDay: -1 }];
  g._cDeck = [];
  const t = g.takeContract(def.id);
  ok(t.ok, 'takeable: ' + def.id, t.msg);
  const inst = g.contracts[0];
  ok(inst.state === 'taken', 'goes to taken: ' + def.id, inst.state);

  const drive = DRIVERS[def.id];
  ok(!!drive, 'has a driver: ' + def.id);
  if (!drive) continue;
  const cash0 = g.player.cash, rep0 = g.meta.rep;
  drive(g);
  g._contractCheck();
  ok(inst.state === 'done', 'COMPLETES: ' + def.id, 'state=' + inst.state);
  if (def.pay) ok(g.player.cash > cash0, 'paid cash: ' + def.id, `${cash0} -> ${g.player.cash}`);
  if (def.rep) ok(g.meta.rep === rep0 + def.rep, 'paid rep: ' + def.id, `${rep0} -> ${g.meta.rep}`);
  if (def.gives === 'crowbar') ok(g.player.inv.crowbar === true, 'gave the crowbar: ' + def.id);
}

// ── 4. a taken contract is a DELTA, not a free win ─────────────────────────
head('snapshot at acceptance (a delta, not a freebie)');
{
  const g = new Game({ seed: 3, meta: freshMeta() });
  g.scheme.sold = 4;                       // already sold four before taking it
  g.contracts = [{ id: 'peanut-one', state: 'open', snap: null, dueDay: -1 }];
  g._cDeck = [];
  g.takeContract('peanut-one');
  ok(g.contracts[0].state === 'taken', 'still just taken with 4 already sold',
     g.contracts[0].state);
  g.scheme.sold = 5;
  g._contractCheck();
  ok(g.contracts[0].state === 'done', 'completes on the FIFTH, the first after taking');
}

// ── 5. deadlines expire and cost standing ──────────────────────────────────
head('deadlines');
{
  const g = new Game({ seed: 7, meta: freshMeta() });
  g.contracts = [{ id: 'peanut-one', state: 'open', snap: null, dueDay: -1 }];
  g._cDeck = [];
  g.takeContract('peanut-one');
  const due = g.contracts[0].dueDay;
  ok(due === g.day + 3, 'due day set from def.due', String(due));
  g.meta.rep = 5;
  g.day = due;      g._contractDay(); ok(g.contracts[0].state === 'taken', 'alive ON the due day');
  g.day = due + 1;  g._contractDay();
  ok(g.contracts[0].state === 'failed', 'failed the day after', g.contracts[0].state);
  ok(g.meta.rep === 4, 'failing costs one rep', String(g.meta.rep));
}

// ── 6. every upgrade is a REAL modifier, measured against a control ─────────
head('upgrades change the sim');
{
  const base = new Game({ seed: 21, meta: freshMeta() });
  const withUp = id => new Game({ seed: 21, meta: freshMeta([id]) });
  ok(withUp('b1').player.hpMax === base.player.hpMax + 15, 'b1 +15 hpMax',
     `${base.player.hpMax} -> ${withUp('b1').player.hpMax}`);
  ok(withUp('b2').mods.punch === 3, 'b2 +3 punch');
  ok(withUp('b3').player.staminaMax === base.player.staminaMax + 30, 'b3 +30 stamina');
  ok(withUp('b3').mods.staminaRegen > 1, 'b3 faster regen');
  ok(withUp('n1').mods.heatNight > 1, 'n1 heat cools faster');
  ok(withUp('n2')._fenceTake(100) === 115, 'n2 fences pay 15% more',
     String(withUp('n2')._fenceTake(100)));
  ok(base._fenceTake(100) === 100, 'control fence unchanged');
  ok(withUp('n3').mods.cuff === 0.2, 'n3 cuff bonus');
  const s1 = withUp('s1');
  ok(s1.scheme.window === true && s1.scheme.case === true, 's1 starts knowing the window and drop');
  ok(base.scheme.window === false, 'control does NOT start knowing it');
  ok(withUp('s2').mods.ripCrash === 1, 's2 shorter crash');
  ok(withUp('s3')._preCased() === true, 's3 pre-cased');
  ok(base._preCased() === false, 'control not pre-cased');
  ok(withUp('c1').player.cash === base.player.cash + 120, 'c1 +$120',
     `${base.player.cash} -> ${withUp('c1').player.cash}`);
  ok(withUp('c2').contracts.length === base.contracts.length + 1, 'c2 one more contract dealt',
     `${base.contracts.length} -> ${withUp('c2').contracts.length}`);
  ok(withUp('c3').contractPay({ pay: 100 }) === 140, 'c3 pays 40% more');
  // ⚠️ an upgrade must NOT move the seeded stream, or two players on the same
  // seed get different towns because one of them went shopping.
  ok(withUp('b1')._rs === base._rs && withUp('c1')._rs === base._rs,
     'upgrades consume no rng');
}

// ── 7. the board behaves over a whole week ─────────────────────────────────
head('the board across a run');
{
  const g = new Game({ seed: 31, meta: freshMeta() });
  ok(g.contracts.length === 3, 'three dealt at the start', String(g.contracts.length));
  ok(g.board().every(v => v && v.title && v.giver), 'board() view is complete');
  ok(g.contracts.every(c => (g.contractDef(c.id).day || 0) <= 0), 'only day-0 offers on Monday');
  // same seed deals the same hand; a different seed does not
  const same = new Game({ seed: 31, meta: freshMeta() });
  const other = new Game({ seed: 32, meta: freshMeta() });
  ok(JSON.stringify(g.contracts.map(c => c.id)) === JSON.stringify(same.contracts.map(c => c.id)),
     'same seed deals the same hand');
  ok(JSON.stringify(g.contracts.map(c => c.id)) !== JSON.stringify(other.contracts.map(c => c.id)),
     'a different seed deals a different hand');
  // roll the week and make sure later givers actually appear
  const seen = new Set(g.contracts.map(c => c.id));
  for (let d = 1; d < 7; d++) { g.day = d; g._contractDay(); g.contracts.forEach(c => seen.add(c.id)); }
  ok(seen.size >= 6, 'the board turns over across the week', String(seen.size));
  ok([...seen].some(id => (g.contractDef(id).day || 0) >= 2), 'late-week givers get dealt');
}

// ── 8. a full policy run that TAKES jobs still completes ───────────────────
head('a run that works the board');
{
  let done = 0, throws = 0;
  for (let seed = 1; seed <= 24; seed++) {
    const g = new Game({ seed, meta: freshMeta() });
    try {
      let guard = 0;
      while (!g.over && guard++ < 400) {
        for (const v of g.board()) if (v.state === 'open') g.act('takeJob', v.id);
        g.act('endBlock', 'test');
      }
      done += g.stats.contracts || 0;
    } catch (e) { throws++; console.log('  ✗ threw seed ' + seed + ': ' + e.message); }
  }
  ok(throws === 0, 'no throws taking every job across 24 seeds', String(throws));
  // ⚠️ A bot that only ends blocks can only finish the clock-based jobs, so a
  // low number here is CORRECT. Zero would mean the check never fires at all.
  ok(done > 0, 'clock-satisfiable jobs complete in a real run loop', String(done));
}

console.log(`\n${fail ? '✗' : '✓'} contracts — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
