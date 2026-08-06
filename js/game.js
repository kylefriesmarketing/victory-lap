// VICTORY LAP — game.js
// The entire sim. DOM-free: importable in Node for tests/soak.mjs.
// All sim randomness goes through this.rng (seeded LCG). View code may use Math.random.

import {
  TUNING as T, WORLD, BUILDINGS, ALLEY_GAPS, STRIP_Y, EXTERIOR_PROPS, GARAGE,
  WEAPON_SPAWNS, INTERIORS, ARCHETYPES, OUTFITS, NAMED, POPULATION, SPOTS,
  BARKS, SCHEME, ENDINGS, BLOCK_NAMES, DAY_NAMES, WEATHER_KINDS, MENU, RIP,
} from './data.js';

export { T, WORLD, BUILDINGS, ALLEY_GAPS, STRIP_Y, EXTERIOR_PROPS, GARAGE, INTERIORS,
         ARCHETYPES, OUTFITS, NAMED, BARKS, SCHEME, ENDINGS, BLOCK_NAMES, DAY_NAMES, MENU, RIP };

const WEAPONS = {
  fist:   { dmg: T.punchDmg, range: 34, dur: Infinity, kb: 130, label: 'fists' },
  bottle: { dmg: [12, 17], range: 38, dur: 2, kb: 170, throwable: true, label: 'a bottle' },
  chair:  { dmg: [15, 22], range: 46, dur: 5, kb: 240, label: 'a folding chair' },
  cue:    { dmg: [13, 19], range: 56, dur: 4, kb: 190, label: 'a pool cue' },
  sign:   { dmg: [11, 16], range: 44, dur: 6, kb: 200, label: 'a DAYBREAK COMMONS sign' },
  crowbar:{ dmg: [16, 22], range: 42, dur: 30, kb: 210, label: 'the crowbar' },
};

let _eid = 1;

export class Game {
  constructor(opts = {}) {
    this.opts = opts;
    this.seed = (opts.seed ?? 1) >>> 0;
    this._rs = (this.seed * 747796405 + 2891336453) >>> 0;
    this.cb = opts.cb || {};
    this.meta = opts.meta || { runs: 0, cred: 0, scars: 0, lessons: 0, rep: 0, cashBanked: 0,
                               knows: { window: false, blind: false, drop: false, dog: false } };
    this.time = 0;               // total sim seconds this run
    this.day = 0; this.block = 0; this.blockT = 0;
    this.bonusBlocks = 0;        // Rip extends today
    this.blocksToday = T.blocksPerDay;
    this.over = false; this.ending = null;
    this.heat = 0; this._heatStageSeen = 0;
    this.room = 'ext';
    this.player = {
      x: 420, y: 1120, vx: 0, vy: 0, facing: 0, hp: T.hpMax, hpMax: T.hpMax,
      stamina: T.staminaMax, held: null, carryCrate: false, atkT: 0, hitT: 0, hitDir: 0,
      cash: T.startCash, inv: { rip: 0, jerky: 0, crowbar: false, wings: 0 },
      ripToday: 0, ripUses: 0, shakeAmp: 0, sleptAt: null, fired: false, strikes: 0,
      stolenPending: null, debt: 0, debtDue: -1, blackEye: false, cuffedT: 0,
    };
    this.scheme = { hear: false, case: false, tools: false, window: false, job: false, fence: false,
                    crates: 0, inCar: 0, sold: 0, holding: false, cash: 0, garySawYou: false };
    this.npcs = []; this.pickups = []; this.projectiles = [];
    this.stats = { punches: 0, koGiven: 0, koTaken: 0, skimmed: 0, shifts: 0, rip: 0,
                   crimesSeen: 0, cuffsEscaped: 0, spent: 0, earned: 0 };
    this.log = [];
    this.weatherDeck = [];
    for (let i = 0; i < T.days; i++) this.weatherDeck.push(this.pick(WEATHER_KINDS));
    this.solidsCache = {};
    this.gameBarnDark = false;
    this.reggieSpawned = false;
    this.dogCalm = !!this.meta.knows.dog;
    this._spawnWeapons();
    this._populate();
  }

  // ---- rng ----------------------------------------------------------------
  rng() { this._rs = (this._rs * 1664525 + 1013904223) >>> 0; return this._rs / 4294967296; }
  ri(a, b) { return a + Math.floor(this.rng() * (b - a + 1)); }
  rr(a, b) { return a + this.rng() * (b - a); }
  pick(arr) { return arr[Math.floor(this.rng() * arr.length)]; }
  chance(p) { return this.rng() < p; }

  note(t) { this.log.push(`[d${this.day}b${this.block}] ${t}`); if (this.log.length > 400) this.log.shift(); }
  say(who, text, x, y) { this.cb.bark && this.cb.bark(who, text, x, y); }
  alert(t, kind) { this.note(t); this.cb.alert && this.cb.alert(t, kind); }
  sfx(n, x, y) { this.cb.sfx && this.cb.sfx(n, x, y); }
  fx(kind, x, y, d) { this.cb.fx && this.cb.fx(kind, x, y, d); }

  get weather() { return this.weatherDeck[this.day] || 'clear'; }
  get blockName() { return this.block >= T.blocksPerDay ? 'BONUS' : BLOCK_NAMES[this.block]; }
  get dayName() { return DAY_NAMES[this.day] || 'MONDAY'; }
  get isLate() { return this.block >= 3; }

  heatStage() {
    if (this.heat >= T.heatStage.wanted) return 3;
    if (this.heat >= T.heatStage.named) return 2;
    if (this.heat >= T.heatStage.noticed) return 1;
    return 0;
  }

  // ---- world geometry -----------------------------------------------------
  solids(room = this.room) {
    if (this.solidsCache[room]) return this.solidsCache[room];
    const s = [];
    if (room === 'ext') {
      // strip buildings (minus alley gaps handled by per-building rects)
      for (const b of BUILDINGS) s.push({ x: b.x, y: STRIP_Y.roofTop, w: b.w, h: STRIP_Y.base - STRIP_Y.roofTop, door: b.key });
      s.push({ x: GARAGE.x, y: GARAGE.y, w: GARAGE.w, h: GARAGE.h, door: 'garage' });
      for (const p of EXTERIOR_PROPS) {
        if (p.kind === 'pumps') s.push({ x: p.x, y: p.y, w: p.w, h: p.h });
        if (p.kind === 'dumpster') s.push({ x: p.x, y: p.y, w: p.w, h: p.h });
        if (p.kind === 'yourCar' || p.kind === 'carRow') s.push({ x: p.x, y: p.y, w: p.w || 110, h: p.h || 60 });
        if (p.kind === 'busShelter') s.push({ x: p.x, y: p.y, w: p.w, h: 12 });
        if (p.kind === 'kiddiePool') s.push({ x: p.x, y: p.y, w: p.w, h: p.h });
      }
      // world edges
      s.push({ x: -40, y: 0, w: 40, h: WORLD.h }, { x: WORLD.w, y: 0, w: 40, h: WORLD.h });
      s.push({ x: 0, y: -40, w: WORLD.w, h: 40 }, { x: 0, y: WORLD.h, w: WORLD.w, h: 40 });
      // south houses (set dressing, solid)
      s.push({ x: 760, y: 1200, w: 180, h: 140 }, { x: 1000, y: 1220, w: 160, h: 120 },
             { x: 1250, y: 1200, w: 200, h: 140 }, { x: 1550, y: 1230, w: 170, h: 120 });
    } else {
      const it = INTERIORS[room];
      s.push({ x: -20, y: -20, w: it.w + 40, h: 20 }, { x: -20, y: it.h, w: it.w + 40, h: 20 });
      s.push({ x: -20, y: 0, w: 20, h: it.h }, { x: it.w, y: 0, w: 20, h: it.h });
      if (it.counter) s.push({ ...it.counter });
      if (room === 'gamebarn') s.push({ x: 300, y: 220, w: 24, h: 140 }, { x: 460, y: 250, w: 24, h: 110 }); // shelves
      if (room === 'wingbarn') s.push({ x: 480, y: 220, w: 180, h: 60 }, { x: 480, y: 320, w: 180, h: 60 }); // booths
      if (room === 'buffet') s.push({ x: 340, y: 90, w: 280, h: 54 }, { x: 120, y: 250, w: 160, h: 60 });    // steam table, booth
      if (room === 'garage') s.push({ x: 60, y: 60, w: 120, h: 50 }, { x: 460, y: 60, w: 120, h: 70 });      // cot, shelves
    }
    this.solidsCache[room] = s;
    return s;
  }

  inGap(x) { return ALLEY_GAPS.some(g => x > g.x1 + 8 && x < g.x2 - 8); }

  collide(e, r) {
    // circle-ish vs rects; strip buildings pass through at alley gaps
    const sol = this.solids();
    for (const s of sol) {
      if (this.room === 'ext' && s.y === STRIP_Y.roofTop && this.inGap(e.x)) continue;
      const cx = Math.max(s.x, Math.min(e.x, s.x + s.w));
      const cy = Math.max(s.y, Math.min(e.y, s.y + s.h));
      const dx = e.x - cx, dy = e.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        const d = Math.sqrt(d2) || 0.001;
        e.x = cx + (dx / d) * r; e.y = cy + (dy / d) * r;
      }
    }
  }

  // ---- population ---------------------------------------------------------
  _spawnWeapons() {
    this.pickups = [];
    for (const w of WEAPON_SPAWNS) {
      if (this.chance(0.85)) this.pickups.push({ id: _eid++, kind: w.kind, x: w.x + this.ri(-30, 30), y: w.y + this.ri(-20, 20) });
    }
  }

  _mkNpc(def) {
    const arch = def.arch || this.pick(Object.keys(ARCHETYPES));
    const okey = def.outfitKey || 'denim';
    const opool = OUTFITS[okey] || OUTFITS.denim;
    const outfit = def.outfit || { shirt: opool.shirt, pants: opool.pants };
    return {
      id: _eid++, name: def.name || null, key: def.key || null, arch, outfit,
      skin: def.skin || (opool.skins ? this.pick(opool.skins) : '#c99b74'),
      hat: def.hat || (this.chance(0.5) ? this.pick(['cap', 'capBack', 'trucker', 'beanie', 'none']) : 'none'),
      x: def.x, y: def.y, hx: def.x, hy: def.y, vx: 0, vy: 0, facing: this.rr(0, 6.28),
      hp: def.hp || 46, state: 'idle', stateT: this.rr(0, 3), atkT: 0, hitT: 0, hitDir: 0,
      drunk: def.drunk || false, filmer: false, cop: !!def.cop, brawler: !!def.brawler,
      ko: false, koT: 0, barkT: this.rr(4, 14), pool: def.pool || 'townie_idle',
      wpt: 0, route: def.route || null, static: !!def.static, room: def.room || 'ext',
      tourist: okey.startsWith('tourist'),
    };
  }

  _populate() {
    this.npcs = this.npcs.filter(n => n.persistent);
    const pop = POPULATION[BLOCK_NAMES[Math.min(this.block, 3)].toLowerCase()] || POPULATION.late;
    for (const grp of pop) {
      for (let i = 0; i < grp.n; i++) {
        const spot = this.pick(SPOTS[grp.spots]);
        const n = this._mkNpc({
          x: spot[0] + this.ri(-24, 24), y: spot[1] + this.ri(-16, 16),
          outfitKey: this.pick(grp.outfits), drunk: grp.drunk ? this.chance(grp.drunk) : false,
        });
        if (n.drunk) n.pool = 'drunk';
        else if (this.isLate) n.pool = 'townie_late';
        if (n.tourist) n.pool = 'tourist';
        this.npcs.push(n);
      }
    }
    // named NPCs by schedule (exterior)
    if (this.block >= 2 && !this.over) { // evening & late
      this.npcs.push(this._mkNpc({ key: 'peanut', name: 'Peanut', ...NAMED.peanut, x: 260, y: 640, pool: 'peanut', static: true }));
      if (this.block === 2) {
        this.npcs.push(this._mkNpc({ key: 'chuck', name: 'Chuck', ...NAMED.chuck, x: 980, y: 790, brawler: true, hp: 70, pool: 'chuck' }));
        this.npcs.push(this._mkNpc({ key: 'tanner', name: 'Tanner', ...NAMED.tanner, x: 1030, y: 820, brawler: true, hp: 62, pool: 'tanner' }));
      }
    }
    // cops
    if (this.block === 1) this._spawnCop('tapp', [[500, 505], [1300, 505], [1900, 508], [1000, 1060]]);
    if (this.block >= 2) this._spawnCop('brill', [[1880, 508], [1100, 505], [520, 508], [900, 1060], [1500, 1060]]);
    if (this.heatStage() >= 3) { this._spawnCop('tapp', [[600, 700]]); this._spawnCop('brill', [[1600, 700]]); }
    // debt collector
    if (this.player.debt > 0 && this.day >= 5 && this.block >= 2 && !this.reggieSpawned) {
      this.reggieSpawned = true;
      this.npcs.push(this._mkNpc({ key: 'reggie', name: 'Big Reggie', arch: 'broad', outfit: { shirt: '#3a3a36', pants: '#22221e' },
        hat: 'beanie', x: 1150, y: 900, brawler: true, hp: 120, pool: 'drunk' }));
      this.alert('Somebody built like a vending machine is asking around for you.', 'warn');
    }
  }

  _spawnCop(key, route) {
    const d = NAMED[key];
    this.npcs.push(this._mkNpc({ key, name: d.name, ...d, x: route[0][0], y: route[0][1], route, hp: 90, pool: 'cop_noticed' }));
  }

  // ---- clock --------------------------------------------------------------
  endBlock(reason) {
    if (this.over) return;
    this.blockT = 0;
    this.block++;
    const last = this.blocksToday - 1 + this.bonusBlocks;
    if (this.block > last) return this.endDay();
    this.cb.blockEnd && this.cb.blockEnd(reason);
    this._populate();
    this.note(`block -> ${this.blockName} (${reason})`);
  }

  endDay() {
    const p = this.player;
    // heat cools overnight — the Flats cool it double
    const garage = p.sleptAt === 'garage';
    this.heat = Math.max(0, this.heat - (garage ? T.heatDecayGarage : T.heatDecayNight));
    if (!p.sleptAt) { p.hpMax = Math.max(40, p.hpMax - T.fatigueNoSleepHp); this.alert('You never slept. Everything is loud and slightly to the left.', 'warn'); }
    else { p.hp = Math.min(p.hpMax, p.hp + T.sleepHeal); }
    // rip bill comes due
    this.blocksToday = T.blocksPerDay - (p.ripToday > 0 ? T.ripCrashBlocks : 0);
    p.shakeAmp = p.ripToday > 0 ? T.ripShakeAmp : Math.max(0, p.shakeAmp - 1);
    if (p.ripToday > 0) this.alert('The Rip bill arrives: the day is one block shorter and your hands disagree with each other.', 'warn');
    p.ripToday = 0; this.bonusBlocks = 0; p.sleptAt = null;
    // holding the haul overnight?
    if (this.scheme.holding && this.scheme.inCar > 0 && this.chance(T.holdAmbushChance)) this._holdAmbush();
    this.day++;
    this.block = 0; this.blockT = 0;
    if (this.day >= T.days) return this.endGame(this.scheme.fence ? 'WALKING' : 'STUCK');
    this.cb.dayEnd && this.cb.dayEnd();
    this._spawnWeapons();
    this._populate();
    this.note(`day -> ${this.dayName} (${this.weather})`);
    if (this.day === 4 && this.player.debt > 0) this.alert(`Roxy's text: "friday. ${this.player.debt}. window one. don't make it a window two situation."`, 'warn');
  }

  _holdAmbush() {
    this.alert('Word got out you\'re sitting on merchandise. Somebody visited the beater overnight.', 'bad');
    const lost = Math.min(this.scheme.inCar, 1 + (this.chance(0.4) ? 1 : 0));
    this.scheme.inCar -= lost;
    if (this.chance(0.5)) { this.player.hp -= this.ri(15, 30); this.alert(`You caught them at it. You kept ${this.scheme.inCar} crate${this.scheme.inCar === 1 ? '' : 's'} and some bruises.`, 'bad'); }
    else this.alert(`${lost} crate${lost === 1 ? '' : 's'} walked off into the night.`, 'bad');
    if (this.player.hp <= 0) this.endGame('BODIED');
  }

  sleep() {
    const p = this.player;
    if (this.room !== 'garage') return { ok: false, msg: 'Sleep happens at the garage. Everything else is just passing out.' };
    p.sleptAt = 'garage';
    if (this.meta.runs > 0 && this.block <= 1) this.say('Bev', this.pick(BARKS.bev), 0, 0);
    const d0 = this.day;
    while (!this.over && this.day === d0) this.endBlock('slept');
    return { ok: true };
  }

  layLow() {
    if (this.room === 'ext') return { ok: false, msg: 'Laying low works better indoors. That\'s the low part.' };
    this.heat = Math.max(0, this.heat - T.heatDecayLayLow);
    this.endBlock('laid low');
    return { ok: true, msg: 'You watch a door for two hours. The scanner gets bored of you.' };
  }

  // ---- economy ------------------------------------------------------------
  _spend(amt) { const p = this.player; if (p.cash < amt) return false; p.cash = Math.round((p.cash - amt) * 100) / 100; this.stats.spent += amt; return true; }
  _earn(amt) { const p = this.player; p.cash = Math.round((p.cash + amt) * 100) / 100; this.stats.earned += amt; }

  buy(what) {
    const p = this.player, r = this.room;
    const items = {
      rip:    { room: 'qwikstop', cost: T.ripCost, do: () => { p.inv.rip++; } },
      jerky:  { room: 'qwikstop', cost: T.jerkyCost, do: () => { p.inv.jerky++; } },
      wings:  { room: 'wingbarn', cost: T.wingsCost, do: () => { p.hp = Math.min(p.hpMax, p.hp + T.wingsHeal); } },
      buffet: { room: 'buffet', cost: T.buffetCost, do: () => {
        p.hp = Math.min(p.hpMax, p.hp + T.buffetHeal);
        if (this.chance(T.buffetGreaseChance)) { p.hp -= T.buffetGreaseDmg; this.alert('The steam table exacts its toll.', 'warn'); }
      } },
      crowbar:{ room: 'hardware', cost: T.crowbarCost, do: () => { p.inv.crowbar = true; this._schemeCheck('tools'); } },
    };
    const it = items[what];
    if (!it) return { ok: false };
    if (r !== it.room) return { ok: false, msg: 'Wrong counter.' };
    if (!this._spend(it.cost)) return { ok: false, msg: 'You are, in the regional dialect, broke.' };
    it.do();
    if (p.stolenPending === what) p.stolenPending = null;
    this.sfx('register');
    return { ok: true };
  }

  shoplift(what) {
    // grab from the rack, skip the counter. If the clerk clocks you on the way out, heat.
    const p = this.player;
    const valid = { qwikstop: ['rip', 'jerky'], hardware: ['crowbar'] };
    if (!(valid[this.room] || []).includes(what)) return { ok: false };
    if (what === 'crowbar') { p.inv.crowbar = true; this._schemeCheck('tools'); }
    else p.inv[what]++;
    p.stolenPending = what;
    return { ok: true, msg: 'It\'s in your jacket. The door is very far away now.' };
  }

  exitShopCheck() {
    const p = this.player;
    if (!p.stolenPending) return;
    if (this.chance(0.8)) {
      this.addHeat(T.heatCrime.shoplift, 1, 'shoplifting');
      this.alert('The clerk absolutely saw that. The scanner hears about you within the minute.', 'bad');
      this.sfx('yell');
    } else this.alert('Out the door. Nobody looked up from their phone. God bless the phone.', 'ok');
    p.stolenPending = null;
  }

  takeLoan() {
    const p = this.player;
    if (this.room !== 'cashking') return { ok: false };
    if (p.debt > 0) return { ok: false, msg: 'Roxy taps the glass: one kingdom, one debt.' };
    p.debt = T.loanOwed; p.debtDue = 4;
    this._earn(T.loanPrincipal);
    this.say('Roxy', BARKS.roxy[1], 0, 0);
    return { ok: true, msg: `+$${T.loanPrincipal}. You owe $${T.loanOwed} by Friday. The glass does not do extensions.` };
  }

  payLoan() {
    const p = this.player;
    if (this.room !== 'cashking' || p.debt <= 0) return { ok: false };
    if (!this._spend(p.debt)) return { ok: false, msg: 'Not enough. The glass is patient. Reggie is not.' };
    p.debt = 0;
    return { ok: true, msg: 'Paid. Roxy nods one entire time.' };
  }

  useRip() {
    const p = this.player;
    if (p.inv.rip <= 0) return { ok: false, msg: 'No Rip on you. The QwikStop cooler hums your name.' };
    p.inv.rip--; p.ripToday++; p.ripUses++; this.stats.rip++;
    if (p.ripToday === 1) { this.bonusBlocks += T.ripBonusBlocks; this.alert('The Rip hits. The day grows a fifth block it did not earn. Tomorrow knows.', 'ok'); }
    else this.alert('More Rip. Your heartbeat is now audible to others.', 'warn');
    if (p.ripUses >= T.addictionWarm) this.alert(`Addiction meter: warming (${p.ripUses} this week). The buff is quietly filing to become a requirement.`, 'warn');
    this.sfx('crack');
    return { ok: true };
  }

  feedDog() {
    const p = this.player;
    if (p.inv.jerky <= 0) return { ok: false, msg: 'Buster sniffs your empty hands and files a complaint.' };
    p.inv.jerky--; this.dogCalm = true; this.meta.knows.dog = true;
    this.say('Buster', BARKS.buster[1], 560, 1180);
    return { ok: true };
  }

  // ---- the job (Wing Barn) ------------------------------------------------
  shiftAvailable() {
    return !this.player.fired && this.room === 'wingbarn' && (this.block === 1 || this.block === 2);
  }

  // Live: main.js runs the register minigame and calls finishShift.
  // Headless: doShiftAuto resolves through the same bookkeeping.
  finishShift({ perfect = 0, total = 8, skimmed = 0, caught = 0 }) {
    const p = this.player;
    let pay = Math.round(T.shiftPay * Math.min(1, total / 8)) + perfect * T.tipPerPerfect;
    this._earn(pay + skimmed);
    this.stats.shifts++; this.stats.skimmed += skimmed;
    p.strikes += caught;
    let msg = `Shift done. $${pay} on the books` + (skimmed ? `, $${skimmed} under them.` : '.');
    if (caught) msg += ` Dale squints at the drawer. Strike ${p.strikes}.`;
    if (p.strikes >= T.skimStrikeLimit) { p.fired = true; msg += ' Dale, quietly devastated: "We were a FAMILY." You are fired.'; }
    this.alert(msg, caught ? 'warn' : 'ok');
    if (this.stats.shifts === 2 && !this.scheme.window) {
      this._schemeCheck('window');
      this.alert('Through the drive-thru window you hear Gary telling Dale: bank drop Thursday night. Whole store, empty, nine o\'clock.', 'scheme');
    }
    this.endBlock('worked a shift');
    return { fired: p.fired };
  }

  doShiftAuto(skimRate = 0) {
    if (!this.shiftAvailable()) return { ok: false };
    const orders = 8;
    let perfect = 0, skimmed = 0, caught = 0;
    for (let i = 0; i < orders; i++) {
      if (this.chance(0.62 - this.player.shakeAmp * 0.06)) perfect++;
      if (this.chance(skimRate)) {
        if (this.chance(0.25 + this.player.shakeAmp * 0.08)) caught++;
        else skimmed += this.ri(2, 5);
      }
    }
    return { ok: true, ...this.finishShift({ perfect, total: orders, skimmed, caught }) };
  }

  // ---- the scheme ---------------------------------------------------------
  _schemeCheck(stage) {
    if (this.scheme[stage]) return;
    this.scheme[stage] = true;
    const s = SCHEME.stages.find(s => s.id === stage);
    this.cb.scheme && this.cb.scheme(stage);
    this.alert(`SCHEME — ${s ? s.label : stage}: done.`, 'scheme');
  }

  talkPeanut() {
    if (!this.scheme.hear) {
      this._schemeCheck('hear');
      return { name: 'Peanut', text: BARKS.peanut[0] };
    }
    if (!this.scheme.window) {
      this._schemeCheck('window');
      return { name: 'Peanut', text: BARKS.peanut[1] };
    }
    if (!this.meta.knows.window) {
      this.meta.knows.window = true;
      return { name: 'Peanut', text: BARKS.peanut[2] };
    }
    return { name: 'Peanut', text: this.pick(BARKS.peanut.slice(3)) };
  }

  caseAlley() {
    // at the milk-crate window behind Game Barn
    this._schemeCheck('case');
    this.meta.knows.window = true;
    return { ok: true, msg: 'A window over the dumpster, propped on a milk crate since the AC died. Gary thinks raccoons. You are the raccoons now.' };
  }

  canHeist() {
    const s = this.scheme;
    return s.hear && s.case && this.player.inv.crowbar && this.isLate && this.room === 'ext'
      && s.crates < T.crateCount && this._garyNight !== this.day; // caught once = the night is blown
  }

  heistWindowOpen() { // Thursday late is the drop window
    return this.scheme.window && this.day === 3 && this.isLate;
  }

  startHeist() {
    if (!this.canHeist()) return { ok: false, msg: 'Not yet. Wrong time, wrong tools, or wrong facts.' };
    if (this._heistNight !== this.day && !this.heistWindowOpen() && this.chance(0.4)) {
      this.scheme.garySawYou = true;
      this._garyNight = this.day; // he's awake now; tonight is over
      this.addHeat(T.heatCrime.breakin * 0.5, 0, 'attempted entry');
      return { ok: false, caught: 'gary', msg: 'The window gives — onto Gary, doing inventory in the dark to save the light bill. "...I\'m calling somebody. I don\'t know who yet. GET OUT."' };
    }
    this.room = 'gamebarn'; this.gameBarnDark = true;
    this._heistNight = this.day;
    this.player.x = 620; this.player.y = 80;
    this.addHeat(this.heistWindowOpen() ? 0 : T.heatCrime.breakin * 0.3, 0, 'entry');
    this.sfx('pry');
    return { ok: true, msg: 'The window swings. The store is dark and smells like 1997.' };
  }

  grabCrate() {
    if (this.room !== 'gamebarn' || !this.gameBarnDark) return { ok: false };
    if (this.scheme.crates >= T.crateCount) return { ok: false, msg: 'The back room is bare. Gary\'s whole retirement, in your trunk.' };
    if (this.player.carryCrate) return { ok: false, msg: 'One at a time. They weigh what dreams weigh: a lot.' };
    this.player.carryCrate = true; this.player._crateSeen = false;
    return { ok: true, msg: 'FunStation, factory sealed. Heavier than it looks. Move.' };
  }

  stashCrate() { // at the beater
    const p = this.player;
    if (!p.carryCrate) return { ok: false };
    p.carryCrate = false;
    this.scheme.crates++; this.scheme.inCar++;
    if (this.scheme.crates >= 1) this._schemeCheck('job');
    this.sfx('trunk');
    return { ok: true, msg: `Crate ${this.scheme.crates} of ${T.crateCount} in the beater.` };
  }

  heistTripAuto() {
    // headless carry-trip: same heat/state changes, risk resolved by roll
    if (this.room !== 'gamebarn') return { ok: false };
    const trip = this.scheme.crates;
    if (trip >= T.crateCount) return { ok: false };
    const risk = T.heistPatrolRisk[Math.min(trip, 2)] * (this.heistWindowOpen() ? 0.5 : 1);
    this.player.carryCrate = true;
    if (this.chance(risk)) {
      this.addHeat(T.heatCrime.heistSeen, this.ri(1, 2), 'seen mid-heist');
      if (this.chance(0.5)) { this.player.carryCrate = false; this.room = 'ext'; this.player.x = 1540; this.player.y = 160;
        return { ok: true, seen: true, escaped: true }; }
      this.player.carryCrate = false;
      return { ok: true, seen: true, escaped: false };
    }
    this.player.carryCrate = false;
    this.scheme.crates++; this.scheme.inCar++;
    if (this.scheme.crates >= 1) this._schemeCheck('job');
    return { ok: true, seen: false };
  }

  fenceHaul(haggle = false) {
    const s = this.scheme;
    if (this.room !== 'cashking' || s.inCar <= 0) return { ok: false, msg: 'Window 2 has nothing to discuss with an empty trunk.' };
    let per = T.crateFenceBase;
    let line = BARKS.roxy_fence[1];
    if (haggle) {
      if (this.chance(T.haggleOdds)) { per += T.crateHaggleWin; line = '"...Fine. Don\'t tell the glass."'; }
      else { per -= T.crateHaggleLose; line = '"Cute. Now it\'s sixty. Ask again, it\'s a donation."'; }
    }
    const n = s.inCar, take = per * n;
    s.inCar = 0; s.sold += n; s.cash += take; s.holding = false;
    this._earn(take);
    this._schemeCheck('fence');
    this.say('Roxy', line, 0, 0);
    return { ok: true, msg: `${n} crate${n === 1 ? '' : 's'} → $${take}. ${BARKS.roxy_fence[0]}` };
  }

  holdForBuyer() {
    if (this.scheme.inCar <= 0) return { ok: false };
    this.scheme.holding = true;
    return { ok: true, msg: 'You\'ll wait for the Sunday buyer. Half again the money — every night the trunk full of reasons to visit you.' };
  }

  sundayBuyer() {
    const s = this.scheme;
    if (this.day !== 6 || s.inCar <= 0) return { ok: false };
    const take = Math.round(T.crateFenceBase * T.holdBuyerMult) * s.inCar;
    const n = s.inCar;
    s.inCar = 0; s.sold += n; s.cash += take; s.holding = false;
    this._earn(take);
    this._schemeCheck('fence');
    return { ok: true, msg: `A guy in a clean truck counts out $${take} without saying one word. City people, man.` };
  }

  walkOut() {
    if (!this.scheme.fence) return { ok: false, msg: 'The bus costs nothing. Leaving with nothing costs everything. Finish it first.' };
    if (this.block !== 0) return { ok: false, msg: 'The 6 a.m. is a morning creature.' };
    return this.endGame('WALKING');
  }

  // ---- heat ---------------------------------------------------------------
  addHeat(base, extraWitnesses = 0, why = '') {
    // a crowd makes it worse, but never apocalyptic — one punch shouldn't near-max the county
    let mult = Math.min(2.5, 1 + Math.max(0, this.countWitnesses() + extraWitnesses - 1) * 0.5);
    if (this.heatStage() >= 2) mult *= T.namedGainMult;
    if (this.weather === 'rain') mult *= 0.8; // cops stay in the car
    this.heat = Math.min(T.heatMax, this.heat + base * mult);
    this.stats.crimesSeen++;
    this.note(`heat +${Math.round(base * mult)} (${why}) -> ${Math.round(this.heat)}`);
    const st = this.heatStage();
    if (st > this._heatStageSeen) {
      this._heatStageSeen = st;
      this.cb.heatStage && this.cb.heatStage(st);
      if (st === 1) this.alert('Scanner: "…got eyes on that Delacroix kid again. No action. Just — eyes."', 'heat');
      if (st === 2) this.alert('NAMED. Cops don\'t chase you at this stage. They wave. They mention your grandmother. It\'s worse.', 'heat');
      if (st === 3) this.alert('WANTED. That\'s both cars. Both of them start today, apparently. Run.', 'heat');
    }
  }

  countWitnesses() {
    if (this.room !== 'ext') return 0;
    let w = 0;
    for (const n of this.npcs) {
      if (n.ko || n.room !== 'ext') continue;
      const d = Math.hypot(n.x - this.player.x, n.y - this.player.y);
      if (d < 260) w += n.filmer ? T.filmerMult : 1;
    }
    return Math.round(w);
  }

  // ---- combat -------------------------------------------------------------
  weaponOf(e) { return e.held ? WEAPONS[e.held.kind] : WEAPONS.fist; }

  attack() {
    const p = this.player;
    if (p.atkT > 0 || p.carryCrate || this.over) return;
    const w = this.weaponOf(p);
    p.atkT = T.punchCooldown;
    this.stats.punches++;
    this.sfx('swing', p.x, p.y);
    let hitAny = false;
    for (const n of this.npcs) {
      if (n.ko || n.room !== this.room) continue;
      const dx = n.x - p.x, dy = n.y - p.y, d = Math.hypot(dx, dy);
      if (d > w.range + 12) continue;
      const ang = Math.atan2(dy, dx);
      let da = Math.abs(ang - p.facing); if (da > Math.PI) da = 2 * Math.PI - da;
      if (da > 1.15) continue;
      hitAny = true;
      this.hitNpc(n, this.ri(w.dmg[0], w.dmg[1]), ang, w.kb);
      if (p.held && --p.held.dur <= 0) {
        this.fx('break', n.x, n.y, { kind: p.held.kind });
        this.alert(`${WEAPONS[p.held.kind].label[0].toUpperCase() + WEAPONS[p.held.kind].label.slice(1)} gives its life for the cause.`, 'ok');
        p.held = null;
      }
    }
    if (hitAny) this.sfx('thud', p.x, p.y);
  }

  hitNpc(n, dmg, ang, kb) {
    n.hp -= dmg; n.hitT = 0.22; n.hitDir = ang;
    n.vx += Math.cos(ang) * kb; n.vy += Math.sin(ang) * kb;
    this.fx('impact', n.x, n.y, { ang });
    if (!n.cop && !n.brawler && !n.ko) {
      // civilians: assault, witnessed
      this.addHeat(T.heatCrime.assault, 0, 'assault');
      if (this.chance(0.6)) this.say(n.name || 'Townie', this.pick(BARKS.hit_react), n.x, n.y);
    }
    if (n.hp <= 0 && !n.ko) {
      n.ko = true; n.koT = 0; n.state = 'ko';
      this.stats.koGiven++;
      this.sfx('bodyfall', n.x, n.y);
      this.fx('ko', n.x, n.y, {});
      if (n.key === 'reggie') { this.player.debt = 0; this.alert('Reggie, from the asphalt: "…debt\'s clear. This was the clearing." You believe him.', 'ok'); }
    } else if (!n.cop && (n.brawler || this.chance(n.drunk ? 0.75 : 0.25))) {
      n.state = 'aggro';
    } else if (!n.cop && !n.brawler) {
      n.state = this.chance(0.35) ? 'film' : 'flee';
      if (n.state === 'film') { n.filmer = true; this.say(n.name || 'Townie', this.pick(BARKS.filming), n.x, n.y); }
    }
    if (n.cop) { this.addHeat(30, 1, 'assaulting an officer'); n.state = 'chase'; }
  }

  hitPlayer(dmg, ang, from) {
    const p = this.player;
    p.hp -= dmg; p.hitT = 0.25; p.hitDir = ang;
    p.vx += Math.cos(ang) * 180; p.vy += Math.sin(ang) * 180;
    if (p.carryCrate) { p.carryCrate = false; this.alert('The crate! It skitters. It survives. Barely.', 'warn'); }
    this.fx('impact', p.x, p.y, { ang });
    this.sfx('thud', p.x, p.y);
    if (this.chance(0.15)) p.blackEye = true;
    if (p.hp <= 0 && !this.over) this.endGame('BODIED');
  }

  throwHeld() {
    const p = this.player;
    if (!p.held || !WEAPONS[p.held.kind].throwable) {
      if (p.held) { // drop it
        this.pickups.push({ id: _eid++, kind: p.held.kind, x: p.x + Math.cos(p.facing) * 24, y: p.y + Math.sin(p.facing) * 24, dur: p.held.dur });
        p.held = null;
        return { ok: true };
      }
      return { ok: false };
    }
    this.projectiles.push({ id: _eid++, kind: p.held.kind, x: p.x, y: p.y, z: 20,
      vx: Math.cos(p.facing) * 420, vy: Math.sin(p.facing) * 420, vz: 90, t: 0 });
    p.held = null;
    this.sfx('whoosh', p.x, p.y);
    return { ok: true };
  }

  pickupNearby() {
    const p = this.player;
    let best = null, bd = 40;
    for (const it of this.pickups) {
      const d = Math.hypot(it.x - p.x, it.y - p.y);
      if (d < bd) { bd = d; best = it; }
    }
    if (!best) return { ok: false };
    if (p.held) this.pickups.push({ id: _eid++, kind: p.held.kind, x: p.x, y: p.y, dur: p.held.dur });
    p.held = { kind: best.kind, dur: best.dur ?? WEAPONS[best.kind].dur };
    this.pickups = this.pickups.filter(i => i !== best);
    this.sfx('pickup');
    return { ok: true, kind: best.kind };
  }

  // headless brawl: real hit functions, no movement
  brawlAuto(nBrawlers = 2) {
    const foes = [];
    for (let i = 0; i < nBrawlers; i++) {
      const n = this._mkNpc({ x: this.player.x + this.ri(-40, 40), y: this.player.y + this.ri(-40, 40), brawler: true, hp: this.ri(55, 75), outfitKey: 'flannel' });
      this.npcs.push(n); foes.push(n);
    }
    this.addHeat(T.heatCrime.assault, 1, 'lot brawl');
    let rounds = 0;
    while (!this.over && rounds++ < 40) {
      for (const f of foes) if (!f.ko) this.hitNpc(f, this.ri(...T.punchDmg), this.rr(0, 6.28), 100);
      if (foes.every(f => f.ko)) break;
      for (const f of foes) if (!f.ko && this.chance(0.6)) this.hitPlayer(this.ri(...T.npcDmg), this.rr(0, 6.28), f);
      if (this.over) break;
    }
    return { won: foes.every(f => f.ko), hp: this.player.hp };
  }

  // ---- cops: cuffing ------------------------------------------------------
  tryCuff(cop) {
    if (this.over || this.player.cuffedT > 0) return;
    this.player.cuffedT = 1;
    this.say(cop.name, this.pick(BARKS.cop_cuff), cop.x, cop.y);
    this.cb.cuff && this.cb.cuff(cop);
  }

  resolveCuff(escaped) {
    const p = this.player;
    p.cuffedT = 0;
    if (escaped) {
      this.stats.cuffsEscaped++;
      this.addHeat(6, 0, 'resisting');
      p.vx += Math.cos(p.facing) * 300; p.vy += Math.sin(p.facing) * 300;
      for (const n of this.npcs) if (n.cop) { n.stunT = 1.6; }
      this.alert('You twist loose. The scanner uses several words the FCC would mind.', 'warn');
    } else this.endGame('BUSTED');
  }

  cuffAuto() { // headless: escape odds shrink with heat
    const odds = Math.max(0.15, 0.6 - (this.heat - T.heatStage.wanted) * 0.01);
    this.resolveCuff(this.chance(odds));
  }

  // ---- endings ------------------------------------------------------------
  endGame(key) {
    if (this.over) return { ok: false };
    this.over = true; this.ending = key;
    const m = this.meta;
    m.runs++;
    if (key === 'WALKING') { m.rep += 2; m.cashBanked += Math.max(0, Math.round(this.player.cash)); }
    if (key === 'BUSTED') m.cred += 1;
    if (key === 'BODIED') m.scars += 1;
    if (key === 'STUCK') m.lessons += 1;
    const summary = {
      key, day: this.day, dayName: this.dayName, cash: Math.round(this.player.cash),
      heat: Math.round(this.heat), crates: this.scheme.sold, schemeCash: this.scheme.cash,
      stats: { ...this.stats }, meta: { ...m, knows: { ...m.knows } },
      roommate: key === 'BODIED' ? this.pick(BARKS.hospital_roommate) : null,
    };
    this.note(`ENDING: ${key}`);
    this.cb.ending && this.cb.ending(key, summary);
    return { ok: true, key, summary };
  }

  // ---- interactions dispatcher (shared by UI and soak) --------------------
  act(name, arg) {
    const A = {
      sleep: () => this.sleep(), layLow: () => this.layLow(), buy: () => this.buy(arg),
      shoplift: () => this.shoplift(arg), useRip: () => this.useRip(), feedDog: () => this.feedDog(),
      takeLoan: () => this.takeLoan(), payLoan: () => this.payLoan(),
      caseAlley: () => this.caseAlley(), startHeist: () => this.startHeist(),
      grabCrate: () => this.grabCrate(), stashCrate: () => this.stashCrate(),
      fence: () => this.fenceHaul(!!arg), hold: () => this.holdForBuyer(), sundayBuyer: () => this.sundayBuyer(),
      walkOut: () => this.walkOut(), talkPeanut: () => this.talkPeanut(),
      shiftAuto: () => this.doShiftAuto(arg || 0), endBlock: () => { this.endBlock(arg || 'waited'); return { ok: true }; },
      brawlAuto: () => this.brawlAuto(arg || 2), heistTripAuto: () => this.heistTripAuto(),
      exitShopCheck: () => { this.exitShopCheck(); return { ok: true }; },
      enter: () => { return this.enterRoom(arg); }, leave: () => { return this.leaveRoom(); },
    };
    if (!A[name]) return { ok: false, msg: `no act ${name}` };
    return A[name]() || { ok: true };
  }

  enterRoom(key) {
    if (!INTERIORS[key]) return { ok: false };
    // Game Barn front door only when open (morning..evening); the heist goes in the window
    if (key === 'gamebarn' && this.isLate) return { ok: false, msg: 'Locked. The sign flips to CLOSED at dark. Gary sleeps above the shop, allegedly.' };
    if (key === 'hardware' && this.block > 1) return { ok: false, msg: 'Earl closes early. Everything must go, including Earl, at 3 p.m.' };
    this.room = key; this.gameBarnDark = false;
    const it = INTERIORS[key];
    this.player.x = it.w / 2; this.player.y = it.h - 50;
    this.sfx('doorchime');
    return { ok: true };
  }

  leaveRoom() {
    if (this.room === 'ext') return { ok: false };
    const wasShop = ['qwikstop', 'hardware'].includes(this.room);
    const b = BUILDINGS.find(b => b.key === this.room);
    if (b) { this.player.x = b.x + b.w / 2; this.player.y = STRIP_Y.base + 30; }
    else if (this.room === 'garage') { this.player.x = GARAGE.door.x + 20; this.player.y = GARAGE.y - 26; }
    else if (this.room === 'gamebarn') { this.player.x = 1540; this.player.y = 160; } // out the window
    this.room = 'ext';
    this.gameBarnDark = false;
    if (wasShop) this.exitShopCheck();
    return { ok: true };
  }

  // ---- per-frame update ---------------------------------------------------
  update(dt, input) {
    if (this.over) return;
    this.time += dt;
    this.blockT += dt;
    if (this.blockT >= T.blockSeconds) this.endBlock('the clock');
    const p = this.player;

    // player movement
    if (input && p.cuffedT <= 0) {
      let sp = (input.sprint && p.stamina > 2) ? T.sprintSpeed : T.walkSpeed;
      if (p.hp < T.limpBelowHp) sp *= 0.72;
      if (p.carryCrate) sp *= 0.6;
      let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (dx || dy) {
        const d = Math.hypot(dx, dy);
        p.x += (dx / d) * sp * dt; p.y += (dy / d) * sp * dt;
        p.facing = Math.atan2(dy, dx);
        p.moving = true;
        if (input.sprint) p.stamina = Math.max(0, p.stamina - T.sprintDrainPerS * dt);
      } else p.moving = false;
      if (!input.sprint || !p.moving) p.stamina = Math.min(T.staminaMax, p.stamina + T.staminaRegenPerS * dt);
    }
    // knockback decay
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= Math.pow(0.001, dt); p.vy *= Math.pow(0.001, dt);
    p.atkT = Math.max(0, p.atkT - dt);
    p.hitT = Math.max(0, p.hitT - dt);
    this.collide(p, 14);

    // projectiles
    for (const pr of this.projectiles) {
      pr.t += dt; pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      pr.z += pr.vz * dt; pr.vz -= 320 * dt;
      let hit = pr.z <= 0;
      for (const n of this.npcs) {
        if (n.ko || n.room !== this.room) continue;
        if (Math.hypot(n.x - pr.x, n.y - pr.y) < 22 && pr.z < 44) {
          this.hitNpc(n, this.ri(...WEAPONS.bottle.dmg), Math.atan2(pr.vy, pr.vx), 200);
          hit = true; break;
        }
      }
      if (hit) { pr.dead = true; this.fx('shatter', pr.x, pr.y, {}); this.sfx('shatter', pr.x, pr.y); }
    }
    this.projectiles = this.projectiles.filter(pr => !pr.dead);

    // NPCs
    for (const n of this.npcs) this._updateNpc(n, dt);

    // hauling a crate in public is its own confession
    if (p.carryCrate && this.room === 'ext' && !p._crateSeen && this.countWitnesses() > 0) {
      p._crateSeen = true;
      this.addHeat(T.heatCrime.heistSeen * 0.6, 0, 'seen hauling');
      this.alert('Somebody clocked the crate. The word "FUNSTATION" is now moving through Hopewell at group-chat speed.', 'bad');
    }

    // dog
    if (this.room === 'ext' && !this.dogCalm) {
      const d = Math.hypot(560 - p.x, 1190 - p.y);
      if (d < 120 && !this._dogT) { this._dogT = 3; this.say('Buster', BARKS.buster[0], 560, 1180); this.sfx('bark', 560, 1190);
        if (this.heatStage() >= 1) this.addHeat(2, 0, 'the dog is narrating your position'); }
    }
    if (this._dogT) this._dogT = Math.max(0, this._dogT - dt);
  }

  _updateNpc(n, dt) {
    if (n.room !== this.room) return;
    const p = this.player;
    n.atkT = Math.max(0, n.atkT - dt);
    n.hitT = Math.max(0, n.hitT - dt);
    if (n.stunT) { n.stunT = Math.max(0, n.stunT - dt); return; }
    n.x += n.vx * dt; n.y += n.vy * dt;
    n.vx *= Math.pow(0.001, dt); n.vy *= Math.pow(0.001, dt);
    if (n.ko) { n.koT += dt; return; }
    const dToP = Math.hypot(p.x - n.x, p.y - n.y);

    if (n.cop) return this._updateCop(n, dt, dToP);

    switch (n.state) {
      case 'idle': {
        n.stateT -= dt;
        if (n.stateT <= 0) {
          n.stateT = this.rr(2, 6);
          if (this.chance(0.4) && !n.static) { // wander near home
            const a = this.rr(0, 6.28), r = this.rr(20, 70);
            n.tx = n.hx + Math.cos(a) * r; n.ty = n.hy + Math.sin(a) * r;
            n.state = 'walk';
          }
        }
        n.barkT -= dt;
        if (n.barkT <= 0 && dToP < 190 && this.chance(0.5)) {
          n.barkT = this.rr(14, 30);
          this.say(n.name || null, this.pick(BARKS[n.pool] || BARKS.townie_idle), n.x, n.y);
        } else if (n.barkT <= 0) n.barkT = this.rr(8, 16);
        break;
      }
      case 'walk': {
        const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
        if (d < 6) { n.state = 'idle'; break; }
        const sp = n.drunk ? 46 : 62;
        n.x += (dx / d) * sp * dt; n.y += (dy / d) * sp * dt;
        n.facing = Math.atan2(dy, dx);
        if (n.drunk) { n.x += Math.sin(this.time * 3 + n.id) * 22 * dt; }
        break;
      }
      case 'flee': {
        const ang = Math.atan2(n.y - p.y, n.x - p.x);
        n.x += Math.cos(ang) * 140 * dt; n.y += Math.sin(ang) * 140 * dt;
        n.facing = ang;
        if (dToP > 420) { n.state = 'idle'; }
        break;
      }
      case 'film': {
        n.facing = Math.atan2(p.y - n.y, p.x - n.x);
        if (dToP < 90) { const a = Math.atan2(n.y - p.y, n.x - p.x); n.x += Math.cos(a) * 80 * dt; n.y += Math.sin(a) * 80 * dt; }
        if (dToP > 380) { n.state = 'idle'; n.filmer = false; }
        break;
      }
      case 'aggro': {
        const ang = Math.atan2(p.y - n.y, p.x - n.x);
        n.facing = ang;
        if (dToP > 34) { n.x += Math.cos(ang) * 118 * dt; n.y += Math.sin(ang) * 118 * dt; }
        else if (n.atkT <= 0) {
          n.atkT = this.rr(...T.npcAtkCooldown);
          this.sfx('swing', n.x, n.y);
          if (this.chance(0.75)) this.hitPlayer(this.ri(...T.npcDmg), ang, n);
        }
        if (dToP > 520) n.state = 'idle';
        break;
      }
    }
    this.collide(n, 12);
  }

  _updateCop(n, dt, dToP) {
    const p = this.player, st = this.heatStage();
    const seesP = this.room === 'ext' && dToP < T.copSightRange;
    if (st >= 3 && seesP) n.state = 'chase';
    if (n.state === 'chase') {
      const ang = Math.atan2(p.y - n.y, p.x - n.x);
      n.facing = ang;
      const sp = 205; // between walk and sprint — stamina decides the race
      n.x += Math.cos(ang) * sp * dt; n.y += Math.sin(ang) * sp * dt;
      n.barkT -= dt;
      if (n.barkT <= 0) { n.barkT = this.rr(4, 8); this.say(n.name, this.pick(BARKS.cop_wanted), n.x, n.y); }
      if (dToP < T.cuffRange) this.tryCuff(n);
      if (st < 3) n.state = 'patrol';
      this.collide(n, 12);
      return;
    }
    // patrol waypoints
    if (n.route) {
      const w = n.route[n.wpt];
      const dx = w[0] - n.x, dy = w[1] - n.y, d = Math.hypot(dx, dy);
      if (d < 10) n.wpt = (n.wpt + 1) % n.route.length;
      else { n.x += (dx / d) * 55 * dt; n.y += (dy / d) * 55 * dt; n.facing = Math.atan2(dy, dx); }
    }
    n.barkT -= dt;
    if (seesP && n.barkT <= 0 && st >= 1) {
      n.barkT = this.rr(16, 30);
      const pool = st >= 2 ? BARKS.cop_named : BARKS.cop_noticed;
      this.say(n.name, this.pick(pool), n.x, n.y);
    } else if (n.barkT <= 0) n.barkT = this.rr(10, 20);
    // carrying a crate in front of a cop is a confession with handles
    if (seesP && p.carryCrate && !n._sawCrate) { n._sawCrate = true; this.addHeat(T.heatCrime.heistSeen, 0, 'cop saw the crate'); }
    this.collide(n, 12);
  }
}

// ---------------------------------------------------------------------------
// THE POLICY BOT — one bot for Node soak and in-page __vlSoak. Plays the REAL sim.
// ---------------------------------------------------------------------------

export function soakRun(seed, opts = {}) {
  const meta = opts.meta || { runs: 0, cred: 0, scars: 0, lessons: 0, rep: 0, cashBanked: 0,
                              knows: { window: false, blind: false, drop: false, dog: false } };
  const g = new Game({ seed, meta });
  const greed = g.rng(), rage = g.rng(), skim = g.rng() * 0.5, ripFan = g.rng();
  const errors = [];
  const step = (name, arg) => { try { return g.act(name, arg); } catch (e) { errors.push(`${name}: ${e.message}\n${e.stack}`); g.over = true; return { ok: false }; } };

  let guard = 0;
  while (!g.over && guard++ < 400) {
    const b = g.block, d = g.day;
    const assertClock = g.day * 100 + g.block;
    if (b === 0) { // morning
      if (g.scheme.fence && greed < 0.85) { step('walkOut'); if (g.over) break; }
      if (ripFan > 0.6 && g.player.cash > 10 && g.player.inv.rip === 0) {
        step('enter', 'qwikstop'); step('buy', 'rip'); step('leave'); step('useRip');
      }
      if (!g.player.inv.crowbar && g.player.cash >= 25) {
        const r = step('enter', 'hardware');
        if (r.ok) { if (g.chance(0.15)) step('shoplift', 'crowbar'); else step('buy', 'crowbar'); step('leave'); }
      }
      step('endBlock', 'bot-morning');
    } else if (b === 1) { // afternoon: work
      if (!g.player.fired) { step('enter', 'wingbarn'); step('shiftAuto', skim); if (g.room !== 'ext') step('leave'); }
      else step('endBlock', 'bot-noshift');
    } else if (b === 2) { // evening
      if (!g.scheme.hear || !g.scheme.window) step('talkPeanut');
      if (!g.scheme.case) step('caseAlley');
      if (rage > 0.8 && d >= 1 && g.chance(0.5)) { step('brawlAuto', 2); if (g.over) break; }
      if (g.player.debt > 0 && g.player.cash >= g.player.debt) { step('enter', 'cashking'); step('payLoan'); step('leave'); }
      if (g.player.hp < 45 && g.player.cash > 12) { step('enter', 'buffet'); step('buy', 'buffet'); step('leave'); }
      step('endBlock', 'bot-evening');
    } else { // late
      const ready = g.scheme.hear && g.scheme.case && g.player.inv.crowbar && !g.scheme.job;
      const tonight = ready && (g.heistWindowOpen() || d >= 4);
      if (tonight) {
        const r = step('startHeist');
        if (r.ok) {
          for (let t = 0; t < T.crateCount && !g.over; t++) {
            const tr = step('heistTripAuto');
            if (tr.seen && !tr.escaped) { // caught mid-heist → chase → cuff roll
              g.heat = Math.max(g.heat, T.heatStage.wanted + 5);
              g.tryCuff(g.npcs.find(n => n.cop) || g.npcs[0] || { name: 'Officer Brill', x: 0, y: 0 });
              g.cuffAuto();
              break;
            }
          }
          if (!g.over && g.room === 'gamebarn') step('leave');
        }
      }
      if (!g.over && g.scheme.inCar > 0 && !g.scheme.holding) {
        if (greed > 0.7 && d < 5) step('hold');
        else { step('enter', 'cashking'); step('fence', g.chance(0.5)); step('leave'); }
      }
      if (!g.over && g.day === 6 && g.scheme.inCar > 0) step('sundayBuyer');
      if (!g.over) {
        if (g.chance(0.7)) { g.room = 'garage'; step('sleep'); g.room = 'ext'; }
        else step('endBlock', 'bot-late-nosleep');
      }
    }
    if (!g.over && g.day * 100 + g.block <= assertClock && guard > 4) {
      // clock must move every loop
      errors.push(`clock stalled at d${g.day} b${g.block}`);
      break;
    }
    if (Number.isNaN(g.player.cash) || Number.isNaN(g.heat) || Number.isNaN(g.player.hp)) {
      errors.push(`NaN leak: cash=${g.player.cash} heat=${g.heat} hp=${g.player.hp}`); break;
    }
    if (g.heat < 0 || g.heat > T.heatMax) { errors.push(`heat out of bounds: ${g.heat}`); break; }
  }
  if (!g.over) errors.push(`run never ended (guard=${guard})`);
  return { seed, ending: g.ending, day: g.day, cash: Math.round(g.player.cash), heat: Math.round(g.heat),
           crates: g.scheme.sold, shifts: g.stats.shifts, skimmed: g.stats.skimmed, rip: g.stats.rip,
           koGiven: g.stats.koGiven, errors, meta };
}
