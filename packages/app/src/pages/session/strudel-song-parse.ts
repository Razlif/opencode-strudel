const body = (src: string, name: string) => {
  const hit = src.match(new RegExp(`(?:let|const)\\s+${name}\\s*=\\s*([\\s\\S]*?)(?=\\n(?:let|const)\\s+|\\nfinal_song\\s*$|$)`))
  return hit?.[1]?.trim() ?? ""
}

const pick = (src: string, rx: RegExp) => src.match(rx)?.[1]
const strip = (src: string) => src.replace(/;\s*$/, "").trim()
const words = (text: string) =>
  text
    .split("_")
    .filter(Boolean)
    .map((item) => item[0]?.toUpperCase() + item.slice(1))
    .join(" ")

const tone = (name: string, code: string) => {
  if (/\.bank\s*\(/.test(code)) return "bank"
  if (/["']gm_[^"']+["']/.test(code)) return "gm"
  if (/\bs\s*\(\s*["']vox["']\s*\)/.test(code)) return "remote"
  return "named"
}

const label = (role: string, code: string) =>
  pick(code, /\.bank\s*\(\s*["']([^"']+)["']\s*\)/) ??
  pick(code, /\.s\s*\(\s*["']([^"']+)["']\s*\)/) ??
  pick(code, /\bs\s*\(\s*["']([^"'\s]+)[^"']*["']\s*\)/) ??
  words(role)

const tint = (name: string, tone: string) => {
  const swatch = ["#3b82f6", "#14b8a6", "#f97316", "#eab308", "#a855f7", "#ef4444", "#22c55e", "#ec4899"]
  const n = `${name}:${tone}`.split("").reduce((sum, item) => sum + item.charCodeAt(0), 0)
  return swatch[n % swatch.length]
}

const layout = (n: number) => ({
  x: 48 + (n % 4) * 132,
  y: 48 + Math.floor(n / 4) * 108,
})
const hidden = (card: { role: string; code: string }) => card.role === "placeholder" && card.code === `s("~").gain(0)`

export const parse = (src: string) => {
  const bpm = pick(src, /\bbpm\s*:\s*(\d+)/)?.trim() ?? "120"
  const div = pick(src, /\bbeats_per_cycle\s*:\s*(\d+)/)?.trim() ?? "4"
  const tracks = new Map(
    [...src.matchAll(/(?:let|const)\s+(track_([a-z0-9_]+)_([a-z0-9_]+))\s*=/gi)].map((item) => {
      const id = item[1]
      const sect = item[2]
      const role = item[3]
      const code = strip(body(src, id))
      const name = label(role, code)
      const kind = tone(name, code)
      return [
        id,
        {
          id,
          sect,
          role,
          name,
          tone: kind,
          code,
          color: tint(name, kind),
        },
      ] as const
    }),
  )

  const bars = new Map(
    [...src.matchAll(/\[(\d+)\s*,\s*(section_[a-z0-9_]+)\]/gi)].map((item) => [item[2], item[1]] as const),
  )

  const sects = [...src.matchAll(/(?:let|const)\s+(section_([a-z0-9_]+))\s*=/gi)].map((item) => {
    const id = item[1]
    const name = item[2]
    const refs = [...body(src, id).matchAll(/\b(track_[a-z0-9_]+)\b/gi)].map((row) => row[1])
    return {
      id,
      name: words(name),
      len: bars.get(id) ?? "8",
      cards: refs.flatMap((key, i) => {
        const card = tracks.get(key)
        if (!card) return []
        if (hidden(card)) return []
        return [{ ...card, ...layout(i) }]
      }),
    }
  })

  const order = [...src.matchAll(/\[\d+\s*,\s*(section_[a-z0-9_]+)\]/gi)].map((item) => item[1])
  const list = order
    .map((id) => sects.find((item) => item.id === id))
    .filter((item): item is (typeof sects)[number] => !!item)

  return {
    bpm,
    div,
    sects: list.length ? list : sects,
  }
}
