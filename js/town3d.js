// VICTORY LAP — town3d.js
// Everything EXTERIOR: the painted ground, the facades with their real signs, the
// props, the landmark set. All CODE here is hand-written; the DRESSING it
// interprets (layouts-town data below) was transcribed from what render.js
// actually paints, so both views describe the same town.
//
// ⚠️ SIGN TEXT IS ALLOWED HERE and nowhere near generated art: ART_BIBLE.md bans
// baked type in AI plates because the game sets its own type — these canvas
// textures ARE the game setting its own type, same letters the 2D signs carry.

import * as THREE from '../lib/three.module.js';
import { WORLD, STRIP_Y, DT_Y, RAIL_Y, GARAGE, FOXHOLE, WATER_TOWER, WORKS, BLUFFS, HTCC, FLATS, COURTHOUSE } from './game.js';

const _mats = new Map();
// ⚠️⚠️ STANDARD, NOT LAMBERT. Lambert is 100% matte — it has no specular term
// AT ALL, so nothing in this game could ever catch a highlight and every surface
// read as painted cardboard. That is the single biggest reason the town looked
// flatter than the three.js demos it gets compared to.
// ⚠️ ROUGHNESS STAYS HIGH (0.88) ON PURPOSE. The art bible's identity is chunky
// flat-colour low-poly; the goal is a WHISPER of specular that tells you which
// way a face is turned, not shiny plastic. Gloss is bought back deliberately,
// per material, for the handful of things that are actually glossy (car paint,
// glass, metal) — see the roughness overrides at those call sites.
// ⚠️ envMapIntensity is 0.35, not 1. A full-strength environment washes the flat
// colours toward the sky tint and the palette stops being the palette.
const SURF = { roughness: 0.88, metalness: 0.0, envMapIntensity: 0.35 };

function mat(hex, opts = {}) {
  const key = hex + '|' + JSON.stringify(opts);
  if (_mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshStandardMaterial({ color: hex, ...SURF, ...opts });
  _mats.set(key, m);
  return m;
}
const _box = new THREE.BoxGeometry(1, 1, 1);
function B(g, w, h, d, hex, x, y, z) {
  const m = new THREE.Mesh(_box, mat(hex));
  m.scale.set(w, h, d); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m); return m;
}
function CYL(g, r0, r1, h, hex, x, y, z, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat(hex));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  g.add(m); return m;
}
const hx = (c, fb) => { try { return new THREE.Color(c || fb).getHex(); } catch { return new THREE.Color(fb).getHex(); } };

// ---------------------------------------------------------------------------
// THE GROUND CANVAS — one 2048px painting of the whole town floor, mirroring
// the rects the 2D painter lays down. Roads get centre dashes, lots get stalls,
// the rail gets ties. ⚠️ Painted ONCE at build; nothing per-frame touches it.
// ---------------------------------------------------------------------------
function paintGround(D) {
  const cv = document.createElement('canvas');
  cv.width = 2048; cv.height = Math.round(2048 * WORLD.h / WORLD.w);
  const c = cv.getContext('2d');
  const sx = cv.width / WORLD.w, sy = cv.height / WORLD.h;
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x * sx, y * sy, w * sx, h * sy); };

  // ⚠️ SEEDED, not Math.random. This canvas is painted once per page load, so a
  // random one means every stain, crack and oil patch in Hopewell MOVES between
  // sessions — the town would never look like the same town twice. Same argument
  // as the interior grime, and it matters more outdoors because you see more of it.
  let h0 = 0x9c3d2e;
  const rnd = () => { h0 ^= h0 << 13; h0 ^= h0 >>> 17; h0 ^= h0 << 5; return ((h0 >>> 0) % 100000) / 100000; };

  R(0, 0, WORLD.w, WORLD.h, '#3f5138');                       // grass base
  // gentle mottling so the grass is a lawn, not a swatch
  for (let i = 0; i < 900; i++) {
    const x = rnd() * WORLD.w, y = rnd() * WORLD.h;
    R(x, y, 40 + rnd() * 90, 30 + rnd() * 70,
      ['rgba(46,70,50,0.16)', 'rgba(90,105,70,0.10)', 'rgba(60,80,56,0.12)'][i % 3]);
  }
  // bare dirt where grass loses: verges, desire lines, the edges of every lot
  for (let i = 0; i < 130; i++) {
    const x = rnd() * WORLD.w, y = rnd() * WORLD.h, w = 30 + rnd() * 150;
    R(x, y, w, 14 + rnd() * 40, 'rgba(107,95,76,' + (0.10 + rnd() * 0.22).toFixed(2) + ')');
  }
  for (const p of D.patches || []) R(p.x, p.y, p.w, p.h, p.c || '#6b5f4c');
  for (const l of D.lots || []) {
    R(l.x, l.y, l.w, l.h, l.c || '#43404a');
    if (l.stripes) {                                          // faded stall stripes
      c.strokeStyle = 'rgba(200,190,160,0.28)'; c.lineWidth = Math.max(1, 2 * sx);
      const step = 58;
      if (l.stripes === 'v') for (let x = l.x + step; x < l.x + l.w; x += step) {
        c.beginPath(); c.moveTo(x * sx, l.y * sy); c.lineTo(x * sx, (l.y + Math.min(80, l.h)) * sy); c.stroke();
      }
      else for (let y = l.y + step; y < l.y + l.h; y += step) {
        c.beginPath(); c.moveTo(l.x * sx, y * sy); c.lineTo((l.x + Math.min(80, l.w)) * sx, y * sy); c.stroke();
      }
    }
  }
  for (const s of D.sidewalks || []) R(s.x, s.y, s.w, s.h, s.c || '#8c8880');
  for (const r of D.roads || []) {
    R(r.x, r.y, r.w, r.h, r.c || '#35323a');
    if (r.dashes !== false) {                                 // centre line dashes
      c.fillStyle = 'rgba(220,205,160,0.5)';
      const horiz = r.w >= r.h, mid = horiz ? r.y + r.h / 2 : r.x + r.w / 2;
      if (horiz) for (let x = r.x + 20; x < r.x + r.w; x += 90) c.fillRect(x * sx, (mid - 2) * sy, 44 * sx, 4 * sy);
      else for (let y = r.y + 20; y < r.y + r.h; y += 90) c.fillRect((mid - 2) * sx, y * sy, 4 * sx, 44 * sy);
    }
  }
  for (const w of D.crosswalks || []) {                       // zebra bars
    c.fillStyle = 'rgba(220,210,180,0.55)';
    for (let x = w.x; x < w.x + w.w; x += 26) c.fillRect(x * sx, w.y * sy, 14 * sx, w.h * sy);
  }
  // ── WEAR ─────────────────────────────────────────────────────────────────
  // ⚠️ Painted AFTER the roads and lots so it lands ON the asphalt, and BEFORE
  // the rail so the spur still reads cleanly. The 2D game has a whole wear
  // canvas (scuffs, scorches, litter drifted against every curb); this is the
  // static half of that, and it is what stops the Mile reading as fresh-poured.
  const paved = [].concat(D.roads || [], D.lots || []);
  for (const p of paved) {
    // oil drips and dead-car stains, thickest in the lots
    const drips = Math.round((p.w * p.h) / 26000) + 3;
    for (let i = 0; i < drips; i++) {
      const x = p.x + rnd() * p.w, y = p.y + rnd() * p.h, r = (5 + rnd() * 16);
      const g2 = c.createRadialGradient(x * sx, y * sy, 0, x * sx, y * sy, r * sx);
      g2.addColorStop(0, 'rgba(10,9,12,' + (0.20 + rnd() * 0.22).toFixed(2) + ')');
      g2.addColorStop(1, 'rgba(10,9,12,0)');
      c.fillStyle = g2; c.beginPath(); c.arc(x * sx, y * sy, r * sx, 0, 6.284); c.fill();
    }
    // cracks: thin pale lines that wander, the way frost heave actually breaks tar
    // ⚠️ SHORT and FAINT. The first pass drew 7-segment wanders at 0.16 alpha
    // across whole lots and they read as SCRIBBLES, not cracks — a drawn line
    // announces itself, a crack has to be found. Four short segments at 0.09.
    const cracks = Math.round((p.w * p.h) / 60000) + 1;
    for (let i = 0; i < cracks; i++) {
      let x = p.x + rnd() * p.w, y = p.y + rnd() * p.h;
      c.strokeStyle = 'rgba(150,144,132,0.09)'; c.lineWidth = Math.max(1, 1.1 * sx);
      c.beginPath(); c.moveTo(x * sx, y * sy);
      for (let k = 0; k < 4; k++) {
        x += (rnd() - 0.5) * 40; y += (rnd() - 0.5) * 28;
        c.lineTo(x * sx, y * sy);
      }
      c.stroke();
    }
    // ⚠️ Tyre scuff: SHORT arcs only. Full sweeps at r 26–66 rendered as drawn
    // circles on the tarmac — the eye reads a complete circle as a mark somebody
    // made, never as wear. A 0.5–1.2 rad slice reads as a turn.
    for (let i = 0; i < 2; i++) {
      const x = p.x + rnd() * p.w, y = p.y + rnd() * p.h;
      const a0 = rnd() * 6.28;
      c.strokeStyle = 'rgba(16,14,18,0.13)'; c.lineWidth = Math.max(1, 3 * sx);
      c.beginPath(); c.arc(x * sx, y * sy, (20 + rnd() * 26) * sx, a0, a0 + 0.5 + rnd() * 0.7); c.stroke();
    }
  }
  // litter drifts against the kerb — the 2D view piles it at every hard edge
  for (const s of D.sidewalks || []) {
    // ⚠️ a painted stripe is not a kerb — see the raised geometry below. This is
    // only the shadow line where the concrete meets the road.
    R(s.x, s.y + s.h - 2, s.w, 2, 'rgba(0,0,0,0.22)');
    for (let i = 0; i < 26; i++) {
      const x = s.x + rnd() * s.w, y = s.y + (rnd() > 0.5 ? -2 : s.h + 1);
      c.fillStyle = ['rgba(232,220,195,0.30)', 'rgba(156,61,46,0.24)', 'rgba(107,95,76,0.30)'][i % 3];
      c.fillRect(x * sx, y * sy, (2 + rnd() * 5) * sx, (2 + rnd() * 3) * sy);
    }
  }

  if (D.rail) {                                               // the spur: ties then rails
    const { y, x0 = 0, x1 = WORLD.w } = D.rail;
    c.fillStyle = '#4a4038';
    for (let x = x0; x < x1; x += 34) c.fillRect(x * sx, (y - 14) * sy, 20 * sx, 28 * sy);
    c.fillStyle = '#6a625a';
    c.fillRect(x0 * sx, (y - 9) * sy, (x1 - x0) * sx, 4 * sy);
    c.fillRect(x0 * sx, (y + 5) * sy, (x1 - x0) * sx, 4 * sy);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// SIGNS — the real shop names, canvas-lettered like the 2D signs.
// ---------------------------------------------------------------------------
function signTexture(text, bg, fg = '#e8dcc3') {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 96;
  const c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, 512, 96);
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 6; c.strokeRect(3, 3, 506, 90);
  c.fillStyle = fg;
  c.font = 'bold 52px Impact, "Arial Black", sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  let t = String(text || '');
  while (c.measureText(t).width > 470 && c.font.includes('52')) { c.font = c.font.replace('52', '38'); }
  if (c.measureText(t).width > 470) t = t.slice(0, 22);
  c.fillText(t, 256, 52);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// PROPS — 22 chunky builders. `pole` entries are strung with lines in array
// order, which is why the transcriber was told order matters.
// ---------------------------------------------------------------------------
const PROPS = {
  pump(g, p) {
    B(g, 16, 34, 12, '#9c3d2e', p.x, 17, p.y);
    B(g, 12, 8, 4, '#e8dcc3', p.x, 26, p.y + 5);
    B(g, 60, 4, 40, '#8c8880', p.x, 0.6, p.y);                // the island
    B(g, 8, 90, 8, '#6a6560', p.x - 30, 45, p.y - 8);         // canopy post
  },
  dumpster(g, p) {
    B(g, 44, 26, 26, hx(p.c, '#3d5a48'), p.x, 13, p.y);
    B(g, 46, 4, 28, '#2c4438', p.x, 28, p.y);
  },
  busShelter(g, p) {
    B(g, 70, 4, 26, '#6a6560', p.x, 52, p.y);
    for (const dx of [-32, 32]) B(g, 4, 50, 4, '#6a6560', p.x + dx, 26, p.y - 10);
    B(g, 66, 30, 3, '#aec8cc', p.x, 30, p.y - 12);
    B(g, 50, 12, 14, '#8a5a33', p.x, 10, p.y + 4);            // the bench
  },
  couch(g, p) {
    B(g, 62, 15, 26, hx(p.c, '#5b7291'), p.x, 10, p.y);
    B(g, 62, 20, 9, hx(p.c, '#5b7291'), p.x, 20, p.y - 9);
    B(g, 9, 18, 26, hx(p.c, '#4c5f7a'), p.x - 27, 16, p.y);
    B(g, 9, 18, 26, hx(p.c, '#4c5f7a'), p.x + 27, 16, p.y);
  },
  hydrant(g, p) { CYL(g, 5, 6, 16, '#9c3d2e', p.x, 8, p.y, 8); B(g, 8, 4, 8, '#9c3d2e', p.x, 18, p.y); },
  pole(g, p, prev) {
    CYL(g, 3, 3.6, 130, '#5a5148', p.x, 65, p.y, 6);
    B(g, 34, 3, 3, '#5a5148', p.x, 122, p.y);
    if (prev) {                                                // sagging line to the last pole
      const dx = p.x - prev.x, dz = p.y - prev.y;
      const len = Math.hypot(dx, dz);
      const line = B(g, len, 1.2, 1.2, '#2c2a30', (p.x + prev.x) / 2, 116, (p.y + prev.y) / 2);
      line.rotation.y = -Math.atan2(dz, dx);
      line.castShadow = false;
    }
  },
  car(g, p) {
    const c = hx(p.c, '#5b7291');
    const grp = new THREE.Group();
    // ⚠️ the ONE thing on this street anybody waxes. Car paint is a clearcoat
    // over a non-metal base, so metalness stays 0 and the gloss comes from
    // roughness — 0.35 catches the sun down the length of the body, which is
    // what makes a row of parked cars read as cars and not as coloured boxes.
    const paint = mat(c, { roughness: 0.35, envMapIntensity: 0.8 });
    const body = new THREE.Mesh(_box, paint); body.scale.set(74, 18, 34); body.position.set(0, 14, 0);
    body.castShadow = true; body.receiveShadow = true; grp.add(body);
    const cab = new THREE.Mesh(_box, paint); cab.scale.set(44, 14, 30); cab.position.set(-4, 28, 0);
    cab.castShadow = true; cab.receiveShadow = true; grp.add(cab);
    const gh = new THREE.Mesh(_box, mat('#22303c', { roughness: 0.1, metalness: 0.1, envMapIntensity: 1.2 }));
    gh.scale.set(40, 10, 27); gh.position.set(-4, 30, 0);
    gh.castShadow = true; grp.add(gh);                         // glasshouse
    for (const [dx, dz] of [[-24, -17], [24, -17], [-24, 17], [24, 17]]) {
      const w = CYL(grp, 7, 7, 5, '#1c1c20', dx, 7, dz, 10);
      w.rotation.x = Math.PI / 2;
    }
    grp.position.set(p.x, 0, p.y);
    grp.rotation.y = p.rot || 0;
    g.add(grp);
  },
  planter(g, p) { B(g, 26, 14, 26, '#8c8880', p.x, 7, p.y); B(g, 18, 16, 18, '#2e4632', p.x, 22, p.y); },
  crossbuck(g, p) {
    CYL(g, 2.5, 2.5, 70, '#e8dcc3', p.x, 35, p.y, 6);
    const a = B(g, 40, 6, 2, '#e8dcc3', p.x, 62, p.y); a.rotation.z = 0.6;
    const b = B(g, 40, 6, 2, '#e8dcc3', p.x, 62, p.y); b.rotation.z = -0.6;
  },
  mailbox(g, p) { B(g, 10, 8, 16, hx(p.c, '#5b7291'), p.x, 24, p.y); B(g, 3, 20, 3, '#6d5a4a', p.x, 10, p.y); },
  barrel(g, p) { CYL(g, 9, 9, 24, hx(p.c, '#6a5a48'), p.x, 12, p.y, 9); },
  bench(g, p) { B(g, 44, 4, 14, '#8a5a33', p.x, 14, p.y); B(g, 44, 14, 3, '#8a5a33', p.x, 24, p.y - 6); },
  tree(g, p) {
    // the four authored trees, built to the same two-blob recipe as the canopy
    const r = p.r || 26;
    CYL(g, 4, 6, 34, '#54402f', p.x, 17, p.y, 7);
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(hx(p.c, '#2e4632')));
    m.position.set(p.x, 34 + r * 0.62, p.y); m.scale.set(1, 0.86, 1); m.castShadow = true;
    g.add(m);
    const m2 = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.68, 0), mat('#3a573a'));
    m2.position.set(p.x + r * 0.3, 34 + r * 1.06, p.y - r * 0.22); m2.castShadow = true;
    g.add(m2);
  },
  flag(g, p) {
    CYL(g, 1.8, 1.8, 110, '#b8b4ac', p.x, 55, p.y, 6);
    // half-mast on purpose — nobody remembers the reason (the 2D courthouse joke)
    B(g, 22, 13, 1, '#9c3d2e', p.x + 12, 74, p.y);
  },
  sign(g, p) {
    CYL(g, 2.5, 2.5, 90, '#6a6560', p.x, 45, p.y, 6);
    if (p.sign) {
      const tex = signTexture(p.sign, p.signC || '#8a5a33');
      const m = new THREE.Mesh(_box, new THREE.MeshStandardMaterial({ map: tex, ...SURF }));
      m.scale.set(54, 16, 3); m.position.set(p.x, 84, p.y); m.castShadow = true;
      g.add(m);
    } else B(g, 44, 20, 3, hx(p.signC, '#8a5a33'), p.x, 82, p.y);
  },
  cone(g, p) { CYL(g, 1.5, 6, 14, '#d96a2a', p.x, 7, p.y, 7); },
  tire(g, p) { const t = CYL(g, 10, 10, 7, '#1c1c20', p.x, 5, p.y, 10); t.rotation.x = Math.PI / 2; },
  bags(g, p) { for (let i = 0; i < 3; i++) B(g, 14 - i * 2, 12 - i * 2, 14 - i * 2, '#2c2c30', p.x + (i - 1) * 10, 6 - i, p.y + (i % 2) * 6); },
  pallet(g, p) { B(g, 40, 5, 40, '#8a6a44', p.x, 2.5, p.y); },
  crate(g, p) { B(g, 22, 18, 22, hx(p.c, '#8a6a44'), p.x, 9, p.y); },
};


// ---------------------------------------------------------------------------
// THE CANOPY
// Hopewell had FOUR trees in 3400x3200 units of Illinois. That is why every
// wide shot read as a diorama: no verticals, nothing organic, and nothing at
// all to break the horizontal of a street.
//
// ⚠️ INSTANCED, NOT 170 MESHES. three.js issues one draw call per Mesh, so a
// canopy built the obvious way would have added ~500 calls of pure scenery to a
// town that draws in 282. Seven InstancedMeshes cover every tree in the game.
// ⚠️ Their bounding spheres MUST be recomputed after the matrices are written —
// an InstancedMesh keeps the stale unit sphere it was constructed with, and the
// whole canopy pops out of existence the moment the camera leaves the origin.
// Exactly the bug the rain had.
//
// ⚠️ A TREE LINE, NOT A FOREST. Trees are view-only — the sim has never heard of
// one — so a trunk standing in open ground is a lie you walk straight through.
// Placement is therefore biased hard toward EDGES: verges, property lines, lot
// perimeters, the lake shore, the rail. That also happens to be what a
// rust-belt town looks like from above. Trees follow the lines people drew and
// the middle of everything stays open.
// ---------------------------------------------------------------------------
const CANOPY = {
  target: 190,          // candidates that survive; the real count lands near this
  spacing: 34,          // no two trunks closer than this
  bark: '#54402f',
  leaf: ['#2e4632', '#3a573a', '#43522c', '#6b5f2c'],   // three greens and one turning
  pine: '#24402e',
  dead: '#6b5f4c',
};

function buildCanopy(D) {
  const grp = new THREE.Group();

  // ── the no-tree map ──────────────────────────────────────────────────────
  // ⚠️ D.patches are NOT obstacles. They are ground-colour bands, and four of
  // them are 3400 wide — treating them as blockers excludes most of the county.
  // Only surfaces you drive, park or walk on block a tree, plus real footprints.
  const no = [];
  const push = (r, pad) => {
    if (!r || !(r.w > 0) || !(r.h > 0)) return;
    no.push({ x0: r.x - pad, z0: r.y - pad, x1: r.x + r.w + pad, z1: r.y + r.h + pad });
  };
  for (const r of D.roads || []) push(r, 8);
  for (const r of D.lots || []) push(r, 8);
  for (const r of D.sidewalks || []) push(r, 5);
  for (const r of D.crosswalks || []) push(r, 5);
  push({ x: 0, y: RAIL_Y - 34, w: WORLD.w, h: 68 }, 0);               // the spur
  push({ x: 0, y: BLUFFS.lakeY - 6, w: WORLD.w, h: WORLD.h }, 0);     // the lake says no
  // every building footprint, padded generously so nothing grows through a wall
  for (const b of D.mile || []) push({ x: b.x, y: STRIP_Y.roofTop, w: b.w, h: STRIP_Y.base - STRIP_Y.roofTop }, 30);
  for (const b of D.downtown || []) push({ x: b.x, y: DT_Y.roofTop, w: b.w, h: DT_Y.base - DT_Y.roofTop }, 30);
  for (const v of D.vacants || []) push({ x: v.x, y: (v.y > 1700 ? DT_Y.roofTop : STRIP_Y.roofTop), w: v.w || 150, h: 300 }, 30);
  for (const h of FLATS.houses || []) push(h, 26);
  for (const h of BLUFFS.houses || []) push({ x: h.x, y: h.y, w: h.w || 210, h: h.h || 150 }, 26);
  for (const b of HTCC.buildings || []) push({ x: b.x, y: b.y, w: b.w || 260, h: b.h || 120 }, 30);
  push(HTCC.quad, 0); push(HTCC.lot, 8);
  push(BLUFFS.club, 26); push(COURTHOUSE, 40); push(GARAGE, 26); push(FOXHOLE, 26);
  push(WORKS.plant, 40); push(WORKS.hall, 26); push(WORKS.yard, 10); push(WORKS.gate, 20);
  push({ x: WATER_TOWER.x - 90, y: WATER_TOWER.y - 90, w: 180, h: 180 }, 0);

  // distance from a point to the nearest blocked rect (0 = standing in one)
  function edgeDist(x, z) {
    let best = 1e9;
    for (const r of no) {
      const dx = Math.max(r.x0 - x, 0, x - r.x1);
      const dz = Math.max(r.z0 - z, 0, z - r.z1);
      const d = Math.hypot(dx, dz);
      if (d < best) best = d;
      if (best === 0) return 0;
    }
    return best;
  }

  // ── the scatter ──────────────────────────────────────────────────────────
  let h0 = 0x5eed7a11;
  const rnd = () => { h0 ^= h0 << 13; h0 ^= h0 >>> 17; h0 ^= h0 << 5; return ((h0 >>> 0) % 100000) / 100000; };
  const trees = [];
  const cell = CANOPY.spacing, grid = new Map();
  const gk = (x, z) => ((x / cell) | 0) + ',' + ((z / cell) | 0);
  function crowded(x, z) {
    const gx = (x / cell) | 0, gz = (z / cell) | 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const c = grid.get((gx + i) + ',' + (gz + j));
      if (c) for (const t of c) if (Math.hypot(t.x - x, t.z - z) < CANOPY.spacing) return true;
    }
    return false;
  }
  for (let tries = 0; tries < 22000 && trees.length < CANOPY.target; tries++) {
    const x = 20 + rnd() * (WORLD.w - 40), z = 20 + rnd() * (WORLD.h - 40);
    const d = edgeDist(x, z);
    if (d < 14) continue;                                  // in or hard against something
    // ⚠️ THE EDGE BIAS. Close to a line somebody drew: almost always yes. Out in
    // the open middle of a field: almost never. This one curve is the whole
    // difference between "a town with trees" and "a town in a forest".
    const p = d < 95 ? 0.92 : d < 190 ? 0.22 : 0.05;
    if (rnd() > p) continue;
    if (crowded(x, z)) continue;
    let kind = 'broad';
    if (z > BLUFFS.roadY) kind = rnd() < 0.55 ? 'pine' : 'broad';        // lakeside
    else if (x > 2200 && z < 1500) kind = rnd() < 0.55 ? 'dead' : 'broad'; // the Works
    else if (Math.abs(z - RAIL_Y) < 150) kind = rnd() < 0.45 ? 'dead' : 'broad';
    const t = { x, z, kind, s: 0.75 + rnd() * 0.6, r: rnd(), r2: rnd(), r3: rnd() };
    trees.push(t);
    const k = gk(x, z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(t);
  }

  // ── build the buckets ────────────────────────────────────────────────────
  const dummy = new THREE.Object3D();
  const buckets = [];
  function bucket(geo, hex, n, shadow = true) {
    const m = new THREE.InstancedMesh(geo, mat(hex), n);
    m.castShadow = shadow; m.receiveShadow = false; m.count = 0;
    buckets.push(m); grp.add(m);
    return m;
  }
  const put = (m, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
    dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix(); m.setMatrixAt(m.count++, dummy.matrix);
  };
  const gCyl = new THREE.CylinderGeometry(1, 1, 1, 6);
  const gBlob = new THREE.IcosahedronGeometry(1, 0);
  const gCone = new THREE.ConeGeometry(1, 1, 7);

  const nB = trees.filter(t => t.kind === 'broad').length;
  const nP = trees.filter(t => t.kind === 'pine').length;
  const nD = trees.filter(t => t.kind === 'dead').length;
  const trunk = bucket(gCyl, CANOPY.bark, trees.length);
  const leaves = CANOPY.leaf.map(c => bucket(gBlob, c, nB * 2 + 4));
  const pine = bucket(gCone, CANOPY.pine, Math.max(1, nP * 2));
  const branch = bucket(_box, CANOPY.dead, Math.max(1, nD * 5));

  for (const t of trees) {
    const s = t.s;
    if (t.kind === 'pine') {
      put(trunk, t.x, 9 * s, t.z, 3.4 * s, 18 * s, 3.4 * s);
      put(pine, t.x, (18 + 26) * s, t.z, 20 * s, 52 * s, 20 * s);
      put(pine, t.x, (18 + 54) * s, t.z, 13 * s, 38 * s, 13 * s);
    } else if (t.kind === 'dead') {
      // ⚠️ a dead tree is a SILHOUETTE — the whole read is the branch angles, so
      // it gets four splayed boxes and no blob at all. The Works and the rail
      // are the only places in town that get them; a dead tree on a lawn just
      // looks like a bug.
      put(trunk, t.x, 24 * s, t.z, 3.2 * s, 48 * s, 3.2 * s);
      for (let i = 0; i < 4; i++) {
        const a = t.r * 6.28 + i * 1.57, ln = (16 + t.r2 * 12) * s;
        put(branch, t.x + Math.cos(a) * ln * 0.4, (40 + i * 5) * s, t.z + Math.sin(a) * ln * 0.4,
          ln, 2.2 * s, 2.2 * s, 0, -a, 0.5 + t.r3 * 0.3);
      }
    } else {
      put(trunk, t.x, 17 * s, t.z, 3.8 * s, 34 * s, 3.8 * s);
      // ⚠️ ONE ball on a stick is a lollipop. Two overlapping blobs at different
      // heights, radii and tints is a tree — the offset is what makes a canopy
      // read as foliage instead of a sphere.
      const base = t.r < 0.14 ? 3 : (t.r * 3) | 0;         // ~14% turn in autumn
      const r0 = (20 + t.r2 * 10) * s;
      put(leaves[base], t.x, (34 + r0 * 0.62), t.z, r0, r0 * 0.86, r0);
      const r1 = r0 * (0.62 + t.r3 * 0.22);
      put(leaves[(base + 1) % 4 === 3 ? base : (base + 1) % 4],
        t.x + (t.r3 - 0.5) * r0 * 0.9, 34 + r0 * 0.62 + r0 * 0.42, t.z + (t.r - 0.5) * r0 * 0.9,
        r1, r1 * 0.9, r1);
    }
  }
  // ⚠️ THE LINE THAT KEEPS THE CANOPY ON SCREEN. Without it every bucket keeps
  // the unit bounding sphere it was born with and frustum culling deletes the
  // lot the moment the camera is more than a metre from the origin.
  for (const m of buckets) { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }
  grp.userData.treeCount = trees.length;
  return grp;
}

// ---------------------------------------------------------------------------
// THE SKYLINE — rooftop plant
// ⚠️ ROOFS ARE THE LARGEST SURFACE IN THIS GAME AND THEY WERE BLANK. The camera
// is a raised three-quarter, so a downtown frame shows more roof than facade,
// and every one of them was a single unbroken slab of #2a2730. Everything that
// makes an American roof read is bolted to the top of it: a stair penthouse, a
// couple of HVAC units, vent stacks, a dish somebody put up in 2004.
// Deterministic per building key, so a shop's roof is its own roof forever.
// ---------------------------------------------------------------------------
function roofDress(g, x, w, zC, depth, top, key, tall) {
  let h = 2166136261;
  const k = String(key || x);
  for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return (h % 100000) / 100000; };
  const x0 = x + 26, x1 = x + w - 26, z0 = zC - depth / 2 + 24, z1 = zC + depth / 2 - 24;
  if (x1 - x0 < 34 || z1 - z0 < 24) return;
  const px = () => x0 + rnd() * (x1 - x0), pz = () => z0 + rnd() * (z1 - z0);

  if (rnd() < 0.75) {                                       // the stairwell penthouse
    const bx = px(), bz = pz(), bw = 34 + rnd() * 22, bd = 26 + rnd() * 14;
    B(g, bw, 26, bd, '#494339', bx, top + 13, bz);
    B(g, bw + 6, 4, bd + 6, '#37322b', bx, top + 28, bz);
    B(g, 13, 19, 3, '#241f1a', bx, top + 9.5, bz + bd / 2 + 1);
  }
  for (let i = 0, n = 1 + ((rnd() * 3) | 0); i < n; i++) {   // HVAC
    const bx = px(), bz = pz();
    B(g, 26 + rnd() * 16, 13, 20 + rnd() * 10, '#8a867e', bx, top + 6.5, bz);
    B(g, 15, 3, 15, '#63605a', bx, top + 14.5, bz);
  }
  for (let i = 0, n = 2 + ((rnd() * 4) | 0); i < n; i++) {   // vent stacks
    const bx = px(), bz = pz(), vh = 10 + rnd() * 18;
    CYL(g, 2.8, 2.8, vh, '#9a958c', bx, top + vh / 2, bz, 6);
    CYL(g, 5, 5, 3, '#767068', bx, top + vh + 1.5, bz, 6);
  }
  if (rnd() < 0.4) {                                         // the dish
    const bx = px(), bz = pz();
    CYL(g, 1.8, 1.8, 14, '#63605a', bx, top + 7, bz, 5);
    const d = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 2, 10), mat('#c3bdb0'));
    d.position.set(bx, top + 16, bz); d.rotation.x = 1.02; d.castShadow = true; g.add(d);
  }
  if (tall && rnd() < 0.55) {                                // the water tank
    const bx = px(), bz = pz();
    for (const [dx, dz] of [[-9, -9], [9, -9], [-9, 9], [9, 9]])
      B(g, 4, 20, 4, '#5a5148', bx + dx, top + 10, bz + dz);
    CYL(g, 14, 14, 26, '#7a6a58', bx, top + 33, bz, 9);
    CYL(g, 14, 6, 9, '#63523f', bx, top + 50.5, bz, 9);
  }
}

// ---------------------------------------------------------------------------
export function buildTown(D) {
  const g = new THREE.Group();
  const nightWindows = [];       // {mesh, lateOpen} for setNight
  const signMeshes = [];

  // ground: the painted world plane + a plain oversized surround under it
  const groundTex = paintGround(D);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w, WORLD.h),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.96, metalness: 0, envMapIntensity: 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(WORLD.w / 2, 0.5, WORLD.h / 2);
  ground.receiveShadow = true;
  g.add(ground);
  const surround = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w * 3, WORLD.h * 3), mat(0x35452f));
  surround.rotation.x = -Math.PI / 2;
  surround.position.set(WORLD.w / 2, -0.4, WORLD.h / 2);
  surround.receiveShadow = true;
  g.add(surround);

  // ── KERBS ────────────────────────────────────────────────────────────────
  // ⚠️ Real geometry, not a painted stripe. A 6-unit lip is the single cheapest
  // thing that makes a street read as a STREET: it catches the raking morning and
  // evening sun and lays a hard line all the way down the Mile, which is exactly
  // the edge the flat painted ground was missing.
  for (const s of D.sidewalks || []) {
    const walk = new THREE.Mesh(_box, mat(0x8c8880));
    walk.scale.set(s.w, 6, s.h);
    walk.position.set(s.x + s.w / 2, 3, s.y + s.h / 2);
    walk.receiveShadow = true; walk.castShadow = true;
    g.add(walk);
  }

  // ── facades ──────────────────────────────────────────────────────────────
  // ⚠️ depth convention: a strip building's interior box sits NORTH of its
  // baseline; the face (glass, sign, door) hangs on the +z side, toward the
  // street the baseline names. Same for downtown at DT_Y.
  // ⚠️ DELIBERATE 3D-ONLY DIVERGENCE, and the reason matters. The mined data
  // gives Main Street ONE wall colour (#7a7062) for all seven buildings — the 2D
  // painter falls through to a single facade tone, which is fine seen flat and
  // top-down. In 3D you see whole volumes in a row and it reads as one grey
  // hangar. An old main street is varied BY CONSTRUCTION: every building went up
  // in a different decade for a different owner. Deterministic per key, drawn
  // from the palette, so it is stable and never fights the town's colour.
  const MAINST = ['#7a4436', '#8a6a4a', '#6d6255', '#94705a', '#7a7062', '#5f5a52', '#8a7a62'];
  function mainStreetWall(b, i) {
    if (b.wall && b.wall.toLowerCase() !== '#7a7062') return b.wall;   // respect real data
    let h = 0; const k = b.key || String(i);
    for (let j = 0; j < k.length; j++) h = (h * 31 + k.charCodeAt(j)) >>> 0;
    return MAINST[h % MAINST.length];
  }

  function facade(b, baseZ, h, depth, opts = {}) {
    const wall = hx(b.wall, opts.wallFb || '#7a4436');
    const x = b.x, w = b.w;
    B(g, w - 6, h, depth, wall, x + w / 2, h / 2, baseZ - depth / 2 + depth);   // body
    B(g, w, 16, depth + 8, '#2a2730', x + w / 2, h + 8, baseZ + depth / 2);     // parapet
    // ⚠️ the parapet is a SOLID box, so its top face IS the roof — which is why
    // every roof in town was one slab of near-black. A tar-and-gravel deck inset
    // inside it gives the parapet a lip to cast onto and the roof a colour.
    const deckY = h + 16;
    B(g, w - 11, 3, depth - 3, '#4c473f', x + w / 2, deckY + 1.5, baseZ + depth / 2);
    roofDress(g, x, w, baseZ + depth / 2, depth, deckY + 3, b.key || ('f' + x), h > 200);
    // storefront glass — dead units get plywood instead
    const glassW = w * 0.66, glassH = h * 0.34;
    if (b.boarded) {
      B(g, glassW, glassH, 4, '#6d5a4a', x + w / 2, glassH / 2 + 8, baseZ + depth + 1);
      for (let i = 0; i < 3; i++) B(g, glassW, 5, 5, '#5a4a3a', x + w / 2, 14 + i * glassH * 0.36, baseZ + depth + 3);
    } else {
      const glass = new THREE.Mesh(_box, new THREE.MeshStandardMaterial({ color: 0x22303c, roughness: 0.12, metalness: 0.1, envMapIntensity: 1.1 }));
      glass.scale.set(glassW, glassH, 4);
      glass.position.set(x + w / 2, glassH / 2 + 8, baseZ + depth + 1);
      g.add(glass);
      nightWindows.push({ mesh: glass, lateOpen: !!opts.lateOpen });
    }
    // ── DEPTH ────────────────────────────────────────────────────────────
    // ⚠️ A facade was body + parapet + sign + a flat glass rectangle, and it read
    // as a SLAB with stickers. What makes a storefront a building is the stuff
    // that sticks OUT of it and catches its own shadow: a bulkhead under the
    // glass, an awning over it, a step at the door, a cornice at the roof. Five
    // boxes each, and the row stops being a wall.
    const face = baseZ + depth;
    // bulkhead: the low panel every shopfront sits its glass on
    B(g, glassW + 14, 12, 6, '#2f2822', x + w / 2, 6, face + 2);
    // awning over the glass — canvas in the shop's own sign colour, angled out
    if (!b.boarded && w > 90) {
      const aw = new THREE.Mesh(_box, mat(hx(b.signC, '#8a5a33')));
      aw.scale.set(Math.min(w * 0.78, 200), 3.5, 26);
      aw.position.set(x + w / 2, glassH + 20, face + 12);
      aw.rotation.x = -0.34;
      aw.castShadow = true; g.add(aw);
      // the two rods that hold it
      for (const s of [-1, 1]) B(g, 2, 16, 2, '#4a4238', x + w / 2 + s * Math.min(w * 0.36, 92), glassH + 12, face + 3);
    }
    // the door, offset like the 2D face block when it has one
    const dx0 = x + w * (b.doorAt || 0.5);
    B(g, 26, 44, 3, '#3a2c1c', dx0, 22, face + 2);
    B(g, 34, 5, 3, '#6a6058', dx0, 45, face + 3.5);          // lintel
    B(g, 34, 4, 12, '#8c8880', dx0, 2, face + 7);            // the step you stand on
    // cornice: a lip and a shadow line at the top, the thing that dates a building
    if (opts.cornice) {
      B(g, w + 6, 7, depth + 14, '#4a423a', x + w / 2, h - 4, baseZ + depth / 2 + 4);
      B(g, w + 2, 3, depth + 8, '#5f564a', x + w / 2, h - 12, baseZ + depth / 2 + 2);
    }
    // the sign band with the REAL name
    if (b.sign) {
      const tex = signTexture(b.sign, b.signC || '#8a5a33');
      const sm = new THREE.Mesh(_box, new THREE.MeshStandardMaterial({ map: tex, ...SURF }));
      sm.scale.set(Math.min(w * 0.8, 190), 24, 5);
      sm.position.set(x + w / 2, h * 0.72, baseZ + depth + 2.5);
      sm.castShadow = true;
      g.add(sm);
      signMeshes.push(sm);
    }
    // upper-storey windows for tall downtown fronts
    const storeys = opts.storeys || 1;
    for (let s = 1; s < storeys; s++) {
      const wy = h * 0.42 + s * (h * 0.5 / storeys);
      for (let i = 0; i < Math.max(2, Math.floor(w / 60)); i++) {
        const wm = new THREE.Mesh(_box, new THREE.MeshStandardMaterial({ color: 0x1c2836, roughness: 0.14, metalness: 0.1, envMapIntensity: 1.0 }));
        wm.scale.set(20, 26, 2);
        wm.position.set(x + 34 + i * (w - 60) / Math.max(1, Math.floor(w / 60) - 1), wy, baseZ + depth + 1);
        g.add(wm);
        nightWindows.push({ mesh: wm, lateOpen: false, dim: true });
      }
    }
  }

  const LATE_OPEN = new Set(['qwikstop', 'cashking']);
  for (const b of D.mile || []) facade(b, STRIP_Y.base - 150, 190, 150, { lateOpen: LATE_OPEN.has(b.key) });
  (D.downtown || []).forEach((b, i) => facade({ ...b, wall: mainStreetWall(b, i) },
    DT_Y.base - 170, 170 + (b.storeys > 2 ? 120 : b.storeys > 1 ? 60 : 0), 170,
    { storeys: b.storeys || 2, wallFb: '#6d4436', cornice: true }));
  for (const v of D.vacants || []) facade({ x: v.x, w: v.w || 120, wall: '#5f544a', boarded: true }, (v.y > 1700 ? DT_Y.base - 170 : STRIP_Y.base - 150), v.y > 1700 ? 200 : 180, v.y > 1700 ? 170 : 150, {});

  // courthouse: stone block, four columns, pediment, the half-mast flag
  // ⚠️ The courthouse was ONE 210-tall box with four columns floating on its face
  // and the "pediment" stranded halfway up it — the civic centre of Downtown
  // rendering as a grey shoebox. A classical front is a STACK: plinth, steps,
  // columns, entablature, then the pediment ON TOP of them. Build it in that
  // order and it reads at any angle.
  const CH = D.courthouse || COURTHOUSE;
  if (CH && CH.w) {
    const cw = CH.w, cd = CH.h || 200, cx = CH.x + cw / 2, cz = CH.y + cd / 2;
    const bodyH = 150, front = CH.y + cd;
    B(g, cw + 16, 14, cd + 16, '#7e766a', cx, 7, cz);                 // plinth
    B(g, cw, bodyH, cd, '#8c8474', cx, 14 + bodyH / 2, cz);           // body
    // window bays down the long face — a civic building is mostly windows
    for (let i = 0; i < Math.floor(cw / 52); i++) {
      const wx = CH.x + 34 + i * 52;
      B(g, 18, 46, 3, '#2a3038', wx, 96, front + 1);
      B(g, 22, 4, 4, '#a89f8e', wx, 121, front + 2);                  // window head
    }
    // the portico: three steps, four columns, entablature, then the pediment
    for (let s = 0; s < 3; s++)
      B(g, cw * 0.52 + s * 14, 6, 12 + s * 7, '#b0a898', cx, 3 + (2 - s) * 6, front + 8 + s * 4);
    for (let i = 0; i < 4; i++)
      CYL(g, 7.5, 7.5, 104, '#c0b8a6', CH.x + cw * 0.28 + i * cw * 0.148, 70, front + 16, 10);
    B(g, cw * 0.56, 16, 26, '#b8b0a0', cx, 130, front + 16);          // entablature
    // ⚠️ The pediment was a 3-sided CylinderGeometry rotated (π/2, 0, π/2) and it
    // rendered as a VERTICAL BLADE stabbing up through the roof — Euler order
    // XYZ turns two stacked right-angle turns into something you did not ask
    // for. Five stacked boxes make the same triangle, cannot be rotated wrong,
    // and match the chunky house style. Reach for a rotation only when a stack
    // genuinely cannot express the shape.
    for (let s = 0; s < 5; s++) {
      B(g, cw * 0.56 * (1 - s * 0.18), 7, 26, '#c0b8a6', cx, 142 + s * 7, front + 16);
    }
    B(g, cw + 10, 8, cd + 10, '#6f675c', cx, bodyH + 18, cz);         // cornice
    PROPS.flag(g, { x: cx + cw * 0.42, y: front + 30 });
  }

  // ── the landmark set (from live data, not the transcription) ─────────────
  function house(x, z, w, d, wallHex, trimHex, h = 110) {
    B(g, w, h, d, hx(wallHex, '#7a6a58'), x + w / 2, h / 2, z + d / 2);
    const roofR = Math.hypot(w, d) / 2;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofR * 0.42 + 26, 4), mat(hx(trimHex, '#9c5a4a')));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x + w / 2, h + (roofR * 0.42 + 26) / 2, z + d / 2);
    roof.castShadow = true; g.add(roof);
    // ⚠️ a pyramid roof with nothing on it reads as a TENT. One chimney breaks
    // the silhouette, and it has to out-reach the slope it stands on — the apex
    // is h + roofR*0.42 + 26, so a short stub just disappears inside the cone.
    const chx = x + w * 0.7, chz = z + d * 0.42;
    B(g, 15, 62, 13, hx(wallHex, '#7a6a58'), chx, h + 31, chz);
    B(g, 19, 5, 17, '#4a443c', chx, h + 64, chz);
    B(g, 22, 40, 4, hx(trimHex, '#9c5a4a'), x + w / 2, 20, z + d + 1);
    const win = new THREE.Mesh(_box, new THREE.MeshStandardMaterial({ color: 0x1c2836, roughness: 0.14, metalness: 0.1, envMapIntensity: 1.0 }));
    win.scale.set(18, 16, 3); win.position.set(x + w * 0.24, 62, z + d + 1);
    g.add(win);
    nightWindows.push({ mesh: win, lateOpen: false, warm: true });
  }
  for (const h of FLATS.houses) house(h.x, h.y, h.w, h.h, h.wall, h.trim);
  for (const h of (BLUFFS.houses || [])) house(h.x, h.y, h.w || 210, h.h || 150, h.wall || '#8a7f6d', h.trim || '#43506b', 150);
  for (const b of (HTCC.buildings || [])) {
    const w = b.w || 260, d = b.h || 120;
    B(g, w, 130, d, '#a89778', b.x + w / 2, 65, b.y + d / 2);
    B(g, w - 10, 3, d - 10, '#4c473f', b.x + w / 2, 131.5, b.y + d / 2);
    roofDress(g, b.x, w, b.y + d / 2, d, 133, b.key || 'htcc', true);
    for (let i = 0; i < Math.floor(w / 40); i++)
      B(g, 8, 60, 3, '#2c3844', b.x + 24 + i * 40, 60, b.y + d + 1);
  }
  if (WORKS.plant) {
    const p = WORKS.plant;
    // sawtooth sheds instead of one slab
    const teeth = 4, tw = p.w / teeth;
    for (let i = 0; i < teeth; i++) {
      B(g, tw - 6, 200, p.h, '#7a4436', p.x + tw * i + tw / 2, 100, p.y + p.h / 2);
      const rf = B(g, tw - 6, 60, p.h, '#5f3a30', p.x + tw * i + tw / 2, 230, p.y + p.h / 2);
      rf.rotation.z = 0.18;
    }
    for (const s of (WORKS.stacks || [])) CYL(g, 20, 26, 420, '#6d4a3e', s.x, 210, s.y, 10);
    // perimeter chain-link: thin translucent panels on posts
    const f = { x0: p.x - 60, x1: p.x + p.w + 40, z0: p.y - 50, z1: p.y + p.h + 90 };
    for (let x = f.x0; x <= f.x1; x += 90) CYL(g, 1.6, 1.6, 40, '#6a6560', x, 20, f.z1, 5);
    const fence = new THREE.Mesh(_box, new THREE.MeshStandardMaterial({ color: 0x8c9498, transparent: true, opacity: 0.28, roughness: 0.4, metalness: 0.7, envMapIntensity: 0.6 }));
    fence.scale.set(f.x1 - f.x0, 36, 1.5); fence.position.set((f.x0 + f.x1) / 2, 20, f.z1);
    g.add(fence);
  }
  if (WATER_TOWER) {
    const t = WATER_TOWER;
    CYL(g, 66, 66, 96, '#c9b28a', t.x, 330, t.y, 12);
    CYL(g, 66, 40, 30, '#b8a078', t.x, 393, t.y, 12);
    for (const [dx, dz] of [[-40, -40], [40, -40], [-40, 40], [40, 40]]) {
      B(g, 8, 290, 8, '#5a5148', t.x + dx, 145, t.y + dz);
      const brace = B(g, 6, 110, 6, '#5a5148', t.x + dx * 0.5, 60, t.y + dz * 0.5);
      brace.rotation.z = dx > 0 ? 0.5 : -0.5;
    }
  }
  if (GARAGE) house(GARAGE.x, GARAGE.y, GARAGE.w || 220, GARAGE.h || 180, '#7a6a58', '#9c5a4a');
  if (FOXHOLE && FOXHOLE.w) {
    B(g, FOXHOLE.w, 150, FOXHOLE.h, '#3d3640', (FOXHOLE.x || 0) + FOXHOLE.w / 2, 75, (FOXHOLE.y || 0) + FOXHOLE.h / 2);
    const sm = new THREE.Mesh(_box, new THREE.MeshStandardMaterial({ map: signTexture('THE FOXHOLE', '#1c1620', '#d98fb0'), ...SURF }));
    sm.scale.set(120, 22, 4);
    sm.position.set((FOXHOLE.x || 0) + FOXHOLE.w / 2, 120, (FOXHOLE.y || 0) + FOXHOLE.h + 2);
    g.add(sm); signMeshes.push(sm);
  }

  // ── props ────────────────────────────────────────────────────────────────
  let prevPole = null;
  for (const p of D.props || []) {
    const fn = PROPS[p.kind];
    if (!fn) continue;
    try {
      if (p.kind === 'pole') { fn(g, p, prevPole); prevPole = p; }
      else fn(g, p);
    } catch (e) { console.error('prop failed', p.kind, e.message); }
  }

  // ── the canopy, last, off the same D everything else was built from ──────
  const canopy = buildCanopy(D);
  g.add(canopy);

  // ── night switching: 0 day · 1 evening (everything glows) · 2 late ──────
  // ⚠️ Exactly TWO window materials exist, both shared: day glass and lit glass.
  // The first draft made a NEW emissive material per window per call — an
  // ON→ON transition (evening→late for the open-late pair) leaked one material
  // per window per stage change, and disposing per-window materials that other
  // meshes might share is exactly the destructive-probe trap from the toybox.
  // Shared + never disposed = no churn, no risk. Dim homes reuse the lit
  // material; the intensity difference wasn't worth a third texture bind.
  const glassDay = mat(0x22303c, { roughness: 0.12, metalness: 0.1, envMapIntensity: 1.1 });
  // ⚠️ emissiveIntensity is pushed WELL past 1 now. Under ACES a value of 0.9
  // maps to a dull cream rectangle; the tone map's shoulder is what makes an
  // emissive read as a LIGHT rather than a light-coloured card, and it only
  // engages above 1. These are also the surfaces the bloom pass will key off.
  const glassLit = new THREE.MeshStandardMaterial({
    color: 0xffcf8e, emissive: 0xff9f4e, emissiveIntensity: 2.4, roughness: 0.3, metalness: 0 });
  const glassDim = new THREE.MeshStandardMaterial({
    color: 0x8a7a5e, emissive: 0xc97a3e, emissiveIntensity: 1.15, roughness: 0.4, metalness: 0 });
  function setNight(stage) {
    for (const w of nightWindows) {
      const on = stage === 1 || (stage === 2 && w.lateOpen);
      const dimHome = stage > 0 && w.warm;                 // houses keep one light on
      w.mesh.material = on ? (w.dim ? glassDim : glassLit) : dimHome ? glassDim : glassDay;
    }
    for (const s of signMeshes) {
      s.material.emissive = s.material.emissive || new THREE.Color();
      s.material.emissive.setHex(stage > 0 ? 0xffffff : 0x000000);
      s.material.emissiveIntensity = stage > 0 ? 0.5 : 0;
      s.material.emissiveMap = stage > 0 ? s.material.map : null;
      s.material.needsUpdate = true;
    }
  }

  return { group: g, setNight };
}
