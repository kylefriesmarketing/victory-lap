// VICTORY LAP — data.js
// ALL content and tuning. Balance changes go here and only here.
// Pure data module: importable in Node (tests/soak.mjs) and the browser alike.

export const TUNING = {
  // ⚠️ 150 made a 70-minute run where ~16 of 28 blocks were empty walking. The README
  // targets 20–30 min. Skipping a block is a DECISION (the clock widget), not a tax.
  blockSeconds: 75,           // wall-clock seconds of free roam per block
  blocksPerDay: 4,
  days: 7,                    // MON..SUN — the Add/Drop Week mini-run
  hpMax: 100,
  walkSpeed: 165,             // px/s
  sprintSpeed: 265,
  sprintDrainPerS: 14,        // stamina
  staminaMax: 100,
  staminaRegenPerS: 18,
  punchDmg: [8, 12],
  punchRange: 34,
  punchCooldown: 0.38,
  // ⚠️ Every swing in the game telegraphs. Damage used to land the instant the key went
  // down, with the arm pose drawn AFTER — so there was nothing to dodge and nothing to
  // read. windUp is the anticipation frame the art bible asks for ("a swung chair has
  // wind-up") and it's what makes a fight legible.
  windUp: 0.13,               // player anticipation before the hit resolves
  npcWindUp: 0.26,            // theirs is slower — that gap IS the dodge window
  swingStamina: 13,           // swinging costs; kiting forever no longer free
  shoveForce: 240,
  shoveStamina: 9,
  shoveRange: 42,
  npcDmg: [9, 16],
  npcAtkCooldown: [0.7, 1.15],
  npcAggroSpeed: 138,         // slower than your walk (165): you can disengage…
  brawlerSpeed: 174,          // …but a brawler runs you down unless you spend stamina
  copChaseSpeed: 205,
  drunkFuseS: 5.5,            // LATE-block drunks you loiter near start something
  limpBelowHp: 30,
  // ── ROLLING BODIES ────────────────────────────────────────────────────────
  // The design doc names this exact fantasy: "two Alumni arguing in a parking lot,
  // drunk enough to be robbed by hand." Combat had no payoff; now it has a wallet.
  rollCash: { townie: [3, 11], drunk: [10, 26], tourist: [22, 55], alumni: [14, 32] },
  rollHeat: 13,               // robbery is worse than a punch, and it's personal
  wakeAfterS: 26,             // KO'd toys get up eventually — bodies shouldn't litter
  wakeRobbedAfterS: 38,       // unless you went through their pockets first
  wakeHpFrac: 0.34,
  grudgeChance: 0.65,         // …and then they come looking for you
  // ── GRUDGE HEAT (design doc's second, civilian track) ────────────────────
  // "Rob a man's garage and HPD forgets by Thursday — HE doesn't." Grudge never
  // decays on its own. It is the town's memory, and it is the only heat in the
  // game you cannot sleep off.
  grudgeAssault: 1,           // a punch in public: one person now dislikes you
  grudgeRob: 3,               // going through pockets: three, and they talk
  grudgeBurgle: 4,            // a Bluffs house: the whole road hears about it
  grudgeMarkup: 0.14,         // every counter in town charges this much more, per point
  grudgeMarkupCap: 0.85,      // …up to nearly double. They can read you now.
  grudgeAmbushAt: 6,          // past this, somebody is waiting in a parking lot
  grudgeRefuseAt: 9,          // past THIS, doors that used to open don't
  // ── THE FOXHOLE ───────────────────────────────────────────────────────────
  // A windowless cinder-block box on gravel at the edge of the Mile. Mechanically
  // it's three things: a money sink, the best heat sanctuary in the district (nobody
  // in here has ever helped a police officer with anything), and the town's actual
  // information exchange — Dee behind the bar knows more than Peanut ever will.
  foxCover: 8,
  foxHeatDecay: 24,           // beats laying low anywhere else in the game
  foxDrink: 7,
  foxTip: 5,                  // tipping is how you buy standing here
  foxInfoCost: 30,            // Dee sells what she hears. Peanut is free but slower.
  foxVipCost: 45,             // fade to black; you wake up somewhere with fewer problems
  foxVipHeal: 40,
  // ── DOWNTOWN ─────────────────────────────────────────────────────────────
  slBeer: 4,                  // Split Lip: cheapest beer in the county, tastes like it
  slShot: 3,                  // well whiskey. the well is a crime scene
  slRound: 25,                // buy the room a round: −12 heat, the room remembers
  slRoundHeat: 12,
  slHeatDecay: 14,            // laying low here works, but this room TALKS
  hurlBase: 0.3,              // per shot past the second, the odds your stomach files a protest
  latteCost: 9,               // Daybreak. Nine dollars. NINE.
  latteHeal: 6,
  pawnCrate: 55,              // Vern's flat rate: no faces, no questions, no haggling
  pawnBat: 18,
  pawnCrowbar: 26,            // pricier than Earl's; convenience tax for the south side
  // ── CASSIDY WORKS ────────────────────────────────────────────────────────
  dockPay: 52,                // one evening shift, cash, no camera, no skim — just your spine
  dockHpCost: 5,              // your back files a grievance
  dockMinHp: 25,              // Denny won't let a broken man on the dock
  freightRoxy: 26,            // what a fell-off-the-truck box brings at window 2
  freightVern: 20,            // Vern rounds your dignity down, as is tradition
  hallHeatDecay: 16,          // nobody in the hall answers questions; they've all BEEN questions
  hallCoffee: 0.5,            // union coffee. fifty cents. tastes like the building
  gusCatchRange: 250,         // if Gus can see the pallet, the pallet stays fell-on
  // ── THE BLUFFS / BURGLARY ────────────────────────────────────────────────
  // The doc: "high-risk, high-reward burglary biome, and the only district where
  // the police response is genuinely fast." Every number here serves that sentence.
  caseSecs: 5,                // watching a house from the street. Free, slow, decisive.
  alarmGraceS: 50,            // from trip to cruisers ON the lawn. Loud, and short.
  silentTimerS: 105,          // even unalarmed: somebody's neighbour eventually looks
  burgHeatEntry: 22,          // B&E up here costs more than anywhere else
  burgHeatAlarm: 34,          // …and the alarm makes it a different crime entirely
  burgHeatSeen: 46,           // waking the owner is the worst outcome short of cuffs
  bluffsCarryCap: 6,          // your jacket is a jacket, not a moving van
  hotPenalty: 0.62,           // fences pay less for anything with a serial number
  daFridayBonus: 1.5,         // the DA's Friday: the Bluffs' drop night
  clubDrink: 12,              // a club soda at the club, because you don't belong here
  bluffsRepMult: 1.35,        // Bluffs scores are worth more Cred: they're a STORY
  // ── HOPELESS TECH ────────────────────────────────────────────────────────
  // The doc: campus is a no-carry zone with metal detectors at every entrance,
  // "installed after the Welding program kept eating the building's copper wiring,
  // and now sensitive enough to catch a belt buckle." Campus play stays fists.
  aidPayout: 180,             // the disbursement. The single biggest legal payday in the game.
  aidNeedsClass: 2,           // …and you have to have SHOWN UP twice to see a cent of it
  classSecs: 22,              // one session of anything, in blocks-of-time terms
  shopToolName: 'pry bar',    // welding class output: your own iron, made not bought
  polosHassleHeat: 5,         // the Polo Shirts can't arrest you. They can telephone.
  polosCartRage: 11,          // …unless you touch the cart. Never touch the cart.
                              // ⚠️ 26 put you at WANTED off one golf cart once the
                              // crowd multiplier hit it. It's a misdemeanour of the
                              // heart, not a manhunt.
  libHeatDecay: 12,           // nobody has ever been arrested in a library
  gymPay: 26,                 // spotting the meatheads for beer money
  // heat
  heatStage: { noticed: 15, named: 40, wanted: 70 },
  heatMax: 100,
  heatDecayLayLow: 6,         // per block spent indoors doing nothing
  heatDecayNight: 20,         // any overnight
  heatDecayGarage: 35,        // sleeping at Bev's — the Flats don't talk to police
  heatCrime: { shoplift: 8, assault: 14, vandal: 10, breakin: 30, heistSeen: 45 },
  filmerMult: 1.5,            // a phone out makes every witness worth more
  namedGainMult: 1.25,        // once you're Named, word travels faster
  copSightRange: 300,
  cuffRange: 30,
  cuffMashNeed: 14,           // presses to break a tackle
  // money
  startCash: 61,
  shiftPay: 38,
  tipPerPerfect: 3,
  skimStrikeLimit: 3,
  loanPrincipal: 100,
  loanOwed: 120,              // due Friday. Roxy is not flexible.
  // rip
  ripCost: 6,
  ripBonusBlocks: 1,
  ripCrashBlocks: 1,
  ripShakeAmp: 2.2,           // px of register-UI jitter next morning
  addictionWarm: 3,           // uses before the meter starts showing
  // food
  wingsCost: 7, wingsHeal: 25,
  buffetCost: 9, buffetHeal: 40, buffetGreaseChance: 0.10, buffetGreaseDmg: 5,
  jerkyCost: 3,
  crowbarCost: 22,
  // scheme
  crateCount: 3,
  crateFenceBase: 70,
  crateHaggleWin: 30,         // per crate, if the push works
  crateHaggleLose: 25,        // per crate, if it doesn't — at 10 the push was free money
  haggleOdds: 0.6,
  holdBuyerMult: 2.2,         // Sunday city buyer — must beat 3 nights of ambush EV
  holdAmbushChance: 0.35,     // per night holding the haul (caps at ONE crate lost)
  heistPatrolRisk: [0.10, 0.22, 0.38], // per carry-trip, by trips completed
  fatigueNoSleepHp: 15,       // skip sleep: tomorrow's max hp haircut
  sleepHeal: 45,
  benchRestHeal: 8,
};

// ---------------------------------------------------------------------------
// THE MIRACLE MILE — the strip-mall spine of Hopewell. Hand-built; never rolls.
// World: 2200 x 1500. North: the strip + back alley. Center: parking + THE LOT.
// South: the street, the bus shelter, and the first sliver of the Flats (Bev's).
// ---------------------------------------------------------------------------

// Every improvised weapon in Hopewell. Lives HERE, not in game.js — these are the
// numbers a balance pass most wants to touch, and the README says tuning lives in data.
export const WEAPONS = {
  fist:   { dmg: [8, 12],  range: 34, dur: Infinity, kb: 130, label: 'fists' },
  bat:    { dmg: [14, 20], range: 44, dur: 8,  kb: 230, label: 'a Louisville opinion' },
  bottle: { dmg: [12, 17], range: 38, dur: 2,  kb: 170, throwable: true, label: 'a bottle' },
  chair:  { dmg: [15, 22], range: 46, dur: 5,  kb: 240, label: 'a folding chair' },
  cue:    { dmg: [13, 19], range: 56, dur: 4,  kb: 190, label: 'a pool cue' },
  sign:   { dmg: [11, 16], range: 44, dur: 6,  kb: 200, label: 'a DAYBREAK COMMONS sign' },
  crowbar:{ dmg: [16, 22], range: 42, dur: 30, kb: 210, label: 'the crowbar' },
};

export const WORLD = { w: 3400, h: 3200 };

// ── THE BLUFFS ────────────────────────────────────────────────────────────────
// Lake money. Boat people. The country club where the DA golfs off his caseload
// every Friday. Gates, cameras, private security that's mostly decorative — and
// the ONLY district where the police response is genuinely fast, because up here
// they actually pay for it. (All design doc; all implemented below.)
export const BLUFFS = {
  gateY: 2470,                       // the "private community" arm you can just walk around
  roadY: 2600,
  lakeY: 3010,
  club: { x: 2340, y: 2660, w: 380, h: 160, door: { x: 2530, y: 2820 } },
  // Five houses. Each rolls a state per day; the TELLS are how you read it from
  // the street. That reading IS the skill — this is not a lockpick minigame.
  houses: [
    { key: 'kessler', name: 'the Kessler place',   x: 200,  y: 2680, w: 230, h: 150, tier: 1,
      blurb: 'Boat people. Two jet skis, one marriage.' },
    { key: 'hoyt',    name: 'the Hoyt house',      x: 560,  y: 2700, w: 250, h: 145, tier: 1,
      blurb: 'He sold the feed store to Fairview and built THIS.' },
    { key: 'marchetti',name:'the Marchetti place', x: 940,  y: 2670, w: 270, h: 160, tier: 2,
      blurb: 'Orthodontist. Four bathrooms. One personality.' },
    { key: 'delacroix',name:'the OTHER Delacroix', x: 1340, y: 2690, w: 250, h: 150, tier: 2,
      blurb: 'No relation. Allegedly. Your grandmother goes quiet about it.' },
    { key: 'da',      name: "the DA's house",      x: 1720, y: 2660, w: 300, h: 170, tier: 3,
      daHouse: true, blurb: 'Elected embarrassment. Golfs off his caseload every Friday.' },
  ],
  docks: [ 300, 660, 1050, 1440, 1830 ],
};

// ── HOPEWELL TECHNICAL & COMMUNITY COLLEGE ────────────────────────────────────
// The sign says "Hopewell Tech." Everyone alive says HOPELESS. A quad, an admin
// building with a broken clock, a gym, and one weirdly nice building donated by a
// rich alumnus who fled the state mid-indictment and needed the write-off.
// It sits in the empty southeast: east of downtown, south of the plant, fronting
// the east end of Main Street — which is exactly where a commuter college goes.
export const HTCC = {
  bounds: { x: 1880, y: 1560, w: 1470, h: 560 },
  quad:   { x: 2180, y: 1740, w: 780, h: 300 },
  lot:    { x: 1900, y: 1960, w: 250, h: 150 },      // commuter parking. everyone commutes.
  buildings: [
    { key: 'admin',   name: 'Chalmers Hall (admin)', x: 1960, y: 1580, w: 300, h: 150,
      door: { x: 2110, y: 1730 }, clock: true,
      blurb: 'The clock stopped at 4:20 in 2011 and became a tradition instead of a repair.' },
    { key: 'shop',    name: 'the Trades Annex',      x: 2360, y: 1570, w: 320, h: 140,
      door: { x: 2520, y: 1710 },
      blurb: 'Welding, HVAC, and the smell of a building that earns its keep.' },
    { key: 'gym',     name: 'the gym',               x: 2790, y: 1580, w: 260, h: 150,
      door: { x: 2920, y: 1730 },
      blurb: 'Home of the Fighting Prairie Dogs. 0–11. The banner still goes up.' },
    { key: 'barrows', name: 'the Barrows Center',    x: 3080, y: 1590, w: 250, h: 170,
      door: { x: 3205, y: 1760 }, donated: true,
      blurb: 'Glass, stone, and a donor whose name is still on it and whose address is sealed.' },
    { key: 'library', name: 'the library',           x: 2300, y: 2000, w: 280, h: 110,
      door: { x: 2440, y: 2000 },
      blurb: 'Two floors, four students, and the best heating on campus.' },
  ],
};

// What's inside a Bluffs house. Values are what a FENCE pays, not what it's worth —
// the gap between those two numbers is the entire pawn industry.
export const LOOT = {
  jar:      { label: 'a jar of loose foreign coins', v: [6, 16],   w: 1 },
  laptop:   { label: 'a laptop with a Fairview sticker', v: [55, 95], w: 2 },
  watch:    { label: 'a watch worth more than your car', v: [80, 160], w: 1, hot: true },
  jewelry:  { label: 'a fistful of somebody\'s anniversaries', v: [45, 110], w: 1, hot: true },
  cash:     { label: 'the emergency cash in the sock drawer', v: [40, 120], w: 0 },
  driver:   { label: 'a signed Nicklaus driver', v: [50, 100], w: 2 },
  trout:    { label: 'a mounted lake trout (why)', v: [8, 18],  w: 3 },
  pills:    { label: 'a prescription in somebody else\'s name', v: [30, 70], w: 0, hot: true },
  silver:   { label: 'the wedding silver, still in the felt', v: [70, 130], w: 3, hot: true },
  console:  { label: 'a game console still in the box', v: [45, 85], w: 2 },
  binder:   { label: 'a binder marked FAIRVIEW — PHASE III', v: [0, 0], w: 1, evidence: true },
  gun:      { label: 'a pistol in a bedside safe — you leave it. That line stays uncrossed.', v: [0, 0], w: 0, refused: true },
};

// Where you look, what it costs you in seconds, and what it might give up.
export const SEARCH_SPOTS = [
  { key: 'drawer',  label: 'the sock drawer',        secs: 4,  pool: ['cash', 'jar', 'pills'] },
  { key: 'dresser', label: 'the jewelry dish',       secs: 5,  pool: ['jewelry', 'watch', 'jar'] },
  { key: 'office',  label: 'the office desk',        secs: 6,  pool: ['laptop', 'binder', 'cash'] },
  { key: 'closet',  label: 'the bedroom safe',       secs: 11, pool: ['watch', 'silver', 'gun'], needsCrowbar: true },
  { key: 'garage',  label: 'the boat garage',        secs: 7,  pool: ['driver', 'console', 'trout'] },
  { key: 'trophy',  label: 'the trophy wall',        secs: 4,  pool: ['driver', 'trout'] },
];

// ── CASSIDY WORKS ─────────────────────────────────────────────────────────────
// The plant. Half-dead, one shift running, union hall lit out of spite (the
// design doc's own words). Freight comes through that nobody counts carefully —
// which in this economy is a job posting.
export const WORKS = {
  plant:   { x: 2380, y: 120, w: 920, h: 440 },     // the main works: sawtooth roof, two stacks
  stacks:  [ { x: 2600, smoking: true }, { x: 2960, smoking: false } ],
  hall:    { x: 2240, y: 620, w: 200, h: 160, door: { x: 2330, y: 780 } },  // LOCAL 448
  gate:    { x: 3290, y: 900, w: 70, h: 160 },      // guard shack + the barrier arm
  dockOffice: { x: 2340, y: 1110, w: 90, h: 70 },   // a window, a clipboard, a ledger of backs
  yard:    { x: 2300, y: 1090, w: 1000, h: 380 },   // containers, pallets, the sodium lights
  pallets: [ [2560, 1200], [2760, 1330], [2980, 1180], [3120, 1340], [2620, 1400] ],
  boxcars: [ 2420, 2760, 3080 ],                    // parked on the spur, tagged by locals
};

// ── DOWNTOWN ──────────────────────────────────────────────────────────────────
// The old core, south of the rail spur the interstate was supposed to replace.
// Eleven storefronts; four still breathing. The design doc's Downtown, scaled to
// the prototype: the Split Lip, the pawn shop, Fairview's coffee beachhead, the
// courthouse — and the dead fronts between them doing the storytelling.
export const DT_Y = { roofTop: 1905, facadeTop: 2040, base: 2130 };  // shallower roofs than the strip — these are older, meaner buildings
export const DOWNTOWN = [
  { key: 'splitlip', label: 'The Split Lip',        x: 260,  w: 240, sign: 'THE SPLIT LIP', signC: '#c94a4a',
    face: { parapet: 14, doorAt: 0.44, win: 'single', recess: 8 },
    desc: 'The lone functioning bar. Third-shift congregation. Loyalty measured in decades and stitches.' },
  { key: 'dead1',    label: 'COMING SOON (2009)',   x: 520,  w: 150, sign: '', signC: '#777',
    face: { parapet: 0, doorAt: 0.5, win: 'papered', recess: 0 }, dead: 'old' },
  { key: 'pawn',     label: 'Loanstar Pawn & Gold', x: 690,  w: 230, sign: 'LOANSTAR PAWN ✦ GOLD', signC: '#ffd23e',
    face: { parapet: 6, doorAt: 0.62, win: 'grid', recess: 0 },
    desc: 'Everything in the window has a story. Every story ends "and then I needed forty bucks."' },
  { key: 'dead2',    label: 'COMING SOON',          x: 940,  w: 140, sign: '', signC: '#777',
    face: { parapet: 4, doorAt: 0.5, win: 'papered', recess: 0 }, dead: 'mid' },
  { key: 'daybreak', label: 'Daybreak Coffee',      x: 1100, w: 240, sign: 'daybreak', signC: '#2a2e33',
    face: { parapet: 26, doorAt: 0.5, win: 'wide', recess: 0 },
    desc: 'Exposed brick they paid to expose. $9 lattes. The invasion, with oat milk.' },
  { key: 'dead3',    label: 'FUTURE FAIRVIEW',      x: 1360, w: 150, sign: '', signC: '#777',
    face: { parapet: 30, doorAt: 0.5, win: 'papered', recess: 0 }, dead: 'fairview' },
  { key: 'dead4',    label: 'GRAND OPENING (ghost)', x: 1530, w: 160, sign: '', signC: '#777',
    face: { parapet: 0, doorAt: 0.42, win: 'papered', recess: 0 }, dead: 'ancient' },
];
export const RAIL_Y = 1505;            // the spur: two rails, zero stops, one long horn
export const WATER_TOWER = { x: 330, y: 1700 };
export const COURTHOUSE = { x: 700, y: 2290, w: 500, h: 110 };
export const MAIN_ST = { y: 2150, h: 110 };

export const STRIP_Y = { roofTop: 190, facadeTop: 400, base: 480 }; // buildings occupy y 190..480

// ⚠️ `face` exists because the strip was ONE BUILDING PAINTED EIGHT TIMES: same
// roofline, door dead-centre, windows at identical offsets. That's two entries off the
// art bible's forbidden list ("flat empty modular rooms", "identical bodies") applied to
// the one row of geometry the player stares at all game. parapet raises the roofline,
// doorAt slides the entrance, recess insets it, win picks the glazing.
export const BUILDINGS = [
  { key: 'qwikstop',  label: 'QwikStop',              x: 120,  w: 260, sign: 'QwikStop', signC: '#d94f2a',
    face: { parapet: 0, doorAt: 0.5, win: 'wide', recess: 0 },
    desc: 'Gas, Rip, jerky, and the town’s entire information economy at 1 a.m.' },
  { key: 'hardware',  label: 'Mile Hardware',          x: 440,  w: 220, sign: 'MILE HARDWARE', signC: '#c9b28a',
    face: { parapet: 9, doorAt: 0.31, win: 'grid', recess: 0, awning: '#7a3a2e' },
    desc: 'EVERYTHING MUST GO. The banner predates two presidents.' },
  { key: 'tattoo',    label: 'Stick City Tattoo',      x: 660,  w: 200, sign: 'STICK CITY', signC: '#7e93c4',
    face: { parapet: 24, doorAt: 0.62, win: 'single', recess: 0 },
    desc: 'Walk-ins welcome. Spelling not guaranteed.' },
  { key: 'buffet',    label: 'Golden Lucky Wok III',   x: 860,  w: 240, sign: 'GOLDEN LUCKY WOK III', signC: '#e0b84a',
    face: { parapet: 12, doorAt: 0.5, win: 'pair', recess: 16, awning: '#8a3d34' },
    desc: 'Fourth name, second grease fire, same steam table.' },
  { key: 'wingbarn',  label: 'Wing Barn',              x: 1160, w: 260, sign: 'WING BARN', signC: '#e8dcc3',
    face: { parapet: 30, gable: true, doorAt: 0.42, win: 'pair', recess: 6 },
    desc: 'Home of the Barnstormer 20-piece. You work here, technically.' },
  { key: 'gamebarn',  label: 'Game Barn',              x: 1420, w: 240, sign: 'GAME BARN', signC: '#5b7291',
    face: { parapet: 6, doorAt: 0.58, win: 'grid', recess: 0 },
    desc: 'Buy • Sell • Trade. Gary priced everything for a 1998 that never came back.' },
  { key: 'dead',      label: 'Future Home of DAYBREAK COMMONS', x: 1660, w: 180, sign: 'DAYBREAK COMMONS', signC: '#f4f1ea',
    face: { parapet: 34, doorAt: 0.5, win: 'papered', recess: 0 },
    desc: 'Artisanal mixed-use lifestyle concept. The only clean thing on the street.' },
  { key: 'cashking',  label: 'Ca$h Kingdom',           x: 1840, w: 240, sign: 'CA$H KINGDOM', signC: '#ffd23e',
    face: { parapet: 3, doorAt: 0.72, win: 'slot', recess: 0 },
    desc: 'Checks cashed. Loans made. Window 2 buys "used goods." Bulletproof glass throughout.' },
];
// walkable gaps to the back alley: between qwikstop/hardware (380..440) and buffet/wingbarn (1100..1160)
export const ALLEY_GAPS = [ { x1: 380, x2: 440 }, { x1: 1100, x2: 1160 } ];

export const EXTERIOR_PROPS = [
  { kind: 'pumps',    x: 150,  y: 545, w: 200, h: 95 },   // QwikStop canopy island
  { kind: 'dumpster', x: 900,  y: 95,  w: 90,  h: 55 },   // behind the buffet
  { kind: 'dumpster', x: 1500, y: 95,  w: 90,  h: 55 },   // behind Game Barn — the milk-crate window is here
  { kind: 'crateStack', x: 1602, y: 110, w: 40, h: 40 },
  { kind: 'carRow',   x: 480,  y: 560 }, { kind: 'carRow', x: 640, y: 560 },
  { kind: 'carRow',   x: 1560, y: 560 }, { kind: 'carRow', x: 1720, y: 560 }, { kind: 'carRow', x: 1900, y: 560 },
  { kind: 'yourCar',  x: 1270, y: 560, w: 120, h: 64 },   // the beater. Heist stash. It starts on the third try.
  { kind: 'busShelter', x: 960, y: 1055, w: 150, h: 50 },
  { kind: 'kiddiePool', x: 640, y: 1245, w: 90, h: 60 },
  { kind: 'dogRun',   x: 560,  y: 1190 },                 // Buster
  { kind: 'phonePole', x: 460, y: 500 }, { kind: 'phonePole', x: 1080, y: 500 }, { kind: 'phonePole', x: 1700, y: 500 },
  { kind: 'lampPost', x: 560, y: 700 }, { kind: 'lampPost', x: 1000, y: 880, dead: true },
  { kind: 'lampPost', x: 1440, y: 700 }, { kind: 'lampPost', x: 1860, y: 880 },
  { kind: 'lampPost', x: 300, y: 1100 }, { kind: 'lampPost', x: 1500, y: 1100, dead: true },
  { kind: 'lampPost', x: 180, y: 2146 }, { kind: 'lampPost', x: 560, y: 2146 },
  { kind: 'lampPost', x: 940, y: 2146, dead: true }, { kind: 'lampPost', x: 1320, y: 2146 },
  { kind: 'lampPost', x: 1700, y: 2146 }, { kind: 'lampPost', x: 2050, y: 2146 },
  { kind: 'bench', x: 610, y: 2318, w: 60, h: 22 }, { kind: 'bench', x: 1230, y: 2326, w: 60, h: 22 },
  { kind: 'hydrant',  x: 700, y: 505 },
  { kind: 'bench',    x: 1130, y: 1058, w: 60, h: 22 },
  { kind: 'cone',     x: 820, y: 760 }, { kind: 'cone', x: 855, y: 792 },
];

export const GARAGE = { x: 300, y: 1150, w: 220, h: 180, door: { x: 395, y: 1150 } };

// ⚠️ NOT part of the BUILDINGS strip row — the Foxhole is a standalone windowless
// cinder-block box set back on its own gravel lot, which is exactly how these places
// actually sit at the edge of a town like this. Its own geometry, its own door.
export const FOXHOLE = {
  x: 1770, y: 1150, w: 280, h: 170,
  door: { x: 1895, y: 1320 },       // faces the lot, south side, under the one light
  lot: { x: 1720, y: 1330, w: 380, h: 120 },
};

// bottles and loose junk seed the improvised-weapon economy; positions jitter per run
export const WEAPON_SPAWNS = [
  { kind: 'bottle', x: 760, y: 820 }, { kind: 'bottle', x: 1180, y: 780 }, { kind: 'bottle', x: 340, y: 700 },
  { kind: 'bottle', x: 1560, y: 840 }, { kind: 'bottle', x: 990, y: 1120 }, { kind: 'bottle', x: 1620, y: 140 },
  { kind: 'chair',  x: 930, y: 700 },  { kind: 'chair', x: 1340, y: 860 },
  { kind: 'cue',    x: 690, y: 860 },
  { kind: 'sign',   x: 1690, y: 620 }, // a DAYBREAK COMMONS yard sign. It wants to be swung.
];

export const INTERIORS = {
  wingbarn: { w: 720, h: 420, label: 'Wing Barn',
    counter: { x: 80, y: 120, w: 300, h: 60 }, register: { x: 200, y: 120 },
    props: ['fryers', 'menuBoard', 'boothRow', 'mopBucket', 'noteWall'] },
  gamebarn: { w: 720, h: 420, label: 'Game Barn',
    counter: { x: 420, y: 130, w: 220, h: 60 },
    backroom: { x: 40, y: 60, w: 220, h: 140 },   // the crates live here
    props: ['shelfRow', 'shelfRow2', 'glassCase', 'posterWall', 'crtStack'] },
  qwikstop: { w: 640, h: 380, label: 'QwikStop',
    counter: { x: 60, y: 110, w: 220, h: 60 },
    props: ['coolerWall', 'ripRack', 'jerkyRack', 'lottoSign'] },
  buffet:   { w: 700, h: 400, label: 'Golden Lucky Wok III',
    counter: { x: 80, y: 110, w: 240, h: 60 },
    props: ['steamTable', 'boothRow', 'fishTank', 'shrineCorner'] },
  hardware: { w: 640, h: 380, label: 'Mile Hardware',
    counter: { x: 380, y: 110, w: 200, h: 60 },
    props: ['toolWall', 'lumberRack', 'keyMachine', 'goBanner'] },
  cashking: { w: 640, h: 380, label: 'Ca$h Kingdom',
    counter: { x: 100, y: 110, w: 420, h: 60 },   // two windows in the glass
    props: ['glassWall', 'window1', 'window2', 'sadChairs'] },
  garage:   { w: 640, h: 380, label: "Bev's Garage",
    props: ['cot', 'stashShelf', 'beerFridge', 'tools', 'boxMaze', 'houseDoor'] },
  foxhole:  { w: 760, h: 440, label: 'The Foxhole',
    counter: { x: 470, y: 120, w: 250, h: 56 },        // the bar, back right
    stage:   { x: 90, y: 90, w: 250, h: 150 },          // stage + one pole, house left
    props: ['stage', 'pole', 'mirrorWall', 'boothRow', 'dj', 'tipRail', 'atmMachine'] },
  splitlip: { w: 720, h: 420, label: 'The Split Lip',
    counter: { x: 70, y: 110, w: 260, h: 56 },
    pool:    { x: 420, y: 200, w: 180, h: 100 },        // the felt, burned and beloved
    props: ['bar', 'poolTable', 'cueRack', 'jukebox', 'dartboard', 'theBathroomDoor'] },
  daybreak: { w: 640, h: 400, label: 'Daybreak Coffee',
    counter: { x: 200, y: 110, w: 240, h: 56 },
    props: ['pastryCase', 'menuBoard', 'communalTable', 'planWall', 'succulents'] },
  pawn:     { w: 680, h: 400, label: 'Loanstar Pawn & Gold',
    counter: { x: 380, y: 110, w: 240, h: 56 },
    props: ['cage', 'guitarWall', 'ringCase', 'weedWhackers', 'emptyGunCase', 'owl'] },
  unionhall:{ w: 560, h: 360, label: 'Union Hall — Local 448',
    counter: { x: 60, y: 100, w: 180, h: 50 },          // the urn table
    props: ['coffeeUrn', 'foldingChairs', 'grievanceBoard', 'banner', 'photoWall'] },
  // ⚠️ ONE parameterised interior serves all five Bluffs houses — they differ by
  // tier (dressing + loot), not by floorplan. Five hand-painted mansions would be
  // five times the paint for a room you're in for forty seconds with a clock running.
  shop:     { w: 700, h: 400, label: 'the Trades Annex',
    counter: { x: 60, y: 110, w: 190, h: 50 },
    props: ['weldingBays', 'sparkCurtains', 'steelRack', 'safetyPoster', 'dunnsDesk'] },
  aid:      { w: 620, h: 380, label: 'Chalmers Hall — financial aid',
    counter: { x: 200, y: 110, w: 240, h: 54 },
    props: ['queueRope', 'chairRow', 'takeANumber', 'brochureRack', 'brokenClock'] },
  library:  { w: 660, h: 380, label: 'the library',
    counter: { x: 70, y: 100, w: 170, h: 50 },
    props: ['stacks', 'studyCarrels', 'microficheNobodyUses', 'radiator'] },
  house:    { w: 720, h: 440, label: 'somebody\'s house',
    spots: { drawer: [560, 120], dresser: [440, 130], office: [130, 130],
             closet: [620, 250], garage: [140, 340], trophy: [340, 100] },
    props: ['sectional', 'islandKitchen', 'lakeWindow', 'artNobodyLooksAt'] },
};

// ---------------------------------------------------------------------------
// CAST
// ---------------------------------------------------------------------------

// body archetypes drive silhouettes: [torsoW, belly, shoulders, height, slouch]
export const ARCHETYPES = {
  average:  { tw: 16, belly: 0,  sh: 0,  h: 54, slouch: 0 },
  beerbelly:{ tw: 17, belly: 7,  sh: -1, h: 52, slouch: 2 },
  broad:    { tw: 20, belly: 2,  sh: 4,  h: 58, slouch: 0 },
  wiry:     { tw: 12, belly: 0,  sh: -2, h: 56, slouch: 3 },
  short:    { tw: 16, belly: 3,  sh: 0,  h: 46, slouch: 1 },
  tall:     { tw: 15, belly: 0,  sh: 1,  h: 62, slouch: 4 },
};

// ⚠️ Pants must never land within ~10 values of the asphalt (#4a4745) or the legs
// disappear and the toy reads as a floating torso. Caught on the zoomed QA pass.
export const OUTFITS = { // [shirt, pants, skin, hat?]  — palette from the art bible
  denim:   { shirt: '#5b7291', pants: '#3d4c63', skins: ['#c99b74','#8a5a33','#e0b490','#6e4a2f'] },
  hivis:   { shirt: '#c9a227', pants: '#5f6a78', skins: ['#c99b74','#8a5a33','#e0b490'] },
  camo:    { shirt: '#4c5741', pants: '#7b6a4d', skins: ['#c99b74','#e0b490','#8a5a33'] },
  flannel: { shirt: '#9c3d2e', pants: '#39414f', skins: ['#e0b490','#c99b74','#6e4a2f'] },
  greasy:  { shirt: '#7a7468', pants: '#57503f', skins: ['#c99b74','#8a5a33'] },
  tourist: { shirt: '#e8a8b8', pants: '#d9d2c0', skins: ['#f0c8a8','#e0b490'] }, // pastel = wrong on purpose
  tourist2:{ shirt: '#9fd0c8', pants: '#f0ead8', skins: ['#f0c8a8'] },
  // more of the street, so a crowd of nineteen doesn't read as four people cloned.
  // All still inside the art bible's earthy palette — nothing here is BRIGHT.
  // ⚠️ pants checked against the asphalt (#4a4745) — see the warning above. A first
  // pass had workshirt at #4a4a42, SIX values off the road, which is the floating-
  // torso bug this file already warns about. All four are now ≥45 apart by channel sum.
  carhartt:{ shirt: '#b5762c', pants: '#5f4a30', skins: ['#c99b74','#8a5a33','#e0b490','#6e4a2f'] },
  jersey:  { shirt: '#5a2f3a', pants: '#2b303a', skins: ['#8a5a33','#c99b74','#6e4a2f'] },
  scrubs:  { shirt: '#4e7a76', pants: '#41615e', skins: ['#e0b490','#8a5a33','#c99b74'] }, // nursing cohort
  hoodie:  { shirt: '#3d4148', pants: '#2f3742', skins: ['#c99b74','#6e4a2f','#e0b490'] },
  church:  { shirt: '#6a5a7a', pants: '#33313a', skins: ['#e0b490','#c99b74','#8a5a33'] },
  workshirt:{ shirt: '#7a8a6a', pants: '#35402f', skins: ['#8a5a33','#c99b74','#e0b490'] },
};

export const NAMED = {
  dale:   { name: 'Dale',  role: 'Wing Barn shift manager', arch: 'average', outfit: { shirt: '#e8dcc3', pants: '#3d3d3a' }, hat: 'visor',
            silhouette: 'visor, lanyard, tucked-in, vibrating slightly' },
  peanut: { name: 'Peanut', role: 'Plaza Rat', arch: 'wiry', outfit: { shirt: '#2e3138', pants: '#3d4c63' }, hat: 'hoodie',
            silhouette: 'a hoodie with a person somewhere inside it' },
  gary:   { name: 'Gary Loomis', role: 'Game Barn owner', arch: 'short', outfit: { shirt: '#6d5a4a', pants: '#5a5147' }, hat: 'bald',
            silhouette: 'cardigan slump; reads price guides like scripture' },
  brill:  { name: 'Officer Brill', role: 'HPD', arch: 'beerbelly', outfit: { shirt: '#2e3a4c', pants: '#22293a' }, hat: 'copHat', cop: true,
            silhouette: 'the belly arrives first' },
  tapp:   { name: 'Officer Tapp', role: 'HPD (new)', arch: 'wiry', outfit: { shirt: '#2e3a4c', pants: '#22293a' }, hat: 'copHat', cop: true,
            silhouette: 'still irons the uniform. Give it a year.' },
  roxy:   { name: 'Roxy', role: 'Ca$h Kingdom, both windows', arch: 'average', outfit: { shirt: '#8a4a5a', pants: '#3a3a36' }, hat: 'ponytail',
            silhouette: 'deadpan behind an inch of polycarbonate' },
  bev:    { name: 'Bev', role: 'your grandmother', arch: 'short', outfit: { shirt: '#b8a8c8', pants: '#8a7a9a' }, hat: 'curlers',
            silhouette: 'housecoat, crossed arms, knows' },
  chuck:  { name: 'Chuck', role: 'Alumni, class of ’16', arch: 'broad', outfit: { shirt: '#c04848', pants: '#c9b28a' }, hat: 'capBack',
            silhouette: 'polo from the good year; it has opinions now' },
  tanner: { name: 'Tanner', role: 'Alumni, also class of ’16', arch: 'beerbelly', outfit: { shirt: '#4878c0', pants: '#c9b28a' }, hat: 'capBack',
            silhouette: 'Chuck, but rounder and louder' },
  wanda:  { name: 'Wanda', role: 'Golden Lucky Wok III', arch: 'average', outfit: { shirt: '#e0b84a', pants: '#3a3a36' }, hat: 'bun',
            silhouette: 'has survived four names and both fires' },
  earl:   { name: 'Earl', role: 'Mile Hardware', arch: 'tall', outfit: { shirt: '#8a5a33', pants: '#4a4a42' }, hat: 'trucker',
            silhouette: 'leans on the counter like it owes him rent' },
  // ── The Foxhole ───────────────────────────────────────────────────────────
  // Written as PEOPLE WITH JOBS, deliberately. The club is crude; the crudeness is
  // aimed at the clientele, never at the staff — that's the Rockstar discipline, and
  // it's also just funnier. Every one of them is smarter than everyone they serve.
  moose:  { name: 'Moose', role: 'Foxhole door', arch: 'broad', outfit: { shirt: '#22242a', pants: '#2e3138' }, hat: 'beanie',
            silhouette: 'a doorway with a person in front of it; reads paperbacks between ejections' },
  dee:    { name: 'Dee', role: 'Foxhole bar (and owner)', arch: 'average', outfit: { shirt: '#5a2e3d', pants: '#2e2a2e' }, hat: 'bun',
            silhouette: 'towel over the shoulder, has heard your whole life story twice' },
  cherry: { name: 'Cherry', role: 'Foxhole stage', arch: 'wiry', outfit: { shirt: '#c04a7a', pants: '#3a2e3a' }, hat: 'ponytail',
            silhouette: 'robe cinched between sets; flashcards in the pocket' },
  sable:  { name: 'Sable', role: 'Foxhole stage', arch: 'average', outfit: { shirt: '#6a4a8a', pants: '#3a2e3a' }, hat: 'bun',
            silhouette: 'nineteen years on this floor and a knee that reports the weather' },
  // ── Downtown ──────────────────────────────────────────────────────────────
  sal:    { name: 'Sal', role: 'Split Lip bar', arch: 'beerbelly', outfit: { shirt: '#6a5a4a', pants: '#3a3632' }, hat: 'bald',
            silhouette: 'forearms like hams, apron that predates the health code' },
  vern:   { name: 'Vern', role: 'Loanstar Pawn', arch: 'tall', outfit: { shirt: '#5a5a4a', pants: '#4a4438' }, hat: 'trucker',
            silhouette: 'reading glasses on a chain, loupe in the shirt pocket, zero illusions' },
  madison:{ name: 'Madison', role: 'Daybreak barista', arch: 'wiry', outfit: { shirt: '#e8e4dc', pants: '#3a3e44' }, hat: 'bun',
            silhouette: 'clean apron, transplant posture, apologizing in advance' },
  // ── Cassidy Works ─────────────────────────────────────────────────────────
  denny:  { name: 'Denny', role: 'Local 448 steward', arch: 'broad', outfit: { shirt: '#4a5568', pants: '#3a3632' }, hat: 'trucker',
            silhouette: 'forty years of grievances, filed in order, none resolved' },
  gus:    { name: 'Gus', role: 'yard security', arch: 'tall', outfit: { shirt: '#5a5548', pants: '#44403a' }, hat: 'cap',
            silhouette: 'walks the yard like it owes him a pension. It does.' },
  // ── The Bluffs ────────────────────────────────────────────────────────────
  rand:   { name: 'Rand', role: 'Bluffs "security"', arch: 'beerbelly', outfit: { shirt: '#3a4a5a', pants: '#2e3a44' }, hat: 'copHat',
            silhouette: 'a uniform bought online; the cart has no keys and neither does he' },
  whit:   { name: 'DA Whitcomb', role: 'county DA', arch: 'average', outfit: { shirt: '#e8e4dc', pants: '#5a6a52' }, hat: 'visor',
            silhouette: 'golf polo, county seal, the confidence of the never-audited' },
  bunny:  { name: 'Bunny Marchetti', role: 'Bluffs', arch: 'wiry', outfit: { shirt: '#e8b8c8', pants: '#f0ead8' }, hat: 'bun',
            silhouette: 'sunglasses indoors, tennis skirt, has never once been told no' },
  // ── Hopeless Tech ─────────────────────────────────────────────────────────
  trevor: { name: 'Trevor', role: 'Campus Safety', arch: 'wiry', outfit: { shirt: '#3d5a3d', pants: '#3a3e44' }, hat: 'cap',
            silhouette: 'polo tucked into cargo shorts, radio he has never needed' },
  pettig: { name: 'Ms. Pettigrew', role: 'financial aid', arch: 'short', outfit: { shirt: '#7a6a8a', pants: '#3a3a42' }, hat: 'bun',
            silhouette: 'cardigan, lanyard, and the only real power on this campus' },
  dunn:   { name: 'Dunn', role: 'welding instructor', arch: 'broad', outfit: { shirt: '#8a5a33', pants: '#4a4438' }, hat: 'trucker',
            silhouette: 'forearm scars, safety glasses on his hat, thirty years of other people\'s sons' },
};

// ambient population per block: [count, archetype pool, outfit pool, where]
export const POPULATION = {
  morning:  [ { n: 3, spots: 'bus',   outfits: ['hivis','greasy','denim'] },
              { n: 2, spots: 'qwik',  outfits: ['denim','flannel'] },
              { n: 2, spots: 'walk',  outfits: ['denim','camo'] },
              { n: 2, spots: 'dtwalk',outfits: ['denim','hivis'] },
              { n: 2, spots: 'works', outfits: ['hivis','greasy'], pool: 'dockhand' } ],
  afternoon:[ { n: 4, spots: 'walk',  outfits: ['denim','flannel','camo','carhartt','hoodie','workshirt'] },
              { n: 2, spots: 'buffet',outfits: ['greasy','denim'] },
              { n: 1, spots: 'walk',  outfits: ['tourist'] },
              { n: 2, spots: 'dtwalk',outfits: ['denim','flannel'] },
              { n: 1, spots: 'square',outfits: ['camo'], pool: 'courthouse_idle' },
              { n: 2, spots: 'works', outfits: ['hivis','greasy'], pool: 'dockhand' } ],
  evening:  [ { n: 3, spots: 'lot',   outfits: ['flannel','denim','camo'] },
              { n: 2, spots: 'buffet',outfits: ['denim','hivis'] },
              { n: 2, spots: 'qwik',  outfits: ['flannel','greasy'] },
              { n: 1, spots: 'walk',  outfits: ['tourist2'] },
              { n: 2, spots: 'dtbar', outfits: ['flannel','greasy'], drunk: 0.4, pool: 'splitlip_reg' },
              { n: 2, spots: 'works', outfits: ['hivis'], pool: 'dockhand' } ],
  late:     [ { n: 3, spots: 'lot',   outfits: ['flannel','camo','greasy'], drunk: 0.6 },
              { n: 2, spots: 'qwik',  outfits: ['denim','greasy'], drunk: 0.3 },
              { n: 2, spots: 'dtbar', outfits: ['greasy','denim'], drunk: 0.8, pool: 'splitlip_reg' } ],
};

export const SPOTS = {
  bus:   [ [1000, 1100], [1050, 1110], [960, 1095], [1110, 1105] ],
  qwik:  [ [240, 620], [300, 660], [180, 680], [340, 700] ],
  walk:  [ [520, 505], [900, 508], [1300, 505], [1750, 508], [600, 1058], [1400, 1060] ],
  buffet:[ [920, 560], [980, 590], [1040, 555] ],
  lot:   [ [900, 780], [1000, 820], [1100, 760], [960, 860], [1180, 810] ],
  // downtown: the smokers outside the Lip, the square, Main Street foot traffic
  dtbar: [ [330, 2160], [400, 2170], [290, 2180] ],
  dtwalk:[ [600, 2145], [1000, 2150], [1300, 2148], [800, 2270] ],
  square:[ [640, 2320], [1260, 2330], [960, 2360] ],
  // the Works: dockhands by the bays, smokers by the hall
  works: [ [2500, 1150], [2700, 1240], [2900, 1160], [2380, 830] ],
};

// ── ERRANDS ───────────────────────────────────────────────────────────────────
// Real destinations, so a share of the population is always IN TRANSIT rather than
// milling in the spot it spawned. This is the difference between a town with people
// in it and a town with people arranged in it. They cross district lines on purpose:
// seeing a man walk from the plant gate to the Split Lip is the whole point.
export const ERRANDS = [
  { x: 1000, y: 1092, what: 'the bus shelter' },
  { x: 250,  y: 640,  what: 'the QwikStop' },
  { x: 980,  y: 552,  what: 'the buffet' },
  { x: 1290, y: 516,  what: 'the Wing Barn' },
  { x: 1960, y: 516,  what: 'Ca$h Kingdom' },
  { x: 1035, y: 900,  what: 'across the lot' },
  { x: 380,  y: 2158, what: 'the Split Lip' },
  { x: 1150, y: 2150, what: 'up Main Street' },
  { x: 960,  y: 2320, what: 'the courthouse' },
  { x: 2480, y: 1140, what: 'the dock' },
  { x: 2360, y: 900,  what: 'the plant gate' },
  { x: 2560, y: 1900, what: 'the quad' },
  { x: 600,  y: 1180, what: 'home, in the Flats' },
  { x: 1720, y: 1120, what: 'nowhere in particular' },
];

// ---------------------------------------------------------------------------
// BARKS — collected outside a gas station at 1 a.m. R-rated, no slurs, jokes first.
// ---------------------------------------------------------------------------

// ─────────────────────────────────────────────────────────────────────────────
// THE MOUTH OF HOPEWELL
// Design doc, verbatim: "the vulgarity is load-bearing — this is a town that
// communicates affection exclusively through insults, and the dialogue should read
// like it was collected outside a gas station at 1 a.m."
// THE RULE (also the doc's): R-rated language IN SERVICE OF THE JOKE. Never slurs.
// Never cruelty without a punchline. If a line is only shocking, it isn't finished.
// ─────────────────────────────────────────────────────────────────────────────
export const BARKS = {
  townie_idle: [
    "Gas went up again. I'm gonna start walking, and I'm gonna bitch about that too.",
    "My cousin got that solar. Roof leaks now. Coincidence? Ask the goddamn roof.",
    "I'm not saying the buffet's cursed. I'm saying twice is a pattern and I ate there anyway.",
    "This town took my twenties, my truck, and one whole testicle, and gave me a punch card.",
    "You want a lotto number? Six. Just six. I've lost four hundred dollars on six.",
    "Interstate skipped us on purpose. My grandpa saw the map and he cried about it till he died.",
    "Had a job interview in the city. Car died halfway. God's a funny son of a bitch.",
    "Somebody's been feeding that dog gas-station jerky. He's got the eyes of a man now. A tired man.",
    "New coffee place wants nine dollars. NINE. For hot milk with a fuckin' attitude.",
    "I've been quitting smoking since March. Different March. Different decade, honestly.",
    "My landlord raised rent and fixed nothing, so now we're just two guys lying to each other.",
    "Everybody I went to school with is either gone, dead, or standing right here.",
    "I'd move, but then I'd be somewhere I don't know anybody, and here at least the assholes are familiar.",
    "You seen my ex? Don't tell her you seen me. Don't tell her nothing. She's got a whole system.",
    "Doctor says I gotta cut back. I said cut back on WHAT, doc, joy?",
  ],
  townie_late: [
    "You ever just stand in a parking lot at 1 a.m.? Best damn thing this town does, and it's free.",
    "I'm out here 'cause the house is full of people I'm related to and I've heard all their shit already.",
    "Third shift's a state of mind, man. I don't even have a job. I just keep the hours.",
    "You hear that train? Never stops here. Just screams about it and keeps going. Relatable as hell.",
    "Saw a UFO over the plant in '19. Told everybody. Now I'm 'UFO Randy.' Worth it.",
    "Two in the morning is the only honest hour. Everybody out here's exactly who they are.",
    "I'm not drunk, I'm just done. There's a difference and it's mostly paperwork.",
    "Cops rolled past twice. Didn't even slow down. I've never felt so unwanted.",
  ],
  drunk: [
    "I could've played college ball. Coach said I had the ANGER for it. He meant it as a warning.",
    "You know what YOUR problem is? No — hang on — I know what MY problem is. Give me a second.",
    "I love this parking lot. This lot has never lied to me. My wife's a different story.",
    "My ex took the truck AND the dog. Dog wanted to go. That's the part that fucks me up.",
    "I'm gonna say something real to you and then deny it tomorrow: you're alright.",
    "Everybody keeps telling me to grow up. Grow up INTO WHAT. Look around, man!",
    "I'd fight you but my back's out and honestly I like you.",
    "Buy me a beer and I'll tell you who really burned down the old Dairy Freeze.",
    "Sorry, sorry — I thought you were somebody I owe money. Which, statistically, you might be.",
    "I have thrown up twice tonight and I am STILL the best-looking man in this parking lot. That's the tragedy of Hopewell.",
    "Held the door for a woman at the QwikStop and I've been thinking about it for six hours. It's the most action this town's seen since the grain elevator fire.",
    "My body is a temple. Abandoned. Vandalized. Raccoons got in. But a TEMPLE.",
  ],
  tourist: [
    "Honey, look — a REAL pawn town! It's so authentic I could just cry.",
    "Is there a farmers market? Every town has one now, I'm pretty sure it's the law.",
    "Zillow said this place was 'up and coming.' Which one's it doing right now, exactly?",
    "I'd absolutely buy a little place here. As an investment. Not to, you know. Live in.",
    "It's got such CHARACTER. — Brayden, don't touch that, it's got character on it.",
  ],
  filming: [
    "This is going in the group chat SO fast.",
    "Hold my Rip, I'm getting this vertical.",
    "Ohhh, somebody's mother is gonna watch this by dinner.",
    "Fight! FIGHT! — okay it's more of a slow shove but I'm still filming.",
    "Post this and I'm finally gonna be somebody. Somebody who films shit.",
  ],
  fled: [
    "NOPE.",
    "Not today, man, I got a probation thing.",
    "I did NOT see shit and I mean that legally.",
    "You're on your own, I got a KID— I don't, but I'm workshopping it—",
    "Absolutely not, I just got these teeth.",
  ],
  hit_react: [
    "OW. Okay. OKAY.",
    "That's assault, baby!",
    "My guy, I have a TIMESHARE MEETING tomorrow—",
    "The HELL is wrong with you?!",
    "You hit like my stepdad and I mean that as an insult to you BOTH.",
    "Oh, it's like that? It's like that. — It's not like that, I'm leaving.",
  ],
  cop_noticed: [
    "There he is. You know I know your face, right? I know your whole damn FACE.",
    "Mm. Keeping a little list today, bud. You're the list.",
    "I pulled your grandpa outta the lake in '02. Try not to make it a family tradition.",
  ],
  cop_named: [
    "Hey! Heyyy. Tell Bev I said hi. I WILL be mentioning this shit to her.",
    "You again. I'm not chasing you, man. I'm forty-one years old and I ate at the buffet. I'm telling your grandmother.",
    "Saw your little show earlier. Bev raise you like that? She did not. She raised you with a wooden spoon and SHAME.",
    "Keep it up and I'll do the thing you hate. I'll come to the house. I'll sit on the porch. I'll ACCEPT LEMONADE.",
  ],
  cop_wanted: [
    "STOP— goddammit, I JUST ATE—",
    "He's running! Why do they always run! I got the knees of a fifty-year-old man!",
    "I will find you, you little shit, I know where you SLEEP, I know your GRANDMOTHER—",
  ],
  cop_cuff: [ "Yeah. Yep. There it is. You want the good cuffs or the pinchy ones?" ],
  // The HUD heat readout IS the police scanner — cop shorthand about you, in real time.
  // (The art bible asked for this; three abstract pips were doing the job before.)
  scanner: {
    0: [ "…quiet out there. 10-8, nothing to report…",
         "…unit two clear of the Mile, taking coffee…",
         "…all quiet. Somebody check the buffet dumpster again…" ],
    1: [ "…got eyes on that Delacroix kid again. No action. Just — eyes…",
         "…subject's out on the Mile. Nothing chargeable. Yet…",
         "…yeah he's around. He's always around. That's not a crime, Tapp…" ],
    2: [ "…be advised, that's the Delacroix boy. We know the vehicle, we know the house…",
         "…I'm not chasing him. I'm gonna go talk to his grandmother…",
         "…subject is KNOWN. Repeat, known. Bev's number's on the board…" ],
    3: [ "…ALL UNITS, Miracle Mile, subject is running — BOTH cars, I mean it…",
         "…he's headed for the lot! Somebody cut the alley! THE ALLEY, TAPP—",
         "…county's asking if we need help. We do NOT need help. …We might need help…" ],
  },
  peanut: [
    "Yo. You did not hear this from me, but Gary's got a whole CASE of FunStation consoles in the back. Sealed. Since NINETY-SEVEN.",
    "Gary does the bank drop Thursday, nine-ish. Whole store just sits there with its ass out. Alarm company dropped him in '19 and Marlene never told him. Marlene's petty as hell.",
    "That back window over the dumpster? Propped on a milk crate since the AC died. Gary thinks raccoons. It was raccoons AND me.",
    "Fairview offered Gary a number for the storefront. He told 'em to eat shit. They don't hear no, man. They hear 'later.'",
    "You didn't get NONE of this from me. I'm basically a rumor with a hoodie on.",
  ],
  dale: [
    "Okay. Team huddle. It's just you. We're a family here, and family shows the hell up at eleven.",
    "The camera's for INSURANCE, not for watching you. But I do also watch you.",
    "Corporate says smile with your VOICE. I don't know what that means either, man. Just ring.",
    "You break the streak on my perfect drawer and I will cry in the walk-in again. Don't test me.",
    "I got a degree. Business admin. It's in the office, under the fry oil invoices, where it belongs.",
    "Twelve years I been here. Twelve. My wife calls it a career. She says it mean.",
    "I have cried in that walk-in so many times there is a ME-shaped cold spot. Health code says I can't tell you which shelf.",
    "Corporate sent a poster that says HUSTLE. I hung it over the grease trap. Felt correct.",
    "You smell that? That's forty gallons of oil that legally should've retired in March. Same as me. We soldier on.",
  ],
  gary: [
    "Everything's buy-sell-trade except the back room. Back room's the retirement plan.",
    "Fairview called again. Store's not for sale. Town's not for sale. ...Everything IN the store is for sale, obviously, it's a goddamn store.",
    "You want the '97 sealed stuff? So does everybody. It goes to auction the year I die, kid. That's the plan. That's the WHOLE plan.",
    "Slow day. Slow year. Slow quarter-century, if I'm honest with you.",
    "Kid came in Tuesday, asked if we buy phones. This is a GAME store. It says GAME on the—  I'm fine. I'm fine.",
  ],
  bev: [
    "There's a plate in the microwave. I don't want to know.",
    "You came in at three in the damn morning. The dog told me. Him and me don't keep secrets.",
    "Your mother calls Sundays. You'll be here, or so help me God you'll wish the cops got you first.",
    "I'm not asking where the money's from. I'm saying the JAR is for rent, and the jar NOTICES.",
    "Your grandfather drank himself stupid in that same chair. Sit somewhere else. Humor me.",
    "You're not a bad kid. You're a dumb kid with good hands. That's fixable, barely.",
    "I've buried two husbands and a Buick, sweetheart. You think YOU'RE gonna be the thing that breaks me?",
    "Watch your mouth. ...Not for me. I've heard worse at church. For your mother, on the phone, on Sunday.",
    "I know what a hangover walks like. Yours walks like your grandfather's, and his killed him, so eat the eggs.",
    "Brill came by. I gave him lemonade and nothing else. Fifty years I've been giving that family lemonade and nothing else.",
  ],
  roxy: [
    "Window one: checks, loans. Window two: 'goods.' Pick a window, this glass ain't got all day.",
    "Twenty percent a week. It's not a trick, sweetheart, it's just math you're gonna hate later.",
    "I've been robbed twice and proposed to four times through this glass. All six, same damn energy.",
    "Everybody's got a story about why they're short. I got a drawer full of 'em and none of 'em spend.",
    "A man flashed me through this glass once. Bulletproof, honey. It's rated for a lot more than THAT.",
    "You know what the kingdom part is? I outlast everybody. That's the whole royal secret. I'm still here at close.",
  ],
  roxy_fence: [
    "Where'd these come from? Don't answer. That was a test and you passed.",
    "Seventy a crate. That's the number keeps us both out of a courtroom.",
  ],
  earl: [
    "Everything must go. Including me. ESPECIALLY me.",
    "Crowbar's twenty-two. You want a receipt, or is this a no-receipt kind of purchase? Don't answer with your face like that.",
    "Forty-one years my family had this place. Ends with me. No kids, and the ones I got sense enough not to saddle with it.",
    "A Fairview fella measured my storefront with a laser. A LASER. I measured his ass with a broom on the way out.",
    "PVC's aisle three. Whatever you're building, I don't wanna know, and whatever it is, use primer, you animal.",
  ],
  wanda: [
    "Buffet's nine dollars. Plate rules: what fits, fits. No towers. I have SEEN towers. I have PHOTOGRAPHED towers.",
    "Third name was the best name. 'Lucky Dragon Palace.' The fire disagreed.",
    "Health inspector's a nephew of mine. Don't make that face, everybody's a nephew of somebody here.",
    "The fish? The fish has seen two fires and a divorce. The fish stays. Ask about the fish again and YOU go.",
  ],
  chuck: [
    "LAKE THIS WEEKEND. Boys' trip. Tanner's bringing the speaker. The BIG bastard.",
    "I could still bench two-twenty. Cold. Don't make me prove it in a parking lot, 'cause I will.",
    "Married? Nah. Was. She's in Bozeman now with a guy who does yoga. YOGA.",
  ],
  tanner: [
    "Chuck cried in Gatlinburg and I'll never tell a soul. — Why'd I say that out loud. Who are you.",
    "2016 was the best year of my life and I'm CHILL about it. I'm extremely chill about it.",
    "We're not washed. We're VINTAGE. There's a difference and I'll fight the man who says otherwise.",
  ],
  buster: [ "(Buster is barking at you specifically.)", "(Buster accepts the jerky. A treaty is signed.)", "(Buster's tail says you're famous here.)" ],
  // ── THE FOXHOLE ───────────────────────────────────────────────────────────
  moose: [
    "Eight bucks. I don't care that you know me. I know EVERYBODY, that's the whole job.",
    "Rules: hands to yourself, tip the girls, don't be a dick. You'll break one. Pick carefully.",
    "You start something in here, you don't get thrown out. You get CARRIED out. Ask Tanner.",
    "I'm four hundred pages into a book about a submarine and you're interrupting the good part.",
    "Bathroom's out of order. It's been out of order since Obama. Piss at the QwikStop.",
  ],
  moose_regular: [
    "Ahh, hell. Go on in. Don't make me regret it in front of people.",
    "You're alright. Low bar in here, but you cleared it.",
  ],
  dee: [
    "Seven bucks a beer. It's cold, it's wet, and it's the only one you're getting on credit — which is none.",
    "I own the building, the liquor licence, and everybody's secrets. Guess which one pays.",
    "You want to know something? Everything in here has a price and information's the dearest.",
    "Half this county's cried at this bar. The OTHER half's the reason.",
    "Fairview came in here too. Offered me a number. I laughed so hard I pissed off a man three stools down just by existing.",
    "Rule of the house: you don't touch, you don't photograph, and you don't ask Cherry what she's studying — she WILL tell you, at length.",
    "I've cut off a mayor, a pastor, and one very surprised state trooper. This bar is the only equal ground in the county.",
    "My third husband's under a commemorative coaster somewhere in here. His ashes. Relax. Mostly his ashes.",
  ],
  dee_info: [
    "Gary Loomis. Thursday nights he does the drop himself, nine o'clock, no alarm since '19. He told me that HIMSELF, drunk, at this bar, twice.",
    "Cops run the Mile twice a shift and never once at closing. Brill's a creature of habit and the habit is dinner.",
    "That back window at the Game Barn's been propped since the AC died. Everybody knows. Nobody says.",
  ],
  cherry: [
    "Two hundred and six bones in the human body. I can name every one, and I have named every one, out loud, to a man who did not ask.",
    "This pays for nursing school. Nursing school pays for leaving. Don't look so sad about it, it's a PLAN, which is more than you've got.",
    "You want the truth? Y'all are the easiest money in Montana. Half of you just want somebody to say your name right.",
    "Tip the DJ too. He's got a kid and a Corolla with one door that opens.",
    "No, I don't want a drink. I've watched what happens to people in here who want a drink.",
    "Ask me about the clavicle. Go on. ASK me about the clavicle.",
    "A man told me last week I was 'too smart for this.' Honey, I made four hundred dollars while you were deciding that.",
    "I've been groped exactly once in this room. Moose threw the guy so far he technically left via the roof. We have a plaque.",
  ],
  sable: [
    "Nineteen years on this floor. My knee tells the weather and it's never wrong and it's never good news.",
    "I've seen three mayors, two grease fires, and one man propose to a woman who was on her BREAK.",
    "Everybody in this town's got a plan to leave. I had one too. It's around here somewhere.",
    "You're Bev's grandkid, ain't you? Sit up straight. She'd want that.",
    "Money's money, sugar. It don't care where it's been and neither do I, but MY knees do.",
    "The pole's older than you and holds up better under pressure. Think about that on your way home.",
  ],
  fox_patron: [
    "I'm not here for THAT, I'm here 'cause it's the only place with cold beer past eleven. ...And also for that.",
    "My wife thinks I'm at the plant. I AM at the plant. Later. Probably.",
    "Tuesday's wing night. A strip club with a WING NIGHT. This town's a goddamn miracle and my cardiologist's worst enemy.",
    "I tipped my whole check once. Best night of my life, worst month of my life.",
    "Don't tell Dee I'm broke. Dee has a bat and a very specific memory.",
    "I'm sweating ranch and feelings, man. This is the most alive I get.",
    "I came in here to forget a woman and now I owe two more women money. The system WORKS.",
    "Every part of me is having a different night. My heart's in love, my stomach's in hell, and my wallet's calling its mother.",
  ],
  fox_alumni: [
    "CHUCK. CHUUUCK. Get the man a beer, he's had a WEEK—",
    "This is our spot. Been our spot since college. It was a Napa Auto Parts then but same energy.",
    "Bachelor party in here in '18. Groom's divorced now. Coincidence? ...Yeah, probably.",
    "I'm in LOVE, Tanner. — You're in a strip club and you had nine beers. — A man can be BOTH places.",
  ],
  // ── THE SPLIT LIP — third-shift congregation, 2 a.m. poetry ───────────────
  sal: [
    "Beer's four bucks. Whiskey's three. The whiskey being cheaper should tell you everything about the whiskey.",
    "Bathroom's for customers. Being a customer won't prepare you for it. NOTHING prepares you for it.",
    "I've mopped up blood, teeth, and one entire toupee. The toupee was the worst. It looked ALIVE.",
    "You break a cue on somebody, you bought the cue. House rule since '94. It's on the wall, in blood, coincidentally.",
    "This bar has outlived four banks, two churches, and every single one of my marriages. Pour one out. Not literally, that's four dollars.",
    "Fairview wanted to buy the Lip. Called it a 'legacy tavern experience.' I called their guy an ambulance, eventually.",
  ],
  splitlip_reg: [
    "I love her, man. I love her like I love this bar: from a distance she's perfect and up close I start crying.",
    "I threw up in that bathroom in 2011 and I swear to God it's still in there. It WAVES at me.",
    "Half of me wants to go home. The other half of me IS home. This stool's got my ass print, look. LOOK at it.",
    "She said I had to choose between her and this place. Anyway, Sal, the usual.",
    "You know what this town needs? Nothing. It needs NOTHING. It's perfect. It's a perfect piece of shit and I'd die for it.",
    "I've got a half a mind to go over there and talk to her. Other half's been gone since the second whiskey.",
    "My doctor drinks here. My LAWYER drinks here. My ex drinks here. This bar is my entire government.",
  ],
  hurl: [
    "Your stomach files a formal protest, in the lot, in front of God and the bottle cap you find down there.",
    "It all comes up: the whiskey, the wings, a decision from Tuesday. You feel eleven percent holier.",
    "You water Sal's one plant. It's plastic. It thrives anyway.",
  ],
  // ── LOANSTAR PAWN — the aisle of regret ───────────────────────────────────
  vern: [
    "Everything in that ring case is a marriage. Front row's the nineties. Prices go DOWN the sadder the story, ask me anything.",
    "Gun case is empty. Ask Vern? Vern says no. Vern's BEEN saying no since the incident, and Vern was RIGHT.",
    "Fourteen weed whackers. FOURTEEN. Every spring they buy 'em, every August they drink 'em. That wall is a calendar.",
    "That owl's not for sale. That owl has seen me cry and it stays where the leverage is.",
    "I give you forty for it, sell it for eighty, and we both agree not to do the math out loud. That's the whole industry, kid.",
    "A man pawned his glass eye once. Came back for it in a WEEK with the money. Best customer I ever had. Great eye contact, eventually.",
  ],
  // ── DAYBREAK — the invasion, with oat milk ────────────────────────────────
  madison: [
    "Hi, welcome to Daybreak! The latte's nine dollars. I know. I KNOW. Please don't do the face, everyone does the face.",
    "I moved here from Portland for the 'authenticity.' A man threw up on our succulents Tuesday. It's SO authentic.",
    "Corporate says call customers 'neighbors.' A real neighbor came in and called me something I had to look up. It was creative!",
    "The wifi password is 'community' with a dollar sign. I didn't pick it. I want you to know I didn't pick it.",
    "The guys in the corner? Fairview. They tip in stickers. STICKERS of the logo. Of the building they're taking.",
  ],
  fairview_rep: [
    "—footprint's undervalued, the whole corridor. The bar we flip to a raw-bar concept, keep the name, kill the smell—",
    "—the pawn guy'll sell. They always sell. You just find the number where his dignity rounds down—",
    "—call it 'The Lip.' Heritage signage, new everything. People LOVE a scar if you frame it—",
    "—game store's the holdout. Old man's sitting on prime frontage like it's a memory. Memories have carrying costs—",
  ],
  // ── HOPELESS TECH ─────────────────────────────────────────────────────────
  // The doc calls the Polo Shirts "an entire comedy ecosystem." Four guys, one
  // golf cart, unlimited self-regard — and the joke is always that they have
  // exactly as much authority as you agree to give them.
  trevor: [
    "Campus Safety. That's SAFETY, not security — security implies we could stop something.",
    "I can't detain you. I want to be real clear that I can't. But I CAN describe you, at length, to a real officer.",
    "You got a student ID? ...You do? Huh. Damn. Okay. Carry on then. Enjoy your— carry on.",
    "That's the cart. Do not sit on the cart. Do not LEAN on the cart. Michael leaned on the cart in March.",
    "Four of us. Two hundred acres. One cart. You do the math and then feel bad for me.",
    "I'm doing this two years then applying to HPD. Brill says the list is long. Brill says the list is ALWAYS long.",
  ],
  trevor_cart: [
    "HEY! HEY. THAT'S THE CART. GET OFF THE— I'M CALLING SOMEBODY WHO CAN CARE ABOUT THIS.",
    "Nope. Nope nope nope. That cart is county property and I am EMOTIONALLY ATTACHED to it.",
  ],
  pettig: [
    "Disbursement is week four and week twelve. It is not week whenever-you-need-it. I have heard every version of that sentence.",
    "You have to attend. I know. I KNOW. But the form has a box and the box has a number and the number has to be above zero.",
    "Half this campus is here for the check, sweetheart. I'm not judging. I process the check. I'm just saying I can count.",
    "Your file is thick for a man who's completed nine credits. That's not an insult, it's a filing complaint.",
    "You want the money AND the dignity? Pick one, come back Thursday, and bring the form.",
  ],
  dunn: [
    "Hands where I can see 'em, glasses on, and if you burn yourself I'm not writing it up because then it happened.",
    "Thirty years I've taught other people's sons to make a thing that holds. Some of 'em even wanted to.",
    "You've got hands. That's not nothing — most of what comes through here has thumbs and a phone.",
    "Make your own bar. Buy one and it's a receipt with your name on it. Make one and it's just STEEL, son.",
    "The detectors? That was us. Program kept eating the copper out of the walls. Now it beeps at a belt buckle and I think that's funny as hell.",
    "You quit, you quit. Everybody quits. Just don't tell me you're coming back if you're not.",
  ],
  campus_idle: [
    "I'm thirty-four and I'm in Intro to Anything. Don't look at me like that, my back went out at the plant.",
    "Financial aid hit and I bought tires. TIRES. That's the most adult thing I've ever done and I hated it.",
    "Nursing cohort's brutal. Half of 'em cry in the stairwell. The OTHER half already work nights.",
    "This is my fourth major. I'm not lost, I'm THOROUGH.",
    "They put in a whole building with GLASS and the parking lot's still gravel. Priorities, man.",
    "Everybody calls it Hopeless. Even the DEAN calls it Hopeless. He said it at orientation.",
    "The vending machine takes your dollar and thinks about it. Just thinks about it. Forever.",
  ],
  detector: [
    "The detector goes off like it found uranium. A work-study kid looks up, deeply unbothered.",
    "BEEP. Everyone in the lobby looks. Nobody in the lobby cares. This happens forty times a day.",
    "It shrieks. You are, briefly, the most interesting thing on this campus.",
  ],
  // ── CASSIDY WORKS ─────────────────────────────────────────────────────────
  denny: [
    "Forty years I've stewarded this local. Started with nine hundred men. We're down to enough for a decent pallbearer rotation.",
    "The hall stays lit. Company asked why we still pay the electric. I said spite, and they wrote it down, and I signed it.",
    "Your grandfather worked line six. Good hands, bad lungs, worse poker. You've got his exact face and I'm watching it.",
    "Fairview sent a man about 'the campus.' The CAMPUS. Son, men lost fingers in that campus.",
    "Coffee's fifty cents, honor box. The honor box has been shorted twice in forty years and both men confessed WITHIN THE WEEK. That's the hall.",
    "You want dock work, talk to the window. You want justice, get in line behind me — I've been in it since '86.",
  ],
  gus: [
    "Yard's private property, kid. So's my patience, and you're trespassing on both.",
    "I know every pallet in this yard by weight. By WEIGHT. Don't test the fat old man, it never goes the way you think.",
    "Forty-one years I watched this yard. The yard doesn't know. You think a yard knows? It'd break its heart.",
    "Company cut my pension in '09 and asked me to guard what's left. And I DO. Figure that one out and get back to me.",
  ],
  gus_caught: [
    "PUT IT DOWN. — Thank you. Now get out before I remember your grandmother's phone number, which I do.",
    "Nope. That one fell off a truck INTO MY LEDGER. Walk away, kid, my whistle's louder than your excuse.",
  ],
  dockhand: [
    "Third generation on this dock. My kid says he wants a computer job. GOOD. I mean that. GOOD.",
    "The horn used to mean four thousand guys moving at once. Now it's basically an alarm clock for me and God.",
    "Lifted wrong in '19 and my spine's been freelance ever since.",
    "One shift running. ONE. This place used to eat three shifts and ask for a fourth, man.",
  ],
  // ── THE BLUFFS ────────────────────────────────────────────────────────────
  rand: [
    "Bluffs Patrol. That's a real title. It's on a card. I HAD cards made.",
    "I'm not a cop. I'm cop-ADJACENT. There's a difference and it's mostly the pension.",
    "Cart's electric. Does eleven miles an hour and I've never needed more, and that's the tragedy.",
    "Camera on the Marchetti place hasn't worked since the hail. They know. They pay me instead. I'm cheaper AND worse.",
    "Twenty-two years HPD wouldn't take me. Now I make double watching a lake nobody swims in.",
    "You live up here? ...Didn't think so. Nobody who lives up here WALKS.",
  ],
  whit: [
    "The docket's a suggestion, son. A living document. I live it.",
    "Golf Fridays. Every Friday. It's on the county calendar as 'community outreach' and technically that is TRUE.",
    "I've dropped four hundred charges in this county and slept every single night like a baby with a trust fund.",
    "Your name's crossed my desk. Twice. It'll cross again and I'll do the same thing I always do — nothing, expensively.",
    "Fairview's counsel and I play the back nine together. That's not corruption, that's a SMALL TOWN.",
  ],
  bluffs_idle: [
    "We're not FROM here, we're OF here. There's a difference. — What's the difference? — We have the lake view.",
    "The town's so charming. I'd never go down there, but it's charming.",
    "Bought the feed store lot. Gonna do a wellness thing. A wellness CONCEPT.",
    "Somebody's kid keyed the Range Rover. Down there they'd call that a Tuesday. Up here we call our attorney.",
    "It's a second home. Well — it's a THIRD home, but the second one doesn't count, it's in Scottsdale.",
    "Ugh, the plant whistle. You can hear it from the DECK. We're writing letters.",
  ],
  club: [
    "Members and guests only. Are you a guest? Of WHOM, exactly?",
    "The chef's from Bozeman. BOZEMAN. We flew him in like a witness.",
    "Dues went up. Everyone screamed. Everyone paid. That's the club.",
  ],
  // fired when you're standing in somebody's house and their alarm is counting
  burg_tense: [
    "(Somewhere in the house, a panel is beeping about you.)",
    "(The fridge hums. Your pulse hums louder.)",
    "(Every second in here is a second of somebody else's life you're spending.)",
  ],
  burg_owner: [
    "WHO'S THERE? I HAVE A— I'M CALLING THE— GERALD, GET THE THING!",
    "Oh my GOD. Oh my god oh my god — I'm on the phone with them RIGHT NOW—",
    "You picked the WRONG— no, actually, you picked a fine house, we have great stuff, GET OUT!",
  ],
  courthouse_idle: [
    "The docket's posted Thursdays. It's the town phone book with worse fonts.",
    "My cousin beat a DUI in there by crying about his boat. The JUDGE has the same boat. Justice is a boat club.",
    "That flag's flown at half mast since March. Nobody remembers for who. At this point it's just honest.",
  ],
  // ⚠️ keep these AMOUNT-NEUTRAL — an early pass said "a damp twenty" on a $7 haul.
  // rollBody picks the pool by size; only rolled_fat may talk like it's real money.
  rolled: [   // what you find in a Hopewell pocket
    "Damp bills and a receipt for a single lottery ticket.",
    "Crumpled cash, a house key, and a photo of a dog that is clearly deceased.",
    "Small bills, three lighters, and a card for a guy who does drywall 'mostly.'",
    "It's still warm. You feel about that exactly how you'd expect to feel.",
    "Ones from the Wing Barn tip jar. Circle of life, technically.",
    "Folded singles in a sandwich bag, which tells you everything about his week.",
  ],
  rolled_fat: [  // tourist wallets and Alumni beer funds
    "A money clip shaped like a fish. Tourist money. Somehow this feels guilt-free.",
    "Real bills. Crisp ones. Nobody in this town has crisp ones.",
    "A wallet fat enough to have its own zip code, and a hotel key card for two towns over.",
    "Boat money. Absolute boat money, in a parking lot, in the dark. Merry Christmas.",
  ],
  rolled_empty: [
    "Lint, a punch card, and a folded note that says 'CALL YOUR SISTER.' You leave the note.",
    "Nothing. This man is broker than you, which is a genuine achievement.",
    "Two dollars and a losing scratcher. You put the scratcher back. Some things are sacred.",
  ],
  woke_grudge: [
    "YOU. You went through my POCKETS, you absolute piece of—",
    "I felt that! I was UNCONSCIOUS and I still felt that!",
    "Everybody! EVERYBODY! This son of a bitch robbed me while I was ASLEEP on the GROUND!",
    "That was my rent money. Well — it was my beer money. But it was NEXT month's beer money!",
  ],
  woke: [
    "...how long was I down? Don't answer that.",
    "Okay. Okay. I'm up. Nobody saw that. Right? Nobody saw that.",
    "I've been hit harder. Not recently. But I have.",
  ],
  greet_run: [
    "Back again? It's Tuesday somewhere.",
    "Look who the week spat back up.",
    "You know what they say. Nothing sticks in Hopewell. Especially you.",
    "Heard they let you go. They always let you go. This town's catch-and-release, baby.",
    "You look like shit, and I say that with love, and also because it's true.",
  ],
  // Fires only after the job. The town has to know something happened, or the
  // heart the design promises isn't in the build.
  aftermath: [
    "Somebody hit the Game Barn. GARY. Who does that to Gary.",
    "Heard they took the back room. The SEALED stuff. That was his whole retirement, man.",
    "Cops been by twice. Twice! For Gary. They didn't come twice when my truck got took.",
    "You know what the worst part is? He's gonna open tomorrow anyway. He always opens.",
    "Whoever did it — and I'm not saying I know — did NOT think about who they were doing it to.",
  ],
  gary_after: [
    "Back room's empty. Twenty-eight years I sat on that. ...You want a controller? Everything's half off. I don't know why I said that.",
    "They came through the window. The propped one. I knew about the propped one. I just never — you don't think it'll be YOUR window.",
    "Fairview called an hour after. An HOUR. Said they heard I might be ready to sell now. How'd they hear that fast, kid. How.",
  ],
  bev_after: [
    "Something's different about you. Don't tell me. I mean it — don't.",
    "There's a plate in the microwave. There's always a plate. Even the weeks I don't like you.",
  ],
  peanut_after: [
    "Yo. Yo. I did not tell you nothing. We never talked. I don't even know your name, and I've known your name since the SEVENTH GRADE.",
    "Everybody's asking who. Nobody's asking me, 'cause nobody asks me anything. That's the one good part about being me.",
  ],
  hospital_roommate: [
    "You're awake! Great. So like I was saying — it's a pyramid, sure, but it's MY level of the pyramid—",
    "They got me in for the gallbladder. Third time. I keep growing 'em back. Doctors HATE me, and I mean that literally—",
    "You scream in your sleep. Anyway, do you follow the county commissioner race, because buddy—",
    "They took my appendix Tuesday and I feel like they took somethin' ELSE, 'cause I've been real calm about my ex and that ain't me—",
    "I've seen your ass. Gown came loose when they wheeled you in. Wasn't looking. Small room. We're past it. ANYWAY—",
  ],
};

// ---------------------------------------------------------------------------
// THE MINI-SCHEME — The Game Barn Job
// ---------------------------------------------------------------------------

export const SCHEME = {
  id: 'gamebarn97',
  title: 'THE GAME BARN JOB',
  pitch: "A sealed case of '97 FunStation consoles in Gary's back room. Gary's waiting on a price that died with the mall. Fairview's waiting on Gary. Somebody should get paid who actually lives here.",
  stages: [
    { id: 'hear',   label: 'Hear about it',            hint: 'Peanut runs his mouth outside the QwikStop after dark. Free, if you can stand him. Dee charges, but Dee\'s faster.' },
    { id: 'case',   label: 'Case the back alley',      hint: 'Behind the strip. Find the way in that isn\'t a door. Bring your whole ass — the dumpster smells like the fall of Rome.' },
    { id: 'tools',  label: 'Get a crowbar',            hint: 'Mile Hardware sells one, twenty-two bucks. Other, cheaper, stupider arrangements exist.' },
    { id: 'window', label: 'Learn the drop night',     hint: 'When does the store sit there with its ass out? Somebody always knows. Somebody always tells.' },
    { id: 'job',    label: 'Do the job (3 crates)',    hint: 'In through the window. Crates to the beater. One at a time — they weigh what a retirement weighs.' },
    { id: 'fence',  label: 'Fence the haul',           hint: 'Ca$h Kingdom, window 2. Or hold for the Sunday buyer, if your nerve holds and nobody visits your trunk.' },
  ],
};

// `coda(sum)` appends a clause that knows what your week actually was. The epilogue
// should read like YOUR week, not like a screen. sum = {crates, cash, heat, day, stats}.
export const ENDINGS = {
  WALKING: {
    title: 'WALKING',
    art: '🌅',
    text: "The 6 a.m. bus smells like coffee and other people's better decisions. You take a window seat. Nobody chases you. Nobody even looks up. That's the whole trick of this town — it only holds people who stop moving.",
    tag: 'Cashed out clean. He just walked. Nobody even chased him.',
    meta: 'rep',
    coda: (s) =>
      s.cash >= 400 ? "You've got more in your jacket than the Wing Barn nets in a week. Somewhere behind you, Gary is opening anyway. He always opens."
      : s.cash >= 150 ? "It isn't a fortune. It's a bus ticket and a month of not asking anybody for anything, which around here is the same thing."
      : "You're leaving with almost nothing, which is still more than you came back with. Barely. Count it again at the next stop.",
  },
  BUSTED: {
    title: 'BUSTED',
    art: '🚔',
    text: "Brill reads you your rights from memory, bored, while somebody you went to middle school with films it vertically. The county DA will drop it by Friday — he always does — but the video's forever.",
    tag: 'Charges evaporate. The footage doesn’t. +CRED',
    meta: 'cred',
    coda: (s) =>
      s.crates > 0 ? "They found the crates in the beater. Sealed, 1997, still shrink-wrapped. The evidence photo is going to be the single best-lit picture ever taken of your car."
      : s.heat >= 85 ? "Both cars came. BOTH of them. Tapp looked thrilled. Brill looked like a man who had been eating a sandwich."
      : "You weren't even doing anything right then. That's the part that'll bother you — not the cuffs, the timing.",
  },
  BODIED: {
    title: 'BODIED',
    art: '🏥',
    text: "County hospital, curtain bed 2. Your roommate has been talking since before you woke up and possibly since before you were admitted. The doctor signing your discharge golfs with the officer who scraped you off the lot. Small town. Everything's connected. Mostly at the elbow.",
    tag: 'The bone sets. The story stays. +SCARS',
    meta: 'scars',
    coda: (s) =>
      s.debtOpen ? "Reggie signed the visitor log. Under 'relationship to patient' he wrote 'business.' He also left a card. The debt's square, at least."
      : s.stats.koGiven >= 3 ? `You put ${s.stats.koGiven} people down this week and the parking lot still won. It's undefeated. It's been undefeated since 1974.`
      : "You don't remember the last ten seconds of it. Everyone else in that lot does, and by Thursday they'll each remember it differently and better.",
  },
  STUCK: {
    title: 'STUCK',
    art: '🕒',
    text: "Sunday night. The week just… ended.",
    tag: 'The week cost more than it paid. +LESSONS',
    meta: 'lessons',
    coda: (s) =>
      s.crates > 0 ? "You made the money on Thursday. The bus runs every single morning after that. You know exactly how many mornings that was, and so does everybody who watched you not get on it."
      : "No cuffs, no casts, no cash. You watched the drop night come and go from a parking lot you know better than your own face. Nothing happened. That's the worst one.",
  },
};

// ── THE SUN ───────────────────────────────────────────────────────────────────
// ONE table drives the look of all six districts: the ambient wash, the world
// grade, and — the part that actually sells time of day — the direction and
// LENGTH of every shadow in the game. Long and west at breakfast, short and hard
// at noon, long and east at supper, gone by dark.
// ⚠️ index 4 is the Rip bonus block: deeper night than LATE, deliberately.
export const SKY = [
  { key: 'morning',   amb: 'rgba(150,95,40,0.06)',  sun: [-1.0, 0.34], len: 2.1, soft: 0.30,
    grade: 'rgba(255,190,120,0.05)', shadow: 0.30 },
  { key: 'afternoon', amb: 'rgba(0,0,0,0.02)',      sun: [0.18, 0.42], len: 0.85, soft: 0.16,
    grade: 'rgba(255,245,225,0.02)', shadow: 0.36 },
  { key: 'evening',   amb: 'rgba(70,40,90,0.24)',   sun: [1.15, 0.30], len: 2.4, soft: 0.42,
    grade: 'rgba(255,140,80,0.07)', shadow: 0.26 },
  { key: 'late',      amb: 'rgba(8,13,34,0.60)',    sun: [0.25, 0.20], len: 0.6, soft: 0.55,
    grade: 'rgba(70,110,190,0.06)', shadow: 0.34 },
  { key: 'bonus',     amb: 'rgba(5,9,26,0.68)',     sun: [0.25, 0.18], len: 0.5, soft: 0.6,
    grade: 'rgba(60,95,175,0.07)', shadow: 0.34 },
];

export const BLOCK_NAMES = ['MORNING', 'AFTERNOON', 'EVENING', 'LATE'];
export const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
export const WEATHER_KINDS = ['clear', 'overcast', 'rain', 'heatwave'];

// Register minigame content — the Wing Barn menu
export const MENU = [
  { item: 'Barnstormer 8pc',   price: 8.99 },
  { item: 'Barnstormer 20pc (feeds 4, serves 1)', price: 17.49 },
  { item: 'Rip-Glazed Tenders',price: 6.79 },
  { item: 'Barn Fries (bottom-of-bag guarantee)', price: 3.29 },
  { item: 'Ranch (mandatory)', price: 0.60 },
  { item: 'Flat Fountain Drink', price: 2.19 },
  { item: 'Coleslaw Nobody Wanted', price: 1.99 },
  { item: 'The Loyalty Combo', price: 11.99 },
  { item: 'The Divorce Special (double everything)', price: 14.49 },
];

export const RIP = {
  name: 'Rip',
  desc: 'Gas-station energy sludge. Technically legal. The can is screaming.',
  flavor: ['ORIGINAL SCREAM', 'BLUE JUDGMENT', 'UNSUPERVISED MANGO'],
};
