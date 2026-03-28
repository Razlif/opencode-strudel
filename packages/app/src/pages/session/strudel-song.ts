const root = "songs"

export const stub = `// Strudel Studio canonical song file
// Keep marker comments and top-level names stable.

// @song_meta
const song_meta = {
  title: "Music 4 Machines Lite",
  bpm: 135,
  beats_per_cycle: 4,
}

setcps((song_meta.bpm / 60) / song_meta.beats_per_cycle)

// @song_imports
// Shared setup only.

// @song_tracks
// Track naming:
// track_<section>_<role>

let track_verse_drums = stack(
  s("<bd>*4").bank("RolandTR909"),
  s("<- sd>*4").bank("RolandTR909"),
  s("<- cp:3>*4").bank("RolandTR909"),
  s("<- hh>*8").bank("LinnDrum").gain(.2),
  s("<sh>*8").bank("RolandTR808").gain(.25),
)

let track_verse_bass = cat(
  "<c2>*4",
  "<g1>*4",
  "<eb1>*4",
  "<eb1!2 f1!2>*4",
  "<c2>*4",
  "<g1!2 bb1!2>*4",
  "<eb1>*4",
  "<f1>*4",
).note()
  .s("gm_synth_bass_1")
  .lpf(220)
  .gain(.34)

let track_verse_arpeggio = cat(
  "<c4 eb4 g4 bb4>*8",
  "<g3 bb3 d4 g4>*8",
  "<eb4 g4 bb4 d5>*8",
  "<f4 a4 c5 eb5>*8",
).note()
  .s("gm_pad_poly")
  .decay(.95)
  .lpf(5000)
  .delay(".3:.225:.45")
  .room(.8)
  .rsize(2)
  .gain(.22)

let track_verse_synth_bass = cat(
  "<c3 c4 - c3 c4 - c3 ->*8",
  "<g2 g3 - g2 g3 - g2 ->*8",
  "<eb2 eb3 - eb2 eb3 - eb2 ->*8",
  "<eb2 eb3 - eb2 eb3 - f2 ->*8",
  "<c3 c4 - c3 c4 - c3 ->*8",
  "<g2 g3 - g2 g3 - bb2 ->*8",
  "<eb2 eb3 - eb2 eb3 - eb2 ->*8",
  "<f2 f3 - f2 f3 - f2 ->*8",
).note()
  .s("gm_synth_bass_1")
  .attack(.1)
  .decay(.25)
  .release(.25)
  .lpf(2250)
  .gain(.28)

let track_verse_lead = cat(
  "<- - eb5 - - d5 - bb4>*8",
  "<- - bb4 - - a4 - g4>*8",
  "<- - g4 - - f4 - g4>*8",
  "<- - g4 - - f4 - g4>*8",
  "<- - eb5 - - d5 - bb4>*8",
  "<- - bb4 - bb4 c5 - g4>*8",
  "<- - g4 - - f4 - g4>*8",
  "<- - g4 - - a4 - a4>*8",
).note()
  .s("gm_pad_metallic")
  .decay(.95)
  .delay(".3:.225:.45")
  .room(.4)
  .rsize(2)
  .gain(.32)

let track_chorus_drums = stack(
  s("<bd>*4").bank("RolandTR909").gain(1.05),
  s("<- sd>*4").bank("RolandTR909").gain(1.05),
  s("<- cp:3>*4").bank("RolandTR909").gain(1.05),
  s("<- hh>*8").bank("LinnDrum").gain(.24),
  s("<sh>*8").bank("RolandTR808").gain(.3),
)

let track_chorus_bass = cat(
  "<c2>*4",
  "<g1>*4",
  "<eb1>*4",
  "<eb1!2 f1!2>*4",
  "<c2>*4",
  "<g1!2 bb1!2>*4",
  "<eb1>*4",
  "<f1>*4",
).note()
  .s("gm_synth_bass_1")
  .lpf(240)
  .gain(.42)

let track_chorus_arpeggio = cat(
  "<c4 eb4 g4 bb4>*8",
  "<g3 bb3 d4 g4>*8",
  "<eb4 g4 bb4 d5>*8",
  "<f4 a4 c5 eb5>*8",
).note()
  .s("gm_pad_poly")
  .decay(.95)
  .lpf(5200)
  .delay(".3:.225:.45")
  .room(.8)
  .rsize(2)
  .gain(.3)

let track_chorus_synth_bass = cat(
  "<c3 c4 - c3 c4 - c3 ->*8",
  "<g2 g3 - g2 g3 - g2 ->*8",
  "<eb2 eb3 - eb2 eb3 - eb2 ->*8",
  "<eb2 eb3 - eb2 eb3 - f2 ->*8",
  "<c3 c4 - c3 c4 - c3 ->*8",
  "<g2 g3 - g2 g3 - bb2 ->*8",
  "<eb2 eb3 - eb2 eb3 - eb2 ->*8",
  "<f2 f3 - f2 f3 - f2 ->*8",
).note()
  .s("gm_synth_bass_1")
  .attack(.1)
  .decay(.25)
  .release(.25)
  .lpf(2400)
  .gain(.34)

let track_chorus_lead = cat(
  "<- - eb5 - - d5 - bb4>*8",
  "<- - bb4 - - a4 - g4>*8",
  "<- - g4 - - f4 - g4>*8",
  "<- - g4 - - f4 - g4>*8",
  "<- - eb5 - - d5 - bb4>*8",
  "<- - bb4 - bb4 c5 - g4>*8",
  "<- - g4 - - f4 - g4>*8",
  "<- - g4 - - a4 - a4>*8",
).note()
  .s("gm_pad_metallic")
  .decay(.95)
  .delay(".3:.225:.45")
  .room(.4)
  .rsize(2)
  .gain(.48)

// @song_sections
// Section naming:
// section_<name>
// Each section must stack track vars only.

let section_verse = stack(
  track_verse_drums,
  track_verse_bass,
  track_verse_arpeggio,
  track_verse_synth_bass,
  track_verse_lead,
)

let section_chorus = stack(
  track_chorus_drums,
  track_chorus_bass,
  track_chorus_arpeggio,
  track_chorus_synth_bass,
  track_chorus_lead,
)

// @song_arrangement
// Final arrangement naming:
// final_song
// Only section vars belong here.

let final_song = arrange(
  [8, section_verse],
  [8, section_chorus],
)

final_song
`

export const song = (id: string) => `${root}/${id}.js`
export const tab = (id: string) => `file://${song(id)}`

export const boot = (src?: string) => (src ? undefined : stub)
