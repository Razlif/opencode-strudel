import type { GridNote } from "./types"

const names = ["c", "c#", "d", "eb", "e", "f", "f#", "g", "ab", "a", "bb", "b"]

const tone = (n: number) => `${names[n % 12]}${Math.floor(n / 12) - 1}`

const part = (head: string, len: number) => (len > 1 ? `${head}@${len}` : head)

export function format(list: GridNote[], steps = 16, bars = 1) {
  const total = steps * bars
  const out = list
    .sort((a, b) => a.start - b.start)
    .reduce(
      (state, item) => {
        const gap = item.start - state.at
        if (gap > 0) state.out.push(part("~", gap))
        state.out.push(part(tone(item.midi), item.len))
        state.at = item.start + item.len
        return state
      },
      { at: 0, out: [] as string[] },
    )
  if (out.at < total) out.out.push(part("~", total - out.at))
  const body = bars > 1 ? `<${out.out.join(" ")}>/${bars}` : `<${out.out.join(" ")}>`
  return `note("${body}").s("piano").clip(1).attack(0.03).release(0.12).gain(0.5)`
}
