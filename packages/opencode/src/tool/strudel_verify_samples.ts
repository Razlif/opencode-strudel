import z from "zod"
import path from "path"
import fs from "fs"
import { Tool } from "./tool"
import DESCRIPTION from "./strudel_verify_samples.txt"
import { Instance } from "../project/instance"

function msg(err: unknown) {
  if (err instanceof Error) return err.message
  return String(err)
}

function parse(text: string) {
  const body = text.trim()
  if (!body) throw new Error("Strudel sample inspection produced no JSON output")
  const start = body.lastIndexOf("\n{")
  const json = start === -1 ? body : body.slice(start + 1)
  return JSON.parse(json)
}

function file() {
  const list = [
    path.resolve(import.meta.dir, "..", "..", "..", "..", "script", "strudel", "strudel-sample-inspect.mjs"),
    path.resolve(Instance.worktree, "script", "strudel", "strudel-sample-inspect.mjs"),
  ]
  const hit = list.find((item) => fs.existsSync(item))
  if (hit) return hit
  throw new Error("Could not locate script/strudel/strudel-sample-inspect.mjs")
}

async function inspect(input: { code: string }) {
  const proc = Bun.spawn(["node", file(), "--stdin", "--json"], {
    cwd: Instance.worktree,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  })
  const text = new TextEncoder().encode(input.code)
  if ("write" in proc.stdin && typeof proc.stdin.write === "function") {
    await proc.stdin.write(text)
    await proc.stdin.end()
  } else {
    const writer = proc.stdin.getWriter()
    await writer.write(text)
    await writer.close()
  }

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  const done = await proc.exited
  if (!stdout.trim()) {
    throw new Error(`Strudel sample inspection produced no output${stderr.trim() ? `: ${stderr.trim()}` : ""}`)
  }
  const json = parse(stdout)
  if (done === 0) return json
  if (json && typeof json === "object") return json
  throw new Error(stderr.trim() || "Strudel sample inspection failed")
}

export const StrudelVerifySamplesTool = Tool.define("strudel_verify_samples", {
  description: DESCRIPTION,
  parameters: z.object({
    code: z.string().describe("The full Strudel program to inspect for sample usage"),
    goal: z.string().optional().describe("Optional short note about what the snippet is meant to do"),
  }),
  async execute(args) {
    const result = await inspect({ code: args.code }).catch((err) => ({
      ok: false,
      summary: "Strudel sample verification failed",
      errors: [{ kind: "runtime", message: msg(err) }],
      warnings: [],
      notes: [],
      used: [],
      supported: [],
      missing: [],
      packs: [],
    }))
    const output = {
      ...result,
      ...(args.goal ? { goal: args.goal } : {}),
    }
    return {
      title: result.ok ? "Strudel sample verification ok" : "Strudel sample verification failed",
      output: JSON.stringify(output, null, 2),
      metadata: {
        ok: result.ok,
        summary: result.summary,
        errors: result.errors.length,
        warnings: result.warnings.length,
        missing: result.missing?.length ?? 0,
      },
    }
  },
})
