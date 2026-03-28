export const smoke = [
  {
    name: "basic",
    code: `stack(
  s("bd hh sd hh"),
  note("<c4 eb4 g4 bb4>").slow(2).gain(.6)
)`,
    miss: false,
  },
  {
    name: "piano",
    code: `setcps(60 / 60)

let lead = note("<c4 e4 g4 a4 c5 a4 g4 e4>/2")
  .s("piano")
  .attack(0.05)
  .release(0.8)
  .room(0.6)
  .size(0.5)

let chord = note("<[c4,e4,g4] [e4,g4,b4] [g4,a4,c5] [a4,c5,e5]>/4")
  .s("piano")
  .attack(0.1)
  .release(1.2)
  .gain(0.35)
  .room(0.7)
  .size(0.6)

stack(
  chord,
  lead
)`,
    miss: false,
  },
  {
    name: "linndrum",
    code: `stack(
  sound("bd hh sd hh").bank("LinnDrum"),
  note("<c3 g3 bb3 g3>").slow(2).gain(.45)
)`,
    miss: false,
  },
] as const
