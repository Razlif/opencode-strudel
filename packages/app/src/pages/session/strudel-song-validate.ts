const marks = ["@song_meta", "@song_imports", "@song_tracks", "@song_sections", "@song_arrangement"] as const

const find = (src: string, rx: RegExp) => [...src.matchAll(rx)]

const body = (src: string, name: string) => {
  const hit = src.match(new RegExp(`(?:let|const)\\s+${name}\\s*=\\s*([\\s\\S]*?)(?=\\n(?:let|const)\\s+|\\nfinal_song\\s*$|$)`))
  return hit?.[1]?.trim() ?? ""
}

const refs = (src: string, rx: RegExp) => [...src.matchAll(rx)].map((item) => item[1])
const calls = (src: string) => [...src.matchAll(/\b([a-z_][a-z0-9_]*)\s*\(/gi)].map((item) => item[1])

export const check = (src: string) => {
  const err: string[] = []
  const pos = marks.map((mark) => src.indexOf(mark))
  if (pos.some((n) => n === -1)) {
    marks.filter((_, i) => pos[i] === -1).forEach((mark) => err.push(`missing marker ${mark}`))
  }
  if (pos.every((n) => n >= 0) && pos.some((n, i) => i > 0 && n < pos[i - 1])) {
    err.push("marker order is invalid")
  }
  if (!/(?:let|const)\s+song_meta\s*=/.test(src)) err.push("missing song_meta")
  if (!/(?:let|const)\s+final_song\s*=/.test(src)) err.push("missing final_song")
  if (!src.trimEnd().endsWith("final_song")) err.push("file must end with final_song")

  const tracks = find(src, /(?:let|const)\s+(track_[a-z0-9_]+)\s*=/gi).map((item) => item[1])
  const sects = find(src, /(?:let|const)\s+(section_[a-z0-9_]+)\s*=/gi).map((item) => item[1])

  if (!tracks.length) err.push("missing track vars")
  if (!sects.length) err.push("missing section vars")

  sects.forEach((name) => {
    const text = body(src, name)
    if (!/^stack\s*\(/.test(text)) {
      err.push(`${name} must use stack(...)`)
      return
    }
    const used = refs(text, /\b(track_[a-z0-9_]+)\b/gi)
    if (!used.length) {
      err.push(`${name} must reference track vars`)
      return
    }
    const bad = calls(text)
      .filter((item) => item !== "stack")
      .filter((item) => !used.includes(item))
    if (bad.length) err.push(`${name} must reference track vars only`)
    used.filter((item) => !tracks.includes(item)).forEach((item) => err.push(`${name} references missing ${item}`))
  })

  const final = body(src, "final_song")
  if (final) {
    if (!/^arrange\s*\(/.test(final)) {
      err.push("final_song must use arrange(...)")
    } else {
      const used = refs(final, /\b(section_[a-z0-9_]+)\b/gi)
      if (!used.length) err.push("final_song must reference section vars")
      const bad = calls(final)
        .filter((item) => item !== "arrange")
        .filter((item) => !used.includes(item))
      if (bad.length) err.push("final_song must reference section vars only")
      used.filter((item) => !sects.includes(item)).forEach((item) => err.push(`final_song references missing ${item}`))
    }
  }

  return {
    ok: err.length === 0,
    err,
  }
}
