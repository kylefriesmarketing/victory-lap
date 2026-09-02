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
import { WORLD, STRIP_Y, DT_Y, GARAGE, FOXHOLE, WATER_TOWER, WORKS, BLUFFS, HTCC, FLATS, COURTHOUSE } from './game.js';

const _mats = new Map();
function mat(hex, opts = {}) {
  const key = hex + '|' + JSON.stringify(opts);
  if (_mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshLambertMaterial({ color: hex, ...opts });
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

  R(0, 0, WORLD.w, WORLD.h, '#3f5138');                       // grass base
  // gentle mottling so the grass is a lawn, not a swatch
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * WORLD.w, y = Math.random() * WORLD.h;
    R(x, y, 40 + Math.random() * 90, 30 + Math.random() * 70,
      ['rgba(46,70,50,0.16)', 'rgba(90,105,70,0.10)', 'rgba(60,80,56,0.12)'][i % 3]);
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
    B(grp, 74, 18, 34, c, 0, 14, 0);
    B(grp, 44, 14, 30, c, -4, 28, 0);
    B(grp, 40, 10, 27, '#22303c', -4, 30, 0);                  // glasshouse
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
    const r = p.r || 26;
    CYL(g, 4, 6, 34, '#5a4432', p.x, 17, p.y, 7);
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(hx(p.c, '#2e4632')));
    m.position.set(p.x, 34 + r * 0.7, p.y); m.castShadow = true;
    g.add(m);
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
      const m = new THREE.Mesh(_box, new THREE.MeshLambertMaterial({ map: tex }));
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
export function buildTown(D) {
  const g = new THREE.Group();
  const nightWindows = [];       // {mesh, lateOpen} for setNight
  const signMeshes = [];

  // ground: the painted world plane + a plain oversized surround under it
  const groundTex = paintGround(D);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w, WORLD.h),
    new THREE.MeshLambertMaterial({ map: groundTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(WORLD.w / 2, 0.5, WORLD.h / 2);
  ground.receiveShadow = true;
  g.add(ground);
  const surround = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w * 3, WORLD.h * 3), mat(0x35452f));
  surround.rotation.x = -Math.PI / 2;
  surround.position.set(WORLD.w / 2, -0.4, WORLD.h / 2);
  surround.receiveShadow = true;
  g.add(surround);

  // ── facades ──────────────────────────────────────────────────────────────
  // ⚠️ depth convention: a strip building's interior box sits NORTH of its
  // baseline; the face (glass, sign, door) hangs on the +z side, toward the
  // street the baseline names. Same for downtown at DT_Y.
  function facade(b, baseZ, h, depth, opts = {}) {
    const wall = hx(b.wall, opts.wallFb || '#7a4436');
    const x = b.x, w = b.w;
    B(g, w - 6, h, depth, wall, x + w / 2, h / 2, baseZ - depth / 2 + depth);   // body
    B(g, w, 16, depth + 8, '#2a2730', x + w / 2, h + 8, baseZ + depth / 2);     // parapet
    // storefront glass — dead units get plywood instead
    const glassW = w * 0.66, glassH = h * 0.34;
    if (b.boarded) {
      B(g, glassW, glassH, 4, '#6d5a4a', x + w / 2, glassH / 2 + 8, baseZ + depth + 1);
      for (let i = 0; i < 3; i++) B(g, glassW, 5, 5, '#5a4a3a', x + w / 2, 14 + i * glassH * 0.36, baseZ + depth + 3);
    } else {
      const glass = new THREE.Mesh(_box, new THREE.MeshLambertMaterial({ color: 0x22303c }));
      glass.scale.set(glassW, glassH, 4);
      glass.position.set(x + w / 2, glassH / 2 + 8, baseZ + depth + 1);
      g.add(glass);
      nightWindows.push({ mesh: glass, lateOpen: !!opts.lateOpen });
    }
    // the door, offset like the 2D face block when it has one
    B(g, 26, 44, 3, '#3a2c1c', x + w * (b.doorAt || 0.5), 22, baseZ + depth + 2);
    // the sign band with the REAL name
    if (b.sign) {
      const tex = signTexture(b.sign, b.signC || '#8a5a33');
      const sm = new THREE.Mesh(_box, new THREE.MeshLambertMaterial({ map: tex }));
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
        const wm = new THREE.Mesh(_box, new THREE.MeshLambertMaterial({ color: 0x1c2836 }));
        wm.scale.set(20, 26, 2);
        wm.position.set(x + 34 + i * (w - 60) / Math.max(1, Math.floor(w / 60) - 1), wy, baseZ + depth + 1);
        g.add(wm);
        nightWindows.push({ mesh: wm, lateOpen: false, dim: true });
      }
    }
  }

  const LATE_OPEN = new Set(['qwikstop', 'cashking']);
  for (const b of D.mile || []) facade(b, STRIP_Y.base - 150, 190, 150, { lateOpen: LATE_OPEN.has(b.key) });
  for (const b of D.downtown || []) facade(b, DT_Y.base - 170, 170 + (b.storeys > 2 ? 120 : b.storeys > 1 ? 60 : 0), 170, { storeys: b.storeys || 2, wallFb: '#6d4436' });
  for (const v of D.vacants || []) facade({ x: v.x, w: v.w || 120, wall: '#5f544a', boarded: true }, (v.y > 1700 ? DT_Y.base - 170 : STRIP_Y.base - 150), v.y > 1700 ? 200 : 180, v.y > 1700 ? 170 : 150, {});

  // courthouse: stone block, four columns, pediment, the half-mast flag
  const CH = D.courthouse || COURTHOUSE;
  if (CH && CH.w) {
    B(g, CH.w, 210, CH.h || 200, '#8c8474', CH.x + CH.w / 2, 105, CH.y + (CH.h || 200) / 2);
    for (let i = 0; i < 4; i++)
      CYL(g, 7, 7, 96, '#b8b0a0', CH.x + CH.w * 0.2 + i * CH.w * 0.2, 48, CH.y + (CH.h || 200) + 12, 8);
    B(g, CH.w * 0.9, 26, 20, '#a89f8e', CH.x + CH.w / 2, 128, CH.y + (CH.h || 200) + 8);
    PROPS.flag(g, { x: CH.x + CH.w / 2, y: CH.y + (CH.h || 200) + 46 });
  }

  // ── the landmark set (from live data, not the transcription) ─────────────
  function house(x, z, w, d, wallHex, trimHex, h = 110) {
    B(g, w, h, d, hx(wallHex, '#7a6a58'), x + w / 2, h / 2, z + d / 2);
    const roofR = Math.hypot(w, d) / 2;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofR * 0.42 + 26, 4), mat(hx(trimHex, '#9c5a4a')));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x + w / 2, h + (roofR * 0.42 + 26) / 2, z + d / 2);
    roof.castShadow = true; g.add(roof);
    B(g, 22, 40, 4, hx(trimHex, '#9c5a4a'), x + w / 2, 20, z + d + 1);
    const win = new THREE.Mesh(_box, new THREE.MeshLambertMaterial({ color: 0x1c2836 }));
    win.scale.set(18, 16, 3); win.position.set(x + w * 0.24, 62, z + d + 1);
    g.add(win);
    nightWindows.push({ mesh: win, lateOpen: false, warm: true });
  }
  for (const h of FLATS.houses) house(h.x, h.y, h.w, h.h, h.wall, h.trim);
  for (const h of (BLUFFS.houses || [])) house(h.x, h.y, h.w || 210, h.h || 150, h.wall || '#8a7f6d', h.trim || '#43506b', 150);
  for (const b of (HTCC.buildings || [])) {
    const w = b.w || 260, d = b.h || 120;
    B(g, w, 130, d, '#a89778', b.x + w / 2, 65, b.y + d / 2);
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
    const fence = new THREE.Mesh(_box, new THREE.MeshLambertMaterial({ color: 0x8c9498, transparent: true, opacity: 0.28 }));
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
    const sm = new THREE.Mesh(_box, new THREE.MeshLambertMaterial({ map: signTexture('THE FOXHOLE', '#1c1620', '#d98fb0') }));
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

  // ── night switching: 0 day · 1 evening (everything glows) · 2 late ──────
  // ⚠️ Exactly TWO window materials exist, both shared: day glass and lit glass.
  // The first draft made a NEW emissive material per window per call — an
  // ON→ON transition (evening→late for the open-late pair) leaked one material
  // per window per stage change, and disposing per-window materials that other
  // meshes might share is exactly the destructive-probe trap from the toybox.
  // Shared + never disposed = no churn, no risk. Dim homes reuse the lit
  // material; the intensity difference wasn't worth a third texture bind.
  const glassDay = mat(0x22303c);
  const glassLit = new THREE.MeshLambertMaterial({
    color: 0xffcf8e, emissive: 0xff9f4e, emissiveIntensity: 0.9 });
  const glassDim = new THREE.MeshLambertMaterial({
    color: 0x8a7a5e, emissive: 0xc97a3e, emissiveIntensity: 0.4 });
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
