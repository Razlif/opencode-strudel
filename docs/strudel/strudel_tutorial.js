// Strudel rhythm examples.
// Copy one block at a time into Strudel.

// 1. Straight 4-beat pulse.
// 4 steps over a 4-beat cycle.
// Very stable because the grid and event count line up cleanly.
setcps(120 / 60 / 4)
s("bd hh sd hh")

// ----------------------------------------

// 2. Syncopated 5 over 4.
// 5 step slots over a 4-beat cycle.
// The last kick lands off the expected square grid, so it feels tilted.
setcps(120 / 60 / 4)
s("bd hh [sd [sd sd]] [~ hh]")

// ----------------------------------------

// 3. Swung inner subdivision.
// The rule is: first create a clean pair subdivision, then swing that pair. 
// If the rhythm is already odd, sparse, or irregular, swing has less clear material to “pull.”

setcps(160 / 60 / 4)
s("bd [hh hh] sd hh").swing(2)


// ----------------------------------------

// 4. Tresillo / bossa-like asymmetry.
// So the rule is:
//keep a stable underlying grid
//place accents off the main beat
//use rests before hits to create syncopation
//repeat that push-pull shape consistently enough that it feels intentional, not random
setcps(120 / 60 / 6)
s("bd bd [bd bd ] [~ bd] [bd bd] [~ bd] bd bd ")

setcps(100 / 60 / 6)
stack(
  s("bd sd [~ sd] ~ ~ ~ bd sd"),
  s("~ ~ [bd bd] [~ sd] [bd hh] [~ sd] ~ ~")
)

setcps(100 / 60 / 6)
stack(
  s("bd ~ [bd bd] ~ [bd ~] ~ bd ~"),
  s("~ sd [~ sd] [~ sd] [~ sd] [~ sd] ~ sd"),
  s("~ hh ~ [hh hh] ~ hh ~ [~ hh]")
)

// ----------------------------------------

// 5. Denser bossa-like syncopation.
// So the rule is:
//keep a stable underlying grid
//place accents off the main beat
//use rests before hits to create syncopation
//repeat that push-pull shape consistently enough that it feels intentional, not random
setcps(160 / 60 / 8)
s("bd [bd hh] bd [bd sd] [~ hh] [bd hh] [~ sd] [bd hh] [~ sd]")


// ----------------------------------------

// 6. Drum-and-bass style fast grid.
// 8-beat cycle with a busy top level and nested hats.
// The nested groups create micro-movement inside the faster pulse.
setcps(180 / 60 / 4)
s("bd sd [~ bd] sd ")

// ----------------------------------------

// 7. Odd-count tension on a faster grid.
// The grid is 8, but the phrase energy pulls unevenly because of rest placement and grouped hits.
// This works because the mismatch is interesting, but not too far gone.
setcps(170 / 60 / 8)
s("bd [hh hh] sd ~ [hh hh hh] bd ~ sd")

// ----------------------------------------

// 8. Nested trippy subdivision.
// One large step contains smaller clocks inside it.
// This is not just "more notes" - it is hierarchy: beat, sub-beat, sub-sub-beat.
setcps(160 / 60 / 8)
s("bd [hh [sd hh] hh] ~ sd [hh [hh sd]]")

// ----------------------------------------

// 9. Jungle drum-set groove.
// Separate drum roles in a stack:
// - kick line
// - snare line
// - hat line
// - chopped break layers for jungle movement
setcps(172 / 60 / 4)
samples('github:tidalcycles/dirt-samples/master')
samples('github:yaxu/clean-breaks')

let kick = s("bd ~ [bd bd] ~ bd ~ [~ bd] ~")
  .gain(0.9)
  .lpf(900)

let snare = s("~ sd ~ sd [~ sd] ~ ~ sd")
  .gain(0.72)
  .hpf(900)
  .lpf(4200)

let hats = s("[hh hh] hh [hh hh] [hh hh hh] [~ hh] hh [hh hh] [hh oh]")
  .gain(0.34)
  .hpf(5000)

let amen_main = s("amen/4")
  .fit()
  .slice(8, "<0 1 2 [3 4] 5 6 [6 7] 7>*2")
  .cut(1)
  .gain(0.5)
  .lpf(5200)

let amen_switch = s("amen/4")
  .fit()
  .slice(8, "<0 [1 2] 3 4 [5 6] 7 6 [7 0]>*2")
  .cut(1)
  .gain(0.46)
  .lpf(5600)

let ghost_snare = s("impeach/4")
  .fit()
  .slice(8, "<~ 0 ~ [1 2] ~ 3 ~ [4 5]>*2")
  .cut(1)
  .gain(0.14)
  .hpf(1800)
  .lpf(6800)

let top_shuffle = s("funkydrummer/4")
  .fit()
  .slice(8, "<0 ~ [1 2] 3 4 ~ [5 6] 7>*2")
  .cut(1)
  .gain(0.16)
  .hpf(1500)
  .lpf(7000)

let intro = stack(
  hats,
  amen_main.gain(0.32).hpf(1200)
).swing(2).room(0.05)

let drop = stack(
  kick,
  snare,
  hats,
  amen_main,
  ghost_snare,
  top_shuffle
).swing(2).room(0.05)

let switchup = stack(
  kick,
  snare,
  hats,
  amen_switch,
  ghost_snare.gain(0.18),
  top_shuffle
).swing(2).room(0.06)

let breakdown = stack(
  snare.gain(0.5),
  hats.gain(0.24),
  ghost_snare.gain(0.2),
  amen_main.gain(0.24).hpf(2000)
).swing(2).room(0.08)

arrange(
  [8, intro],
  [16, drop],
  [8, breakdown],
  [16, switchup],
  [16, drop]
)

// ----------------------------------------

// 10. Bossa arrangement.
setcps(100 / 60 / 6)

let kick_main = s("bd ~ [bd bd] ~ [bd ~] ~ bd ~")
  .gain(0.92)
  .lpf(1100)

let snare_main = s("~ sd [~ sd] [~ sd] [~ sd] [~ sd] ~ sd")
  .gain(0.72)
  .hpf(1200)
  .lpf(5200)

let hats_main = s("~ hh ~ [hh hh] ~ hh ~ [~ hh]")
  .gain(0.28)
  .hpf(6000)

let hats_busy = s("[~ hh] hh [~ hh] [hh hh] [~ hh] hh [~ hh] [~ hh]")
  .gain(0.22)
  .hpf(6500)

let open_hat = s("[oh oh] [oh oh] [oh oh] [oh oh] [oh oh] [oh oh] [oh oh] [oh oh]")
  .gain(0.14)
  .hpf(7000)

let intro = stack(
  kick_main.gain(0.74),
  hats_main.gain(0.18)
).room(0.05)

let groove = stack(
  kick_main,
  snare_main,
  hats_main
).room(0.06)

let lift = stack(
  kick_main,
  snare_main,
  hats_main,
  hats_busy,
  open_hat
).room(0.08)

let breakdown = stack(
  kick_main.gain(0.7),
  snare_main.gain(0.45),
  hats_busy.gain(0.16)
).room(0.1)

arrange(
  [1, groove],
  [1, breakdown],
  [1, groove],
  [1, breakdown],
  [4, lift],
  [1, breakdown],
)
