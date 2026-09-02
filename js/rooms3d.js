// VICTORY LAP — rooms3d.js
// The sixteen interiors, in 3D. ARCHITECTURE RULE: all CODE here is hand-written
// interpreter + builder vocabulary; the per-room LAYOUTS are pure data mined from
// the 2D painter (render.js) so both views furnish the same rooms. A layout can
// only reference vocabulary kinds — an unknown kind logs once and is skipped, so
// bad data degrades to sparse furniture, never to a crash inside a door.
//
// ⚠️ COORDINATES ARE SIM ROOM COORDINATES: x right, y down (→ world z), origin at
// the room's top-left, exactly as game.js positions the player and the NPCs who
// live here. The camera looks from +z (south), so the "front" wall is omitted.

import * as THREE from '../lib/three.module.js';

const _box = new THREE.BoxGeometry(1, 1, 1);
const _mats = new Map();
function mat(hex, emissive) {
  const key = hex + '|' + (emissive || 0);
  if (_mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshLambertMaterial({ color: hex });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 0.85; }
  _mats.set(key, m);
  return m;
}
function B(g, w, h, d, hex, x, y, z, emissive) {
  const m = new THREE.Mesh(_box, mat(hex, emissive));
  m.scale.set(w, h, d); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m); return m;
}
function CYL(g, r, h, hex, x, y, z, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(hex));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  g.add(m); return m;
}
const hx = (c, fb) => { try { return new THREE.Color(c || fb).getHex(); } catch { return new THREE.Color(fb).getHex(); } };

// ---------------------------------------------------------------------------
// THE VOCABULARY. Each builder gets (group, item, roomH) where item is
// { kind, x, y, w, d, c, ... } in room coordinates; y here is the ROOM y (depth),
// which becomes world z. Builders convert to centre-based placement themselves.
// Sizes fall back to sane furniture defaults so thin spec data still furnishes.
// ---------------------------------------------------------------------------
const V = {
  counter(g, it) { // service counter: slab + face panel
    const w = it.w || 200, d = it.d || 40, c = hx(it.c, '#6d4a2a');
    B(g, w, 34, d, c, it.x + w / 2, 17, it.y + d / 2);
    B(g, w, 4, d + 6, 0x8a6a44, it.x + w / 2, 36, it.y + d / 2);
  },
  bar(g, it) { // taller, darker, with a foot rail
    const w = it.w || 260, d = it.d || 36, c = hx(it.c, '#4a3220');
    B(g, w, 40, d, c, it.x + w / 2, 20, it.y + d / 2);
    B(g, w, 3, d + 8, 0x2c1f14, it.x + w / 2, 42, it.y + d / 2);
    B(g, w, 3, 3, 0x8a8478, it.x + w / 2, 8, it.y + d + 6);
  },
  backbar(g, it) { // shelves of bottles against a wall
    const w = it.w || 220, c = hx(it.c, '#3a2c1c');
    B(g, w, 90, 14, c, it.x + w / 2, 60, it.y + 7);
    for (let i = 0; i < Math.floor(w / 22); i++)
      B(g, 6, 16, 6, [0x4a6a52, 0x8a5a33, 0xc9a227, 0x5b7291][i % 4], it.x + 14 + i * 22, 96, it.y + 7);
  },
  shelf(g, it) { // retail gondola with stocked bands
    const w = it.w || 150, d = it.d || 26, c = hx(it.c, '#7a6a58');
    B(g, w, 58, d, c, it.x + w / 2, 29, it.y + d / 2);
    B(g, w - 8, 8, d - 4, 0xc9a227, it.x + w / 2, 46, it.y + d / 2);
    B(g, w - 8, 8, d - 4, 0x9c3d2e, it.x + w / 2, 26, it.y + d / 2);
  },
  cooler(g, it) { // glass-door drinks cooler, lit
    const w = it.w || 120, c = hx(it.c, '#c8d8dc');
    B(g, w, 92, 24, 0x8c8880, it.x + w / 2, 46, it.y + 12);
    B(g, w - 10, 70, 3, c, it.x + w / 2, 52, it.y + 24, 0x9fc8d8);
  },
  table(g, it) {
    const w = it.w || 44, d = it.d || 44, c = hx(it.c, '#8a5a33');
    B(g, w, 4, d, c, it.x + w / 2, 26, it.y + d / 2);
    CYL(g, 3, 26, 0x4a3a28, it.x + w / 2, 13, it.y + d / 2, 6);
  },
  stool(g, it) {
    CYL(g, 7, 4, hx(it.c, '#9c3d2e'), it.x, 24, it.y, 8);
    CYL(g, 2, 22, 0x5a5148, it.x, 11, it.y, 6);
  },
  chair(g, it) {
    B(g, 16, 3, 16, hx(it.c, '#6d5a4a'), it.x, 14, it.y);
    B(g, 16, 18, 3, hx(it.c, '#6d5a4a'), it.x, 24, it.y - 7);
  },
  booth(g, it) { // diner booth: two benches + table
    const w = it.w || 70, d = it.d || 54, c = hx(it.c, '#9c3d2e');
    B(g, 12, 34, d, c, it.x + 6, 17, it.y + d / 2);
    B(g, 12, 34, d, c, it.x + w - 6, 17, it.y + d / 2);
    B(g, w - 32, 5, d - 10, 0xc9b28a, it.x + w / 2, 25, it.y + d / 2);
  },
  register(g, it) {
    B(g, 18, 14, 14, 0x3a3f46, it.x, 42, it.y);
    B(g, 12, 8, 2, 0x9fc8b8, it.x, 50, it.y - 6, 0x6fae8e);
  },
  stage(g, it) { // low stage; add pole: true for the Foxhole
    const w = it.w || 160, d = it.d || 90, c = hx(it.c, '#4a3220');
    B(g, w, 14, d, c, it.x + w / 2, 7, it.y + d / 2);
    if (it.pole) CYL(g, 2.4, 120, 0xc8ccd4, it.x + w / 2, 74, it.y + d / 2, 10);
  },
  pool(g, it) { // pool table
    const w = it.w || 90, d = it.d || 50;
    B(g, w, 10, d, 0x2e4632, it.x + w / 2, 26, it.y + d / 2);
    B(g, w + 8, 6, d + 8, 0x6d4a2a, it.x + w / 2, 20, it.y + d / 2);
    for (const [dx, dz] of [[-w/2+4, -d/2+4], [w/2-4, -d/2+4], [-w/2+4, d/2-4], [w/2-4, d/2-4]])
      B(g, 6, 20, 6, 0x4a3220, it.x + w / 2 + dx, 10, it.y + d / 2 + dz);
  },
  tv(g, it) { B(g, it.w || 30, 20, 6, 0x1c1c22, it.x, it.h || 96, it.y, 0x384858); },
  dart(g, it) { CYL(g, 9, 3, 0x8a5a33, it.x, 92, it.y, 10).rotation.x = Math.PI / 2; },
  jukebox(g, it) { B(g, 26, 44, 18, 0x6d3a5a, it.x, 22, it.y, 0xa85a8a); },
  plant(g, it) {
    CYL(g, 8, 12, 0x9c3d2e, it.x, 6, it.y, 7);
    B(g, 16, 22, 16, 0x2e4632, it.x, 26, it.y);
  },
  crate(g, it) { B(g, it.w || 22, it.h || 18, it.w || 22, hx(it.c, '#8a6a44'), it.x, (it.h || 18) / 2, it.y); },
  rack(g, it) { // pegboard wall rack (pawn guitars, hardware tools)
    const w = it.w || 140, c = hx(it.c, '#8a7a5a');
    B(g, w, 70, 6, c, it.x + w / 2, 66, it.y + 3);
    for (let i = 0; i < Math.floor(w / 30); i++)
      B(g, 10, 34, 4, [0x9c3d2e, 0x3a3f46, 0x5b7291][i % 3], it.x + 18 + i * 30, 62, it.y + 8);
  },
  case(g, it) { // glass display case
    const w = it.w || 120, c = 0xaec8cc;
    B(g, w, 26, 30, 0x6d5a4a, it.x + w / 2, 13, it.y + 15);
    B(g, w, 16, 26, c, it.x + w / 2, 34, it.y + 15);
  },
  couch(g, it) {
    const w = it.w || 70, c = hx(it.c, '#5b7291');
    B(g, w, 16, 30, c, it.x + w / 2, 12, it.y + 15);
    B(g, w, 22, 10, c, it.x + w / 2, 24, it.y + 4);
  },
  cot(g, it) {
    B(g, 34, 10, 70, 0x5a5148, it.x, 8, it.y);
    B(g, 30, 4, 62, 0x7a8a98, it.x, 14, it.y);
    B(g, 26, 5, 14, 0xe8dcc3, it.x, 17, it.y - 22);
  },
  urn(g, it) { CYL(g, 8, 22, 0xb8b4ac, it.x, 24, it.y, 8); B(g, 5, 6, 5, 0x2c2c30, it.x, 38, it.y); },
  lectern(g, it) { B(g, 22, 40, 16, 0x6d4a2a, it.x, 20, it.y); B(g, 26, 4, 20, 0x8a6a44, it.x, 42, it.y); },
  cork(g, it) { // corkboard thick with papers
    const w = it.w || 90;
    B(g, w, 54, 4, 0x9c7a4a, it.x + w / 2, 74, it.y + 2);
    for (let i = 0; i < 8; i++)
      B(g, 12, 15, 1, 0xe8dcc3, it.x + 12 + (i % 4) * 20, 84 - Math.floor(i / 4) * 22, it.y + 5);
  },
  bookshelf(g, it) {
    // ⚠️ the case is 16 deep and the spines sit proud at y+18 — the first build
    // buried the books INSIDE the case and the library read as blank cabinets.
    const w = it.w || 110, c = hx(it.c, '#6d4a2a');
    B(g, w, 96, 16, c, it.x + w / 2, 48, it.y + 8);
    for (let r = 0; r < 3; r++) for (let i = 0; i < Math.floor(w / 12); i++)
      B(g, 8, 20, 8, [0x9c3d2e, 0x2e4632, 0x5b7291, 0xc9a227, 0x6b4a2f][(r + i) % 5],
        it.x + 8 + i * 12, 26 + r * 28, it.y + 18);
  },
  computer(g, it) {
    B(g, 40, 4, 26, 0x8a8478, it.x, 26, it.y);
    B(g, 20, 16, 14, 0xd8d4c8, it.x, 36, it.y, 0x7a9a8a);
  },
  steam(g, it) { // buffet steam table island
    const w = it.w || 200, d = it.d || 50;
    B(g, w, 30, d, 0xb8bcc4, it.x + w / 2, 15, it.y + d / 2);
    for (let i = 0; i < Math.floor(w / 34); i++)
      B(g, 26, 4, d - 16, [0xc9a227, 0x9c3d2e, 0x8a5a33, 0x4c5741][i % 4], it.x + 20 + i * 34, 32, it.y + d / 2);
    B(g, w, 3, d + 10, 0xaec8cc, it.x + w / 2, 52, it.y + d / 2);
  },
  washer(g, it) { B(g, 30, 34, 28, 0xd8d4cc, it.x, 17, it.y); CYL(g, 9, 2, 0x384048, it.x, 22, it.y - 14.5, 10); },
  pallet(g, it) { B(g, 40, 5, 40, 0x8a6a44, it.x, 2.5, it.y); B(g, 34, 24, 34, hx(it.c, '#6d5a4a'), it.x, 17, it.y); },
  arcade(g, it) { B(g, 24, 52, 22, hx(it.c, '#3a3550'), it.x, 26, it.y); B(g, 16, 12, 2, 0x84e8d8, it.x, 40, it.y - 11, 0x54c8b8); },
  fridge(g, it) { B(g, 28, 60, 26, 0xd8d4cc, it.x, 30, it.y); },
  light(g, it) { // ceiling fixture: emissive panel (rooms have no real ceiling)
    B(g, it.w || 44, 3, 16, 0xf4ecd4, it.x, it.h || 128, it.y, 0xffe8b0);
  },
  window(g, it) { // lit window panel on a wall — daylight coming in
    B(g, it.w || 60, 40, 3, 0xc8d8e4, it.x + (it.w || 60) / 2, 78, it.y + 1.5, 0x9fb8d0);
  },
  rug(g, it) { B(g, it.w || 120, 1.2, it.d || 80, hx(it.c, '#7a4436'), it.x + (it.w || 120) / 2, 1.2, it.y + (it.d || 80) / 2); },
  aquarium(g, it) { B(g, 40, 26, 16, 0x5aa8b8, it.x, 40, it.y, 0x3a8898); B(g, 44, 30, 20, 0x3a3220, it.x, 14, it.y); },
  cat(g, it) { B(g, 10, 14, 8, 0xc9a227, it.x, 40, it.y); B(g, 6, 6, 5, 0xc9a227, it.x, 50, it.y - 2); },
  board(g, it) { // menu board / notice wall — amber scribble bands, no legible text
    const w = it.w || 120, c = hx(it.c, '#3a3632');
    B(g, w, 44, 4, c, it.x + w / 2, 86, it.y + 2);
    for (let i = 0; i < 3; i++)
      B(g, w * (0.72 - i * 0.14), 3, 1.4, 0xffb347, it.x + w / 2, 98 - i * 10, it.y + 4.6);
  },
};

import { ROOM_LAYOUTS } from './layouts3d.js';

const _warned = new Set();

// ---------------------------------------------------------------------------
// GRIME — a painted floor. One canvas per room, cached, deterministic.
// ⚠️ Seeded from the room KEY (an FNV-ish string hash), not Math.random and not
// the sim rng: the view must never touch the sim's stream, and a room must look
// the same on every visit. This is the same discipline the burglary tells use.
// ---------------------------------------------------------------------------
const _grime = new Map();
function grimeTexture(key, floorHex, W, H) {
  // ⚠️ Returns null under node. The headless room validator (all 16 rooms build,
  // zero unknown kinds, before a browser opens) is worth more than grime in a
  // test — so painting is optional and buildRoom keeps the plain material.
  if (typeof document === 'undefined') return null;
  if (_grime.has(key)) return _grime.get(key);
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };

  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.max(128, Math.round(512 * H / W));
  const c = cv.getContext('2d');
  const base = new THREE.Color(floorHex);
  c.fillStyle = '#' + base.getHexString();
  c.fillRect(0, 0, cv.width, cv.height);

  // the worn lane: everybody walks from the door (bottom centre) inward, and
  // years of that is the most honest mark a floor carries.
  const g = c.createRadialGradient(cv.width / 2, cv.height, 10, cv.width / 2, cv.height * 0.25, cv.width * 0.55);
  g.addColorStop(0, 'rgba(0,0,0,0.20)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, cv.width, cv.height);

  // scuffs — long thin smears in the traffic direction
  for (let i = 0; i < 34; i++) {
    const x = rnd() * cv.width, y = rnd() * cv.height, w = 8 + rnd() * 46;
    c.fillStyle = 'rgba(0,0,0,' + (0.03 + rnd() * 0.05).toFixed(3) + ')';
    c.fillRect(x, y, w, 1 + rnd() * 2);
  }
  // stains — spills nobody cleaned, warm and cool
  for (let i = 0; i < 11; i++) {
    const x = rnd() * cv.width, y = rnd() * cv.height, r = 5 + rnd() * 20;
    const st = c.createRadialGradient(x, y, 0, x, y, r);
    const warm = rnd() > 0.45;
    st.addColorStop(0, warm ? 'rgba(60,40,20,0.20)' : 'rgba(30,36,48,0.18)');
    st.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = st; c.beginPath(); c.arc(x, y, r, 0, 6.284); c.fill();
  }
  // grit at the edges, where a mop never quite reaches
  for (let i = 0; i < 90; i++) {
    const edge = rnd();
    const x = edge < 0.5 ? rnd() * cv.width : (rnd() > 0.5 ? rnd() * 22 : cv.width - rnd() * 22);
    const y = edge < 0.5 ? (rnd() > 0.5 ? rnd() * 20 : cv.height - rnd() * 20) : rnd() * cv.height;
    c.fillStyle = 'rgba(0,0,0,' + (0.05 + rnd() * 0.10).toFixed(3) + ')';
    c.fillRect(x, y, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;      // same annotation as every other canvas texture
  _grime.set(key, tex);
  return tex;
}

// Build one room: floor, three walls (front omitted — the camera lives there),
// a void plate so the world's absence doesn't read as sky, then the furniture.
export function buildRoom(key, it, opts = {}) {
  const g = new THREE.Group();
  const L = ROOM_LAYOUTS[key] || {};
  const floorC = hx(L.floor, '#6d5f4e'), wallC = hx(L.wall, '#5a5148');
  const W = it.w, H = it.h, WALL_H = 132;

  // the void: a big dark stage under everything so the room floats on night
  const voidPlate = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), mat(0x0c0e14));
  voidPlate.rotation.x = -Math.PI / 2; voidPlate.position.set(W / 2, -0.5, H / 2);
  g.add(voidPlate);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat(floorC));
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0.4, H / 2);
  floor.receiveShadow = true; g.add(floor);

  B(g, W + 16, WALL_H, 8, wallC, W / 2, WALL_H / 2, -4);        // back (north)
  B(g, 8, WALL_H, H, wallC, -4, WALL_H / 2, H / 2);             // west
  B(g, 8, WALL_H, H, wallC, W + 4, WALL_H / 2, H / 2);          // east
  B(g, W + 16, 6, 10, 0x3a342c, W / 2, 3, -4);                  // baseboard shadow line

  // the door: bottom-centre of the room, where enterRoom drops you
  B(g, 46, 6, 10, 0x8a6a44, W / 2, 3, H - 4);

  // ── GRIME ────────────────────────────────────────────────────────────────
  // ⚠️ The rooms were FURNISHED but not DRESSED: right shapes in the right
  // places, and every floor factory-clean. Hopewell does not have a clean floor
  // in it. This is a painted floor texture rather than meshes — scuffs, stains
  // and the worn traffic lane cost nothing and read at every camera height.
  // ⚠️ DETERMINISTIC per room: a hash of the room key, never Math.random, so a
  // room looks the same every time you walk into it. A floor that re-stains
  // itself on each entry is worse than a clean one.
  const grime = grimeTexture(key, floorC, W, H);
  if (grime) floor.material = new THREE.MeshLambertMaterial({ map: grime });

  for (const item of (L.items || [])) {
    const fn = V[item.kind];
    if (!fn) {
      if (!_warned.has(item.kind)) { console.warn('rooms3d: unknown kind', item.kind); _warned.add(item.kind); }
      continue;
    }
    try { fn(g, item); } catch (e) {
      if (!_warned.has('ERR' + item.kind)) { console.error('rooms3d: builder threw', item.kind, e.message); _warned.add('ERR' + item.kind); }
    }
  }
  // ── CLUTTER ──────────────────────────────────────────────────────────────
  // ⚠️ Same deterministic hash as the grime, and deliberately placed at the
  // ROOM'S EDGES: the middle is where people walk and where the layout's real
  // furniture lives, so centre clutter would both bury the mined data and put
  // boxes in the doorway. Small, cheap, and it makes a room look USED.
  let ch = 2166136261;
  for (let i = 0; i < key.length; i++) { ch ^= key.charCodeAt(i); ch = Math.imul(ch, 16777619); }
  const crnd = () => { ch ^= ch << 13; ch ^= ch >>> 17; ch ^= ch << 5; return ((ch >>> 0) % 10000) / 10000; };
  const JUNK = [
    (x, z) => B(g, 9, 11, 9, 0x6d5a4a, x, 5.5, z),                       // a box
    (x, z) => B(g, 13, 3, 9, 0x8a7a5a, x, 1.5, z),                       // flattened carton
    (x, z) => { CYL(g, 4.5, 13, 0x3a4450, x, 6.5, z, 7); B(g, 8, 2, 8, 0x2c343e, x, 13, z); }, // bin
    (x, z) => B(g, 5, 6, 5, 0x9c3d2e, x, 3, z),                          // a can nobody binned
    (x, z) => { B(g, 11, 2, 14, 0x5a5148, x, 1, z); B(g, 9, 1.5, 12, 0xc9b28a, x, 2.4, z); }, // stacked mats
  ];
  const margin = 26;
  for (let i = 0; i < 5; i++) {
    const onSide = crnd() > 0.42;
    const x = onSide ? (crnd() > 0.5 ? margin : W - margin) : margin + crnd() * (W - margin * 2);
    const z = onSide ? margin + crnd() * (H - margin * 2) : margin + crnd() * 40;   // hug the back wall
    JUNK[Math.floor(crnd() * JUNK.length) % JUNK.length](x, z);
  }

  return g;
}
