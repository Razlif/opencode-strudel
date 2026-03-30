# Drums

This file is the rhythm gateway for Strudel Studio.

Use drum examples to learn:

- pulse
- subdivision
- syncopation
- groove density
- layer entry
- bank character
- style identity

## House Style

- Use mini-notation inside `s("...")`.
- Use `stack(...)` to combine drum layers.
- Treat one cycle as one bar unless the example says otherwise.
- Write short, clear examples that teach one groove idea at a time.

## Straight Pulse

Four-on-the-floor is the simplest way to establish a stable dance grid.

```js
stack(
  s("bd*4").bank("RolandTR909"),
  s("~ sd ~ sd").bank("RolandTR909").gain(.72),
  s("hh*8").bank("LinnDrum").gain(.14),
)
```

What it teaches:

- kick on all four beats
- snare on beats 2 and 4
- even eighth-note hat motion

## Offbeat Hats

An offbeat hat changes feel without changing the kick and snare skeleton.

```js
stack(
  s("bd*4").bank("RolandTR909"),
  s("~ sd ~ sd").bank("RolandTR909").gain(.72),
  s("~ hh ~ hh ~ hh ~ hh").bank("LinnDrum").gain(.16),
)
```

What it teaches:

- the groove stays grounded
- the hat layer creates lift and forward motion

## Syncopated Kick Shape

Change the kick pattern to make the groove feel less square.

```js
stack(
  s("bd [bd bd] ~ bd").bank("RolandTR909"),
  s("~ sd ~ [cp sd]").bank("RolandTR909").gain(.74),
  s("hh*8").bank("LinnDrum").gain(.14),
)
```

What it teaches:

- kick variation changes groove identity quickly
- clap and snare can share the backbeat role

## Subdivision With Brackets

Use `[]` when one part of the bar needs tighter internal subdivision.

```js
stack(
  s("bd*4").bank("RolandTR909"),
  s("~ sd ~ sd").bank("RolandTR909").gain(.72),
  s("[hh hh] hh [hh hh] [hh hh hh] [~ hh] hh [hh hh] [hh oh]").bank("LinnDrum").gain(.12),
)
```

What it teaches:

- local subdivision inside one drum layer
- denser motion without rewriting the whole groove

## Swing Feel



## Bossa Nova

Bossa nova works best as a precise straight groove with separate roles implying the pulse.

```js
let pulse = s("~ cp ~ ~ cp ~ cp ~")
  .bank("RolandTR808")
  .gain(.26)

let shaker = s("sh*8")
  .bank("RolandTR808")
  .gain(.08)

let kick = s("bd ~ [bd bd] ~ [bd ~] ~ bd ~")
  .bank("RolandTR808")
  .gain(.72)

let snare = s("~ sd [~ sd] [~ sd] [~ sd] [~ sd] ~ sd")
  .bank("RolandTR808")
  .gain(.42)

stack(
  kick,
  snare,
  pulse,
  shaker,
)
```

What it teaches:

- the groove is straight, not swung
- a short pulse layer can imply the clave-like motion
- kick and snare do not have to copy the pulse exactly
- shaker can hold the steady subdivision while the other layers shape the groove

## Disco Pulse

Disco drums should feel bright, even, and propulsive.

```js
stack(
  s("bd*4").bank("LinnDrum").gain(.88),
  s("~ cp ~ cp").bank("LinnDrum").gain(.42),
  s("oh*4").bank("LinnDrum").gain(.14),
  s("sh*8").bank("RolandTR808").gain(.08),
)
```

What it teaches:

- consistent pulse
- bright clap body
- open hats for lift

## House Groove

House stays grounded and repetitive, but the upper layers should keep it moving.

```js
stack(
  s("bd*4").bank("RolandTR909").gain(.96),
  s("~ ~ cp ~ ~ ~ cp ~").bank("RolandTR909").gain(.28),
  s("~ hh ~ hh ~ hh ~ hh").bank("RolandTR909").gain(.14),
  s("sh*8").bank("RolandTR808").gain(.06),
)
```

What it teaches:

- stable floor-kick body
- lighter upper motion
- groove from repetition plus small lift details

## Electro Machine Funk

Electro should feel dry, punchy, and a little robotic.

```js
stack(
  s("bd ~ [bd bd] ~").bank("BossDR110").gain(.84),
  s("~ cp ~ sd").bank("BossDR110").gain(.46),
  s("[hh hh] ~ [hh hh] [~ hh]").bank("BossDR110").gain(.12),
)
```

What it teaches:

- tighter machine character
- short phrases with hard edges
- less wash, more shape


## Drum And Bass 

## gospel blues

## 80'srock and roll

## funk groove

## precussion

## punk rock

## metal

## pop



## Jungle With Break Layers

Jungle becomes richer when drum-machine roles and break layers work together.

```js
samples('github:tidalcycles/dirt-samples/master')
samples('github:yaxu/clean-breaks')
```

## Waltz Pulse (depends on beats in setcps)


## Latin Pop Groove

Latin pop often combines even pulse with asymmetrical upper motion.

```js
stack(
  s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR808").gain(.74),
  s("~ ~ cp ~ ~ ~ cp ~").bank("RolandTR808").gain(.34),
  s("[hh hh] ~ hh [~ hh] [hh hh] ~ hh [~ hh]").bank("LinnDrum").gain(.12),
  s("sh*8").bank("RolandTR808").gain(.08),
)
```

What it teaches:

- pulse plus asymmetry
- shakers and hats can give identity without overcrowding the core

## Synth Pop Groove


## Dry Indie Pulse


## Bank Character

The same pattern can feel very different depending on the bank.

```js
stack(
  s("bd*4").bank("RolandTR808"),
  s("~ sd ~ sd").bank("RolandTR808").gain(.68),
  s("hh*8").bank("RolandTR808").gain(.1),
)
```

```js
stack(
  s("bd*4").bank("RolandTR909"),
  s("~ sd ~ sd").bank("RolandTR909").gain(.72),
  s("hh*8").bank("LinnDrum").gain(.14),
)
```

```js
stack(
  s("bd*4").bank("BossDR110"),
  s("~ sd ~ sd").bank("BossDR110").gain(.6),
  s("hh*8").bank("BossDR110").gain(.08),
)
```

What it teaches:

- bank choice is part of composition
- pattern and sound family shape the groove together

## Section-Based Drum Evolution

Drums do not have to stay fixed. Sections can grow by changing density and entry timing.

Intro:

```js
stack(
  s("bd*4").bank("RolandTR909"),
  s("~ sd ~ sd").bank("RolandTR909").gain(.62),
)
```

Groove:

```js
stack(
  s("bd*4").bank("RolandTR909"),
  s("~ sd ~ [cp sd]").bank("RolandTR909").gain(.74),
  s("~ hh ~ hh ~ hh ~ hh").bank("LinnDrum").gain(.12),
)
```

Lift:

```js
stack(
  s("bd [bd bd] ~ bd").bank("RolandTR909").gain(.96),
  s("~ sd ~ [cp sd]").bank("RolandTR909").gain(.74),
  s("[hh hh] hh [hh hh] [hh hh hh] [~ hh] hh [hh hh] [hh oh]").bank("LinnDrum").gain(.16),
  s("sh*8").bank("RolandTR808").gain(.08),
)
```

What it teaches:

- sections can be defined by drum growth
- the same groove family can evolve across the song
