import { describe, expect, test } from "bun:test"
import { banks, ext, gm, named, packs, starter } from "./strudel-manifest"

describe("strudel manifest", () => {
  test("defines preload packs", () => {
    expect(packs.drum).toContain("tidal-drum-machines.json")
    expect(packs.piano).toContain("piano.json")
    expect(packs.vcsl).toContain("vcsl.json")
  })

  test("defines supported sound families", () => {
    expect(banks).toContain("RolandTR808")
    expect(named).toContain("piano")
    expect(gm).toContain("gm_piano")
    expect(ext.map((item) => item.name)).toContain("vox")
  })

  test("defines starter defaults from supported sounds", () => {
    expect(banks).toContain(starter.drums)
    expect(banks).toContain(starter.hats)
    expect(banks).toContain(starter.shaker)
    expect(named).toContain(starter.bass)
    expect(named).toContain(starter.lead)
  })
})
