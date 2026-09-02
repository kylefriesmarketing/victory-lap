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

- **M1.9 — the world layer: one sun, one memory, one weather** ✅ (2026-08-06)
  An "alive" pass built as **world-scale systems rather than per-district dressing**,
  because that's what actually spreads evenly across six districts.
  **THE SUN** (`SKY` in data.js) is now a single source of truth driving the ambient
  wash, a per-hour world grade, and — the part that sells it — the **direction and
  length of every shadow in the game**. Long and west at breakfast (sunX −1.0,
  len 2.1), short and hard at noon (0.18, 0.85), long and east at supper (1.15,
  2.4). ⚠️ render.js used to keep a private `ambients` array that could drift out of
  step with the shadows; it's gone, SKY is the only table.
  **THE WEAR LAYER** — one quarter-res world canvas (850×800 for a 3400×3200 world)
  that accumulates and never resets inside a run: the paths you actually walk
  (one scuff per stride, not per frame), blood where people went down, vomit
  outside the Lip, glass, splinters. Composites over the baked ground, under
  everything alive, so all six districts get a memory from one implementation.
  **WET GROUND** — rain now darkens and sheens the entire county rather than
  filling a few authored puddles.
  **GRUDGE HEAT** — the design doc's second, civilian track, finally built:
  *"Rob a man's garage and HPD forgets by Thursday — he doesn't."* It **never
  decays** (verified: overnight HPD 60→25, grudge 11→11). It buys three things at
  thresholds — every counter in town marks you up (+14%/point, capped near double),
  then somebody starts waiting in a parking lot once a day, then doors stop opening
  at all. Shown in the HUD as a sentence about people, not a bar, because that's
  what a grudge is.

- **M1.10 — people who are going somewhere** ✅ (2026-08-06)
  **ERRANDS**: ~62% of the street now has a real destination from `ERRANDS` in
  data.js — the bus shelter, the Split Lip, the plant gate, the quad, home in the
  Flats — and walks there across district lines at a purposeful gait, dwells, then
  thinks of the next thing. Seeing a man walk from the dock to the bar is the whole
  point. ⚠️ Tuned by MEASUREMENT: at 45% with a 14–34s dwell, a sampled instant
  showed **zero** people mid-errand — the journeys were real but you'd never happen
  to see one. At 62% with a 7–19s dwell it measures ~4 people visibly in transit at
  any moment.
  **IDLE BUSINESS**: every body gets one habit, rolled once at spawn so it's a trait
  and not a flicker — hands in pockets, on the phone (with a lit screen), arms
  crossed and leaning, gesturing at nobody, or shifting weight. A standing body that
  only breathes reads as furniture.
  **GAIT VARIETY**: per-person `gaitBias`, so a crowd stops marching in lockstep.
  **SIX NEW OUTFITS** (carhartt, jersey, scrubs, hoodie, church, workshirt) so
  nineteen people don't read as four cloned.
  ⚠️ Their pants are validated against the asphalt — a first pass had workshirt at
  `#4a4a42`, **six values** off the road, which is exactly the floating-torso bug
  data.js already warns about. All new pants are now ≥45 apart by channel sum.

- **M1.11 — the camera** ✅ (2026-08-06)
  Was a flat lerp-follow at a fixed 1.35. Now it reads the situation and re-frames
  itself, with every number deliberately small per the art bible's "restrained".
  **Danger widens, tension tightens** — and none of it is authored per scene, it
  falls out of sim state, so it works in all six districts and every interior:
  | state | zoom | why |
  |---|---|---|
  | cop chasing | 1.10 | widest — you need to see the exits |
  | aggressor within 300px | 1.16 | a fight needs room |
  | sprinting | 1.27 | slight pull-back with speed |
  | base | 1.35 | |
  | any interior | 1.46 | rooms are small |
  | mid-burglary | 1.52 | tightest — feel the walls, the clock is running |

  **Lead**: the frame pushes ~62px the way you're travelling so the road ahead gets
  the screen space, eased slowly (an aggressive lead is what makes top-down cameras
  nauseating) and boosted when you're knocked back, so you look where you're thrown.
  **Punch**: a landed hit spikes zoom 5% and releases in a quarter second —
  verified 1.350 → 1.413 → 1.350.
  **Breathing**: a couple of pixels of drift so a standing frame isn't dead still.
  **`focusOn(x, y, z, dur)`** for authored beats — currently the heist landing, the
  fence cash-out, and hitting WANTED.
  **🎥 Camera motion toggle** in the pause menu (persisted): off is a plain locked
  follow with no lead, punch, widen or drift. The bible asked for configurable.

- **M1.12 — THE FLATS: where you live** ✅ (2026-08-06)
  The thinnest district becomes the emotional floor, and it finally has the two
  things the design doc specified and the build never had.

  **THE SANCTUARY.** *"The Flats is the one place where your heat cools naturally:
  nobody here talks to police."* Passive decay, 0.55/sec, just for standing on your
  own street — **the only passive heat decay in the game**; everywhere else costs a
  block. Verified: 20s in the Flats takes 60 → 49; 20s in the Mile lot takes 60 →
  60. It floors at 8, so it settles you but deliberately **cannot clear a manhunt** —
  a street that could do that would break every chase in the game.

  **WHAT BEV NOTICES.** *"She doesn't ask where the money comes from, but she
  notices, and the game tracks that."* A four-tier ledger that ticks when you come
  home hot, carrying, or wearing a night — evaluated at the one moment she can
  actually see you, which is when you sleep. ⚠️ It **never blocks anything and never
  costs a cent**. It only changes what she says, and that restraint is the whole
  mechanic. Verified climbing 4 → 8 → 12 over three bad nights, ending on *"Whatever
  it is, it ends this week. I've buried enough men out of this house."*

  **THE BLOCK.** Five houses whose yards say who lives there — Miss Ruthie's porch
  chair and wind chimes, Darnell's Buick up on blocks since March, Yolanda's
  permanently-stacked folding tables, a foreclosed house whose grass somebody still
  cuts, and an above-ground pool holding two feet of green water. Chain-link between
  every yard, mailboxes with names, a NO OUTLET cul-de-sac and a bent hoop.

  **THE BLOCK PARTY**, Saturday evening: seven neighbours turn out, and the street
  gives you things for free because that's what the street is — a plate (+30 hp,
  −10 heat) and **all three scheme intel stages, at no cost**, a fourth route that
  costs only being someone this block still claims.

  ⚠️ TONAL RULE, and it's deliberate: everywhere else the crudeness points outward
  at marks and money. In the Flats it points **inward**, which in this town is how
  affection is spelled. Do not make the Flats mean.

- **M1.13 — THE PRINTED PLATES: a Higgsfield pass, 12 credits** ✅ (2026-08-29)
  Seven images, and the discipline is *where* they were allowed to go.

  ⚠️⚠️ **GENERATED ART IS BANNED FROM THE TOWN** — see `ART_BIBLE.md`. No sprites, no
  tiles, no props, no portraits, no interiors, no UI icons. Everything the camera sees
  while you are *playing* stays flat vector drawn in code; a raster toy dropped in there
  fights the style and wins ugly. Plates are allowed only where the camera has already
  left the town — endings, title, share card, shelf poster. Printed matter *about* the
  game, not surfaces *in* it.

  **The four endings were a 54px emoji.** In a roguelike you see an ending every ~15
  minutes: it is the payoff, the one moment the camera leaves the top-down view, and it
  was 🌅. Each is now a four-colour screen print in the game's own palette — the 6 a.m.
  bus with the mill sliding past the window, a deputy reading rights off a card while a
  bystander films it vertically, a hospital roommate mid-gesture who has not stopped
  talking in hours, and the back steps on a Sunday night with the kitchen window warm
  behind you. Plus the title screen, an `og:image` (the game had been live for weeks
  unfurling as a grey box), and a real 512×768 shelf poster — VICTORY LAP was the only
  game on THE ROOM wall whose poster was procedurally painted rather than printed, and
  `room.js` already carried the note *"delete the flag the day a real print lands"*.

  ⚠️ **A plate is optional in BOTH directions**: no `card` field, and a `card` that 404s,
  both fall back to the emoji; the title plate layers *above* the old radial gradient
  rather than replacing it. Verified by pointing an ending at a nonexistent file and
  watching 🕒 hold.

  ⚠️ **Fixed a latent CSS bug that only the art could expose.** `#ending` is a column
  flex container with `align-items:center`, so `#end-card` got shrink-to-fit sizing and
  `max-width:620px` was only ever a ceiling — the card actually measured **258px**.
  Harmless while the art was an emoji. The moment a `width:100%` image went in, the plate
  rendered at a third size **and changed width per ending** (277/237/229/204px) because it
  was tracking the longest line of text. It needs an explicit `width`, not a `max-width`.
  All four now measure 620px card / 566×377 plate.

  ⚠️⚠️ **NEVER patch `index.html` with `perl -0pi`.** It round-trips the file through a
  latin-1 lens and double-encodes every em-dash and bullet (U+00E2 U+0080 U+0094 instead
  of U+2014). The whole page turned to "â" glyphs, the diff ballooned to +30/−21 for a
  ten-line change, and the only warning was `Wide character in print`. It had to be
  reverted from git. Patch with node and explicit utf8 — **and assert every replacement
  matched**, because `git checkout` restores this file as **CRLF**, so a multi-line `\n`
  needle silently MISSES while single-line ones land and the script still looks like it
  worked. Same session, same lesson twice: `node -e` inside bash eats backticks and
  `${...}` — write patch scripts with the Write tool.

  ⚠️ **SPEND RECONCILIATION, and a hazard worth knowing.** This pass cost **12 credits**
  — six images at a flat 2cr (nano_banana_pro), confirmed by reading `transactions` after
  the FIRST one rather than trusting a preflight. But the account balance moved **110**
  over the same half hour, because a parallel session was generating on the same account
  at the same time (including Seed Audio, which this pass never touched). **Never read a
  balance delta as your own spend here.** Count your own job IDs — mine were f3b75d5d,
  886afa7d, 4551c3fc, aa7286a3, 871a8435, 768ab6aa — and price from `transactions`.
  ⚠️ This is the third time in one session that bash ate backticks and `${...}` out of a
  `node -e` / heredoc string. CLAUDE.md already says to use the Write tool for any patch
  text containing them. It is right. Do that.

  New QA hook `window.__vlEnd(key)` forces an ending screen. It drives the real `endGame`
  so the summary shape can never drift from the live one, but snapshots and restores
  `meta` around the call — otherwise ending-card QA banks fake runs into the save.

- **M1.14 — THE PLATE SET: 32 more images, 64 more credits** ✅ (2026-08-29)
  Kyle asked for the rest of the art budget to be spent. It was, on four systems —
  and the rule from M1.13 held the whole way: **not one of these is a surface in
  the town.** Every plate is an overlay shown where the camera has already left it.

  **Six district plates.** Crossing into a district raises a card in the lower left:
  THE MIRACLE MILE *"It Gets Better From Here"*, THE FLATS *"Nobody down here talks
  to police"*, DOWNTOWN *"Beautiful buildings. Nobody in them"*, THE BLUFFS *"Where
  the money went when the plant did not"*, HOPEWELL TECH *"Two years. Credits
  transfer, allegedly"*, THE WORKS *"Local 448 built this town, then watched it
  close"*. `DISTRICTS` + `districtAt(x,y)` in data.js — ⚠️ **first match wins**, and
  two of the six regions genuinely overlap (the Works yard sits inside the Flats'
  y-band, the college inside Downtown's), resolved purely by list order.

  **Ten place plates**, same treatment on first entry to the bar, the Foxhole, Ca$h
  Kingdom, the pawn shop, Daybreak, the union hall, the library, financial aid, the
  buffet and the Game Barn.

  ⚠️ **Both fire ONCE EVER, not once per run** — tracked in `meta.seen`, so a new
  player gets the tour of the town and a veteran on run 20 is never interrupted.
  ⚠️ And the card is **non-blocking by construction**: it never sets `modalPause`,
  has `pointer-events: none`, and slides itself away after 4.2s. You keep walking.
  A card that stopped the game to say "THE FLATS" would be worse than no card.

  **Seven night cards.** Sleeping was a 2.8-second floating toast; now it is a page.
  One plate per day — a single lit window Monday, the empty strip after midnight,
  the plant under a moon midweek, rain, Friday's stadium lights blooming four blocks
  over, the block party's string lights, and Sunday an empty bus bench with the sky
  just starting to go grey. **This is where Bev's notice ledger now lands**, which is
  the whole reason to build it: the game's best line had been a floating bark.

  **Eight ending cards instead of four.** A roguelike shows its endings over and over
  and one fixed card per ending is stale by run three, so each now picks from the
  run's own summary — the same object `coda()` already reads. Cash ≥ 400 gets the bus
  pulling away at gold dawn instead of the melancholy window seat; a grudge makes the
  arrest personal instead of procedural; 3+ KOs given puts *both* men in hospital beds
  looking at each other; an open debt tapes a notice to the door.

  ⚠️ **The bug worth remembering.** The district poller originally seeded
  `lastDistrict` silently on its first call so it wouldn't fire a card before the
  player moved. Measured: **5 cards on a first lap instead of 6** — and in real play
  you boot inside the garage (`room !== 'ext'`, so `lastDistrict` is null), step out
  into the Flats, and **THE FLATS never announced itself**. Your own street, the
  emotional centre of the game, silently skipped. A null `lastDistrict` must FIRE.

  ⚠️ Failure paths verified in all directions: a throwing `cardAlt.when` falls back
  to the default card, a `cardAlt` pointing at a 404 falls back to the emoji, a
  missing plate file shows no card rather than a broken image, and the night card
  renders with its art hidden if the image fails. Nothing here can break a run.

  ⚠️ Prompting note: the first six district plates came back with **titles baked into
  the artwork** ("THE FLATS", "DOWNTOWN", one garbled "U.C DISTRICT") because the
  prompt said *"a district title plate"* — which asks for a title. Re-rolled at 2cr
  each with the phrase removed and an explicit *"every sign, banner and billboard is
  blank"*. The game sets its own type; baked type in four different fonts does not.

  ⚠️ 33 image files / 5.3 MB, and **only `title.jpg` is ever fetched at boot** (it is
  a CSS background, and only if the title screen is shown). Every plate loads through
  `new Image()` at the moment it is needed. Verified: 7 fetched after a full lap of
  the town, 0 at load.

  New QA hooks: `__vlNight(day, line)`, `__vlNightOff()`, and `__vlPlates(rearm)` —
  the last one clears the once-ever ledger, which is otherwise fresh-browser-only
  state and so untestable without wiping localStorage by hand.

- **M1.15 — 3D PROTOTYPE (`?3d=1`), opt-in, ~500 lines** ✅ (2026-09-01)
  Kyle asked whether the game could go 3D "kinda like Schedule 1". It can, and the
  answer is cheap for one reason that was decided long before this milestone.

  ⚠️⚠️ **`game.js` IS 100% HEADLESS, AND THAT IS THE WHOLE ASSET.** Grepping it for
  DOM access returns three hits, all of which are the word *"window"* inside prose
  strings. The sim already publishes everything a renderer of any dimensionality
  needs, per entity: `x/y`, `facing`, `vx/vy`, `moving`, `state`, `hp/ko`,
  `atkT`, `hitT/hitDir`, `outfit/skin/hat`, `held`, and even a per-NPC `gaitBias`.
  So 3D is **a second consumer of the same sim, not a rewrite**. `js/render3d.js`
  reads exactly what `render.js` reads. **`game.js`, `data.js` and the soak were not
  touched at all.**

  **What runs today**: the whole town built from the same data (Mile storefronts,
  Main Street, the Flats, the Bluffs, the college, the Works with its stacks, the
  water tower), all 38 people as eight-box figures wearing their real sim outfit /
  skin / hat, gait driven off sim velocity, KO tipping the body, swings and flinches,
  day/night off `game.block`, cast shadows, and barks as camera-facing sprites.
  **1,364 triangles and 114 draw calls for the entire scene** — it is boxes and
  cylinders, there is not one imported model, and it costs nothing to run or make.

  ⚠️ **`?3d=1` is opt-in and the default game pays NOTHING.** Verified on the plain
  URL: three.js is never downloaded, `render3d.js` is never downloaded, and `#cv`
  still gets a 2D context. A canvas can only ever hold one context type, so the
  choice is made once at boot and cannot be toggled without a reload.

  ⚠️ Boot has to **await** the 3D import before `startGame`. The first wiring
  prefetched and hoped; autostart won the race, `Renderer3D` was still null, and it
  silently fell back to 2D with no error — the param was right and the module loaded
  fine, it just landed too late.

  ⚠️ **Five scale/lighting bugs worth keeping**, all found by measuring:
  - **Camera distance must come from world scale.** 520 put the camera inside the
    neighbours' roofs. A person is 62 units and you want ~1100 units of ground in
    frame, so at a 42° FOV `dist ≈ 900`.
  - **Camera must be polar, not two offsets.** Scaling `up` and `back` separately
    meant tilting also changed how far away you were and the framing lurched.
    `dist` is now the radius, `pitch` only rotates along it.
  - **THE SUN MUST BE ON THE CAMERA'S SIDE.** Every facade faces +z, so a sun at
    −z lit the backs of the buildings and everything visible fell in shadow. That
    single sign flip was the whole "why does it look like permanent dusk".
  - **three r155+ turned OFF legacy light units.** Intensities that used to read as
    daylight (~1.0) now render as dusk; these are ~2.5× the old numbers.
  - **A 4-sided cone has its corners at the radius**, so a roof cap is the box's
    half-diagonal. `max(w,d)*0.78` gave a 220-wide house a 344-wide hat.

  ⚠️ **Two sentinel traps that collapsed the crowd into clones** — the sim ships
  **23 distinct shirts, 5 skins and 10 hat kinds** and the first build threw all of
  it away. `n.outfit` is ALREADY the resolved `{shirt,pants}` object, not an index
  into `OUTFITS`; and `n.hat` is the **string `'none'`** when hatless, not null, so
  `if (hat)` was true and the whole town wore a hat coloured `"none"`. Hats are also
  KIND NAMES (`cap`, `trucker`, `curlers`, `bun`, `copHat`), never colours, so they
  needed real shapes. Same class of bug as `carrier === -1` elsewhere in the workspace:
  **check the sentinel, not the truthiness.**

  **NOT done, and this is the honest remaining cost** — the prototype proves the
  architecture, not the product:
  - **The 16 interiors are not built.** This is the single biggest remaining job.
  - No props, vehicles, signage text, road markings, curbs, or per-shop wall variety.
  - The HUD, plates, night cards and endings all still work (they are DOM), but the
    2D view's wear canvas, lighting pass and litter have no 3D equivalent.
  - **Camera pitch is an open DESIGN question, not a setting.** `pitch` 1.0 is the
    current top-down game, 0.0 is Bully/Schedule I at street level. The size-up
    panel, crowd reading and chase legibility all assume you can see the street —
    dropping to a low camera changes the GAME, not just the look. 0.46–0.62 keeps
    both. That call is Kyle's and it should be made by playing, not by looking.

- **M2 — ALL IN ON 3D: the full second view, and it is now the DEFAULT** ✅ (2026-09-01)
  Kyle: *"keep building out the 3d - lets go all in."* Done: the whole town, all
  sixteen interiors, weather, the day's light, weapons, fx and the crowd — and the
  live game now boots into 3D. The classic top-down view survives behind `?2d=1`,
  the `vl-force2d` localStorage flag, the 🕹️ pause-menu toggle, and as the
  automatic fallback when WebGL is missing (the 3D constructor throws; boot
  catches and re-runs the 2D path on the same canvas — safe, because a null
  `getContext('webgl')` does not claim the canvas).

  **HOW IT WAS BUILT — the architecture is the story.** All CODE is hand-written;
  all LAYOUT DATA was mined. Three workflow passes:
  1. *Spec mine*: four agents read `render.js`/`main.js`/`game.js` and produced
     exact JSON specs — every room's furniture with real positions from the 2D
     painter, every exterior prop, every facade, and the full sim→view contract.
  2. *Transcribe*: two agents converted the specs into pure data against my
     builder vocabulary (no agent wrote a line of code). Baked into generated
     `js/layouts3d.js`; validated headlessly — all 16 rooms build in node, zero
     unknown kinds, before a browser ever opened.
  3. *Adversarial review*: find → independent refutation, before ship.

  Files: `render3d.js` (people/camera/light/weather/fx/rooms switch),
  `town3d.js` (ground canvas, facades with REAL lettered signs, 22 prop builders,
  landmarks), `rooms3d.js` (36-kind furniture vocabulary + interpreter),
  `layouts3d.js` (GENERATED — never hand-edit, re-run the bake).

  **What the mined data bought**: the gamebarn's three FUNSTATION crates sit at
  the exact heist grab spots (84/148/212,140); the splitlip jukebox is on its
  interactable; the union hall's 18 chairs face the lectern; the Rip rack is red
  and where it is in 2D; the Bluffs got their lake; the rail its boxcars.

  ⚠️ **THE CONTRACT SPEC PAID FOR ITSELF TWICE.**
  - The swing beat lives on `windT` (0.13s telegraph, arm goes BACK) then
    `strikeT` (0.18s arm-out impact) — `atkT` is only the post-swing COOLDOWN.
    The prototype animated the lunge off `atkT`, playing the swing AFTER the hit.
  - NPCs carry `arch` → ARCHETYPES {tw, belly, sh, h 46–62, slouch}: six real
    body silhouettes the prototype was flattening into one.

  ⚠️ **r155+ PHYSICAL LIGHTS, LAYER TWO**: PointLight intensity is CANDELA with
  inverse-square falloff — 2.4 at 170 units above the floor delivers 0.00008 and
  every interior rendered as a cave, with no warning. A ceiling fixture at this
  world scale is intensity ≈ 120000. One point light serves all 16 rooms (only
  one is ever visible; it just moves).

  ⚠️ **ROOMS OVERLAP THE TOWN.** The sim moves the player into room coordinates
  on enterRoom, so rooms are built at those coords (overlapping the town's west
  end) and town/room visibility swaps per door. Consequences that bit:
  - NPC deletion must be by EXISTENCE, not visibility — using the per-room `seen`
    set destroyed the entire street cast every time a door opened.
  - The room filter is `n.room === g.room` with 'ext' the literal street value
    (never undefined) — drawing everyone stood Moose and Sal on the grass at
    their tiny room coordinates near the world origin.
  - Fog off inside (rooms sit entirely within fog.near), one PointLight on, and
    the camera reframes to the ROOM at pitch 0.42 — from 0.55 a 96-tall
    bookshelf reads as a floor mat. Furniture must be seen from the side to BE
    furniture. (Related: book spines must sit PROUD of the case — buried inside
    it, the library rendered as blank cabinets.)

  ⚠️ **THE WHEEL IS THE PITCH ANSWER.** dist 480–1400 with pitch following it:
  pulled close you play Schedule I at street level, pulled back it tilts toward
  top-down so chases stay readable. One control, both moods, persisted
  (`vl-3dcam`). Inside rooms the wheel is overridden — a street-scale dist puts
  three other shops in frame through the missing front wall.

  ⚠️ **A WEAPON MUST NOT BE PARENTED TO THE ARM** — the arm is a scaled unit box
  (5×19×6); a child inherits the non-uniform scale and a bat becomes a plank. It
  rides the group at the hand and mirrors the arm's swing each frame.

  ⚠️ **SIGN TEXT IS ALLOWED IN town3d AND NOWHERE NEAR GENERATED ART**: canvas
  sign textures ARE the game setting its own type — the same letters the 2D
  signs carry. The ART_BIBLE ban is on baked type in AI plates, not on type.

  The fx pool is a 1:1 port of render.js `fx()` — same six kinds, counts,
  colours, envelopes. The day's light: per-block sun azimuth (morning east/warm,
  noon high, evening west/amber, late moonlight), never crossing to −z (THE SUN
  STAYS ON THE CAMERA'S SIDE). Weather: overcast dims, rain adds an instanced
  streak volume that follows the camera + storm light, heatwave warms. Night:
  evening lights every storefront window; LATE keeps only qwikstop and cashking
  (the open-late pair), houses hold one warm window; signs go emissive. The
  gamebarn heist runs in real darkness (`gameBarnDark`).

  Perf: whole town + 38 people ≈ 2.4k triangles, ~160 draw calls; a room ≈ 1k.
  Soak untouched and green at 48 — the sim doesn't know any of this happened.

- **M2.1 — 3D polish: dressed rooms, readable crowd** ✅ (2026-09-01)
  Finished the sim→view audit the review's dead lens never ran. It named the
  work: **six fields the 2D view reads that 3D ignored outright** — `static`,
  `cop`, `idleKind`, `hpMax0`, `name`, `stamina`.

  **Readability.** Five **idle habits** ported from render.js (pockets / phone /
  lean / talk / rock), rolled once per person *by the sim* so it is a trait and
  not a flicker — six people waiting now look like six people. **Injury is a
  gait**: `hurtF > 0.62` limps, slower phase, bad leg carries less, body dips
  (2D's own note: it "reads at any zoom, unlike the 1.8px black-eye dot").
  ⚠️ **Cops were completely unread** — Tapp and Brill were a navy hat in a crowd
  of 23 shirt colours, in a game whose entire heat system is *do I see him before
  he sees me*. Duty belt, shoulder flashes, badge, radio: 14 mesh parts vs a
  civilian's 7. **Heads turn** toward you inside 150 units — but `static` people
  never do; they are fixtures, and a swivelling shopkeeper reads as a security
  camera. **The ember**: every third non-cop/non-KO/non-static NPC smokes from
  evening on, the same predicate as 2D, which calls it *"the single best
  night-read detail available"*. Measured 7 lit of 25 at night, 0 by day.

  **Dressing.** The sixteen rooms were furnished but factory-clean. Each floor is
  now painted: the worn lane in from the door, scuffs, spills nobody cleaned,
  grit where a mop never reaches — plus five bits of junk at the **edges** only
  (the middle is where people walk and where the mined layout lives).
  ⚠️ **Deterministic from a hash of the room key** — never `Math.random`, never
  the sim rng. A floor that re-stains itself on every entry is worse than a clean
  one. ⚠️ `grimeTexture` returns null under node so the **headless room validator
  still runs** — that harness is worth more than grime in a test.

  ⚠️ **LIGHTING EVENNESS IS THE HEIGHT KNOB, NOT INTENSITY.** Inverse-square
  makes the centre-to-corner ratio `(d_corner/d_centre)²`, and measured for the
  largest room that was **7.67× at y=170** — blown centre, black corners. y=300
  gives 3.14×. My first comment guessed "~4×"; the arithmetic disagreed and the
  arithmetic won. Don't ship a guessed number in a load-bearing comment.

  ⚠️⚠️ **THE SAME BUG CLASS TWICE IN ONE FILE.** `rotation.z` had THREE writers
  (limp, idle-lean/rock, drunk-list) and whichever ran last silently won; then
  `position.y` had TWO (limp dip, KO drop) and the dip measured **0.0** because
  the KO line stomped it every frame. **When a transform channel is written in
  more than one place, accumulate and assign ONCE.** Both found by measuring the
  result rather than trusting the edit.

- **M2.2 — UI pass: one HUD, a readable title, worn streets** ✅ (2026-09-01)

  ⚠️⚠️ **SCREENSHOTS OF THE UI WORK. THE OLD "THEY TIME OUT" NOTE WAS WRONG.**
  Every prior session recorded that `computer{screenshot}` fails on this page and
  verified DOM work by geometry alone. The real cause is that **the Browser pane
  is HIDDEN** — `preview_start` opens it and screenshots return real pixels
  immediately. `tabs_context` prints *"The Browser pane is currently hidden"*;
  that line is the diagnosis. **Open the pane before any UI work.** Three of the
  four problems fixed below were invisible to geometry and obvious at a glance.

  **The title screen** measured perfectly — zero DOM collisions, correct spacing —
  and looked like a pile-up, because pale cream type sat on the busiest part of a
  painted town. ⚠️ **The fix for text-on-art is a GROUND for the type, not more
  type styling**: the plate moved to `64% 62%` so the lone figure clears the
  wordmark instead of standing behind it, a soft dark column runs under the text
  block, the subtitle hangs off a hairline rule, and the motto became small amber
  letterspaced caps.

  **The HUD became one object** instead of four dialects in four corners. Vitals
  were two naked lines reading as debris — now a framed panel labelled **BODY**
  and **WIND** (Hopewell's words; you get the wind knocked out of you here, you
  don't "deplete stamina"). ⚠️ **Cash was mint green `#b8d8a0`** — the only
  element in the game speaking a colour the palette does not contain, and it read
  like a different application pasted into the corner; money is amber now. A
  **vignette** earns its place twice: it frames the render like the
  miniature-camera look the bible asks for *and* gives every HUD panel darkness to
  sit on, since the corners are exactly where the HUD lives.

  **The pause menu ranked its offers** — five identical buttons made the primary
  action, two toggles and a *destructive* action look like the same choice.
  Resume is red like START THE WEEK, settings sit in a labelled group, abandon is
  below a rule. ⚠️ The view button names its **destination** ("Switch to classic
  2D"), not its state ("View: 3D") — the old label left you guessing whether
  clicking confirmed or changed it, and it wrapped to two lines.

  **Worn streets.** Interiors got grime in M2.1; the town was still fresh-poured.
  Oil drips in every lot, frost-heave cracks, tyre scuff where cars turn in,
  litter drifted against every kerb, bare dirt where grass loses.
  ⚠️ **`paintGround` is now SEEDED** — it used `Math.random` and is painted once
  per page load, so every stain in Hopewell moved between sessions and the town
  never looked like the same town twice.
  ⚠️ **The first pass read as SCRIBBLES**: 7-segment crack wanders at 0.16 alpha
  and full-sweep tyre arcs both announced themselves as *drawn marks*. A drawn
  line says somebody made it; wear has to be found. Four short segments at 0.09
  and arc slices of 0.5–1.2 rad. **Caught by looking — the numbers were identical
  either way.**

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
