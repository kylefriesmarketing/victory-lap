// VICTORY LAP — data.js
// ALL content and tuning. Balance changes go here and only here.
// Pure data module: importable in Node (tests/soak.mjs) and the browser alike.

export const TUNING = {
  blockSeconds: 150,          // wall-clock seconds of free roam per block
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
  shoveForce: 240,
  npcDmg: [9, 16],
  npcAtkCooldown: [0.7, 1.15],
  limpBelowHp: 30,
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
  crateHaggleLose: 10,        // per crate, if it doesn't
  haggleOdds: 0.6,
  holdBuyerMult: 1.5,         // Sunday city buyer
  holdAmbushChance: 0.35,     // per night holding the haul
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

export const WORLD = { w: 2200, h: 1500 };

export const STRIP_Y = { roofTop: 190, facadeTop: 400, base: 480 }; // buildings occupy y 190..480

export const BUILDINGS = [
  { key: 'qwikstop',  label: 'QwikStop',              x: 120,  w: 260, sign: 'QwikStop', signC: '#d94f2a',
    desc: 'Gas, Rip, jerky, and the town’s entire information economy at 1 a.m.' },
  { key: 'hardware',  label: 'Mile Hardware',          x: 440,  w: 220, sign: 'MILE HARDWARE', signC: '#c9b28a',
    desc: 'EVERYTHING MUST GO. The banner predates two presidents.' },
  { key: 'tattoo',    label: 'Stick City Tattoo',      x: 660,  w: 200, sign: 'STICK CITY', signC: '#7e93c4',
    desc: 'Walk-ins welcome. Spelling not guaranteed.' },
  { key: 'buffet',    label: 'Golden Lucky Wok III',   x: 860,  w: 240, sign: 'GOLDEN LUCKY WOK III', signC: '#e0b84a',
    desc: 'Fourth name, second grease fire, same steam table.' },
  { key: 'wingbarn',  label: 'Wing Barn',              x: 1160, w: 260, sign: 'WING BARN', signC: '#e8dcc3',
    desc: 'Home of the Barnstormer 20-piece. You work here, technically.' },
  { key: 'gamebarn',  label: 'Game Barn',              x: 1420, w: 240, sign: 'GAME BARN', signC: '#5b7291',
    desc: 'Buy • Sell • Trade. Gary priced everything for a 1998 that never came back.' },
  { key: 'dead',      label: 'Future Home of DAYBREAK COMMONS', x: 1660, w: 180, sign: 'DAYBREAK COMMONS', signC: '#f4f1ea',
    desc: 'Artisanal mixed-use lifestyle concept. The only clean thing on the street.' },
  { key: 'cashking',  label: 'Ca$h Kingdom',           x: 1840, w: 240, sign: 'CA$H KINGDOM', signC: '#ffd23e',
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

export const OUTFITS = { // [shirt, pants, skin, hat?]  — palette from the art bible
  denim:   { shirt: '#5b7291', pants: '#3d4c63', skins: ['#c99b74','#8a5a33','#e0b490','#6e4a2f'] },
  hivis:   { shirt: '#c9a227', pants: '#4a4a42', skins: ['#c99b74','#8a5a33','#e0b490'] },
  camo:    { shirt: '#4c5741', pants: '#6b5d43', skins: ['#c99b74','#e0b490','#8a5a33'] },
  flannel: { shirt: '#9c3d2e', pants: '#2e3138', skins: ['#e0b490','#c99b74','#6e4a2f'] },
  greasy:  { shirt: '#7a7468', pants: '#3a3a36', skins: ['#c99b74','#8a5a33'] },
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

export const BARKS = {
  townie_idle: [
    "Gas went up again. I'm gonna start walking, watch me.",
    "My cousin got that solar. Roof leaks now. Coincidence? Ask the roof.",
    "I'm not saying the buffet's cursed. I'm saying twice is a pattern.",
    "This town took my twenties and gave me a punch card.",
    "You want a lotto number? Six. Just six. Trust me.",
    "The interstate skipped us on purpose, you know. My grandpa saw the map.",
    "I had a job interview in the city. Car made it halfway. Sign from God, honestly.",
    "Somebody's been feeding that dog gas-station jerky. He's got the eyes of a man now.",
    "New coffee place downtown charges nine dollars. NINE. For milk with an attitude.",
    "I've been quitting smoking since March. Different March.",
  ],
  townie_late: [
    "You ever just stand in a parking lot? Best thing this town does, free of charge.",
    "I'm out here 'cause the house is full of people I'm related to.",
    "Third shift's a state of mind, man. I don't even have a job.",
    "You hear that train? Never stops here. Just yells about it and keeps going.",
    "I saw a UFO over the Works in '19. Nobody cares. That's the real story.",
  ],
  drunk: [
    "I could've played college ball. Coach said I had the ANGER for it.",
    "You know what your problem is? No — wait. I know what MY problem is. Hang on.",
    "I love this parking lot. This lot has never lied to me.",
    "My ex took the truck AND the dog, and honestly? Fair.",
  ],
  tourist: [
    "Honey, look — a real pawn town! It's so authentic I could cry.",
    "Is there a farmers market? Every town has one now, it's the law.",
    "The Zillow said this place was 'up and coming.' Which one is it doing right now?",
  ],
  filming: [
    "Yoooo, it's happening again. World star. WORLD. STAR.",
    "Hold my Rip, I'm getting this vertical.",
    "This is going in the group chat SO fast.",
  ],
  fled: [ "NOPE.", "Not today, I got a probation thing.", "I did NOT see anything and I mean that legally." ],
  hit_react: [ "OW. Okay. OKAY.", "That's assault, baby!", "My guy, I have a TIMESHARE MEETING tomorrow—" ],
  cop_noticed: [
    "There he is. You know I know your face, right?",
    "Mm. Keeping a little list today, bud.",
  ],
  cop_named: [
    "Hey! Heyyy. Tell Bev I said hi. I WILL be mentioning this to her.",
    "You again. I'm not chasing you, man, I'm telling your grandmother.",
    "Saw your little show earlier. Bev raise you like that? She did not.",
  ],
  cop_wanted: [ "STOP— goddammit, I just ate—", "He's running! Why do they always run! I got the knees of a fifty-year-old!" ],
  cop_cuff: [ "Yeah, yep, there it is. You want the good cuffs or the pinchy ones?" ],
  peanut: [
    "Yo. You didn't hear this from me, but Gary's got a whole CASE of FunStation consoles in the back. Sealed. Since NINETY-SEVEN.",
    "Gary does the bank drop Thursday night, nine-ish. Whole store just sits there. Alarm company dropped him in '19 and Marlene never told him. Marlene's petty like that.",
    "That back window over the dumpster? Been propped on a milk crate since the AC broke. Gary thinks the raccoons did it. It was raccoons AND me.",
    "Fairview offered Gary a number for the storefront. He said no. They don't hear no, man. They hear 'later.'",
    "You didn't get NONE of this from me. I'm basically a rumor myself.",
  ],
  dale: [
    "Okay. Team huddle. It's just you. We're a family here, and family shows up at eleven.",
    "The camera's for INSURANCE, not for watching you. But I do also watch you.",
    "Corporate says smile with your VOICE. I don't know either, man, just ring.",
    "You break the streak of my perfect drawer and I will cry in the walk-in again. Don't test me.",
  ],
  gary: [
    "Everything's buy-sell-trade except the back room. Back room's the retirement plan.",
    "Fairview called again. Told 'em the store's not for sale. The town's not for sale. ...Everything IN the store is for sale, obviously, that's a store.",
    "You want the '97 sealed stuff? So does everybody. It goes to auction the year I die, kid. That's the plan. That's the whole plan.",
    "Slow day. Slow year. Slow quarter-century, if I'm honest with you.",
  ],
  bev: [
    "There's a plate in the microwave. I don't want to know.",
    "You came in at three. The dog told me. We don't keep secrets, him and me.",
    "Your mother calls on Sundays. You be here, or so help me you'll wish the cops got you first.",
    "I'm not asking where the money's from. I'm saying the JAR is for rent, and the jar NOTICES.",
  ],
  roxy: [
    "Window one: checks, loans. Window two: 'goods.' Pick a window, this glass ain't got all day.",
    "Twenty percent a week. It's not a trick, sweetheart, it's just math you won't like later.",
    "I've been robbed twice and proposed to four times through this glass. All six, same energy.",
  ],
  roxy_fence: [
    "Where'd these come from? Don't answer. That was a test and you passed.",
    "Seventy a crate. That's the number that keeps us both out of a courtroom.",
  ],
  earl: [
    "Everything must go. Including me. ESPECIALLY me.",
    "Crowbar's twenty-two. You want the receipt or is this a no-receipt kind of purchase?",
  ],
  wanda: [
    "Buffet's nine dollars. Plate rules: what fits, fits. No towers. I've seen towers.",
    "Third name was the best name. 'Lucky Dragon Palace.' The fire didn't think so.",
  ],
  chuck: [
    "LAKE THIS WEEKEND. Boys' trip. Tanner's bringing the speaker. The BIG speaker.",
    "I could still bench two hundred. Cold. Don't make me prove it in a parking lot.",
  ],
  tanner: [
    "Chuck cried in Gatlinburg and I'll never tell a soul. — Why'd I say that. Who are you.",
    "2016 was the best year of my life and I'm CHILL about it. I'm chill.",
  ],
  buster: [ "(Buster is barking at you specifically.)", "(Buster accepts the jerky. A treaty is signed.)", "(Buster's tail says you're famous here.)" ],
  greet_run: [
    "Back again? It's Tuesday somewhere.",
    "Look who the week spat back up.",
    "You know what they say. Nothing sticks in Hopewell. Especially you.",
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

export const ENDINGS = {
  WALKING: {
    title: 'WALKING',
    art: '🌅',
    text: "The 6 a.m. bus smells like coffee and other people's better decisions. You take a window seat. Nobody chases you. Nobody even looks up. That's the whole trick of this town — it only holds people who stop moving.",
    tag: 'Cashed out clean. He just walked. Nobody even chased him.',
    meta: 'rep',
  },
  BUSTED: {
    title: 'BUSTED',
    art: '🚔',
    text: "Cuffed on the curb outside Ca$h Kingdom while somebody you went to middle school with films it vertically. Brill reads you your rights from memory, bored. The county DA will drop it by Friday — he always does — but the video's forever.",
    tag: 'Charges evaporate. The footage doesn’t. +CRED',
    meta: 'cred',
  },
  BODIED: {
    title: 'BODIED',
    art: '🏥',
    text: "County hospital, curtain bed 2. Your roommate has been talking since before you woke up and possibly since before you were admitted. The doctor signing your discharge golfs with the officer who scraped you off the lot. Small town. Everything's connected. Mostly at the elbow.",
    tag: 'The bone sets. The story stays. +SCARS',
    meta: 'scars',
  },
  STUCK: {
    title: 'STUCK',
    art: '🕒',
    text: "Sunday night. The week just… ended. No cuffs, no casts, no cash. You watched the drop night come and go from a parking lot you know better than your own face. Nothing happened. That's the worst one.",
    tag: 'The week cost more than it paid. +LESSONS',
    meta: 'lessons',
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
