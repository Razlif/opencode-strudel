import { describe, expect, test } from "bun:test"
import { hasExternalUpdate, needsHydrate } from "./strudel-song-sync"

describe("strudel song sync", () => {
  test("hydrates on first valid payload", () => {
    expect(needsHydrate("", "ready", "final_song")).toBe(true)
  })

  test("does not hydrate unchanged valid payload", () => {
    expect(needsHydrate("final_song", "ready", "final_song")).toBe(false)
  })

  test("does not hydrate invalid payload", () => {
    expect(needsHydrate("final_song", "invalid", "broken")).toBe(false)
  })

  test("does not hydrate missing payload", () => {
    expect(needsHydrate("final_song", "missing", undefined)).toBe(false)
  })

  test("detects external updates after local state was loaded", () => {
    expect(hasExternalUpdate("final_song", "ready", "next_song")).toBe(true)
  })

  test("does not treat first ready payload as external update", () => {
    expect(hasExternalUpdate("", "ready", "next_song")).toBe(false)
  })
})
