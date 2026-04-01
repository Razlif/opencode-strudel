import type { Session, SessionStatus } from "@opencode-ai/sdk/v2/client"
import type { RootLoadArgs } from "./types"

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export async function loadRootSessionsWithFallback(input: RootLoadArgs) {
  try {
    const result = await input.list({ directory: input.directory, roots: true, limit: input.limit })
    return {
      data: result.data,
      limit: input.limit,
      limited: true,
    } as const
  } catch {
    const result = await input.list({ directory: input.directory, roots: true })
    return {
      data: result.data,
      limit: input.limit,
      limited: false,
    } as const
  }
}

export function estimateRootSessionTotal(input: { count: number; limit: number; limited: boolean }) {
  if (!input.limited) return input.count
  if (input.count < input.limit) return input.count
  return input.count + 1
}

export function mergeRoots(input: {
  remote: Session[]
  local: Session[]
  message: Record<string, unknown>
  status: Record<string, SessionStatus | undefined>
  now?: number
}) {
  const now = input.now ?? Date.now()
  const seen = new Set(input.remote.map((item) => item.id))
  const keep = input.local.filter((item) => {
    if (!item?.id) return false
    if (item.parentID) return false
    if (item.time?.archived) return false
    if (seen.has(item.id)) return false
    if (input.message[item.id] !== undefined) return true
    if ((input.status[item.id] ?? { type: "idle" }).type !== "idle") return true
    const at = item.time?.updated ?? item.time?.created ?? 0
    return at > now - 30_000
  })
  return [...input.remote, ...keep].sort((a, b) => cmp(a.id, b.id))
}
