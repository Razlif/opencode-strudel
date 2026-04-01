# Harmony

## 1. Waltz Harmony From One Progression

One progression drives three roles: low root support, mid string bed, and a light upper motion layer.

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

Low carries root motion, the middle layer carries the waltz harmony body, and the high layer adds a small amount of melodic lift.

## 2. Techno Shared-Source Harmony

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

The kick and hats define the groove, while one harmonic source drives the bass foundation, pad body, and synth motion.
