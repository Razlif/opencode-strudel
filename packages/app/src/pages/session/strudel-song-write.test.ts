import { describe, expect, test } from "bun:test"
import { parse } from "./strudel-song-parse"
import { write } from "./strudel-song-write"

const state = {
  bpm: "135",
  div: "8",
  title: "Test",
  sects: [
    {
      id: "a",
      name: "Intro",
      len: "4",
      cards: [
        {
          id: "1",
          name: "RolandTR808",
          tone: "bank",
          code: `s("bd hh sd hh").bank("RolandTR808").gain(.7)`,
        },
        {
          id: "2",
          name: "gm_electric_bass_finger",
          tone: "gm",
          code: `note("<c2 g1>").s("gm_electric_bass_finger").gain(.5)`,
        },
      ],
    },
    {
      id: "b",
      name: "Verse",
      len: "8",
      cards: [
        {
          id: "3",
          name: "vox",
          tone: "remote",
          code: `s("vox").gain(.7)`,
        },
      ],
    },
  ],
}

describe("strudel song write", () => {
  test("writes canonical song text", () => {
    const out = write(state)
    expect(out).toContain("const song_meta = {")
    expect(out).toContain("let track_intro_rolandtr808 = s(\"bd hh sd hh\").bank(\"RolandTR808\").gain(.7)")
    expect(out).toContain("let section_intro = stack(")
    expect(out).toContain("let final_song = arrange(")
  })

  test("round-trips through parser", () => {
    const out = parse(write(state))
    expect(out.bpm).toBe("135")
    expect(out.div).toBe("8")
    expect(out.sects.map((item) => item.id)).toEqual(["section_intro", "section_verse"])
    expect(out.sects.map((item) => item.len)).toEqual(["4", "8"])
    expect(out.sects[0]?.cards.map((item) => item.name)).toEqual(["RolandTR808", "gm_electric_bass_finger"])
    expect(out.sects[1]?.cards.map((item) => item.name)).toEqual(["vox"])
  })

  test("deduplicates repeated names", () => {
    const out = write({
      bpm: "120",
      div: "4",
      sects: [
        {
          id: "a",
          name: "Intro",
          len: "8",
          cards: [
            { id: "1", name: "piano", tone: "named", code: `note("c4").s("piano")` },
            { id: "2", name: "piano", tone: "named", code: `note("e4").s("piano")` },
          ],
        },
        {
          id: "b",
          name: "Intro",
          len: "8",
          cards: [{ id: "3", name: "vox", tone: "remote", code: `s("vox")` }],
        },
      ],
    })

    expect(out).toContain("let track_intro_piano = note(\"c4\").s(\"piano\")")
    expect(out).toContain("let track_intro_piano_2 = note(\"e4\").s(\"piano\")")
    expect(out).toContain("let section_intro = stack(")
    expect(out).toContain("let section_intro_2 = stack(")
  })

  test("keeps empty sections valid without showing fake cards after parse", () => {
    const out = write({
      bpm: "120",
      div: "4",
      sects: [
        {
          id: "a",
          name: "Verse",
          len: "8",
          cards: [],
        },
      ],
    })

    expect(out).toContain(`let track_verse_placeholder = s("~").gain(0)`)
    expect(out).toContain("let section_verse = stack(")

    const next = parse(out)
    expect(next.sects.map((item) => item.id)).toEqual(["section_verse"])
    expect(next.sects[0]?.cards).toEqual([])
  })
})
