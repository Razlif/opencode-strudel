import { describe, expect, test } from "bun:test"
import { bootstrap } from "./strudel-song-bootstrap"

describe("strudel song bootstrap prompt", () => {
  test("targets the canonical path and includes the template", () => {
    const out = bootstrap("songs/ses_1.js")
    const text = out.find((part) => part.type === "text")?.content
    expect(text).toContain(
      'Create the canonical Strudel session song file at "songs/ses_1.js" inside the current workspace root.',
    )
    expect(text).toContain("Use the existing songs directory in the workspace root.")
    expect(text).toContain("Use this exact template:")
    expect(text).toContain("// @song_meta")
    expect(text).toContain("final_song")
  })
})
