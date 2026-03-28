const trim = (input: string) => {
  const text = input.replaceAll("\\", "/")
  if (text === "/") return text
  return text.replace(/\/+$/, "")
}

const base = (input: string) => trim(input).split("/").filter(Boolean).at(-1) ?? ""

const parent = (input: string) => {
  const text = trim(input)
  const parts = text.split("/")
  if (parts.length <= 1) return text
  if (/^[A-Za-z]:$/.test(parts[0] ?? "")) {
    if (parts.length === 2) return `${parts[0]}/`
    return parts.slice(0, -1).join("/")
  }
  if (parts[0] === "") {
    if (parts.length === 2) return "/"
    return parts.slice(0, -1).join("/") || "/"
  }
  return parts.slice(0, -1).join("/")
}

export const isStrudelWorkspaceRoot = (items: string[]) => {
  const names = new Set(items)
  if (!names.has("AGENTS.md")) return false
  if (!names.has("songs/")) return false
  return true
}

export const resolveStrudelWorkspaceRoot = async (
  input: string,
  list: (dir: string) => Promise<string[]>,
) => {
  const current = trim(input)
  if (!current) return input
  if (isStrudelWorkspaceRoot(await list(current))) return current
  const name = base(current).toLowerCase()
  if (!["songs", "examples", "samples", "resources"].includes(name)) return current
  const up = parent(current)
  if (!up || up === current) return current
  if (isStrudelWorkspaceRoot(await list(up))) return up
  return current
}
