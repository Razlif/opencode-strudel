# Drum Grooves

## 1. Core DnB Pulse

Simple main groove with just the core kick and snare pattern.

```js
setcps(175 / 60 / 4)

s("<bd ~ sd ~ ~ bd sd ~>*8")
  .bank("RolandTR909")
  .gain(0.4)
  .room(0.3)
```
