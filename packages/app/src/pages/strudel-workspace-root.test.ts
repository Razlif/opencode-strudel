import { describe, expect, test } from "bun:test"
import { isStrudelWorkspaceRoot } from "./strudel-workspace-root"

describe("strudel workspace root", () => {
  test("accepts workspace root with AGENTS and songs folder", () => {
    expect(isStrudelWorkspaceRoot(["AGENTS.md", "songs/", "examples/", "resources/"])).toBe(true)
  })

  test("rejects songs folder without workspace gateway", () => {
    expect(isStrudelWorkspaceRoot(["songs/"])).toBe(false)
  })

  test("rejects root without songs folder", () => {
    expect(isStrudelWorkspaceRoot(["AGENTS.md", "examples/"])).toBe(false)
  })

  test("rejects packaged-looking songs directory without workspace marker", () => {
    expect(isStrudelWorkspaceRoot(["songs/", "nix/", "bin/"])).toBe(false)
  })
})
