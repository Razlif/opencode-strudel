import { describe, expect, test } from "bun:test"
import { StrudelValidateSongContractTool } from "../../src/tool/strudel_validate_song_contract"
import { SessionID, MessageID } from "../../src/session/schema"

const ctx = {
  sessionID: SessionID.make("ses_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

const stub = `// Strudel Studio canonical song file
// Keep marker comments and top-level names stable.

// @song_meta
const song_meta = {
  title: "Test",
  bpm: 120,
  beats_per_cycle: 4,
}

setcps((song_meta.bpm / 60) / song_meta.beats_per_cycle)

// @song_imports
// Shared setup only.

// @song_tracks
// Track naming:
// track_<section>_<role>

let track_intro_drums = s("bd").bank("RolandTR909")

// @song_sections
// Section naming:
// section_<name>
// Each section must stack track vars only.

let section_intro = stack(
  track_intro_drums,
)

// @song_arrangement
// Final arrangement naming:
// final_song
// Only section vars belong here.

let final_song = arrange(
  [8, section_intro],
)

final_song
`

describe("tool.strudel_validate_song_contract", () => {
  test("accepts canonical song text", async () => {
    const tool = await StrudelValidateSongContractTool.init()
    const result = await tool.execute({ code: stub }, ctx)
    const json = JSON.parse(result.output)
    expect(json.ok).toBe(true)
    expect(json.errors).toEqual([])
  })

  test("reports contract failures as structured output", async () => {
    const tool = await StrudelValidateSongContractTool.init()
    const result = await tool.execute({ code: "// @song_meta" }, ctx)
    const json = JSON.parse(result.output)
    expect(json.ok).toBe(false)
    expect(Array.isArray(json.errors)).toBe(true)
    expect(json.errors.length).toBeGreaterThan(0)
  })
})
