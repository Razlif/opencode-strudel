import type { GridNote } from "./types"

const names = ["c", "c#", "d", "eb", "e", "f", "f#", "g", "ab", "a", "bb", "b"]

const tone = (n: number) => `${names[n % 12]}${Math.floor(n / 12) - 1}`

const onsetScore = (item: GridNote, beatStart: number) => [Math.abs(item.start - beatStart), -(item.confidence ?? 0), -item.len] as const

const overlapScore = (item: GridNote, beatStart: number, beatEnd: number) => {
  const overlap = Math.max(0, Math.min(item.start + item.len, beatEnd) - Math.max(item.start, beatStart))
  return [-overlap, Math.abs(item.start - beatStart), -(item.confidence ?? 0), -item.len] as const
}

export function format(list: GridNote[], steps = 16, bars = 1, beatsPerCycle = 4) {
  const totalBeats = Math.max(1, bars * beatsPerCycle)
  const stepsPerBeat = Math.max(1, Math.floor(steps / Math.max(1, beatsPerCycle)))
  const out = Array.from({ length: totalBeats }, () => "~")
  const notes = list.slice().sort((a, b) => a.start - b.start || (b.confidence ?? 0) - (a.confidence ?? 0))
  const used = new Set<number>()

  for (let beat = 0; beat < totalBeats; beat += 1) {
    const beatStart = beat * stepsPerBeat
    const beatEnd = beatStart + stepsPerBeat
    const onsetCandidates = notes
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => !used.has(index) && item.start >= beatStart && item.start < beatEnd)
    if (onsetCandidates.length > 0) {
      onsetCandidates.sort((a, b) => {
        const sa = onsetScore(a.item, beatStart)
        const sb = onsetScore(b.item, beatStart)
        return sa[0] - sb[0] || sa[1] - sb[1] || sa[2] - sb[2]
      })
      used.add(onsetCandidates[0].index)
      out[beat] = tone(onsetCandidates[0].item.midi)
      continue
    }

    const overlapCandidates = notes
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => !used.has(index) && item.start < beatEnd && item.start + item.len > beatStart)
    if (overlapCandidates.length > 0) {
      overlapCandidates.sort((a, b) => {
        const sa = overlapScore(a.item, beatStart, beatEnd)
        const sb = overlapScore(b.item, beatStart, beatEnd)
        return sa[0] - sb[0] || sa[1] - sb[1] || sa[2] - sb[2] || sa[3] - sb[3]
      })
      used.add(overlapCandidates[0].index)
      out[beat] = tone(overlapCandidates[0].item.midi)
    }
  }
  return `note("${out.join(" ")}").s("triangle")`
}
