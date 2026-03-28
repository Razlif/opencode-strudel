import { describe, expect, test } from "bun:test"
import { groups, probe } from "./strudel-support"

describe("strudel support", () => {
  test("filters candidate sounds against runtime map", () => {
    const map = {
      get: () => ({
        RolandTR808_bd: 1,
        RolandTR808_hh: 1,
        RolandTR808_sd: 1,
        piano: 1,
        gm_piano: 1,
      }),
    }
    const out = probe(map, {
      banks: ["RolandTR808", "RolandTR909"],
      named: ["piano", "kawai"],
      gm: ["gm_piano", "gm_pad_poly"],
    })

    expect(out).toEqual({
      size: 5,
      banks: ["RolandTR808", "RolandTR909"],
      named: ["piano", "kawai"],
      gm: ["gm_piano"],
    })
  })

  test("builds browser groups from support state", () => {
    const out = groups(
      {
        ext: ["vox"],
      },
      {
        size: 4,
        banks: ["RolandTR808"],
        named: ["piano"],
        gm: ["gm_piano"],
      },
    )

    expect(out.map((item) => item.items)).toEqual([["RolandTR808"], ["piano"], ["gm_piano"], ["vox"]])
  })
})
