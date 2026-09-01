// VICTORY LAP — render3d.js
// A SECOND VIEW onto the same sim. This file draws Hopewell in real 3D and reads
// exactly what render.js reads: game.player, game.npcs, game.room, the town data.
//
// ⚠️⚠️ THE WHOLE REASON THIS IS POSSIBLE: game.js is 100% headless. It publishes
// x/y, facing, vx/vy, moving, state, hp, ko, atkT, hitT/hitDir, outfit/skin/hat,
// held and gaitBias per entity, and it never touches a canvas. So a renderer is a
// CONSUMER, not a partner. Nothing in this file may write to sim state — if you
// ever need to, you have found a missing sim field, not a reason to reach in.
//
// LOOK TARGET: Schedule I — chunky low-poly geometry, flat matte materials, real
// shadows, cohesive limited palette. Cheap-looking on purpose and readable at
// distance. Everything here is boxes and cylinders; there is not one imported
// model, which is why it costs nothing to run and nothing to make.

import * as THREE from '../lib/three.module.js';
import { T, WORLD, BUILDINGS, STRIP_Y, GARAGE, FOXHOLE, DOWNTOWN, DT_Y, WATER_TOWER,
         WORKS, BLUFFS, HTCC, FLATS, INTERIORS } from './game.js';

// The permanent palette from ART_BIBLE.md, as literal hex. Same town, new medium.
const C = {
  tobacco: 0x6b4a2f, leather: 0x8a5a33, green: 0x2e4632, tan: 0xc9b28a,
  red: 0x9c3d2e, denim: 0x5b7291, amber: 0xffb347, cream: 0xe8dcc3,
  moon: 0x7e93c4, night: 0x141a2c,
  asphalt: 0x35323a, curb: 0x6a6560, grass: 0x3f5138, dirt: 0x6b5f4c,
  brick: 0x7a4436, roofTar: 0x2a2730, concrete: 0x8c8880,
};

// ⚠️ The sim's world is 3400x3200 in "game units" and the top-down view treats
// them as pixels. 3D keeps the SAME numbers so every position, radius and bound
// in the sim is valid here without conversion — 1 game unit = 1 world unit, and
// a person is ~26 units wide. Nothing gets rescaled, ever. Scale drift between
// two views of one sim would be an endless source of "why is he inside the wall".
const U = 1;
const PERSON_H = 62;           // a toy-scale human in game units

const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// MATERIAL CACHE — one material per colour, shared by everything.
// Flat + matte is the Schedule I look AND it keeps draw calls cheap.
// ---------------------------------------------------------------------------
const _mats = new Map();
function mat(hex, opts = {}) {
  const key = hex + '|' + JSON.stringify(opts);
  if (_mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshLambertMaterial({ color: hex, ...opts });
  _mats.set(key, m);
  return m;
}
const _box = new THREE.BoxGeometry(1, 1, 1);
const _cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
function box(w, h, d, hex, opts) {
  const m = new THREE.Mesh(_box, mat(hex, opts));
  m.scale.set(w, h, d); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(r, h, hex, seg) {
  const g = seg ? new THREE.CylinderGeometry(r, r, h, seg) : _cyl;
  const m = new THREE.Mesh(g, mat(hex));
  if (!seg) m.scale.set(r * 2, h, r * 2);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// A PERSON — eight boxes, and that is the entire character system.
// ⚠️ Built from the sim's OWN outfit record, so the 3D crowd is the same crowd
// the 2D view draws: same shirt, same pants, same skin, same hat. Swapping views
// must never change who you are looking at.
// ---------------------------------------------------------------------------
function makePerson(outfit, skin, hat) {
  const g = new THREE.Group();
  const o = outfit || {};
  const shirt = new THREE.Color(o.shirt || '#5b7291').getHex();
  const pants = new THREE.Color(o.pants || '#3a3a42').getHex();
  const sk = new THREE.Color(skin || '#c99b72').getHex();

  const legL = box(7, 24, 8, pants); legL.position.set(-4.5, 12, 0); g.add(legL);
  const legR = box(7, 24, 8, pants); legR.position.set(4.5, 12, 0); g.add(legR);
  const torso = box(17, 22, 10, shirt); torso.position.set(0, 35, 0); g.add(torso);
  const armL = box(5, 19, 6, shirt); armL.position.set(-11, 35, 0); g.add(armL);
  const armR = box(5, 19, 6, shirt); armR.position.set(11, 35, 0); g.add(armR);
  const head = box(12, 12, 12, sk); head.position.set(0, 52, 0); g.add(head);
  // A nose. One box, and it is the only reason you can tell which way he faces
  // from above — which matters because this camera looks down a lot.
  const nose = box(3, 3, 3, sk); nose.position.set(0, 51, 6.5); g.add(nose);
  // ⚠️ `hat` is a KIND NAME ('cap', 'trucker', 'curlers', 'copHat'…), never a
  // colour — feeding it to THREE.Color silently produces white and every head in
  // town matches. The sim ships 10 kinds; they are most of the crowd's variety,
  // so they get real (if chunky) shapes.
  const hatCol = { copHat: 0x2b3550, trucker: 0xc9c3b4, cap: 0x4c5741, capBack: 0x7a4436,
                   visor: 0xc9a227, beanie: 0x9c3d2e, curlers: 0xd98fb0, bun: sk };
  if (hat && hat !== 'none' && hat !== 'bald') {
    const hc = hatCol[hat] != null ? hatCol[hat] : 0x6d5a4a;
    if (hat === 'bun') {
      const b = box(8, 8, 8, hc); b.position.set(0, 59, -5); g.add(b);
    } else if (hat === 'curlers') {
      for (let i = -1; i <= 1; i++) {
        const c = cyl(2.6, 5, hc, 6); c.position.set(i * 4.5, 59, 0); c.rotation.z = Math.PI / 2; g.add(c);
      }
    } else {
      const crown = box(13, 5, 13, hc); crown.position.set(0, 60, 0); g.add(crown);
      if (hat !== 'beanie') {                       // caps and cop hats get a brim
        const brimZ = hat === 'capBack' ? -8 : 8;
        const brim = box(12, 2, 7, hc); brim.position.set(0, 58, brimZ); g.add(brim);
      }
    }
  }
  g.userData = { legL, legR, armL, armR, torso, head, phase: Math.random() * 6.28 };
  return g;
}

// ---------------------------------------------------------------------------
export class Renderer3D {
  constructor(canvas, game) {
    this.cv = canvas; this.g = game;
    this.camFx = true;
    this.fx3d = true;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(C.night);

    this.scene = new THREE.Scene();
    // ⚠️ Fog has to start BEYOND the camera distance (900) or the town greys out
    // at the player's own feet. Far is set past the world diagonal so the far
    // districts haze rather than vanish.
    this.scene.fog = new THREE.Fog(C.night, 1300, 3800);

    this.camera = new THREE.PerspectiveCamera(42, 1, 10, 4000);
    // ⚠️ CAMERA PITCH IS THE WHOLE DESIGN QUESTION, not a look setting.
    // The 2D game is top-down and its systems assume you can read the street:
    // the size-up panel, crowd density, an incoming chase. `pitch` 1.0 is
    // straight down (the current game), 0.0 is horizontal (Bully / Schedule I).
    // 0.62 keeps the town legible while giving real facades and silhouettes.
    // ⚠️ `dist` is the TRUE distance from the look-at point, and it has to be
    // derived from the world's own scale, not guessed. A person is 62 units, a
    // street is ~300 wide, and you want ~1100 units of ground across the frame to
    // read a crowd. At a 42° vertical FOV on 16:9 that is
    //   dist = (1100/2) / tan(hfov/2) ≈ 900.
    // The first pass used 520 and put the camera inside the neighbours' roofs.
    this.pitch = 0.62;
    this.dist = 900;
    this.cam = { x: 0, y: 0, shake: 0 };

    // --- light: one sun, one sky, matched to the 2D view's SKY blocks ---
    this.hemi = new THREE.HemisphereLight(0xbcd0e8, 0x4a4436, 0.85);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffd9a0, 1.15);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const S = 900;                                  // shadow frustum half-width
    Object.assign(this.sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 10, far: 2600 });
    this.sun.shadow.bias = -0.0012;
    this.scene.add(this.sun, this.sun.target);

    this.world = new THREE.Group(); this.scene.add(this.world);
    this.people = new Map();                        // id -> Group
    this.barks = [];
    this.built = false;

    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    // ⚠️ Same clamp as the 2D renderer, same reason: a collapsed pane reports 0
    // and a 0-wide projection matrix produces NaNs that never recover.
    const w = Math.max(480, this.cv.clientWidth || innerWidth);
    const h = Math.max(320, this.cv.clientHeight || innerHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // -- the town, built once ------------------------------------------------
  buildTown() {
    if (this.built) return;
    this.built = true;
    const W = this.world;

    // ⚠️ Ground is 3× the world on purpose. At world size you can see its EDGE
    // from the map corners — a hard line with sky under it, which instantly reads
    // as "the level ran out". Cheap fix, one plane either way.
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w * 3, WORLD.h * 3), mat(C.grass));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(WORLD.w / 2, 0, WORLD.h / 2);
    ground.receiveShadow = true;
    W.add(ground);

    // The Mile's asphalt strip + Main Street, laid where the sim puts them.
    const road = (x, z, w, d, hex = C.asphalt) => {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(hex));
      r.rotation.x = -Math.PI / 2; r.position.set(x, 0.4, z); r.receiveShadow = true; W.add(r);
      return r;
    };
    // ⚠️ STRIP_Y.base is the storefront BASELINE, and the facades occupy 150 units
    // of depth south of it. Centring the road on base+120 buried most of it under
    // the buildings. The street starts where the buildings stop.
    road(WORLD.w / 2, STRIP_Y.base + 150 + 170, WORLD.w, 300);
    road(WORLD.w / 2, DT_Y.base + 170 + 150, 2000, 260);

    // ---- storefronts: the Mile ----
    for (const b of BUILDINGS) this.facade(b.x, STRIP_Y.base, b.w, 150, b.signC || '#8a5a33', 190);
    // ---- Main Street ----
    for (const b of DOWNTOWN) this.facade(b.x, DT_Y.base, b.w, 170, b.signC || '#7a4436', 300);
    // ---- the Flats ----
    for (const h of FLATS.houses) this.house(h.x, h.y, h.w, h.h, h.wall, h.trim);
    // ---- the Bluffs (bigger houses) ----
    for (const h of (BLUFFS.houses || [])) this.house(h.x, h.y, h.w || 210, h.h || 150, h.wall || '#8a7f6d', h.trim || '#43506b', 150);
    // ---- the college ----
    for (const b of (HTCC.buildings || [])) this.facade(b.x, b.y, b.w || 260, b.h || 120, '#a89778', 130);
    // ---- the Works: sheds + stacks ----
    if (WORKS.plant) {
      const p = WORKS.plant;
      const shed = box(p.w, 260, p.h, C.brick);
      shed.position.set(p.x + p.w / 2, 130, p.y + p.h / 2); W.add(shed);
      for (const s of (WORKS.stacks || [])) {
        const st = cyl(22, 420, 0x6d4a3e, 10);
        st.position.set(s.x, 210, s.y); W.add(st);
      }
    }
    // ---- the water tower, the town's one landmark ----
    if (WATER_TOWER) {
      const t = WATER_TOWER;
      const tank = cyl(66, 96, C.tan, 12); tank.position.set(t.x, 330, t.y); W.add(tank);
      for (const [dx, dz] of [[-40,-40],[40,-40],[-40,40],[40,40]]) {
        const leg = box(8, 290, 8, 0x5a5148); leg.position.set(t.x + dx, 145, t.y + dz); W.add(leg);
      }
    }
    // ---- the garage you live behind + the Foxhole ----
    if (GARAGE) this.house(GARAGE.x, GARAGE.y, GARAGE.w || 200, GARAGE.h || 150, '#7a6a58', '#9c5a4a');
    if (FOXHOLE) {
      const f = FOXHOLE;
      const b = box(f.w || 240, 150, f.h || 160, 0x3d3640);
      b.position.set((f.x || 0) + (f.w || 240) / 2, 75, (f.y || 0) + (f.h || 160) / 2); W.add(b);
    }
  }

  // A storefront: body + parapet + a lit sign band. Chunky on purpose.
  facade(x, z, w, d, signHex, h = 190) {
    const W = this.world;
    const body = box(w - 8, h, d, C.brick);
    body.position.set(x + w / 2, h / 2, z + d / 2); W.add(body);
    const par = box(w, 22, d + 6, C.roofTar);
    par.position.set(x + w / 2, h + 11, z + d / 2); W.add(par);
    const sign = box(w * 0.62, 26, 6, new THREE.Color(signHex).getHex());
    sign.position.set(x + w / 2, h * 0.74, z + d + 2); W.add(sign);
    // glass: a dark inset that catches the sun and reads as a shopfront
    const glass = box(w * 0.7, h * 0.34, 4, 0x22303c);
    glass.position.set(x + w / 2, h * 0.3, z + d + 1); W.add(glass);
  }

  // A house: body + a real pitched roof, which is most of what makes a
  // residential street read as residential from a high camera.
  house(x, z, w, d, wallHex, trimHex, h = 110) {
    const W = this.world;
    const body = box(w, h, d, new THREE.Color(wallHex).getHex());
    body.position.set(x + w / 2, h / 2, z + d / 2); W.add(body);
    // ⚠️ A 4-sided cone rotated 45° has its CORNERS at the radius, so to cap a
    // w×d box exactly the radius is the box's half-diagonal. `max(w,d)*0.78` made
    // a 220-wide house wear a 344-wide hat, which is most of why the first build
    // looked like the camera was underneath the neighbourhood.
    const roofR = Math.hypot(w, d) / 2;
    // ⚠️ Roof HEIGHT has to scale with the house or it reads as a coloured plate
    // laid on a box rather than a roof. A fixed 56 looked flat on the Flats' wider
    // houses. ~0.42 of the half-diagonal gives a believable domestic pitch.
    const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofR * 0.42 + 26, 4),
                                mat(new THREE.Color(trimHex).getHex()));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x + w / 2, h + (roofR * 0.42 + 26) / 2, z + d / 2);
    roof.castShadow = true; W.add(roof);
    const door = box(22, 40, 4, new THREE.Color(trimHex).getHex());
    door.position.set(x + w / 2, 20, z + d + 1); W.add(door);
  }

  // -- people --------------------------------------------------------------
  syncPeople(dt) {
    const g = this.g;
    const seen = new Set();
    // ⚠️ TWO SENTINEL TRAPS, both of which collapse the crowd into clones:
    //  1. `n.outfit` is ALREADY the resolved {shirt, pants} object — it is not an
    //     index into OUTFITS. `OUTFITS[n.outfit]` is undefined, every person falls
    //     back to the same default, and the art bible's "nobody is a clone" quietly
    //     stops being true. render.js reads `e.outfit.shirt` directly; so do we.
    //  2. `n.hat` is the STRING 'none' when hatless, not null — so `if (hat)` is
    //     true and everyone wears a hat coloured "none". Check the sentinel, not
    //     the truthiness. (Same class as carrier === -1 elsewhere in the workspace.)
    // Player colours are copied from render.js:2207 so both views dress him alike.
    const all = [{ e: g.player, id: '__p', outfit: { shirt: '#5c2f28', pants: '#3d4c63' }, skin: '#c99b72' }]
      .concat(g.npcs.map(n => ({
        e: n, id: n.id,
        outfit: n.outfit,
        skin: n.skin,
        hat: (n.hat && n.hat !== 'none') ? n.hat : null,
      })));

    for (const { e, id, outfit, skin, hat } of all) {
      if (!e) continue;
      seen.add(id);
      let p = this.people.get(id);
      if (!p) { p = makePerson(outfit, skin, hat); this.world.add(p); this.people.set(id, p); }
      // ⚠️ sim y maps to world Z. Never introduce a second convention.
      p.position.set(e.x, 0, e.y);
      p.rotation.y = (e.facing || 0);
      const u = p.userData;

      // gait straight off the sim's own velocity — no view-side state to drift
      const spd = Math.hypot(e.vx || 0, e.vy || 0);
      u.phase += dt * (2 + spd * 0.10) * (e.gaitBias || 1);
      const sw = Math.sin(u.phase) * Math.min(1, spd / 60);
      u.legL.rotation.x = sw * 0.85; u.legR.rotation.x = -sw * 0.85;
      u.armL.rotation.x = -sw * 0.6; u.armR.rotation.x = sw * 0.6;

      // knocked out: fall over. The sim owns `ko`; the view only tips the body.
      const down = !!e.ko || (e.hp != null && e.hp <= 0);
      p.rotation.x = lerp(p.rotation.x, down ? -Math.PI / 2 : 0, Math.min(1, dt * 8));
      p.position.y = down ? 8 : 0;

      // a swing shoves the whole body forward — same beat as meleeLungeZ in 2D
      const atk = e.atkT ? Math.max(0, e.atkT) : 0;
      u.torso.rotation.x = -atk * 0.9;
      // being hit flinches away from the blow
      if (e.hitT > 0 && e.hitDir != null) {
        const k = e.hitT * 14;
        p.position.x += Math.sin(e.hitDir) * k;
        p.position.z += Math.cos(e.hitDir) * k;
      }
    }
    for (const [id, p] of this.people) {
      if (seen.has(id)) continue;
      this.world.remove(p); this.people.delete(id);
    }
  }

  // -- camera ---------------------------------------------------------------
  applyCamera(dt) {
    const g = this.g, p = g.player;
    this.cam.x = lerp(this.cam.x, p.x, Math.min(1, dt * 6));
    this.cam.y = lerp(this.cam.y, p.y, Math.min(1, dt * 6));
    if (this.cam.shake > 0) this.cam.shake = Math.max(0, this.cam.shake - dt * 2.2);
    const sh = this.camFx ? this.cam.shake : 0;
    const jx = sh ? (Math.random() - 0.5) * sh * 26 : 0;
    const jz = sh ? (Math.random() - 0.5) * sh * 26 : 0;

    // ⚠️ Polar, not two independent offsets. The first version scaled `up` and
    // `back` separately, so changing `pitch` also changed how FAR the camera was
    // and the framing lurched. Here `dist` is the radius and `pitch` only rotates
    // along it: 0 = at the horizon (Bully / Schedule I), 1 = straight down (the
    // 2D game's own view). Frame size stays constant as you tilt.
    const ang = lerp(0.35, 1.45, this.pitch);          // radians above the horizon
    this.camera.position.set(
      this.cam.x + jx,
      Math.sin(ang) * this.dist,
      this.cam.y + Math.cos(ang) * this.dist + jz);
    this.camera.lookAt(this.cam.x, PERSON_H * 0.5, this.cam.y);

    // ⚠️ THE SUN MUST BE ON THE CAMERA'S SIDE. Every facade in this town faces
    // +z (toward the street, toward you), so a sun at -z lights the BACKS of the
    // buildings and every surface you can actually see falls in shadow. The first
    // build looked like permanent dusk for exactly this reason. Keep the offset
    // positive in z; the x offset is what gives the raking angle.
    this.sun.position.set(this.cam.x - 520, 1000, this.cam.y + 420);
    this.sun.target.position.set(this.cam.x, 0, this.cam.y);
    this.sun.target.updateMatrixWorld();
  }

  // Day/night straight off the sim's block, so 3D and 2D agree about the hour.
  applySky() {
    const b = this.g.block || 0;
    const dayness = [0.55, 1.0, 0.72, 0.22][Math.max(0, Math.min(3, b))];
    // ⚠️ three r155+ turned OFF legacy light units by default, so the intensities
    // that used to read as "bright daylight" (~1.0) now render as dusk. These are
    // ~2.5× the pre-r155 numbers on purpose. If the town ever looks like permanent
    // evening again, check the three revision before touching the palette.
    this.hemi.intensity = 0.6 + dayness * 1.9;
    this.sun.intensity = 0.5 + dayness * 2.4;
    const skyCol = new THREE.Color(C.night).lerp(new THREE.Color(0x9fc0e0), dayness);
    this.renderer.setClearColor(skyCol);
    this.scene.fog.color = skyCol;
    this.sun.color.setHex(dayness > 0.6 ? 0xffd9a0 : 0x9fb0d8);
  }

  // -- the interface main.js already speaks --------------------------------
  render(dt) {
    if (!this.g) return;
    this.buildTown();
    // ⚠️ Interiors are still 2D-authored rooms; in 3D the POC simply hides the
    // town and shows the player on a plate. A full pass would build the 16
    // interiors as rooms — that is the single biggest remaining art job.
    const inside = this.g.room !== 'ext';
    this.world.visible = true;
    this.syncPeople(Math.min(0.1, dt || 0.016));
    this.applyCamera(Math.min(0.1, dt || 0.016));
    this.applySky();
    this.tickBarks(dt || 0.016);
    this.renderer.render(this.scene, this.camera);
  }

  // Barks as camera-facing sprites over the speaker, same as Age of Toys.
  bark(who, text, x, y) {
    const cv = document.createElement('canvas');
    const pad = 12, fs = 22;
    const c = cv.getContext('2d');
    c.font = `${fs}px Georgia, serif`;
    const words = String(text || '').split(' ');
    const lines = []; let line = '';
    for (const w of words) {
      if (c.measureText(line + ' ' + w).width > 420 && line) { lines.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) lines.push(line);
    cv.width = 460; cv.height = pad * 2 + lines.length * (fs + 5) + (who ? fs + 4 : 0);
    const c2 = cv.getContext('2d');
    c2.fillStyle = 'rgba(20,17,12,0.92)'; c2.fillRect(0, 0, cv.width, cv.height);
    c2.strokeStyle = '#ffb347'; c2.lineWidth = 3; c2.strokeRect(1.5, 1.5, cv.width - 3, cv.height - 3);
    let yy = pad + fs;
    if (who) { c2.fillStyle = '#ffb347'; c2.font = `bold ${fs}px Georgia, serif`; c2.fillText(who, pad, yy); yy += fs + 4; }
    c2.fillStyle = '#e8dcc3'; c2.font = `${fs}px Georgia, serif`;
    for (const l of lines) { c2.fillText(l, pad, yy); yy += fs + 5; }

    const tex = new THREE.CanvasTexture(cv);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(cv.width * 0.42, cv.height * 0.42, 1);
    sp.position.set(x, 120, y);
    sp.renderOrder = 900;
    this.scene.add(sp);
    this.barks.push({ sp, t: 3.4 + String(text || '').length * 0.02, tex });
  }
  tickBarks(dt) {
    for (let i = this.barks.length - 1; i >= 0; i--) {
      const b = this.barks[i];
      b.t -= dt; b.sp.position.y += dt * 6;
      b.sp.material.opacity = Math.min(1, b.t);
      if (b.t <= 0) {
        this.scene.remove(b.sp); b.sp.material.dispose(); b.tex.dispose();
        this.barks.splice(i, 1);
      }
    }
  }

  focusOn(x, y, z, dur) { this.cam.shake = Math.min(1, (z || 1) - 0.9); }
  fx(kind) { if (kind === 'hit' || kind === 'crack') this.cam.shake = 0.5; }
  shotDataURL() { this.renderer.render(this.scene, this.camera); return this.cv.toDataURL('image/png'); }
}
