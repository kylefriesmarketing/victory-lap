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
  bottle: { dmg: [12, 17], range: 38, dur: 2,  kb: 170, throwable: true, label: 'a bottle' },
  chair:  { dmg: [15, 22], range: 46, dur: 5,  kb: 240, label: 'a folding chair' },
  cue:    { dmg: [13, 19], range: 56, dur: 4,  kb: 190, label: 'a pool cue' },
  sign:   { dmg: [11, 16], range: 44, dur: 6,  kb: 200, label: 'a DAYBREAK COMMONS sign' },
  crowbar:{ dmg: [16, 22], range: 42, dur: 30, kb: 210, label: 'the crowbar' },
};

export const WORLD = { w: 2200, h: 1500 };

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
  { kind: 'hydrant',  x: 700, y: 505 },
  { kind: 'bench',    x: 1130, y: 1058, w: 60, h: 22 },
  { kind: 'cone',     x: 820, y: 760 }, { kind: 'cone', x: 855, y: 792 },
];

export const GARAGE = { x: 300, y: 1150, w: 220, h: 180, door: { x: 395, y: 1150 } };

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
};

// ambient population per block: [count, archetype pool, outfit pool, where]
export const POPULATION = {
  morning:  [ { n: 3, spots: 'bus',   outfits: ['hivis','greasy','denim'] },
              { n: 2, spots: 'qwik',  outfits: ['denim','flannel'] },
              { n: 2, spots: 'walk',  outfits: ['denim','camo'] } ],
  afternoon:[ { n: 4, spots: 'walk',  outfits: ['denim','flannel','camo'] },
              { n: 2, spots: 'buffet',outfits: ['greasy','denim'] },
              { n: 1, spots: 'walk',  outfits: ['tourist'] } ],
  evening:  [ { n: 3, spots: 'lot',   outfits: ['flannel','denim','camo'] },
              { n: 2, spots: 'buffet',outfits: ['denim','hivis'] },
              { n: 2, spots: 'qwik',  outfits: ['flannel','greasy'] },
              { n: 1, spots: 'walk',  outfits: ['tourist2'] } ],
  late:     [ { n: 3, spots: 'lot',   outfits: ['flannel','camo','greasy'], drunk: 0.6 },
              { n: 2, spots: 'qwik',  outfits: ['denim','greasy'], drunk: 0.3 } ],
};

export const SPOTS = {
  bus:   [ [1000, 1100], [1050, 1110], [960, 1095], [1110, 1105] ],
  qwik:  [ [240, 620], [300, 660], [180, 680], [340, 700] ],
  walk:  [ [520, 505], [900, 508], [1300, 505], [1750, 508], [600, 1058], [1400, 1060] ],
  buffet:[ [920, 560], [980, 590], [1040, 555] ],
  lot:   [ [900, 780], [1000, 820], [1100, 760], [960, 860], [1180, 810] ],
};

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
    "There he is. You know I know your face, right?",
    "Mm. Keeping a little list today, bud.",
  ],
  cop_named: [
    "Hey! Heyyy. Tell Bev I said hi. I WILL be mentioning this to her.",
    "You again. I'm not chasing you, man, I'm telling your grandmother.",
    "Saw your little show earlier. Bev raise you like that? She did not.",
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
  ],
  roxy: [
    "Window one: checks, loans. Window two: 'goods.' Pick a window, this glass ain't got all day.",
    "Twenty percent a week. It's not a trick, sweetheart, it's just math you're gonna hate later.",
    "I've been robbed twice and proposed to four times through this glass. All six, same damn energy.",
    "Everybody's got a story about why they're short. I got a drawer full of 'em and none of 'em spend.",
  ],
  roxy_fence: [
    "Where'd these come from? Don't answer. That was a test and you passed.",
    "Seventy a crate. That's the number keeps us both out of a courtroom.",
  ],
  earl: [
    "Everything must go. Including me. ESPECIALLY me.",
    "Crowbar's twenty-two. You want a receipt, or is this a no-receipt kind of purchase?",
    "Forty-one years my family had this place. Ends with me. No kids, and the ones I got sense enough not to saddle with it.",
  ],
  wanda: [
    "Buffet's nine dollars. Plate rules: what fits, fits. No towers. I have SEEN towers.",
    "Third name was the best name. 'Lucky Dragon Palace.' The fire disagreed.",
    "Health inspector's a nephew of mine. Don't make that face, everybody's a nephew of somebody here.",
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
    { id: 'hear',   label: 'Hear about it',            hint: 'Peanut holds court outside the QwikStop, evenings and late.' },
    { id: 'case',   label: 'Case the back alley',      hint: 'Behind the strip. Find the way in that isn’t a door.' },
    { id: 'tools',  label: 'Get a crowbar',            hint: 'Mile Hardware sells one. Other arrangements exist.' },
    { id: 'window', label: 'Learn the drop night',     hint: 'When does the store sit empty? Somebody always knows.' },
    { id: 'job',    label: 'Do the job (3 crates)',    hint: 'In through the window. Crates to the beater. One at a time — they’re heavy.' },
    { id: 'fence',  label: 'Fence the haul',           hint: 'Ca$h Kingdom, window 2. Or hold for the Sunday buyer, if your nerve holds.' },
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

export const BLOCK_NAMES = ['MORNING', 'AFTERNOON', 'EVENING', 'LATE'];
export const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
export const WEATHER_KINDS = ['clear', 'overcast', 'rain', 'heatwave'];

// Register minigame content — the Wing Barn menu
export const MENU = [
  { item: 'Barnstormer 8pc',   price: 8.99 },
  { item: 'Barnstormer 20pc',  price: 17.49 },
  { item: 'Rip-Glazed Tenders',price: 6.79 },
  { item: 'Barn Fries',        price: 3.29 },
  { item: 'Ranch (extra)',     price: 0.60 },
  { item: 'Fountain Drink',    price: 2.19 },
  { item: 'Coleslaw Nobody Wanted', price: 1.99 },
  { item: 'The Loyalty Combo', price: 11.99 },
];

export const RIP = {
  name: 'Rip',
  desc: 'Gas-station energy sludge. Technically legal. The can is screaming.',
  flavor: ['ORIGINAL SCREAM', 'BLUE JUDGMENT', 'UNSUPERVISED MANGO'],
};
