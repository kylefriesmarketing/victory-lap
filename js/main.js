// VICTORY LAP — main.js
// Boot, input, HUD, the register minigame, cuff-mash, endings, persistence, loop.
// The sim never touches this file's DOM; this file never reaches into sim internals
// except through game.act / documented fields.

import { Game, soakRun, T, BUILDINGS, GARAGE, FOXHOLE, DOWNTOWN, DT_Y, WATER_TOWER, COURTHOUSE,
         WORKS, BLUFFS, LOOT, SEARCH_SPOTS, HTCC, INTERIORS, STRIP_Y, BARKS, SCHEME, ENDINGS,
         BLOCK_NAMES, DAY_NAMES, NAMED } from './game.js';
import { Renderer } from './render.js';
import { Sfx } from './audio.js';

const $ = (id) => document.getElementById(id);
const uiPick = (a) => a[Math.floor(Math.random() * a.length)]; // UI barks never touch sim rng
const METAKEY = 'vl-meta-v1';

let game = null, renderer = null, sfx = new Sfx();
let paused = false, modalPause = false;
let input = { up: 0, down: 0, left: 0, right: 0, sprint: 0 };
let lastRaf = 0;

function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(METAKEY));
    if (m && m.knows) return m;
  } catch {}
  return { runs: 0, cred: 0, scars: 0, lessons: 0, rep: 0, cashBanked: 0,
           knows: { window: false, blind: false, drop: false, dog: false } };
}
function saveMeta(m) { try { localStorage.setItem(METAKEY, JSON.stringify(m)); } catch {} }

// ---------------------------------------------------------------------------
// BOOT + TITLE
// ---------------------------------------------------------------------------

const qs = new URLSearchParams(location.search);

function showTitle() {
  const m = loadMeta();
  $('t-runs').textContent = m.runs === 0
    ? 'Semester one. Nobody knows you yet. That won\'t last.'
    : `Run ${m.runs + 1}. REP ${m.rep} • CRED ${m.cred} • SCARS ${m.scars} • LESSONS ${m.lessons}` +
      (m.cashBanked ? ` • $${m.cashBanked} banked somewhere the town can't reach` : '');
  const known = [];
  if (m.knows.window) known.push('the propped window');
  if (m.knows.blind) known.push('the camera\'s sweep');
  if (m.knows.drop) known.push('the drop night');
  if (m.knows.dog) known.push('Buster');
  $('t-knows').textContent = known.length ? `The town forgot the charges. You didn't forget: ${known.join(' • ')}` : '';
  $('title').style.display = 'flex';
}

function startRun() {
  $('title').style.display = 'none';
  const meta = loadMeta();
  const seed = parseInt(qs.get('seed') || '', 10) || ((Date.now() % 89999) + 1);
  game = new Game({ seed, meta, cb: {
    bark: (who, text, x, y) => renderer && renderer.bark(who, text, x, y),
    alert: feed,
    sfx: (n) => sfx.play(n),
    fx: (k, x, y, d) => renderer && renderer.fx(k, x, y, d),
    heatStage: (st) => {
      if (st >= 3) { sfx.play('siren'); if (renderer) renderer.focusOn(game.player.x, game.player.y, 1.06, 1.4); }
    },
    blockEnd: () => onBlock(),
    dayEnd: () => { saveMeta(game.meta); onDay(); },
    ending: (key, sum) => { saveMeta(game.meta); showEnding(key, sum); },
    scheme: (stage) => {
      updateScheme(); pulse($('hud-scheme')); sfx.play('register');
      // the two stages that are actually a MOMENT get the lens; the rest are admin
      if (renderer && (stage === 'job' || stage === 'fence')) renderer.focusOn(game.player.x, game.player.y, 1.62, 1.5);
    },
    cuff: (cop) => cuffStart(cop),
  } });
  window.vl = game;
  renderer = new Renderer($('cv'), game);
  try {                                       // the preference outlives the run
    if (localStorage.getItem('vl-camfx') === '0') {
      renderer.camFx = false;
      $('p-cam').textContent = '🎥 Camera motion: OFF';
    }
  } catch {}
  resize();
  sfx.ensure();
  ambience();
  updateScheme(); updateHud();
  toast(`${game.dayName}, week 14 of the semester`, weatherLine(game.weather), 2.8);
  if (meta.runs > 0) setTimeout(() => {
    renderer.bark(null, BARKS.greet_run[meta.runs % BARKS.greet_run.length], game.player.x + 60, game.player.y - 20);
  }, 2200);
  if (meta.runs === 0) setTimeout(() => {
    feed('Move: WASD • Sprint: SHIFT • Talk/use: E • Swing: SPACE • Shove: F • Throw/drop: Q • Scheme: TAB', 'ok');
    feed('Rent is theoretical. The week is not. Find Peanut when the sun drops, and don\'t lend anybody shit.', 'scheme');
  }, 900);
  // what you carried over from last time — the town forgot; you didn't
  if (game.knewWindow || game.knewDrop) setTimeout(() => {
    if (game.knewWindow) feed('You already know about the window over the dumpster. You always will.', 'scheme');
    if (game.knewDrop) feed('And you know when the store sits empty. Thursday. Nine o\'clock. Nobody had to tell you twice.', 'scheme');
  }, 1500);
}

function weatherLine(w) {
  return { clear: 'Clear. The sky owes nobody here a damn thing.',
           overcast: 'Overcast, like a lid on a pot somebody forgot they were boiling.',
           rain: 'Rain. The cops stay in the car. Remember that, and get wet accordingly.',
           heatwave: 'Heatwave. Everybody\'s outside, every window\'s open, and everyone\'s a little more naked than the law prefers.' }[w] || '';
}

function onBlock() {
  ambience();
  // the shift horn: if you're anywhere near the plant, the block change IS the horn
  if (game && game.room === 'ext' && game.player.x > 2100) sfx.play('shifthorn');
  const lines = {
    1: 'AFTERNOON — the town with its makeup off.',
    2: 'EVENING — the neon wakes up. So does everybody worth avoiding.',
    3: 'LATE — the hour of bad ideas. Yours are already stretching.',
    4: 'BONUS BLOCK — the Rip is writing checks your Tuesday will bounce.',
  };
  toast(game.blockName, lines[Math.min(game.block, 4)] || '', 2.2);
}
function onDay() {
  ambience();
  toast(game.dayName, weatherLine(game.weather), 2.8);
  if (game.day === 3 && game.scheme.window) feed('Tonight is the drop night. Nine o\'clock. The store just sits there.', 'scheme');
}

function ambience() {
  if (!game) return;
  const kinds = ['morning', 'afternoon', 'evening', 'late', 'late'];
  const kind = game.room === 'ext' ? kinds[Math.min(game.block, 4)] : `in:${game.room}`;
  sfx.startAmbience(kind, game.weather);
}
let lastRoom = 'ext';

// ---------------------------------------------------------------------------
// FEED / TOAST / CHOICE
// ---------------------------------------------------------------------------

function feed(text, kind = 'ok') {
  const el = document.createElement('div');
  el.className = `feed-item feed-${kind}`;
  el.textContent = text;
  $('feed').appendChild(el);
  while ($('feed').children.length > 5) $('feed').firstChild.remove();
  setTimeout(() => { el.classList.add('feed-out'); setTimeout(() => el.remove(), 600); }, 6200);
}

let toastT = null;
function toast(big, small, dur = 2.4) {
  $('toast-big').textContent = big; $('toast-small').textContent = small;
  $('toast').classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => $('toast').classList.remove('show'), dur * 1000);
}

function pulse(el) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }

let choiceOpen = false;
function showChoice(title, sub, opts) {
  const box = $('choice');
  $('choice-title').textContent = title;
  $('choice-sub').textContent = sub || '';
  const list = $('choice-opts'); list.innerHTML = '';
  for (const o of opts) {
    const b = document.createElement('button');
    b.className = 'btn'; b.textContent = o.label;
    b.onclick = () => { closeChoice(); o.go && o.go(); };
    list.appendChild(b);
  }
  const x = document.createElement('button');
  x.className = 'btn btn-dim'; x.textContent = 'Never mind';
  x.onclick = closeChoice; list.appendChild(x);
  box.style.display = 'flex'; choiceOpen = true;
}
function closeChoice() { $('choice').style.display = 'none'; choiceOpen = false; }

function result(r) { if (r && r.msg) feed(r.msg, r.ok ? 'ok' : 'warn'); return r; }

// ---------------------------------------------------------------------------
// INTERACTIONS
// ---------------------------------------------------------------------------

function interactables() {
  if (!game || game.over) return [];
  const g = game, p = g.player, out = [];
  const add = (x, y, r, label, go) => out.push({ x, y, r, label, go });
  if (g.room === 'ext') {
    for (const b of BUILDINGS) {
      const dx = b.x + b.w / 2, dy = STRIP_Y.base + 6;
      if (b.key === 'dead') { add(dx, dy, 46, 'Read the Fairview board', () => {
        feed('"DAYBREAK COMMONS — curated retail, elevated living." Elevated from whom, it doesn\'t say.', 'warn'); }); continue; }
      if (b.key === 'tattoo') { add(dx, dy, 46, 'Stick City (walk-ins, not you)', () => {
        renderer.bark(null, 'Tattoo guy, through the door: "Booked. Come back when you got scheme money."', dx, dy - 20); }); continue; }
      // hours come from the sim (g.isOpen) — the UI must never keep its own copy
      if (g.isOpen(b.key)) add(dx, dy, 46, `Enter ${b.label}`, () => result(g.act('enter', b.key)));
      else add(dx, dy, 46, `${b.label} — closed`, () => result(g.act('enter', b.key)));
    }
    add(GARAGE.door.x + 20, GARAGE.y - 8, 50, 'The garage (home, roughly)', () => result(g.act('enter', 'garage')));
    // The Foxhole — cover charge at the door, and Moose is not a negotiator
    add(FOXHOLE.door.x, FOXHOLE.door.y + 16, 58,
      g.isOpen('foxhole')
        ? (g.fox.paid === g.day ? 'Back into the Foxhole (paid tonight)' : `The Foxhole — $${T.foxCover} cover`)
        : 'The Foxhole (dark)',
      () => {
        const r = result(g.act('foxEnter'));
        if (!r.ok && g.isOpen('foxhole')) renderer.bark('Moose', uiPick(BARKS.moose), FOXHOLE.door.x, FOXHOLE.door.y - 10);
      });
    // the alley window behind Game Barn
    const wx = 1537, wy = 172;
    if (!g.scheme.case) add(wx, wy, 54, 'Look at that window (propped on a milk crate)', () => result(g.act('caseAlley')));
    else if (g.canHeist()) add(wx, wy, 54, g.heistWindowOpen() ? 'THE JOB — in through the window (drop night)' : 'In through the window (risky — Gary might be in)', () => {
      const r = result(g.act('startHeist'));
      if (r.caught === 'gary') renderer.bark('Gary', 'I\'m calling somebody. I don\'t know who yet. GET OUT.', wx, wy - 20);
    });
    else if (g.scheme.crates >= T.crateCount) add(wx, wy, 54, 'The window (it gave everything it had)', () => {});
    else add(wx, wy, 54, 'The window (come back late, with iron)', () => feed('Late block, crowbar in hand. That\'s the recipe.', 'warn'));
    // the beater
    const car = { x: 1330, y: 592 };
    if (p.carryCrate) add(car.x, car.y, 62, 'Stash the crate in the trunk', () => result(g.act('stashCrate')));
    else if (g.day === 6 && g.scheme.inCar > 0) add(car.x, car.y, 62, 'Meet the city buyer (Sunday, as promised)', () => result(g.act('sundayBuyer')));
    else add(car.x, car.y, 62, `The beater${g.scheme.inCar ? ` (${g.scheme.inCar} crate${g.scheme.inCar > 1 ? 's' : ''} in the trunk)` : ''}`, () =>
      feed(g.scheme.inCar ? 'The trunk holds. The zip ties hold. Probably.' : 'It\'ll start. Third try. It knows the routine.', 'ok'));
    // dog
    if (!g.dogCalm) add(600, 1215, 60, p.inv.jerky > 0 ? 'Offer Buster the jerky (a treaty)' : 'Buster (he is narrating your position)', () => result(g.act('feedDog')));
    else add(600, 1215, 60, 'Buster (an ally)', () => renderer.bark('Buster', BARKS.buster[2], 600, 1195));
    // bench + bus
    add(1160, 1062, 46, 'The bench (kill the rest of the block)', () => showChoice('Kill time on the bench?', 'The rest of this block goes nowhere, on purpose. Heals a little. BIG DON\'s laminated face watches you the whole time.', [
      { label: 'Sit. Watch the street. Become the street.', go: () => { p.hp = Math.min(p.hpMax, p.hp + T.benchRestHeal); result(g.act('endBlock', 'bench')); } }]));
    if (g.scheme.fence && g.block === 0) add(1035, 1082, 56, 'CATCH THE 6 A.M. — end it clean', () => showChoice('Walk?', 'Cash out, bank it, let the town wonder. That\'s the win.', [
      { label: 'Get on the bus.', go: () => { sfx.play('bus'); result(g.act('walkOut')); } }]));
    else add(1035, 1082, 56, 'Bus schedule (a work of fiction)', () => feed('The 6 a.m. runs when it wants. It\'ll run for a winner.', 'ok'));
    // named talkers
    for (const n of g.npcs) {
      if (n.room !== 'ext' || n.ko) continue;
      if (n.key === 'peanut') add(n.x, n.y, 50, 'Talk to Peanut', () => { const r = g.act('talkPeanut'); renderer.bark('Peanut', r.text, n.x, n.y); });
      else if (n.key === 'chuck' || n.key === 'tanner') add(n.x, n.y, 44, `${n.name} (Alumni, loud)`, () => renderer.bark(n.name, uiPick(BARKS[n.key]), n.x, n.y));
    }
    // DOWNTOWN doors + furniture
    for (const b of DOWNTOWN) {
      const dx = b.x + b.w * ((b.face && b.face.doorAt) || 0.5), dy = DT_Y.base + 6;
      if (b.dead) {
        add(dx, dy, 44, b.label, () => feed(b.dead === 'fairview'
          ? '"ANOTHER FAIRVIEW OPPORTUNITY." It spreads. Like the buffet\'s grease fire, but with fonts.'
          : 'Papered glass. Behind it, a room where a business used to stand and now dust practices standing.', 'warn'));
        continue;
      }
      if (g.isOpen(b.key)) add(dx, dy, 46, `Enter ${b.label}`, () => result(g.act('enter', b.key)));
      else add(dx, dy, 46, `${b.label} — closed`, () => result(g.act('enter', b.key)));
    }
    // ── HOPELESS TECH ──
    for (const b of HTCC.buildings) {
      const enterable = ['admin', 'shop', 'library'].includes(b.key);
      const warn = p.held ? ' ⚠ the detector will eat that' : '';
      add(b.door.x, b.door.y + 14, 48,
        enterable ? `${b.name}${warn}` : b.name,
        () => {
          const r = result(g.act('enterCampus', b.key));
          if (r.tookWeapon) { updateHud(); sfx.play('yell'); }
        });
    }
    add(HTCC.buildings[2].door.x - 60, HTCC.buildings[2].door.y + 30, 54,
      `Spot the meatheads at the gym — $${T.gymPay}`,
      () => showChoice('The gym.', 'Two Alumni are working out and narrating it entirely in numbers. They need a third pair of hands.', [
        { label: `Spot for them — $${T.gymPay}`, go: () => result(g.act('gymSpot')) }]));
    add(HTCC.quad.x + HTCC.quad.w * 0.5, HTCC.quad.y + HTCC.quad.h * 0.52, 56,
      'The Class of 1994 Memorial Fountain (dry)', () =>
      feed('Dry since the ’09 budget. There are three coins and a vape in the basin. Somebody still made a wish over a dead fountain, which is the most Hopewell act of faith there is.', 'ok'));
    const cartN = g.npcs.find(n => n.key === 'trevor' && !n.ko);
    if (cartN) add(cartN.x + 42, cartN.y + 14, 46, 'The cart (do NOT sit on the cart)', () => showChoice(
      'The cart.', 'Electric. Eleven miles an hour. County property. Trevor is emotionally attached to it in a way that is genuinely moving and completely insane.', [
      { label: 'Sit on the cart', go: () => { const r = result(g.act('touchCart')); if (r.ok) sfx.play('yell'); } }]));
    // ── THE BLUFFS ──
    for (const h of BLUFFS.houses) {
      const st = g.houseState(h.key);
      const cx = h.x + h.w / 2;
      // from the road: case it. Free, costs seconds, and turns tells into facts.
      add(cx, h.y + h.h + 66, 58,
        st.cased ? `${h.name} — cased (${st.occupied ? 'HOME' : 'empty'}${st.alarmed ? ', ALARMED' : ', no alarm'})`
                 : `Watch ${h.name} from the road (${T.caseSecs}s)`,
        () => result(g.act('caseHouse', h.key)));
      // at the door: go in
      if (!st.done) add(cx, h.y + h.h + 8, 46, `${h.name} — try the ${st.openWindow ? 'lake window' : 'slider'}`, () => {
        const known = st.cased;
        showChoice(h.name.replace(/^the /, 'The '), h.blurb + (known
          ? `\n\nYou watched it: ${st.occupied ? 'SOMEBODY IS HOME.' : 'nobody home.'} ${st.alarmed ? 'The alarm is real.' : 'The alarm sign is a lie.'}`
          : '\n\nYou have not watched this house. You are about to find out the expensive way.'), [
          { label: st.openWindow ? 'In through the lake window (quiet, no iron)' : `Pry the slider${p.inv.crowbar ? '' : ' — you have no crowbar'}`,
            go: () => { const r = result(g.act('enterHouse', h.key)); if (r.ok) { updateHud(); } } },
        ]);
      });
    }
    add(BLUFFS.club.x + BLUFFS.club.w / 2, BLUFFS.club.y + BLUFFS.club.h + 50, 70,
      `The club patio — a $${T.clubDrink} club soda`, () => showChoice('Hopewell Lake Club.',
        'Members and guests only, in theory. Nobody up here has ever once been asked to prove it.', [
        { label: `Sit on the patio — $${T.clubDrink} (heat −6)`, go: () => result(g.act('clubSoda')) }]));
    // CASSIDY WORKS
    add(WORKS.hall.door.x, WORKS.hall.door.y + 10, 50, 'Union Hall — Local 448 (the lights are on)', () => result(g.act('enter', 'unionhall')));
    add(WORKS.dockOffice.x + WORKS.dockOffice.w / 2, WORKS.dockOffice.y + WORKS.dockOffice.h + 8, 54,
      g.block === 2 ? `The dock window — evening shift, $${T.dockPay} cash` : 'The dock window (hiring: evenings, backs)',
      () => showChoice('The dock.', 'Two hours of freight. Cash, no camera, no skim — the dock pays in money and takes it out of your spine.', [
        { label: `Work it — $${T.dockPay}, and your back pays ${T.dockHpCost}`, go: () => result(g.act('dockShift')) }]));
    const pal = g.palletToday();
    if (g.dt.pallet !== g.day) add(pal[0], pal[1], 48, 'A pallet that "fell off a truck" (allegedly)', () => {
      const r = result(g.act('palletGrab'));
      if (r.caught) sfx.play('yell');
    });
    add(WORKS.gate.x + 35, WORKS.gate.y + 80, 56, 'The plant gate', () =>
      feed('The barrier arm is down. It is always down. A clipboard hangs in the shack with one name on today\'s shift, and the name has a coffee ring through it.', 'ok'));
    for (const bx of WORKS.boxcars) add(bx + 110, 1490, 60, 'The boxcars (STENCH · DEBRA · YOLO, crossed out)', () =>
      feed('Tagged by locals with names like STENCH and DEBRA. DEBRA\'s got real linework, honestly. DEBRA cares.', 'ok'));
    add(3340, 990, 60, 'The town line ("LEAVING HOPEWELL — why though?")', () =>
      feed('Past the sign the shoulder just gets thinner until it isn\'t a road anymore. You could walk it. People have. They all came back or they never called, and nobody knows which is worse.', 'warn'));
    add(WATER_TOWER.x, WATER_TOWER.y + 40, 70, 'The water tower (H O P _ W E L _)', () =>
      feed('The E fell in \'98 and the L followed it out of solidarity. Climbing it is a Hopewell rite of passage and a Hopewell obituary.', 'ok'));
    add(COURTHOUSE.x + COURTHOUSE.w / 2, COURTHOUSE.y - 20, 70, 'The courthouse (read the docket)', () =>
      feed(g.heatStage() >= 2
        ? 'Thursday\'s docket, posted behind glass. Your name has a little star next to it. The star means "again."'
        : 'Thursday\'s docket: two DUIs, a fence dispute, and a man suing his own brother over a smoker. The town phone book, with worse fonts.', 'warn'));
    add(1240, 1700, 56, 'The free couch (it has seen things)', () =>
      feed('It\'s been rained on. It is still free. Somewhere out there is a man who believes he is coming back for it.', 'ok'));
    add(700, 2340, 50, 'The memorial rock', () =>
      feed('"TO OUR BOYS." No war specified. Covers everything, that way. Somebody\'s left a fresh beer on it, which is the correct sacrament.', 'ok'));
    // a body on the ground is an opportunity now and a problem in about thirty seconds
    const body = g.rollableNear();
    if (body) add(body.x, body.y, 44, `Go through ${body.name ? body.name + "'s" : 'his'} pockets`, () => result(g.act('roll')));
    // pickups
    for (const it of g.pickups) add(it.x, it.y, 34, `Pick up the ${it.kind}`, () => { g.pickupNearby(); });
  } else if (g.room === 'qwikstop') {
    add(180, 240, 56, 'The Rip rack (ORIGINAL SCREAM, $6)', () => showChoice('Rip.', 'The can is screaming. The can knows something. +1 block today; tomorrow bills you like an ex with a lawyer.', [
      { label: `Buy — $${T.ripCost}`, go: () => result(g.act('buy', 'rip')) },
      { label: 'Pocket it', go: () => result(g.act('shoplift', 'rip')) }]));
    add(345, 240, 50, 'Jerky ($3, dog-grade)', () => showChoice('Gas-station jerky.', 'Technically food. Definitely diplomacy.', [
      { label: `Buy — $${T.jerkyCost}`, go: () => result(g.act('buy', 'jerky')) },
      { label: 'Pocket it', go: () => result(g.act('shoplift', 'jerky')) }]));
    add(170, 145, 60, 'The counter', () => renderer.bark('Clerk', 'You buying or narrating?', 170, 130));
    add(INTERIORS.qwikstop.w / 2, INTERIORS.qwikstop.h - 26, 60, 'Leave', () => result(g.act('leave')));
  } else if (g.room === 'hardware') {
    if (!p.inv.crowbar) add(90, 280, 60, 'The crowbar ($22, asks no questions)', () => showChoice('A crowbar.', 'Earl\'s watching, but Earl\'s tired.', [
      { label: `Buy — $${T.crowbarCost}`, go: () => result(g.act('buy', 'crowbar')) },
      { label: 'Walk it out under your jacket', go: () => result(g.act('shoplift', 'crowbar')) }]));
    add(460, 145, 60, 'Earl', () => renderer.bark('Earl', uiPick(BARKS.earl), 460, 130));
    add(INTERIORS.hardware.w / 2, INTERIORS.hardware.h - 26, 60, 'Leave', () => result(g.act('leave')));
  } else if (g.room === 'buffet') {
    add(200, 145, 64, `The steam table ($${T.buffetCost} — what fits, fits)`, () => result(g.act('buy', 'buffet')));
    add(120, 100, 50, 'Wanda', () => renderer.bark('Wanda', uiPick(BARKS.wanda), 120, 86));
    add(INTERIORS.buffet.w / 2, INTERIORS.buffet.h - 26, 60, 'Leave', () => result(g.act('leave')));
  } else if (g.room === 'wingbarn') {
    if (g.shiftAvailable()) add(230, 155, 66, 'CLOCK IN — register shift', () => registerStart());
    add(120, 155, 44, `Wings ($${T.wingsCost}, staff price is a myth)`, () => result(g.act('buy', 'wings')));
    add(300, 155, 44, 'Dale', () => renderer.bark('Dale', uiPick(BARKS.dale), 300, 140));
    add(INTERIORS.wingbarn.w / 2, INTERIORS.wingbarn.h - 26, 60, 'Leave', () => result(g.act('leave')));
  } else if (g.room === 'cashking') {
    add(180, 145, 60, 'WINDOW 1 — checks & loans', () => showChoice('Window 1.', `Roxy, through the glass. ${p.debt > 0 ? `You owe $${p.debt}, due Friday.` : ''}`, [
      p.debt > 0
        ? { label: `Pay the debt ($${p.debt})`, go: () => result(g.act('payLoan')) }
        : { label: `Payday loan — take $${T.loanPrincipal}, owe $${T.loanOwed} Friday`, go: () => result(g.act('takeLoan')) },
      { label: 'Ask about the rates', go: () => renderer.bark('Roxy', BARKS.roxy[1], 180, 120) },
    ].filter(Boolean)));
    add(440, 145, 60, 'WINDOW 2 — "goods"', () => {
      if ((p.inv.loot || []).length && g.scheme.inCar <= 0) {
        showChoice('Window 2.', `${p.inv.loot.length} piece${p.inv.loot.length > 1 ? 's' : ''} of somebody else's life. Roxy won't look at any of it — that's the service.`, [
          { label: 'Sell the lot (full price, no questions)', go: () => { result(g.act('fenceLoot', 'roxy')); updateHud(); } }]);
        return;
      }
      if ((p.inv.freight || 0) > 0 && g.scheme.inCar <= 0) {
        showChoice('Window 2.', `${p.inv.freight} box${p.inv.freight > 1 ? 'es' : ''} of "assorted." Roxy has opinions about gravity.`, [
          { label: `Sell the freight — $${T.freightRoxy} each`, go: () => result(g.act('fenceFreight', 'roxy')) }]);
        return;
      }
      if (g.scheme.inCar <= 0) { renderer.bark('Roxy', 'Window 2 is for sellers. You\'re a browser.', 440, 120); return; }
      showChoice('Window 2.', `${g.scheme.inCar} crate${g.scheme.inCar > 1 ? 's' : ''} in the beater. Roxy's already counted them somehow.`, [
        { label: `Fence now — $${T.crateFenceBase}/crate`, go: () => result(g.act('fence', false)) },
        { label: 'Push for more (she\'s counted you already)', go: () => result(g.act('fence', true)) },
        { label: `Hold for the Sunday buyer (+50%, risky nights)`, go: () => result(g.act('hold')) }]);
    });
    add(INTERIORS.cashking.w / 2, INTERIORS.cashking.h - 26, 60, 'Leave', () => result(g.act('leave')));
  } else if (g.room === 'gamebarn') {
    if (g.gameBarnDark) {
      const spots = [[84, 140], [148, 140], [212, 140]];
      for (let i = g.scheme.crates; i < T.crateCount; i++) {
        const s = spots[i]; if (!s) break;
        add(s[0], s[1], 44, 'Grab a crate (FUNSTATION — sealed)', () => result(g.act('grabCrate')));
        break; // one prompt at a time; they're in a row
      }
      const odds = g.patrolOdds();
      const risk = odds > 0.3 ? ' — the odds are getting rude' : odds > 0.16 ? ' — pushing it' : '';
      add(620, 66, 60, p.carryCrate ? `Out the window with it (trip ${g.scheme.crates + 1} of ${T.crateCount}${risk})` : 'Out the window', () => result(g.act('leave')));
    } else {
      add(530, 165, 60, 'Gary', () => renderer.bark('Gary',
        uiPick(g.scheme.job ? BARKS.gary_after : BARKS.gary), 530, 148));
      add(150, 210, 60, 'The back room (GARY ONLY. This means you, Peanut.)', () => feed('Deadbolted from this side. But rooms have more than one side. Alleys know that.', 'warn'));
      add(INTERIORS.gamebarn.w / 2, INTERIORS.gamebarn.h - 26, 60, 'Leave', () => result(g.act('leave')));
    }
  } else if (g.room === 'foxhole') {
    const IT = INTERIORS.foxhole, st = IT.stage;
    add(IT.counter.x + IT.counter.w / 2, IT.counter.y + 40, 62, `Dee, behind the bar`, () => showChoice(
      'The bar.', 'Dee has a towel, a bat, and everybody\'s secrets. Two of those are for sale.', [
      { label: `Buy a beer — $${T.foxDrink}`, go: () => result(g.act('foxDrink')) },
      { label: `Ask what she's heard — $${g.fox.tips >= 3 ? T.foxInfoCost - 10 : T.foxInfoCost}`, go: () => {
          const r = result(g.act('foxInfo'));
          if (r.ok && r.learned) { updateScheme(); pulse($('hud-scheme')); }
        } },
      { label: 'Just talk', go: () => renderer.bark('Dee', uiPick(BARKS.dee), IT.counter.x + 120, IT.counter.y + 20) },
    ]));
    add(st.x + st.w / 2, st.y + st.h + 26, 60, 'The rail (tip the stage)', () => showChoice(
      'The tip rail.', 'The only honest transaction on the Miracle Mile.', [
      { label: `Tip — $${T.foxTip}`, go: () => result(g.act('foxTip')) },
      { label: 'Talk to Cherry', go: () => renderer.bark('Cherry', uiPick(BARKS.cherry), st.x + st.w / 2, st.y + 40) },
    ]));
    add(300, 300, 52, 'Sable', () => renderer.bark('Sable', uiPick(BARKS.sable), 300, 282));
    add(700, 280, 52, 'The ATM ($4.50 fee, and you will pay it)', () =>
      feed('The screen offers you $20, $40, or $60 like it already knows how tonight ends. You have no card worth the fee.', 'warn'));
    add(560, 300, 60, `The back room — $${T.foxVipCost}`, () => showChoice(
      'The back room.', 'Forty-five dollars, one curtain, and the rest of the block gone. You come out patched up and poorer.', [
      { label: `Go back — $${T.foxVipCost}`, go: () => result(g.act('foxVip')) },
    ]));
    add(120, 340, 56, 'A dark corner booth (sit out the block)', () => showChoice(
      'Sit in the dark?', 'Burns the rest of this block. Nobody in this building has ever helped a police officer with anything.', [
      { label: `Become furniture (heat −${T.foxHeatDecay})`, go: () => result(g.act('foxLayLow')) },
    ]));
    add(380, IT.h - 24, 60, 'Out to the gravel', () => result(g.act('leave')));
  } else if (g.room === 'splitlip') {
    const IT = INTERIORS.splitlip;
    add(IT.counter.x + IT.counter.w / 2, IT.counter.y + 40, 64, 'Sal, at the taps', () => showChoice(
      'The bar.', 'Sal pours, Sal listens, Sal forgets professionally.', [
      { label: `Beer — $${T.slBeer}`, go: () => result(g.act('slBeer')) },
      { label: `Well whiskey — $${T.slShot} (your funeral)`, go: () => {
          const r = result(g.act('slShot'));
          if (r.hurled) renderer.bark(null, 'The Lip applauds. Sal slides you a water like a eulogy.', g.player.x, g.player.y - 20);
        } },
      { label: `Buy the room a round — $${T.slRound} (heat −${T.slRoundHeat})`, go: () => result(g.act('slRound')) },
      { label: 'Just talk', go: () => renderer.bark('Sal', uiPick(BARKS.sal), IT.counter.x + 130, IT.counter.y + 20) },
    ]));
    add(IT.pool.x + IT.pool.w / 2, IT.pool.y + IT.pool.h + 20, 60, 'The pool table (burned, beloved)', () =>
      feed('The felt has a burn shaped like Ohio. House rules are chalked on the wall and two of them are just names with lines through them.', 'ok'));
    add(646, 220, 50, 'The cue rack', () => result(g.act('cueGrab')));
    add(682, 90, 50, 'The bathroom (ABANDON HOPE)', () =>
      feed('You crack the door. The smell has a texture. Something in there waves at a regular. You close the door and choose dignity, barely.', 'warn'));
    add(85, 355, 46, 'The jukebox (out of order since \'09)', () =>
      feed('Behind the glass: "ACHY BREAKY HEART," queued since 2009, waiting like a landmine.', 'ok'));
    add(IT.w / 2, IT.h - 24, 60, 'Back to Main Street', () => result(g.act('leave')));
  } else if (g.room === 'daybreak') {
    const IT = INTERIORS.daybreak;
    add(IT.counter.x + IT.counter.w / 2, IT.counter.y + 40, 62, 'Madison, at the register', () => showChoice(
      'Daybreak.', 'It smells like cedar and venture capital.', [
      { label: `Latte — $${T.latteCost} (nine dollars. NINE.)`, go: () => result(g.act('latte')) },
      { label: 'Just talk', go: () => renderer.bark('Madison', uiPick(BARKS.madison), IT.counter.x + 120, IT.counter.y + 20) },
    ]));
    add(510, 288, 56, 'The Fairview table (eavesdrop)', () => {
      const r = result(g.act('overhear'));
      if (r.ok && g.scheme.hear) { updateScheme(); }
    });
    add(150, 280, 46, 'The communal table', () =>
      feed('A sign says COMMUNITY TABLE. Two laptops, zero community. A local sits at the end like a hostage with a scone.', 'warn'));
    add(IT.w / 2, IT.h - 24, 60, 'Back out (take the cup, hide the cup)', () => result(g.act('leave')));
  } else if (g.room === 'pawn') {
    const IT = INTERIORS.pawn;
    add(IT.counter.x + IT.counter.w / 2, IT.counter.y + 40, 64, 'Vern, behind the cage', () => showChoice(
      'Loanstar.', `Vern looks at you like an appraisal. ${g.scheme.inCar > 0 ? `He has, somehow, already counted your trunk.` : ''}`, [
      g.scheme.inCar > 0 ? { label: `Fence the crates — $${T.pawnCrate} each, flat, no faces`, go: () => result(g.act('pawnFence')) } : null,
      (p.inv.freight || 0) > 0 ? { label: `The "assorted" boxes — $${T.freightVern} each`, go: () => result(g.act('fenceFreight', 'vern')) } : null,
      (p.inv.loot || []).length ? { label: `The Bluffs pieces (+10% clean, −${Math.round((1 - T.hotPenalty) * 100)}% anything with a serial)`,
        go: () => { result(g.act('fenceLoot', 'vern')); updateHud(); } } : null,
      { label: `The bat — $${T.pawnBat}`, go: () => result(g.act('pawnBuy', 'bat')) },
      !p.inv.crowbar ? { label: `A crowbar — $${T.pawnCrowbar} (Earl's is cheaper; Earl asks questions)`, go: () => result(g.act('pawnBuy', 'crowbar')) } : null,
      { label: 'Just talk', go: () => renderer.bark('Vern', uiPick(BARKS.vern), IT.counter.x + 120, IT.counter.y + 20) },
    ].filter(Boolean)));
    add(300, 290, 50, 'The ring case (rows by decade)', () =>
      feed('Front row\'s the nineties: big stones, big hopes. Prices drop as the rows get newer. There\'s a sticky note that just says "ASK ABOUT PAIRS."', 'warn'));
    add(600, 100, 46, 'The owl (not for sale)', () =>
      feed('The owl has seen Vern cry and it stays where the leverage is. It watches you the way the camera at Wing Barn wishes it could.', 'ok'));
    add(IT.w / 2, IT.h - 24, 60, 'Back to Main Street', () => result(g.act('leave')));
  } else if (g.room === 'house') {
    const IT = INTERIORS.house;
    for (const sp of SEARCH_SPOTS) {
      const pos = IT.spots[sp.key]; if (!pos) continue;
      const done = g.burg.spots.includes(sp.key);
      const lock = sp.needsCrowbar && !p.inv.crowbar;
      add(pos[0], pos[1] + 16, 46,
        done ? `${sp.label} — turned out` : `${sp.label} (${sp.secs}s${lock ? ', needs iron' : ''})`,
        () => { const r = result(g.act('searchSpot', sp.key)); if (r.refused) sfx.play('crack'); updateHud(); });
    }
    add(IT.w / 2, IT.h - 22, 70, 'OUT — back across the lawn', () => { result(g.act('leaveHouse')); updateHud(); });
  } else if (g.room === 'shop') {
    const IT = INTERIORS.shop;
    add(150, 130, 56, 'Dunn', () => renderer.bark('Dunn', uiPick(BARKS.dunn), 150, 112));
    add(422, 175, 60, g.htcc.classToday === g.day ? 'The bay you already used today' : `Take the bench — a session (${T.classSecs}s)`,
      () => showChoice('Welding.', 'Glasses on, hands where he can see them. It costs you time on the clock and gives you something no shop sells you.', [
        { label: 'Pull a bead', go: () => { const r = result(g.act('attendClass')); if (r.ok) { updateScheme(); updateHud(); sfx.play('crack'); } } }]));
    add(130, 300, 56, 'The scrap rack (take what you can use)', () =>
      feed('Offcuts, stock ends, and a hand-lettered sign that means it. Everything in this building was made by somebody who needed it to exist.', 'ok'));
    add(490, 280, 50, 'DAYS WITHOUT INCIDENT: 2', () =>
      feed('It has said 2 for as long as anyone can remember. Nobody resets it up and nobody resets it down. It is a 2 in the way the water tower is missing an E.', 'ok'));
    add(IT.w / 2, IT.h - 24, 60, 'Out to the quad', () => result(g.act('leave')));
  } else if (g.room === 'aid') {
    const IT = INTERIORS.aid, st = g.aidStatus();
    add(IT.counter.x + IT.counter.w / 2, IT.counter.y + 36, 64,
      st.paid ? 'The window (already disbursed)' : st.eligible ? `THE WINDOW — claim $${T.aidPayout}` : `The window (attendance ${st.attended}/${st.need})`,
      () => showChoice('Financial aid.', st.eligible
        ? `The box on the form has a number in it. Ms. Pettigrew has already found your file.`
        : `Disbursement needs ${st.need} class sessions on the sheet. You have ${st.attended}. She is not being unkind; she is being a form.`, [
        st.eligible && !st.paid ? { label: `Take the disbursement — $${T.aidPayout}`, go: () => { result(g.act('claimAid')); updateHud(); } } : null,
        { label: 'Just talk', go: () => renderer.bark('Ms. Pettigrew', uiPick(BARKS.pettig), IT.counter.x + 120, IT.counter.y + 16) },
      ].filter(Boolean)));
    add(550, 100, 48, 'TAKE A NUMBER (now serving 3, in the machine 41)', () =>
      feed('You pull 41. The display says 3. A man two chairs down has been here since a previous administration and has made peace with it.', 'warn'));
    add(IT.w / 2, IT.h - 24, 60, 'Out to the quad', () => result(g.act('leave')));
  } else if (g.room === 'library') {
    const IT = INTERIORS.library;
    add(615, 330, 56, 'The radiator corner (sit out the block)', () => showChoice('The library.',
      'Two floors, four students, and the best heating on campus. Nobody in the history of Hopewell has been arrested in this building.', [
      { label: `Sit at a carrel (heat −${T.libHeatDecay})`, go: () => result(g.act('libLayLow')) }]));
    add(450, 130, 60, 'The stacks', () =>
      feed('Local history, two shelves of law, and a whole run of trade manuals with Dunn\'s handwriting in the margins of every one.', 'ok'));
    add(IT.w / 2, IT.h - 24, 60, 'Out to the quad', () => result(g.act('leave')));
  } else if (g.room === 'unionhall') {
    const IT = INTERIORS.unionhall;
    add(IT.counter.x + 35, IT.counter.y + 20, 56, 'The urn (50¢, honor box)', () => result(g.act('hallCoffee')));
    add(150, 130, 54, 'Denny', () => renderer.bark('Denny', uiPick(BARKS.denny), 150, 112));
    if ((p.inv.loot || []).includes('binder')) add(450, 150, 60, '📕 Give Denny the FAIRVIEW — PHASE III binder', () => {
      const r = result(g.act('leakBinder'));
      if (r.leaked) { pulse($('hud-scheme')); sfx.play('register'); }
    });
    add(450, 150, 56, 'The grievance board (oldest: 1986)', () =>
      feed('Nine active grievances. The top one is about ventilation and the bottom one is about the twentieth century. Denny\'s handwriting doesn\'t age.', 'ok'));
    add(200, 320, 56, 'A folding chair (sit with the union)', () => showChoice('Sit a while?',
      'Burns the rest of the block. Nobody in this hall answers questions — they\'ve all BEEN questions.', [
      { label: `Sit. Listen. Cool off (heat −${T.hallHeatDecay})`, go: () => result(g.act('hallLayLow')) }]));
    add(IT.w / 2, IT.h - 24, 60, 'Back to the yard', () => result(g.act('leave')));
  } else if (g.room === 'garage') {
    add(120, 95, 60, 'The cot (sleep — ends the day)', () => showChoice('Sleep?', 'The rest of today goes with it. Heat cools double here — the Flats wouldn\'t give a cop directions to a fire.', [
      { label: 'Sleep. Let the town forget your face a little.', go: () => result(g.act('sleep')) }]));
    add(335, 95, 54, 'The beer fridge (Bev\'s. Ask first.)', () => feed(`Inside: three beers, a film canister of quarters, and the rent jar. The jar notices you.`, 'warn'));
    add(560, 100, 60, 'The house door', () => renderer.bark('Bev',
      uiPick(g.scheme.job ? BARKS.bev_after : BARKS.bev), 560, 82));
    add(INTERIORS.garage.w / 2, INTERIORS.garage.h - 26, 60, 'Out to the street', () => result(g.act('leave')));
  }
  return out;
}

let lastScanStage = -1, lastScanAt = 0;
let nearest = null;
function findNearest() {
  const p = game && game.player;
  if (!p || game.over || modalPause) return null;
  let best = null, bd = 1e9;
  for (const it of interactables()) {
    const d = Math.hypot(it.x - p.x, it.y - p.y);
    if (d < it.r && d < bd) { bd = d; best = it; }
  }
  return best;
}
function updatePrompt() {
  nearest = findNearest();
  if (nearest) { $('prompt').textContent = `E — ${nearest.label}`; $('prompt').style.display = 'block'; }
  else $('prompt').style.display = 'none';
}

// ---------------------------------------------------------------------------
// REGISTER MINIGAME
// ---------------------------------------------------------------------------

import { MENU } from './game.js';
const DENOMS = [[500, '$5'], [100, '$1'], [25, '25¢'], [10, '10¢'], [5, '5¢'], [1, '1¢']];
let reg = null;

function registerStart() {
  modalPause = true;
  reg = { order: 0, orders: 8, perfect: 0, skimmed: 0, caught: 0, tray: 0, target: 0, paid: 0,
          timer: 0, camT: 0, camOn: true, holdSkim: false, skimT: 0, done: false };
  $('register').style.display = 'flex';
  const dv = $('reg-denoms'); dv.innerHTML = '';
  DENOMS.forEach(([cents, label], i) => {
    const b = document.createElement('button');
    b.className = 'btn reg-denom'; b.textContent = label;
    b.onclick = () => {
      if (reg.done) return;
      let v = cents;
      // THE RIP BILL, where you actually feel it: yesterday's can makes your hand
      // miss the slot. This used to be a 2px jitter — a graphic, not a mechanic.
      if (game.player.shakeAmp > 0 && Math.random() < game.player.shakeAmp * 0.07) {
        const j = Math.max(0, Math.min(DENOMS.length - 1, i + (Math.random() < 0.5 ? -1 : 1)));
        v = DENOMS[j][0];
        flashReg('Your hand goes to the wrong slot.', 'bad');
      }
      reg.tray += v; regPaint(); sfx.play('pickup');
    };
    dv.appendChild(b);
  });
  regOrder();
}

function regOrder() {
  reg.order++;
  if (reg.order > reg.orders || (game.player.strikes + reg.caught) >= T.skimStrikeLimit) return regEnd();
  const n = 1 + Math.floor(Math.random() * 3);
  let total = 0; const items = [];
  for (let i = 0; i < n; i++) { const m = MENU[Math.floor(Math.random() * MENU.length)]; items.push(m); total += m.price; }
  total = Math.round(total * 100);
  const paid = Math.ceil(total / 500) * 500 + (Math.random() < 0.35 ? 500 : 0);
  reg.items = items; reg.totalC = total; reg.paid = paid; reg.target = paid - total;
  reg.tray = 0; reg.timer = 16; reg.timerMax = 16; reg.submitted = false;
  reg.skimBase = reg.skimmed;                 // per-ORDER cap: stalling can't farm it
  reg.camCycle = 7.5 + Math.random() * 3;     // jittered, so the sweep bar makes you FAST, not safe
  regPaint();
}

function regPaint() {
  $('reg-count').textContent = `ORDER ${reg.order} / ${reg.orders}`;
  $('reg-ticket').innerHTML = reg.items.map(i => `<div>${i.item}<span>$${i.price.toFixed(2)}</span></div>`).join('') +
    `<div class="reg-total">TOTAL<span>$${(reg.totalC / 100).toFixed(2)}</span></div>` +
    `<div class="reg-paidline">PAID<span>$${(reg.paid / 100).toFixed(2)}</span></div>`;
  $('reg-tray').textContent = `CHANGE TRAY: $${(reg.tray / 100).toFixed(2)}`;
  $('reg-strikes').textContent = '⚠'.repeat(game.player.strikes + reg.caught) || '—';
  $('reg-skimmed').textContent = reg.skimmed ? `pocketed $${reg.skimmed}` : '';
}

function regSubmit() {
  if (!reg || reg.submitted) return;
  reg.submitted = true;
  if (reg.tray === reg.target) { reg.perfect++; sfx.play('register'); flashReg('EXACT. The drawer sings its one sad note.', 'ok'); }
  else { sfx.play('yell'); flashReg(reg.tray > reg.target ? 'Too much. You just tipped a customer, dumbass.' : 'Short. He counts it twice, out loud, like a prick.', 'bad'); }
  setTimeout(regOrder, 700);
}

function flashReg(text, kind) { const el = $('reg-flash'); el.textContent = text; el.className = `reg-flash reg-${kind}`; setTimeout(() => el.textContent = '', 650); }

function regTick(dt) {
  if (!reg || reg.done) return;
  reg.timer -= dt;
  if (reg.timer <= 0 && !reg.submitted) {
    // running out the clock used to be the optimal play — it cost a $3 tip and let you
    // farm the skim. Now the drawer runs late and Dale counts it.
    reg.submitted = true; reg.caught++;
    flashReg('The line backs up. Somebody says "the hell is this, the DMV?" Dale counts the drawer himself.', 'bad');
    sfx.play('yell'); regPaint();
    if ((game.player.strikes + reg.caught) >= T.skimStrikeLimit) return regEnd();
    setTimeout(regOrder, 700);
  }
  const cyc = reg.camCycle, onFor = cyc * 0.61;
  reg.camT = (reg.camT + dt) % cyc;
  const wasOn = reg.camOn;
  reg.camOn = reg.camT < onFor;
  const knows = game.meta.knows.blind;
  $('reg-cam').textContent = reg.camOn ? '● CAM' : '○ cam';
  $('reg-cam').className = reg.camOn ? 'reg-cam on' : 'reg-cam off';
  $('reg-camsweep').style.display = knows ? 'block' : 'none';
  if (knows) $('reg-camsweep-fill').style.width = `${(reg.camT / cyc) * 100}%`;
  // caught on the flip — and the shakes WIDEN that window, because you're slow today
  const preFlip = !reg.camOn && (cyc - reg.camT) < game.player.shakeAmp * 0.22;
  if (((reg.camOn && !wasOn) || preFlip) && reg.holdSkim) {
    reg.caught++; reg.holdSkim = false;
    flashReg('Dale\'s eyes flick to the drawer. He KNOWS.', 'bad');
    sfx.play('yell'); regPaint();
    if ((game.player.strikes + reg.caught) >= T.skimStrikeLimit) return regEnd();
  }
  if (reg.holdSkim && !reg.camOn) {
    reg.skimT += dt;
    if (reg.skimT > 0.45) { reg.skimT = 0; reg.skimmed = Math.min(reg.skimmed + 1, reg.skimBase + 6); regPaint(); sfx.play('pickup'); }
  }
  $('reg-timer-fill').style.width = `${Math.max(0, reg.timer / reg.timerMax) * 100}%`;
  const amp = game.player.shakeAmp;
  $('reg-denoms').style.transform = amp ? `translate(${(Math.random() - 0.5) * amp * 2}px, ${(Math.random() - 0.5) * amp * 2}px)` : '';
}

function regEnd() {
  reg.done = true;
  $('register').style.display = 'none';
  modalPause = false;
  game.meta.knows.blind = true; saveMeta(game.meta);
  game.finishShift({ perfect: reg.perfect, total: reg.orders, skimmed: reg.skimmed, caught: reg.caught });
  reg = null;
  updateHud();
}

// ---------------------------------------------------------------------------
// CUFF MASH
// ---------------------------------------------------------------------------

let cuff = null;
function cuffStart(cop) {
  if (cuff) return;
  modalPause = true;
  cuff = { n: 0, t: 2.8 };
  $('cuff').style.display = 'flex';
  sfx.play('cuff');
}
function cuffTick(dt) {
  if (!cuff) return;
  cuff.t -= dt;
  $('cuff-fill').style.width = `${Math.min(100, (cuff.n / T.cuffMashNeed) * 100)}%`;
  if (cuff.t <= 0 || cuff.n >= T.cuffMashNeed) {
    const ok = cuff.n >= T.cuffMashNeed;
    $('cuff').style.display = 'none';
    modalPause = false; cuff = null;
    game.resolveCuff(ok);
  }
}

// ---------------------------------------------------------------------------
// SCHEME PANEL / HUD
// ---------------------------------------------------------------------------

function updateScheme() {
  if (!game) return;
  const s = game.scheme;
  $('scheme-title').textContent = SCHEME.title;
  $('scheme-list').innerHTML = SCHEME.stages.map(st => {
    let done = s[st.id];
    let extra = '';
    if (st.id === 'job') extra = ` (${s.crates}/${T.crateCount})`;
    if (st.id === 'fence' && s.holding) extra = ' (holding for Sunday)';
    return `<div class="sch ${done ? 'sch-done' : ''}"><span>${done ? '✓' : '•'}</span> ${st.label}${extra}
      ${done ? '' : `<div class="sch-hint">${st.hint}</div>`}</div>`;
  }).join('');
}

function updateHud() {
  if (!game) return;
  const g = game, p = g.player;
  $('hud-day').textContent = `${g.dayName.slice(0, 3)} — ${g.blockName}`;
  $('hud-clockbar-fill').style.width = `${Math.max(0, 1 - g.blockT / T.blockSeconds) * 100}%`;
  $('hud-cash').textContent = `$${Math.floor(p.cash)}`;
  $('hud-hp-fill').style.width = `${Math.max(0, p.hp / p.hpMax) * 100}%`;
  $('hud-stam-fill').style.width = `${(p.stamina / T.staminaMax) * 100}%`;
  const st = g.heatStage();
  $('hud-heat').className = 'st' + st;
  $('hud-scan-bars').innerHTML = [0, 1, 2].map(i =>
    `<i class="${st > i ? (st === 3 ? 'hot' : 'on') : ''}"></i>`).join('');
  // the scanner re-chatters on a stage change, then idles on its own slow rotation
  if (st !== lastScanStage || performance.now() - lastScanAt > 11000) {
    lastScanStage = st; lastScanAt = performance.now();
    $('hud-scan-line').textContent = uiPick(BARKS.scanner[st]);
  }
  // the grudge track — never decays, so it's phrased as people, not a number
  const gr = g.grudge || 0;
  const ge = $('hud-grudge');
  if (gr > 0) {
    ge.className = 'on';
    ge.textContent = gr >= T.grudgeRefuseAt ? 'Some counters are done serving you.'
      : gr >= T.grudgeAmbushAt ? 'Somebody is waiting in a parking lot.'
      : gr >= 3 ? 'You are being priced differently.'
      : 'Somebody in this town has not forgotten.';
  } else ge.className = '';

  // the burglary clock
  const bg = $('hud-burg');
  if (g.burg && g.burg.in) {
    const st = g.houseState(g.burg.in);
    const max = g.burg.owner ? T.alarmGraceS * 0.5 : st.alarmed ? T.alarmGraceS : T.silentTimerS;
    const f = Math.max(0, Math.min(1, g.burg.t / max));
    bg.className = 'on' + (g.burg.t < 15 ? ' hot' : g.burg.t < 30 ? ' warn' : '');
    $('hud-burg-fill').style.width = `${f * 100}%`;
    $('hud-burg-label').textContent = g.burg.owner ? 'HE IS ON THE PHONE' : st.alarmed ? 'ALARM — RESPONSE INBOUND' : 'QUIET (FOR NOW)';
    $('hud-burg-sub').textContent = `${Math.max(0, Math.ceil(g.burg.t))}s · ${(p.inv.loot || []).length} piece${(p.inv.loot || []).length === 1 ? '' : 's'} · ${g.lootWeight()}/${T.bluffsCarryCap} full`;
  } else bg.className = '';

  const chips = [];
  if (p.held) chips.push(`✊ ${p.held.kind}`);
  if (p.carryCrate) chips.push('📦 CRATE');
  if (p.inv.rip) chips.push(`⚡×${p.inv.rip}`);
  if (p.inv.jerky) chips.push(`🥩×${p.inv.jerky}`);
  if (p.inv.crowbar) chips.push('🔧 crowbar');
  if (p.inv.freight) chips.push(`📦 assorted×${p.inv.freight}`);
  if ((p.inv.loot || []).length) chips.push(`💎 ${p.inv.loot.length} piece${p.inv.loot.length > 1 ? 's' : ''}`);
  if (g.scheme.inCar) chips.push(`🚗 ${g.scheme.inCar} crate${g.scheme.inCar > 1 ? 's' : ''}`);
  if (p.debt) chips.push(`💸 owe $${p.debt}`);
  if (p.ripToday) chips.push('🫨 ripped');
  $('hud-inv').innerHTML = chips.map(c => `<span class="chip">${c}</span>`).join('');
}

// ---------------------------------------------------------------------------
// ENDINGS
// ---------------------------------------------------------------------------

function showEnding(key, sum) {
  const E = ENDINGS[key];
  modalPause = true;
  sfx.stopAmbience();
  if (key === 'BUSTED') sfx.play('siren');
  $('end-art').textContent = E.art;
  $('end-title').textContent = E.title;
  $('end-text').textContent = E.text + (sum.coda ? `\n\n${sum.coda}` : '')
    + (sum.roommate ? `\n\nYour roommate: "${sum.roommate}"` : '');
  $('end-tag').textContent = E.tag;
  $('end-stats').innerHTML = [
    ['Days survived', `${Math.min(sum.day + 1, 7)} / 7`],
    ['Cash at the end', `$${sum.cash}`],
    ['Crates moved', `${sum.crates} / ${T.crateCount}`],
    ['Shifts worked', sum.stats.shifts],
    ['Skimmed', `$${sum.stats.skimmed}`],
    ['KOs given / taken', `${sum.stats.koGiven} / ${sum.stats.koTaken}`],
    ['Rip consumed', sum.stats.rip],
    ['Final heat', sum.heat],
  ].map(([k, v]) => `<div class="est"><span>${k}</span><b>${v}</b></div>`).join('');
  const m = sum.meta;
  $('end-meta').textContent = `REP ${m.rep} • CRED ${m.cred} • SCARS ${m.scars} • LESSONS ${m.lessons}` +
    (m.cashBanked ? ` • $${m.cashBanked} banked` : '');
  $('ending').style.display = 'flex';
}

// ---------------------------------------------------------------------------
// INPUT
// ---------------------------------------------------------------------------

const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
                 KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && cuff) { cuff.n++; e.preventDefault(); return; }
  if (KEYMAP[e.code]) { input[KEYMAP[e.code]] = 1; e.preventDefault(); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sprint = 1;
  if (!game || game.over || modalPause) {
    if (reg && e.code === 'Enter') regSubmit();
    if (reg && e.code === 'Backspace') { reg.tray = 0; regPaint(); e.preventDefault(); }
    if (reg && e.code === 'Escape') { reg.orders = reg.order - 1; regEnd(); feed('You walk off mid-shift. Dale\'s face does a thing.', 'warn'); }
    return;
  }
  if (e.code === 'Space' || e.code === 'KeyJ') { game.attack(); e.preventDefault(); }
  if (e.code === 'KeyF') result(game.shove());
  if (e.code === 'KeyQ' || e.code === 'KeyK') result(game.throwHeld());
  if (e.code === 'KeyE') {
    const it = findNearest(); // computed on demand — the cached one is stale in hidden tabs
    if (it) it.go();
    else result({ ok: !!game.pickupNearby().ok });
  }
  if (e.code === 'Tab') { $('scheme-panel').classList.toggle('open'); e.preventDefault(); }
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code]) input[KEYMAP[e.code]] = 0;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sprint = 0;
});

function togglePause() {
  paused = !paused;
  $('pause').style.display = paused ? 'flex' : 'none';
}

// ---------------------------------------------------------------------------
// LOOP — rAF primary, setInterval fallback keeps the sim honest in hidden tabs
// ---------------------------------------------------------------------------

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  lastRaf = now;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (game && !game.over && !paused && !modalPause && !choiceOpen) game.update(dt, input);
  if (renderer && game) renderer.render(dt);
  if (reg) regTick(dt);
  if (cuff) cuffTick(dt);
  updatePrompt();
}
requestAnimationFrame(frame);

setInterval(() => {
  const now = performance.now();
  if (now - lastRaf < 500 || !game || game.over || paused) return;
  if (!modalPause && !choiceOpen) game.update(0.1, {});
  if (reg) regTick(0.1);   // reg/cuff tick OUTSIDE the modal gate — the modals ARE the modalPause
  if (cuff) cuffTick(0.1);
}, 100);

setInterval(() => {
  if (!game || game.over) return;
  updateHud();
  if (game.room !== lastRoom) { lastRoom = game.room; ambience(); } // doors change the room tone
}, 200);

function resize() {
  // ⚠️ Clamp to a real minimum. A collapsed/hidden pane reports innerHeight 0, the
  // canvases go to 0×0, and the lighting pass throws on drawImage("width or height
  // of 0") — which kills the render loop for good. Never trust the viewport.
  const w = Math.max(480, Math.min(window.innerWidth || 1280, 1500));
  const h = Math.max(320, window.innerHeight || 720);
  if (renderer) renderer.resize(w, h);
  $('cv').style.width = w + 'px'; $('cv').style.height = h + 'px';
}
window.addEventListener('resize', resize);

// ---------------------------------------------------------------------------
// BUTTONS / DEBUG HANDLES
// ---------------------------------------------------------------------------

$('t-start').onclick = () => { sfx.ensure(); startRun(); };
$('end-next').onclick = () => location.reload();
$('p-resume').onclick = togglePause;
$('p-mute').onclick = () => { sfx.setMute(!sfx.muted); $('p-mute').textContent = sfx.muted ? '🔇 Unmute' : '🔊 Mute'; };
// The art bible asks for camera effects to be "restrained and configurable" — this
// is the configurable half. Off = a plain locked follow, no lead, punch, or drift.
$('p-cam').onclick = () => {
  if (!renderer) return;
  renderer.camFx = !renderer.camFx;
  $('p-cam').textContent = `🎥 Camera motion: ${renderer.camFx ? 'ON' : 'OFF'}`;
  try { localStorage.setItem('vl-camfx', renderer.camFx ? '1' : '0'); } catch {}
};
$('p-restart').onclick = () => location.reload();
$('hud-scheme').onclick = () => $('scheme-panel').classList.toggle('open');
// The universal "call it" — skipping dead time should be a DECISION you make, and one
// the cops can take away from you. Gated at NAMED and above: you don't get to skip a
// day the whole force is asking about you.
$('hud-clock').onclick = () => {
  if (!game || game.over || modalPause) return;
  if (game.heatStage() >= 2) { feed('Not today. Half this town is telling the other half where you are.', 'warn'); return; }
  showChoice('Call it?', 'Walk the rest of this block off. Nothing good was going to happen in it.', [
    { label: 'Move on.', go: () => result(game.act('endBlock', 'called it')) }]);
};
$('reg-submit').onclick = regSubmit;
$('reg-clear').onclick = () => { if (reg) { reg.tray = 0; regPaint(); } };
const skimBtn = $('reg-skim');
skimBtn.onpointerdown = () => { if (reg) { reg.holdSkim = true; reg.skimT = 0; } };
skimBtn.onpointerup = skimBtn.onpointerleave = () => { if (reg) reg.holdSkim = false; };

window.__vlAct = (name, arg) => { const r = game ? game.act(name, arg) : null; updateHud(); updateScheme(); return r; };
window.__vlSoak = (seed = 1, n = 8) => { const out = []; for (let s = seed; s < seed + n; s++) out.push(soakRun(s)); return out; };
window.__vlShot = async (name = 'shot', port = 8446) => {
  if (!renderer) return 'no renderer';
  renderer.cam.x = game.player.x; renderer.cam.y = game.player.y - 40; // snap: hidden panes never lerp
  renderer.render(0.016);
  const url = renderer.shotDataURL();
  try {
    const r = await fetch(`http://localhost:${port}/shot?name=${name}`, { method: 'POST', body: url });
    return 'posted ' + name + ' -> ' + (await r.text());
  } catch (e) { return 'receiver down: ' + e.message; }
};
window.__vlR = () => renderer;   // view handle: zoom/cam pokes for visual QA
window.__vlState = () => game && ({ day: game.day, block: game.block, room: game.room, cash: game.player.cash,
  hp: game.player.hp, heat: Math.round(game.heat), stage: game.heatStage(), scheme: { ...game.scheme },
  npcs: game.npcs.length, over: game.over, ending: game.ending });

// boot
if (qs.get('autostart')) startRun();
else showTitle();
