const root = "songs"

export const stub = `// Strudel Studio canonical song file
// Keep marker comments and top-level names stable.

// @song_meta
const song_meta = {
  title: "Neon Ritual",
  bpm: 142,
  beats_per_cycle: 4,
}

setcps((song_meta.bpm / 60) / song_meta.beats_per_cycle)

// @song_imports
// Shared setup only.

// @song_tracks
// Track naming:
// track_<section>_<role>

let track_intro_chords_a = note("[c4,eb4,g4,bb4] [g3,bb3,d4,f4] [ab3,c4,eb4,g4] [f3,a3,c4,eb4]")
  .slow(4)
  .s("gm_pad_poly")
  .decay(.96)
  .delay(".3:.225:.45")
  .room(.7)
  .rsize(2)
  .gain(.18)

let track_intro_glass = cat(
  "~ ~ eb5 ~ ~ d5 ~ bb4",
  "~ ~ bb4 ~ c5 ~ g4 ~",
).note()
  .s("gm_pad_metallic")
  .slow(2)
  .decay(.92)
  .delay(".3:.225:.45")
  .room(.35)
  .gain(.18)

let track_intro_air = note("c6 ~ ~ bb5 ~ g5 ~ eb5")
  .s("gm_pad_halo")
  .slow(2)
  .decay(.99)
  .room(.92)
  .gain(.1)

let track_verse_drums_a = stack(
  s("bd*4").bank("RolandTR909").gain(1.05),
  s("~ sd ~ [sd sd]").bank("RolandTR909").gain(.72),
  s("[hh hh] hh [hh hh] [hh hh hh] [~ hh] hh [hh hh] [hh oh]").bank("LinnDrum").gain(.1),
  s("sh*8").bank("RolandTR808").gain(.1),
)

let track_verse_sub_a = note("c2 ~ c2 ~ g1 ~ bb1 ~")
  .s("gm_synth_bass_1")
  .decay(.24)
  .lpf(240)
  .gain(.38)

let track_verse_sub_b = note("c2 eb2 g1 bb1 c2 g1 f1 g1")
  .s("gm_synth_bass_1")
  .attack(.03)
  .decay(.16)
  .release(.1)
  .lpf(900)
  .gain(.24)

let track_verse_chords_a = note("[c4,eb4,g4,bb4] [g3,bb3,d4,f4] [ab3,c4,eb4,g4] [f3,a3,c4,eb4]")
  .slow(4)
  .s("gm_pad_poly")
  .decay(.96)
  .lpf(5000)
  .delay(".3:.225:.45")
  .room(.7)
  .rsize(2)
  .gain(.2)

let track_verse_glass = cat(
  "~ ~ eb5 ~ ~ d5 ~ bb4",
  "~ ~ bb4 ~ ~ a4 ~ g4",
).note()
  .s("gm_pad_metallic")
  .slow(2)
  .decay(.92)
  .delay(".3:.225:.45")
  .room(.4)
  .gain(.24)

let track_lift_drums_b = stack(
  s("bd [bd bd] ~ bd").bank("RolandTR909").gain(1.08),
  s("~ sd ~ [cp sd]").bank("RolandTR909").gain(.74),
  s("[hh hh] hh [hh hh] [hh hh hh] [~ hh] hh [hh hh] [hh oh]").bank("LinnDrum").gain(.2),
  s("sh*8").bank("RolandTR808").gain(.12),
)

let track_lift_sub_a = note("c2 ~ c2 ~ g1 ~ bb1 ~")
  .s("gm_synth_bass_1")
  .decay(.24)
  .lpf(260)
  .gain(.42)

let track_lift_sub_b = note("c2 eb2 g1 bb1 c2 g1 f1 g1")
  .s("gm_synth_bass_1")
  .attack(.03)
  .decay(.16)
  .release(.1)
  .lpf(900)
  .gain(.28)

let track_lift_chords_a = note("[c4,eb4,g4,bb4] [g3,bb3,d4,f4] [ab3,c4,eb4,g4] [f3,a3,c4,eb4]")
  .slow(4)
  .s("gm_pad_poly")
  .decay(.96)
  .lpf(5000)
  .delay(".3:.225:.45")
  .room(.7)
  .rsize(2)
  .gain(.24)

let track_lift_chords_b = note("[eb4,g4,bb4,d5] [f4,ab4,c5,eb5] [g4,bb4,d5,f5] [bb3,d4,f4,ab4]")
  .slow(4)
  .s("gm_pad_warm")
  .decay(.98)
  .delay(".3:.18:.4")
  .room(.82)
  .rsize(2)
  .gain(.14)

let track_lift_glass = cat(
  "~ ~ eb5 ~ ~ d5 ~ bb4",
  "~ ~ bb4 ~ c5 ~ g4 ~",
).note()
  .s("gm_pad_metallic")
  .slow(2)
  .decay(.92)
  .delay(".3:.225:.45")
  .room(.35)
  .gain(.28)

let track_lift_arp = note("g4 bb4 c5 eb5 g5 eb5 c5 bb4")
  .s("gm_lead_1_square")
  .slow(2)
  .attack(.01)
  .decay(.18)
  .release(.12)
  .gain(.16)

let track_chorus_drums_b = stack(
  s("bd [bd bd] ~ bd").bank("RolandTR909").gain(1.08),
  s("~ sd ~ [cp sd]").bank("RolandTR909").gain(.74),
  s("[hh hh] hh [hh hh] [hh hh hh] [~ hh] hh [hh hh] [hh oh]").bank("LinnDrum").gain(.2),
  s("sh*8").bank("RolandTR808").gain(.12),
)

let track_chorus_sub_a = note("c2 ~ c2 ~ g1 ~ bb1 ~")
  .s("gm_synth_bass_1")
  .decay(.24)
  .lpf(260)
  .gain(.44)

let track_chorus_sub_b = note("c2 eb2 g1 bb1 c2 g1 f1 g1")
  .s("gm_synth_bass_1")
  .attack(.03)
  .decay(.16)
  .release(.1)
  .lpf(900)
  .gain(.3)

let track_chorus_chords_a = note("[c4,eb4,g4,bb4] [g3,bb3,d4,f4] [ab3,c4,eb4,g4] [f3,a3,c4,eb4]")
  .slow(4)
  .s("gm_pad_poly")
  .decay(.96)
  .lpf(5000)
  .delay(".3:.225:.45")
  .room(.7)
  .rsize(2)
  .gain(.24)

let track_chorus_chords_b = note("[eb4,g4,bb4,d5] [f4,ab4,c5,eb5] [g4,bb4,d5,f5] [bb3,d4,f4,ab4]")
  .slow(4)
  .s("gm_pad_warm")
  .decay(.98)
  .delay(".3:.18:.4")
  .room(.82)
  .rsize(2)
  .gain(.18)

let track_chorus_glass = cat(
  "~ ~ eb5 ~ ~ d5 ~ bb4",
  "~ ~ bb4 ~ c5 ~ g4 ~",
).note()
  .s("gm_pad_metallic")
  .slow(2)
  .decay(.92)
  .delay(".3:.225:.45")
  .room(.35)
  .gain(.3)

let track_chorus_hook = cat(
  "g4 bb4 c5 eb5 ~ c5 bb4 g4",
  "f4 g4 bb4 c5 ~ bb4 g4 d5",
  "eb5 g5 f5 d5 ~ c5 bb4 g4",
  "f4 ab4 c5 d5 ~ c5 ab4 g4",
).note()
  .s("gm_lead_2_sawtooth")
  .attack(.01)
  .decay(.24)
  .release(.16)
  .delay(".3:.18:.4")
  .room(.14)
  .gain(.26)

let track_chorus_choir = note("[c5,eb5,g5] [bb4,d5,f5] [ab4,c5,eb5] [g4,bb4,d5]")
  .slow(4)
  .s("gm_pad_choir")
  .decay(.98)
  .room(.85)
  .gain(.18)

let track_breakd_sub_a = note("c2 ~ c2 ~ g1 ~ bb1 ~")
  .s("gm_synth_bass_1")
  .decay(.24)
  .lpf(240)
  .gain(.24)

let track_breakd_chords_b = note("[eb4,g4,bb4,d5] [f4,ab4,c5,eb5] [g4,bb4,d5,f5] [bb3,d4,f4,ab4]")
  .slow(4)
  .s("gm_pad_warm")
  .decay(.98)
  .delay(".3:.18:.4")
  .room(.82)
  .rsize(2)
  .gain(.2)

let track_breakd_brass = cat(
  "g4 ~ bb4 c5 ~ eb5 d5 c5",
  "f4 ~ g4 bb4 ~ c5 d5 g4",
).note()
  .s("gm_brass_section")
  .attack(.03)
  .decay(.28)
  .release(.18)
  .gain(.18)

let track_breakd_air = note("c6 ~ ~ bb5 ~ g5 ~ eb5")
  .s("gm_pad_halo")
  .slow(2)
  .decay(.99)
  .room(.92)
  .gain(.14)

let track_finale_drums_b = stack(
  s("bd [bd bd] ~ bd").bank("RolandTR909").gain(1.14),
  s("~ sd ~ [cp sd]").bank("RolandTR909").gain(.78),
  s("[hh hh] hh [hh hh] [hh hh hh] [~ hh] hh [hh hh] [hh oh]").bank("LinnDrum").gain(.2),
  s("sh*8").bank("RolandTR808").gain(.12),
)

let track_finale_sub_a = note("c2 ~ c2 ~ g1 ~ bb1 ~")
  .s("gm_synth_bass_1")
  .decay(.24)
  .lpf(260)
  .gain(.46)

let track_finale_sub_b = note("c2 eb2 g1 bb1 c2 g1 f1 g1")
  .s("gm_synth_bass_1")
  .attack(.03)
  .decay(.16)
  .release(.1)
  .lpf(900)
  .gain(.32)

let track_finale_chords_a = note("[c4,eb4,g4,bb4] [g3,bb3,d4,f4] [ab3,c4,eb4,g4] [f3,a3,c4,eb4]")
  .slow(4)
  .s("gm_pad_poly")
  .decay(.96)
  .lpf(5000)
  .delay(".3:.225:.45")
  .room(.7)
  .rsize(2)
  .gain(.22)

let track_finale_chords_b = note("[eb4,g4,bb4,d5] [f4,ab4,c5,eb5] [g4,bb4,d5,f5] [bb3,d4,f4,ab4]")
  .slow(4)
  .s("gm_pad_warm")
  .decay(.98)
  .delay(".3:.18:.4")
  .room(.82)
  .rsize(2)
  .gain(.2)

let track_finale_glass = cat(
  "~ ~ eb5 ~ ~ d5 ~ bb4",
  "~ ~ bb4 ~ c5 ~ g4 ~",
).note()
  .s("gm_pad_metallic")
  .slow(2)
  .decay(.92)
  .delay(".3:.225:.45")
  .room(.35)
  .gain(.34)

let track_finale_hook = cat(
  "g4 bb4 c5 eb5 ~ c5 bb4 g4",
  "f4 g4 bb4 c5 ~ bb4 g4 d5",
  "eb5 g5 f5 d5 ~ c5 bb4 g4",
  "f4 ab4 c5 d5 ~ c5 ab4 g4",
).note()
  .s("gm_lead_2_sawtooth")
  .attack(.01)
  .decay(.24)
  .release(.16)
  .delay(".3:.18:.4")
  .room(.14)
  .gain(.26)

let track_finale_choir = note("[c5,eb5,g5] [bb4,d5,f5] [ab4,c5,eb5] [g4,bb4,d5]")
  .slow(4)
  .s("gm_pad_choir")
  .decay(.98)
  .room(.85)
  .gain(.18)

let track_finale_brass = cat(
  "g4 ~ bb4 c5 ~ eb5 d5 c5",
  "f4 ~ g4 bb4 ~ c5 d5 g4",
).note()
  .s("gm_brass_section")
  .attack(.03)
  .decay(.28)
  .release(.18)
  .gain(.2)

// @song_sections
// Section naming:
// section_<name>
// Each section must stack track vars only.

let section_intro = stack(
  track_intro_chords_a,
  track_intro_glass,
  track_intro_air,
)

let section_verse = stack(
  track_verse_drums_a,
  track_verse_sub_a,
  track_verse_sub_b,
  track_verse_chords_a,
  track_verse_glass,
)

let section_lift = stack(
  track_lift_drums_b,
  track_lift_sub_a,
  track_lift_sub_b,
  track_lift_chords_a,
  track_lift_chords_b,
  track_lift_glass,
  track_lift_arp,
)

let section_chorus = stack(
  track_chorus_drums_b,
  track_chorus_sub_a,
  track_chorus_sub_b,
  track_chorus_chords_a,
  track_chorus_chords_b,
  track_chorus_glass,
  track_chorus_hook,
  track_chorus_choir,
)

let section_breakd = stack(
  track_breakd_sub_a,
  track_breakd_chords_b,
  track_breakd_brass,
  track_breakd_air,
)

let section_finale = stack(
  track_finale_drums_b,
  track_finale_sub_a,
  track_finale_sub_b,
  track_finale_chords_a,
  track_finale_chords_b,
  track_finale_glass,
  track_finale_hook,
  track_finale_choir,
  track_finale_brass,
)

// @song_arrangement
// Final arrangement naming:
// final_song
// Only section vars belong here.

let final_song = arrange(
  [4, section_intro],
  [8, section_verse],
  [4, section_lift],
  [8, section_chorus],
  [4, section_breakd],
  [8, section_finale],
  [4, section_intro],
)

final_song
`

export const song = (id: string) => `${root}/${id}.js`
export const tab = (id: string) => `file://${song(id)}`

export const boot = (src?: string) => (src ? undefined : stub)
