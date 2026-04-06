import type { TapRhythmSeed } from "@/pages/session/transcribe/tap-rhythm"

const pattern = (hits: number[], totalSteps: number, sample: string) => {
  const picked = new Set(hits)
  return Array.from({ length: totalSteps }, (_, index) => (picked.has(index) ? sample : "~")).join(" ")
}

const bars = (seed: Pick<TapRhythmSeed, "hits" | "bars" | "stepsPerBar" | "sample">) =>
  Array.from({ length: Math.max(1, seed.bars) }, (_, bar) => {
    const start = bar * seed.stepsPerBar
    const end = start + seed.stepsPerBar
    const hits = seed.hits.filter((hit) => hit >= start && hit < end).map((hit) => hit - start)
    return pattern(hits, seed.stepsPerBar, seed.sample)
  })

export const splitTapRhythmBars = (seed: Pick<TapRhythmSeed, "hits" | "bars" | "stepsPerBar" | "sample">) => bars(seed)

export function formatTapRhythm(seed: Pick<TapRhythmSeed, "hits" | "bars" | "stepsPerBar" | "sample" | "bank">) {
  const body = bars(seed)
  const bank = seed.bank?.trim() ? `.bank(${JSON.stringify(seed.bank.trim())})` : ""
  if (body.length <= 1) return `s(${JSON.stringify(body[0] ?? pattern([], seed.stepsPerBar, seed.sample))})${bank}`
  return `cat(\n${body.map((item) => `  s(${JSON.stringify(item)})${bank}`).join(",\n")},\n)`
}

export function summarizeTapRhythm(seed: Pick<TapRhythmSeed, "hits" | "bars" | "stepsPerBar" | "sample" | "bank">) {
  const base = `Sample ${seed.sample}, ${seed.bars} bar${seed.bars === 1 ? "" : "s"}, ${seed.stepsPerBar} steps/bar`
  const bank = seed.bank?.trim() ? `, bank ${seed.bank.trim()}` : ""
  const hits = seed.hits.length ? seed.hits.join(", ") : "none"
  const grouped = bars(seed)
    .map((item, index) => `bar ${index + 1}: ${item}`)
    .join(" | ")
  return `${base}${bank}. Hit steps: ${hits}. ${grouped}.`
}
