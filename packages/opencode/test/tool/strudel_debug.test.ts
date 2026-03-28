import { describe, expect, test } from "bun:test"
import path from "path"
import { StrudelDebugTool } from "../../src/tool/strudel_debug"
import { Instance } from "../../src/project/instance"
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

const root = path.join(import.meta.dir, "../..")

describe("tool.strudel_debug", () => {
  test("validates a simple pattern", async () => {
    await Instance.provide({
      directory: root,
      fn: async () => {
        const tool = await StrudelDebugTool.init()
        const result = await tool.execute(
          {
            code: 'note("<c4 a3 f3 e3>(3,8)")',
          },
          ctx,
        )
        const json = JSON.parse(result.output)
        expect(json.ok).toBe(true)
        expect(json.errors).toEqual([])
      },
    })
  })

  test("reports evaluation failures as structured output", async () => {
    await Instance.provide({
      directory: root,
      fn: async () => {
        const tool = await StrudelDebugTool.init()
        const result = await tool.execute(
          {
            code: 'stack(',
          },
          ctx,
        )
        const json = JSON.parse(result.output)
        expect(json.ok).toBe(false)
        expect(Array.isArray(json.errors)).toBe(true)
        expect(json.errors.length).toBeGreaterThan(0)
      },
    })
  })
})
