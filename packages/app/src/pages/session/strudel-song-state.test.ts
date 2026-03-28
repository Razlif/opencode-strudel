import { describe, expect, test } from "bun:test"
import { state } from "./strudel-song-state"
import { stub } from "./strudel-song"

describe("strudel song file state", () => {
  test("reports loading state", () => {
    expect(state({ loading: true })).toEqual({
      kind: "loading",
      label: "Song file loading",
      msg: "Reading canonical session song file.",
    })
  })

  test("reports missing state from file error", () => {
    expect(state({ error: "not found" })).toEqual({
      kind: "missing",
      label: "Song file missing",
      msg: "not found",
    })
  })

  test("reports idle before file load", () => {
    expect(state()).toEqual({
      kind: "idle",
      label: "Song file pending",
      msg: "Canonical session song file has not loaded yet.",
    })
  })

  test("reports empty file", () => {
    expect(state({ loaded: true, content: { type: "text", content: "" } })).toEqual({
      kind: "missing",
      label: "Song file empty",
      msg: "Canonical session song file is empty.",
    })
  })

  test("reports invalid file", () => {
    expect(state({ loaded: true, content: { type: "text", content: "// @song_meta" } })).toEqual({
      kind: "invalid",
      label: "Song file invalid",
      msg: "missing marker @song_imports",
    })
  })

  test("reports ready file", () => {
    expect(state({ loaded: true, content: { type: "text", content: stub } })).toEqual({
      kind: "ready",
      label: "Song file ready",
      msg: "Canonical session song file passed contract validation.",
    })
  })
})
