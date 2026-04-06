import { describe, expect, test } from "bun:test"
import { formatTapRhythm, summarizeTapRhythm } from "./tap-rhythm-format"

describe("tap rhythm format", () => {
  test("formats a simple scaffold without a bank", () => {
    expect(
      formatTapRhythm({
        bars: 1,
        stepsPerBar: 8,
        hits: [0, 2, 3, 6],
        sample: "bd",
      }),
    ).toBe(`s("bd ~ bd bd ~ ~ bd ~")`)
  })

  test("formats a scaffold with a bank", () => {
    expect(
      formatTapRhythm({
        bars: 1,
        stepsPerBar: 8,
        hits: [1, 5],
        sample: "bd",
        bank: "RolandTR808",
      }),
    ).toBe(`s("~ bd ~ ~ ~ bd ~ ~").bank("RolandTR808")`)
  })

  test("formats multi-bar scaffolds as explicit bar sequence", () => {
    expect(
      formatTapRhythm({
        bars: 2,
        stepsPerBar: 8,
        hits: [1, 5, 10, 14],
        sample: "bd",
        bank: "RolandTR909",
      }),
    ).toBe(`cat(
  s("~ bd ~ ~ ~ bd ~ ~").bank("RolandTR909"),
  s("~ ~ bd ~ ~ ~ bd ~").bank("RolandTR909"),
)`)
  })

  test("summarizes the captured seed", () => {
    expect(
      summarizeTapRhythm({
        bars: 2,
        stepsPerBar: 16,
        hits: [0, 4, 8],
        sample: "bd",
        bank: "RolandTR909",
      }),
    ).toContain("bar 1:")
  })
})
