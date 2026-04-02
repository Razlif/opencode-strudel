import { cycleSec, stepSec } from "./grid"
import type { CleanResult, GridNote, NoteEvent } from "./types"

const score = (item: GridNote) => [item.confidence ?? 0, item.len] as const
const close = (a: number, b: number) => Math.abs(a - b) <= 7

const better = (a: GridNote, b: GridNote) => {
  const sa = score(a)
  const sb = score(b)
  if (sa[0] !== sb[0]) return sa[0] > sb[0]
  return sa[1] > sb[1]
}

const sane = (list: NoteEvent[]) =>
  list.filter((item, i, all) => {
    const prev = all[i - 1]
    const next = all[i + 1]
    if (!prev || !next) return true
    const off = !close(item.midi, prev.midi) && !close(item.midi, next.midi)
    const jump = Math.abs(prev.midi - next.midi) <= 7
    const weak = (item.confidence ?? 0) < 0.35
    const short = item.durationSec <= 0.12
    if (off && jump && weak && short) return false
    return true
  })

export function clean(list: NoteEvent[], bpm: number, div: number, steps = 32, bars = 1): CleanResult {
  const cycle = cycleSec(bpm, div) * bars
  const step = stepSec(bpm, div, steps)
  const span = steps * bars
  const base = sane(
    list.filter((item) => item.durationSec >= 0.08),
  )
    .sort((a, b) => a.startSec - b.startSec)
  const zero = base[0]?.startSec ?? 0
  const seed = base
    .map((item, idx) => {
      const from = Math.max(0, item.startSec - zero)
      const to = from + item.durationSec
      const start = Math.max(0, Math.round(from / step))
      const end = Math.max(start + 1, Math.round(to / step))
      const len = end - start
      return {
        id: `${idx}`,
        midi: item.midi,
        start,
        len,
        confidence: item.confidence,
        over: to > cycle,
      }
    })
  const full = seed.length
  const keep = seed
    .filter((item) => item.start < span)
    .map((item) => ({
      ...item,
      len: Math.min(item.len, span - item.start),
    }))
    .filter((item) => item.len > 0)
  const win = Array.from({ length: span }, (_, i) => {
    const hit = keep.filter((item) => i >= item.start && i < item.start + item.len)
    if (!hit.length) return
    return hit.reduce((top, item) => (better(item, top) ? item : top))
  })
  const used = new Set(win.flatMap((item) => (item ? [item.id] : [])))
  const notes = win.reduce<GridNote[]>((out, item, i) => {
    if (!item) return out
    const prev = out.at(-1)
    if (!prev) return [...out, { midi: item.midi, start: i, len: 1, confidence: item.confidence }]
    const same = prev.midi === item.midi && prev.start + prev.len === i
    const fresh = item.start === i
    if (!same || fresh) return [...out, { midi: item.midi, start: i, len: 1, confidence: item.confidence }]
    prev.len += 1
    return out
  }, [])
  return {
    notes,
    dropped: list.length - full,
    cropped: seed.filter((item) => item.start >= span || item.over).length,
    collisions: keep.length - used.size,
  }
}
