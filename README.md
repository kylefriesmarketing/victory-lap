# VICTORY LAP

**An open-town roguelike RPG about never leaving.** Top-down, browser, single-player.

### ▶ Play: https://kylefriesmarketing.github.io/victory-lap/

Design pitch: `~/Downloads/victory-lap-design.md`. Visual constitution: `ART_BIBLE.md`
(read it before touching any rendering — the QC rule is binding).

**This README is the milestone authority for this repo.**

## Deploy

Pages serves **master, root** — so deploying is just `git push origin master`. There is
no build step and no separate deploy repo; `index.html` + `js/` are the site.

⚠️ M-rated content in a public repo. Kyle authorised publishing on 2026-08-05.

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

- **M1.2 — voice, pockets, and street life** ✅ (2026-08-06)
  **Vulgarity pass**: the shipped dialogue was PG-13 against a design doc that calls
  the vulgarity "load-bearing." Rewritten to the doc's own standard — R-rated in
  service of the joke, never slurs, never cruelty without a punchline — now 155 lines,
  with a second beat of pathos under the profanity for Earl, Dale, Gary and Bev.
  **Rolling bodies**: combat finally pays. Everyone carries a wallet sized to
  characterise them (tourists $22–55, townies $3–11); robbing a downed man costs heat
  and buys a 65% grudge. Bodies get back up (26s, 38s if searched) and the robbed ones
  get up angry, turn brawler, go persistent, and hunt you. **Scanner HUD**: the heat
  readout is now the police band talking about you in cop shorthand, four stages of
  chatter, replacing three abstract pips. **Visible injury**: real shiner + split lip,
  and a hurt player limps (dip, list, slowed gait). **Street life**: cigarette embers
  on night idlers, and litter drifted against the curb, both dumpsters, the bus
  shelter and the pumps.
  ⚠️ Bugfix worth remembering: `resize()` clamps to a minimum now — a collapsed
  viewport reports `innerHeight` 0, the canvases go 0×0, and the lighting pass throws
  on `drawImage`, permanently killing the render loop.

- **M1.3 — THE FOXHOLE** ✅ (2026-08-06)
  A windowless cinder-block club on gravel at the southeast edge of the Mile, open
  evening and late. **Not a joke sign — a real location with real mechanics**: $8
  cover at the door (Moose does not negotiate), $7 beers, a $5 tip economy that buys
  standing (3 tips = a discount and a nod), the **best heat sanctuary in the game**
  (−24 for a block; nobody in this building has ever helped a police officer), a
  fade-to-black back room that burns a block and patches you up, and **Dee behind the
  bar sells all three scheme intel stages** — an instant, expensive second route to
  what Peanut gives away slowly. That last one is the point: the club is a genuine
  strategic alternative, not set dressing.
  Cast written as people with jobs: Moose (four hundred pages into a submarine book),
  Dee (owns the building, the licence, and everybody's secrets), Cherry (nursing
  school; will tell you about the clavicle), Sable (nineteen years, one knee that
  forecasts weather). **The crudeness is aimed at the clientele, never the staff** —
  that's the Rockstar discipline and it's funnier.

  ⚠️ CONTENT LINES, non-negotiable, straight from the design doc: every character is
  an adult, intimacy is always fade-to-black, nothing explicit is ever rendered, and
  the vulgarity serves jokes — never slurs, never cruelty without a punchline.

- **M1.4 — the Fable pass: crudeness lands everywhere** ✅ (2026-08-06)
  Full writing sweep with the vulgarity treated as the design doc treats it — load-
  bearing, and not sandboxed to one building. The SYSTEM VOICE itself talks like
  Hopewell now: block toasts, weather lines, choice dialogs, register flashes, scheme
  hints ("they weigh what a retirement weighs"), the title screen ("Sign here,
  dumbass. With love."), the menu (The Divorce Special — double everything). Bev went
  crude-grandmother ("I've buried two husbands and a Buick"), Brill's threats got
  domestic ("I'll come to the house. I'll ACCEPT LEMONADE."), and the Foxhole staff
  got filthier ON THEIR OWN TERMS — crude and in charge is the register, never
  diminished (Cherry: "We have a plaque."). 42 pools, 213 lines, 0 malformed.
  The doc's fence is untouched and permanent: adults only, fade-to-black, no slurs,
  no cruelty without a punchline. Crude is the water table, not a district.

- **M1.5 — DOWNTOWN** ✅ (2026-08-06)
  The world grows south: 2200×1500 → 2200×2400. Across the rail spur (the train that
  never stops finally has rails, plus a buckshot-riddled crossbuck) and the vacant
  band (foundation slabs of the downtown that used to keep going, the FREE (STILL)
  couch, the water tower reading H O P _ W E L _) lies **Main Street**: THE SPLIT LIP
  (dive bar — cheap beer, well whiskey with a real hurl roll past shot two, buy-the-
  room-a-round for −12 heat once a day, free house cues, the bathroom of legend),
  LOANSTAR PAWN (Vern fences crates flat $55 no-questions — a coward's third fence —
  and sells the bat), DAYBREAK COFFEE (the Fairview beachhead, operating: $9 lattes,
  and eavesdropping the rep table is a THIRD route into the scheme), four dead
  storefronts spanning three generations of giving up, and the courthouse square with
  its half-mast flag nobody remembers the reason for. New cast: Sal, Vern, Madison,
  the Fairview reps, and the splitlip_reg pool — the filthiest poetry in the game.
  Brill's evening route now sweeps Main Street; ambient population fills both drags.
  ⚠️ The facade painter is parameterized now — `_paintBuilding(c, b, Y, alley)` —
  one painter, two rows, don't fork it.

- **M1.6 — CASSIDY WORKS** ✅ (2026-08-06)
  The world grows east: 2200 → 3400 wide. The plant district from the design doc —
  sawtooth-roofed works with the CASSIDY WORKS ghost sign, two stacks (one still
  smoking: the town's pulse in coal-grey, live particles), the gate with its barrier
  arm and "A PROUD PARTNER IN HOPEWELL'S FUTURE (sign older than the future)",
  boxcars on the spur tagged STENCH · DEBRA · YOLO (crossed out), sodium yard lights
  at night (ORANGE — a different color temperature than downtown, on purpose), and
  the LEAVING HOPEWELL (why though?) sign at the town line. Two new hustles: the
  **dock shift** (evenings only, $52 cash, costs 5 hp — "your back files a
  grievance", refused below 25 hp by union rule) and the **fell-off-a-truck pallet**
  (one per day, seeded position, Gus knows every pallet BY WEIGHT — his 250px
  sightline turns it into timing stealth; caught = day blown + ledger entry). Freight
  fences at Roxy ($26) or Vern ($20). The **Union Hall (Local 448)** is always open —
  lit out of spite — with Denny (forty years of grievances), 50¢ honor-box coffee,
  and the second-best lay-low in the game (−16). The shift horn sounds block changes
  when you're near the plant. Denny and Gus join the cast; Gus is the first civilian
  route-walker (patrol logic now exists outside cops).

- **M1.7 — THE BLUFFS + the burglary system** ✅ (2026-08-06)
  World 3400×3200. Lake money, boat people, and the doc's promise delivered: "the
  only district where the police response is genuinely fast, because up here they
  actually pay for it."

  **The burglary loop is a READING game, not a lockpick minigame.** Each of five
  houses rolls a daily state from a **salted hash, never `this.rng`** (the UI reads
  it every frame for tells; it must not advance the sim stream or drift mid-day).
  The state is broadcast entirely through *painted tells* — car in the drive, lit
  windows (unmissable at night), packages piled up, sprinklers running unwatched, a
  cracked lake window. **And the alarm signs LIE**: every alarmed house has one, but
  so do 40% of unalarmed ones — that's the doc's "security that's mostly decorative"
  turned into the central mechanic. Casing a house (5s from the road) converts tells
  into certainty. That gap between reading and knowing IS the skill.

  Entry: the open window (quiet, no tools) or pry the slider (needs iron). Three
  clock tiers — quiet 105s, alarmed 50s, **owner home 25s and he's already dialling**.
  Searching is press-your-luck: six spots, each costs its own seconds off the clock,
  the safe needs a crowbar, carry weight caps you at 6. Run the clock out and two
  cruisers arrive *without sirens, which is how you know they were already close.*

  **The DA golfs off his caseload every Friday** (doc, verbatim) — so on Friday his
  house is guaranteed empty, his alarm is always real, and he's standing at the club
  where you can see him. That's the Bluffs' drop night, and it rhymes with the Game
  Barn job by design.

  Loot fences differently by fence: Roxy pays full and never looks; **Vern has a
  loupe and a ledger, so serial numbers cost you 38%** (verified: same four pieces,
  $366 vs $292). The FAIRVIEW — PHASE III binder is worthless to both — give it to
  Denny at the union hall instead for +REP and forty years of phone calls.
  ⚠️ A pistol in a bedside safe is a **refused** loot type — you find it, you leave
  it, it can never enter inventory. The doc's gun stance, enforced in data.
  ⚠️ `addHeat(..., wired=true)` bypasses the empty-street discount for machine
  witnesses. Without it an alarm at 3 a.m. cost 9 heat instead of 34 and the whole
  district was free. Alarms don't care if anyone's watching.
  ⚠️ ONE parameterised `house` interior serves all five — they differ by tier and
  loot, not floorplan. Don't hand-paint five mansions for a 40-second room.

- **M1.8 — HOPELESS TECH (the sixth and final district)** ✅ (2026-08-06)
  All six of the design doc's districts now exist. HTCC sits in the empty southeast,
  east of downtown and south of the plant, fronting Main Street — where a commuter
  college goes. The quad (crossed paths plus the diagonal desire line they were
  meant to prevent, and the Class of 1994 Memorial Fountain, dry since the ’09
  budget), Chalmers Hall with the clock **stopped at 4:20 since 2011**, the Trades
  Annex, the gym (GO PRAIRIE DOGS · 0–11 · the banner still goes up), the **Barrows
  Center** — glass and stone, matching nothing else on campus, "gift of D. Barrows
  ’78, current address sealed" — the library, the gravel commuter lot, and the sign
  somebody has corrected to **HOPELESS**.

  **The campus rule is the doc's, enforced in one place:** metal detectors at every
  entrance, no-carry, "sensitive enough to catch a belt buckle." Walk into any campus
  building holding a weapon and Campus Safety confiscates it, permanently, plus a
  little heat. That makes the whole district a fists-and-wits zone by construction.
  ⚠️ The crowbar is **stashed in the hedge and returned on exit**, never confiscated —
  a first pass hard-refused entry while you carried iron, which is a dead end, since
  the scheme needs the crowbar and the disbursement needs the aid office.

  **Real money, legally, for the first time:** attend two welding sessions and Ms.
  Pettigrew disburses **$180** — the biggest legal sum in the game, gated on
  attendance rather than need, which is exactly the doc's joke. And welding class
  outputs a **pry bar** — your own iron, made not bought, a free fourth route to the
  scheme's `tools` stage. Plus the library lay-low (−12) and spotting at the gym.

  **The Polo Shirts** are in: Trevor patrols the quad, can't arrest anybody, and
  telephones somebody who can if he catches you carrying. And you can sit on the
  cart. You should not sit on the cart.
  ⚠️ cart rage is 11, not 26 — at 26 the crowd multiplier put you at WANTED off one
  golf cart. It's a misdemeanour of the heart.

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
