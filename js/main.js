// VICTORY LAP — main.js
// Boot, input, HUD, the register minigame, cuff-mash, endings, persistence, loop.
// The sim never touches this file's DOM; this file never reaches into sim internals
// except through game.act / documented fields.

import { Game, soakRun, T, BUILDINGS, GARAGE, INTERIORS, STRIP_Y, BARKS, SCHEME,
         ENDINGS, BLOCK_NAMES, DAY_NAMES, NAMED } from './game.js';
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
    heatStage: (st) => { if (st >= 3) sfx.play('siren'); },
    blockEnd: () => onBlock(),
    dayEnd: () => { saveMeta(game.meta); onDay(); },
    ending: (key, sum) => { saveMeta(game.meta); showEnding(key, sum); },
    scheme: (stage) => { updateScheme(); pulse($('hud-scheme')); sfx.play('register'); },
    cuff: (cop) => cuffStart(cop),
  } });
  window.vl = game;
  renderer = new Renderer($('cv'), game);
  resize();
  sfx.ensure();
  ambience();
  updateScheme(); updateHud();
  toast(`${game.dayName}, week 14 of the semester`, weatherLine(game.weather), 2.8);
  if (meta.runs > 0) setTimeout(() => {
    renderer.bark(null, BARKS.greet_run[meta.runs % BARKS.greet_run.length], game.player.x + 60, game.player.y - 20);
  }, 2200);
  if (meta.runs === 0) setTimeout(() => {
    feed('Move: WASD • Sprint: SHIFT • Talk/use: E • Swing: SPACE • Throw/drop: Q • Scheme: TAB', 'ok');
    feed('Rent is theoretical. The week is not. Find Peanut when the sun drops.', 'scheme');
  }, 900);
}

function weatherLine(w) {
  return { clear: 'Clear. The sky owes nobody here anything.',
           overcast: 'Overcast, like a lid on a pot.',
           rain: 'Rain. The cops stay in the car. Remember that.',
           heatwave: 'Heatwave. Everyone\'s outside. Every window\'s open.' }[w] || '';
}

function onBlock() {
  ambience();
  const lines = {
    1: 'AFTERNOON — the town at its least romantic.',
    2: 'EVENING — the neon wakes up. So does everyone worth talking to.',
    3: 'LATE — the hour of bad ideas. Yours are waiting.',
    4: 'BONUS BLOCK — the Rip is writing checks your Tuesday will cash.',
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
      const openMap = { qwikstop: true, hardware: g.block <= 1, buffet: g.block >= 1 && g.block <= 2,
                        wingbarn: g.block <= 2, gamebarn: g.block <= 2, cashking: g.block >= 1 };
      if (openMap[b.key]) add(dx, dy, 46, `Enter ${b.label}`, () => result(g.act('enter', b.key)));
      else add(dx, dy, 46, `${b.label} (closed)`, () => result(g.act('enter', b.key)));
    }
    add(GARAGE.door.x + 20, GARAGE.y - 8, 50, 'The garage (home, roughly)', () => result(g.act('enter', 'garage')));
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
    add(1160, 1062, 46, 'The bench (kill the rest of the block)', () => showChoice('Kill time on the bench?', 'The rest of this block goes nowhere, on purpose. Heals a little.', [
      { label: 'Sit. Watch the street.', go: () => { p.hp = Math.min(p.hpMax, p.hp + T.benchRestHeal); result(g.act('endBlock', 'bench')); } }]));
    if (g.scheme.fence && g.block === 0) add(1035, 1082, 56, 'CATCH THE 6 A.M. — end it clean', () => showChoice('Walk?', 'Cash out, bank it, let the town wonder. That\'s the win.', [
      { label: 'Get on the bus.', go: () => { sfx.play('bus'); result(g.act('walkOut')); } }]));
    else add(1035, 1082, 56, 'Bus schedule (a work of fiction)', () => feed('The 6 a.m. runs when it wants. It\'ll run for a winner.', 'ok'));
    // named talkers
    for (const n of g.npcs) {
      if (n.room !== 'ext' || n.ko) continue;
      if (n.key === 'peanut') add(n.x, n.y, 50, 'Talk to Peanut', () => { const r = g.act('talkPeanut'); renderer.bark('Peanut', r.text, n.x, n.y); });
      else if (n.key === 'chuck' || n.key === 'tanner') add(n.x, n.y, 44, `${n.name} (Alumni, loud)`, () => renderer.bark(n.name, uiPick(BARKS[n.key]), n.x, n.y));
    }
    // pickups
    for (const it of g.pickups) add(it.x, it.y, 34, `Pick up the ${it.kind}`, () => result(g.act === undefined ? null : (g.pickupNearby(), { ok: true })));
  } else if (g.room === 'qwikstop') {
    add(180, 240, 56, 'The Rip rack (ORIGINAL SCREAM, $6)', () => showChoice('Rip.', 'The can is screaming. +1 block today. Tomorrow files an invoice.', [
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
      add(620, 66, 60, p.carryCrate ? 'Out the window (with the goods)' : 'Out the window', () => result(g.act('leave')));
    } else {
      add(530, 165, 60, 'Gary', () => renderer.bark('Gary', uiPick(BARKS.gary), 530, 148));
      add(150, 210, 60, 'The back room (GARY ONLY. This means you, Peanut.)', () => feed('Deadbolted from this side. But rooms have more than one side. Alleys know that.', 'warn'));
      add(INTERIORS.gamebarn.w / 2, INTERIORS.gamebarn.h - 26, 60, 'Leave', () => result(g.act('leave')));
    }
  } else if (g.room === 'garage') {
    add(120, 95, 60, 'The cot (sleep — ends the day)', () => showChoice('Sleep?', 'The rest of today goes with it. Heat cools double here — the Flats don\'t talk to police.', [
      { label: 'Sleep. Let the town cool off.', go: () => result(g.act('sleep')) }]));
    add(335, 95, 54, 'The beer fridge (Bev\'s. Ask first.)', () => feed(`Inside: three beers, a film canister of quarters, and the rent jar. The jar notices you.`, 'warn'));
    add(560, 100, 60, 'The house door', () => renderer.bark('Bev', uiPick(BARKS.bev), 560, 82));
    add(INTERIORS.garage.w / 2, INTERIORS.garage.h - 26, 60, 'Out to the street', () => result(g.act('leave')));
  }
  return out;
}

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
  for (const [cents, label] of DENOMS) {
    const b = document.createElement('button');
    b.className = 'btn reg-denom'; b.textContent = label;
    b.onclick = () => { if (!reg.done) { reg.tray += cents; regPaint(); sfx.play('pickup'); } };
    dv.appendChild(b);
  }
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
  reg.tray = 0; reg.timer = 22; reg.submitted = false;
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
  if (reg.tray === reg.target) { reg.perfect++; sfx.play('register'); flashReg('EXACT. The drawer sings.', 'ok'); }
  else { sfx.play('yell'); flashReg(reg.tray > reg.target ? 'Too much. The drawer weeps.' : 'Short. The customer counts. Loudly.', 'bad'); }
  setTimeout(regOrder, 700);
}

function flashReg(text, kind) { const el = $('reg-flash'); el.textContent = text; el.className = `reg-flash reg-${kind}`; setTimeout(() => el.textContent = '', 650); }

function regTick(dt) {
  if (!reg || reg.done) return;
  reg.timer -= dt;
  if (reg.timer <= 0 && !reg.submitted) { reg.submitted = true; flashReg('Too slow. The line has opinions.', 'bad'); setTimeout(regOrder, 700); }
  // camera cycle: 5.5s on, 3.5s off
  reg.camT = (reg.camT + dt) % 9;
  const wasOn = reg.camOn;
  reg.camOn = reg.camT < 5.5;
  const knows = game.meta.knows.blind;
  $('reg-cam').textContent = reg.camOn ? '● CAM' : '○ cam';
  $('reg-cam').className = reg.camOn ? 'reg-cam on' : 'reg-cam off';
  $('reg-camsweep').style.display = knows ? 'block' : 'none';
  if (knows) $('reg-camsweep-fill').style.width = `${(reg.camT / 9) * 100}%`;
  if (reg.camOn && !wasOn && reg.holdSkim) { // caught mid-reach
    reg.caught++; reg.holdSkim = false;
    flashReg('Dale\'s eyes flick to the drawer. He KNOWS.', 'bad');
    sfx.play('yell'); regPaint();
    if ((game.player.strikes + reg.caught) >= T.skimStrikeLimit) return regEnd();
  }
  if (reg.holdSkim && !reg.camOn) {
    reg.skimT += dt;
    if (reg.skimT > 0.45) { reg.skimT = 0; reg.skimmed = Math.min(reg.skimmed + 1, 6 * reg.order); regPaint(); sfx.play('pickup'); }
  }
  $('reg-timer-fill').style.width = `${Math.max(0, reg.timer / 22) * 100}%`;
  // the shakes are a mechanic, not a graphic
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
  $('hud-heat').innerHTML = ['NOTICED', 'NAMED', 'WANTED'].map((n, i) =>
    `<span class="pip ${st > i ? 'pip-on' : ''} ${i === 2 && st > 2 ? 'pip-hot' : ''}">${n}</span>`).join('');
  const chips = [];
  if (p.held) chips.push(`✊ ${p.held.kind}`);
  if (p.carryCrate) chips.push('📦 CRATE');
  if (p.inv.rip) chips.push(`⚡×${p.inv.rip}`);
  if (p.inv.jerky) chips.push(`🥩×${p.inv.jerky}`);
  if (p.inv.crowbar) chips.push('🔧 crowbar');
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
  $('end-text').textContent = E.text + (sum.roommate ? `\n\nYour roommate: "${sum.roommate}"` : '');
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
  const w = Math.min(window.innerWidth, 1500), h = window.innerHeight;
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
$('p-restart').onclick = () => location.reload();
$('hud-scheme').onclick = () => $('scheme-panel').classList.toggle('open');
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
