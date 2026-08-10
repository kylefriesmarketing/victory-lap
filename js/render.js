// VICTORY LAP — render.js
// Canvas 2D view layer. Every choice here answers to ART_BIBLE.md.
// View-only: free to use Math.random. Never touches sim state.

import { T, WORLD, BUILDINGS, ALLEY_GAPS, STRIP_Y, EXTERIOR_PROPS, GARAGE, FOXHOLE,
         DOWNTOWN, DT_Y, RAIL_Y, WATER_TOWER, COURTHOUSE, MAIN_ST, WORKS, BLUFFS, HTCC, INTERIORS,
         ARCHETYPES, NAMED } from './game.js';

const PAL = {
  asphalt: '#4a4745', asphalt2: '#565350', patch: '#3e3c38', sidewalk: '#736f67',
  curb: '#7d786f', line: '#8f8578', lineFade: 'rgba(201,178,138,0.34)',
  grass: '#4c5741', dirt: '#6b5d43', gum: '#2e2c2a', oil: 'rgba(20,18,22,0.5)',
  roofA: '#57524a', roofB: '#4e4a44', roofC: '#605a50', facade: '#7a7062',
  brick: '#6d4a3a', cream: '#e8dcc3', denim: '#5b7291', red: '#9c3d2e',
  amber: '#ffb347', night: '#141a2c', moon: '#7e93c4', tan: '#c9b28a',
};

function rr(a, b) { return a + Math.random() * (b - a); }
function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

// Sleeves must never be the same value as the torso or every gesture disappears
// into the body — at 54px the arm IS the acting.
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + amt))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// deterministic-ish scatter so the grime doesn't crawl between repaints
function scatter(n, seed, fn) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < n; i++) fn(rnd, i);
}

export class Renderer {
  constructor(canvas, game) {
    this.cv = canvas; this.g = game;
    this.ctx = canvas.getContext('2d');
    this.cam = { x: 420, y: 1000, shake: 0, sx: 0, sy: 0 };
    this.zoom = 1.35;
    this.grounds = {};        // room -> offscreen canvas
    this.light = document.createElement('canvas');
    this.barks = [];          // {who, text, x, y, t}
    this.parts = [];          // particles
    this.streetCars = [];     // ambient traffic
    this.puddles = [];
    scatter(14, 77, (rnd) => this.puddles.push({ x: 200 + rnd() * 1800, y: 640 + rnd() * 420, rx: 20 + rnd() * 46, ry: 8 + rnd() * 14 }));
    scatter(8, 78, (rnd) => this.puddles.push({ x: 200 + rnd() * 1800, y: 2140 + rnd() * 180, rx: 18 + rnd() * 40, ry: 7 + rnd() * 12 }));
    this.t = 0;
    this.flicker = 0;
  }

  resize(w, h) { this.cv.width = w; this.cv.height = h; this.light.width = w; this.light.height = h; }

  bark(who, text, x, y) {
    // two people saying the identical sentence at once reads as a rendering bug
    if (this.barks.some(b => b.text === text && b.t < 1.6)) return;
    // stack barks that land on top of each other instead of overprinting them into mush
    let lift = 0;
    for (const b of this.barks) {
      if (Math.abs(b.x - x) < 150 && Math.abs((b.y - b.lift) - y) < 90) lift = Math.max(lift, b.lift + 52);
    }
    this.barks.push({ who, text, x, y: y - lift, lift, t: 0, dur: 2.6 + text.length * 0.045 });
    if (this.barks.length > 5) this.barks.shift();
  }

  fx(kind, x, y, d = {}) {
    const add = (n, mk) => { for (let i = 0; i < n; i++) this.parts.push(mk(i)); };
    if (kind === 'impact') add(7, () => ({ x, y: y - 26, vx: rr(-90, 90), vy: rr(-130, -20), g: 300, r: rr(1.5, 3), c: 'rgba(232,220,195,0.85)', t: 0, dur: rr(0.25, 0.5) }));
    if (kind === 'shatter') add(13, () => ({ x, y: y - 8, vx: rr(-150, 150), vy: rr(-190, -30), g: 420, r: rr(1, 2.6), c: 'rgba(190,220,215,0.9)', t: 0, dur: rr(0.3, 0.7) }));
    if (kind === 'break') add(10, () => ({ x, y: y - 18, vx: rr(-120, 120), vy: rr(-170, -30), g: 380, r: rr(1.5, 3.2), c: '#8a5a33', t: 0, dur: rr(0.3, 0.65) }));
    if (kind === 'ko') add(9, () => ({ x, y: y - 10, vx: rr(-60, 60), vy: rr(-60, -10), g: 120, r: rr(1, 2.4), c: 'rgba(160,150,140,0.7)', t: 0, dur: rr(0.5, 0.9) }));
    if (kind === 'hurl') add(11, () => ({ x: x + rr(-4, 4), y: y - 20, vx: rr(-40, 80), vy: rr(-30, 40), g: 260, r: rr(1.2, 2.8), c: 'rgba(150,146,88,0.75)', t: 0, dur: rr(0.3, 0.6) }));
    // a miss has to READ as a miss, or players can't tell range from bad luck
    if (kind === 'whiff') add(4, (i) => ({ x: x + rr(-6, 6), y: y - 24 + rr(-4, 4),
      vx: Math.cos(d.ang || 0) * rr(40, 90), vy: Math.sin(d.ang || 0) * rr(40, 90) - 20,
      g: 40, r: rr(0.8, 1.6), c: 'rgba(232,220,195,0.35)', t: 0, dur: rr(0.16, 0.28) }));
    if (kind === 'impact' || kind === 'ko') this.cam.shake = Math.min(6, this.cam.shake + (kind === 'ko' ? 4 : 2));
  }

  // ---------------------------------------------------------------------- //
  //  GROUND PAINTING — the world's history, baked once per room             //
  // ---------------------------------------------------------------------- //

  ground(room) {
    if (this.grounds[room]) return this.grounds[room];
    const cv = document.createElement('canvas');
    if (room === 'ext') { cv.width = WORLD.w; cv.height = WORLD.h; this._paintExterior(cv.getContext('2d')); }
    else {
      const it = INTERIORS[room];
      cv.width = it.w; cv.height = it.h;
      this._paintInterior(cv.getContext('2d'), room, it);
    }
    this.grounds[room] = cv;
    return cv;
  }

  _paintExterior(c) {
    const W = WORLD.w, H = WORLD.h;
    // base asphalt with tonal patches — decades of partial repaving
    c.fillStyle = PAL.asphalt; c.fillRect(0, 0, W, H);
    scatter(60, 11, (rnd) => {
      c.fillStyle = rnd() < 0.5 ? PAL.asphalt2 : PAL.patch;
      c.globalAlpha = 0.35 + rnd() * 0.3;
      const x = rnd() * W, y = 480 + rnd() * 620;
      c.fillRect(x, y, 60 + rnd() * 220, 40 + rnd() * 120);
    });
    c.globalAlpha = 1;
    // cracks
    scatter(40, 23, (rnd) => {
      c.strokeStyle = 'rgba(24,22,20,0.5)'; c.lineWidth = 1.5;
      let x = rnd() * W, y = 500 + rnd() * 560;
      c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 70; y += rnd() * 40; c.lineTo(x, y); }
      c.stroke();
      if (rnd() < 0.4) { c.fillStyle = PAL.grass; c.globalAlpha = 0.7; c.fillRect(x - 2, y - 2, 3, 5); c.globalAlpha = 1; } // weeds win
    });
    // back alley strip
    c.fillStyle = '#413f43'; c.fillRect(0, 40, W, STRIP_Y.roofTop - 40);
    scatter(26, 31, (rnd) => { c.fillStyle = 'rgba(20,18,16,0.4)'; c.fillRect(rnd() * W, 50 + rnd() * 120, 20 + rnd() * 60, 8 + rnd() * 20); });
    // sidewalk along the strip + south side
    this._sidewalk(c, 0, STRIP_Y.base, W, 60);
    this._sidewalk(c, 0, 1040, W, 46);
    // street
    c.fillStyle = '#3c3a38'; c.fillRect(0, 920, W, 120);
    c.strokeStyle = PAL.lineFade; c.lineWidth = 3; c.setLineDash([26, 22]);
    c.beginPath(); c.moveTo(0, 980); c.lineTo(W, 980); c.stroke(); c.setLineDash([]);
    // crosswalk, mostly a memory
    for (let i = 0; i < 7; i++) { c.fillStyle = 'rgba(201,178,138,0.28)'; c.fillRect(1020 + i * 18, 924, 10, 112); }
    // parking spot lines (angled) + oil where cars actually park
    c.strokeStyle = PAL.lineFade; c.lineWidth = 2.5;
    for (let x = 460; x < 2080; x += 80) {
      c.beginPath(); c.moveTo(x, 540); c.lineTo(x - 18, 660); c.stroke();
    }
    scatter(18, 47, (rnd) => {
      const x = 480 + rnd() * 1500, y = 560 + rnd() * 80;
      const gr = c.createRadialGradient(x, y, 2, x, y, 18 + rnd() * 22);
      gr.addColorStop(0, PAL.oil); gr.addColorStop(1, 'rgba(20,18,22,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, 18 + rnd() * 26, 8 + rnd() * 12, 0, 0, 7); c.fill();
    });
    // THE LOT — skid marks and the town's arguments
    scatter(8, 53, (rnd) => {
      c.strokeStyle = 'rgba(18,16,16,0.35)'; c.lineWidth = 4 + rnd() * 3;
      const x = 720 + rnd() * 600, y = 700 + rnd() * 190;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 60, y + rnd() * 40 - 20, x + 130 + rnd() * 80, y + rnd() * 30); c.stroke();
    });
    // lot furniture: the difference between "empty" and "empty on purpose"
    c.save(); c.translate(1080, 800); c.rotate(-0.015);
    c.fillStyle = 'rgba(232,220,195,0.10)'; c.font = 'bold 44px Impact, Arial'; c.textAlign = 'center';
    c.fillText('CUSTOMER  PARKING', 0, 0); c.restore();
    for (const [ax, ay, rot] of [[640, 830, 0.05], [1500, 770, 3.19]]) { // faded flow arrows
      c.save(); c.translate(ax, ay); c.rotate(rot);
      c.fillStyle = 'rgba(232,220,195,0.12)';
      c.beginPath(); c.moveTo(-40, -8); c.lineTo(18, -8); c.lineTo(18, -20); c.lineTo(52, 0);
      c.lineTo(18, 20); c.lineTo(18, 8); c.lineTo(-40, 8); c.fill(); c.restore();
    }
    // cart corral, one dead cart forever
    c.strokeStyle = 'rgba(150,150,158,0.55)'; c.lineWidth = 3;
    c.strokeRect(1620, 730, 120, 56); c.beginPath(); c.moveTo(1620, 758); c.lineTo(1740, 758); c.stroke();
    c.lineWidth = 1;
    c.fillStyle = 'rgba(140,140,148,0.7)'; c.fillRect(1648, 742, 30, 20);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(1648, 762, 30, 5);
    // planting island the town stopped watering in 2011
    c.fillStyle = PAL.curb; c.beginPath(); c.roundRect(770, 700, 130, 46, 10); c.fill();
    c.fillStyle = '#5a5344'; c.beginPath(); c.roundRect(776, 705, 118, 36, 8); c.fill();
    scatter(24, 81, (rnd) => { c.fillStyle = rnd() < 0.6 ? '#6b5d43' : '#57604a'; c.fillRect(780 + rnd() * 110, 708 + rnd() * 30, 3, 2 + rnd() * 3); });
    c.strokeStyle = '#4c4436'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(835, 726); c.lineTo(830, 712); c.moveTo(835, 726); c.lineTo(842, 714); c.stroke(); c.lineWidth = 1; // the shrub (deceased)
    // desire line: bus stop to Wing Barn, the diagonal everyone actually walks
    c.strokeStyle = 'rgba(30,26,22,0.14)'; c.lineWidth = 30; c.lineCap = 'round';
    c.beginPath(); c.moveTo(1035, 1060); c.quadraticCurveTo(1150, 800, 1280, 500); c.stroke();
    c.lineCap = 'butt'; c.lineWidth = 1;
    scatter(14, 93, (rnd) => { // extra oil where the lot actually gets used
      const x = 760 + rnd() * 700, y = 720 + rnd() * 170;
      const gr = c.createRadialGradient(x, y, 2, x, y, 14 + rnd() * 18);
      gr.addColorStop(0, PAL.oil); gr.addColorStop(1, 'rgba(20,18,22,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, 14 + rnd() * 20, 6 + rnd() * 9, 0, 0, 7); c.fill();
    });
    // litter drifts where the wind and the people put it: against the curb, behind the
    // dumpsters, under the bus shelter bench. Nobody has ever emptied a bin on this street.
    const litter = (n, seed, x0, y0, w, h) => scatter(n, seed, (rnd) => {
      const lx = x0 + rnd() * w, ly = y0 + rnd() * h, r = rnd();
      if (r < 0.3) {            // flattened cup
        c.fillStyle = 'rgba(226,220,206,0.55)';
        c.beginPath(); c.ellipse(lx, ly, 3.4, 2.1, rnd() * 3, 0, 7); c.fill();
      } else if (r < 0.55) {    // fast-food bag, gone grey
        c.fillStyle = 'rgba(200,186,158,0.5)'; c.fillRect(lx, ly, 5 + rnd() * 4, 4 + rnd() * 3);
      } else if (r < 0.78) {    // cigarette butts, always in pairs
        c.fillStyle = 'rgba(232,224,206,0.6)';
        c.fillRect(lx, ly, 2.6, 1.1); c.fillRect(lx + 2 + rnd() * 3, ly + 1 + rnd() * 2, 2.4, 1.1);
        c.fillStyle = 'rgba(120,90,50,0.6)'; c.fillRect(lx + 1.8, ly, 0.9, 1.1);
      } else if (r < 0.92) {    // scratcher, losing
        c.fillStyle = 'rgba(190,160,90,0.5)'; c.fillRect(lx, ly, 5, 3);
      } else {                  // bottle cap
        c.fillStyle = 'rgba(150,60,50,0.55)';
        c.beginPath(); c.arc(lx, ly, 1.3, 0, 7); c.fill();
      }
    });
    litter(90, 301, 0, STRIP_Y.base + 34, W, 26);     // against the curb line
    litter(40, 302, 860, 60, 260, 120);               // behind the buffet dumpster
    litter(40, 303, 1440, 60, 280, 120);              // behind Game Barn — your route
    litter(34, 304, 930, 1040, 240, 60);              // the bus shelter, obviously
    litter(26, 305, 150, 560, 240, 90);               // the QwikStop pumps

    // gum constellation on sidewalks
    scatter(240, 61, (rnd) => {
      c.fillStyle = PAL.gum; c.globalAlpha = 0.5 + rnd() * 0.3;
      const y = rnd() < 0.7 ? STRIP_Y.base + rnd() * 56 : 1040 + rnd() * 42;
      c.beginPath(); c.arc(rnd() * W, y, 1 + rnd() * 1.6, 0, 7); c.fill();
    });
    c.globalAlpha = 1;
    // south grass + the worn diagonal path everyone actually takes
    c.fillStyle = PAL.grass; c.fillRect(0, 1086, W, H - 1086);
    scatter(400, 67, (rnd) => { c.fillStyle = rnd() < 0.5 ? '#525f46' : '#46523c'; c.fillRect(rnd() * W, 1086 + rnd() * (H - 1086), 3, 2); });
    c.strokeStyle = PAL.dirt; c.lineWidth = 26; c.globalAlpha = 0.8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(430, 1086); c.quadraticCurveTo(440, 1120, 410, 1150); c.stroke(); // to Bev's door
    c.beginPath(); c.moveTo(1035, 1086); c.quadraticCurveTo(1010, 1160, 900, 1240); c.stroke(); // the shortcut nobody paved
    c.globalAlpha = 1; c.lineCap = 'butt';
    // driveway
    c.fillStyle = '#5a564f'; c.fillRect(360, 1086, 110, 64);
    // ⚠️ THE ALLEY MOUTHS. These two 60px gaps are the ONLY route to the back alley,
    // which is the entire heist — and they were painted as nothing at all: bare asphalt
    // between two identical facades. The game's most important piece of map knowledge
    // has to be visible from the lot.
    for (const gp of ALLEY_GAPS) {
      const gx = (gp.x1 + gp.x2) / 2, gw = gp.x2 - gp.x1;
      // the mouth floor is dirtier than the lot — nobody sweeps a service gap
      c.fillStyle = 'rgba(24,22,20,0.30)';
      c.fillRect(gp.x1, STRIP_Y.roofTop, gw, STRIP_Y.base - STRIP_Y.roofTop);
      scatter(20, gx, (rnd) => {
        c.fillStyle = `rgba(18,16,14,${0.15 + rnd() * 0.25})`;
        c.fillRect(gp.x1 + rnd() * gw, STRIP_Y.roofTop + rnd() * 280, 4 + rnd() * 14, 2 + rnd() * 5);
      });
      // bollards either side, one knocked crooked years ago
      for (const [bx, tilt] of [[gp.x1 + 7, 0], [gp.x2 - 7, 0.22]]) {
        c.save(); c.translate(bx, STRIP_Y.base + 4); c.rotate(tilt);
        c.fillStyle = '#6a6258'; c.fillRect(-4, -26, 8, 26);
        c.fillStyle = '#c9a227'; c.fillRect(-4, -22, 8, 5);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-6, -1, 12, 3);
        c.restore();
      }
      // a chained gate that stopped closing a long time ago
      c.strokeStyle = 'rgba(150,152,158,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(gp.x1 + 6, STRIP_Y.base - 2); c.lineTo(gp.x1 + 26, STRIP_Y.base - 16); c.stroke();
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.moveTo(gp.x1 + 8 + i * 5, STRIP_Y.base - 3 - i * 0.5); c.lineTo(gp.x1 + 12 + i * 5, STRIP_Y.base - 15); c.stroke();
      }
      c.lineWidth = 1;
      // scuffed arrows of traffic: everybody cuts this corner
      c.strokeStyle = 'rgba(30,26,22,0.16)'; c.lineWidth = 18; c.lineCap = 'round';
      c.beginPath(); c.moveTo(gx, STRIP_Y.base + 40); c.lineTo(gx, STRIP_Y.roofTop + 20); c.stroke();
      c.lineCap = 'butt'; c.lineWidth = 1;
    }

    // buildings: roofs + facades + their whole biography
    for (const b of BUILDINGS) this._paintBuilding(c, b);
    this._paintGarage(c);
    this._paintFoxhole(c);
    this._paintDowntown(c);
    this._paintWorks(c);
    this._paintCampus(c);
    this._paintBluffs(c);
    // south houses (set dressing)
    for (const h of [[760, 1200, 180, 140, '#6d5a4a'], [1000, 1220, 160, 120, '#5a5d52'], [1250, 1200, 200, 140, '#7a6a55'], [1550, 1230, 170, 120, '#615549']]) {
      c.fillStyle = h[4]; c.fillRect(h[0], h[1], h[2], h[3]);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(h[0], h[1], h[2], 10);
      c.fillStyle = '#3a3632'; c.fillRect(h[0] + 8, h[1] + h[3] - 26, 24, 26); // door
      c.fillStyle = 'rgba(255,214,140,0.16)'; c.fillRect(h[0] + h[2] - 40, h[1] + h[3] - 30, 26, 18);
    }
    // chain-link around the dog run + kiddie pool yard
    c.strokeStyle = 'rgba(160,160,168,0.5)'; c.lineWidth = 1.5;
    c.strokeRect(536, 1160, 130, 90);
    for (let x = 536; x < 666; x += 10) { c.beginPath(); c.moveTo(x, 1160); c.lineTo(x + 10, 1250); c.stroke(); }
    // static exterior props into the ground
    for (const p of EXTERIOR_PROPS) this._paintProp(c, p);
    // vignette of grime toward edges — light-handed; the lighting pass owns mood
    const vg = c.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, H);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,10,12,0.16)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }

  _sidewalk(c, x, y, w, h) {
    c.fillStyle = PAL.sidewalk; c.fillRect(x, y, w, h);
    c.fillStyle = PAL.curb; c.fillRect(x, y + h - 4, w, 4);
    c.strokeStyle = 'rgba(40,38,36,0.5)'; c.lineWidth = 1.5;
    for (let sx = x; sx < x + w; sx += 90) { c.beginPath(); c.moveTo(sx, y); c.lineTo(sx, y + h); c.stroke(); }
    scatter(30, y, (rnd) => { c.fillStyle = 'rgba(30,28,26,0.3)'; c.fillRect(x + rnd() * w, y + rnd() * h, 8 + rnd() * 26, 2 + rnd() * 4); });
  }

  _paintBuilding(c, b, Y = STRIP_Y, alley = true) {
    const f = b.face || { parapet: 0, doorAt: 0.5, win: 'pair', recess: 0 };
    const yT = Y.roofTop, yF = Y.facadeTop - (f.parapet || 0), yB = Y.base;
    // roof: tar and gravel, HVAC box, mystery stains
    c.fillStyle = b.key === 'dead' ? '#3d4045' : (['qwikstop', 'wingbarn'].includes(b.key) ? PAL.roofC : PAL.roofA);
    c.fillRect(b.x, yT, b.w, yF - yT);
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(b.x, yT, b.w, 8);
    // organized roof, not clutter: parapet inset, tar seams, ponding stains
    c.strokeStyle = 'rgba(255,255,255,0.05)'; c.strokeRect(b.x + 6, yT + 10, b.w - 12, yF - yT - 16);
    c.strokeStyle = 'rgba(0,0,0,0.12)';
    for (let sx = b.x + 52; sx < b.x + b.w - 24; sx += 68) { c.beginPath(); c.moveTo(sx, yT + 12); c.lineTo(sx + 3, yF - 10); c.stroke(); }
    scatter(3, b.x, (rnd) => {
      const px = b.x + 24 + rnd() * (b.w - 60), py = yT + 34 + rnd() * (yF - yT - 76), pr = 14 + rnd() * 20;
      const g2 = c.createRadialGradient(px, py, 2, px, py, pr);
      g2.addColorStop(0, 'rgba(16,16,20,0.15)'); g2.addColorStop(1, 'rgba(16,16,20,0)');
      c.fillStyle = g2; c.beginPath(); c.ellipse(px, py, pr, pr * 0.55, 0, 0, 7); c.fill();
    });
    c.fillStyle = PAL.roofB; c.fillRect(b.x + b.w * 0.55, yT + 26, 44, 30); // HVAC
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.strokeRect(b.x + b.w * 0.55, yT + 26, 44, 30);
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.arc(b.x + b.w * 0.55 + 58, yT + 40, 5, 0, 7); c.fill(); // vent
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(b.x + b.w * 0.55 + 22, yT + 60, 26, 7, 0, 0, 7); c.fill(); // HVAC shadow
    // facade — parapet/gable give each storefront its own roofline silhouette
    const fc = { qwikstop: '#8a4a3a', hardware: '#6e6455', tattoo: '#3a3d4a', buffet: '#8a3d34',
                 wingbarn: '#7a5a3a', gamebarn: '#4a5568', dead: '#e8e4dc', cashking: '#5a4a2a' }[b.key] || PAL.facade;
    c.fillStyle = fc;
    if (f.gable) {   // the Barn actually has a barn roof
      c.beginPath();
      c.moveTo(b.x, yB); c.lineTo(b.x, yF + 14);
      c.lineTo(b.x + b.w / 2, yF - 10); c.lineTo(b.x + b.w, yF + 14); c.lineTo(b.x + b.w, yB);
      c.closePath(); c.fill();
    } else c.fillRect(b.x, yF, b.w, yB - yF);
    if (f.parapet > 6) {   // capstone on a raised parapet
      c.fillStyle = shade(fc, 0.22);
      c.fillRect(b.x - 2, yF - (f.gable ? 10 : 0), b.w + 4, f.gable ? 3 : 5);
    }
    // brick/wear texture on the facade — a texture, not a wound
    if (b.key !== 'dead') scatter(20, b.x + 7, (rnd) => {
      c.fillStyle = `rgba(0,0,0,${0.04 + rnd() * 0.07})`;
      c.fillRect(b.x + rnd() * b.w, yF + rnd() * (yB - yF), 5 + rnd() * 10, 2 + rnd() * 4);
    });
    // water stain under the roofline; grime rising from the ground
    c.fillStyle = 'rgba(20,20,24,0.25)'; c.fillRect(b.x, yF, b.w, 5);
    const gg = c.createLinearGradient(0, yB - 18, 0, yB);
    gg.addColorStop(0, 'rgba(30,26,20,0)'); gg.addColorStop(1, 'rgba(30,26,20,0.4)');
    c.fillStyle = gg; c.fillRect(b.x, yB - 18, b.w, 18);
    // door — position varies per storefront, and a recess reads as real depth
    const doorX = b.x + b.w * (f.doorAt ?? 0.5) - 16;
    const dTop = yF + (f.parapet || 0) + 34;
    if (f.recess) {
      c.fillStyle = shade(fc, -0.35);
      c.fillRect(doorX - f.recess, dTop - 8, 32 + f.recess * 2, yB - dTop + 8);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(doorX - f.recess, dTop - 8, 32 + f.recess * 2, 6);
    }
    c.fillStyle = 'rgba(24,30,38,0.9)'; c.fillRect(doorX, dTop, 32, yB - dTop);
    c.strokeStyle = 'rgba(200,190,170,0.4)'; c.strokeRect(doorX, dTop, 32, yB - dTop);
    c.fillStyle = 'rgba(210,200,180,0.55)'; c.fillRect(doorX + (f.doorAt > 0.5 ? 4 : 25), dTop + 16, 3, 7); // handle

    // glazing — each shop's relationship with the street, in one detail
    const wy = yF + (f.parapet || 0) + 30;
    const glass = (wx, ww, wh) => {
      c.fillStyle = 'rgba(30,40,52,0.85)'; c.fillRect(wx, wy, ww, wh);
      c.strokeStyle = 'rgba(0,0,0,0.4)'; c.strokeRect(wx, wy, ww, wh);
      c.fillStyle = 'rgba(255,255,255,0.07)'; c.beginPath();
      c.moveTo(wx, wy + wh); c.lineTo(wx + ww * 0.4, wy); c.lineTo(wx + ww * 0.62, wy);
      c.lineTo(wx + ww * 0.14, wy + wh); c.fill();
    };
    const kind = f.win || 'pair';
    if (kind === 'wide') {                       // gas station: all glass, nothing hidden
      glass(b.x + 14, doorX - b.x - 24, 40);
      glass(doorX + 42, b.x + b.w - doorX - 56, 40);
    } else if (kind === 'pair') {
      glass(b.x + 18, 40, 34); glass(b.x + b.w - 58, 40, 34);
    } else if (kind === 'single') {              // narrow shop, one window
      glass(b.x + 22, 46, 38);
    } else if (kind === 'grid') {                // muntin bars — an older building
      for (const gx of [b.x + 16, b.x + b.w - 62]) {
        glass(gx, 46, 36);
        c.strokeStyle = 'rgba(0,0,0,0.3)';
        c.beginPath(); c.moveTo(gx + 23, wy); c.lineTo(gx + 23, wy + 36);
        c.moveTo(gx, wy + 18); c.lineTo(gx + 46, wy + 18); c.stroke();
      }
    } else if (kind === 'slot') {                // Ca$h Kingdom: a blind wall and one slit
      c.fillStyle = shade(fc, -0.2); c.fillRect(b.x + 14, wy, b.w - 28, 40);
      glass(b.x + b.w * 0.34, 34, 16);
      c.strokeStyle = 'rgba(210,200,180,0.5)'; c.lineWidth = 2;
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(b.x + b.w * 0.34 + i * 8, wy); c.lineTo(b.x + b.w * 0.34 + i * 8, wy + 16); c.stroke(); }
      c.lineWidth = 1;
    } else if (kind === 'papered') {             // Fairview: brown paper, nothing to see yet
      for (const gx of [b.x + 16, b.x + b.w - 62]) {
        c.fillStyle = '#c8b494'; c.fillRect(gx, wy, 46, 36);
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(gx, wy); c.lineTo(gx + 46, wy + 36); c.moveTo(gx + 46, wy); c.lineTo(gx, wy + 36); c.stroke();
        c.lineWidth = 1;
      }
    }
    if (f.awning) {   // striped cloth, scalloped hem, sagging in the middle like real ones
      const ax = b.x + 14, aw = b.w - 28, ay = wy - 9;
      c.save();
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + aw, ay);
      c.quadraticCurveTo(ax + aw / 2, ay + 15, ax, ay); c.clip();
      c.fillStyle = f.awning; c.fillRect(ax, ay, aw, 16);
      c.fillStyle = 'rgba(240,232,214,0.5)';
      for (let sx = ax; sx < ax + aw; sx += 22) c.fillRect(sx, ay, 11, 16);
      c.restore();
      c.strokeStyle = 'rgba(0,0,0,0.3)';
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + aw, ay); c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(ax, wy, aw, 4);   // shadow it throws
    }
    // per-building storytelling. ⚠️ anchored to yG (the TRUE facade line), not yF —
    // yF now varies with the parapet, which would fling these onto the roof.
    const yG = Y.facadeTop;
    if (b.key === 'qwikstop') { // ice machine + propane cage
      c.fillStyle = '#c8c4bc'; c.fillRect(b.x + 8, yB - 34, 30, 34);
      c.fillStyle = '#3a6ea8'; c.fillRect(b.x + 8, yB - 34, 30, 10);
      c.fillStyle = '#98a0a8'; c.fillRect(b.x + b.w - 40, yB - 30, 32, 30);
      c.strokeStyle = '#6a7078'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(b.x + b.w - 40 + i * 8, yB - 30); c.lineTo(b.x + b.w - 40 + i * 8, yB); c.stroke(); }
    }
    if (b.key === 'hardware') { // the eternal banner
      c.save(); c.translate(b.x + b.w / 2, yG + 14); c.rotate(-0.02);
      c.fillStyle = 'rgba(214,80,60,0.75)'; c.fillRect(-b.w / 2 + 10, -8, b.w - 20, 18);
      c.fillStyle = 'rgba(255,244,230,0.85)'; c.font = 'bold 11px Arial'; c.textAlign = 'center';
      c.fillText('EVERYTHING MUST GO', 0, 5); c.restore();
    }
    if (b.key === 'buffet') { // ghost names under the current sign
      c.fillStyle = 'rgba(232,220,195,0.14)'; c.font = 'bold 9px Georgia'; c.textAlign = 'center';
      c.fillText('LUCKY DRAGON PALACE', b.x + b.w / 2, yG + 24);
      c.fillStyle = 'rgba(232,220,195,0.08)'; c.fillText('JADE GARDEN EXPRESS', b.x + b.w / 2 + 3, yG + 28);
    }
    if (b.key === 'dead') { // Fairview: the only clean thing on the street
      // ⚠️ keep every string inside b.w (180) — these used to spill onto the neighbours
      c.fillStyle = 'rgba(0,0,0,0.10)'; c.fillRect(b.x + 15, yF + 9, b.w - 24, 52);
      c.fillStyle = '#fdfcfa'; c.fillRect(b.x + 12, yF + 6, b.w - 24, 52);
      c.strokeStyle = '#cfc9be'; c.strokeRect(b.x + 12, yF + 6, b.w - 24, 52);
      c.fillStyle = '#2a2e33'; c.font = '600 13px "Segoe UI", Arial'; c.textAlign = 'center';
      c.fillText('DAYBREAK', b.x + b.w / 2, yF + 26);
      c.fillText('COMMONS', b.x + b.w / 2, yF + 41);
      c.strokeStyle = '#c9a227'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(b.x + b.w / 2 - 26, yF + 46); c.lineTo(b.x + b.w / 2 + 26, yF + 46); c.stroke();
      c.lineWidth = 1;
      c.fillStyle = '#8a9096'; c.font = '400 6px "Segoe UI", Arial';
      c.fillText('LIVE · WORK · SIP', b.x + b.w / 2, yF + 55);
      // permit taped in the corner — off the door's centre line, where it won't collide
      c.save(); c.translate(b.x + 20, yB - 30); c.rotate(-0.04);
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(0, 0, 30, 22);
      c.strokeStyle = 'rgba(60,60,66,0.4)'; c.strokeRect(0, 0, 30, 22);
      c.fillStyle = 'rgba(30,30,34,0.6)'; c.font = 'bold 5px Arial'; c.textAlign = 'left';
      c.fillText('PERMIT', 3, 8); c.fillText('PENDING', 3, 15); c.fillText('#4417-B', 3, 21);
      c.restore();
    }
    if (b.key === 'gamebarn') { // taped flyer, curling at one corner
      c.save(); c.translate(doorX + 46, yG + 44); c.rotate(0.05);
      c.fillStyle = 'rgba(240,232,210,0.85)'; c.fillRect(0, 0, 26, 30);
      c.fillStyle = 'rgba(40,40,40,0.7)'; c.font = '5px Arial'; c.textAlign = 'left';
      c.fillText('WE BUY', 3, 10); c.fillText('OLD GAMES', 3, 17); c.fillText('(GOOD ONES)', 3, 24);
      c.restore();
    }
    // alley back doors + the milk-crate window behind Game Barn (strip row only)
    if (alley) {
      c.fillStyle = '#2e2c2a'; c.fillRect(b.x + b.w / 2 - 14, yT, 28, 8);
      if (b.key === 'gamebarn') {
        c.fillStyle = '#1e2430'; c.fillRect(b.x + 96, yT, 34, 8);
        c.strokeStyle = 'rgba(200,200,200,0.35)'; c.strokeRect(b.x + 96, yT, 34, 8);
        c.fillStyle = '#a83c3c'; c.fillRect(b.x + 100, yT - 12, 16, 12); // the milk crate
        c.strokeStyle = 'rgba(0,0,0,0.4)'; c.strokeRect(b.x + 100, yT - 12, 16, 12);
      }
    }
  }

  _paintGarage(c) {
    const g = GARAGE;
    c.fillStyle = '#6d6458'; c.fillRect(g.x, g.y, g.w, g.h);
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(g.x, g.y, g.w, 12);
    // roll door with dents
    c.fillStyle = '#8a8276'; c.fillRect(g.x + 70, g.y, 110, 10);
    c.strokeStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(g.x + 70, g.y + i * 2.5); c.lineTo(g.x + 180, g.y + i * 2.5); c.stroke(); }
    // Bev's flower pots — someone still tries
    c.fillStyle = '#8a4a3a'; c.fillRect(g.x + 16, g.y - 10, 14, 10); c.fillRect(g.x + g.w - 30, g.y - 10, 14, 10);
    c.fillStyle = '#c46a8a'; c.beginPath(); c.arc(g.x + 23, g.y - 12, 4, 0, 7); c.arc(g.x + g.w - 23, g.y - 12, 4, 0, 7); c.fill();
    // trash cans
    c.fillStyle = '#5a6068'; c.beginPath(); c.ellipse(g.x - 18, g.y + 30, 10, 12, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(g.x - 18, g.y + 58, 10, 12, 0, 0, 7); c.fill();
  }

  // A windowless cinder-block box on gravel. The whole building is one architectural
  // decision — "nobody can see in" — and one enormous sign doing all the talking.
  _paintFoxhole(c) {
    const f = FOXHOLE;
    // gravel apron, rutted where everyone parks in exactly the same two spots
    c.fillStyle = '#5f5a52'; c.fillRect(f.lot.x, f.lot.y, f.lot.w, f.lot.h);
    scatter(240, 411, (rnd) => {
      c.fillStyle = `rgba(${140 + rnd() * 50 | 0},${132 + rnd() * 46 | 0},${118 + rnd() * 40 | 0},${0.25 + rnd() * 0.4})`;
      c.fillRect(f.lot.x + rnd() * f.lot.w, f.lot.y + rnd() * f.lot.h, 1.5 + rnd() * 2.5, 1.5 + rnd() * 2);
    });
    c.fillStyle = 'rgba(30,26,22,0.28)';
    c.fillRect(f.lot.x + 40, f.lot.y + 30, 150, 34); c.fillRect(f.lot.x + 210, f.lot.y + 36, 140, 30);
    // the box: painted cinder block, one colour, no windows anywhere
    c.fillStyle = '#4a4048'; c.fillRect(f.x, f.y, f.w, f.h);
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(f.x, f.y, f.w, 12);
    for (let by = f.y + 14; by < f.y + f.h; by += 9) {           // block courses
      c.strokeStyle = 'rgba(0,0,0,0.14)'; c.beginPath();
      c.moveTo(f.x, by); c.lineTo(f.x + f.w, by); c.stroke();
    }
    scatter(30, 412, (rnd) => {   // patched paint over patched paint
      c.fillStyle = `rgba(${70 + rnd() * 22 | 0},${58 + rnd() * 18 | 0},${68 + rnd() * 20 | 0},0.6)`;
      c.fillRect(f.x + rnd() * f.w, f.y + 14 + rnd() * (f.h - 20), 16 + rnd() * 40, 8 + rnd() * 18);
    });
    // steel door, one bulb over it, a rail nobody holds
    const dx = f.door.x - f.x;
    c.fillStyle = '#2a2630'; c.fillRect(f.x + dx - 20, f.y + f.h - 10, 40, 10);
    c.fillStyle = '#3a3440'; c.fillRect(f.x + dx - 22, f.y + f.h - 14, 44, 5);
    // the SIGN — the only money ever spent on this building
    c.save(); c.translate(f.x + f.w / 2, f.y - 4);
    c.fillStyle = '#2e2630'; c.fillRect(-96, -46, 192, 46);
    c.strokeStyle = '#6a5a52'; c.strokeRect(-96, -46, 192, 46);
    c.fillStyle = '#d8486a'; c.font = 'bold 25px Impact, Arial'; c.textAlign = 'center';
    c.fillText('THE FOXHOLE', 0, -22);
    c.fillStyle = '#e8dcc3'; c.font = 'bold 8px Arial';
    c.fillText('18 & OVER  ·  ATM INSIDE  ·  TUES WING NIGHT', 0, -8);
    c.fillStyle = '#8a7a68'; c.fillRect(-4, 0, 8, 26);          // sign post
    c.restore();
  }

  // ── DOWNTOWN: the old core, south of the spur ─────────────────────────────
  _paintDowntown(c) {
    const W = WORLD.w;
    // ground: older, paler asphalt — paved once, in a better decade
    c.fillStyle = '#514d49'; c.fillRect(0, RAIL_Y + 55, W, WORLD.h - RAIL_Y - 55);
    scatter(46, 501, (rnd) => {
      c.fillStyle = rnd() < 0.5 ? '#5b5753' : '#464340'; c.globalAlpha = 0.4 + rnd() * 0.3;
      c.fillRect(rnd() * W, RAIL_Y + 70 + rnd() * 700, 60 + rnd() * 200, 40 + rnd() * 110);
    });
    c.globalAlpha = 1;

    // THE RAIL SPUR — the train never stops; the horn in the ambience finally has rails
    c.fillStyle = '#4a443c'; c.fillRect(0, RAIL_Y - 26, W, 52);            // gravel bed
    scatter(220, 502, (rnd) => { c.fillStyle = `rgba(${120 + rnd() * 50 | 0},${112 + rnd() * 44 | 0},${100 + rnd() * 40 | 0},0.5)`; c.fillRect(rnd() * W, RAIL_Y - 24 + rnd() * 48, 2, 2); });
    for (let tx = 0; tx < W; tx += 26) { c.fillStyle = '#3a322a'; c.fillRect(tx, RAIL_Y - 14, 16, 28); } // ties
    c.fillStyle = '#8a8578'; c.fillRect(0, RAIL_Y - 10, W, 4); c.fillRect(0, RAIL_Y + 7, W, 4);          // rails
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, RAIL_Y - 10, W, 1); c.fillRect(0, RAIL_Y + 7, W, 1);
    // crossing at the desire-line: crossbuck + the sign everyone shot at
    c.save(); c.translate(1035, RAIL_Y - 34);
    c.fillStyle = '#6a6258'; c.fillRect(-3, 0, 6, 34);
    c.save(); c.rotate(0.785); c.fillStyle = '#e8e4dc'; c.fillRect(-26, -5, 52, 10); c.restore();
    c.save(); c.rotate(-0.785); c.fillStyle = '#e8e4dc'; c.fillRect(-26, -5, 52, 10); c.restore();
    c.fillStyle = '#2a2a2a'; c.font = 'bold 6px Arial'; c.textAlign = 'center';
    c.save(); c.rotate(0.785); c.fillText('RAIL ROAD', 0, 2); c.restore();
    scatter(5, 503, (rnd) => { c.fillStyle = 'rgba(20,20,20,0.7)'; c.beginPath(); c.arc(rnd() * 30 - 15, rnd() * 24, 1.3, 0, 7); c.fill(); }); // buckshot
    c.restore();

    // THE VACANT BAND — where downtown used to keep going
    for (const [sx, sy, sw, sh] of [[520, 1600, 220, 150], [860, 1640, 180, 120], [1480, 1590, 260, 170]]) {
      c.fillStyle = '#5a564f'; c.fillRect(sx, sy, sw, sh);                 // foundation slab
      c.strokeStyle = 'rgba(30,28,26,0.5)'; c.strokeRect(sx, sy, sw, sh);
      c.strokeStyle = 'rgba(30,28,26,0.3)';
      c.beginPath(); c.moveTo(sx, sy + sh / 2); c.lineTo(sx + sw, sy + sh / 2); c.stroke(); // room lines: somebody's kitchen
      c.beginPath(); c.moveTo(sx + sw * 0.4, sy); c.lineTo(sx + sw * 0.4, sy + sh); c.stroke();
      scatter(30, sx, (rnd) => { c.fillStyle = rnd() < 0.6 ? '#57604a' : '#6b5d43'; c.fillRect(sx + rnd() * sw, sy + rnd() * sh, 3, 2 + rnd() * 3); });
    }
    // the free couch (it's been rained on; still free)
    c.save(); c.translate(1240, 1700); c.rotate(-0.06);
    c.fillStyle = '#6a5a6e'; c.fillRect(0, 0, 84, 34);
    c.fillStyle = '#5a4a5e'; c.fillRect(0, 0, 84, 12); c.fillRect(0, 0, 12, 34); c.fillRect(72, 0, 12, 34);
    c.fillStyle = 'rgba(40,30,44,0.5)'; c.beginPath(); c.ellipse(42, 22, 18, 8, 0, 0, 7); c.fill(); // the water stain
    c.fillStyle = 'rgba(240,232,210,0.85)'; c.fillRect(30, -12, 26, 12);
    c.fillStyle = '#2a2a2a'; c.font = 'bold 5px Arial'; c.textAlign = 'left'; c.fillText('FREE', 33, -6); c.fillText('(STILL)', 33, -1);
    c.restore();

    // THE WATER TOWER — HOPEWELL, with the E and second L given up
    const wt = WATER_TOWER;
    c.strokeStyle = '#5a5248'; c.lineWidth = 5;
    for (const [lx, ly] of [[-34, 74], [34, 74], [-22, 74], [22, 74]]) {
      c.beginPath(); c.moveTo(wt.x + lx, wt.y + ly); c.lineTo(wt.x + (lx > 0 ? 26 : -26), wt.y - 60); c.stroke();
    }
    c.lineWidth = 2; c.beginPath(); c.moveTo(wt.x - 30, wt.y + 30); c.lineTo(wt.x + 30, wt.y + 10);
    c.moveTo(wt.x + 30, wt.y + 30); c.lineTo(wt.x - 30, wt.y + 10); c.stroke(); c.lineWidth = 1;
    c.fillStyle = 'rgba(20,18,16,0.3)'; c.beginPath(); c.ellipse(wt.x, wt.y + 84, 52, 12, 0, 0, 7); c.fill();
    c.fillStyle = '#7a7268'; c.beginPath(); c.ellipse(wt.x, wt.y - 88, 58, 34, 0, 0, 7); c.fill();  // tank
    c.fillStyle = '#847c70'; c.beginPath(); c.ellipse(wt.x, wt.y - 98, 58, 26, 0, 0, 7); c.fill();
    c.fillStyle = '#6a6258'; c.beginPath(); c.ellipse(wt.x, wt.y - 118, 20, 8, 0, 0, 7); c.fill();  // cap
    scatter(12, 504, (rnd) => { c.fillStyle = 'rgba(122,64,40,0.5)'; c.beginPath(); c.arc(wt.x - 50 + rnd() * 100, wt.y - 110 + rnd() * 40, 1.5 + rnd() * 3, 0, 7); c.fill(); }); // rust
    c.fillStyle = 'rgba(40,36,32,0.75)'; c.font = 'bold 13px Arial'; c.textAlign = 'center';
    c.fillText('H O P _ W E L _', wt.x, wt.y - 92);
    c.font = '7px Georgia'; c.fillStyle = 'rgba(40,36,32,0.5)';
    c.fillText('CLASS OF \'09 WAS HERE (ALLEGEDLY)', wt.x, wt.y - 80);

    // DOWNTOWN ROW — reuse the facade painter on its own Y band, no alley
    this._sidewalk(c, 0, DT_Y.base, W, 34);
    for (const b of DOWNTOWN) this._paintBuilding(c, b, DT_Y, false);
    // the dead fronts: three generations of giving up
    for (const b of DOWNTOWN) {
      if (!b.dead) continue;
      const cx = b.x + b.w / 2, yF = DT_Y.facadeTop - ((b.face && b.face.parapet) || 0);
      c.textAlign = 'center';
      if (b.dead === 'old') {
        c.fillStyle = 'rgba(232,220,195,0.35)'; c.font = 'bold 9px Arial';
        c.fillText('COMING SOON!', cx, yF + 26);
        c.font = '6px Arial'; c.fillText('(sign est. 2009)', cx, yF + 36);
      } else if (b.dead === 'mid') {
        c.save(); c.translate(cx, yF + 28); c.rotate(-0.05);
        c.fillStyle = 'rgba(214,80,60,0.4)'; c.font = 'bold 8px Arial';
        c.fillText('FOR LEASE — BIG DON', 0, 0); c.restore();
      } else if (b.dead === 'fairview') {
        c.fillStyle = '#fdfcfa'; c.fillRect(b.x + 10, yF + 8, b.w - 20, 40);
        c.strokeStyle = '#cfc9be'; c.strokeRect(b.x + 10, yF + 8, b.w - 20, 40);
        c.fillStyle = '#2a2e33'; c.font = '600 9px "Segoe UI", Arial';
        c.fillText('ANOTHER FAIRVIEW', cx, yF + 24);
        c.fillText('OPPORTUNITY', cx, yF + 35);
        c.fillStyle = '#8a9096'; c.font = '5px "Segoe UI", Arial'; c.fillText('it spreads', cx, yF + 44);
      } else { // ancient: the ghost of a grand opening
        c.fillStyle = 'rgba(232,220,195,0.10)'; c.font = 'bold 11px Georgia';
        c.fillText('GRAND OPENING', cx, yF + 30);
        c.fillStyle = 'rgba(232,220,195,0.06)'; c.font = '8px Georgia';
        c.fillText('EVERYTHING NEW', cx, yF + 42);
      }
    }
    // the Lip's contribution to the sidewalk, dried into legend (register: delivered)
    for (const [vx, vy, vr] of [[350, DT_Y.base + 42, 12], [420, DT_Y.base + 50, 8], [1950, 1400, 10]]) {
      const gr = c.createRadialGradient(vx, vy, 2, vx, vy, vr);
      gr.addColorStop(0, 'rgba(120,116,70,0.30)'); gr.addColorStop(1, 'rgba(120,116,70,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(vx, vy, vr, vr * 0.55, 0, 0, 7); c.fill();
    }

    // MAIN STREET
    c.fillStyle = '#43403d'; c.fillRect(0, MAIN_ST.y, W, MAIN_ST.h);
    c.strokeStyle = 'rgba(201,178,138,0.30)'; c.lineWidth = 3; c.setLineDash([26, 22]);
    c.beginPath(); c.moveTo(0, MAIN_ST.y + MAIN_ST.h / 2); c.lineTo(W, MAIN_ST.y + MAIN_ST.h / 2); c.stroke(); c.setLineDash([]);
    this._sidewalk(c, 0, MAIN_ST.y + MAIN_ST.h, W, 30);

    // THE COURTHOUSE SQUARE — lawn, memorial, flag at genuinely forgotten half mast
    c.fillStyle = '#4c5741'; c.fillRect(0, MAIN_ST.y + MAIN_ST.h + 30, W, WORLD.h - MAIN_ST.y - MAIN_ST.h - 30);
    scatter(240, 505, (rnd) => { c.fillStyle = rnd() < 0.5 ? '#525f46' : '#46523c'; c.fillRect(rnd() * W, MAIN_ST.y + MAIN_ST.h + 32 + rnd() * 100, 3, 2); });
    const ch = COURTHOUSE;
    c.fillStyle = '#8a8072'; c.fillRect(ch.x, ch.y, ch.w, ch.h);
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(ch.x, ch.y, ch.w, 10);
    for (let i = 0; i < 6; i++) { c.fillStyle = '#9a9284'; c.fillRect(ch.x + 60 + i * 70, ch.y - 16, 14, 16); } // columns face the street
    c.fillStyle = '#7a7264'; c.fillRect(ch.x + 40, ch.y - 20, ch.w - 80, 6);                                    // architrave
    c.fillStyle = '#5a5449'; c.fillRect(ch.x + ch.w / 2 - 60, ch.y - 34, 120, 14);                              // pediment strip
    c.fillStyle = 'rgba(40,36,30,0.8)'; c.font = 'bold 9px Georgia'; c.textAlign = 'center';
    c.fillText('HOPEWELL COUNTY COURTHOUSE', ch.x + ch.w / 2, ch.y - 24);
    c.font = 'italic 7px Georgia'; c.fillStyle = 'rgba(40,36,30,0.55)';
    c.fillText('· JUSTICE IS PATIENT ·', ch.x + ch.w / 2, ch.y - 15);
    for (const sx of [ch.x + 100, ch.x + ch.w - 100]) { c.fillStyle = 'rgba(232,220,195,0.5)'; c.fillRect(sx - 20, ch.y - 8, 40, 8); } // steps
    // flagpole, half mast since March, nobody remembers for who
    c.fillStyle = '#8a8578'; c.fillRect(958, 2308, 4, 70);
    c.fillStyle = '#5b7291'; c.fillRect(962, 2330, 26, 14);
    c.fillStyle = '#9c3d2e'; c.fillRect(962, 2338, 26, 6);
    // war memorial: a rock, a plaque, a story
    c.fillStyle = '#6a6258'; c.beginPath(); c.ellipse(700, 2340, 26, 18, 0.2, 0, 7); c.fill();
    c.fillStyle = 'rgba(201,178,138,0.6)'; c.fillRect(688, 2334, 24, 12);
  }

  // ── CASSIDY WORKS: the plant that made the town, half of it still trying ──
  _paintWorks(c) {
    const P = WORKS.plant;
    // the campus apron: cracked concrete, oil ghosts of nine hundred parked trucks
    c.fillStyle = '#565350'; c.fillRect(2240, 60, WORLD.w - 2240, 1440);
    scatter(60, 601, (rnd) => {
      c.fillStyle = rnd() < 0.5 ? '#5f5c58' : '#4b4845'; c.globalAlpha = 0.4 + rnd() * 0.3;
      c.fillRect(2260 + rnd() * 1100, 80 + rnd() * 1380, 60 + rnd() * 180, 40 + rnd() * 100);
    });
    c.globalAlpha = 1;
    scatter(40, 602, (rnd) => {
      const x = 2300 + rnd() * 1000, y = 700 + rnd() * 700;
      const gr = c.createRadialGradient(x, y, 2, x, y, 16 + rnd() * 20);
      gr.addColorStop(0, PAL.oil); gr.addColorStop(1, 'rgba(20,18,22,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, 16 + rnd() * 22, 7 + rnd() * 10, 0, 0, 7); c.fill();
    });
    // the road runs INTO the plant — that's the whole point of the road
    c.fillStyle = '#3c3a38'; c.fillRect(2240, 920, WORKS.gate.x - 2240 + 30, 120);
    c.strokeStyle = 'rgba(201,178,138,0.30)'; c.lineWidth = 3; c.setLineDash([26, 22]);
    c.beginPath(); c.moveTo(2240, 980); c.lineTo(WORKS.gate.x, 980); c.stroke(); c.setLineDash([]); c.lineWidth = 1;
    c.fillStyle = 'rgba(232,220,195,0.14)'; c.font = 'bold 30px Impact, Arial'; c.textAlign = 'center';
    c.save(); c.translate(2560, 1000); c.fillText('PLANT  TRAFFIC  ONLY', 0, 0); c.restore();
    // weeds through every expansion joint: the yard is going back to prairie, slowly
    c.strokeStyle = 'rgba(24,22,20,0.4)';
    for (let jx = 2320; jx < WORLD.w; jx += 140) { c.beginPath(); c.moveTo(jx, 80); c.lineTo(jx, 900); c.stroke(); }
    for (let jx = 2320; jx < WORLD.w; jx += 140) { c.beginPath(); c.moveTo(jx, 1060); c.lineTo(jx, 1470); c.stroke(); }
    scatter(120, 603, (rnd) => { c.fillStyle = rnd() < 0.6 ? '#57604a' : '#6b5d43'; c.fillRect(2280 + rnd() * 1080, 80 + rnd() * 1380, 3, 2 + rnd() * 4); });

    // THE PLANT: long shed, sawtooth roof, the ghost of its own name
    c.fillStyle = '#5c5852'; c.fillRect(P.x, P.y, P.w, P.h);
    for (let sx = P.x; sx < P.x + P.w; sx += 115) {          // sawtooth: teeth of the old economy
      c.fillStyle = '#514d47'; c.fillRect(sx, P.y, 115, 60);
      c.fillStyle = 'rgba(140,170,190,0.30)';
      c.beginPath(); c.moveTo(sx + 8, P.y + 8); c.lineTo(sx + 60, P.y + 8); c.lineTo(sx + 44, P.y + 46); c.lineTo(sx + 8, P.y + 46); c.fill();
    }
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(P.x, P.y + 60, P.w, 8);
    scatter(50, 604, (rnd) => { c.fillStyle = `rgba(30,26,22,${0.1 + rnd() * 0.2})`; c.fillRect(P.x + rnd() * P.w, P.y + 70 + rnd() * (P.h - 90), 20 + rnd() * 60, 6 + rnd() * 20); });
    scatter(20, 605, (rnd) => { c.fillStyle = 'rgba(122,64,40,0.4)'; c.fillRect(P.x + rnd() * P.w, P.y + 64 + rnd() * 30, 3, 20 + rnd() * 60); }); // rust weep
    c.fillStyle = 'rgba(232,220,195,0.16)'; c.font = 'bold 42px Impact, Arial'; c.textAlign = 'center';
    c.fillText('CASSIDY WORKS', P.x + P.w / 2, P.y + 300);   // the ghost sign, sun-eaten
    c.font = 'bold 12px Arial'; c.fillStyle = 'rgba(232,220,195,0.12)';
    c.fillText('EST. 1921 — "THE TOWN THAT WORKS"', P.x + P.w / 2, P.y + 324);
    // loading dock along the south face: bays, bumpers, one truck forever backing in
    c.fillStyle = '#3e3b38'; c.fillRect(P.x + 40, P.y + P.h, P.w - 80, 46);
    for (let bx = P.x + 70; bx < P.x + P.w - 100; bx += 130) {
      c.fillStyle = '#2a2724'; c.fillRect(bx, P.y + P.h, 74, 40);
      c.fillStyle = '#c9a227'; c.fillRect(bx, P.y + P.h + 40, 74, 5);
    }
    // THE STACKS — one still smoking, which is the whole town's pulse in one image
    for (const st of WORKS.stacks) {
      c.fillStyle = '#4e4a44'; c.fillRect(st.x - 17, 8, 34, P.y + 40);
      c.fillStyle = '#443f39'; c.fillRect(st.x - 20, 4, 40, 12);
      for (let ry = 30; ry < P.y + 30; ry += 34) { c.strokeStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(st.x - 17, ry); c.lineTo(st.x + 17, ry); c.stroke(); }
      c.fillStyle = 'rgba(200,60,50,0.55)';
      c.fillRect(st.x - 17, 20, 34, 5); c.fillRect(st.x - 17, 44, 34, 5);   // aircraft stripes, faded
    }

    // THE GATE: guard shack, barrier arm, the sign that promises a future in the past tense
    const G = WORKS.gate;
    c.fillStyle = '#6a655c'; c.fillRect(G.x, G.y, G.w, G.h);
    c.fillStyle = 'rgba(180,210,230,0.3)'; c.fillRect(G.x + 8, G.y + 20, G.w - 16, 30);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(G.x, G.y, G.w, 8);
    c.save(); c.translate(G.x - 4, G.y + 130); c.rotate(-0.06);
    c.fillStyle = '#c9302a'; c.fillRect(-120, -5, 120, 10);
    c.fillStyle = '#e8dcc3'; for (let i = 0; i < 4; i++) c.fillRect(-116 + i * 30, -5, 14, 10);
    c.restore();
    c.fillStyle = '#e8e4dc'; c.fillRect(G.x - 150, G.y - 60, 190, 44);
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.strokeRect(G.x - 150, G.y - 60, 190, 44);
    c.fillStyle = '#2e3a4c'; c.font = 'bold 10px Arial'; c.textAlign = 'center';
    c.fillText('CASSIDY WORKS', G.x - 55, G.y - 44);
    c.font = '7px Arial'; c.fillStyle = 'rgba(46,58,76,0.8)';
    c.fillText('A PROUD PARTNER IN HOPEWELL\'S FUTURE', G.x - 55, G.y - 33);
    c.font = 'italic 6px Georgia'; c.fillStyle = 'rgba(46,58,76,0.5)';
    c.fillText('(sign older than the future)', G.x - 55, G.y - 24);

    // THE UNION HALL: small, square, and the lights are ON. They are always on.
    const H = WORKS.hall;
    c.fillStyle = '#5a5148'; c.fillRect(H.x, H.y, H.w, H.h);
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(H.x, H.y, H.w, 10);
    c.fillStyle = 'rgba(255,214,140,0.35)';
    c.fillRect(H.x + 20, H.y + H.h - 46, 34, 26); c.fillRect(H.x + H.w - 54, H.y + H.h - 46, 34, 26); // LIT windows, spite-powered
    c.fillStyle = '#2a2622'; c.fillRect(H.door.x - 16, H.y + H.h - 34, 32, 34);
    c.fillStyle = '#c9a227'; c.fillRect(H.x + 14, H.y + 16, H.w - 28, 26);
    c.fillStyle = '#2a2622'; c.font = 'bold 9px Arial'; c.textAlign = 'center';
    c.fillText('I.B.C.W. LOCAL 448', H.x + H.w / 2, H.y + 28);
    c.font = '6px Arial'; c.fillText('EST 1934 · STILL HERE · STILL PAYING THE ELECTRIC', H.x + H.w / 2, H.y + 37);

    // dock office: a window with a clipboard behind it
    const D = WORKS.dockOffice;
    c.fillStyle = '#655f55'; c.fillRect(D.x, D.y, D.w, D.h);
    c.fillStyle = 'rgba(180,210,230,0.35)'; c.fillRect(D.x + 12, D.y + 18, D.w - 24, 26);
    c.fillStyle = 'rgba(232,220,195,0.7)'; c.font = 'bold 6px Arial';
    c.fillText('DOCK WINDOW', D.x + D.w / 2, D.y + 12);
    c.fillText('HIRING (EVENINGS) (BACKS)', D.x + D.w / 2, D.y + 58);

    // container stacks — the yard's skyline — and the pallet rows Gus knows by weight
    const CONT = [[2480, 1160, 130, 60, '#7a4a3a'], [2840, 1120, 150, 64, '#4a6a5a'], [3040, 1300, 130, 60, '#5a5a7a'], [2660, 1300, 110, 56, '#7a6a3a']];
    for (const [cx2, cy2, cw, chh, col] of CONT) {
      c.fillStyle = col; c.fillRect(cx2, cy2, cw, chh);
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(cx2, cy2, cw, 10);
      for (let rx = cx2 + 8; rx < cx2 + cw; rx += 14) { c.strokeStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.moveTo(rx, cy2 + 10); c.lineTo(rx, cy2 + chh); c.stroke(); }
      scatter(6, cx2, (rnd) => { c.fillStyle = 'rgba(122,64,40,0.5)'; c.fillRect(cx2 + rnd() * cw, cy2 + rnd() * chh, 4 + rnd() * 10, 2 + rnd() * 5); });
    }
    for (const [px, py] of WORKS.pallets) {
      c.fillStyle = '#7a6a4a'; c.fillRect(px - 22, py - 14, 44, 28);
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.strokeRect(px - 22, py - 14, 44, 28);
      for (let i = -1; i <= 1; i++) { c.strokeStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(px - 22, py + i * 8); c.lineTo(px + 22, py + i * 8); c.stroke(); }
      c.fillStyle = 'rgba(232,220,195,0.5)'; c.fillRect(px - 14, py - 20, 28, 6);   // shrink wrap glint
    }
    // BOXCARS on the spur, tagged by locals with names like STENCH and DEBRA
    for (const bx of WORKS.boxcars) {
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(bx - 6, RAIL_Y + 24, 232, 8);
      c.fillStyle = ['#6a4438', '#4a5568', '#5c5044'][WORKS.boxcars.indexOf(bx) % 3];
      c.fillRect(bx, RAIL_Y - 36, 220, 60);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(bx, RAIL_Y - 36, 220, 9);
      c.fillStyle = '#2a2724'; c.fillRect(bx + 88, RAIL_Y - 28, 44, 48);           // slider door
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.strokeRect(bx + 88, RAIL_Y - 28, 44, 48);
      c.fillStyle = ['rgba(214,90,160,0.55)', 'rgba(120,200,160,0.5)', 'rgba(230,200,90,0.5)'][WORKS.boxcars.indexOf(bx) % 3];
      c.font = 'bold 15px Impact, Arial'; c.textAlign = 'center';
      c.fillText(['STENCH', 'DEBRA', 'YOLO (crossed out)'][WORKS.boxcars.indexOf(bx) % 3], bx + 46, RAIL_Y + 2);
      c.fillStyle = 'rgba(232,220,195,0.35)'; c.font = '6px Arial';
      c.fillText('CASSIDY 4400 SERIES', bx + 170, RAIL_Y + 14);
    }
    // chain-link along the yard's west edge with the one hole everyone uses
    c.strokeStyle = 'rgba(160,160,168,0.45)'; c.lineWidth = 1.5;
    for (let fy = 1090; fy < 1460; fy += 10) { c.beginPath(); c.moveTo(2290, fy); c.lineTo(2300, fy + 10); c.stroke(); }
    c.strokeStyle = 'rgba(160,160,168,0.7)'; c.beginPath(); c.moveTo(2290, 1090); c.lineTo(2290, 1250); c.moveTo(2290, 1330); c.lineTo(2290, 1460); c.stroke();
    c.lineWidth = 1;   // the gap at 1250–1330: "maintenance access," per everyone

    // the far edge: where Hopewell simply stops
    c.save(); c.translate(WORLD.w - 60, 990); c.rotate(-0.03);
    c.fillStyle = '#2e4632'; c.fillRect(-120, -34, 150, 46);
    c.strokeStyle = 'rgba(232,220,195,0.5)'; c.strokeRect(-120, -34, 150, 46);
    c.fillStyle = '#e8dcc3'; c.font = 'bold 9px Arial'; c.textAlign = 'center';
    c.fillText('LEAVING HOPEWELL', -45, -18);
    c.font = 'italic 7px Georgia'; c.fillText('why though?', -45, -6);
    c.restore();
  }

  // ── HOPELESS TECH: a campus that is mostly parking ────────────────────────
  _paintCampus(c) {
    const B = HTCC.bounds, Q = HTCC.quad;
    // the grounds: institutional grass, mown by somebody paid to mow, not to care
    c.fillStyle = '#4a5a3e'; c.fillRect(B.x, B.y, B.w, B.h);
    scatter(280, 801, (rnd) => { c.fillStyle = rnd() < 0.5 ? '#516243' : '#44553a'; c.fillRect(B.x + rnd() * B.w, B.y + rnd() * B.h, 3, 2); });

    // THE QUAD: crossed paths, and the desire line straight across the middle that
    // the paths were supposed to prevent
    c.fillStyle = '#8a8578'; c.fillRect(Q.x, Q.y + Q.h * 0.45, Q.w, 26);
    c.fillRect(Q.x + Q.w * 0.42, Q.y, 26, Q.h);
    c.strokeStyle = 'rgba(30,26,22,0.20)'; c.lineWidth = 22; c.lineCap = 'round';
    c.beginPath(); c.moveTo(Q.x + 30, Q.y + Q.h - 20); c.lineTo(Q.x + Q.w - 40, Q.y + 30); c.stroke();
    c.lineCap = 'butt'; c.lineWidth = 1;
    // the fountain that has been off since a budget meeting
    c.fillStyle = '#7a7468'; c.beginPath(); c.ellipse(Q.x + Q.w * 0.5, Q.y + Q.h * 0.52, 44, 26, 0, 0, 7); c.fill();
    c.fillStyle = '#5f5a50'; c.beginPath(); c.ellipse(Q.x + Q.w * 0.5, Q.y + Q.h * 0.52, 34, 18, 0, 0, 7); c.fill();
    scatter(20, 802, (rnd) => { c.fillStyle = rnd() < 0.5 ? '#57604a' : '#6b5d43'; c.fillRect(Q.x + Q.w * 0.5 - 30 + rnd() * 60, Q.y + Q.h * 0.52 - 14 + rnd() * 28, 3, 3); });
    c.fillStyle = 'rgba(232,220,195,0.5)'; c.font = 'bold 7px Georgia'; c.textAlign = 'center';
    c.fillText('CLASS OF 1994 MEMORIAL FOUNTAIN', Q.x + Q.w * 0.5, Q.y + Q.h * 0.52 + 40);
    c.fillStyle = 'rgba(232,220,195,0.3)'; c.font = 'italic 6px Georgia';
    c.fillText('(dry since the ’09 budget)', Q.x + Q.w * 0.5, Q.y + Q.h * 0.52 + 49);

    // the commuter lot — because everybody here commutes, and it's still gravel
    const L = HTCC.lot;
    c.fillStyle = '#5f5a52'; c.fillRect(L.x, L.y, L.w, L.h);
    scatter(140, 803, (rnd) => { c.fillStyle = `rgba(${130 + rnd() * 50 | 0},${124 + rnd() * 44 | 0},${112 + rnd() * 38 | 0},0.45)`; c.fillRect(L.x + rnd() * L.w, L.y + rnd() * L.h, 2, 2); });
    for (let i = 0; i < 3; i++) this._paintCar(c, { x: L.x + 16, y: L.y + 14 + i * 46, w: 90, h: 34 });

    // BUILDINGS
    for (const b of HTCC.buildings) {
      const donated = b.donated;
      c.fillStyle = 'rgba(20,24,20,0.26)'; c.fillRect(b.x + 8, b.y + 10, b.w, b.h);
      // the donated building is GLASS AND STONE and matches nothing else here
      c.fillStyle = donated ? '#c8ccd2' : '#9a8f7e';
      c.fillRect(b.x, b.y, b.w, b.h);
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(b.x, b.y, b.w, 12);
      if (donated) {
        c.fillStyle = 'rgba(150,190,215,0.5)'; c.fillRect(b.x + 12, b.y + 24, b.w - 24, b.h - 60);
        for (let mx = b.x + 12; mx < b.x + b.w - 12; mx += 32) { c.strokeStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(mx, b.y + 24); c.lineTo(mx, b.y + b.h - 36); c.stroke(); }
      } else {
        scatter(26, b.x, (rnd) => { c.fillStyle = `rgba(30,26,22,${0.06 + rnd() * 0.12})`; c.fillRect(b.x + rnd() * b.w, b.y + 16 + rnd() * (b.h - 30), 14 + rnd() * 40, 5 + rnd() * 12); });
        for (let wx = b.x + 18; wx < b.x + b.w - 30; wx += 46) {          // institutional window grid
          c.fillStyle = 'rgba(40,55,68,0.75)'; c.fillRect(wx, b.y + 34, 28, 30);
          c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(wx, b.y + 34, 28, 8);
        }
      }
      // door
      c.fillStyle = '#2f2a26'; c.fillRect(b.door.x - 18, b.y + b.h - 26, 36, 26);
      c.fillStyle = '#c9a227'; c.fillRect(b.door.x + 9, b.y + b.h - 15, 3, 5);
      // the metal detector, drawn at the door, because it is the campus's whole rule
      if (['admin', 'shop', 'library'].includes(b.key)) {
        c.fillStyle = '#8a8f96'; c.fillRect(b.door.x - 24, b.y + b.h, 5, 20); c.fillRect(b.door.x + 19, b.y + b.h, 5, 20);
        c.fillStyle = '#5a6068'; c.fillRect(b.door.x - 24, b.y + b.h, 48, 4);
        c.fillStyle = 'rgba(200,60,50,0.7)'; c.fillRect(b.door.x - 2, b.y + b.h + 2, 4, 3);
      }
      // signage
      c.textAlign = 'center';
      c.fillStyle = donated ? '#3a4048' : 'rgba(232,220,195,0.8)';
      c.font = 'bold 10px Georgia';
      c.fillText(b.name.replace(/^the /, '').toUpperCase(), b.x + b.w / 2, b.y + 24);
      // …and the admin clock, stopped at 4:20 since 2011 and now a tradition
      if (b.clock) {
        const cx = b.x + b.w / 2, cy = b.y + b.h - 58;
        c.fillStyle = '#e8dcc3'; c.beginPath(); c.arc(cx, cy, 17, 0, 7); c.fill();
        c.strokeStyle = '#5a5044'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, 17, 0, 7); c.stroke();
        c.strokeStyle = '#2a2622'; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx - 9, cy - 5); c.stroke();     // 4-ish
        c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 4, cy + 11); c.stroke();    // …20
        c.lineWidth = 1;
        c.fillStyle = 'rgba(232,220,195,0.55)'; c.font = 'italic 6px Georgia';
        c.fillText('stopped 2011 · nobody has asked', cx, cy + 30);
      }
      if (donated) {
        c.fillStyle = '#3a4048'; c.font = '600 7px "Segoe UI", Arial';
        c.fillText('THE BARROWS CENTER FOR APPLIED LEARNING', b.x + b.w / 2, b.y + 38);
        c.fillStyle = 'rgba(58,64,72,0.55)'; c.font = 'italic 6px Georgia';
        c.fillText('gift of D. Barrows ’78 — current address sealed', b.x + b.w / 2, b.y + b.h - 12);
      }
      if (b.key === 'gym') {   // 0–11, and the banner still goes up
        c.fillStyle = '#7a3a2e'; c.fillRect(b.x + 22, b.y + 76, b.w - 44, 20);
        c.fillStyle = '#e8dcc3'; c.font = 'bold 8px Impact, Arial';
        c.fillText('GO PRAIRIE DOGS', b.x + b.w / 2, b.y + 90);
        c.fillStyle = 'rgba(232,220,195,0.4)'; c.font = '6px Arial';
        c.fillText('0–11 · WAIT TILL NEXT YEAR (est. 1961)', b.x + b.w / 2, b.y + 106);
      }
    }

    // THE SIGN at the campus entrance, with the name nobody uses
    c.save(); c.translate(B.x + 60, B.y + B.h - 40); c.rotate(-0.02);
    c.fillStyle = '#5a4a38'; c.fillRect(-6, -4, 200, 8);
    c.fillStyle = '#e8e4dc'; c.fillRect(0, -44, 188, 42);
    c.strokeStyle = '#8a7a62'; c.strokeRect(0, -44, 188, 42);
    c.fillStyle = '#3a4a38'; c.font = 'bold 11px Georgia'; c.textAlign = 'center';
    c.fillText('HOPEWELL TECH', 94, -28);
    c.fillStyle = 'rgba(58,74,56,0.75)'; c.font = '6.5px Georgia';
    c.fillText('TECHNICAL & COMMUNITY COLLEGE', 94, -18);
    c.fillStyle = 'rgba(58,74,56,0.45)'; c.font = 'italic 6px Georgia';
    c.fillText('"YOUR FUTURE STARTS HERE" · est. 1961', 94, -8);
    c.restore();
    // somebody has, inevitably, corrected the sign
    c.save(); c.translate(B.x + 154, B.y + B.h - 66); c.rotate(-0.06);
    c.fillStyle = 'rgba(200,60,50,0.55)'; c.font = 'bold 13px Georgia'; c.textAlign = 'center';
    c.fillText('HOPELESS', 0, 0); c.restore();
  }

  // ── THE BLUFFS: lake money, and the only lawns in the county ──────────────
  _paintBluffs(c) {
    const W = WORLD.w, B = BLUFFS;
    // the good grass. Irrigated, striped, and greener than anything downtown.
    c.fillStyle = '#4e6b41'; c.fillRect(0, B.gateY - 40, W, WORLD.h - B.gateY + 40);
    for (let sx = 0; sx < W; sx += 90) {                       // mower stripes — the tell of money
      c.fillStyle = 'rgba(255,255,255,0.028)'; c.fillRect(sx, B.gateY - 40, 45, WORLD.h - B.gateY + 40);
    }
    scatter(300, 701, (rnd) => { c.fillStyle = rnd() < 0.5 ? '#557345' : '#48633c'; c.fillRect(rnd() * W, B.gateY + rnd() * 500, 3, 2); });

    // THE GATE: brick piers, a decorative arm, and a sign that means nothing
    c.fillStyle = '#7a5a4a'; c.fillRect(1000, B.gateY - 26, 26, 52); c.fillRect(1180, B.gateY - 26, 26, 52);
    c.fillStyle = '#8a6a58'; c.fillRect(998, B.gateY - 32, 30, 8); c.fillRect(1178, B.gateY - 32, 30, 8);
    c.save(); c.translate(1030, B.gateY); c.rotate(-0.04);
    c.fillStyle = '#e8e4dc'; c.fillRect(0, -3, 146, 6);
    c.fillStyle = '#c9302a'; for (let i = 0; i < 4; i++) c.fillRect(6 + i * 36, -3, 16, 6);
    c.restore();
    c.fillStyle = '#2e4632'; c.fillRect(1044, B.gateY - 78, 120, 40);
    c.strokeStyle = '#c9a227'; c.strokeRect(1044, B.gateY - 78, 120, 40);
    c.fillStyle = '#e8dcc3'; c.font = 'bold 9px Georgia'; c.textAlign = 'center';
    c.fillText('THE BLUFFS', 1104, B.gateY - 62);
    c.font = '6px Georgia'; c.fillStyle = 'rgba(232,220,195,0.7)';
    c.fillText('PRIVATE COMMUNITY', 1104, B.gateY - 52);
    c.fillText('RESIDENTS & GUESTS ONLY', 1104, B.gateY - 44);

    // the lake road: newer, blacker, and swept
    c.fillStyle = '#3a3a3c'; c.fillRect(0, B.roadY - 34, W, 68);
    c.strokeStyle = 'rgba(240,240,235,0.34)'; c.lineWidth = 3; c.setLineDash([30, 24]);
    c.beginPath(); c.moveTo(0, B.roadY); c.lineTo(W, B.roadY); c.stroke(); c.setLineDash([]); c.lineWidth = 1;

    // THE LAKE — the reason for all of it
    const lg = c.createLinearGradient(0, B.lakeY, 0, WORLD.h);
    lg.addColorStop(0, '#3f5f74'); lg.addColorStop(1, '#2b4658');
    c.fillStyle = lg; c.fillRect(0, B.lakeY, W, WORLD.h - B.lakeY);
    c.fillStyle = '#c9b28a'; c.fillRect(0, B.lakeY - 16, W, 18);        // the shoreline
    scatter(200, 702, (rnd) => { c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(rnd() * W, B.lakeY + 10 + rnd() * 150, 10 + rnd() * 26, 1.5); });
    scatter(60, 703, (rnd) => { c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(rnd() * W, B.lakeY + 40 + rnd() * 140, 30 + rnd() * 60, 2); });
    // docks + boats under covers, which is most of what a boat does
    for (const dx of B.docks) {
      c.fillStyle = '#8a7458'; c.fillRect(dx - 9, B.lakeY - 6, 18, 96);
      for (let py = B.lakeY + 6; py < B.lakeY + 90; py += 16) { c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(dx - 9, py, 18, 3); }
      c.fillStyle = '#6a6a72'; c.fillRect(dx + 12, B.lakeY + 28, 54, 22);
      c.fillStyle = '#e8e4dc'; c.beginPath(); c.moveTo(dx + 12, B.lakeY + 28); c.lineTo(dx + 66, B.lakeY + 30); c.lineTo(dx + 40, B.lakeY + 18); c.fill();
      c.fillStyle = 'rgba(20,30,40,0.35)'; c.fillRect(dx + 12, B.lakeY + 50, 54, 5);
    }

    // THE HOUSES. Every tell in the design is PAINTED — you can read a house from
    // the road without a menu, which is the entire skill of the burglary system.
    const g = this.g;
    for (const h of BLUFFS.houses) {
      const st = g.houseState ? g.houseState(h.key) : null;
      // lawn pad + drive
      c.fillStyle = '#46603a'; c.fillRect(h.x - 26, h.y - 20, h.w + 52, h.h + 76);
      c.fillStyle = '#8a8880'; c.fillRect(h.x + h.w * 0.5 - 26, h.y + h.h, 52, 78);   // driveway to the road
      // the body: big, pale, and expensively boring
      const wall = h.daHouse ? '#e2ddd2' : ['#d8d2c4', '#cfc8ba', '#dcd6c8'][BLUFFS.houses.indexOf(h) % 3];
      c.fillStyle = 'rgba(20,24,20,0.28)'; c.fillRect(h.x + 8, h.y + 10, h.w, h.h);   // it casts a real shadow
      c.fillStyle = wall; c.fillRect(h.x, h.y, h.w, h.h);
      c.fillStyle = 'rgba(0,0,0,0.20)'; c.fillRect(h.x, h.y, h.w, 12);
      c.fillStyle = '#5a4a42'; c.fillRect(h.x - 6, h.y - 8, h.w + 12, 16);            // the deep eave
      // lake-facing glass wall, because the whole house is an argument for the view
      c.fillStyle = st && st.occupied ? 'rgba(255,214,150,0.42)' : 'rgba(120,150,175,0.30)';
      c.fillRect(h.x + 14, h.y + h.h - 54, h.w - 28, 40);
      for (let mx = h.x + 14; mx < h.x + h.w - 14; mx += 34) { c.strokeStyle = 'rgba(60,60,60,0.35)'; c.beginPath(); c.moveTo(mx, h.y + h.h - 54); c.lineTo(mx, h.y + h.h - 14); c.stroke(); }
      // door
      c.fillStyle = '#4a3a30'; c.fillRect(h.x + h.w * 0.5 - 15, h.y + h.h - 30, 30, 30);
      c.fillStyle = '#c9a227'; c.fillRect(h.x + h.w * 0.5 + 8, h.y + h.h - 18, 3, 5);
      if (!st) continue;
      // ── THE TELLS ──
      if (st.car) {                                   // a car in the drive
        c.fillStyle = '#2e3a44'; c.beginPath(); c.roundRect(h.x + h.w * 0.5 - 22, h.y + h.h + 14, 44, 56, 7); c.fill();
        c.fillStyle = 'rgba(20,26,34,0.85)'; c.fillRect(h.x + h.w * 0.5 - 15, h.y + h.h + 24, 30, 32);
      }
      if (st.sign) {                                  // the alarm sign — which LIES 40% of the time
        c.fillStyle = '#7a7a80'; c.fillRect(h.x + 18, h.y + h.h + 26, 2, 16);
        c.fillStyle = '#2e4a7a'; c.fillRect(h.x + 12, h.y + h.h + 16, 15, 11);
        c.fillStyle = '#e8dcc3'; c.font = 'bold 3.5px Arial'; c.textAlign = 'center';
        c.fillText('ARMED', h.x + 19.5, h.y + h.h + 22);
        c.fillText('RESPONSE', h.x + 19.5, h.y + h.h + 26);
      }
      if (st.packages) {                              // days of mail = days of nobody
        for (let i = 0; i < 3; i++) { c.fillStyle = ['#b8a488', '#c8b898', '#a89878'][i]; c.fillRect(h.x + h.w * 0.5 + 20 + i * 9, h.y + h.h - 12 + i * 3, 12, 9); }
      }
      if (st.sprinklers) {                            // watering at the wrong hour, unwatched
        c.fillStyle = 'rgba(180,220,255,0.30)';
        for (let i = 0; i < 5; i++) { const a = -0.4 - i * 0.32; c.beginPath(); c.ellipse(h.x - 14 + Math.cos(a) * 24, h.y + h.h + 44 + Math.sin(a) * 12, 8, 3, a, 0, 7); c.fill(); }
      }
      if (st.openWindow) {                            // the lake window, cracked for the breeze
        c.fillStyle = 'rgba(30,40,50,0.75)'; c.fillRect(h.x + h.w - 46, h.y + h.h - 52, 26, 12);
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.strokeRect(h.x + h.w - 46, h.y + h.h - 52, 26, 12);
      }
      if (st.done) {                                  // you already did this one
        c.fillStyle = 'rgba(255,240,200,0.10)'; c.fillRect(h.x, h.y, h.w, h.h);
        c.fillStyle = 'rgba(200,60,50,0.5)'; c.font = 'bold 8px Arial'; c.textAlign = 'center';
        c.fillText('(you already did this one)', h.x + h.w / 2, h.y - 16);
      }
      // the name plate, tasteful, on a rock
      c.fillStyle = '#6a6258'; c.beginPath(); c.ellipse(h.x - 16, h.y + h.h + 54, 18, 11, 0.15, 0, 7); c.fill();
      c.fillStyle = 'rgba(232,220,195,0.75)'; c.font = 'italic 6px Georgia'; c.textAlign = 'center';
      c.fillText(h.daHouse ? 'WHITCOMB' : h.name.replace(/^the /, '').replace(/ (place|house)$/, '').toUpperCase(), h.x - 16, h.y + h.h + 56);
    }

    // THE COUNTRY CLUB — where the caseload goes to die
    const K = BLUFFS.club;
    c.fillStyle = 'rgba(20,24,20,0.28)'; c.fillRect(K.x + 10, K.y + 12, K.w, K.h);
    c.fillStyle = '#e6e0d2'; c.fillRect(K.x, K.y, K.w, K.h);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(K.x, K.y, K.w, 14);
    c.fillStyle = '#5a6a52'; c.fillRect(K.x - 8, K.y - 10, K.w + 16, 18);            // green awning roof
    for (let i = 0; i < 6; i++) { c.fillStyle = '#d8d2c4'; c.fillRect(K.x + 30 + i * 58, K.y + K.h, 14, 26); }  // columns to the patio
    c.fillStyle = '#c9b28a'; c.fillRect(K.x + 10, K.y + K.h + 26, K.w - 20, 40);     // the patio
    for (let i = 0; i < 4; i++) {                                                     // umbrella tables
      c.fillStyle = '#2e4632'; c.beginPath(); c.arc(K.x + 50 + i * 90, K.y + K.h + 44, 13, 0, 7); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.arc(K.x + 50 + i * 90, K.y + K.h + 48, 9, 0, 7); c.fill();
    }
    c.fillStyle = '#2e4632'; c.font = 'bold 13px Georgia'; c.textAlign = 'center';
    c.fillText('HOPEWELL LAKE CLUB', K.x + K.w / 2, K.y + 44);
    c.font = 'italic 7px Georgia'; c.fillStyle = 'rgba(46,70,50,0.7)';
    c.fillText('est. 1961 · members & guests · "a tradition of tradition"', K.x + K.w / 2, K.y + 58);
    // the practice green, with one flag
    c.fillStyle = '#5e7d4a'; c.beginPath(); c.ellipse(K.x + K.w + 190, K.y + 120, 150, 70, 0, 0, 7); c.fill();
    c.fillStyle = '#8a8578'; c.fillRect(K.x + K.w + 188, K.y + 74, 3, 48);
    c.fillStyle = '#c9302a'; c.fillRect(K.x + K.w + 191, K.y + 74, 20, 12);
  }

  _paintProp(c, p) {
    if (p.kind === 'pumps') {
      c.fillStyle = '#55524c'; c.fillRect(p.x, p.y, p.w, p.h);
      c.fillStyle = PAL.cream; c.fillRect(p.x + 20, p.y + 18, 26, 40); c.fillRect(p.x + p.w - 46, p.y + 18, 26, 40);
      c.fillStyle = PAL.red; c.fillRect(p.x + 20, p.y + 18, 26, 10); c.fillRect(p.x + p.w - 46, p.y + 18, 26, 10);
      c.fillStyle = 'rgba(20,18,22,0.4)'; c.beginPath(); c.ellipse(p.x + p.w / 2, p.y + p.h / 2, 46, 16, 0, 0, 7); c.fill();
    }
    if (p.kind === 'dumpster') {
      c.fillStyle = '#3d5a44'; c.fillRect(p.x, p.y, p.w, p.h);
      c.fillStyle = '#324a38'; c.fillRect(p.x, p.y, p.w, 12);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(p.x - 6, p.y + p.h, p.w + 12, 6);
      scatter(6, p.x, (rnd) => { c.fillStyle = 'rgba(220,210,190,0.5)'; c.fillRect(p.x + rnd() * p.w, p.y - 4, 5 + rnd() * 8, 4); });
    }
    if (p.kind === 'crateStack') { c.fillStyle = '#7a6a4a'; c.fillRect(p.x, p.y, 18, 18); c.fillRect(p.x + 20, p.y + 4, 16, 14); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.strokeRect(p.x, p.y, 18, 18); }
    if (p.kind === 'carRow' || p.kind === 'yourCar') this._paintCar(c, p);
    if (p.kind === 'busShelter') {
      c.fillStyle = 'rgba(140,160,170,0.25)'; c.fillRect(p.x, p.y, p.w, p.h);
      c.strokeStyle = '#7a8288'; c.strokeRect(p.x, p.y, p.w, p.h);
      c.fillStyle = '#7a8288'; c.fillRect(p.x, p.y, p.w, 6);
      c.fillStyle = '#c9b28a'; c.fillRect(p.x + p.w - 18, p.y - 26, 4, 26);
      c.fillStyle = '#3a6ea8'; c.fillRect(p.x + p.w - 26, p.y - 34, 20, 12);
      c.fillStyle = '#fff'; c.font = 'bold 7px Arial'; c.textAlign = 'center'; c.fillText('BUS', p.x + p.w - 16, p.y - 25);
    }
    if (p.kind === 'kiddiePool') {
      c.fillStyle = '#4a90b8'; c.beginPath(); c.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, 7); c.fill();
      c.strokeStyle = '#88b8d0'; c.lineWidth = 3; c.stroke(); c.lineWidth = 1;
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.ellipse(p.x + p.w / 2 - 8, p.y + p.h / 2 - 4, 14, 5, 0, 0, 7); c.fill();
    }
    if (p.kind === 'dogRun') {
      c.fillStyle = PAL.dirt; c.beginPath(); c.ellipse(p.x + 40, p.y + 40, 46, 26, 0, 0, 7); c.fill();
      c.fillStyle = '#8a5a33'; c.fillRect(p.x + 60, p.y - 6, 34, 26); // doghouse
      c.fillStyle = '#6e4626'; c.fillRect(p.x + 60, p.y - 12, 34, 8);
      c.fillStyle = '#1e1c1a'; c.fillRect(p.x + 70, p.y + 4, 14, 16);
    }
    if (p.kind === 'phonePole') {
      c.fillStyle = '#4a4038'; c.fillRect(p.x - 3, p.y - 60, 6, 60);
      c.strokeStyle = 'rgba(30,28,26,0.5)'; c.beginPath(); c.moveTo(p.x, p.y - 56); c.lineTo(p.x + 320, p.y - 66); c.stroke();
      c.fillStyle = 'rgba(240,230,200,0.6)'; c.fillRect(p.x - 6, p.y - 40, 12, 9); // staple-gunned flyer
    }
    if (p.kind === 'lampPost') {
      c.fillStyle = '#3a3e44'; c.fillRect(p.x - 2.5, p.y - 70, 5, 70);
      c.fillStyle = p.dead ? '#2a2e33' : '#d8cba0'; c.beginPath(); c.arc(p.x, p.y - 72, 6, 0, 7); c.fill();
    }
    if (p.kind === 'hydrant') { c.fillStyle = PAL.red; c.fillRect(p.x - 5, p.y - 12, 10, 12); c.fillRect(p.x - 8, p.y - 8, 16, 4); c.fillStyle = '#7a2e22'; c.fillRect(p.x - 5, p.y - 14, 10, 3); }
    if (p.kind === 'bench') {
      c.fillStyle = '#6e5a3a'; c.fillRect(p.x, p.y, p.w, 8); c.fillRect(p.x, p.y + 12, p.w, 6);
      c.fillStyle = 'rgba(200,60,50,0.6)'; c.font = 'bold 6px Arial'; c.textAlign = 'center';
      c.fillText('HOPEWELL REALTY — CALL BIG DON', p.x + p.w / 2, p.y + 6);
    }
    if (p.kind === 'cone') { c.fillStyle = '#d97a2a'; c.beginPath(); c.moveTo(p.x, p.y - 14); c.lineTo(p.x - 6, p.y); c.lineTo(p.x + 6, p.y); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(p.x - 4, p.y - 8, 8, 3); }
  }

  _paintCar(c, p) {
    const w = p.w || 110, h = p.h || 60;
    const yours = p.kind === 'yourCar';
    const cols = ['#5b7291', '#8a5a33', '#4c5741', '#7a7468', '#9c3d2e'];
    const col = yours ? '#7a4a3a' : cols[(p.x / 80 | 0) % cols.length];
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(p.x + w / 2, p.y + h / 2 + 6, w / 2 + 4, h / 2, 0, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.roundRect(p.x, p.y, w, h, 10); c.fill();
    c.fillStyle = 'rgba(20,26,34,0.85)'; c.beginPath(); c.roundRect(p.x + 16, p.y + 8, w - 32, h - 16, 6); c.fill();
    c.fillStyle = col; c.beginPath(); c.roundRect(p.x + 30, p.y + 12, w - 60, h - 24, 4); c.fill();
    if (yours) { // rust, mismatched door, zip-tied bumper
      c.fillStyle = 'rgba(122,74,42,0.8)'; c.fillRect(p.x + 4, p.y + h - 12, 22, 8);
      c.fillStyle = '#4c5741'; c.fillRect(p.x + w - 26, p.y + 4, 18, 14);
      scatter(8, p.x, (rnd) => { c.fillStyle = 'rgba(90,50,30,0.6)'; c.beginPath(); c.arc(p.x + rnd() * w, p.y + rnd() * h, 1.5 + rnd() * 2, 0, 7); c.fill(); });
    }
  }

  _paintInterior(c, room, it) {
    // floor by room
    const floors = { wingbarn: '#8a6a4a', gamebarn: '#5a5147', qwikstop: '#7a7468', buffet: '#6e4a3a', hardware: '#6b5d43', cashking: '#5a564f', garage: '#55524c' };
    c.fillStyle = floors[room] || '#6e6a63'; c.fillRect(0, 0, it.w, it.h);
    // checker tiles for wingbarn/qwikstop, scuffed
    if (room === 'wingbarn' || room === 'qwikstop') {
      for (let x = 0; x < it.w; x += 40) for (let y = 0; y < it.h; y += 40)
        if ((x + y) % 80 === 0) { c.fillStyle = 'rgba(232,220,195,0.16)'; c.fillRect(x, y, 40, 40); }
    }
    scatter(50, room.length * 7, (rnd) => { c.fillStyle = `rgba(20,18,16,${0.06 + rnd() * 0.14})`; c.fillRect(rnd() * it.w, rnd() * it.h, 8 + rnd() * 40, 4 + rnd() * 12); });
    // the worn path from door to counter — thousands of feet
    c.strokeStyle = 'rgba(30,26,22,0.22)'; c.lineWidth = 34; c.lineCap = 'round';
    c.beginPath(); c.moveTo(it.w / 2, it.h - 30);
    c.quadraticCurveTo(it.w / 2, it.h / 2, it.counter ? it.counter.x + it.counter.w / 2 : it.w / 2, it.counter ? it.counter.y + it.counter.h + 20 : 60);
    c.stroke(); c.lineCap = 'butt'; c.lineWidth = 1;
    // walls
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, 0, it.w, 14); c.fillRect(0, 0, 10, it.h); c.fillRect(it.w - 10, 0, 10, it.h);
    // counter
    if (it.counter) {
      const k = it.counter;
      c.fillStyle = '#6e5a3a'; c.fillRect(k.x, k.y, k.w, k.h);
      c.fillStyle = 'rgba(255,240,210,0.12)'; c.fillRect(k.x, k.y, k.w, 8); // polished by elbows
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(k.x, k.y + k.h, k.w, 6);
    }
    // room dressing
    const F = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.strokeRect(x, y, w, h); };
    if (room === 'wingbarn') {
      F(80, 40, 300, 40, '#3a3632');                       // menu board
      c.fillStyle = '#ffb347'; c.font = 'bold 10px Arial'; c.textAlign = 'left';
      c.fillText('WING BARN — HOME OF THE BARNSTORMER', 92, 64);
      F(560, 40, 120, 70, '#8a8276');                      // fryers
      c.fillStyle = 'rgba(255,200,80,0.3)'; c.fillRect(566, 46, 108, 12);
      F(480, 220, 180, 60, '#7a4a3a'); F(480, 320, 180, 60, '#7a4a3a'); // booths
      F(40, 300, 30, 40, '#a8a49c');                       // mop bucket
      c.fillStyle = 'rgba(240,230,200,0.85)';              // the note wall
      for (let i = 0; i < 5; i++) c.fillRect(400 + i * 26, 44 + (i % 2) * 8, 20, 24);
      c.fillStyle = '#2a2a2a'; c.font = '5px Arial';
      c.fillText('CLEAN AS YOU GO!!', 402, 56); c.fillText('DO NOT sell the', 428, 62); c.fillText('display wings', 428, 68);
      c.fillText('WE ARE A FAMILY', 454, 58);
      // camera in the corner — the blind spot is real and it matters
      c.fillStyle = '#2a2e33'; c.beginPath(); c.arc(30, 30, 8, 0, 7); c.fill();
    }
    if (room === 'gamebarn') {
      F(300, 220, 24, 140, '#5b7291'); F(460, 250, 24, 110, '#5b7291'); // shelves
      scatter(30, 5, (rnd) => { c.fillStyle = ['#9c3d2e', '#4c72a8', '#c9a227', '#4c5741'][Math.floor(rnd() * 4)]; c.fillRect(302 + (rnd() < 0.5 ? 0 : 160) + rnd() * 16, 224 + rnd() * 130, 14, 4); });
      F(420, 130, 220, 60, '#6e5a3a');                     // glass case counter
      c.fillStyle = 'rgba(180,210,230,0.25)'; c.fillRect(426, 136, 208, 20);
      F(40, 60, 220, 140, '#4a4440');                      // THE BACK ROOM
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(40, 60, 220, 140);
      for (let i = 0; i < 3; i++) { F(60 + i * 64, 120, 48, 40, '#7a6a4a'); c.fillStyle = 'rgba(0,0,0,0.4)'; c.font = 'bold 7px Arial'; c.fillText('FUNSTATION', 62 + i * 64, 142); }
      c.fillStyle = 'rgba(240,230,200,0.6)'; c.font = '8px Georgia'; c.fillText('BACK ROOM — GARY ONLY. THIS MEANS YOU, PEANUT.', 46, 76);
      F(560, 40, 120, 80, '#3a3632');                      // CRT stack
      c.fillStyle = 'rgba(120,180,160,0.3)'; c.fillRect(570, 50, 40, 30); c.fillRect(620, 50, 40, 30); c.fillRect(570, 90, 40, 24);
    }
    if (room === 'qwikstop') {
      F(20, 200, 100, 160, '#3a5a6a'); c.fillStyle = 'rgba(140,200,230,0.25)'; c.fillRect(26, 206, 88, 148); // cooler
      c.fillStyle = '#c9302a'; c.font = 'bold 9px Arial'; c.textAlign = 'left';
      for (let i = 0; i < 4; i++) { c.fillRect(160 + i * 20, 220, 14, 26); } // RIP rack
      c.fillStyle = '#e8dcc3'; c.fillText('RIP — ORIGINAL SCREAM $6', 150, 264);
      F(300, 210, 90, 60, '#8a6a4a'); c.fillStyle = '#5a3a22'; c.fillText('JERKY', 316, 244); // jerky rack
      F(420, 40, 180, 50, '#c9a227'); c.fillStyle = '#2a2a2a'; c.font = 'bold 11px Arial'; c.fillText('LOTTO — SOMEBODY HAS TO', 430, 68);
    }
    if (room === 'buffet') {
      F(340, 90, 280, 54, '#8a8276'); // steam table
      for (let i = 0; i < 6; i++) { c.fillStyle = ['#b87a3a', '#8a6a2a', '#a84a3a', '#6a8a4a', '#c9a227', '#7a5a3a'][i]; c.fillRect(348 + i * 44, 98, 36, 38); }
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(340, 84, 280, 8); // sneeze guard, historic
      F(120, 250, 160, 60, '#7a4a3a'); // booth
      F(600, 200, 70, 120, '#2e4632'); c.fillStyle = 'rgba(120,200,180,0.3)'; c.fillRect(606, 206, 58, 108); // fish tank
      c.fillStyle = '#e0b84a'; c.beginPath(); c.arc(630, 250, 4, 0, 7); c.fill(); // the one fish
      F(40, 60, 60, 50, '#8a3d34'); c.fillStyle = '#ffd23e'; c.font = '8px Georgia'; c.fillText('shrine', 52, 88);
    }
    if (room === 'hardware') {
      F(20, 200, 140, 160, '#6e5a3a'); // tool wall
      scatter(16, 9, (rnd) => { c.fillStyle = '#3a3632'; c.fillRect(26 + rnd() * 120, 206 + rnd() * 140, 4 + rnd() * 10, 12); });
      F(200, 220, 240, 40, '#8a6a4a'); // lumber
      F(480, 220, 60, 60, '#7a7468'); // key machine
      c.fillStyle = 'rgba(214,80,60,0.7)'; c.font = 'bold 12px Arial'; c.fillText('EVERYTHING MUST GO', 200, 70);
      c.fillStyle = 'rgba(214,80,60,0.4)'; c.font = '8px Arial'; c.fillText('(since 2019)', 290, 84);
    }
    if (room === 'cashking') {
      c.fillStyle = 'rgba(180,200,215,0.30)'; c.fillRect(it.counter.x, it.counter.y - 60, it.counter.w, 60); // the glass
      c.strokeStyle = 'rgba(230,240,250,0.5)'; c.strokeRect(it.counter.x, it.counter.y - 60, it.counter.w, 60);
      c.fillStyle = '#ffd23e'; c.font = 'bold 10px Arial';
      c.fillText('WINDOW 1 — CHECKS • LOANS', it.counter.x + 20, it.counter.y - 30);
      c.fillText('WINDOW 2 — "GOODS"', it.counter.x + 260, it.counter.y - 30);
      F(120, 280, 60, 40, '#7a4a3a'); F(200, 280, 60, 40, '#7a4a3a'); // sad chairs
      c.fillStyle = 'rgba(232,220,195,0.5)'; c.font = '7px Arial';
      c.fillText('NO we will NOT "just look at" your ring through the glass', 130, 350);
    }
    if (room === 'foxhole') {
      const st = it.stage;
      // carpet that has absorbed four decades and will not be discussing it
      c.fillStyle = '#3a2630'; c.fillRect(0, 0, it.w, it.h);
      scatter(160, 421, (rnd) => {
        c.fillStyle = `rgba(${20 + rnd() * 30 | 0},14,${24 + rnd() * 20 | 0},${0.3 + rnd() * 0.4})`;
        c.fillRect(rnd() * it.w, rnd() * it.h, 8 + rnd() * 30, 4 + rnd() * 10);
      });
      // the stage: raised, lit, mirrored at the back, one pole
      c.fillStyle = '#5a3a48'; c.fillRect(st.x - 6, st.y - 6, st.w + 12, st.h + 12);
      c.fillStyle = '#6e4658'; c.fillRect(st.x, st.y, st.w, st.h);
      c.fillStyle = 'rgba(255,220,235,0.10)'; c.fillRect(st.x, st.y, st.w, 10);
      c.fillStyle = 'rgba(160,190,220,0.16)'; c.fillRect(st.x, st.y - 6, st.w, 6);   // mirror strip
      c.strokeStyle = '#c8c2b4'; c.lineWidth = 4;                                     // the pole
      c.beginPath(); c.moveTo(st.x + st.w * 0.42, st.y + 8); c.lineTo(st.x + st.w * 0.42, st.y + st.h - 6); c.stroke();
      c.lineWidth = 1;
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(st.x + st.w * 0.42 - 1, st.y + 8, 1.5, st.h - 14);
      // tip rail + the chairs pulled right up to it
      c.fillStyle = '#4a3a2e'; c.fillRect(st.x - 10, st.y + st.h + 12, st.w + 20, 7);
      for (let i = 0; i < 5; i++) { c.fillStyle = '#3a2e2a'; c.fillRect(st.x - 4 + i * 56, st.y + st.h + 24, 26, 22); }
      // bar, bottles, the ATM that funds the whole economy
      const k = it.counter;
      c.fillStyle = '#3e2a26'; c.fillRect(k.x, k.y, k.w, k.h);
      c.fillStyle = 'rgba(255,200,180,0.10)'; c.fillRect(k.x, k.y, k.w, 7);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(k.x, k.y + k.h, k.w, 6);
      c.fillStyle = 'rgba(120,150,170,0.30)'; c.fillRect(k.x + 8, k.y - 44, k.w - 16, 40);   // back-bar mirror
      for (let i = 0; i < 11; i++) {
        c.fillStyle = ['#7a5a2a', '#5a7a4a', '#8a4a3a', '#3a5a7a'][i % 4];
        c.fillRect(k.x + 16 + i * 20, k.y - 34, 7, 22);
      }
      c.fillStyle = '#2e3a4a'; c.fillRect(700, 250, 40, 60);                                  // ATM
      c.fillStyle = '#7ac080'; c.fillRect(706, 258, 28, 14);
      c.fillStyle = '#e8dcc3'; c.font = 'bold 6px Arial'; c.textAlign = 'center';
      c.fillText('ATM', 720, 290); c.fillText('$4.50 FEE', 720, 298);
      // DJ booth, blessedly small
      c.fillStyle = '#2a2630'; c.fillRect(40, 40, 90, 46);
      c.fillStyle = '#c04a7a'; c.fillRect(46, 46, 30, 8); c.fillRect(46, 60, 40, 6);
      c.fillStyle = 'rgba(232,220,195,0.5)'; c.font = '6px Arial'; c.textAlign = 'left';
      c.fillText('TIP THE DJ', 46, 78);
      // booths along the wall, and the sign nobody reads
      c.fillStyle = '#4a2e3a'; c.fillRect(470, 250, 150, 46); c.fillRect(90, 320, 130, 44);
      c.fillStyle = 'rgba(232,220,195,0.42)'; c.font = 'bold 7px Arial'; c.textAlign = 'center';
      c.fillText('NO TOUCHING · NO PHOTOS · NO EXCEPTIONS · WE WILL ASK ONCE', it.w / 2, it.h - 14);
      c.fillStyle = 'rgba(232,220,195,0.22)'; c.font = '6px Arial';
      c.fillText('MANAGEMENT (DEE) RESERVES EVERY RIGHT THERE IS', it.w / 2, it.h - 5);
    }
    if (room === 'splitlip') {
      // floor: forty years of boots, spills, and one incident with a mop nobody discusses
      c.fillStyle = '#3e342c'; c.fillRect(0, 0, it.w, it.h);
      scatter(140, 431, (rnd) => { c.fillStyle = `rgba(${18 + rnd() * 24 | 0},${14 + rnd() * 16 | 0},10,${0.25 + rnd() * 0.4})`; c.fillRect(rnd() * it.w, rnd() * it.h, 10 + rnd() * 34, 5 + rnd() * 12); });
      const k = it.counter;
      c.fillStyle = '#4a3626'; c.fillRect(k.x, k.y, k.w, k.h);
      c.fillStyle = 'rgba(255,235,200,0.14)'; c.fillRect(k.x, k.y, k.w, 8);   // elbow polish
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(k.x, k.y + k.h, k.w, 6);
      c.fillStyle = 'rgba(120,150,170,0.22)'; c.fillRect(k.x + 6, k.y - 42, k.w - 12, 38); // backbar mirror
      for (let i = 0; i < 10; i++) { c.fillStyle = ['#7a5a2a', '#8a4a3a', '#5a7a4a'][i % 3]; c.fillRect(k.x + 14 + i * 24, k.y - 32, 7, 20); }
      // THE POOL TABLE: felt burned, beloved, load-bearing
      const pt = it.pool;
      c.fillStyle = '#5a3a26'; c.fillRect(pt.x - 8, pt.y - 8, pt.w + 16, pt.h + 16);
      c.fillStyle = '#2e5a3e'; c.fillRect(pt.x, pt.y, pt.w, pt.h);
      c.fillStyle = 'rgba(20,40,28,0.6)'; c.beginPath(); c.ellipse(pt.x + 50, pt.y + 40, 14, 9, 0.4, 0, 7); c.fill(); // the burn
      for (const [bx, by, col] of [[pt.x + 90, pt.y + 30, '#e8dcc3'], [pt.x + 120, pt.y + 60, '#c9302a'], [pt.x + 60, pt.y + 70, '#2a2a2a']]) {
        c.fillStyle = col; c.beginPath(); c.arc(bx, by, 5, 0, 7); c.fill();
      }
      c.fillStyle = '#6a4a30'; c.fillRect(640, 160, 12, 130);                 // cue rack
      for (let i = 0; i < 4; i++) { c.strokeStyle = '#c9a86a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(646, 168 + i * 30); c.lineTo(646, 168 + i * 30 + 24); c.stroke(); }
      c.lineWidth = 1;
      // jukebox (broke since '09), dartboard, and the door of legend
      c.fillStyle = '#5a3a4a'; c.fillRect(60, 320, 50, 70);
      c.fillStyle = 'rgba(255,200,120,0.25)'; c.beginPath(); c.arc(85, 340, 14, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(232,220,195,0.6)'; c.font = '5px Arial'; c.textAlign = 'center';
      c.fillText('OUT OF ORDER', 85, 378); c.fillText("(SINCE '09)", 85, 384);
      c.fillStyle = '#3a2a22'; c.beginPath(); c.arc(560, 70, 16, 0, 7); c.fill();
      c.fillStyle = '#c9302a'; c.beginPath(); c.arc(560, 70, 5, 0, 7); c.fill();
      c.fillStyle = '#2a221c'; c.fillRect(660, 40, 44, 70);                   // THE BATHROOM
      c.fillStyle = 'rgba(214,80,60,0.8)'; c.font = 'bold 6px Arial';
      c.fillText('BATHROOM', 682, 70); c.fillText('(ABANDON HOPE)', 682, 78);
      c.fillStyle = 'rgba(232,220,195,0.45)'; c.font = '7px Georgia';
      c.fillText('YOU BREAK A CUE ON SOMEBODY, YOU BOUGHT THE CUE — MGMT', it.w / 2, it.h - 10);
    }
    if (room === 'daybreak') {
      // the only clean interior in Hopewell. it feels like an accusation
      c.fillStyle = '#d9d2c4'; c.fillRect(0, 0, it.w, it.h);
      c.fillStyle = '#c4bba8'; for (let x = 0; x < it.w; x += 60) c.fillRect(x, 0, 1, it.h); // pristine plank seams
      const k = it.counter;
      c.fillStyle = '#8a7a62'; c.fillRect(k.x, k.y, k.w, k.h);
      c.fillStyle = '#f4f1ea'; c.fillRect(k.x, k.y, k.w, 8);
      c.fillStyle = 'rgba(180,210,230,0.4)'; c.fillRect(k.x + 12, k.y - 34, 90, 30);        // pastry case
      c.fillStyle = '#c9a86a'; for (let i = 0; i < 3; i++) c.beginPath(), c.arc(k.x + 28 + i * 26, k.y - 18, 7, 0, 7), c.fill();
      c.fillStyle = '#2a2e33'; c.fillRect(140, 30, 360, 44);                                 // menu board
      c.fillStyle = '#f4f1ea'; c.font = '600 8px "Segoe UI", Arial'; c.textAlign = 'left';
      c.fillText('latte — 9    oat +1.25    "the hopewell" (it\'s a latte) — 11', 152, 50);
      c.fillText('community is our most important ingredient™', 152, 62);
      c.fillStyle = '#7a8a6a'; for (const [px, py] of [[560, 60], [590, 64], [575, 40]]) { c.fillRect(px, py, 8, 14); } // succulents
      c.fillStyle = '#8a7a62'; c.fillRect(120, 250, 200, 60); c.fillRect(440, 260, 140, 56); // tables
      c.fillStyle = 'rgba(42,46,51,0.8)'; c.font = '6px "Segoe UI", Arial'; c.textAlign = 'center';
      c.fillText('SITE PLAN — PHASE II (CONFIDENTIAL)', 510, 256);                            // the rep table's homework
      c.fillStyle = 'rgba(150,60,50,0.35)'; c.beginPath(); c.ellipse(585, 78, 10, 6, 0, 0, 7); c.fill(); // Tuesday's authenticity, faint
    }
    if (room === 'pawn') {
      c.fillStyle = '#55503f'; c.fillRect(0, 0, it.w, it.h);
      scatter(80, 441, (rnd) => { c.fillStyle = `rgba(30,26,20,${0.1 + rnd() * 0.2})`; c.fillRect(rnd() * it.w, rnd() * it.h, 8 + rnd() * 24, 4 + rnd() * 8); });
      const k = it.counter;
      c.fillStyle = '#4a4438'; c.fillRect(k.x, k.y, k.w, k.h);
      c.strokeStyle = 'rgba(210,200,180,0.5)'; c.lineWidth = 2;                              // the cage
      for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(k.x + i * 20, k.y - 40); c.lineTo(k.x + i * 20, k.y); c.stroke(); }
      c.lineWidth = 1;
      c.fillStyle = '#6a4a30'; c.fillRect(40, 40, 200, 60);                                  // guitar wall
      for (let i = 0; i < 4; i++) { c.fillStyle = ['#8a5a33', '#3a3632', '#9c3d2e', '#c9a86a'][i]; c.fillRect(56 + i * 46, 48, 18, 44); c.fillStyle = '#2a2622'; c.fillRect(62 + i * 46, 40, 6, 16); }
      c.fillStyle = 'rgba(180,210,230,0.35)'; c.fillRect(240, 250, 120, 50);                 // the ring case
      c.fillStyle = 'rgba(232,220,195,0.7)'; c.font = 'bold 5px Arial'; c.textAlign = 'center';
      c.fillText('ESTATE (DIVORCE)', 300, 264); c.fillText('ROWS BY DECADE', 300, 272);
      c.fillStyle = '#5a5a4a'; c.fillRect(60, 220, 130, 120);                                // weed whacker wall
      for (let i = 0; i < 5; i++) { c.strokeStyle = '#c9a227'; c.lineWidth = 2; c.beginPath(); c.moveTo(70, 232 + i * 22); c.lineTo(180, 238 + i * 22); c.stroke(); }
      c.lineWidth = 1;
      c.fillStyle = 'rgba(180,210,230,0.2)'; c.fillRect(500, 240, 130, 60);                  // the EMPTY gun case
      c.strokeStyle = 'rgba(0,0,0,0.4)'; c.strokeRect(500, 240, 130, 60);
      c.fillStyle = 'rgba(232,220,195,0.75)'; c.font = 'bold 6px Arial';
      c.fillText('ASK VERN', 565, 264); c.fillText('(VERN SAYS NO)', 565, 274);
      c.fillStyle = '#6a5a3a'; c.beginPath(); c.ellipse(600, 90, 12, 16, 0, 0, 7); c.fill(); // the owl
      c.fillStyle = '#c9a227'; c.beginPath(); c.arc(596, 84, 2, 0, 7); c.arc(604, 84, 2, 0, 7); c.fill();
    }
    if (room === 'shop') {
      c.fillStyle = '#55524a'; c.fillRect(0, 0, it.w, it.h);                        // sealed concrete
      scatter(120, 811, (rnd) => { c.fillStyle = `rgba(20,18,16,${0.08 + rnd() * 0.2})`; c.fillRect(rnd() * it.w, rnd() * it.h, 10 + rnd() * 40, 5 + rnd() * 14); });
      scatter(40, 812, (rnd) => { c.fillStyle = 'rgba(60,50,40,0.5)'; c.beginPath(); c.arc(rnd() * it.w, rnd() * it.h, 1 + rnd() * 3, 0, 7); c.fill(); }); // spatter burns
      const k = it.counter;
      c.fillStyle = '#4a4438'; c.fillRect(k.x, k.y, k.w, k.h);                       // Dunn's desk
      c.fillStyle = 'rgba(232,220,195,0.5)'; c.font = '6px Arial'; c.textAlign = 'center';
      c.fillText('SIGN IN. GLASSES ON. NO EXCEPTIONS.', k.x + k.w / 2, k.y + 32);
      // welding bays with their curtains
      for (let i = 0; i < 4; i++) {
        const bx = 340 + i * 82;
        c.fillStyle = '#3e3a34'; c.fillRect(bx, 90, 66, 70);
        c.fillStyle = 'rgba(190,90,70,0.45)'; c.fillRect(bx - 4, 84, 74, 8);        // the orange curtain
        c.fillStyle = '#6a6258'; c.fillRect(bx + 12, 120, 42, 26);                  // the bench
        if (i === 1) { c.save(); c.globalCompositeOperation = 'lighter';            // one bay is live
          c.fillStyle = 'rgba(180,220,255,0.5)'; c.beginPath(); c.arc(bx + 33, 132, 9, 0, 7); c.fill(); c.restore(); }
      }
      c.fillStyle = '#6a6258'; c.fillRect(60, 250, 140, 90);                         // the scrap rack
      for (let i = 0; i < 6; i++) { c.fillStyle = '#8a8578'; c.fillRect(66, 256 + i * 14, 128, 6); }
      c.fillStyle = 'rgba(232,220,195,0.55)'; c.font = 'bold 6px Arial';
      c.fillText('SCRAP — TAKE WHAT YOU CAN USE', 130, 352);
      c.fillStyle = '#c9a227'; c.fillRect(430, 250, 120, 60);                        // the safety poster
      c.fillStyle = '#2a2622'; c.font = 'bold 7px Arial';
      c.fillText('DAYS WITHOUT INCIDENT', 490, 268); c.font = 'bold 18px Impact, Arial';
      c.fillText('2', 490, 292);
    }
    if (room === 'aid') {
      c.fillStyle = '#8a8272'; c.fillRect(0, 0, it.w, it.h);                         // institutional linoleum
      for (let x = 0; x < it.w; x += 40) for (let y = 0; y < it.h; y += 40)
        if ((x + y) % 80 === 0) { c.fillStyle = 'rgba(110,102,88,0.35)'; c.fillRect(x, y, 40, 40); }
      const k = it.counter;
      c.fillStyle = '#6e6250'; c.fillRect(k.x, k.y, k.w, k.h);
      c.fillStyle = 'rgba(190,215,230,0.35)'; c.fillRect(k.x, k.y - 40, k.w, 36);    // the window
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(k.x + 90, k.y - 12, 60, 8);        // the slot you speak through
      c.fillStyle = 'rgba(42,38,34,0.75)'; c.font = 'bold 7px Arial'; c.textAlign = 'center';
      c.fillText('FINANCIAL AID · WINDOW 1 · WINDOW 1 IS THE ONLY WINDOW', k.x + k.w / 2, k.y + 34);
      // the queue rope and the chairs of the resigned
      c.strokeStyle = '#7a3a4a'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(150, 200); c.lineTo(470, 200); c.stroke(); c.lineWidth = 1;
      for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
        c.fillStyle = '#5a5a62'; c.fillRect(96 + i * 70 + r * 300 * 0, 250 + r * 44, 34, 9);
        c.fillStyle = '#4a4a52'; c.fillRect(100 + i * 70, 259 + r * 44, 26, 18);
      }
      c.fillStyle = '#c9302a'; c.fillRect(520, 60, 60, 44);                          // TAKE A NUMBER
      c.fillStyle = '#e8dcc3'; c.font = 'bold 7px Arial'; c.fillText('TAKE A', 550, 76);
      c.font = 'bold 15px Impact, Arial'; c.fillText('NUMBER', 550, 92);
      c.fillStyle = 'rgba(42,38,34,0.5)'; c.font = 'italic 6px Georgia';
      c.fillText('now serving: 3   ·   in the machine: 41', 300, 350);
    }
    if (room === 'library') {
      c.fillStyle = '#7a6e5e'; c.fillRect(0, 0, it.w, it.h);                          // carpet tile, warm
      scatter(90, 821, (rnd) => { c.fillStyle = `rgba(40,34,26,${0.06 + rnd() * 0.12})`; c.fillRect(rnd() * it.w, rnd() * it.h, 20 + rnd() * 40, 10 + rnd() * 16); });
      for (const sy of [90, 200]) {                                                   // the stacks
        c.fillStyle = '#5a4a38'; c.fillRect(300, sy, 300, 60);
        for (let i = 0; i < 26; i++) { c.fillStyle = ['#8a4a3a','#4a6a5a','#7a6a3a','#4a5568','#6a4a6a'][i % 5];
          c.fillRect(306 + i * 11, sy + 6, 8, 22); }
        for (let i = 0; i < 26; i++) { c.fillStyle = ['#5a7a4a','#8a5a33','#3a5a7a','#7a3a4a','#6a6a4a'][i % 5];
          c.fillRect(306 + i * 11, sy + 32, 8, 22); }
      }
      const k = it.counter;
      c.fillStyle = '#6e5a3a'; c.fillRect(k.x, k.y, k.w, k.h);
      c.fillStyle = 'rgba(232,220,195,0.55)'; c.font = '6px Arial'; c.textAlign = 'center';
      c.fillText('RETURNS', k.x + k.w / 2, k.y + 32);
      for (let i = 0; i < 4; i++) {                                                    // study carrels
        c.fillStyle = '#6a5a46'; c.fillRect(70 + i * 60, 280, 48, 40);
        c.fillStyle = '#5a4c3a'; c.fillRect(70 + i * 60, 280, 48, 8);
      }
      c.fillStyle = '#8a8f96'; c.fillRect(600, 280, 30, 70);                           // the radiator, the real attraction
      for (let i = 0; i < 6; i++) { c.fillStyle = '#6a7078'; c.fillRect(602, 284 + i * 11, 26, 6); }
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,170,90,0.10)'; c.beginPath(); c.arc(615, 315, 46, 0, 7); c.fill(); c.restore();
      c.fillStyle = 'rgba(232,220,195,0.4)'; c.font = 'italic 6px Georgia';
      c.fillText('the best heating on campus, and everyone knows it', 330, 358);
    }
    if (room === 'house') {
      // Wide, pale, and expensive. Deliberately under-decorated: this is a room you
      // are in for forty seconds with a clock running, so it must READ instantly.
      c.fillStyle = '#c8bfae'; c.fillRect(0, 0, it.w, it.h);
      for (let x = 0; x < it.w; x += 78) { c.fillStyle = 'rgba(150,138,120,0.35)'; c.fillRect(x, 0, 2, it.h); }
      c.fillStyle = 'rgba(190,180,164,0.5)'; c.fillRect(200, 160, 320, 220);          // the big rug
      c.strokeStyle = 'rgba(120,110,95,0.4)'; c.strokeRect(200, 160, 320, 220);
      // the lake wall — floor to ceiling, the whole point of the house
      c.fillStyle = 'rgba(120,160,190,0.35)'; c.fillRect(20, 14, it.w - 40, 40);
      for (let mx = 20; mx < it.w - 20; mx += 60) { c.strokeStyle = 'rgba(60,60,60,0.4)'; c.beginPath(); c.moveTo(mx, 14); c.lineTo(mx, 54); c.stroke(); }
      c.fillStyle = 'rgba(232,220,195,0.35)'; c.font = 'italic 7px Georgia'; c.textAlign = 'center';
      c.fillText('(the lake, doing nothing, worth everything)', it.w / 2, 38);
      // furniture: a sectional the size of a car, an island, art nobody looks at
      c.fillStyle = '#8a8272'; c.fillRect(250, 200, 190, 70);
      c.fillStyle = '#9a9282'; c.fillRect(250, 200, 190, 16);
      c.fillStyle = '#6a6258'; c.fillRect(520, 320, 150, 60);
      c.fillStyle = '#c8c2b4'; c.fillRect(520, 320, 150, 10);
      c.fillStyle = '#7a6a5a'; c.fillRect(60, 60, 46, 60);
      c.fillStyle = 'rgba(180,170,150,0.6)'; c.fillRect(64, 64, 38, 52);
      // the search spots, labelled where they are — no menu-hunting on a timer
      const S = it.spots;
      const labels = { drawer: 'sock drawer', dresser: 'jewelry dish', office: 'office desk',
                       closet: 'the safe', garage: 'boat garage', trophy: 'trophy wall' };
      for (const k of Object.keys(S)) {
        const [sx, sy] = S[k];
        const done = this.g.burg && this.g.burg.spots.includes(k);
        c.fillStyle = done ? 'rgba(120,110,95,0.35)' : 'rgba(60,52,42,0.75)';
        c.fillRect(sx - 20, sy - 14, 40, 28);
        c.strokeStyle = done ? 'rgba(120,110,95,0.4)' : 'rgba(232,220,195,0.45)';
        c.strokeRect(sx - 20, sy - 14, 40, 28);
        c.fillStyle = done ? 'rgba(200,190,175,0.35)' : 'rgba(232,220,195,0.8)';
        c.font = 'bold 5.5px Arial'; c.textAlign = 'center';
        c.fillText(done ? '(turned out)' : labels[k].toUpperCase(), sx, sy + 24);
      }
    }
    if (room === 'unionhall') {
      // linoleum the color of weak coffee, waxed monthly for forty years by the same man
      c.fillStyle = '#8a8272'; c.fillRect(0, 0, it.w, it.h);
      for (let x = 0; x < it.w; x += 40) for (let y = 0; y < it.h; y += 40)
        if ((x + y) % 80 === 0) { c.fillStyle = 'rgba(110,100,84,0.4)'; c.fillRect(x, y, 40, 40); }
      const k = it.counter;
      c.fillStyle = '#6e5a3a'; c.fillRect(k.x, k.y, k.w, k.h);                       // the urn table
      c.fillStyle = '#a8a49c'; c.fillRect(k.x + 20, k.y - 24, 30, 26);               // the urn itself
      c.fillStyle = '#7a7468'; c.fillRect(k.x + 30, k.y - 30, 10, 8);
      c.fillStyle = 'rgba(232,220,195,0.7)'; c.font = '6px Arial'; c.textAlign = 'center';
      c.fillText('50¢ — HONOR BOX', k.x + 90, k.y + 30);
      c.fillText('(SHORTED TWICE IN 40 YRS)', k.x + 90, k.y + 38);
      for (let r = 0; r < 3; r++) for (let ch = 0; ch < 6; ch++) {                    // folding chairs, congregation of ghosts
        c.fillStyle = '#5a5a62'; c.fillRect(120 + ch * 66, 180 + r * 54, 30, 8);
        c.fillStyle = '#4a4a52'; c.fillRect(124 + ch * 66, 188 + r * 54, 22, 18);
      }
      c.fillStyle = '#c9a227'; c.fillRect(100, 30, 360, 34);                          // THE BANNER
      c.fillStyle = '#2a2622'; c.font = 'bold 11px Georgia';
      c.fillText('LOCAL 448 — FORTY YEARS OF ALMOST', 280, 51);
      c.fillStyle = '#6e5a3a'; c.fillRect(370, 100, 160, 90);                         // grievance board
      scatter(9, 451, (rnd) => { c.fillStyle = 'rgba(240,232,210,0.8)'; c.fillRect(376 + rnd() * 130, 106 + rnd() * 66, 18, 14); });
      c.fillStyle = 'rgba(42,38,34,0.7)'; c.font = '5px Arial';
      c.fillText('GRIEVANCES (ACTIVE)', 450, 112);
      c.fillText('oldest: 1986', 450, 186);
      // photo wall: nine hundred men in rows, then fewer, then fewer
      for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(200,190,170,0.5)'; c.fillRect(60 + i * 40, 300, 32, 24); }
      c.fillStyle = 'rgba(42,38,34,0.6)'; c.font = '5px Georgia';
      c.fillText("'52  '74  '96  '18 — same wall, thinner rows", 140, 338);
    }
    if (room === 'garage') {
      F(60, 60, 120, 50, '#7a6a5a'); c.fillStyle = '#b8a890'; c.fillRect(66, 66, 108, 20); // cot
      F(460, 60, 120, 70, '#6e5a3a'); // shelves
      scatter(10, 3, (rnd) => { c.fillStyle = ['#c9a227', '#5b7291', '#9c3d2e'][Math.floor(rnd() * 3)]; c.fillRect(466 + rnd() * 100, 66 + rnd() * 56, 12, 8); });
      F(300, 50, 70, 90, '#e8e4dc'); c.fillStyle = '#3a6ea8'; c.fillRect(306, 56, 58, 20); // the beer fridge / drop box
      c.fillStyle = '#2a2a2a'; c.font = '6px Arial'; c.fillText('BEV\'S. ASK FIRST.', 306, 100);
      F(40, 250, 90, 80, '#8a6a4a'); // box maze
      F(150, 250, 80, 70, '#8a6a4a'); F(120, 200, 70, 60, '#7a5a3a');
      c.fillStyle = 'rgba(240,230,200,0.7)'; c.font = '7px Georgia'; c.fillText('XMAS (DO NOT CRUSH)', 44, 268);
      // the jar
      c.fillStyle = 'rgba(200,220,230,0.5)'; c.fillRect(340, 64, 18, 24);
      c.fillStyle = '#2a2a2a'; c.font = '6px Arial'; c.fillText('RENT', 342, 100);
    }
  }

  // ---------------------------------------------------------------------- //
  //  FRAME                                                                  //
  // ---------------------------------------------------------------------- //

  render(dt) {
    const g = this.g, c = this.ctx, cv = this.cv;
    this.t += dt;
    // ⚠️ NEVER reseed a "flicker" from per-frame noise — at 60fps that is a 30Hz strobe,
    // not a failing tube, and it reads as screen tearing. All three flickers below are
    // driven by TIME so they stutter and HOLD like real dying hardware.
    this.flicker = Math.random();                                   // non-visual jitter only
    this.barLight = Math.floor(this.t * 4.5) % 2;                   // cop bar: alternating halves
    const n = Math.sin(this.t * 2.3) + Math.sin(this.t * 7.1) * 0.6 + Math.sin(this.t * 1.1) * 0.3;
    this.neonG = n > 1.15;                                          // the dead G, in believable bursts
    this.tubeDim = Math.sin(this.t * 5.7) + Math.sin(this.t * 13.3) * 0.5 < -1.32;
    const p = g.player;
    // camera follows with lag; shake decays
    this.cam.x += (p.x - this.cam.x) * Math.min(1, dt * 5);
    this.cam.y += (p.y - 40 - this.cam.y) * Math.min(1, dt * 5);
    this.cam.shake = Math.max(0, this.cam.shake - dt * 14);
    this.cam.sx = (Math.random() - 0.5) * this.cam.shake;
    this.cam.sy = (Math.random() - 0.5) * this.cam.shake;
    const z = this.zoom;
    const vw = cv.width / z, vh = cv.height / z;
    const room = g.room;
    const gr = this.ground(room);
    const maxX = room === 'ext' ? WORLD.w : INTERIORS[room].w;
    const maxY = room === 'ext' ? WORLD.h : INTERIORS[room].h;
    let cx = Math.max(vw / 2, Math.min(maxX - vw / 2, this.cam.x)) + this.cam.sx;
    let cy = Math.max(vh / 2, Math.min(maxY - vh / 2, this.cam.y)) + this.cam.sy;
    if (maxX < vw) cx = maxX / 2; if (maxY < vh) cy = maxY / 2;

    c.save();
    c.fillStyle = '#0c0e14'; c.fillRect(0, 0, cv.width, cv.height);
    c.scale(z, z);
    c.translate(-cx + vw / 2, -cy + vh / 2);

    // ground
    c.drawImage(gr, 0, 0);

    const blockIdx = Math.min(g.block, 4);
    const late = blockIdx >= 3;

    // Puddles, and the thing the art bible singles out: "rain doubles every light source
    // as a smeared vertical reflection in the puddles — worth more than any shader."
    if (g.weather === 'rain' && room === 'ext') {
      const lights = [];
      if (blockIdx >= 2) {
        for (const pr of EXTERIOR_PROPS) if (pr.kind === 'lampPost' && !pr.dead) lights.push([pr.x, pr.y, 'rgba(255,214,150,']);
        lights.push([1290, STRIP_Y.base, 'rgba(255,170,80,'], [1960, STRIP_Y.base, 'rgba(255,214,62,'],
                    [760, STRIP_Y.base, 'rgba(130,170,255,'], [250, 620, 'rgba(220,235,255,']);
      }
      for (const pd of this.puddles) {
        c.fillStyle = 'rgba(60,80,110,0.35)';
        c.beginPath(); c.ellipse(pd.x, pd.y, pd.rx, pd.ry, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(150,175,210,0.12)';   // sky sheen on the standing water
        c.beginPath(); c.ellipse(pd.x - pd.rx * 0.2, pd.y - pd.ry * 0.25, pd.rx * 0.55, pd.ry * 0.4, 0, 0, 7); c.fill();
        for (const [lx, ly, col] of lights) {
          const d = Math.hypot(lx - pd.x, ly - pd.y);
          if (d > 220) continue;
          const a = (1 - d / 220) * 0.42;
          c.save();
          c.beginPath(); c.ellipse(pd.x, pd.y, pd.rx, pd.ry, 0, 0, 7); c.clip();  // stays IN the water
          c.globalCompositeOperation = 'lighter';
          const gr = c.createLinearGradient(0, pd.y - pd.ry, 0, pd.y + pd.ry);
          gr.addColorStop(0, col + a + ')'); gr.addColorStop(0.55, col + a * 0.5 + ')'); gr.addColorStop(1, col + '0)');
          c.fillStyle = gr;
          const rw = 5 + (1 - d / 220) * 5;
          c.fillRect(lx - rw / 2 + (pd.x - lx) * 0.86, pd.y - pd.ry, rw, pd.ry * 2);  // smeared toward the light
          c.restore();
        }
      }
    }

    if (room === 'ext') this._streetTraffic(c, dt, late, g);

    // the one living smokestack: the town's pulse, in coal-grey
    if (room === 'ext' && Math.random() < dt * 5) {
      const st = WORKS.stacks[0];
      this.parts.push({ x: st.x + rr(-6, 6), y: 14, vx: rr(4, 18), vy: rr(-14, -6), g: -6,
        r: rr(4, 9), c: 'rgba(120,116,112,0.16)', t: 0, dur: rr(2.4, 4) });
    }

    // entity shadows (sun-skewed by block)
    const sunSkew = [[-14, 5], [3, 7], [16, 6], [0, 4], [0, 4]][blockIdx] || [0, 4];
    const drawShadow = (x, y, r) => {
      c.fillStyle = late ? 'rgba(10,12,20,0.35)' : 'rgba(20,18,16,0.3)';
      c.beginPath(); c.ellipse(x + sunSkew[0] * 0.4, y + 2, r + Math.abs(sunSkew[0]) * 0.3, r * 0.38, 0, 0, 7); c.fill();
    };

    // pickups
    for (const it of g.pickups) {
      if (room !== 'ext') break;
      drawShadow(it.x, it.y, 7);
      this._drawItem(c, it.kind, it.x, it.y);
    }

    // entities sorted by y
    const ents = [...g.npcs.filter(n => n.room === room), { player: true, ...{}, y: p.y }];
    ents.sort((a, b) => (a.player ? p.y : a.y) - (b.player ? p.y : b.y));
    for (const e of ents) {
      if (e.player) { drawShadow(p.x, p.y, 12); this._drawDude(c, p, true); }
      else { drawShadow(e.x, e.y, 11); this._drawDude(c, e, false); }
    }

    // projectiles
    for (const pr of g.projectiles) {
      drawShadow(pr.x, pr.y, 5);
      c.save(); c.translate(pr.x, pr.y - pr.z); c.rotate(pr.t * 9);
      this._drawItem(c, pr.kind, 0, 0, true); c.restore();
    }

    // particles
    for (const pt of this.parts) {
      pt.t += dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += pt.g * dt;
      c.globalAlpha = Math.max(0, 1 - pt.t / pt.dur);
      c.fillStyle = pt.c; c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    this.parts = this.parts.filter(pt => pt.t < pt.dur);

    // dynamic signage (neon/flicker lives here, not in the bake)
    if (room === 'ext') this._signs(c, blockIdx);

    // rain
    if (g.weather === 'rain' && room === 'ext') {
      c.strokeStyle = 'rgba(180,200,230,0.25)'; c.lineWidth = 1;
      for (let i = 0; i < 60; i++) {
        const rx = cx - vw / 2 + ((i * 137 + this.t * 620) % vw), ry = cy - vh / 2 + ((i * 271 + this.t * 900) % vh);
        c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 2, ry + 11); c.stroke();
      }
    }

    c.restore();

    // lighting pass over the world…
    this._lighting(cx, cy, vw, vh, blockIdx, room, g);

    // …but speech stays readable OVER the night (art bible: never crush the readable things)
    c.save();
    c.scale(z, z);
    c.translate(-cx + vw / 2, -cy + vh / 2);
    for (const b of this.barks) { b.t += dt; this._drawBark(c, b); }
    this.barks = this.barks.filter(b => b.t < b.dur);
    c.restore();

    // per-block color grade — the room's lamp, not an Instagram filter
    const GRADES = [
      'rgba(255,186,100,0.13)',  // morning gold
      null,                      // afternoon: honest
      'rgba(255,120,80,0.11)',   // evening ember
      'rgba(80,110,200,0.10)',   // late cool
      'rgba(80,110,200,0.12)',
    ];
    const grade = room === 'ext' ? GRADES[blockIdx] : (g.gameBarnDark ? null : 'rgba(255,200,140,0.07)');
    if (grade) {
      c.save(); c.globalCompositeOperation = 'overlay';
      c.fillStyle = grade; c.fillRect(0, 0, cv.width, cv.height);
      c.restore();
    }

    // vignette + weather grade
    const vg = c.createRadialGradient(cv.width / 2, cv.height / 2, cv.height / 3, cv.width / 2, cv.height / 2, cv.height * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(6,6,10,0.26)');
    c.fillStyle = vg; c.fillRect(0, 0, cv.width, cv.height);
    if (g.weather === 'heatwave' && !late) { c.fillStyle = 'rgba(255,160,60,0.06)'; c.fillRect(0, 0, cv.width, cv.height); }
    if (g.weather === 'overcast') { c.fillStyle = 'rgba(90,100,115,0.10)'; c.fillRect(0, 0, cv.width, cv.height); }
  }

  _streetTraffic(c, dt, late, g) {
    if (Math.random() < dt * (late ? 0.05 : 0.12)) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const cop = g.heatStage() >= 3 && Math.random() < 0.4;
      // two streets now: the Mile's, and Main — downtown gets a touch less traffic,
      // which is both a performance choice and the truth
      const main = Math.random() < 0.4;
      const y = main ? (dir > 0 ? MAIN_ST.y + 78 : MAIN_ST.y + 30) : (dir > 0 ? 990 : 940);
      this.streetCars.push({ x: dir > 0 ? -140 : WORLD.w + 140, y, dir, cop,
        col: ['#5b7291', '#7a7468', '#9c3d2e', '#4c5741', '#c9b28a'][ri(0, 4)], sp: rr(220, 300) });
    }
    for (const car of this.streetCars) {
      car.x += car.dir * car.sp * dt;
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(car.x, car.y + 6, 58, 22, 0, 0, 7); c.fill();
      c.fillStyle = car.cop ? '#e8e4dc' : car.col;
      c.beginPath(); c.roundRect(car.x - 55, car.y - 24, 110, 48, 9); c.fill();
      c.fillStyle = 'rgba(20,26,34,0.85)'; c.beginPath(); c.roundRect(car.x - 34, car.y - 16, 68, 32, 5); c.fill();
      c.fillStyle = car.cop ? '#e8e4dc' : car.col; c.beginPath(); c.roundRect(car.x - 20, car.y - 11, 40, 22, 3); c.fill();
      if (car.cop) {
        c.fillStyle = this.barLight ? '#e04040' : '#4060e0';
        c.fillRect(car.x - 12, car.y - 22, 12, 6);
        c.fillStyle = this.barLight ? '#4060e0' : '#e04040';
        c.fillRect(car.x, car.y - 22, 12, 6);
        c.fillStyle = '#2a2e33'; c.font = 'bold 8px Arial'; c.textAlign = 'center'; c.fillText('HPD', car.x, car.y + 4);
      }
      if (late) { // headlight cones
        c.save(); c.globalCompositeOperation = 'lighter';
        const hg = c.createRadialGradient(car.x + car.dir * 60, car.y, 4, car.x + car.dir * 140, car.y, 120);
        hg.addColorStop(0, 'rgba(255,230,170,0.35)'); hg.addColorStop(1, 'rgba(255,230,170,0)');
        c.fillStyle = hg; c.beginPath(); c.ellipse(car.x + car.dir * 120, car.y, 130, 40, 0, 0, 7); c.fill();
        c.restore();
      }
    }
    this.streetCars = this.streetCars.filter(car => car.x > -220 && car.x < WORLD.w + 220);
  }

  _signs(c, blockIdx) {
    const neonOn = blockIdx >= 2;
    for (const b of BUILDINGS) {
      // signs ride the parapet, so a raised roofline lifts its own signage with it
      const sx = b.x + b.w / 2, sy = STRIP_Y.facadeTop - ((b.face && b.face.parapet) || 0) + 16;
      c.textAlign = 'center';
      if (b.key === 'wingbarn') {
        c.font = 'bold 15px Impact, Arial';
        const txt = neonOn && !this.neonG ? 'WI G BARN' : 'WING BARN'; // the G catches, then quits
        c.fillStyle = neonOn ? '#ffd9a0' : PAL.cream;
        if (neonOn) { c.shadowColor = '#ffb347'; c.shadowBlur = 12; }
        c.fillText(txt, sx, sy); c.shadowBlur = 0;
        // rooster with a story
        c.fillStyle = '#c9302a'; c.beginPath(); c.arc(sx - 62, sy - 6, 7, 0, 7); c.fill();
        c.fillStyle = '#ffd23e'; c.beginPath(); c.moveTo(sx - 56, sy - 6); c.lineTo(sx - 48, sy - 3); c.lineTo(sx - 56, sy - 1); c.fill();
      } else if (b.key === 'cashking') {
        c.font = 'bold 15px Impact, Arial';
        c.fillStyle = neonOn ? '#ffe574' : '#ffd23e';
        if (neonOn) { c.shadowColor = '#ffd23e'; c.shadowBlur = 14; }
        c.fillText('CA$H KINGDOM', sx, sy); c.shadowBlur = 0;
        if (neonOn) { c.font = '9px Arial'; c.fillStyle = '#8fd0a0'; c.fillText('OPEN LATE — obviously', sx, sy + 12); }
      } else if (b.key === 'tattoo') {
        c.font = 'bold 13px Georgia';
        c.fillStyle = neonOn ? '#a8c8ff' : PAL.denim;
        if (neonOn) { c.shadowColor = '#6a9aff'; c.shadowBlur = 12; }
        c.fillText('STICK CITY', sx, sy); c.shadowBlur = 0;
      } else if (b.key === 'qwikstop') {
        c.font = 'bold 14px Arial';
        c.fillStyle = '#ff8f5a'; c.shadowColor = '#d94f2a'; c.shadowBlur = neonOn ? 10 : 0;
        c.fillText('QwikStop', sx, sy); c.shadowBlur = 0;
        c.font = '8px Arial'; c.fillStyle = PAL.cream; c.fillText('RIP  •  ICE  •  LOTTO', sx, sy + 12);
      } else if (b.key === 'dead') {
        // Fairview board painted in the bake; nothing glows here. On purpose.
      } else {
        c.font = 'bold 12px Arial'; c.fillStyle = b.signC || PAL.cream;
        c.fillText(b.sign, sx, sy);
      }
    }
    c.font = 'bold 10px Georgia'; c.fillStyle = 'rgba(232,220,195,0.75)';
    c.fillText("BEV'S — no sign, everyone just knows", GARAGE.x + GARAGE.w / 2, GARAGE.y + 30);
    // downtown's signs, on their own Y band
    for (const b of DOWNTOWN) {
      if (b.dead) continue;
      const sx = b.x + b.w / 2, sy = DT_Y.facadeTop - ((b.face && b.face.parapet) || 0) + 16;
      if (b.key === 'splitlip') {
        c.font = 'bold 14px Impact, Arial';
        const txt = neonOn && !this.neonG ? 'THE SPL T LIP' : 'THE SPLIT LIP'; // the I drinks too
        c.fillStyle = neonOn ? '#ff7a6a' : '#c94a4a';
        if (neonOn) { c.shadowColor = '#c94a4a'; c.shadowBlur = 13; }
        c.fillText(txt, sx, sy); c.shadowBlur = 0;
        if (neonOn) { c.font = '8px Arial'; c.fillStyle = '#e8a090'; c.fillText('COLD BEER · WARM REGRET', sx, sy + 11); }
      } else if (b.key === 'daybreak') {
        // lowercase serenity: the invasion never shouts
        c.font = '600 13px "Segoe UI", Arial'; c.fillStyle = '#f4f1ea';
        c.fillText('daybreak', sx, sy);
        c.strokeStyle = '#c9a227'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(sx - 34, sy - 4, 4, Math.PI, 0); c.stroke(); c.lineWidth = 1; // the tasteful little sunrise
        c.font = '6px "Segoe UI", Arial'; c.fillStyle = 'rgba(244,241,234,0.6)';
        c.fillText('coffee · community · closing at dark', sx, sy + 10);
      } else if (b.key === 'pawn') {
        c.font = 'bold 12px Impact, Arial';
        c.fillStyle = neonOn ? '#ffe574' : '#ffd23e';
        if (neonOn) { c.shadowColor = '#ffd23e'; c.shadowBlur = 10; }
        c.fillText('LOANSTAR PAWN ✦ GOLD', sx, sy); c.shadowBlur = 0;
        c.font = '7px Arial'; c.fillStyle = 'rgba(232,220,195,0.6)';
        c.fillText('WE BUY ANYTHING (VERN DECIDES WHAT ANYTHING MEANS)', sx, sy + 11);
      }
    }
  }

  _lighting(cx, cy, vw, vh, blockIdx, room, g) {
    const c = this.ctx, L = this.light, lc = L.getContext('2d');
    const z = this.zoom;
    lc.clearRect(0, 0, L.width, L.height);
    const ambients = [
      'rgba(150,95,40,0.06)',     // morning: gold, not gravy
      'rgba(0,0,0,0.02)',         // afternoon: nothing to hide behind
      'rgba(70,40,90,0.24)',      // evening
      'rgba(8,13,34,0.60)',       // late
      'rgba(5,9,26,0.68)',        // rip bonus block: deeper night
    ];
    let amb = ambients[blockIdx] || ambients[3];
    if (room !== 'ext') amb = room === 'gamebarn' && g.gameBarnDark ? 'rgba(4,6,16,0.84)'
                            : room === 'foxhole' ? 'rgba(20,4,16,0.78)'
                            // a house you are not supposed to be in is DARK. Your own
                            // little pool of light is the entire point of the room.
                            : room === 'house' ? 'rgba(6,8,18,0.86)' : 'rgba(30,22,12,0.22)';
    lc.fillStyle = amb; lc.fillRect(0, 0, L.width, L.height);

    const toScreen = (wx, wy) => [(wx - cx + vw / 2) * z, (wy - cy + vh / 2) * z];
    const pool = (wx, wy, r, a = 1) => {
      const [sx, sy] = toScreen(wx, wy);
      lc.save(); lc.globalCompositeOperation = 'destination-out';
      const gr2 = lc.createRadialGradient(sx, sy, 4, sx, sy, r * z);
      gr2.addColorStop(0, `rgba(255,255,255,${a})`); gr2.addColorStop(1, 'rgba(255,255,255,0)');
      lc.fillStyle = gr2; lc.beginPath(); lc.arc(sx, sy, r * z, 0, 7); lc.fill(); lc.restore();
    };
    const glow = (wx, wy, r, col, a) => {
      c.save(); c.globalCompositeOperation = 'lighter';
      const [sx, sy] = toScreen(wx, wy);
      const gr2 = c.createRadialGradient(sx, sy, 2, sx, sy, r * z);
      gr2.addColorStop(0, col.replace('A)', `${a})`)); gr2.addColorStop(1, col.replace('A)', '0)'));
      c.fillStyle = gr2; c.beginPath(); c.arc(sx, sy, r * z, 0, 7); c.fill(); c.restore();
    };

    if (room === 'ext') {
      if (blockIdx >= 2) {
        // lamp pools (live ones), window warmth, neon spill — pools carve, they don't whisper
        for (const p of EXTERIOR_PROPS) {
          if (p.kind === 'lampPost' && !p.dead) {
            pool(p.x, p.y - 10, 185, 1.0);
            glow(p.x, p.y - 66, 30, 'rgba(255,220,150,A)', 0.6);
            glow(p.x, p.y + 4, 90, 'rgba(255,205,130,A)', 0.14);
          }
        }
        pool(250, 590, 230, 1.0); // QwikStop canopy: cold retail daylight at 1 a.m.
        glow(250, 590, 150, 'rgba(220,235,255,A)', 0.30);
        for (const b of BUILDINGS) {
          if (b.key === 'dead') continue;
          const openLate = ['qwikstop', 'cashking'].includes(b.key);
          if (blockIdx === 2 || openLate) {
            pool(b.x + b.w / 2, STRIP_Y.base + 6, 120, 0.8);
            glow(b.x + b.w / 2, STRIP_Y.facadeTop + 40, 70, 'rgba(255,190,110,A)', 0.26);
          }
        }
        // neon spill puddling on the sidewalk
        glow(1290, 505, 90, 'rgba(255,170,80,A)', 0.38);   // Wing Barn
        glow(1960, 505, 100, 'rgba(255,214,62,A)', 0.42);  // Ca$h Kingdom
        glow(760, 505, 76, 'rgba(120,160,255,A)', 0.32);   // Stick City
        // Bev's porch bulb — always on for you
        pool(GARAGE.door.x + 20, GARAGE.y - 6, 110, 0.85);
        glow(GARAGE.door.x + 20, GARAGE.y - 12, 36, 'rgba(255,220,150,A)', 0.5);
        // THE FOXHOLE: the sign is the only thing anyone ever spent money on out here,
        // so at night it's the brightest object in the southeast — a pink smear you can
        // navigate by from halfway across the lot.
        glow(FOXHOLE.x + FOXHOLE.w / 2, FOXHOLE.y - 28, 150, 'rgba(255,60,120,A)', 0.42);
        glow(FOXHOLE.x + FOXHOLE.w / 2, FOXHOLE.y - 28, 60, 'rgba(255,150,190,A)', 0.30);
        pool(FOXHOLE.x + FOXHOLE.w / 2, FOXHOLE.y + 40, 190, 0.55);
        // the one bulb over the steel door, and the gravel it makes glitter
        pool(FOXHOLE.door.x, FOXHOLE.door.y + 20, 120, 0.9);
        glow(FOXHOLE.door.x, FOXHOLE.door.y - 6, 34, 'rgba(255,226,170,A)', 0.5);
        glow(FOXHOLE.door.x, FOXHOLE.door.y + 30, 90, 'rgba(255,120,150,A)', 0.10);
        // HOPELESS at night: parking-lot poles and a couple of lit windows. The
        // Barrows Center is lit like a corporate lobby because that's what it is.
        for (const b of HTCC.buildings) {
          pool(b.door.x, b.y + b.h + 16, 100, 0.62);
          glow(b.door.x, b.y + b.h - 6, 26, 'rgba(255,226,170,A)', 0.20);
          if (b.donated) { pool(b.x + b.w / 2, b.y + b.h / 2, 150, 0.7);
            glow(b.x + b.w / 2, b.y + b.h / 2, 110, 'rgba(200,225,255,A)', 0.20); }
        }
        for (const [px, py] of [[HTCC.lot.x + 40, HTCC.lot.y + 20], [HTCC.quad.x + 120, HTCC.quad.y + 250],
                                [HTCC.quad.x + 640, HTCC.quad.y + 40]]) {
          pool(px, py, 150, 0.82); glow(px, py - 34, 32, 'rgba(255,190,120,A)', 0.28);
        }
        // THE BLUFFS at night: warm, tasteful, and sparse — landscape lighting, not
        // streetlights. The whole district glows like it's being photographed.
        for (const h of BLUFFS.houses) {
          const st = g.houseState ? g.houseState(h.key) : null;
          pool(h.x + h.w / 2, h.y + h.h + 20, 120, 0.6);
          glow(h.x + h.w / 2, h.y + h.h - 10, 60, 'rgba(255,214,160,A)', 0.14);
          if (st && st.occupied) {                          // the lit house: warm, and NOT for you
            pool(h.x + h.w / 2, h.y + h.h - 34, 130, 0.85);
            glow(h.x + h.w / 2, h.y + h.h - 34, 90, 'rgba(255,196,120,A)', 0.30);
          }
          for (const lx of [h.x + 10, h.x + h.w - 10]) glow(lx, h.y + h.h + 30, 26, 'rgba(255,220,170,A)', 0.16);
        }
        pool(BLUFFS.club.x + BLUFFS.club.w / 2, BLUFFS.club.y + BLUFFS.club.h + 44, 210, 0.8);
        glow(BLUFFS.club.x + BLUFFS.club.w / 2, BLUFFS.club.y + 40, 130, 'rgba(255,225,180,A)', 0.20);
        for (const dx of BLUFFS.docks) glow(dx, BLUFFS.lakeY + 80, 40, 'rgba(150,200,255,A)', 0.16);  // dock lamps on the water
        // CASSIDY WORKS at night: sodium yard lights — ORANGE, a different town out here —
        // and the union hall's windows, on out of spite, visible from the road
        for (const [yx, yy] of [[2520, 1120], [2900, 1200], [3160, 1360]]) {
          pool(yx, yy, 170, 0.95);
          glow(yx, yy - 40, 40, 'rgba(255,160,60,A)', 0.4);
          glow(yx, yy + 20, 110, 'rgba(255,150,60,A)', 0.12);
        }
        pool(WORKS.hall.x + WORKS.hall.w / 2, WORKS.hall.y + WORKS.hall.h - 20, 110, 0.85);
        glow(WORKS.hall.x + 37, WORKS.hall.y + WORKS.hall.h - 33, 26, 'rgba(255,214,140,A)', 0.4);
        glow(WORKS.hall.x + WORKS.hall.w - 37, WORKS.hall.y + WORKS.hall.h - 33, 26, 'rgba(255,214,140,A)', 0.4);
        pool(WORKS.gate.x + 35, WORKS.gate.y + 40, 100, 0.8);   // the gate shack's bulb
        // DOWNTOWN at night: the Lip's red neon, Vern's gold, the courthouse flag light
        // that stays on for a flag nobody's lowered properly since March
        glow(380, DT_Y.facadeTop - 14 + 16, 110, 'rgba(255,90,80,A)', 0.36);      // Split Lip neon
        pool(380, DT_Y.base + 14, 130, 0.85);
        glow(380, DT_Y.base + 30, 70, 'rgba(255,110,100,A)', 0.14);               // red spill on the walk
        glow(805, DT_Y.facadeTop + 10, 90, 'rgba(255,214,62,A)', 0.26);           // Loanstar gold
        pool(960, 2338, 70, 0.75);                                                 // the flag floodlight
        glow(960, 2330, 40, 'rgba(220,230,255,A)', 0.22);
        // one sodium bulb over each alley mouth: the route has to be findable at night,
        // and a lit doorway you're not supposed to use is its own invitation
        for (const gp of ALLEY_GAPS) {
          const gx = (gp.x1 + gp.x2) / 2;
          pool(gx, STRIP_Y.base - 20, 95, 0.8);
          glow(gx, STRIP_Y.base - 34, 34, 'rgba(255,196,120,A)', 0.34);
        }
        // rain doubles the lights in the wet
        if (g.weather === 'rain') {
          glow(1290, 560, 50, 'rgba(255,170,80,A)', 0.16);
          glow(1960, 560, 56, 'rgba(255,214,62,A)', 0.16);
          glow(250, 660, 70, 'rgba(220,235,255,A)', 0.12);
        }
      }
      // the player carries a little readability with them at night
      if (blockIdx >= 3) pool(g.player.x, g.player.y, 135, 0.62);
    } else if (room === 'gamebarn' && g.gameBarnDark) {
      // flashlight cone during the job
      const p = g.player;
      pool(p.x, p.y, 60, 0.9);
      const fx2 = p.x + Math.cos(p.facing) * 90, fy = p.y + Math.sin(p.facing) * 90;
      pool(fx2, fy, 90, 0.75);
      glow(fx2, fy, 60, 'rgba(255,240,200,A)', 0.10);
    } else if (room === 'foxhole') {
      // The club is a DARK room with three lit islands: the stage, the bar, the door.
      // Everything between them is deliberately murk — that's the whole architecture.
      const it = INTERIORS.foxhole, st = it.stage;
      const beat = 0.5 + 0.5 * Math.sin(this.t * 3.1);
      pool(st.x + st.w / 2, st.y + st.h / 2, 150 + beat * 22, 0.95);
      glow(st.x + st.w / 2, st.y + st.h / 2, 130, 'rgba(255,70,130,A)', 0.24 + beat * 0.12);
      glow(st.x + st.w * 0.42, st.y + 20, 60, 'rgba(190,120,255,A)', 0.18 + (1 - beat) * 0.14);
      pool(it.counter.x + it.counter.w / 2, it.counter.y + 24, 130, 0.8);
      glow(it.counter.x + it.counter.w / 2, it.counter.y + 10, 90, 'rgba(255,170,90,A)', 0.16);
      pool(it.w / 2, it.h - 40, 90, 0.6);                       // the door
      glow(720, 270, 40, 'rgba(120,255,150,A)', 0.10);          // the ATM's little green promise
    } else if (room === 'splitlip') {
      // the Lip: two hanging cones (bar, felt) and a red exit smear. Everything else
      // is the color of a hangover.
      const it = INTERIORS.splitlip;
      pool(it.counter.x + it.counter.w / 2, it.counter.y + 26, 130, 0.85);
      glow(it.counter.x + it.counter.w / 2, it.counter.y, 80, 'rgba(255,180,110,A)', 0.16);
      pool(it.pool.x + it.pool.w / 2, it.pool.y + it.pool.h / 2, 120, 0.9);
      glow(it.pool.x + it.pool.w / 2, it.pool.y + 10, 70, 'rgba(120,220,150,A)', 0.10);
      glow(682, 74, 40, 'rgba(255,60,50,A)', 0.16);                       // bathroom door aura, radioactive
      pool(it.w / 2, it.h - 40, 80, 0.55);
    } else if (room === 'daybreak') {
      // relentlessly, insultingly well-lit. the only room with no shadows to drink in
      const it = INTERIORS.daybreak;
      pool(it.w / 2, it.h / 2, 340, 0.95);
      pool(it.counter.x + it.counter.w / 2, it.counter.y + 20, 200, 1.0);
      glow(it.w / 2, 60, 140, 'rgba(255,240,214,A)', 0.10);
    } else if (room === 'pawn') {
      const it = INTERIORS.pawn;
      pool(it.counter.x + it.counter.w / 2, it.counter.y + 24, 150, this.tubeDim ? 0.55 : 0.85);
      pool(220, 200, 160, 0.6);
      glow(300, 275, 50, 'rgba(180,210,240,A)', 0.10);                    // the ring case, lit like evidence
    } else if (room === 'shop') {
      const it = INTERIORS.shop;
      pool(it.w / 2, it.h / 2, 300, 0.85);
      pool(422, 132, 90, 1.0);                                   // the live bay: hot, blue-white
      glow(422, 132, 70, 'rgba(190,225,255,A)', 0.20 + (this.tubeDim ? 0.10 : 0));
      glow(it.counter.x + 80, it.counter.y, 70, 'rgba(255,190,110,A)', 0.10);
    } else if (room === 'aid') {
      const it = INTERIORS.aid;
      pool(it.w / 2, it.h / 2, 320, this.tubeDim ? 0.72 : 0.92);  // fluorescent, unkind, everywhere
      glow(550, 82, 40, 'rgba(255,80,70,A)', 0.10);
    } else if (room === 'library') {
      const it = INTERIORS.library;
      pool(it.w / 2, it.h / 2, 290, 0.8);
      pool(615, 315, 110, 0.7);                                   // the radiator corner
      glow(615, 315, 80, 'rgba(255,170,90,A)', 0.16);
    } else if (room === 'house') {
      // A dark house you are not supposed to be in. Your own light, the lake's glow,
      // and — if a panel is counting — a red pulse that gets faster as it runs out.
      const it = INTERIORS.house, g2 = this.g;
      pool(g2.player.x, g2.player.y, 105, 0.85);            // you, and one arm's length
      pool(it.w / 2, 30, 300, 0.34);                        // the lake wall, letting in the night
      glow(it.w / 2, 30, 200, 'rgba(120,170,210,A)', 0.13);
      const t = g2.burg ? g2.burg.t : 0;
      if (g2.burg && g2.burg.in && t > 0) {
        const urgency = Math.max(0.6, Math.min(6, 60 / Math.max(1, t)));
        const beat = 0.5 + 0.5 * Math.sin(this.t * 3.4 * urgency);
        glow(it.w - 40, 24, 70, 'rgba(255,50,40,A)', 0.06 + beat * (t < 20 ? 0.24 : 0.10));
      }
    } else if (room === 'unionhall') {
      const it = INTERIORS.unionhall;
      pool(it.w / 2, it.h / 2, 280, this.tubeDim ? 0.7 : 0.9);            // every tube works. Denny replaces them HIMSELF
      glow(it.counter.x + 35, it.counter.y - 16, 30, 'rgba(255,200,120,A)', 0.14); // the urn, warm since 1984
    } else {
      // interiors: warm pools over counters, fluorescent flicker at Wing Barn
      const it = INTERIORS[room];
      if (it.counter) pool(it.counter.x + it.counter.w / 2, it.counter.y + 30, 180, room === 'wingbarn' && this.tubeDim ? 0.5 : 0.85);
      pool(it.w / 2, it.h / 2, 220, 0.6);
    }
    c.drawImage(L, 0, 0);
  }

  // ---------------------------------------------------------------------- //
  //  CHARACTERS — silhouette first, always                                  //
  // ---------------------------------------------------------------------- //

  _drawDude(c, e, isPlayer) {
    const g = this.g;
    const a = ARCHETYPES[isPlayer ? 'average' : (e.arch || 'average')];
    const x = e.x, y = e.y;
    const t = this.t;
    // ART BIBLE: "characters get visibly worse through a run." A hurt toy LIMPS — one
    // leg carries less, the whole body dips on the bad side. Reads at any zoom, unlike
    // the 1.8px black-eye dot that was standing in for injury before.
    const hurtF = isPlayer ? Math.max(0, 1 - e.hp / e.hpMax) : Math.max(0, 1 - e.hp / (e.hpMax0 || 46));
    const limping = hurtF > 0.62;
    const phase = (isPlayer ? t * (limping ? 6.4 : 9) : t * 7 + (e.id || 0)) % (Math.PI * 2);
    const moving = isPlayer ? e.moving : (e.state === 'walk' || e.state === 'flee' || e.state === 'chase' || e.state === 'aggro');
    const step = moving ? Math.sin(phase * 2) : 0;
    const hobble = (limping && moving) ? Math.max(0, Math.sin(phase * 2)) * 3.2 : 0;
    const sway = e.drunk ? Math.sin(t * 2.2 + (e.id || 0)) * 3.4 : 0;
    const breathe = Math.sin(t * 1.6 + (e.id || 0)) * 0.7;
    const H = a.h, tw = a.tw;
    // The player wears the one good year: a varsity jacket, dark body + cream sleeves,
    // still on him at 26. Nobody else in Hopewell has that two-tone shape.
    const shirt = isPlayer ? '#5c2f28' : (e.outfit ? e.outfit.shirt : '#5b7291');
    const armCol = isPlayer ? '#ddd0b4' : shade(shirt, -0.3);
    const pants = isPlayer ? '#3d4c63' : (e.outfit ? e.outfit.pants : '#3d4c63');
    const skin = isPlayer ? '#c99b74' : (e.skin || '#c99b74');

    if (e.ko) { // down, and the lot keeps the story
      c.save(); c.translate(x, y - 6); c.rotate(1.45);
      c.fillStyle = pants; c.fillRect(-H * 0.32, -tw * 0.4, H * 0.34, tw * 0.8);
      c.fillStyle = shirt; c.fillRect(0, -tw * 0.5 - (a.belly ? 2 : 0), H * 0.36, tw + (a.belly || 0));
      c.fillStyle = skin; c.beginPath(); c.arc(H * 0.46, 0, 7, 0, 7); c.fill();
      c.restore();
      return;
    }

    // idle business — nobody in Hopewell stands at attention. View-only, no rng:
    // derived from clock + entity id so it's stable per frame and free of sim state.
    let busy = null, weight = 0;
    if (!moving && !isPlayer && !e.cop && e.state === 'idle') {
      const cyc = (this.t * 0.19 + (e.id || 0) * 0.37) % 1;
      const kind = (e.id || 0) % 3;
      if (cyc < 0.30) busy = kind === 0 ? 'phone' : (kind === 1 ? 'smoke' : 'pockets');
      else if (cyc < 0.36) busy = 'phone';
      weight = Math.sin(this.t * 0.6 + (e.id || 0)) * 1.6; // weight on one hip, then the other
    }

    c.save();
    c.translate(x + sway + weight * 0.5, y + hobble);   // the dip: weight off the bad leg
    const hitK = (e.hitT || 0) > 0 ? Math.sin((e.hitT) * 40) * 2.5 : 0;
    c.translate(hitK, 0);
    const flipX = Math.cos(e.facing || 0) < 0 ? -1 : 1;
    if (limping) c.rotate(flipX * 0.055);               // and a list to one side

    // legs — wide enough to read as legs, with shoes to plant them on the mat
    c.fillStyle = pants;
    const legH = H * 0.42, legW = 5.4;
    const wl = weight > 0 ? Math.abs(weight) * 0.4 : 0, wr = weight < 0 ? Math.abs(weight) * 0.4 : 0;
    const lyL = -legH + wl + Math.max(0, step) * -3, lhL = legH - wl + Math.max(0, step) * 3;
    const lyR = -legH + wr + Math.max(0, -step) * -3, lhR = legH - wr + Math.max(0, -step) * 3;
    const lxL = -tw * 0.28 - legW / 2 - wr * 0.6, lxR = tw * 0.28 - legW / 2 + wl * 0.6;
    c.fillRect(lxL, lyL, legW, lhL);
    c.fillRect(lxR, lyR, legW, lhR);
    c.fillStyle = shade(pants, -0.55);
    c.fillRect(lxL - 0.8, lyL + lhL - 2.6, legW + 1.6, 2.6);
    c.fillRect(lxR - 0.8, lyR + lhR - 2.6, legW + 1.6, 2.6);
    // torso: archetype shape, belly forward of the spine
    const torsoH = H * 0.38, ty = -legH - torsoH;
    c.fillStyle = shirt;
    c.beginPath();
    c.roundRect(-tw / 2 - a.sh / 2, ty + breathe * 0.4, tw + a.sh, torsoH, 5);
    c.fill();
    if (a.belly) { c.beginPath(); c.ellipse(flipX * 2, ty + torsoH * 0.62, tw * 0.42 + a.belly * 0.5, torsoH * 0.4, 0, 0, 7); c.fill(); }
    if (isPlayer) { // the letter patch, and the jacket's cream waistband
      c.fillStyle = '#ddd0b4';
      c.fillRect(-tw / 2 - a.sh / 2, ty + torsoH - 3, tw + a.sh, 3);
      c.fillRect(flipX * 3 - 2, ty + 5, 4, 5);
    }
    // grime patch on workers
    if (!isPlayer && e.pool === 'townie_idle' && (e.id || 0) % 3 === 0) {
      c.fillStyle = 'rgba(30,26,20,0.25)'; c.fillRect(-tw * 0.2, ty + torsoH * 0.5, tw * 0.44, torsoH * 0.3);
    }
    // arms
    c.strokeStyle = armCol; c.lineWidth = 4; c.lineCap = 'round';
    const armY = ty + 5;
    const hand = (hxp, hyp) => { c.fillStyle = skin; c.beginPath(); c.arc(hxp, hyp, 2.1, 0, 7); c.fill(); c.fillStyle = shirt; };
    const swing = moving ? Math.sin(phase * 2) * 6 : breathe;
    // Wind-up must be VISIBLE or the telegraph doesn't exist. Arm cocks back during
    // windT, snaps out during strikeT. This is the whole readability of a fight.
    const windT = isPlayer ? (g.player.windT || 0) : (e.windT || 0);
    const windMax = isPlayer ? T.windUp : T.npcWindUp;
    const striking = (isPlayer ? (g.player.strikeT || 0) : (e.strikeT || 0)) > 0;
    const atk = striking;
    if (windT > 0) {
      const k = 1 - windT / windMax;                       // 0 → 1 across the wind-up
      const fdx = Math.cos(e.facing || 0), fdy = Math.sin(e.facing || 0);
      c.beginPath(); c.moveTo(0, armY);
      c.lineTo(-fdx * (7 + k * 7), armY - fdy * (4 + k * 4) - 3 - k * 3); c.stroke();
      hand(-fdx * (7 + k * 7), armY - fdy * (4 + k * 4) - 3 - k * 3);
      c.beginPath(); c.moveTo(-flipX * tw * 0.42, armY); c.lineTo(-flipX * (tw * 0.42 + 3), armY + 9); c.stroke();
      if (isPlayer && g.player.held) this._drawHeldWeapon(c, g.player.held.kind, -fdx * 0.8, -fdy * 0.8, armY - 4);
    } else if (e.state === 'film') {
      c.beginPath(); c.moveTo(flipX * tw * 0.4, armY); c.lineTo(flipX * (tw * 0.4 + 7), armY - 10); c.stroke();
      c.fillStyle = '#1a1e26'; c.fillRect(flipX * (tw * 0.4 + 4), armY - 17, 6, 10);
      c.fillStyle = 'rgba(180,220,255,0.8)'; c.fillRect(flipX * (tw * 0.4 + 5), armY - 16, 4, 7);
      c.beginPath(); c.moveTo(-flipX * tw * 0.4, armY); c.lineTo(-flipX * (tw * 0.4 + 3), armY + 8); c.stroke();
    } else if (atk) {
      const fdx = Math.cos(e.facing || 0), fdy = Math.sin(e.facing || 0);
      c.beginPath(); c.moveTo(0, armY); c.lineTo(fdx * 18, armY + fdy * 11); c.stroke();
      hand(fdx * 18, armY + fdy * 11);
      c.beginPath(); c.moveTo(-flipX * tw * 0.42, armY); c.lineTo(-flipX * (tw * 0.42 + 2), armY + 7); c.stroke();
      if (isPlayer && g.player.held) this._drawHeldWeapon(c, g.player.held.kind, fdx, fdy, armY);
    } else if (isPlayer && g.player.carryCrate) {
      c.beginPath(); c.moveTo(-tw * 0.42, armY); c.lineTo(-tw * 0.2, armY - 8); c.stroke();
      c.beginPath(); c.moveTo(tw * 0.42, armY); c.lineTo(tw * 0.2, armY - 8); c.stroke();
      c.fillStyle = '#7a6a4a'; c.fillRect(-13, armY - 22, 26, 16);
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.font = 'bold 5px Arial'; c.textAlign = 'center'; c.fillText('FUNSTATION', 0, armY - 12);
    } else if (busy === 'phone') {
      // half this town is looking at a phone at any given moment, and so should it be
      c.beginPath(); c.moveTo(-tw * 0.4, armY); c.lineTo(-tw * 0.17, armY + 2); c.stroke();
      c.beginPath(); c.moveTo(tw * 0.4, armY); c.lineTo(tw * 0.17, armY + 3); c.stroke();
      hand(-tw * 0.17, armY + 2); hand(tw * 0.17, armY + 3);
      c.fillStyle = '#15181f'; c.fillRect(-3.4, armY - 3, 7, 9);      // held at chest, not at the face
      c.fillStyle = 'rgba(190,225,255,0.9)'; c.fillRect(-2.6, armY - 2.2, 5.4, 7.4);
    } else if (busy === 'smoke') {
      c.beginPath(); c.moveTo(-tw * 0.42, armY); c.lineTo(-tw * 0.44, armY + 11); c.stroke();
      c.beginPath(); c.moveTo(tw * 0.42, armY); c.lineTo(tw * 0.1, armY - 11); c.stroke();
      hand(-tw * 0.44, armY + 11); hand(tw * 0.1, armY - 11);
      c.fillStyle = 'rgba(255,140,70,0.9)'; c.fillRect(flipX * 5, armY - 14, 1.6, 1.6);
    } else if (busy === 'pockets') {
      // elbows OUT — thumbs in the belt loops. Reads as a shape, not as armlessness.
      c.beginPath(); c.moveTo(-tw * 0.42, armY); c.lineTo(-tw * 0.62, armY + 7); c.lineTo(-tw * 0.26, armY + 13); c.stroke();
      c.beginPath(); c.moveTo(tw * 0.42, armY); c.lineTo(tw * 0.62, armY + 7); c.lineTo(tw * 0.26, armY + 13); c.stroke();
      hand(-tw * 0.26, armY + 13); hand(tw * 0.26, armY + 13);
    } else {
      c.beginPath(); c.moveTo(-tw * 0.42, armY); c.lineTo(-tw * 0.42 - 1, armY + 11 + swing * 0.4); c.stroke();
      c.beginPath(); c.moveTo(tw * 0.42, armY); c.lineTo(tw * 0.42 + 1, armY + 11 - swing * 0.4); c.stroke();
      hand(-tw * 0.42 - 1, armY + 11 + swing * 0.4); hand(tw * 0.42 + 1, armY + 11 - swing * 0.4);
      if (isPlayer && g.player.held) {
        const fdx = Math.cos(e.facing || 0), fdy = Math.sin(e.facing || 0);
        this._drawHeldWeapon(c, g.player.held.kind, fdx * 0.5, fdy * 0.5, armY + 8);
      }
    }
    // head + hat; slouch pushes it forward, look-at leans it.
    // The head must OVERLAP the torso — a gap reads as a floating balloon, not a person.
    const slouch = a.slouch;
    let lookX = 0;
    if (!isPlayer && !e.static) {
      const d = Math.hypot(g.player.x - e.x, g.player.y - e.y);
      if (d < 150) lookX = Math.sign(g.player.x - e.x) * 1.6;
    }
    const hy = ty - 3.5 + slouch * 0.5 + breathe * 0.5;
    const hx = flipX * (1 + slouch * 0.35) + lookX * 0.6;   // a lean, not a dislocation
    c.fillStyle = shade(skin, -0.22);                       // neck, in shadow under the jaw
    c.fillRect(hx - 2.6, hy, 5.2, 7);
    c.fillStyle = shirt;                                    // collar sits on top of it
    c.beginPath(); c.ellipse(flipX * 1.2, ty + 2, tw * 0.34, 3.4, 0, 0, 7); c.fill();
    c.fillStyle = skin;
    c.beginPath(); c.arc(hx, hy, 6.5, 0, 7); c.fill();
    if (busy === 'phone' && this.g.block >= 2) { // the screen lights the face — the modern campfire
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(150,195,255,0.30)';
      c.beginPath(); c.arc(hx, hy + 2, 5.5, 0, 7); c.fill(); c.restore();
    }
    // The week shows on your face. A 1.8px dot did not survive contact with a real
    // screen; this is a proper shiner with a split lip once you're properly wrecked.
    if (isPlayer && g.player.blackEye) {
      c.fillStyle = 'rgba(64,40,86,0.85)';
      c.beginPath(); c.ellipse(hx + flipX * 2.6, hy - 0.5, 3.4, 2.6, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(120,60,70,0.5)';
      c.beginPath(); c.ellipse(hx + flipX * 2.6, hy + 1.6, 3.0, 1.3, 0, 0, 7); c.fill();
    }
    if (isPlayer && hurtF > 0.55) {   // split lip
      c.fillStyle = 'rgba(150,40,34,0.8)';
      c.fillRect(hx + flipX * 1.2, hy + 3.4, 3, 1.4);
    }
    this._drawHat(c, e.hat || (isPlayer ? 'capBack' : 'none'), hx, hy, flipX, shirt);

    // ── Smokers ───────────────────────────────────────────────────────────────
    // View-only (keys off e.id parity, never sim rng). Half this town is outside at
    // 1 a.m. holding a cigarette, and an ember is the single best night-read detail
    // available: a moving orange pixel that says "a person is standing there."
    if (!isPlayer && !e.cop && !e.ko && (e.id % 3 === 0) && this.g.block >= 2 && !e.static) {
      const drag = (Math.sin(t * 0.55 + e.id) + 1) * 0.5;      // slow raise-to-mouth
      const ex = flipX * (tw * 0.42 + 2), ey = armY + 11 - drag * 13;
      c.strokeStyle = '#e8dcc3'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + flipX * 3.5, ey - 1); c.stroke();
      const hot = 0.5 + drag * 0.5;
      c.fillStyle = `rgba(255,${110 + drag * 60},60,${hot})`;
      c.beginPath(); c.arc(ex + flipX * 4.4, ey - 1.2, 1.1 + drag * 0.5, 0, 7); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(255,140,60,${0.10 + drag * 0.16})`;
      c.beginPath(); c.arc(ex + flipX * 4.4, ey - 1.2, 4.5 + drag * 2.5, 0, 7); c.fill();
      c.restore();
      if (drag > 0.86) {   // exhale
        c.fillStyle = 'rgba(210,208,200,0.10)';
        c.beginPath(); c.ellipse(hx + flipX * 7, hy - 3, 5.5, 3, 0, 0, 7); c.fill();
      }
      c.lineWidth = 4;
    }
    c.restore();
  }

  _drawHeldWeapon(c, kind, fdx, fdy, armY) {
    c.save(); c.translate(fdx * 14, armY + fdy * 8); c.rotate(Math.atan2(fdy, fdx));
    if (kind === 'bottle') { c.fillStyle = 'rgba(120,180,140,0.9)'; c.fillRect(0, -2, 12, 4); c.fillRect(12, -1, 4, 2); }
    if (kind === 'chair') { c.fillStyle = '#8a8276'; c.fillRect(0, -6, 14, 12); c.strokeStyle = '#8a8276'; c.strokeRect(2, -8, 10, 14); }
    if (kind === 'cue') { c.strokeStyle = '#c9a86a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-4, 0); c.lineTo(26, 0); c.stroke(); }
    if (kind === 'sign') { c.fillStyle = '#f6f3ee'; c.fillRect(2, -7, 16, 11); c.strokeStyle = '#8a9096'; c.strokeRect(2, -7, 16, 11); c.strokeStyle = '#c9b28a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(2, 0); c.stroke(); }
    if (kind === 'crowbar') { c.strokeStyle = '#c04848'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(16, 0); c.stroke(); c.beginPath(); c.arc(17, -2, 3, 0, 3); c.stroke(); }
    c.restore();
  }

  _drawHat(c, hat, hx, hy, flipX, shirt) {
    if (hat === 'none' || hat === 'bald') return;
    if (hat === 'cap') { c.fillStyle = '#3d4c63'; c.beginPath(); c.arc(hx, hy - 2.5, 6, Math.PI, 0); c.fill(); c.fillRect(hx - 1 + flipX * 1, hy - 3.4, flipX * 8, 2); }
    else if (hat === 'capBack') { c.fillStyle = '#9c3d2e'; c.beginPath(); c.arc(hx, hy - 2.5, 6, Math.PI, 0); c.fill(); c.fillRect(hx - flipX * 9, hy - 3.4, flipX * 7, 2); }
    else if (hat === 'trucker') { c.fillStyle = '#e8dcc3'; c.beginPath(); c.arc(hx, hy - 3, 6.2, Math.PI, 0); c.fill(); c.fillStyle = '#2e4632'; c.fillRect(hx - 6, hy - 4.5, 12, 2.4); c.fillStyle = '#e8dcc3'; c.fillRect(hx + flipX * 1, hy - 3.6, flipX * 8, 2); }
    else if (hat === 'beanie') { c.fillStyle = '#4c5741'; c.beginPath(); c.arc(hx, hy - 2, 6.4, Math.PI * 1.05, -0.05); c.fill(); }
    else if (hat === 'hoodie') { c.fillStyle = shirt; c.beginPath(); c.arc(hx, hy - 1, 8, Math.PI * 0.95, Math.PI * 2.05); c.fill(); c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(hx + flipX * 1.5, hy, 4.5, 0, 7); c.fill(); }
    else if (hat === 'copHat') { c.fillStyle = '#22293a'; c.fillRect(hx - 7, hy - 5, 14, 3); c.beginPath(); c.arc(hx, hy - 4, 5, Math.PI, 0); c.fill(); c.fillStyle = '#c9a227'; c.fillRect(hx - 1.5, hy - 6.5, 3, 2); }
    else if (hat === 'visor') { c.fillStyle = '#c9302a'; c.fillRect(hx - 6, hy - 4, 12, 2.2); c.fillRect(hx + flipX * 2, hy - 4, flipX * 7, 2); }
    else if (hat === 'curlers') { c.fillStyle = '#c48ab8'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(hx + i * 3.6, hy - 5, 2, 0, 7); c.fill(); } }
    else if (hat === 'ponytail') { c.fillStyle = '#3a2e22'; c.beginPath(); c.arc(hx, hy - 2, 6.6, Math.PI, 0); c.fill(); c.fillRect(hx - flipX * 8, hy - 2, flipX * 4, 8); }
    else if (hat === 'bun') { c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(hx, hy - 2, 6.4, Math.PI, 0); c.fill(); c.beginPath(); c.arc(hx, hy - 7, 2.6, 0, 7); c.fill(); }
  }

  _drawItem(c, kind, x, y, flying = false) {
    if (kind === 'bottle') { c.fillStyle = 'rgba(120,180,140,0.9)'; c.fillRect(x - 6, y - 4, 12, 5); c.fillRect(x + 6, y - 3, 4, 3); }
    if (kind === 'chair') { c.fillStyle = '#8a8276'; c.fillRect(x - 8, y - 12, 16, 12); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.strokeRect(x - 8, y - 12, 16, 12); }
    if (kind === 'cue') { c.strokeStyle = '#c9a86a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y - 3); c.stroke(); c.lineWidth = 1; }
    if (kind === 'sign') { c.fillStyle = '#f6f3ee'; c.fillRect(x - 9, y - 14, 18, 12); c.strokeStyle = '#8a9096'; c.strokeRect(x - 9, y - 14, 18, 12); c.fillStyle = '#2a2e33'; c.font = 'bold 4px Arial'; c.textAlign = 'center'; c.fillText('DAYBREAK', x, y - 7); }
    if (kind === 'crowbar') { c.strokeStyle = '#c04848'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 7, y - 2); c.stroke(); c.lineWidth = 1; }
  }

  _drawBark(c, b) {
    const alpha = Math.min(1, b.t * 4, (b.dur - b.t) * 2);
    if (alpha <= 0) return;
    const x = b.x || this.g.player.x, y = (b.y || this.g.player.y) - 74;
    c.globalAlpha = alpha;
    const words = b.text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) { if ((cur + w).length > 30) { lines.push(cur); cur = w + ' '; } else cur += w + ' '; }
    lines.push(cur.trim());
    const lw = Math.max(...lines.map(l => l.length)) * 4.6 + 16;
    const lh = lines.length * 11 + (b.who ? 12 : 6);
    c.fillStyle = 'rgba(20,18,22,0.88)';
    c.beginPath(); c.roundRect(x - lw / 2, y - lh, lw, lh, 5); c.fill();
    c.strokeStyle = 'rgba(232,220,195,0.25)'; c.stroke();
    c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x, y + 5); c.fill();
    c.textAlign = 'center';
    if (b.who) { c.fillStyle = '#ffb347'; c.font = 'bold 8px Georgia'; c.fillText(b.who.toUpperCase(), x, y - lh + 10); }
    c.fillStyle = '#e8dcc3'; c.font = '9px Georgia';
    lines.forEach((l, i) => c.fillText(l, x, y - lh + (b.who ? 20 : 12) + i * 11));
    c.globalAlpha = 1;
  }

  shotDataURL() { return this.cv.toDataURL('image/png'); }
}
