import { describe, expect, test } from "bun:test"
import { stub } from "./strudel-song"
import { check } from "./strudel-song-validate"

describe("strudel song contract", () => {
  test("accepts canonical stub", () => {
    expect(check(stub)).toEqual({ ok: true, err: [] })
  })

  test("fails when a marker is missing", () => {
    const src = stub.replace("// @song_sections\n", "")
    expect(check(src)).toEqual({
      ok: false,
      err: ["missing marker @song_sections"],
    })
  })

  test("fails when final song is missing", () => {
    const src = stub.replace("let final_song = arrange(\n  [8, section_intro],\n)\n\nfinal_song\n", "")
    expect(check(src)).toEqual({
      ok: false,
      err: ["missing final_song", "file must end with final_song"],
    })
  })

  test("fails when section is not a stack of tracks", () => {
    const src = stub.replace(
      "let section_intro = stack(\n  track_intro_drums,\n  track_intro_bass,\n  track_intro_chord,\n  track_intro_vox,\n)\n",
      'let section_intro = note("c4")\n',
    )
    expect(check(src)).toEqual({
      ok: false,
      err: ["section_intro must use stack(...)"],
    })
  })

  test("fails when final_song references non section vars", () => {
    const src = stub.replace("[8, section_intro]", "[8, track_intro_drums]")
    expect(check(src)).toEqual({
      ok: false,
      err: ["final_song must reference section vars"],
    })
  })
})
