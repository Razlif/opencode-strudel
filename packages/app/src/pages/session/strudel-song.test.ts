import { describe, expect, test } from "bun:test"
import { boot, song, stub, tab } from "./strudel-song"

describe("strudel song helpers", () => {
  test("derives session scoped song path", () => {
    expect(song("ses_123")).toBe("songs/ses_123.js")
  })

  test("derives session scoped song tab", () => {
    expect(tab("ses_123")).toBe("file://songs/ses_123.js")
  })

  test("returns template only when missing", () => {
    expect(boot()).toBe(stub)
    expect(boot("let final_song = arrange()")).toBeUndefined()
  })
})
