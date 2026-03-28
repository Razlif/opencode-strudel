import { describe, expect, test } from "bun:test"
import { bootstrap } from "./strudel-song-bootstrap"

describe("strudel song bootstrap prompt", () => {
  test("targets the canonical path and includes the template", () => {
    const out = bootstrap("songs/ses_1.js")
    expect(out[0].content).toContain(
      'Create the canonical Strudel session song file at "songs/ses_1.js" inside the current workspace root.',
    )
    expect(out[0].content).toContain("Use the existing songs directory in the workspace root.")
    expect(out[0].content).toContain("Use this exact template:")
    expect(out[0].content).toContain("// @song_meta")
    expect(out[0].content).toContain("final_song")
  })
})
