import { describe, expect, test } from "bun:test"
import { tapRhythmPlan } from "./capture-timing"
import { buildTapRhythmPrompt, quantizeTapHits } from "./tap-rhythm"

describe("tap rhythm plan", () => {
  test("uses fixed two-bar count-in and one-bar post-roll", () => {
    const plan = tapRhythmPlan(120, 4, 2, 16)
    expect(plan.countBars).toBe(2)
    expect(plan.postBars).toBe(1)
    expect(plan.phrase_start).toBeCloseTo(4.12, 2)
    expect(plan.phrase_end).toBeCloseTo(8.12, 2)
    expect(plan.stop_at).toBeCloseTo(10.12, 2)
  })
})

describe("tap rhythm quantize", () => {
  test("snaps taps to steps and dedupes collisions", () => {
    const out = quantizeTapHits([0, 0.03, 0.52, 0.76], 120, 4, 1, 8)
    expect(out).toEqual([0, 2, 3])
  })

  test("drops taps outside the phrase grid", () => {
    const out = quantizeTapHits([0, 1.9, 2.2], 120, 4, 1, 8)
    expect(out).toEqual([0])
  })
})

describe("tap rhythm prompt", () => {
  test("builds a structured AI handoff prompt", () => {
    const text = buildTapRhythmPrompt({
      bars: 2,
      stepsPerBar: 16,
      hits: [0, 4, 8],
      sample: "bd",
      bank: "RolandTR808",
      notes: "make it swing",
    })

    expect(text).toContain("Seed sample: bd")
    expect(text).toContain("Hit steps: 0, 4, 8")
    expect(text).toContain("Bar 1 seed:")
    expect(text).toContain("User notes: make it swing")
    expect(text).toContain("exact base-drum groove")
    expect(text).toContain("Do not add any extra kick hits")
    expect(text).toContain("optional hi-hat track")
  })
})
