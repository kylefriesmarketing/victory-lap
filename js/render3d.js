// VICTORY LAP — render3d.js
// A SECOND VIEW onto the same sim. This file draws Hopewell in real 3D and reads
// exactly what render.js reads: game.player, game.npcs, game.room, the town data.
//
// ⚠️⚠️ THE WHOLE REASON THIS IS POSSIBLE: game.js is 100% headless. It publishes
// x/y, facing, vx/vy, moving, state, hp/ko, windT/strikeT/atkT, hitT/hitDir,
// outfit/skin/hat/arch, held and gaitBias per entity, and it never touches a
// canvas. A renderer is a CONSUMER, not a partner. Nothing in this file may
// write to sim state — if you ever need to, you have found a missing sim field,
// not a reason to reach in.
//
// LOOK TARGET: Schedule I — chunky low-poly geometry, flat matte materials, real
// shadows, cohesive limited palette. Everything is boxes and cylinders; there is
// not one imported model. Exterior lives in town3d.js, interiors in rooms3d.js,
// their DATA in generated layouts3d.js; this file owns people, camera, light,
// weather, fx and the render loop.

import * as THREE from '../lib/three.module.js';
import { WORLD, INTERIORS, ARCHETYPES } from './game.js';
import { buildTown } from './town3d.js';
import { buildRoom } from './rooms3d.js';
import { TOWN_DRESSING } from './layouts3d.js';

// The permanent palette from ART_BIBLE.md, as literal hex. Same town, new medium.
const C = { night: 0x141a2c };

// ⚠️ The sim's world is 3400x3200 in game units and the top-down view treats them
// as pixels. 3D keeps the SAME numbers: 1 game unit = 1 world unit, a person is
// ~60 units tall, nothing is ever rescaled. Scale drift between two views of one
// sim would be an endless source of "why is he inside the wall".
const PERSON_H = 62;
const lerp = (a, b, t) => a + (b - a) * t;
const rr = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------------------
// MATERIALS — one per colour, shared. Flat + matte is the look AND the perf.
// ---------------------------------------------------------------------------
const _mats = new Map();
function mat(hex) {
  if (_mats.has(hex)) return _mats.get(hex);
  const m = new THREE.MeshLambertMaterial({ color: hex });
  _mats.set(hex, m);
  return m;
}
const _box = new THREE.BoxGeometry(1, 1, 1);
function box(w, h, d, hex) {
  const m = new THREE.Mesh(_box, mat(hex));
  m.scale.set(w, h, d); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(r, h, hex, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(hex));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// A PERSON — eight boxes shaped by the sim's OWN archetype record, wearing the
// sim's own outfit/skin/hat. Swapping views must never change who you're
// looking at: 23 shirts, 5 skins, 10 hats and 6 body shapes come from the sim.
// ---------------------------------------------------------------------------
function makePerson(outfit, skin, hat, archKey) {
  const g = new THREE.Group();
  const o = outfit || {};
  const a = ARCHETYPES[archKey] || ARCHETYPES.average || { tw: 16, belly: 0, sh: 0, h: 54, slouch: 0 };
  const shirt = new THREE.Color(o.shirt || '#5b7291').getHex();
  const pants = new THREE.Color(o.pants || '#3a3a42').getHex();
  const sk = new THREE.Color(skin || '#c99b72').getHex();

  const tw = a.tw + (a.sh || 0);                     // shoulders widen the torso
  const legL = box(6.5, 24, 8, pants); legL.position.set(-tw * 0.26, 12, 0); g.add(legL);
  const legR = box(6.5, 24, 8, pants); legR.position.set(tw * 0.26, 12, 0); g.add(legR);
  const torso = box(tw + 1, 22, 10 + (a.belly || 0), shirt); torso.position.set(0, 35, (a.belly || 0) * 0.35); g.add(torso);
  const armL = box(5, 19, 6, shirt); armL.position.set(-(tw / 2 + 3), 35, 0); g.add(armL);
  const armR = box(5, 19, 6, shirt); armR.position.set(tw / 2 + 3, 35, 0); g.add(armR);
  const head = box(12, 12, 12, sk); head.position.set(0, 52, (a.slouch || 0) * 0.9); g.add(head);
  // A nose: one box, and the only way to read facing from a high camera.
  const nose = box(3, 3, 3, sk); nose.position.set(0, 51, 6.5 + (a.slouch || 0) * 0.9); g.add(nose);

  // ⚠️ TWO SENTINEL TRAPS live in the hat field. It is a KIND NAME, never a
  // colour ('cap','trucker','curlers','copHat','hoodie'…), and hatless is the
  // STRING 'none', not null — `if (hat)` puts a hat coloured "none" on the whole
  // town. Check the sentinel, not the truthiness.
  const hatCol = { copHat: 0x2b3550, trucker: 0xc9c3b4, cap: 0x4c5741, capBack: 0x7a4436,
                   visor: 0xc9a227, beanie: 0x9c3d2e, curlers: 0xd98fb0, bun: sk, hoodie: shirt };
  if (hat && hat !== 'none' && hat !== 'bald') {
    const hc = hatCol[hat] != null ? hatCol[hat] : 0x6d5a4a;
    if (hat === 'bun') {
      const b = box(8, 8, 8, hc); b.position.set(0, 59, -5); g.add(b);
    } else if (hat === 'curlers') {
      for (let i = -1; i <= 1; i++) {
        const c = cyl(2.6, 5, hc, 6); c.position.set(i * 4.5, 59, 0); c.rotation.z = Math.PI / 2; g.add(c);
      }
    } else if (hat === 'hoodie') {
      const hood = box(14, 8, 14, hc); hood.position.set(0, 58, -1); g.add(hood);
      const back = box(12, 10, 4, hc); back.position.set(0, 50, -7); g.add(back);
    } else {
      const crown = box(13, 5, 13, hc); crown.position.set(0, 60, 0); g.add(crown);
      if (hat !== 'beanie') {
        const brimZ = hat === 'capBack' ? -8 : 8;
        const brim = box(12, 2, 7, hc); brim.position.set(0, 58, brimZ); g.add(brim);
      }
    }
  }
  // vertical scale = the archetype's height. 46 (short) … 62 (tall) around 54.
  g.scale.y = (a.h || 54) / 54;
  g.userData = { legL, legR, armL, armR, torso, head,
                 slouch: (a.slouch || 0) * 0.05, phase: Math.random() * 6.28 };
  return g;
}

// ---------------------------------------------------------------------------
// HELD WEAPONS — the WEAPONS keys as hand props. ⚠️ `held` is {kind,dur} and is
// PLAYER-ONLY: NPCs never hold weapons (weaponOf() gives them fists).
// ⚠️ NOT parented to the arm — the arm is a SCALED unit box (5×19×6), so a child
// inherits that non-uniform scale and a bat becomes a plank. The weapon rides
// the group at the hand and mirrors the arm's swing each frame.
// ---------------------------------------------------------------------------
function makeWeapon(kind) {
  const g = new THREE.Group();
  if (kind === 'bat') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.6, 32, 7), mat(0xc9b28a));
    b.position.y = 14; b.castShadow = true; g.add(b);
  } else if (kind === 'bottle') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 11, 7), mat(0x4a6a52));
    body.position.y = 5; body.castShadow = true; g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 6, 7), mat(0x4a6a52));
    neck.position.y = 13; g.add(neck);
  } else if (kind === 'chair') {
    const seat = box(15, 2.5, 15, 0x8a5a33); seat.position.y = 10; g.add(seat);
    const back = box(15, 12, 2.5, 0x8a5a33); back.position.set(0, 17, -6); g.add(back);
    for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
      const leg = box(2, 10, 2, 0x6d4a2a); leg.position.set(dx, 4, dz); g.add(leg);
    }
  } else if (kind === 'cue') {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 46, 6), mat(0xc9a86a));
    c.position.y = 20; c.castShadow = true; g.add(c);
  } else if (kind === 'sign') {
    const stick = box(2.5, 22, 2.5, 0x8a8478); stick.position.y = 10; g.add(stick);
    const board = box(20, 14, 2, 0xe8dcc3); board.position.y = 26; g.add(board);
  } else if (kind === 'crowbar') {
    const bar = box(2.6, 26, 2.6, 0x3a3f46); bar.position.y = 11; g.add(bar);
    const hook = box(2.6, 3, 8, 0x3a3f46); hook.position.set(0, 24, 2.5); g.add(hook);
  }
  return g;
}

// ---------------------------------------------------------------------------
// FX — a 1:1 port of render.js fx() (~line 123): same six kinds, same counts,
// colours and envelopes. 2D screen-up (-vy) becomes world-up; the horizontal
// kick spreads over x/z. All Math.random: view-only.
// ---------------------------------------------------------------------------
const FX_RECIPES = {
  impact:  { n: 7,  h: 26, up: [20, 130],  side: [0, 90],   g: 300, size: [1.5, 3],   col: 0xe8dcc3, dur: [0.25, 0.5] },
  shatter: { n: 13, h: 8,  up: [30, 190],  side: [0, 150],  g: 420, size: [1, 2.6],   col: 0xbedcd7, dur: [0.3, 0.7] },
  break:   { n: 10, h: 18, up: [30, 170],  side: [0, 120],  g: 380, size: [1.5, 3.2], col: 0x8a5a33, dur: [0.3, 0.65] },
  ko:      { n: 9,  h: 10, up: [10, 60],   side: [0, 60],   g: 120, size: [1, 2.4],   col: 0xa0968c, dur: [0.5, 0.9] },
  hurl:    { n: 11, h: 20, up: [-40, 30],  side: [0, 80],   g: 260, size: [1.2, 2.8], col: 0x969258, dur: [0.3, 0.6] },
  whiff:   { n: 4,  h: 24, up: [10, 30],   side: [40, 90],  g: 40,  size: [0.8, 1.6], col: 0xe8dcc3, dur: [0.16, 0.28] },
};

// Per-block sun: azimuth + warmth from the SKY spec. Morning throws long shadows
// west (sun in the east), evening is amber from the west, late is moonlight.
// ⚠️ dz stays POSITIVE always — THE SUN LIVES ON THE CAMERA'S SIDE. Facades face
// +z; a sun behind them lights the backs of the buildings and the whole town
// reads as permanent dusk. That one sign was the POC's worst-looking bug.
const SUNS = [
  { dx: 620,  h: 700,  col: 0xffc98e, day: 0.62 },   // MORNING — long warm east light
  { dx: -160, h: 1100, col: 0xfff2dc, day: 1.0 },    // AFTERNOON — high and clean
  { dx: -620, h: 650,  col: 0xff9f5e, day: 0.66 },   // EVENING — amber from the west
  { dx: 300,  h: 900,  col: 0x8fa8d8, day: 0.2 },    // LATE — moon
];

// ---------------------------------------------------------------------------
export class Renderer3D {
  constructor(canvas, game) {
    this.cv = canvas; this.g = game;
    this.camFx = true;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(C.night);

    this.scene = new THREE.Scene();
    // ⚠️ Fog starts BEYOND max camera distance or the town greys out at your feet.
    this.scene.fog = new THREE.Fog(C.night, 1700, 4200);
    this._fogDefaults = { near: 1700, far: 4200 };

    this.camera = new THREE.PerspectiveCamera(42, 1, 10, 5000);
    this.cam = { x: 0, y: 0, shake: 0 };
    this.dist = 900;
    this.focus = null;

    // ⚠️ Zoom IS the camera-pitch design answer, handed to the player: wheel maps
    // dist 480–1400 and pitch follows it — pulled close you play Schedule I at
    // street level, pulled back it tilts toward top-down so chases stay readable.
    try { this.dist = Math.max(480, Math.min(1400, +localStorage.getItem('vl-3dcam') || this.dist)); } catch {}
    canvas.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      this.dist = Math.max(480, Math.min(1400, this.dist * (1 + ev.deltaY * 0.0009)));
      try { localStorage.setItem('vl-3dcam', Math.round(this.dist)); } catch {}
    }, { passive: false });

    // light rig: one hemisphere + one shadow sun
    // ⚠️ ground bounce is TOBACCO-warm on purpose — with a cool grey bounce the
    // whole town read desaturated next to the 2D game's amber palette.
    this.hemi = new THREE.HemisphereLight(0xc4d2e4, 0x5c4a34, 2.0);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffd9a0, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    // ⚠️ S must cover the WIDEST frame: at max zoom (dist 1400, 42° FOV, 16:9)
    // the ground span is ~1911 units — an S of 900 ended shadows in a seam that
    // slid around with the camera. 1150 covers it; 2048px over 2300 units is
    // soft but even, which suits the chunky look anyway.
    const S = 1150;
    Object.assign(this.sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 10, far: 3200 });
    this.sun.shadow.bias = -0.0012;
    this.scene.add(this.sun, this.sun.target);

    // ⚠️ ONE point light serves all sixteen interiors — only one room is ever
    // visible, so it just moves. Without it rooms are lit only by the sun and
    // half of every room falls inside its own wall shadow.
    // ⚠️⚠️ r155+ physical lights: PointLight intensity is CANDELA with
    // inverse-square falloff. At this world scale (light 170 units above the
    // floor) an intensity of 2.4 delivers 2.4/170² ≈ 0.00008 — invisibly dark,
    // and it doesn't warn. The number that means "a ceiling fixture" here is
    // ~intensity/d²≈4 → 120000. If a room ever goes dark again, check units
    // before touching colours.
    this.roomLight = new THREE.PointLight(0xffe2b0, 120000, 0, 2);
    this.roomLight.visible = false;
    this.scene.add(this.roomLight);

    this.world = new THREE.Group(); this.scene.add(this.world);
    this.people = new Map();
    this.barks = [];
    this.parts = [];
    this.rooms = new Map();
    this.curRoom = 'ext';
    this._nightStage = -1;
    this.built = false;

    // rain: one InstancedMesh of thin streaks, recycled in a volume that follows
    // the camera. Built once, visibility-toggled by the weather string.
    const RAIN_N = 420;
    this.rain = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.7, 13, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xb4c8e6, transparent: true, opacity: 0.4 }),
      RAIN_N);
    this.rain.visible = false;
    // ⚠️ MEASURED: the auto bounding sphere is radius 7 at the ORIGIN (instances
    // start unset), and the volume follows the camera hundreds of units away —
    // so the whole rain system was frustum-culled everywhere except the world's
    // corner. Never trust auto bounds on an InstancedMesh you move per-frame.
    this.rain.frustumCulled = false;
    this.rainDrops = Array.from({ length: RAIN_N }, () => ({
      x: rr(-700, 700), y: rr(0, 700), z: rr(-700, 700) }));
    this.scene.add(this.rain);

    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize(w, h) {
    // ⚠️ main.js resize() PASSES the clamped size and sets the canvas CSS only
    // AFTERWARD — an argless read of clientWidth here sees the stale style and
    // lags one resize behind. Honour the caller's numbers; fall back to element
    // size for the self-heal path. Clamp regardless: a collapsed pane reports 0
    // and a 0-wide projection matrix produces NaNs that never recover.
    w = Math.max(480, w || this.cv.clientWidth || innerWidth);
    h = Math.max(320, h || this.cv.clientHeight || innerHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  buildTown() {
    if (this.built) return;
    this.built = true;
    const t = buildTown(TOWN_DRESSING || {});
    this.world.add(t.group);
    this._setTownNight = t.setNight;
  }

  // ── PEOPLE ────────────────────────────────────────────────────────────────
  syncPeople(dt) {
    const g = this.g;
    const all = [{ e: g.player, id: '__p', outfit: { shirt: '#5c2f28', pants: '#3d4c63' }, skin: '#c99b72', arch: 'average' }]
      .concat(g.npcs.map(n => ({
        e: n, id: n.id, outfit: n.outfit, skin: n.skin, arch: n.arch,
        hat: (n.hat && n.hat !== 'none') ? n.hat : null,
      })));

    // ⚠️ ROOM FILTER — the 2D draw site is `g.npcs.filter(n => n.room === room)`:
    // every NPC carries 'ext' or an interior key, NEVER undefined. Drawing
    // everyone unconditionally (the POC's behaviour) stood the whole indoor cast
    // on the grass near the world origin at their tiny room coordinates.
    const here = this.g.room || 'ext';
    for (const { e, id, outfit, skin, hat, arch } of all) {
      if (!e) continue;
      const eRoom = (id === '__p') ? here : (e.room || 'ext');
      if (eRoom !== here) {
        const ghost = this.people.get(id);
        if (ghost) ghost.visible = false;
        continue;
      }
      let p = this.people.get(id);
      if (!p) { p = makePerson(outfit, skin, hat, arch); this.scene.add(p); this.people.set(id, p); }
      p.visible = true;
      // ⚠️ sim y maps to world Z. Never introduce a second convention.
      p.position.set(e.x, 0, e.y);
      // ⚠️⚠️ NOT `rotation.y = facing`. The sim's facing is `atan2(dy, dx)`, so
      // forward is (cos θ, sin θ) in (x, z) — that is what render.js reads as
      // (fdx, fdy). A three.js body whose nose is at +Z points at
      // (sin θ, cos θ) for rotation.y = θ. The two conventions are a reflection
      // apart: θ_three = π/2 − θ_sim.
      // MEASURED with the wrong version: sim facing EAST put the nose SOUTH,
      // south→east, west→north — every toy in town aimed 90° off, walking
      // sideways and swinging at nobody.
      p.rotation.y = Math.PI / 2 - (e.facing || 0);
      const u = p.userData;

      // gait straight off the sim's own velocity — no view-side state to drift
      const spd = Math.hypot(e.vx || 0, e.vy || 0);
      u.phase += dt * (2 + spd * 0.10) * (e.gaitBias || 1);
      const sw = Math.sin(u.phase) * Math.min(1, spd / 60);
      u.legL.rotation.x = sw * 0.85; u.legR.rotation.x = -sw * 0.85;
      u.armL.rotation.x = -sw * 0.6; u.armR.rotation.x = sw * 0.6;

      // drunks list while they walk — the sim wobbles x, the body sells it
      p.rotation.z = (e.drunk && spd > 5) ? Math.sin(u.phase * 0.9) * 0.09 : 0;

      // KO: fall over. The sim owns `ko`; the view only tips the body (1.45 rad,
      // same angle the 2D prone pose uses).
      const down = !!e.ko || (e.hp != null && e.hp <= 0);
      p.rotation.x = lerp(p.rotation.x, down ? -1.45 : 0, Math.min(1, dt * 8));
      p.position.y = down ? 8 : 0;

      // ⚠️ THE SWING BEAT LIVES ON windT/strikeT, NOT atkT. windT (0.13s) is the
      // telegraph — the arm goes BACK; strikeT (0.18s) is the arm-out impact
      // frame; atkT is only the post-swing COOLDOWN (0.38s). The first build
      // animated the lunge off atkT, which plays the swing AFTER the hit lands.
      const wind = (e.windT || 0) > 0, strike = (e.strikeT || 0) > 0;
      u.torso.rotation.x = u.slouch + (strike ? -0.3 : wind ? 0.12 : 0);
      if (strike) u.armR.rotation.x = -1.9;
      else if (wind) u.armR.rotation.x = 0.95;

      // filmers film: both arms up, a phone in the hands. The sim marks them
      // (`filmer`, state 'film') and BUSTED's whole joke depends on you seeing
      // who is recording you.
      const filming = !!e.filmer && e.state === 'film';
      if (filming) {
        u.armL.rotation.x = u.armR.rotation.x = -2.1;
        if (!u.phone) {
          u.phone = box(3, 9, 1.6, 0x14161c);
          u.phone.position.set(4, 54, 10);
          p.add(u.phone);
        }
        u.phone.visible = true;
      } else if (u.phone) u.phone.visible = false;

      // hit flinch away from the blow
      if (e.hitT > 0 && e.hitDir != null) {
        const k = e.hitT * 14;
        p.position.x += Math.cos(e.hitDir) * k;
        p.position.z += Math.sin(e.hitDir) * k;
      }

      if (id === '__p') {
        const kind = (e.held && e.held.kind) || null;
        if (u.wkind !== kind) {
          if (u.wmesh) { p.remove(u.wmesh); u.wmesh = null; }
          if (kind && kind !== 'fist') { u.wmesh = makeWeapon(kind); u.wmesh.position.set(14, 25, 4); p.add(u.wmesh); }
          u.wkind = kind;
        }
        if (u.wmesh) u.wmesh.rotation.x = u.armR.rotation.x * 1.15;
        // the crate rides in both arms, out front — you can SEE you're carrying
        if (!!e.carryCrate !== !!u.crate) {
          if (u.crate) { p.remove(u.crate); u.crate = null; }
          else { u.crate = box(20, 14, 16, 0xc9a227); u.crate.position.set(0, 30, 13); p.add(u.crate); }
        }
        if (u.crate) { u.armL.rotation.x = u.armR.rotation.x = -1.2; }
        if (e.cuffedT > 0) { u.armL.rotation.x = u.armR.rotation.x = 0.85; }
        // the black eye persists to the next morning
        if (!!e.blackEye !== !!u.shiner) {
          if (u.shiner) { u.head.remove(u.shiner); u.shiner = null; }
          else {
            u.shiner = box(1, 1, 1, 0x3a2c3c);
            // ⚠️ head is a SCALED unit box (12³): child units are parent-relative.
            u.shiner.scale.set(3.4 / 12, 2.6 / 12, 1 / 12);
            u.shiner.position.set(-0.18, 0.08, 0.54);
            u.head.add(u.shiner);
          }
        }
      }
    }

    // ⚠️ Deletion is by EXISTENCE, not visibility — `alive` spans every room, so
    // stepping through a door hides the street cast instead of destroying and
    // rebuilding 38 rigs.
    const alive = new Set(all.map(a => a.id));
    for (const [id, p] of this.people) {
      if (alive.has(id)) continue;
      this.scene.remove(p); this.people.delete(id);
    }
  }

  // ── CAMERA ────────────────────────────────────────────────────────────────
  applyCamera(dt) {
    const g = this.g, p = g.player;
    if (this.cam.shake > 0) this.cam.shake = Math.max(0, this.cam.shake - dt * 2.2);
    const sh = this.camFx ? this.cam.shake : 0;
    const jx = sh ? (Math.random() - 0.5) * sh * 26 : 0;
    const jz = sh ? (Math.random() - 0.5) * sh * 26 : 0;

    let tx = p.x, ty = p.y, distMul = 1;
    if (this.focus) {
      this.focus.t -= dt;
      if (this.focus.t <= 0) this.focus = null;
      else { tx = this.focus.x; ty = this.focus.y; distMul = 1 / (this.focus.k || 1); }
    }
    this.cam.x = lerp(this.cam.x, tx, Math.min(1, dt * (this.focus ? 3.2 : 6)));
    this.cam.y = lerp(this.cam.y, ty, Math.min(1, dt * (this.focus ? 3.2 : 6)));

    // ⚠️ Inside a room the wheel is overridden: the camera frames the ROOM —
    // rooms are 560–760 wide and a street-scale dist would put three other shops
    // in frame through the missing front wall.
    let dist = this.dist * distMul, pitch;
    const room = this.g.room !== 'ext' && INTERIORS[this.g.room];
    if (room) {
      this.cam.x = lerp(this.cam.x, room.w / 2, Math.min(1, dt * 8));
      this.cam.y = lerp(this.cam.y, room.h / 2 + 40, Math.min(1, dt * 8));
      // ⚠️ pitch 0.42, not 0.55 — from higher up, a 96-tall bookshelf reads as a
      // floor mat. Furniture needs to be seen from the side to BE furniture.
      dist = Math.max(room.w, room.h) * 1.3;
      pitch = 0.42;
    } else {
      pitch = lerp(0.30, 0.72, (dist - 480) / (1400 - 480));
    }

    // Rip shakes: the sim sets shakeAmp the morning after; the lens wobbles.
    const wob = (this.camFx && p.shakeAmp) ? p.shakeAmp : 0;
    const wt = performance.now() * 0.004;
    const wx = wob ? Math.sin(wt * 1.7) * wob * 9 : 0;
    const wz = wob ? Math.cos(wt * 1.3) * wob * 9 : 0;

    // ⚠️ Polar, never two independent offsets: `dist` is the radius, `pitch`
    // rotates along it, frame size stays constant as you tilt.
    const ang = lerp(0.35, 1.45, Math.max(0, Math.min(1, pitch)));
    this.camera.position.set(
      this.cam.x + jx + wx,
      Math.sin(ang) * dist,
      this.cam.y + Math.cos(ang) * dist + jz + wz);
    this.camera.lookAt(this.cam.x, PERSON_H * 0.5, this.cam.y);
  }

  // ── SKY / WEATHER — one sun, staged by the sim's own clock ───────────────
  applySky() {
    const b = Math.max(0, Math.min(3, this.g.block || 0));
    const su = SUNS[b];
    let day = su.day, sunI = 0.5 + day * 2.4, hemiI = 0.6 + day * 1.9;

    const wx = this.g.weather;
    if (wx === 'overcast') { sunI *= 0.45; hemiI *= 1.1; day *= 0.8; }
    if (wx === 'rain') { sunI *= 0.3; hemiI *= 0.95; day *= 0.62; }
    if (wx === 'heatwave') { sunI *= 1.15; }

    // ⚠️ Interiors are LIT ROOMS: weather and the hour reach them only through
    // the doorway. Flat indoor light + a gentler sun for shadow shape, and the
    // point light (switchRoom) does the rest.
    if (this.curRoom !== 'ext') { hemiI = 2.3; sunI = 1.1; }

    this.sun.intensity = sunI;
    this.hemi.intensity = hemiI;
    this.sun.color.setHex(su.col);
    this.sun.position.set(this.cam.x + su.dx, su.h, this.cam.y + 420);
    this.sun.target.position.set(this.cam.x, 0, this.cam.y);
    this.sun.target.updateMatrixWorld();

    let sky = new THREE.Color(C.night).lerp(new THREE.Color(0x9fc0e0), day);
    if (wx === 'overcast' || wx === 'rain') sky.lerp(new THREE.Color(0x5a6470), 0.45);
    if (wx === 'heatwave') sky.lerp(new THREE.Color(0xd8b070), 0.22);
    this.renderer.setClearColor(sky);
    this.scene.fog.color = sky;

    // storefront glow: 0 day · 1 evening (everything) · 2 late (open-late only)
    const stage = b >= 3 ? 2 : b === 2 ? 1 : 0;
    if (stage !== this._nightStage && this._setTownNight) {
      this._nightStage = stage;
      this._setTownNight(stage);
    }

    this.rain.visible = wx === 'rain' && this.curRoom === 'ext';
  }

  tickRain(dt) {
    if (!this.rain.visible) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < this.rainDrops.length; i++) {
      const d = this.rainDrops[i];
      d.y -= 900 * dt; d.x -= 120 * dt;                    // the 2D slant, in world
      if (d.y < 0) { d.y = rr(500, 700); d.x = rr(-700, 700); d.z = rr(-700, 700); }
      m.makeTranslation(this.cam.x + d.x, d.y, this.cam.y + d.z);
      this.rain.setMatrixAt(i, m);
    }
    this.rain.instanceMatrix.needsUpdate = true;
  }

  // ── ROOMS ────────────────────────────────────────────────────────────────
  // Rooms live at their sim coordinates (the sim MOVES the player into room
  // space on enterRoom), overlapping the town's west end — so town and room are
  // never visible together: one Group swap per door.
  switchRoom() {
    const roomKey = this.g.room || 'ext';
    if (roomKey === this.curRoom) return;
    const old = this.rooms.get(this.curRoom);
    if (old) old.visible = false;
    this.curRoom = roomKey;
    const inside = roomKey !== 'ext';
    this.world.visible = !inside;
    if (inside) {
      let r = this.rooms.get(roomKey);
      if (!r) {
        try { r = buildRoom(roomKey, INTERIORS[roomKey] || { w: 640, h: 380 }); }
        catch (e) { console.error('room build failed', roomKey, e); r = new THREE.Group(); }
        this.rooms.set(roomKey, r); this.scene.add(r);
      }
      r.visible = true;
      // fog OFF inside — the room sits entirely inside fog.near otherwise
      this.scene.fog.near = 90000; this.scene.fog.far = 100000;
      const it = INTERIORS[roomKey] || { w: 640, h: 380 };
      this.roomLight.position.set(it.w / 2, 170, it.h / 2);
      this.roomLight.visible = true;
    } else {
      this.scene.fog.near = this._fogDefaults.near;
      this.scene.fog.far = this._fogDefaults.far;
      this.roomLight.visible = false;
    }
  }

  // ── the interface main.js speaks ─────────────────────────────────────────
  render(dt) {
    if (!this.g) return;
    dt = Math.min(0.1, dt || 0.016);
    // ⚠️ Self-healing size: if the renderer was constructed before layout (a
    // collapsed pane, a slow first paint), resize() clamped to 480×320 and no
    // window-resize event ever fixes it — the game runs stretched-blurry
    // forever. One comparison per frame closes the whole class.
    // Heal only when the buffer is SMALLER than the element — the stuck case.
    // (An oversized buffer is deliberate: QA screenshots setSize larger.)
    const cw = this.cv.clientWidth;
    if (cw && this.cv.width < cw) this.resize();
    this.buildTown();
    this.switchRoom();
    this.syncPeople(dt);
    this.applyCamera(dt);
    this.applySky();
    // the heist blackout: the Game Barn after dark — but NOT pitch black. The 2D
    // dark mode still lets you FIND the crates and the window; here a cold spill
    // of streetlight through that window (620,66 — the exit) does the same job.
    if (this.curRoom === 'gamebarn' && this.g.gameBarnDark) {
      this.sun.intensity = 0.15; this.hemi.intensity = 0.45;
      this.renderer.setClearColor(0x06070b);
      this.roomLight.color.setHex(0x9fb4d8);
      this.roomLight.intensity = 34000;
      this.roomLight.position.set(620, 120, 66);
    } else {
      // ⚠️ UNCONDITIONAL restore. Gating this on `roomLight.visible` meant the
      // restore never ran while outside (visible is false there), so the heist's
      // cold 34000 spill leaked into the NEXT room you walked into — and every
      // room after that. Cleanup must not depend on the state being cleaned up.
      this.roomLight.color.setHex(0xffe2b0);
      this.roomLight.intensity = 120000;
    }
    this.tickRain(dt);
    this.tickBarks(dt);
    this.tickParts(dt);
    this.renderer.render(this.scene, this.camera);
  }

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
    tex.colorSpace = THREE.SRGBColorSpace;   // matches the sign textures — unset, barks render washed out
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

  focusOn(x, y, k, dur) {
    // ⚠️ Same gate as render.js focusOn: "Camera motion: OFF" is a promise that
    // the camera never moves on its own — authored beats included, not just
    // shake. The review caught 3D honouring only half the promise.
    if (!this.camFx) return;
    this.focus = { x, y, k: k || 1.2, t: dur || 1.4 };
    this.cam.shake = Math.min(1, Math.max(this.cam.shake, ((k || 1) - 1) * 0.8));
  }

  fx(kind, x, y, d = {}) {
    const r = FX_RECIPES[kind];
    if (!r) return;
    if (kind === 'impact' || kind === 'ko') this.cam.shake = Math.max(this.cam.shake, 0.28);
    for (let i = 0; i < r.n; i++) {
      const m = new THREE.Mesh(_box, mat(r.col));
      const s = rr(r.size[0], r.size[1]) * 2.2;
      m.scale.set(s, s, s);
      m.position.set(x + rr(-4, 4), r.h + rr(-3, 3), y + rr(-4, 4));
      const ang = kind === 'whiff' ? (d.ang || 0) + rr(-0.3, 0.3) : rr(0, Math.PI * 2);
      const side = rr(r.side[0], r.side[1]);
      this.scene.add(m);
      this.parts.push({ m, vx: Math.cos(ang) * side, vz: Math.sin(ang) * side,
                        vy: rr(r.up[0], r.up[1]), g: r.g, t: rr(r.dur[0], r.dur[1]) });
    }
  }
  tickParts(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t -= dt;
      if (p.t <= 0 || p.m.position.y < 0) { this.scene.remove(p.m); this.parts.splice(i, 1); continue; }
      p.vy -= p.g * dt;
      p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      p.m.rotation.x += dt * 7; p.m.rotation.z += dt * 5;
    }
  }

  shotDataURL() { this.renderer.render(this.scene, this.camera); return this.cv.toDataURL('image/png'); }
}
