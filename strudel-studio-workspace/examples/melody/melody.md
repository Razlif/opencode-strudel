# Melody

## 1. Oboe Legato Line With Inner Turns

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

## 2. Clarinet Legato Line With Inner Turns

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
