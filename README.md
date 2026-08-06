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

- **M1.1 — outside review pass** ✅ (2026-08-05)
  Full review against the design doc + art bible, then the ship list applied. Run length
  halved (`blockSeconds` 150→75) plus a clickable clock to skip a dead block — gated off
  at NAMED, so it's a decision the cops can take away from you. The heist now exits
  through the window it entered (that branch was unreachable). Shop hours consolidated
  into `game.isOpen()` with per-shop refusal lines. The Sunday buyer requires actually
  committing to `hold`. Map knowledge carries forward and pre-completes scheme stages.
  The live heist gained real per-trip patrol risk. The Rip hangover became a mechanic in
  the register instead of a CSS jitter. Register stalling no longer out-earns playing
  well; haggle/hold EV rebalanced so neither is strictly dominant. Six named characters
  got bodies in their shops (they were invisible hotspots). Three per-frame
  `Math.random()` "flickers" became time-driven. The town talks about the heist
  afterward, and every ending gained a coda that knows what your week actually was.

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
- Hidden Browser-pane tabs suspend rAF — three real bugs came from this on day one:
  (1) anything that must advance lives in the setInterval fallback; (2) `regTick`/
  `cuffTick` sit OUTSIDE the `!modalPause` gate there (the modals ARE the modalPause —
  gating them deadlocks the cuff overlay forever); (3) the E-interact handler computes
  `findNearest()` ON DEMAND — the prompt cache is rAF-fed and goes stale when hidden.
- `serve.mjs` must build ROOT with `fileURLToPath`, never `URL.pathname` — this
  workspace path contains a SPACE ("New folder") and pathname keeps it as `%20`,
  which 404s every file while the server looks perfectly healthy.
- `tools-shot-receiver.mjs` (repo root, one level up) HARDCODES port 8399 and treats
  argv[2] as the OUTPUT DIR — passing a port as an arg silently creates a directory
  named after the port. Concurrent sessions fight over 8399; check who's listening and
  read the POST response body — it contains the actual written file path.
- The Browser pane allows 5 dev servers per folder and concurrent chats consume them —
  when the slots are gone, run the server detached (`Start-Process`) and point
  `preview_start {url}` at it. Harness background tasks got reaped mid-session;
  detached processes survived.
- One Gary catch blows the whole night (`_garyNight`), or players spam the 40% roll.
  Heat witness multiplier is CAPPED at 2.5× or one punch in a crowd nearly maxes the
  county. Shift pay scales by orders completed (Escape = walk off mid-shift).
- The morning-after meta lives in `localStorage['vl-meta-v1']`; the sim writes to the
  SAME meta object it was constructed with, so soak metas and live metas never mix.
- **`leaveRoom`'s branch order is load-bearing.** `gamebarn` is in `BUILDINGS`, so the
  generic front-door exit shadows the "out the window" branch unless the dark-store
  check comes FIRST. Symptom: the heist dumps you on the lit sidewalk out front, 338px
  from your entry point, in the NPC walk lane.
- **Shop hours live in `game.isOpen()`, never in the UI.** main.js used to keep its own
  `openMap` for the prompt while `enterRoom` guarded only two doors — three shops read
  "(closed)" and opened anyway.
- Anything the soak bot uses must also exist on the LIVE path. `heistPatrolRisk` and
  `shakeAmp`'s outcome effects were bot-only for a day: the real heist had no escalating
  danger and the Rip hangover was a 2px CSS jitter. If a constant is referenced only
  from a `*Auto()` method, that's the smell.
- Heat multiplier: discount the empty alley without discounting the crowd. A first pass
  at a witness floor quietly halved every heat gain in the game (BUSTED fell 8→2 of 64).
  Always re-run the soak and read the ENDING DISTRIBUTION, not just the green check.
- WALKING is only ever granted by `walkOut()` (catching the 6 a.m.). Reaching Sunday
  with the money and no bus ticket is STUCK, on purpose — it's the best story the
  prototype tells. Don't "fix" it back into a week-end win.
