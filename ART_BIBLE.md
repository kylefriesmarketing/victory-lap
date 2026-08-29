# VICTORY LAP — The Art Bible

**Visual constitution, v1.0 — August 2026.** Every sprite, palette pick, light, particle,
UI element, and camera move gets judged against this document before it ships. This is a
permanent project constraint, not a mood board.

## The one-line target

> A modern, high-detail evolution of grounded caricature — Bully's visual *personality*
> (never its assets) — rendered as a top-down browser town that looks hand-worn, lived-in,
> and mean enough to be funny.

The source brief was written for a 3D co-op title. VICTORY LAP is a top-down single-player
roguelike (per the design doc, which wins all conflicts about *what the game is*). This
bible translates the brief's qualities to this medium. Nothing in the brief that depends on
a 3D camera survives literally; everything about *character, wear, light, and honesty* does.

## What "grounded caricature" means at 56 pixels tall

1. **Silhouette is the whole character.** Top-down 3/4 view, characters ~48–60px. At that
   size there are no pores; there is posture, gait, body shape, and costume. Every body is
   assembled from archetypes — beer belly, broad-back, wiry, average — exaggerated 10–20%
   past real anatomy, never past it into cartoon. Named characters must be identifiable
   with the screen squinted: Dale is a visor and a tucked-in polo; Peanut is a hoodie with
   a person somewhere inside it; Bev is a housecoat with crossed arms; Officer Brill is a
   hat and a belly that arrives before he does.
2. **Expression is behavior, not faces.** Heads track what's interesting. Idle people shift
   weight, lean on walls, check phones, cross arms. Drunks describe sine waves. The injured
   limp. People flinch away from thrown bottles and pull their drink in when you sprint
   past. Comedy = believable bodies pushed slightly past believable limits.
3. **Nobody is conventionally attractive and nobody is a clone.** Palette, body, hat, and
   posture roll independently. Tourist pastels exist only to be wrong against the town.

## The world must communicate its history

Every surface tells you what happened to it. In this medium that means the **ground is a
painting, not a tile grid**: patched asphalt in mismatched grays, oil stains under the
parking spots that get used, faded diagonal lines, gum dots, weeds in the expansion
joints, a worn path cutting the corner everyone cuts. Storefronts carry their whole
biography — the buffet's sign shows the painted-over ghosts of its two previous names; the
hardware store's EVERYTHING MUST GO banner has been up long enough to sun-fade; Wing Barn's
sign has a dead letter after dark ("WI G BARN"). Nothing is placed perfectly. Clutter is
deliberate; navigation stays readable.

**The Fairview rule:** the gentrification conflict is visible in the frame from Phase 1.
The dead storefront wears a crisp, clean, geometric-sans developer board — DAYBREAK
COMMONS — and it is the *only clean thing on the street*. New money reads as an art-style
intrusion: flat colors, perfect kerning, no wear. The town vs. the invasion is a palette
war, and the player should feel it before they can articulate it.

## Light

Cinematic but naturalistic, driven by the four time blocks:

| Block | Grade | Sources |
|---|---|---|
| Morning | low gold slant, long cool shadows | sun, QwikStop canopy still on and embarrassed about it |
| Afternoon | flat, honest, unflattering | sun only — the town at its least romantic |
| Evening | amber sink into violet | neon wakes up, window glow, first headlights |
| Late | blue-black, tungsten pools | streetlamps (one in three dead), neon spill on asphalt, headlight sweeps, the cruiser's light bar |

Rules: never crush to black — hazards, exits, and faces stay readable. Light directs the
eye to objectives without outline glow. Rain doubles every light source as a smeared
vertical reflection in the puddles; that one trick is worth more than any shader.

## Palette (permanent)

Tobacco `#6b4a2f` · worn leather `#8a5a33` · forest green `#2e4632` · dusty tan `#c9b28a`
· oxidized red `#9c3d2e` · faded denim `#5b7291` · amber light `#ffb347` · dirty cream
`#e8dcc3` · moonlight `#7e93c4` · night `#141a2c`. Saturation is *earned*: neon, warning
signage, spilled Rip, tourist clothing, and Fairview's board are the only loud things.

## Forbidden list (from the brief, still binding)

Shiny plastic anything · oversaturated Fortnite color · anime proportions · cute
mobile-game rounding · flat empty modular rooms · heavy cartoon outlines (dark low-alpha
edges only) · identical bodies · photorealism ambitions the medium can't cash · direct
imitation of any copyrighted game's assets, characters, locations, or UI.

## Motion & physics

Weight first. A thrown bottle arcs and shatters; a swung chair has wind-up; a breaking
weapon sheds debris; a shoved drunk stumbles three steps before deciding it's a fight.
Impacts kick the camera a few pixels (configurable, restrained). Characters get visibly
worse through a run — black eyes, limps, and shirt untucks persist to the next morning.
Physics stays readable and reproducible: this is authored slapstick, not a ragdoll casino.

## UI

The HUD is made of Hopewell objects: the clock is a gas-station wall clock, money is a
fold of bills, heat is a police-scanner ticker that talks about you in cop shorthand, the
Scheme is a spiral-notebook page in pen. System fonts styled hard; zero external
dependencies. UI never uses colors the world hasn't earned.

## The Quality-Control Rule (verbatim, permanent)

Before approving any asset, ask:

1. Does it belong specifically in Hopewell?
2. Does it tell a story about the person or place?
3. Is it realistic enough to feel tangible?
4. Is it exaggerated enough to be memorable?
5. Is it readable during chaotic gameplay?
6. Does it support comedy without becoming childish?
7. Does it match the rest of the game?
8. Can it run efficiently (60fps, hundreds of entities, one canvas)?
9. Does it avoid looking like a generic marketplace asset?
10. Does it avoid directly copying another game?

Reject or revise anything that fails more than two.

## Generated art: where it is allowed, and where it is banned (2026-08-29)

A Higgsfield pass added seven printed plates. The rule that made it safe, and that
every future art pass is held to:

**GENERATED RASTER ART MAY NEVER ENTER THE TOWN.** No sprites, no tiles, no portraits,
no props, no interiors, no UI icons. The world is flat vector drawn on canvas from a
fixed palette, and a raster toy dropped into it reads as a ransom note — the styles do
not blend, they fight, and the AI one wins in the worst way. Everything the camera sees
while you are *playing* is painted in code. That is not a budget constraint; it is the
art direction.

**It is allowed only where the camera has already left the town:** the four ending
cards, the title screen, the share image, and the shelf poster. These are printed
matter *about* the game rather than surfaces *in* it, which is why a different medium
is legible there instead of jarring.

**House style for any plate: four-colour screen print / risograph.** Heavy paper grain,
visible halftone, slight ink misregistration, flat shapes and no gradients, and the
permanent palette above quoted as literal hex in the prompt. Screen print is the
*elevated cousin* of flat vector — it is the one raster style that reads as the same
world grown up for one frame. Painterly or photographic plates would not.
Every prompt ends with an explicit no-text clause; the game sets its own type.

**Every plate is optional in both directions.** No `card` field, and a `card` that
404s, both fall back to the emoji. The title plate is layered *above* the original
radial gradient rather than replacing it. An ending screen is the payoff of a whole
run and a title screen is the first thing anyone sees — neither may ever depend on a
file being there.
