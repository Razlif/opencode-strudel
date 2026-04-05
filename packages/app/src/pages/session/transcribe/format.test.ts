import { describe, expect, test } from "bun:test"
import { clean } from "./clean"
import { format } from "./format"

describe("strudel melody clean", () => {
  test("quantizes by beats per cycle instead of hardcoded four", () => {
    const out = clean(
      [
        { midi: 60, startSec: 0, durationSec: 0.5 },
        { midi: 62, startSec: 0.75, durationSec: 0.25 },
      ],
      120,
      3,
      12,
    )

    expect(out.notes).toEqual([
      { midi: 60, start: 0, len: 4, confidence: undefined },
      { midi: 62, start: 6, len: 2, confidence: undefined },
    ])
  })

  test("preserves repeated attacks on different steps", () => {
    const out = clean(
      [
        { midi: 60, startSec: 0, durationSec: 0.2, confidence: 0.4 },
        { midi: 60, startSec: 0.5, durationSec: 0.2, confidence: 0.4 },
      ],
      120,
      4,
      8,
    )

    expect(out.notes).toEqual([
      { midi: 60, start: 0, len: 1, confidence: 0.4 },
      { midi: 60, start: 2, len: 1, confidence: 0.4 },
    ])
  })

  test("resolves same-step collisions by confidence then length", () => {
    const out = clean(
      [
        { midi: 60, startSec: 0, durationSec: 0.5, confidence: 0.2 },
        { midi: 64, startSec: 0.01, durationSec: 1.0, confidence: 0.9 },
      ],
      120,
      4,
      8,
    )

    expect(out.notes).toEqual([{ midi: 64, start: 0, len: 4, confidence: 0.9 }])
    expect(out.collisions).toBe(1)
  })

  test("crops notes outside the first cycle", () => {
    const out = clean(
      [
        { midi: 60, startSec: 0, durationSec: 0.5 },
        { midi: 62, startSec: 2.25, durationSec: 0.5 },
      ],
      120,
      4,
      8,
    )

    expect(out.notes).toEqual([{ midi: 60, start: 0, len: 2, confidence: undefined }])
    expect(out.cropped).toBe(1)
  })

  test("drops micro notes", () => {
    const out = clean(
      [
        { midi: 60, startSec: 0, durationSec: 0.05 },
        { midi: 62, startSec: 0.5, durationSec: 0.2 },
      ],
      120,
      4,
      8,
    )

    expect(out.notes).toEqual([{ midi: 62, start: 2, len: 1, confidence: undefined }])
    expect(out.dropped).toBe(1)
  })
})

describe("strudel melody format", () => {
  test("emits beat-slot explicit note code", () => {
    const out = format(
      [
        { midi: 62, start: 0, len: 2 },
        { midi: 64, start: 3, len: 1 },
        { midi: 65, start: 4, len: 3 },
      ],
      8,
      1,
      4,
    )

    expect(out).toBe(
      `note("d4 e4 f4 ~").s("triangle")`,
    )
  })
})
