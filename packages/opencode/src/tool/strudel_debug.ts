import z from "zod"
import path from "path"
import fs from "fs"
import { Tool } from "./tool"
import DESCRIPTION from "./strudel_debug.txt"
import { Instance } from "../project/instance"

function msg(err: unknown) {
  if (err instanceof Error) return err.message
  return String(err)
}

function parse(text: string) {
  const body = text.trim()
  if (!body) throw new Error("Strudel debug produced no JSON output")
  const start = body.lastIndexOf("\n{")
  const json = start === -1 ? body : body.slice(start + 1)
  return JSON.parse(json)
}

function file() {
  const list = [
    path.resolve(import.meta.dir, "..", "..", "..", "..", "script", "strudel", "strudel-debug.mjs"),
    path.resolve(Instance.worktree, "script", "strudel", "strudel-debug.mjs"),
  ]
  const hit = list.find((item) => fs.existsSync(item))
  if (hit) return hit
  throw new Error("Could not locate script/strudel/strudel-debug.mjs")
}

async function debug(input: { code: string; start: number; end: number }) {
  const proc = Bun.spawn(["node", file(), "--stdin", "--json", "--start", String(input.start), "--end", String(input.end)], {
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

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const done = await proc.exited
  if (!stdout.trim()) {
    throw new Error(`Strudel debug produced no output${stderr.trim() ? `: ${stderr.trim()}` : ""}`)
  }
  const json = parse(stdout)
  if (done === 0) return json
  if (json && typeof json === "object") return json
  throw new Error(stderr.trim() || "Strudel debug failed")
}

export const StrudelDebugTool = Tool.define("strudel_debug", {
  description: DESCRIPTION,
  parameters: z.object({
    code: z.string().describe("The full Strudel program to validate"),
    goal: z.string().optional().describe("Optional short note about what the snippet is meant to do"),
    start: z.number().optional().describe("Optional start cycle for pattern querying, defaults to 0"),
    end: z.number().optional().describe("Optional end cycle for pattern querying, defaults to 1"),
  }),
  async execute(args) {
    const result = await debug({ code: args.code, start: args.start ?? 0, end: args.end ?? 1 }).catch((err) => ({
      ok: false,
      summary: "Strudel debug tool failed",
      errors: [{ kind: "runtime", message: msg(err) }],
      warnings: [],
      notes: [],
    }))
    const output = {
      ...result,
      ...(args.goal ? { goal: args.goal } : {}),
    }
    return {
      title: result.ok ? "Strudel debug ok" : "Strudel debug failed",
      output: JSON.stringify(output, null, 2),
      metadata: {
        ok: result.ok,
        summary: result.summary,
        errors: result.errors.length,
        warnings: result.warnings.length,
      },
    }
  },
})
