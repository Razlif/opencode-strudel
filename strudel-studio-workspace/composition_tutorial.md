# Strudel Studio Composition Tutorial

Goal:
- teach the agent how to compose at a higher level inside Strudel Studio
- keep all work in canonical song format
- use only supported runtime sounds

## Teaching Order

### 1. Canonical Song Shape

Teach the file contract first.

- `song_meta`
- track vars
- section vars
- `final_song = arrange(...)`
- end with `final_song`

The agent must understand:
- tracks hold musical layers
- sections stack tracks
- arrangement places sections in time

### 2. Core Strudel Primitives

Teach the minimum building blocks.

- `s(...)` for samples and drums
- `note(...)` or `n(...)` for pitched material
- `stack(...)` for simultaneous layers
- `cat(...)` for sequence by phrase or cycle
- `arrange(...)` for song form

### 3. Cycle And Rhythm

Teach rhythm before harmony.

- one cycle
- subdivision
- rests `~`
- density
- repeating groove cells

The agent should hear groove as:
- a pattern of placement
- not just a list of hits

Rhythm reference examples:

#### Core DnB pulse

Use this as a simple drum-and-bass backbone.

```js
s("<bd ~ sd ~ ~ bd sd ~>*8")
  .bank("RolandTR909")
  .gain(0.4)
  .room(0.3)
```

#### DnB switch variation

Use this as a short alternate phrase or fill, not the whole groove.

```js
s("<[sd bd]!2>*4")
  .bank("RolandTR909")
  .gain(0.4)
  .room(0.3)
```

#### Core plus top layer

Use one strong core groove, then add one light upper layer only if needed.

```js
let core_dnb = s("<bd ~ sd ~ ~ bd sd ~>*8")
  .bank("RolandTR909")
  .gain(0.4)

let top_dnb = s("rd:3*4")
  .gain(0.5)

stack(core_dnb, top_dnb)
  .room(0.3)
```

Teaching point:
- one groove cell should carry the section
- extra layers should support the cell, not replace it
- rhythm examples should be reusable as section foundations

#### Bossa kick and rim pattern

Use this as a sparse bossa foundation with low-end pulse and repeated rim identity.

```js
let kick_bossa = s("<bd ~ ~ <bd ~>>*2")
  .bank("LinnDrum")
  .gain("<0.36 0.2>")
  .room(0.18)

let rim_bossa = s("<[[~ ~ rim]!5]@15 ~>*2")
  .bank("LinnDrum")
  .gain(0.16)
  .room(0.18)

stack(kick_bossa, rim_bossa)
```

#### Disco kick and offbeat hat

Use this as a simple disco foundation: floor kick plus offbeat hat.

```js
let kick_disco = s("bd!2 [bd*4]!2 bd!4")
  .slow(8)
  .bank("SequentialCircuitsDrumtracks")

let hats_disco = s("~ hh")
  .bank("SequentialCircuitsDrumtracks")

stack(kick_disco, hats_disco)
```

#### Proper swing

Use this when the groove should swing from the pattern itself, not from extra ornament.

```js
setcps(160 / 60 / 4)

s("bd [hh hh] sd hh")
  .swing(2)
```

#### Four on the floor

Use this as a simple house or club foundation: steady kick, clear backbeat, and light hats.

```js
stack(
  s("bd*4").bank("RolandTR909"),
  s("~ sd ~ sd").bank("RolandTR909").gain(0.72),
  s("hh*8").bank("LinnDrum").gain(0.14),
)
```

#### Latin groove

Use this as a core Latin groove with kick, snare, clap pulse, and shaker.

```js
let pulse = s("~ cp ~ ~ cp ~ cp ~")
  .bank("RolandTR808")
  .gain(0.26)

let shaker = s("sh*8")
  .bank("RolandTR808")
  .gain(0.08)

let kick = s("bd ~ [bd bd] ~ [bd ~] ~ bd ~")
  .bank("RolandTR808")
  .gain(0.72)

let snare = s("~ sd [~ sd] [~ sd] [~ sd] [~ sd] ~ sd")
  .bank("RolandTR808")
  .gain(0.42)

stack(
  kick,
  snare,
  pulse,
  shaker,
)
```

#### Techno-house groove

Use this as a steady club groove with strong kick, light clap backbeat, tight hats, and a thin shaker layer.

```js
stack(
  s("bd*4").bank("RolandTR909").gain(0.96),
  s("~ ~ cp ~ ~ ~ cp ~").bank("RolandTR909").gain(0.28),
  s("~ hh ~ hh ~ hh ~ hh").bank("RolandTR909").gain(0.14),
  s("sh*8").bank("RolandTR808").gain(0.06),
)
```

#### Straight quarter-note bass backing

Use this when the bass should hold one note for each 4-bar block while the drums keep a direct rock pulse underneath.

```js
stack(
  s("bd*4").bank("RolandTR909").gain(0.92),
  s("~ sd ~ sd").bank("RolandTR909").gain(0.72),
  s("hh*8").bank("RolandTR909").gain(0.16),

  note("<c2*4 g1*4 a1*4 f1*4>")
    .s("gm_electric_bass_pick")
    .clip(0.95)
    .gain(0.34),
)
```

#### Faster rock bass backing

Use this when the bass should stay straight and supportive while the drums push harder with a faster rock pulse.

```js
setcps(156 / 60 / 4)

stack(
  s("bd ~ bd ~ bd ~ bd ~")
    .bank("SequentialCircuitsDrumtracks")
    .gain(0.88),

  s("~ ~ sd ~ ~ ~ sd ~")
    .bank("SequentialCircuitsDrumtracks")
    .gain(0.62),

  s("hh*8")
    .bank("SequentialCircuitsDrumtracks")
    .gain(0.13),

  note("<c2*4 bb1*4 ab1*4 g1*4>")
    .s("gm_electric_bass_pick")
    .lpf(1600)
    .clip(0.95)
    .gain(0.38),
)
```

#### Bass-led rock groove

Use this when the bass should act as the engine of the groove instead of only holding root notes.

```js
setcps(148 / 60 / 4)

stack(
  s("bd ~ ~ bd bd ~ ~ bd")
    .bank("SequentialCircuitsDrumtracks")
    .gain(0.86),

  s("~ ~ sd ~ ~ ~ sd ~")
    .bank("SequentialCircuitsDrumtracks")
    .gain(0.6),

  s("hh*8")
    .bank("SequentialCircuitsDrumtracks")
    .gain(0.12),

  "<0@3 1 0 1@2 0@2 0*2 [2@9 3@3]@2 0 [0 ~@7]>/8"
    .pickRestart([
      n("<0!3 [2 3] 4*2 4!2 3 5!3 [4 5] 7*2 7!2 6>*2"),
      n("<[0*2 0!2 [2 3]]!2 [4*2 4!2 [3 2]] [5 6 7 8]>"),
    ])
    .scale("e1:minor")
    .s("gm_electric_bass_pick")
    .lpf(1500)
    .clip(0.95)
    .gain(0.38),
)
```

#### Swing jazz trio sketch

Use this when the swing rhythm should support a small jazz bit with bass and piano moving through a cycle of fifths.

```js
setcps(160 / 60 / 4)

let drums_jazz = stack(
  s("bd [hh hh] sd hh")
    .bank("BossDR110")
    .swing(2)
    .gain(0.42),

  s("~ ~ cp ~")
    .bank("BossDR110")
    .swing(2)
    .gain(0.12),
)

let bass_jazz = note("<d2 a1 g1 d1 c2 g1 f1 c1>")
  .s("gm_fretless_bass")
  .lpf(1200)
  .gain(0.28)

let piano_jazz = note("<[d4,f4,a4,c5] ~ [g3,b3,d4,f4] ~ [c4,e4,g4,bb4] ~ [f3,a3,c4,eb4] ~>")
  .s("piano")
  .attack(0.03)
  .release(0.22)
  .gain(0.3)

stack(
  drums_jazz,
  bass_jazz,
  piano_jazz,
).room(0.25)
```

### 4. Runtime-Safe Sound Choice

Teach sound limits early.

- use only supported runtime sounds and banks
- separate drums from pitched instruments
- do not invent helpers
- do not assume unsupported samples

### 5. Section Function

Teach that each section has a job.

- intro
- groove
- lift
- peak
- breakdown
- outro

Changes between sections should reflect function, not randomness.

### 6. Track Roles

Teach role-based writing.

- kick / snare / hats
- bass / root support
- harmony bed
- upper motion
- melody / answer line

Each track should have one clear musical role.

### 7. Register

Teach vertical separation.

- low = root / weight
- mid = harmony body
- high = color / lead

Register is part of composition, not decoration.

### 8. Harmony Basics

Teach harmony as a source.

- progression
- root motion
- chord tones
- anchor
- voicing

The agent should learn to define one harmonic source before layering.

Runtime note:
- if symbolic chord names do not voice reliably, use explicit chord-note patterns instead
- prefer a real note source such as `"<[c4,eb4,g4] [ab3,c4,eb4]>/4"` over unsupported chord labels
- keep the composition method the same even when the harmony source must be explicit
- do not pass explicit voiced-note patterns back through `.chord(...).voicing()`
- pick one lane:
  - chord-symbol lane with `.chord(...).voicing()`
  - explicit-note lane with direct `note(...)`

Harmony reference examples:

#### Waltz harmony from one progression

One progression drives low root support, a mid string bed, and a light upper motion layer.

```js
let low_1 = note("<g2 e2 a2 g2>/4")
  .s("gm_accordion")
  .lpf(2400)
  .attack(0.08)
  .release(0.22)
  .room(0.8)
  .cpm(64)
  .gain(0.18)

let bed_1 = note("<[a3,c4,e4] [e3,g3,b3] [f3,a3,c4] [g3,b3,d4]>/4")
  .s("gm_string_ensemble_1")
  .lpf(3000)
  .attack(0.12)
  .release(0.35)
  .room(1.2)
  .cpm(64)
  .gain(0.42)

let high_1 = note("<~ a4 g4 ~ g4 e4>/4")
  .s("gm_oboe")
  .lpf(3400)
  .attack(0.1)
  .release(0.16)
  .room(0.9)
  .cpm(64)
  .gain(0.14)

stack(low_1, bed_1, high_1)
```

#### Techno shared-source harmony

One progression drives bass, pad, and synth roles while the drums stay simple and repetitive.

```js
let prog_techno = "<Cm Ab>/4"
let groove_techno = "bd*4"
let motif_techno = "<0 ~ [1 0] ~>/4"

let kick_techno = s(groove_techno)
  .bank("RolandTR909")
  .gain(0.65)

let hats_techno = s("[~ hh] ~ [~ hh] ~")
  .bank("RolandTR909")
  .gain(0.14)

let bass_techno = n("0 ~ 0 ~")
  .chord(prog_techno)
  .anchor("c2")
  .mode("root")
  .voicing()
  .s("gm_synth_bass_1")
  .gain(0.28)

let pad_techno = n("0")
  .chord(prog_techno)
  .anchor("g4")
  .voicing()
  .s("gm_pad_warm")
  .attack(0.2)
  .release(0.45)
  .gain(0.18)

let synth_techno = n(motif_techno)
  .chord(prog_techno)
  .anchor("c5")
  .voicing()
  .s("gm_lead_2_sawtooth")
  .gain(0.14)

stack(
  kick_techno,
  hats_techno,
  bass_techno,
  pad_techno,
  synth_techno,
)
```

### 9. Motif Basics

Teach motif before full melody.

- one small rhythmic or melodic idea
- repeat
- vary
- answer

The agent should avoid inventing every layer independently.

Melody reference examples:

#### Oboe legato line with inner turns

Long melodic line with mostly sustained phrasing and a few quick inner-note turns.

```js
let melody_1 = n("<[0@3 1@2.5 [2 1]@0.5 2@2 3@4] [4@2 3@1.5 [2 3]@0.5 2@2 1@2 0@4] [2@3 1@2.5 [0 1]@0.5 0@6]!2>/4")
  .scale("d4:minor")
  .s("gm_oboe")
  .lpf(3600)
  .clip(1)
  .attack(0.08)
  .release(0.14)
  .room(1.1)
  .cpm(64)
  .gain(0.5)
```

#### Clarinet legato line with inner turns

Long melodic line with a more dance-like contour and small ornamental turns.

```js
let melody_2 = n("<[0@2 2@1.5 [3 2]@0.5 3@2 2@2 1@2 0@2] [3@2.5 [4 3]@0.5 4@1 3@2 2@2 1@2 0@2] [2@2 1@1.5 [-1 0]@0.5 -1@2 0@6]!2>/4")
  .scale("g4:minor")
  .s("gm_clarinet")
  .lpf(3400)
  .clip(1)
  .attack(0.06)
  .release(0.12)
  .room(1.0)
  .cpm(64)
  .gain(0.52)
```

### 10. Shared-Source Composition

Teach the main higher-level method last.

Define one source idea, then derive roles from it.

Examples of source ideas:
- progression
- groove cell
- motif

Examples of derived roles:
- root support
- harmony bed
- upper motion
- melody
- drum foundation
- percussion detail

Core rule:
- prefer several coherent role tracks derived from one source idea over unrelated independent layers

### 11. Bass-Led Composition

Teach that the bass can be the engine of a section.

- keep one stable bass rhythm
- vary pitch phrases under that rhythm
- let bass carry pulse and harmonic implication
- keep other layers lighter than the bass engine

This is useful when the section should feel driven without thick chord writing.

Example:

```js
let bass = "<0@3 1 0 1@2 0@2 0*2 [2@9 3@3]@2 0 [0 ~@7]>/8"
  .pickRestart([
    n("<0!3 [2 3] 4*2 4!2 3 5!3 [4 5] 7*2 7!2 6>*2"),
    n("<[0*2 0!2 [2 3]]!2 [4*2 4!2 [3 2]] [5 6 7 8]>"),
    n("<[~ 0 4!2]!2 [~ 0 3!2] [~ -1 2!2] [0!2 5!2]>*2"),
  ])
  .scale("c2:minor")
  .s("gm_synth_bass_1")
  .lpf(700)
  .clip(0.95)
  .gain(0.34)
```

Teaching point:
- stable rhythm plus changing pitch family creates motion without losing identity
- this works well for synth-driven, post-punk, and minimal groove sections

### 12. Moving-Anchor Voicing

Teach that harmony can sing by moving the anchor.

- keep one chord stream
- move the anchor over time
- let the voicing follow that moving top shape
- keep bass simple under it

This is useful when block chords feel static but a full rewritten melody is unnecessary.

Example:

```js
let bed = note("<[a3,c4,e4] [f3,a3,c4] [d3,f3,a3] [e3,g#3,b3]>/4")
  .s("gm_drawbar_organ")
  .clip(1)
  .gain(0.24)

let color = note("<[e5,a5,c6] [c5,f5,a5] [d5,f5,a5] [b4,e5,g#5]>/4")
  .s("gm_violin")
  .clip(1)
  .gain(0.16)

let bass = note("<a2 f2 d2 e2>/4")
  .struct("x*2")
  .s("gm_electric_bass_finger")
  .clip(1)
  .gain(0.26)

stack(bed, color, bass)
```

Teaching point:
- moving the anchor gives harmony a shaped top line
- this sits between static block chords and a separate written melody

### 13. Shared State Selection

Teach that one slow selector can switch several roles together.

- use one control pattern to choose harmonic state
- let piano, bass, and lead follow the same state change
- this creates large-form contrast with very little code

### 14. Activation-Window Arranging

Teach that parts can have long active and inactive windows.

- keep the main harmonic sequence explicit
- use long selector windows to decide when a role is active
- use `pickRestart(...)` for phrase families inside a role, not for the core chord timeline
- this creates structure without rewriting every loop

## Canonical Mapping

In canonical song files, shared-source composition should map into track roles cleanly.

Example shape:

```js
let track_section_a_low = note("<a2 f2 c2 g2>/4")
  .s("gm_synth_bass_1")

let track_section_a_bed = note("<[a3,c4,e4] [f3,a3,c4] [c4,e4,g4] [g3,b3,d4]>/4")
  .s("gm_pad_warm")

let track_section_a_high = note("<e5 ~ d5 ~ c5 ~ b4 ~>/4")
  .s("gm_oboe")

let section_section_a = stack(
  track_section_a_low,
  track_section_a_bed,
  track_section_a_high,
)
```

This is the target pattern:
- one source
- clear roles
- clean canonical mapping

## Composition Rules

- rhythm first, then harmony, then color
- write from roles, not from random accumulation
- keep one clear source idea per section when possible
- use supported sounds only
- keep the canonical contract stable
