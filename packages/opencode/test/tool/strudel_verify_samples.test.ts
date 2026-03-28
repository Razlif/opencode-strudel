import { describe, expect, test } from "bun:test"
import path from "path"
import { StrudelVerifySamplesTool } from "../../src/tool/strudel_verify_samples"
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

describe("tool.strudel_verify_samples", () => {
  test("verifies built-in supported sample names", async () => {
    await Instance.provide({
      directory: root,
      fn: async () => {
        const tool = await StrudelVerifySamplesTool.init()
        const result = await tool.execute(
          {
            code: 'stack(s("bd hh sd hh"), sound("bd"))',
          },
          ctx,
        )
        const json = JSON.parse(result.output)
        expect(json.ok).toBe(true)
        expect(json.missing).toEqual([])
        expect(json.supported).toContain("bd")
        expect(json.supported).toContain("hh")
        expect(json.supported).toContain("sd")
      },
    })
  })

  test("reports unknown sample names", async () => {
    await Instance.provide({
      directory: root,
      fn: async () => {
        const tool = await StrudelVerifySamplesTool.init()
        const result = await tool.execute(
          {
            code: 's("totally_made_up_sample")',
          },
          ctx,
        )
        const json = JSON.parse(result.output)
        expect(json.ok).toBe(false)
        expect(json.missing).toContain("totally_made_up_sample")
      },
    })
  })

  test("verifies runtime gm sounds from the app baseline", async () => {
    await Instance.provide({
      directory: root,
      fn: async () => {
        const tool = await StrudelVerifySamplesTool.init()
        const result = await tool.execute(
          {
            code: 'note("<c4 eb4 g4>").s("gm_pad_metallic")',
          },
          ctx,
        )
        const json = JSON.parse(result.output)
        expect(json.ok).toBe(true)
        expect(json.missing).toEqual([])
        expect(json.supported).toContain("gm_pad_metallic")
      },
    })
  })
})
