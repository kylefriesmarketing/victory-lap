// VICTORY LAP — game.js
// The entire sim. DOM-free: importable in Node for tests/soak.mjs.
// All sim randomness goes through this.rng (seeded LCG). View code may use Math.random.

import {
  TUNING as T, WEAPONS, WORLD, BUILDINGS, ALLEY_GAPS, STRIP_Y, EXTERIOR_PROPS, GARAGE, FOXHOLE,
  DOWNTOWN, DT_Y, RAIL_Y, WATER_TOWER, COURTHOUSE, MAIN_ST, WORKS, BLUFFS, LOOT, SEARCH_SPOTS, HTCC,
  WEAPON_SPAWNS, INTERIORS, ARCHETYPES, OUTFITS, NAMED, POPULATION, SPOTS,
  BARKS, SCHEME, ENDINGS, BLOCK_NAMES, DAY_NAMES, WEATHER_KINDS, MENU, RIP, SKY,
} from './data.js';

export { T, WEAPONS, WORLD, BUILDINGS, ALLEY_GAPS, STRIP_Y, EXTERIOR_PROPS, GARAGE, FOXHOLE,
         DOWNTOWN, DT_Y, RAIL_Y, WATER_TOWER, COURTHOUSE, MAIN_ST, WORKS, BLUFFS, LOOT,
         SEARCH_SPOTS, HTCC, INTERIORS, SKY,
         ARCHETYPES, OUTFITS, NAMED, BARKS, SCHEME, ENDINGS, BLOCK_NAMES, DAY_NAMES, MENU, RIP };

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
      windT: 0, windDir: 0,
      cash: T.startCash, inv: { rip: 0, jerky: 0, crowbar: false, wings: 0 },
      ripToday: 0, ripUses: 0, shakeAmp: 0, sleptAt: null, fired: false, strikes: 0,
      stolenPending: null, debt: 0, debtDue: -1, blackEye: false, cuffedT: 0,
    };
    this.scheme = { hear: false, case: false, tools: false, window: false, job: false, fence: false,
                    crates: 0, inCar: 0, sold: 0, holding: false, cash: 0, garySawYou: false };
    // THE META-PROGRESSION: the town drops the charges, but you keep the map. A player
    // on run 5 starts the scheme further along because THEY know more, not because a
    // number went up. This is the whole roguelike promise — don't quietly delete it.
    this.knewWindow = !!this.meta.knows.window;
    this.knewDrop = !!this.meta.knows.drop;
    if (this.knewWindow) { this.scheme.hear = true; this.scheme.case = true; }
    if (this.knewDrop) this.scheme.window = true;
    this.fox = { paid: -1, visits: 0, drinks: 0, tips: 0, bought: 0, vip: -1 };
    this.dt = { round: -1, shots: 0, seen: false, pallet: -1, worksSeen: false, bluffsSeen: false };
    this.burg = { in: null, t: 0, spots: [], cased: [], done: [], owner: false, entryQuiet: false };
    this.htcc = { classes: 0, classToday: -1, aidPaid: false, gymToday: -1, cart: -1, seen: false, stashed: false };
    this.grudge = 0; this._grudgeSeen = 0; this._ambushDay = -1;
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
      s.push({ x: FOXHOLE.x, y: FOXHOLE.y, w: FOXHOLE.w, h: FOXHOLE.h, door: 'foxhole' });
      // downtown row + the courthouse + the water tower's four legs
      for (const b of DOWNTOWN) s.push({ x: b.x, y: DT_Y.roofTop, w: b.w, h: DT_Y.base - DT_Y.roofTop, door: b.key });
      s.push({ ...COURTHOUSE });
      for (const [lx, ly] of [[-38, 0], [30, 0], [-38, 66], [30, 66]])
        s.push({ x: WATER_TOWER.x + lx, y: WATER_TOWER.y + ly, w: 8, h: 8 });
      // Cassidy Works: the plant, the hall, the gate shack, the containers, the boxcars
      s.push({ ...WORKS.plant });
      s.push({ x: WORKS.hall.x, y: WORKS.hall.y, w: WORKS.hall.w, h: WORKS.hall.h, door: 'unionhall' });
      s.push({ ...WORKS.gate });
      s.push({ ...WORKS.dockOffice });
      for (const b of HTCC.buildings) s.push({ x: b.x, y: b.y, w: b.w, h: b.h, door: b.key });
      // The Bluffs: five houses and the club. The gate arm is NOT solid — the doc
      // says the security is decorative, so the gate is scenery you walk around.
      for (const h of BLUFFS.houses) s.push({ x: h.x, y: h.y, w: h.w, h: h.h, door: h.key });
      s.push({ x: BLUFFS.club.x, y: BLUFFS.club.y, w: BLUFFS.club.w, h: BLUFFS.club.h });
      s.push({ x: 0, y: BLUFFS.lakeY, w: WORLD.w, h: WORLD.h - BLUFFS.lakeY });   // the lake says no
      for (const [cx2, cy2, cw, chh] of [[2480, 1160, 130, 60], [2840, 1120, 150, 64], [3040, 1300, 130, 60], [2660, 1300, 110, 56]])
        s.push({ x: cx2, y: cy2, w: cw, h: chh });   // container stacks
      for (const bx of WORKS.boxcars) s.push({ x: bx, y: RAIL_Y - 36, w: 220, h: 64 });
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
      if (room === 'foxhole') {
        s.push({ ...it.stage });                                                       // the stage is a platform
        s.push({ x: 470, y: 250, w: 150, h: 46 }, { x: 90, y: 320, w: 130, h: 44 });   // booths
      }
      if (room === 'house') s.push({ x: 250, y: 200, w: 190, h: 70 }, { x: 520, y: 320, w: 150, h: 60 }); // sectional, island
      if (room === 'shop') s.push({ x: 330, y: 90, w: 320, h: 70 }, { x: 60, y: 250, w: 140, h: 90 });    // bays, steel rack
      if (room === 'aid') s.push({ x: 90, y: 250, w: 180, h: 60 }, { x: 400, y: 250, w: 150, h: 60 });    // chair rows
      if (room === 'library') s.push({ x: 300, y: 90, w: 300, h: 60 }, { x: 300, y: 200, w: 300, h: 60 }); // stacks
      if (room === 'splitlip') s.push({ ...it.pool }, { x: 70, y: 300, w: 140, h: 44 });        // felt + a booth
      if (room === 'daybreak') s.push({ x: 120, y: 250, w: 200, h: 60 }, { x: 440, y: 260, w: 140, h: 56 }); // communal table, rep table
      if (room === 'pawn') s.push({ x: 60, y: 220, w: 130, h: 120 }, { x: 240, y: 250, w: 120, h: 50 });     // shelf island, case
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
      hp: def.hp || 46, hpMax0: def.hp || 46,
      state: 'idle', stateT: this.rr(0, 3), atkT: 0, hitT: 0, hitDir: 0,
      drunk: def.drunk || false, filmer: false, cop: !!def.cop, brawler: !!def.brawler,
      ko: false, koT: 0, barkT: this.rr(4, 14), pool: def.pool || 'townie_idle',
      wpt: 0, route: def.route || null, static: !!def.static, room: def.room || 'ext',
      tourist: okey.startsWith('tourist'),
      // everyone in Hopewell is carrying something, and the amount is characterisation
      wallet: this.ri(...(T.rollCash[
        def.brawler ? 'alumni' : okey.startsWith('tourist') ? 'tourist' : def.drunk ? 'drunk' : 'townie'
      ])),
      robbed: false, grudge: false,
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
        if (grp.pool) n.pool = grp.pool;              // a spot can bring its own voice
        else if (n.drunk) n.pool = 'drunk';
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
    // SHOPKEEPERS — every interior gets a body. These characters had full archetype,
    // outfit and silhouette specs in data.js and were never once drawn; the interact
    // prompts were talking to a coordinate in an empty room.
    // y sits just ABOVE each counter's top edge — any higher and they stand on the wall
    const STAFF = [
      ['wingbarn', 'dale', 300, 116], ['gamebarn', 'gary', 530, 126],
      ['buffet', 'wanda', 150, 106],  ['hardware', 'earl', 460, 106],
      ['cashking', 'roxy', 320, 106],   // between both windows; she IS both windows
    ];
    for (const [room, key, x, y] of STAFF) {
      if (!this.isOpen(room)) continue;
      const d = NAMED[key];
      this.npcs.push(this._mkNpc({ ...d, key, x, y, room, static: true, pool: BARKS[key] ? key : 'townie_idle' }));
    }
    // the QwikStop clerk has no name and never will; he is a fixture, like the ice machine
    this.npcs.push(this._mkNpc({ arch: 'wiry', outfit: { shirt: '#7a7468', pants: '#3d4c63' }, hat: 'cap',
      name: 'Clerk', x: 170, y: 106, room: 'qwikstop', static: true, pool: 'townie_idle' }));
    // Bev is up early and up late, because of course she is
    if (this.block === 0 || this.block >= 3) {
      this.npcs.push(this._mkNpc({ ...NAMED.bev, key: 'bev', x: 560, y: 95, room: 'garage', static: true, pool: 'bev' }));
    }
    // HOPELESS: the campus population, and the Polo Shirts on their loop
    if (this.block <= 2) {
      this.npcs.push(this._mkNpc({ ...NAMED.pettig, key: 'pettig', x: 310, y: 104, room: 'aid', static: true, pool: 'pettig' }));
      this.npcs.push(this._mkNpc({ ...NAMED.dunn, key: 'dunn', x: 150, y: 102, room: 'shop', static: true, pool: 'dunn' }));
      for (let i = 0; i < 3; i++) {
        this.npcs.push(this._mkNpc({ x: HTCC.quad.x + 90 + i * 230 + this.ri(-40, 40),
          y: HTCC.quad.y + 110 + this.ri(-50, 50), outfitKey: this.pick(['denim', 'hivis', 'flannel', 'greasy']),
          pool: 'campus_idle' }));
      }
      this.npcs.push(this._mkNpc({ x: 2420, y: 2050, room: 'library', outfitKey: 'denim', pool: 'campus_idle' }));
      const tv = this._mkNpc({ ...NAMED.trevor, key: 'trevor', x: HTCC.quad.x + 60, y: HTCC.quad.y + 250, hp: 55, pool: 'trevor',
        route: [[HTCC.quad.x + 40, HTCC.quad.y + 250], [HTCC.quad.x + 700, HTCC.quad.y + 240],
                [HTCC.quad.x + 720, HTCC.quad.y + 60], [HTCC.quad.x + 60, HTCC.quad.y + 70]] });
      this.npcs.push(tv);
    }

    // The Bluffs: Rand's decorative patrol, the neighbours, and — on Fridays — the
    // DA himself at the club, which is the most reliable tell in the entire game.
    const rand = this._mkNpc({ ...NAMED.rand, key: 'rand', x: 1100, y: BLUFFS.roadY - 20, hp: 60, pool: 'rand',
      route: [[400, BLUFFS.roadY - 20], [1200, BLUFFS.roadY - 10], [2100, BLUFFS.roadY - 20], [1200, BLUFFS.roadY + 30]] });
    this.npcs.push(rand);
    for (let i = 0; i < 2; i++) {
      this.npcs.push(this._mkNpc({ x: 700 + i * 900 + this.ri(-60, 60), y: BLUFFS.roadY + this.ri(-24, 24),
        outfitKey: this.pick(['tourist', 'tourist2']), pool: 'bluffs_idle' }));
    }
    if (this.block >= 1 && this.block <= 2) {
      this.npcs.push(this._mkNpc({ ...NAMED.bunny, key: 'bunny', x: BLUFFS.club.x - 40, y: BLUFFS.club.y + 190, pool: 'bluffs_idle' }));
      // FRIDAY: he golfs off his caseload. Seeing him here is how you know.
      if (this.day === 4) this.npcs.push(this._mkNpc({ ...NAMED.whit, key: 'whit',
        x: BLUFFS.club.x + 90, y: BLUFFS.club.y + 195, static: true, pool: 'whit' }));
    }

    // Cassidy Works: Denny in the hall (always — spite), Gus walking his loop
    this.npcs.push(this._mkNpc({ ...NAMED.denny, key: 'denny', x: 150, y: 96, room: 'unionhall', static: true, pool: 'denny' }));
    const gus = this._mkNpc({ ...NAMED.gus, key: 'gus', x: 2400, y: 1150, hp: 80, pool: 'gus',
      route: [[2400, 1150], [3000, 1130], [3180, 1300], [2700, 1430], [2380, 1300]] });
    gus.cop = false; gus.persistent = false;
    this.npcs.push(gus);

    // Downtown staff + the Fairview reps colonising Daybreak's corner table
    if (this.isOpen('splitlip')) {
      this.npcs.push(this._mkNpc({ ...NAMED.sal, key: 'sal', x: 200, y: 108, room: 'splitlip', static: true, pool: 'sal' }));
      for (let i = 0; i < 2 + (this.block >= 2 ? 1 : 0); i++) {
        this.npcs.push(this._mkNpc({ x: 160 + i * 90, y: 220 + (i % 2) * 60, room: 'splitlip',
          outfitKey: this.pick(['flannel', 'greasy', 'camo']), drunk: this.chance(0.5 + this.block * 0.15), pool: 'splitlip_reg' }));
      }
    }
    if (this.isOpen('pawn')) this.npcs.push(this._mkNpc({ ...NAMED.vern, key: 'vern', x: 500, y: 106, room: 'pawn', static: true, pool: 'vern' }));
    if (this.isOpen('daybreak')) {
      this.npcs.push(this._mkNpc({ ...NAMED.madison, key: 'madison', x: 320, y: 106, room: 'daybreak', static: true, pool: 'madison' }));
      this.npcs.push(this._mkNpc({ arch: 'average', outfit: { shirt: '#3a4048', pants: '#2e3138' }, hat: 'none',
        x: 500, y: 300, room: 'daybreak', static: true, pool: 'fairview_rep', name: 'Fairview' }));
      this.npcs.push(this._mkNpc({ outfitKey: 'tourist', x: 150, y: 300, room: 'daybreak', pool: 'tourist' }));
    }
    // The Foxhole: staff, stage, and a floor of regulars who'd rather be here
    if (this.isOpen('foxhole')) {
      this.npcs.push(this._mkNpc({ ...NAMED.dee, key: 'dee', x: 595, y: 104, room: 'foxhole', static: true, pool: 'dee' }));
      this.npcs.push(this._mkNpc({ ...NAMED.cherry, key: 'cherry', x: 215, y: 150, room: 'foxhole', static: true, pool: 'cherry' }));
      this.npcs.push(this._mkNpc({ ...NAMED.sable, key: 'sable', x: 300, y: 300, room: 'foxhole', static: true, pool: 'sable' }));
      this.npcs.push(this._mkNpc({ ...NAMED.moose, key: 'moose', x: 380, y: 396, room: 'foxhole', static: true, pool: 'moose', hp: 150 }));
      for (let i = 0; i < 4; i++) {
        this.npcs.push(this._mkNpc({
          x: 140 + i * 96 + this.ri(-16, 16), y: 268 + (i % 2) * 46, room: 'foxhole',
          outfitKey: this.pick(['flannel', 'denim', 'greasy', 'camo']),
          drunk: this.chance(0.6), pool: 'fox_patron',
        }));
      }
      if (this.block === 2) {  // the Alumni have a spot and they will tell you about it
        this.npcs.push(this._mkNpc({ ...NAMED.chuck, key: 'chuck', x: 520, y: 300, room: 'foxhole', brawler: true, hp: 70, pool: 'fox_alumni' }));
        this.npcs.push(this._mkNpc({ ...NAMED.tanner, key: 'tanner', x: 578, y: 322, room: 'foxhole', brawler: true, hp: 62, pool: 'fox_alumni' }));
      }
    }

    // cops
    if (this.block === 1) this._spawnCop('tapp', [[500, 505], [1300, 505], [1900, 508], [1000, 1060]]);
    if (this.block >= 2) this._spawnCop('brill', [[1880, 508], [1100, 505], [520, 508], [900, 1060], [700, 2145], [1400, 2148], [1500, 1060]]);
    if (this.heatStage() >= 3) { this._spawnCop('tapp', [[600, 700]]); this._spawnCop('brill', [[1600, 700]]); }
    // ── THE GRUDGE AMBUSH ────────────────────────────────────────────────────
    // Past the threshold, somebody who has a reason is waiting where you park.
    // Once a day, so it's a consequence and not a siege.
    if ((this.grudge || 0) >= T.grudgeAmbushAt && this._ambushDay !== this.day && this.block >= 2) {
      this._ambushDay = this.day;
      const spot = this.pick(SPOTS.lot);
      const a = this._mkNpc({ x: spot[0] + this.ri(-30, 30), y: spot[1] + this.ri(-20, 20),
        outfitKey: this.pick(['flannel', 'greasy', 'camo']), brawler: true, hp: 85, pool: 'drunk' });
      a.state = 'aggro'; a.persistent = true; a.grudged = true;
      this.npcs.push(a);
      this.alert('Somebody is standing in the lot who is not waiting for anything except you.', 'bad');
    }

    // debt collector
    if (this.player.debt > 0 && this.day >= 5 && this.block >= 2 && !this.reggieSpawned) {
      this.reggieSpawned = true;
      const reg = this._mkNpc({ key: 'reggie', name: 'Big Reggie', arch: 'broad', outfit: { shirt: '#3a3a36', pants: '#22221e' },
        hat: 'beanie', x: 1150, y: 900, brawler: true, hp: 120, pool: 'drunk' });
      reg.persistent = true;      // the debt does not evaporate at the block boundary
      reg.state = 'aggro';        // he is not here to chat about the terms
      this.npcs.push(reg);
      this.alert('Somebody built like a vending machine is asking around for you. He found you.', 'bad');
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
    this.dt.shots = 0;          // the stomach resets on the hour, roughly
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
    // ⚠️ WALKING is ONLY earned by catching the 6 a.m. (walkOut). Ending the week with
    // the money and no bus ticket is the game's best story, and it is STUCK.
    if (this.day >= T.days) return this.endGame('STUCK');
    this.cb.dayEnd && this.cb.dayEnd();
    this._spawnWeapons();
    this._populate();
    this.note(`day -> ${this.dayName} (${this.weather})`);
    if (this.day === 4 && this.player.debt > 0) this.alert(`Roxy's text: "friday. ${this.player.debt}. window one. don't make it a window two situation."`, 'warn');
  }

  _holdAmbush() {
    this.alert('Word got out you\'re sitting on merchandise. Somebody visited the beater overnight.', 'bad');
    const lost = Math.min(this.scheme.inCar, 1);   // capped at one — three nights shouldn't wipe you
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
    // the town has read you, and the town prices accordingly
    if (this.grudgeRefuses()) return { ok: false, msg: 'The hand comes off the counter. "We\'re good. You can go." No heat in it — that\'s the worst part. They just don\'t want your money.' };
    const price = this.grudgePrice(it.cost);
    if (!this._spend(price)) return { ok: false, msg: `That's $${price}${price > it.cost ? ' — for you' : ''}. You are, in the regional dialect, broke.` };
    it.do();
    if (p.stolenPending === what) p.stolenPending = null;
    this.sfx('register');
    return { ok: true, msg: price > it.cost ? `−$${price}. The old price was $${it.cost}. Nobody explains the difference and you don't ask.` : undefined };
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
    } else this.alert('Out the door. Nobody looked up from their phone. God bless the phone, the great American accomplice.', 'ok');
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
    if (p.ripToday === 1) { this.bonusBlocks += T.ripBonusBlocks; this.alert('The Rip hits like a dumpster lid. The day grows a fifth block it did not earn. Tomorrow knows, and tomorrow is petty.', 'ok'); }
    else this.alert('More Rip. Your heartbeat is now audible to others. A dog two yards over is answering it.', 'warn');
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
    if (stage === 'window') this.meta.knows.drop = true;
    if (stage === 'case') this.meta.knows.window = true;
    const s = SCHEME.stages.find(s => s.id === stage);
    this.cb.scheme && this.cb.scheme(stage);
    this.alert(`SCHEME — ${s ? s.label : stage}: done.`, 'scheme');
  }

  talkPeanut() {
    if (this.scheme.job) return { name: 'Peanut', text: this.pick(BARKS.peanut_after) };
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

  // ⚠️ This used to exist ONLY in the headless bot, so the live heist had no escalating
  // danger — trip 3 was exactly as safe as trip 1. Press-your-luck needs teeth.
  patrolOdds() {
    const base = T.heistPatrolRisk[Math.min(this.scheme.crates, T.heistPatrolRisk.length - 1)];
    return base * (this.heistWindowOpen() ? 0.5 : 1) * (this.weather === 'rain' ? 0.7 : 1);
  }

  _patrolRoll() {
    if (!this.chance(this.patrolOdds())) return false;
    this.addHeat(T.heatCrime.heistSeen, 1, 'a cruiser rolled the alley');
    this.alert('Headlights sweep the alley mouth. Somebody in a HPD car is looking right at a man holding a crate.', 'bad');
    this.sfx('siren');
    const near = this.npcs.find(n => n.cop);
    if (near) { near.x = 1420; near.y = 150; near.state = 'chase'; }
    else this._spawnCop('brill', [[1420, 150]]);
    return true;
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
    // must have actually COMMITTED to holding — otherwise the risk is opt-out and
    // the +50% is free money for anyone who simply waits.
    if (this.day !== 6 || s.inCar <= 0 || !s.holding) return { ok: false };
    const take = Math.round(T.crateFenceBase * T.holdBuyerMult) * s.inCar;
    const n = s.inCar;
    s.inCar = 0; s.sold += n; s.cash += take; s.holding = false;
    this._earn(take);
    this._schemeCheck('fence');
    return { ok: true, msg: `A guy in a clean truck counts out $${take} without saying one word. City people, man.` };
  }

  walkOut() {
    if (!this.scheme.fence) return { ok: false, msg: 'The bus costs nothing. Leaving with nothing costs everything. Finish the damn job first.' };
    if (this.block !== 0) return { ok: false, msg: 'The 6 a.m. is a morning creature. It does not do encores and neither does the driver.' };
    return this.endGame('WALKING');
  }

  // ---- heat ---------------------------------------------------------------
  // `wired` = the witness is a MACHINE (an alarm panel, a camera, a phone already
  // dialling). It does not care whether a human was standing there, so the
  // empty-street discount must NOT apply — without this, tripping a Bluffs alarm at
  // 3 a.m. cost 9 heat instead of 34, which made the whole district free.
  addHeat(base, extraWitnesses = 0, why = '', wired = false) {
    // A crowd makes it worse; an empty alley at 3am makes it cheap. Without a floor
    // below 1.0 there's no "do it where nobody's looking," which is the whole fantasy.
    // ⚠️ Discount the empty alley WITHOUT discounting the crowd — a first pass used
    // 1+(w-2)*0.5 and quietly halved every heat gain in the game (BUSTED fell 8→2/64).
    const w = this.countWitnesses() + extraWitnesses;
    let mult = wired ? Math.max(1, w <= 1 ? 1 : 1.2 + (w - 2) * 0.6)
             : w <= 0 ? 0.25 : w === 1 ? 0.6 : Math.min(2.5, 1.2 + (w - 2) * 0.6);
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

  /* ══ GRUDGE HEAT ═══════════════════════════════════════════════════════════
   * The design doc's second track, and the one that makes the town a character:
   * "HPD Heat is the legal track… Grudge Heat is the civilian track, and it never
   * expires by itself. Rob a man's garage and HPD forgets by Thursday — he
   * doesn't." So: no decay, ever. Sleep doesn't touch it. The morning-after
   * doesn't touch it. The only thing that clears a grudge is the run ending.
   *
   * It buys three things, at thresholds: prices go up everywhere (they can read
   * you now), somebody starts waiting for you in parking lots, and eventually
   * doors that used to open just don't. */
  addGrudge(n, why = '') {
    this.grudge = (this.grudge || 0) + n;
    this.note(`grudge +${n} (${why}) -> ${this.grudge}`);
    const was = this._grudgeSeen || 0;
    if (this.grudge >= T.grudgeRefuseAt && was < T.grudgeRefuseAt) {
      this._grudgeSeen = this.grudge;
      this.alert('You have crossed enough people that the town has quietly closed ranks. Some counters are done serving you. Nobody announces it; you just find out.', 'bad');
    } else if (this.grudge >= T.grudgeAmbushAt && was < T.grudgeAmbushAt) {
      this._grudgeSeen = this.grudge;
      this.alert('Word travels. Somebody is going to be waiting for you in a parking lot, and it will not be a conversation.', 'bad');
    } else if (this.grudge >= 3 && was < 3) {
      this._grudgeSeen = this.grudge;
      this.alert('People have started pricing you differently. That is what a reputation IS in a town this size.', 'warn');
    }
    this._grudgeSeen = Math.max(this._grudgeSeen || 0, this.grudge);
  }

  // every counter in town reads this
  grudgePrice(base) {
    const m = Math.min(T.grudgeMarkupCap, (this.grudge || 0) * T.grudgeMarkup);
    return Math.max(1, Math.round(base * (1 + m)));
  }
  grudgeRefuses() { return (this.grudge || 0) >= T.grudgeRefuseAt; }

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

  // A swing is now TWO beats: wind up (telegraph, direction locked), then resolve.
  // The old one-frame hit meant nothing could ever be dodged, by you or by them.
  attack() {
    const p = this.player;
    if (p.atkT > 0 || p.windT > 0 || p.carryCrate || this.over) return;
    if (p.stamina < T.swingStamina) {
      this.say(null, 'You have nothing left in the arm.', p.x, p.y);
      return;
    }
    p.stamina -= T.swingStamina;
    p.windT = T.windUp;
    p.windDir = p.facing;              // committed on the wind-up; you can't steer a punch
    this.sfx('swing', p.x, p.y);
  }

  _resolveSwing() {
    const p = this.player;
    const w = this.weaponOf(p);
    p.atkT = T.punchCooldown;
    p.strikeT = 0.18;                 // view: the arm is OUT for this long
    this.stats.punches++;
    let hitAny = false;
    for (const n of this.npcs) {
      if (n.ko || n.room !== this.room) continue;
      const dx = n.x - p.x, dy = n.y - p.y, d = Math.hypot(dx, dy);
      if (d > w.range + 12) continue;
      const ang = Math.atan2(dy, dx);
      let da = Math.abs(ang - p.windDir); if (da > Math.PI) da = 2 * Math.PI - da;
      if (da > 1.15) continue;
      hitAny = true;
      this.hitNpc(n, this.ri(w.dmg[0], w.dmg[1]), ang, w.kb);
      if (p.held && --p.held.dur <= 0) {
        this.fx('break', n.x, n.y, { kind: p.held.kind });
        this.alert(`${WEAPONS[p.held.kind].label[0].toUpperCase() + WEAPONS[p.held.kind].label.slice(1)} gives its life for the cause.`, 'ok');
        p.held = null;
        break;   // a weapon that shattered can't hit the next guy too
      }
    }
    if (hitAny) this.sfx('thud', p.x, p.y);
    else this.fx('whiff', p.x + Math.cos(p.windDir) * 26, p.y + Math.sin(p.windDir) * 26, { ang: p.windDir });
  }

  // ── THE FOXHOLE ───────────────────────────────────────────────────────────
  // Everything here is a transaction, which is the point: it's the purest expression
  // of the design's third pillar. Cover to get in, drinks to stay, tips to be treated
  // like a person, and information priced above all of it.
  enterFoxhole() {
    const p = this.player;
    if (!this.isOpen('foxhole')) return { ok: false, msg: this.closedLine('foxhole') };
    if (this.fox.paid === this.day) { this.room = 'foxhole'; this._placeIn('foxhole'); return { ok: true }; }
    if (!this._spend(T.foxCover)) return { ok: false, msg: `Moose doesn't move. "Eight bucks. You ain't got eight bucks. That's a whole THING to not have."` };
    this.fox.paid = this.day;
    this.fox.visits++;
    this.room = 'foxhole'; this._placeIn('foxhole');
    this.sfx('doorchime');
    return { ok: true, msg: `−$${T.foxCover} cover. Inside it's dark, loud, and forty degrees warmer than the parking lot.` };
  }

  _placeIn(key) {
    const it = INTERIORS[key];
    this.player.x = it.w / 2; this.player.y = it.h - 46;
  }

  // Nobody in this building has ever helped a police officer with anything.
  foxLayLow() {
    if (this.room !== 'foxhole') return { ok: false };
    const before = this.heat;
    this.heat = Math.max(0, this.heat - T.foxHeatDecay);
    this.endBlock('sat in the dark at the Foxhole');
    return { ok: true, msg: `You sit in a corner booth and become furniture. Heat ${Math.round(before)} → ${Math.round(this.heat)}. Nobody here saw you. Nobody here sees anybody.` };
  }

  foxDrink() {
    if (this.room !== 'foxhole') return { ok: false };
    if (!this._spend(T.foxDrink)) return { ok: false, msg: 'Dee looks at your hand, then your face. "Cash bar, sweetheart."' };
    this.player.hp = Math.min(this.player.hpMax, this.player.hp + 8);
    this.fox.drinks++;
    return { ok: true, msg: `−$${T.foxDrink}. It's cold and it's honest, which is two more things than most of this town.` };
  }

  foxTip(who) {
    if (this.room !== 'foxhole') return { ok: false };
    if (!this._spend(T.foxTip)) return { ok: false, msg: 'You pat your pockets. Everyone politely pretends not to watch you do it.' };
    this.fox.tips++;
    if (this.fox.tips === 3) this.alert('Word gets around the floor that you tip. Doors open a little wider in here.', 'ok');
    return { ok: true, tips: this.fox.tips,
      msg: `−$${T.foxTip}. ${this.fox.tips >= 3 ? 'You get a nod. In here that\'s a knighthood.' : 'Standing bought, five dollars at a time.'}` };
  }

  // Dee sells what she hears. Peanut is free but slow; Dee is instant and expensive.
  // This is a REAL second route to the scheme intel, not a flavour button.
  foxBuyInfo() {
    if (this.room !== 'foxhole') return { ok: false };
    if (this.scheme.hear && this.scheme.window && this.scheme.case)
      return { ok: true, msg: 'Dee: "You already know everything I\'d charge you for. Go do it or go home."' };
    const price = Math.max(10, T.foxInfoCost - (this.fox.tips >= 3 ? 10 : 0));
    if (!this._spend(price)) return { ok: false, msg: `Dee taps the bar. "Thirty. Information's the only thing in here that's honestly priced."` };
    let line, learned;
    if (!this.scheme.hear) { this._schemeCheck('hear'); line = BARKS.dee_info[0]; learned = 'the job exists'; }
    else if (!this.scheme.window) { this._schemeCheck('window'); line = BARKS.dee_info[1]; learned = 'the drop night'; }
    else { this._schemeCheck('case'); line = BARKS.dee_info[2]; learned = 'the window'; }
    this.fox.bought++;
    return { ok: true, msg: `−$${price}. Dee, not looking up: "${line}"`, learned };
  }

  foxVip() {
    const p = this.player;
    if (this.room !== 'foxhole') return { ok: false };
    if (this.fox.vip === this.day) return { ok: false, msg: 'Sable: "Twice in one night? Go home, sugar. I mean that kindly."' };
    if (!this._spend(T.foxVipCost)) return { ok: false, msg: `Forty-five dollars. You do not have forty-five dollars. You have a look on your face.` };
    this.fox.vip = this.day;
    p.hp = Math.min(p.hpMax, p.hp + T.foxVipHeal);
    this.heat = Math.max(0, this.heat - 8);
    this.endBlock('the back room');
    // Fade to black. The design doc: "the camera has manners even when nobody else does."
    return { ok: true, msg: `−$${T.foxVipCost}. The curtain closes.\n\nLater: you're in the gravel lot, warmer, calmer, poorer, and no wiser. Somebody put your jacket back on you. The night went somewhere without you and left you the receipt.` };
  }

  // ══ HOPELESS TECH ═════════════════════════════════════════════════════════
  // ⚠️ THE CAMPUS RULE, straight from the design doc: "Hopeless Tech is a no-carry
  // zone with metal detectors at every entrance — installed after the Welding
  // program kept eating the building's copper wiring, and now sensitive enough to
  // catch a belt buckle. Campus play stays fists, wits, and Beef by design."
  // Every campus door runs through here. Nothing else in the game confiscates.
  enterCampus(key) {
    const b = HTCC.buildings.find(x => x.key === key);
    if (!b) return { ok: false };
    const room = { admin: 'aid', shop: 'shop', library: 'library' }[key];
    if (!room) return { ok: false, msg: `${b.name}: locked, or nothing in there for you. ${b.blurb}` };
    const p = this.player;
    let msg = '', took = null;
    if (p.held) {                                  // the detector eats it, every time
      took = p.held.kind; p.held = null;
      this.addHeat(4, 0, 'set off a campus detector', true);
      msg = `${this.pick(BARKS.detector)} Campus Safety takes the ${took} and gives you a numbered claim tag you will never redeem. `;
      this.sfx('yell');
    }
    // ⚠️ The crowbar gets STASHED, never refused. A first pass hard-blocked admin
    // and the library while you carried iron — which is a dead end, because the
    // scheme needs the crowbar and the disbursement needs the aid office. Everyone
    // who has ever carried a tool onto a campus knows where it actually goes.
    if (p.inv.crowbar) {
      p.inv.crowbar = false; this.htcc.stashed = true;
      msg += 'You leave the ' + T.shopToolName + ' in the hedge by the door, the way every trades student in the history of this campus has. ';
    }
    this.room = room; this._placeIn(room);
    this.sfx('doorchime');
    return { ok: true, tookWeapon: took, msg: msg + b.blurb };
  }

  // A session of anything. The doc: classes are minigames that feed your build.
  // Welding's the one that ships in Phase 1, because its output is a TOOL.
  attendClass() {
    if (this.room !== 'shop') return { ok: false };
    if (this.htcc.classToday === this.day) return { ok: false, msg: 'Dunn, without looking up: "You came already. Go be useless somewhere with better light."' };
    this.htcc.classToday = this.day;
    this.htcc.classes++;
    this.blockT += T.classSecs;
    let msg = `You pull a bead. It's ugly and it holds, which Dunn says is the whole job. Sessions attended: ${this.htcc.classes}.`;
    // …and the point of showing up: you make your own iron instead of buying it
    if (!this.player.inv.crowbar) {
      this.player.inv.crowbar = true;
      this._schemeCheck('tools');
      msg += ` On the way out you take a length of stock off the scrap rack and put a hook in it. That's a ${T.shopToolName} now, and it cost you nothing but showing up.`;
    }
    if (this.htcc.classes === T.aidNeedsClass) msg += ' Somewhere in Chalmers Hall, a box on a form gets a number in it.';
    return { ok: true, msg };
  }

  aidStatus() {
    return { attended: this.htcc.classes, need: T.aidNeedsClass,
             paid: this.htcc.aidPaid, eligible: this.htcc.classes >= T.aidNeedsClass && !this.htcc.aidPaid };
  }

  claimAid() {
    if (this.room !== 'aid') return { ok: false };
    const s = this.aidStatus();
    if (s.paid) return { ok: false, msg: 'Ms. Pettigrew: "It disbursed. You spent it. I watched you decide to spend it from right here."' };
    if (!s.eligible) return { ok: false, msg: `Ms. Pettigrew turns the monitor a quarter-inch toward you. "Attendance: ${s.attended}. The box needs ${s.need}. The box does not care that you're trying."` };
    this.htcc.aidPaid = true;
    this._earn(T.aidPayout);
    this.stats.aid = 1;
    return { ok: true, msg: `+$${T.aidPayout}. The single largest legal sum you will touch all week, and it took two mornings of showing up. Nobody in this town will ever let you forget how easy that was, least of all you.` };
  }

  libLayLow() {
    if (this.room !== 'library') return { ok: false };
    const before = this.heat;
    this.heat = Math.max(0, this.heat - T.libHeatDecay);
    this.endBlock('sat in the library');
    return { ok: true, msg: `Two hours at a carrel by the radiator. Heat ${Math.round(before)} → ${Math.round(this.heat)}. Nobody in the history of Hopewell has been arrested in this building.` };
  }

  gymSpot() {
    if (this.room !== 'ext') return { ok: false };
    if (this.htcc.gymToday === this.day) return { ok: false, msg: 'You already spotted for them today. There is a limit to how much of this a man can watch.' };
    if (this.player.hp < 30) return { ok: false, msg: 'They take one look at you and find somebody else. Fair.' };
    this.htcc.gymToday = this.day;
    this._earn(T.gymPay);
    this.player.stamina = T.staminaMax;
    return { ok: true, msg: `+$${T.gymPay} cash for spotting two Alumni through a workout narrated entirely in numbers. You leave weirdly loose.` };
  }

  // The Polo Shirts: four guys, one cart, unlimited self-regard. They cannot
  // arrest you. They can telephone somebody who can. And you must never, ever
  // touch the cart.
  polosHassle(t) {
    this.addHeat(T.polosHassleHeat, 0, 'Campus Safety made a phone call');
    this.say('Trevor', this.pick(BARKS.trevor), t.x, t.y);
  }

  touchCart() {
    if (this.htcc.cart === this.day) return { ok: false, msg: 'The cart has had enough of you today. So, audibly, has Trevor.' };
    this.htcc.cart = this.day;
    this.addHeat(T.polosCartRage, 1, 'sat on the cart');
    const t = this.npcs.find(n => n.key === 'trevor' && !n.ko);
    if (t) { t.state = 'aggro'; t.brawler = true; this.say('Trevor', this.pick(BARKS.trevor_cart), t.x, t.y); }
    this.sfx('yell');
    return { ok: true, msg: 'You sit on the cart. Somewhere across the quad a man begins running who has not run since 2019.' };
  }

  // ══ THE BLUFFS / BURGLARY ═════════════════════════════════════════════════
  // ⚠️ Salted hash, NOT this.rng — house state must be stable across every call
  // in a day (the UI reads it every frame for tells) and must NOT advance the sim
  // stream. Same trick as Age of Toys' encounter variants.
  _h(...parts) {
    let h = 2166136261 >>> 0;
    const s = parts.join('|');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return (h >>> 0) / 4294967296;
  }

  houseState(key) {
    const h = BLUFFS.houses.find(x => x.key === key);
    if (!h) return null;
    const R = (salt) => this._h(this.seed, this.day, key, salt);
    const done = this.burg.done.includes(key);
    // THE DA'S FRIDAY: he golfs off his caseload every Friday (design doc, verbatim).
    // That is the Bluffs' drop night — a known, learnable, once-a-week window.
    const daFriday = h.daHouse && this.day === 4;
    const occupied = done ? false : daFriday ? false : R('occ') < (h.daHouse ? 0.55 : 0.45);
    const alarmed = h.daHouse ? true : R('alm') < (h.tier === 2 ? 0.45 : 0.25);
    // …and here is the doc's "security that's mostly decorative", as a MECHANIC:
    // every alarmed house has a sign, but so do 40% of the unalarmed ones. The
    // sign is not information. Casing is information.
    const sign = alarmed || R('sgn') < 0.40;
    const openWindow = R('win') < 0.30;
    return {
      key, def: h, occupied, alarmed, sign, openWindow, done, daFriday,
      packages: !occupied && R('pkg') < 0.5,          // away for DAYS. the best tell.
      car: occupied ? R('car') > 0.12 : R('car') < 0.15,  // …and the tell that lies
      sprinklers: R('spr') < 0.35,
      cased: this.burg.cased.includes(key + '|' + this.day),
    };
  }

  caseHouse(key) {
    const st = this.houseState(key);
    if (!st) return { ok: false };
    if (st.cased) return { ok: true, msg: 'You already watched this one today. Nothing has changed except your nerve.' };
    this.burg.cased.push(key + '|' + this.day);
    this.blockT += T.caseSecs;
    const bits = [];
    bits.push(st.occupied ? 'Somebody\'s home — you can see the TV strobing off the ceiling.' : 'Nobody home. Not a light, not a shadow, not a sound.');
    bits.push(st.alarmed ? 'And the panel by the door has a live green light. It\'s real.' : 'The alarm sign is a lie. There\'s no panel. There never was.');
    if (st.openWindow) bits.push('The lake-side window is cracked open for the breeze. Rich people trust the lake.');
    return { ok: true, cased: true, msg: `You stand across the road and watch ${st.def.name} for a while. ${bits.join(' ')}` };
  }

  canBurgle(key) {
    const st = this.houseState(key);
    if (!st || st.done) return false;
    return st.openWindow || this.player.inv.crowbar;
  }

  enterHouse(key) {
    const st = this.houseState(key);
    if (!st) return { ok: false };
    if (st.done) return { ok: false, msg: 'You already emptied this one. There is nothing in there now but somebody\'s bad week.' };
    if (!st.openWindow && !this.player.inv.crowbar) return { ok: false, msg: 'Every door up here is solid and every window is latched. You need iron, or you need a house that trusts the lake.' };
    this.room = 'house';
    this.burg.in = key;
    this.burg.spots = [];
    this.burg.entryQuiet = st.openWindow;
    this.burg.owner = st.occupied;
    this._placeIn('house');
    // The clock. Alarmed = loud and short. Unalarmed = long, but a neighbour is
    // still a clock. Occupied = the owner IS the alarm, and he's already dialling.
    if (st.occupied) {
      this.burg.t = T.alarmGraceS * 0.5;
      this.addHeat(T.burgHeatSeen, 1, 'woke the owner of a Bluffs house', true);
      this.say('Owner', this.pick(BARKS.burg_owner), this.player.x, this.player.y - 20);
      this.sfx('yell');
    } else if (st.alarmed) {
      this.burg.t = T.alarmGraceS;
      this.addHeat(T.burgHeatAlarm, 0, 'tripped a Bluffs alarm', true);
      this.sfx('yell');
    } else {
      this.burg.t = T.silentTimerS;
      this.addHeat(T.burgHeatEntry, 0, 'broke into a Bluffs house', true);
    }
    this.sfx(st.openWindow ? 'pickup' : 'pry');
    const how = st.openWindow ? 'The lake window slides up like it was waiting for you.'
                              : 'The slider gives with a crack that the whole lake hears.';
    const clock = st.occupied ? 'SOMEBODY IS HOME. He is on the phone. GO.'
                : st.alarmed ? 'A panel starts beeping in a hallway you cannot see. Fifty seconds, give or take.'
                : 'Silence. The expensive kind. Nobody knows yet — but somebody always eventually looks out a window.';
    return { ok: true, msg: `${how} ${clock}` };
  }

  lootWeight() { return (this.player.inv.loot || []).reduce((a, k) => a + (LOOT[k] ? LOOT[k].w : 1), 0); }

  searchSpot(spotKey) {
    if (this.room !== 'house' || !this.burg.in) return { ok: false };
    const sp = SEARCH_SPOTS.find(s => s.key === spotKey);
    if (!sp) return { ok: false };
    if (this.burg.spots.includes(spotKey)) return { ok: false, msg: 'You already turned that one out. It\'s a mess and it\'s empty.' };
    if (sp.needsCrowbar && !this.player.inv.crowbar) return { ok: false, msg: 'Bolted, keyed, and beyond your fingernails. That one wants iron.' };
    if (this.lootWeight() >= T.bluffsCarryCap) return { ok: false, msg: 'Your jacket is a jacket, not a moving van. You\'re full.' };
    this.burg.spots.push(spotKey);
    this.burg.t -= sp.secs;                       // every drawer costs you clock
    const st = this.houseState(this.burg.in);
    const tier = st.def.tier;
    // tier 3 (the DA) rolls twice and keeps the better find
    const roll = () => sp.pool[Math.floor(this.rng() * sp.pool.length)];
    let key = roll();
    if (tier >= 2 && this.rng() < 0.45) { const alt = roll(); if ((LOOT[alt].v[1] || 0) > (LOOT[key].v[1] || 0)) key = alt; }
    const item = LOOT[key];
    // ⚠️ The one thing you never take. Design doc: firearms are a line, not a slot.
    if (item.refused) return { ok: true, refused: true, msg: `${sp.label}: ${item.label}` };
    if (item.evidence) {
      this.player.inv.loot = this.player.inv.loot || [];
      this.player.inv.loot.push(key);
      return { ok: true, msg: `${sp.label}: ${item.label}. Worth nothing to a fence. Worth something to somebody with a grievance board.` };
    }
    this.player.inv.loot = this.player.inv.loot || [];
    this.player.inv.loot.push(key);
    this.stats.burgled = (this.stats.burgled || 0) + 1;
    this.sfx('pickup');
    return { ok: true, item: key, msg: `${sp.label}: ${item.label}.` };
  }

  leaveHouse() {
    const key = this.burg.in;
    if (!key) return { ok: false };
    const st = this.houseState(key);
    const clean = this.burg.t > 0;
    if ((this.player.inv.loot || []).length) this.burg.done.push(key);
    this.burg.in = null; this.burg.t = 0;
    this.room = 'ext';
    const h = st.def;
    this.player.x = h.x + h.w / 2; this.player.y = h.y + h.h + 26;
    if (clean) return { ok: true, msg: 'Out the way you came, across a lawn that has never once been walked on by somebody who needed money.' };
    return { ok: true, late: true, msg: 'You come out into headlights.' };
  }

  // Fast, because up here they pay for fast.
  _bluffsResponse() {
    const key = this.burg.in;
    const st = key ? this.houseState(key) : null;
    this.burg.t = 0;
    this.addHeat(30, 1, 'Bluffs response');
    this.alert('Two cruisers come up the lake road without sirens, which is how you know they were already close.', 'bad');
    this.sfx('siren');
    const hx = st ? st.def.x + st.def.w / 2 : this.player.x;
    const hy = st ? st.def.y + st.def.h + 40 : this.player.y;
    if (this.room === 'house') { this.room = 'ext'; this.burg.in = null; this.player.x = hx; this.player.y = hy; }
    this.heat = Math.max(this.heat, T.heatStage.wanted + 6);
    this._heatStageSeen = 3;
    this._spawnCop('tapp', [[hx - 60, hy + 20]]);
    this._spawnCop('brill', [[hx + 60, hy + 30]]);
    for (const n of this.npcs) if (n.cop) { n.state = 'chase'; n.x = hx + this.ri(-70, 70); n.y = hy + this.ri(10, 50); }
  }

  fenceLoot(where) {
    const p = this.player;
    const loot = p.inv.loot || [];
    if (!loot.length) return { ok: false, msg: 'You have nothing on you worth a counter\'s time.' };
    let take = 0, n = 0, kept = [];
    for (const k of loot) {
      const it = LOOT[k];
      if (it.evidence) { kept.push(k); continue; }         // paper doesn't sell
      let v = this.ri(it.v[0], it.v[1]);
      // Vern keeps a ledger and a loupe, so serial numbers cost you. Roxy's window 2
      // has never asked a question in its life.
      if (where === 'vern' && it.hot) v = Math.round(v * T.hotPenalty);
      if (where === 'vern' && !it.hot) v = Math.round(v * 1.1);
      take += v; n++;
    }
    p.inv.loot = kept;
    if (!n) return { ok: false, msg: where === 'vern' ? 'Vern flips through the binder once. "I sell things. This is a THING TO KNOW. Not my aisle."' : 'Roxy: "Paper? Sweetheart, I got a whole drawer of paper and none of it spends."' };
    this._earn(take);
    this.stats.lootCash = (this.stats.lootCash || 0) + take;
    const line = where === 'vern'
      ? 'Vern turns each piece under the loupe, says a number, and does not move off it. "Serial numbers are a lifestyle choice, son."'
      : 'Roxy doesn\'t look at any of it. That\'s the service you\'re paying for.';
    return { ok: true, msg: `${n} piece${n === 1 ? '' : 's'} → $${take}. ${line}` };
  }

  // The binder is the only loot that isn't money. Denny has waited forty years.
  leakBinder() {
    const p = this.player;
    const loot = p.inv.loot || [];
    if (!loot.includes('binder')) return { ok: false };
    if (this.room !== 'unionhall') return { ok: false, msg: 'This wants a room with a grievance board in it.' };
    p.inv.loot = loot.filter(k => k !== 'binder');
    this.meta.rep += 2;
    this.stats.leaked = 1;
    this.alert('Denny reads two pages, sits down, and reads them again. "Phase THREE. They\'ve got the hall on here, son. The HALL." He starts making calls he\'s been waiting forty years to make.', 'scheme');
    return { ok: true, leaked: true, msg: 'You gave Fairview\'s homework to the one man in this county who reads everything and forgets nothing. +REP, and no money at all, and it was worth it.' };
  }

  clubSoda() {
    if (this.room !== 'ext') return { ok: false };
    if (!this._spend(T.clubDrink)) return { ok: false, msg: 'Twelve dollars for a club soda. You do not have twelve dollars, and everyone on the patio can somehow tell.' };
    this.heat = Math.max(0, this.heat - 6);
    return { ok: true, msg: `−$${T.clubDrink}. You sit on the patio like you belong. Nobody asks. Up here, confidence is the only membership card that scans.` };
  }

  // ── CASSIDY WORKS ─────────────────────────────────────────────────────────
  dockShift() {
    const p = this.player;
    if (this.block !== 2) return { ok: false, msg: 'One shift running, and it\'s the evening one. The dock keeps plant hours, not yours.' };
    if (p.hp < T.dockMinHp) return { ok: false, msg: 'The window slides shut. "Denny says no broken men on the dock. Union rule. Go eat something."' };
    this._earn(T.dockPay);
    p.hp = Math.max(1, p.hp - T.dockHpCost);
    this.stats.dockShifts = (this.stats.dockShifts || 0) + 1;
    this.endBlock('humped freight');
    return { ok: true, msg: `Two hours of lifting things that outweigh your ambitions. +$${T.dockPay} cash, and your back files a grievance with Local 448.` };
  }

  // The fell-off-the-truck pallet: one per day, somewhere in the yard, and Gus
  // knows every pallet BY WEIGHT. Time his loop or feed his ledger.
  palletToday() {
    const i = (this.seed + this.day * 7) % WORKS.pallets.length;
    return WORKS.pallets[i];
  }

  palletGrab() {
    const p = this.player;
    if (this.room !== 'ext') return { ok: false };
    if (this.dt.pallet === this.day) return { ok: false, msg: 'Nothing else fell off a truck today. Trucks are careful on Wednesdays, or whatever day this is.' };
    const gus = this.npcs.find(n => n.key === 'gus' && !n.ko);
    if (gus && Math.hypot(gus.x - p.x, gus.y - p.y) < T.gusCatchRange) {
      this.dt.pallet = this.day;   // the day's chance is BLOWN — Gus re-counts everything
      this.addHeat(6, 0, 'Gus wrote you up');
      this.say('Gus', this.pick(BARKS.gus_caught), gus.x, gus.y);
      return { ok: false, caught: true, msg: 'Gus materializes out of the yard like he IS the yard. The box stays. Your name enters the ledger, underlined.' };
    }
    this.dt.pallet = this.day;
    p.inv.freight = (p.inv.freight || 0) + 1;
    this.stats.freight = (this.stats.freight || 0) + 1;
    this.sfx('trunk');
    return { ok: true, msg: 'One box of "assorted" slides off the pallet and into your jacket, which is now a warehouse. It fell. Everyone agrees it fell.' };
  }

  fenceFreight(where) {
    const p = this.player;
    const n = p.inv.freight || 0;
    if (n <= 0) return { ok: false };
    const per = where === 'vern' ? T.freightVern : T.freightRoxy;
    if (where === 'vern' && this.room !== 'pawn') return { ok: false };
    if (where !== 'vern' && this.room !== 'cashking') return { ok: false };
    p.inv.freight = 0;
    this._earn(per * n);
    return { ok: true, msg: `${n} box${n === 1 ? '' : 'es'} of assorted → $${per * n}. ${where === 'vern' ? 'Vern doesn\'t even open them. "Assorted\'s assorted."' : 'Roxy: "Falling off trucks. In THIS economy. Somebody should look into gravity."'}` };
  }

  hallCoffee() {
    if (this.room !== 'unionhall') return { ok: false };
    if (!this._spend(T.hallCoffee)) return { ok: false, msg: 'You cannot afford the fifty-cent coffee. Denny watches you not afford it. This is the worst moment of your week.' };
    this.player.hp = Math.min(this.player.hpMax, this.player.hp + 3);
    return { ok: true, msg: '−50¢ in the honor box. The coffee tastes like the building: old, bitter, and still standing.' };
  }

  hallLayLow() {
    if (this.room !== 'unionhall') return { ok: false };
    const before = this.heat;
    this.heat = Math.max(0, this.heat - T.hallHeatDecay);
    this.endBlock('sat with the union');
    return { ok: true, msg: `Two hours of folding chairs and forty-year-old grievances. Heat ${Math.round(before)} → ${Math.round(this.heat)}. Nobody in this hall answers questions. They've all BEEN questions.` };
  }

  // ── DOWNTOWN ──────────────────────────────────────────────────────────────
  slBeer() {
    if (this.room !== 'splitlip') return { ok: false };
    if (!this._spend(T.slBeer)) return { ok: false, msg: 'Sal doesn\'t even look up. Broke men have a sound.' };
    this.player.hp = Math.min(this.player.hpMax, this.player.hp + 6);
    return { ok: true, msg: `−$${T.slBeer}. Cold, honest, and slightly hostile. The house style.` };
  }

  // Well whiskey. Past the second one, your stomach starts drafting a statement.
  slShot() {
    if (this.room !== 'splitlip') return { ok: false };
    if (!this._spend(T.slShot)) return { ok: false, msg: 'Three dollars. You are short of THREE dollars. Sal pours himself one in your honor.' };
    this.dt.shots++;
    if (this.dt.shots > 2 && this.chance((this.dt.shots - 2) * T.hurlBase)) {
      this.player.hp = Math.max(1, this.player.hp - 3);
      this.dt.shots = 0;
      this.fx('hurl', this.player.x, this.player.y, {});
      this.sfx('yell');
      return { ok: true, hurled: true, msg: this.pick(BARKS.hurl) };
    }
    this.player.hp = Math.min(this.player.hpMax, this.player.hp + 3);
    return { ok: true, msg: `−$${T.slShot}. It tastes like a lawnmower learned regret. Shot ${this.dt.shots} settles in anyway.` };
  }

  // Buy the room a round: the Lip's whole social contract in one transaction.
  slRound() {
    if (this.room !== 'splitlip') return { ok: false };
    if (this.dt.round === this.day) return { ok: false, msg: 'Sal: "Once a day, big spender. This ain\'t the Bluffs and you ain\'t your check."' };
    if (!this._spend(T.slRound)) return { ok: false, msg: 'You offer the room a round you cannot pay for. The room, kindly, pretends it never happened.' };
    this.dt.round = this.day;
    this.heat = Math.max(0, this.heat - T.slRoundHeat);
    this.say('Sal', 'ROUND ON THE KID. Act like you\'ve been loved before, you animals.', 200, 90);
    return { ok: true, msg: `−$${T.slRound}. The room roars. For one round of well whiskey these people would carry you out of a fire, feet first, but still.` };
  }

  slLayLow() {
    if (this.room !== 'splitlip') return { ok: false };
    const before = this.heat;
    this.heat = Math.max(0, this.heat - T.slHeatDecay);
    this.endBlock('nursed one at the Lip');
    return { ok: true, msg: `You nurse one beer for two hours like a professional. Heat ${Math.round(before)} → ${Math.round(this.heat)}. This room talks, though. It always talks.` };
  }

  cueGrab() {
    if (this.room !== 'splitlip') return { ok: false };
    if (this.player.held) return { ok: false, msg: 'Your hands are full. The rack judges you anyway.' };
    this.player.held = { kind: 'cue', dur: WEAPONS.cue.dur };
    return { ok: true, msg: 'You take a house cue. Warped, sticky, perfect. If it leaves the building, you bought it — house rule, in blood.' };
  }

  latte() {
    if (this.room !== 'daybreak') return { ok: false };
    if (!this._spend(T.latteCost)) return { ok: false, msg: 'Nine dollars. Madison\'s face does genuine grief on your behalf.' };
    this.player.hp = Math.min(this.player.hpMax, this.player.hp + T.latteHeal);
    this.stats.lattes = (this.stats.lattes || 0) + 1;
    return { ok: true, msg: `−$${T.latteCost}. It's... it's really good. You hate that it's good. You drink it where nobody from the Lip can see you.` };
  }

  overhear() {
    if (this.room !== 'daybreak') return { ok: false };
    if (!this.scheme.hear) {
      this._schemeCheck('hear');
      return { ok: true, msg: 'The Fairview table, not quietly: "—game store\'s the holdout. Old man\'s got a back room full of \'97 stock he thinks is a pension—" You stir your water like it\'s a job.' };
    }
    return { ok: true, msg: `The reps again: "${this.pick(BARKS.fairview_rep)}"` };
  }

  pawnFence() {
    const s = this.scheme;
    if (this.room !== 'pawn' || s.inCar <= 0) return { ok: false, msg: 'Vern squints at your empty hands. "Come back with a story, kid."' };
    const n = s.inCar, take = T.pawnCrate * n;
    s.inCar = 0; s.sold += n; s.cash += take; s.holding = false;
    this._earn(take);
    this._schemeCheck('fence');
    return { ok: true, msg: `${n} crate${n === 1 ? '' : 's'} → $${take}, flat, no questions. Vern: "I never saw you, you never saw the owl see you."` };
  }

  pawnBuy(what) {
    if (this.room !== 'pawn') return { ok: false };
    if (what === 'bat') {
      if (!this._spend(T.pawnBat)) return { ok: false, msg: 'Eighteen bucks. Vern: "The bat stays in the family till then."' };
      if (this.player.held) this.throwHeld();
      this.player.held = { kind: 'bat', dur: WEAPONS.bat.dur };
      return { ok: true, msg: `−$${T.pawnBat}. A Louisville with somebody's initials burned in it and one story Vern won't tell.` };
    }
    if (what === 'crowbar') {
      if (this.player.inv.crowbar) return { ok: false, msg: 'You have one. Vern respects a man with his own iron.' };
      if (!this._spend(T.pawnCrowbar)) return { ok: false, msg: 'Twenty-six. The convenience tax is for not having to look Earl in the eye.' };
      this.player.inv.crowbar = true; this._schemeCheck('tools');
      return { ok: true, msg: `−$${T.pawnCrowbar}. Vern wraps it in newspaper like a fish. "For the look of the thing."` };
    }
    return { ok: false };
  }

  // ── Rolling a body ────────────────────────────────────────────────────────
  // The payoff combat never had. It's also the meanest thing in the prototype, so it
  // bills you twice: heat now (robbery, not a scuffle) and a grudge that gets up later.
  rollableNear() {
    const p = this.player;
    let best = null, bd = 46;
    for (const n of this.npcs) {
      if (!n.ko || n.robbed || n.room !== this.room || n.cop) continue;
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  rollBody() {
    const n = this.rollableNear();
    if (!n) return { ok: false };
    n.robbed = true;
    const take = n.wallet;
    if (take > 0) this._earn(take);
    this.stats.rolled = (this.stats.rolled || 0) + 1;
    this.stats.rolledCash = (this.stats.rolledCash || 0) + take;
    this.addHeat(T.rollHeat, 0, 'robbing a man on the ground');
    this.addGrudge(T.grudgeRob, 'went through a man\'s pockets');
    if (this.chance(T.grudgeChance)) n.grudge = true;      // he will remember this
    this.sfx('pickup');
    const line = take >= 20 ? this.pick(BARKS.rolled_fat)
               : take > 0   ? this.pick(BARKS.rolled)
               :              this.pick(BARKS.rolled_empty);
    return { ok: true, msg: take > 0 ? `+$${take}. ${line}` : line };
  }

  // Shove: no damage, all consequence. The bible's stumbling drunk, and the reason
  // T.shoveForce existed for a day without a single caller.
  shove() {
    const p = this.player;
    if (p.atkT > 0 || p.windT > 0 || this.over) return { ok: false };
    if (p.stamina < T.shoveStamina) return { ok: false, msg: 'No hands left for that.' };
    p.stamina -= T.shoveStamina;
    p.atkT = T.punchCooldown * 0.7;
    this.sfx('whoosh', p.x, p.y);
    for (const n of this.npcs) {
      if (n.ko || n.room !== this.room) continue;
      const dx = n.x - p.x, dy = n.y - p.y, d = Math.hypot(dx, dy);
      if (d > T.shoveRange) continue;
      const ang = Math.atan2(dy, dx);
      let da = Math.abs(ang - p.facing); if (da > Math.PI) da = 2 * Math.PI - da;
      if (da > 1.3) continue;
      n.vx += Math.cos(ang) * T.shoveForce; n.vy += Math.sin(ang) * T.shoveForce;
      n.stunT = 0.5;
      this.fx('impact', n.x, n.y, { ang });
      this.sfx('thud', n.x, n.y);
      if (n.cop) { this.addHeat(18, 1, 'shoving an officer'); n.state = 'chase'; }
      else {
        this.addHeat(T.heatCrime.assault * 0.4, 0, 'shoving somebody');
        if (!n.brawler && this.chance(0.5)) { n.state = 'aggro'; }
      }
      return { ok: true };
    }
    return { ok: true, msg: 'You shove a volume of night air. It takes it well.' };
  }

  hitNpc(n, dmg, ang, kb) {
    n.hp -= dmg; n.hitT = 0.22; n.hitDir = ang;
    n.vx += Math.cos(ang) * kb; n.vy += Math.sin(ang) * kb;
    this.fx('impact', n.x, n.y, { ang });
    if (!n.cop && !n.brawler && !n.ko) {
      // civilians: assault, witnessed — and one more person who won't forget
      this.addHeat(T.heatCrime.assault, 0, 'assault');
      if (!n.grudged) { n.grudged = true; this.addGrudge(T.grudgeAssault, 'hit a neighbour'); }
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
      else this.say(n.name || 'Townie', this.pick(BARKS.fled), n.x, n.y);
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
    if (p.hp <= 0 && !this.over) { this.stats.koTaken++; this.endGame('BODIED'); }
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
      debtOpen: this.player.debt > 0, grudge: this.grudge || 0,
      stats: { ...this.stats }, meta: { ...m, knows: { ...m.knows } },
      roommate: key === 'BODIED' ? this.pick(BARKS.hospital_roommate) : null,
    };
    summary.coda = (ENDINGS[key] && ENDINGS[key].coda) ? ENDINGS[key].coda(summary) : '';
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
      shove: () => this.shove(),
      roll: () => this.rollBody(),
      foxEnter: () => this.enterFoxhole(), foxDrink: () => this.foxDrink(),
      foxTip: () => this.foxTip(arg), foxInfo: () => this.foxBuyInfo(),
      foxVip: () => this.foxVip(), foxLayLow: () => this.foxLayLow(),
      slBeer: () => this.slBeer(), slShot: () => this.slShot(), slRound: () => this.slRound(),
      slLayLow: () => this.slLayLow(), cueGrab: () => this.cueGrab(),
      latte: () => this.latte(), overhear: () => this.overhear(),
      pawnFence: () => this.pawnFence(), pawnBuy: () => this.pawnBuy(arg),
      dockShift: () => this.dockShift(), palletGrab: () => this.palletGrab(),
      fenceFreight: () => this.fenceFreight(arg), hallCoffee: () => this.hallCoffee(),
      hallLayLow: () => this.hallLayLow(),
      enterCampus: () => this.enterCampus(arg), attendClass: () => this.attendClass(),
      claimAid: () => this.claimAid(), libLayLow: () => this.libLayLow(),
      gymSpot: () => this.gymSpot(), touchCart: () => this.touchCart(),
      caseHouse: () => this.caseHouse(arg), enterHouse: () => this.enterHouse(arg),
      searchSpot: () => this.searchSpot(arg), leaveHouse: () => this.leaveHouse(),
      fenceLoot: () => this.fenceLoot(arg), leakBinder: () => this.leakBinder(),
      clubSoda: () => this.clubSoda(),
      shiftAuto: () => this.doShiftAuto(arg || 0), endBlock: () => { this.endBlock(arg || 'waited'); return { ok: true }; },
      brawlAuto: () => this.brawlAuto(arg || 2), heistTripAuto: () => this.heistTripAuto(),
      exitShopCheck: () => { this.exitShopCheck(); return { ok: true }; },
      enter: () => { return this.enterRoom(arg); }, leave: () => { return this.leaveRoom(); },
    };
    if (!A[name]) return { ok: false, msg: `no act ${name}` };
    return A[name]() || { ok: true };
  }

  // ⚠️ Hours live HERE, not in the UI. main.js used to compute its own openMap for the
  // prompt while enterRoom guarded only two doors — so three shops read "(closed)" and
  // opened anyway. One source of truth; the UI asks this.
  isOpen(key, block = this.block) {
    switch (key) {
      case 'qwikstop': return true;                     // never closes, that's the point
      case 'garage': return true;
      case 'hardware': return block <= 1;
      case 'buffet': return block >= 1 && block <= 2;
      case 'wingbarn': return block <= 2;
      case 'gamebarn': return block <= 2;
      case 'cashking': return block >= 1;
      case 'foxhole': return block >= 2;      // evening and late only, obviously
      case 'splitlip': return block >= 1;     // Sal opens for the lunch drinkers. Community service.
      case 'daybreak': return block <= 2;     // closes at dark; they're not from here
      case 'pawn': return block <= 2;
      case 'unionhall': return true;          // lit out of spite. ALWAYS lit. That's the point.
      default: return true;
    }
  }

  closedLine(key) {
    return {
      hardware: 'Earl closes early. Everything must go, including Earl, at 3 p.m.',
      buffet: this.block === 0 ? 'The steam table doesn\'t open until lunch. Wanda has standards, and one of them is lunch.'
                               : 'Dark. The fish tank light is on. The fish is on his own out there.',
      wingbarn: 'Closed. Through the glass you can see the mop bucket, waiting for a man it has already broken.',
      gamebarn: 'Locked. The sign flips to CLOSED at dark. Gary sleeps above the shop, allegedly.',
      cashking: 'Roxy isn\'t in yet. The glass is doing its job in the meantime.',
      foxhole: 'Dark. The fox sign\'s off and Moose\'s truck is gone. Doors at six, same as it\'s been since the eighties.',
      splitlip: 'Sal opens at noon. Before that he\'s in there alone, mopping, and nobody needs to see a man commune with that floor.',
      daybreak: 'Closed. The chairs are upside down on the tables like they\'re surrendering. Nine dollars, and they\'re scared of the dark.',
      pawn: 'The cage is down. Vern sleeps above the shop with the owl and, allegedly, the good jewelry.',
    }[key] || 'Closed.';
  }

  enterRoom(key) {
    if (!INTERIORS[key]) return { ok: false };
    if (!this.isOpen(key)) return { ok: false, msg: this.closedLine(key) };
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
    // ⚠️ ORDER MATTERS: gamebarn IS in BUILDINGS, so this check must precede the
    // generic front-door exit or the heist walks you out onto the lit sidewalk.
    if (this.room === 'gamebarn' && this.gameBarnDark) {
      this.player.x = 1540; this.player.y = 160;
      if (this.player.carryCrate) this._patrolRoll();
    }
    else if (b) { this.player.x = b.x + b.w / 2; this.player.y = STRIP_Y.base + 30; }
    else if (this.room === 'garage') { this.player.x = GARAGE.door.x + 20; this.player.y = GARAGE.y - 26; }
    else if (this.room === 'foxhole') { this.player.x = FOXHOLE.door.x; this.player.y = FOXHOLE.door.y + 24; }
    else if (this.room === 'unionhall') { this.player.x = WORKS.hall.door.x; this.player.y = WORKS.hall.door.y + 26; }
    else if (['shop', 'aid', 'library'].includes(this.room)) {
      const bk = { shop: 'shop', aid: 'admin', library: 'library' }[this.room];
      const b = HTCC.buildings.find(x => x.key === bk);
      if (b) { this.player.x = b.door.x; this.player.y = b.door.y + 24; }
      if (this.htcc.stashed) {            // …and you pick it back up out of the hedge
        this.htcc.stashed = false; this.player.inv.crowbar = true;
        this.alert(`The ${T.shopToolName} is exactly where you left it. Nobody on this campus has ever looked in that hedge.`, 'ok');
      }
    }
    else {
      const dtb = DOWNTOWN.find(d => d.key === this.room);
      if (dtb) { this.player.x = dtb.x + dtb.w * ((dtb.face && dtb.face.doorAt) || 0.5); this.player.y = DT_Y.base + 28; }
    }
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
    if (p.windT > 0) { p.windT -= dt; if (p.windT <= 0) { p.windT = 0; this._resolveSwing(); } }
    p.strikeT = Math.max(0, (p.strikeT || 0) - dt);
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

    // first trip past the tracks gets a title card
    if (this.room === 'ext' && !this.dt.seen && p.y > RAIL_Y + 60) {
      this.dt.seen = true;
      this.alert('DOWNTOWN — eleven storefronts, four with a pulse. The interstate said no in \'74 and the fonts never recovered.', 'scheme');
    }
    if (this.room === 'ext' && !this.dt.worksSeen && p.x > 2280 && p.y < 1600) {
      this.dt.worksSeen = true;
      this.alert('CASSIDY WORKS — nine hundred jobs once. One shift now. The freight still comes through, and nobody counts it like they used to.', 'scheme');
    }
    if (this.room === 'ext' && !this.htcc.seen && p.x > HTCC.bounds.x && p.x < HTCC.bounds.x + HTCC.bounds.w
        && p.y > HTCC.bounds.y && p.y < HTCC.bounds.y + HTCC.bounds.h) {
      this.htcc.seen = true;
      this.alert('HOPEWELL TECHNICAL & COMMUNITY COLLEGE — the sign says Hopewell Tech. The dean says Hopeless. You are enrolled here, for the money.', 'scheme');
    }
    if (this.room === 'ext' && !this.dt.bluffsSeen && p.y > BLUFFS.gateY - 20) {
      this.dt.bluffsSeen = true;
      this.alert('THE BLUFFS — lake money, boat people, and the only nine blocks in this county where a squad car shows up because somebody PAID for it to.', 'scheme');
    }

    // ⚠️ THE BURGLARY CLOCK. Runs in the SIM so it survives the hidden-tab path
    // and so leaving the room can't dodge it. When it hits zero, they're already here.
    if (this.burg.in) {
      this.burg.t -= dt;
      this.burg.barkT = (this.burg.barkT || 0) - dt;
      if (this.burg.barkT <= 0 && this.burg.t > 0) {
        this.burg.barkT = this.rr(7, 13);
        this.say(null, this.pick(BARKS.burg_tense), p.x, p.y);
      }
      if (this.burg.t <= 0) this._bluffsResponse();
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
    n.strikeT = Math.max(0, (n.strikeT || 0) - dt);
    if (n.stunT) { n.stunT = Math.max(0, n.stunT - dt); return; }
    n.x += n.vx * dt; n.y += n.vy * dt;
    n.vx *= Math.pow(0.001, dt); n.vy *= Math.pow(0.001, dt);
    if (n.ko) {
      n.koT += dt;
      // Hopewell does not leave bodies lying in the lot all night. They get up, and
      // the ones you searched get up with a specific opinion about you.
      const wake = n.robbed ? T.wakeRobbedAfterS : T.wakeAfterS;
      if (n.koT > wake && !n.static) {
        n.ko = false; n.koT = 0; n.hp = Math.max(8, Math.round(n.hpMax0 * T.wakeHpFrac));
        n.wallet = 0;                       // already picked clean
        if (n.grudge) {
          n.state = 'aggro'; n.brawler = true; n.persistent = true;
          this.say(n.name || 'Townie', this.pick(BARKS.woke_grudge), n.x, n.y);
          this.sfx('yell', n.x, n.y);
        } else {
          n.state = this.chance(0.5) ? 'flee' : 'idle';
          this.say(n.name || 'Townie', this.pick(BARKS.woke), n.x, n.y);
        }
      }
      return;
    }
    const dToP = Math.hypot(p.x - n.x, p.y - n.y);

    if (n.cop) return this._updateCop(n, dt, dToP);

    // The Polo Shirts can't arrest anybody, so their entire threat is a phone call —
    // and they only make it if you're visibly carrying. Catching a man with a chair
    // leg on a campus with metal detectors is, to Trevor, the biggest day of his year.
    if (n.key === 'trevor' && !n.ko && p.held && dToP < 190 && (n.hassleT || 0) <= 0) {
      n.hassleT = 26;
      this.polosHassle(n);
    }
    if (n.hassleT) n.hassleT = Math.max(0, n.hassleT - dt);

    // civilian route-walkers (Gus, Trevor): patrol the loop, slower than a cop
    if (n.route && n.state === 'idle') {
      const w = n.route[n.wpt];
      const dx = w[0] - n.x, dy = w[1] - n.y, d = Math.hypot(dx, dy);
      if (d < 12) n.wpt = (n.wpt + 1) % n.route.length;
      else { n.x += (dx / d) * 46 * dt; n.y += (dy / d) * 46 * dt; n.facing = Math.atan2(dy, dx); }
      n.barkT -= dt;
      if (n.barkT <= 0 && dToP < 200 && this.chance(0.5)) {
        n.barkT = this.rr(16, 30);
        this.say(n.name, this.pick(BARKS[n.pool] || BARKS.townie_idle), n.x, n.y);
      } else if (n.barkT <= 0) n.barkT = this.rr(10, 20);
      this.collide(n, 12);
      return;
    }

    switch (n.state) {
      case 'idle': {
        // ⚠️ Measured over 20 passive runs: NOTHING in Hopewell ever touched the player
        // first. In a town the design calls mean, that's a hole. Loiter next to a drunk
        // in the lot after dark and he will eventually decide he knows you from somewhere.
        if (n.drunk && this.isLate && dToP < 95 && !n.fuseSpent) {
          n.fuse = (n.fuse || 0) + dt;
          if (n.fuse > T.drunkFuseS) {
            n.fuseSpent = true;
            if (this.chance(0.55)) {
              n.state = 'aggro';
              this.say(n.name || 'Drunk', 'Hey. HEY. I know you. I know your whole DEAL.', n.x, n.y);
            } else {
              n.fuse = 0;
              this.say(n.name || 'Drunk', this.pick(BARKS.drunk), n.x, n.y);
            }
            break;
          }
        } else if (n.fuse) n.fuse = Math.max(0, n.fuse - dt * 0.6);
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
          // after the job, the town talks about the job
          const pool = (this.scheme.job && !n.key && this.chance(0.55))
            ? BARKS.aftermath : (BARKS[n.pool] || BARKS.townie_idle);
          this.say(n.name || null, this.pick(pool), n.x, n.y);
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
        const sp = n.brawler ? T.brawlerSpeed : T.npcAggroSpeed;
        if (n.windT > 0) {
          // committed — they're planted, winding up. This is your window.
          n.windT -= dt;
          if (n.windT <= 0) {
            n.windT = 0; n.atkT = this.rr(...T.npcAtkCooldown); n.strikeT = 0.18;
            const now = Math.hypot(p.x - n.x, p.y - n.y);
            if (now < 44) this.hitPlayer(this.ri(...T.npcDmg), Math.atan2(p.y - n.y, p.x - n.x), n);
            else this.sfx('whoosh', n.x, n.y);   // you stepped out of it
          }
        } else if (dToP > 34) { n.x += Math.cos(ang) * sp * dt; n.y += Math.sin(ang) * sp * dt; }
        else if (n.atkT <= 0) { n.windT = T.npcWindUp; this.sfx('swing', n.x, n.y); }
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
      const sp = T.copChaseSpeed; // between walk and sprint — stamina decides the race
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
