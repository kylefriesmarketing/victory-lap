# VICTORY LAP

**An open-town roguelike RPG about never leaving.** Top-down, browser, single-player.
Design pitch: `~/Downloads/victory-lap-design.md`. Visual constitution: `ART_BIBLE.md`
(read it before touching any rendering — the QC rule is binding).

**This README is the milestone authority for this repo.**

## Run it

```
powershell -ExecutionPolicy Bypass -File serve.ps1     # http://localhost:8444
```

Uses the portable Node at `C:\Users\kylef\tools\node` (not on PATH).

## Milestones

- **M1 — Phase 1: The Miracle Mile prototype** ✅ (2026-08-05)
  One district, hand-built. The day-block loop (4 blocks/day × 7 days = one "Add/Drop
  Week" mini-run, ~20–30 min). Top-down movement + improvised-weapon combat (fists,
  bottles, chairs, cues — durability, throws, no guns in Phase 1). HPD heat stages 1–3
  (Noticed → Named → Wanted) with the wave-and-mention-your-grandmother beat. One
  substance: **Rip** (+1 block today, −1 tomorrow + the shakes). One job: the **Wing
  Barn register** (real minigame: make change, watch the camera cone, skim at your own
  risk). One mini-Scheme: **The Game Barn Job** (case it, tool up, learn the window, do
  the job, fence it). Endings: **WALKING** (cash out, catch the 6 a.m. bus), **BUSTED**
  (cuffed), **BODIED** (county), **STUCK** (the week just… ends — Phase 1 stand-in until
  the real BROKE debt engine lands). Morning-after reset with light persistence: map
  knowledge (the propped window, the camera blind spot, the bank-drop night stay
  *known*), Cred/Scars/Lessons/Rep tallies, run count, NPC greet-by-run barks.

## What's deliberately NOT in Phase 1 (per the roadmap — don't "fix" these)

- No Hopeless Tech, classes, GPA, or majors (Phase 2).
- No Beef system, no factions/rep lanes, no Scheme draw-of-three (Phase 2).
- No guns anywhere (full design prices them as a crossed line; Phase 1 omits them).
- BROKE is not a real ending yet — debt exists only as the payday-loan flavor. STUCK is
  the Phase 1 timeout epilogue.
- Addiction only *warms* (meter shows after repeated Rip); full conversion Phase 2+.
- Keyboard/mouse only. Touch comes with the later phases.

## Architecture

- `js/data.js` — ALL content and tuning: the town plan, casts, barks, prices, scheme
  stages, heat/tuning constants. Balance changes go here and only here.
- `js/game.js` — the entire sim, DOM-free and importable in Node: world state, entities,
  clock, heat, combat resolution, jobs, scheme, endings, seeded LCG rng (`g.rng` — never
  `Math.random` in sim code; view code may use `Math.random` freely).
- `js/render.js` — canvas painter: pre-painted grime ground, procedural characters
  (silhouette archetypes), the lighting pass (per-block grade + light sources + long
  shadows + rain reflections), VFX pools.
- `js/audio.js` — WebAudio synth only (no files): per-block ambient beds, the far train
  horn, sfx. Beds tracked and stopped on switch (the Age of Toys leak lesson).
- `js/main.js` — boot, input, HUD/overlay DOM, register minigame, real-time loop
  (**rAF + setInterval fallback** so the sim survives hidden tabs — required for
  headless verification in the Browser pane).
- `tests/soak.mjs` — the authority: headless policy-bot runs over N seeds through the
  REAL sim (`node tests/soak.mjs`). Asserts 0 throws, clock monotonic, heat within
  bounds, money never NaN, and all four endings reachable across the seed sweep.

## Debug / verification handles (in-page)

- `window.vl` — the live game state.
- `window.__vlAct(name, arg)` — drive sim actions from the console/CDP.
- `window.__vlShot(name)` — force a render + `toDataURL` POST to the shot receiver on
  :8399 (`tools-shot-receiver.mjs` in the Age of Toys repo root). Canvas 2D, so unlike
  the WebGL games this also survives `computer{screenshot}` — but DOM checks first.
- `window.__vlSoak(seed)` — in-page wrapper over the same policy bot the Node soak uses.

## Traps learned (keep current)

- The workspace root's `.git` is EMPTY/broken — this subfolder has its OWN repo. Commit
  here; the root gives you no undo.
- `game.js` must stay importable in Node: no `window`/`document` at module top level;
  view callbacks all guarded (`this.cb.x && this.cb.x()`).
- Hidden Browser-pane tabs suspend rAF and throttle timers — anything that must advance
  for verification lives in the setInterval fallback path.
- Skim strikes and heat witnesses key off SIGHTLINES (`seenBy`), not distance alone.
  Camera cone state in the register minigame is authoritative in `game.js`, mirrored in
  DOM — don't fork it.
