import { describe, expect, test } from "bun:test"
import { parse } from "./strudel-song-parse"

const src = `// @song_meta
const song_meta = {
  title: "Test",
  bpm: 135,
  beats_per_cycle: 8,
  key: "C minor",
}

setcps((song_meta.bpm / 60) / song_meta.beats_per_cycle)

// @song_imports
const lead_fx = (x) => x.room(.4)

// @song_tracks
let track_intro_drums = s("bd hh sd hh").bank("RolandTR808").gain(.7)

let track_intro_bass = note("<c2 g1>").s("gm_electric_bass_finger").gain(.5)

let track_verse_voice = s("vox").gain(.7)

// @song_sections
let section_intro = stack(
  track_intro_drums,
  track_intro_bass,
)

let section_verse = stack(
  track_verse_voice,
)

// @song_arrangement
let final_song = arrange(
  [4, section_intro],
  [8, section_verse],
)

final_song
`

describe("strudel song parse", () => {
  test("reads song meta and ordered sections", () => {
    const out = parse(src)
    expect(out.bpm).toBe("135")
    expect(out.div).toBe("8")
    expect(out.title).toBe(`"Test"`)
    expect(out.metaExtra).toContain(`key: "C minor",`)
    expect(out.imports).toContain(`const lead_fx = (x) => x.room(.4)`)
    expect(out.sects.map((item) => item.id)).toEqual(["section_intro", "section_verse"])
    expect(out.sects.map((item) => item.len)).toEqual(["4", "8"])
  })

  test("hydrates cards with inferred labels and tones", () => {
    const out = parse(src)
    expect(out.sects[0]?.cards.map((item) => ({ id: item.id, name: item.name, tone: item.tone }))).toEqual([
      { id: "track_intro_drums", name: "RolandTR808", tone: "bank" },
      { id: "track_intro_bass", name: "gm_electric_bass_finger", tone: "gm" },
    ])
    expect(out.sects[1]?.cards[0]?.name).toBe("vox")
    expect(out.sects[1]?.cards[0]?.tone).toBe("remote")
  })
})
