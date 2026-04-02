export const cycleSec = (bpm: number, div: number) => (60 / bpm) * div

export const phraseSec = (bpm: number, div: number, bars: number) => cycleSec(bpm, div) * bars

export const stepSec = (bpm: number, div: number, steps: number) => cycleSec(bpm, div) / steps

export function capturePlan(bpm: number, div: number, bars: number, count: number, lead = 0.12, pre = 0.2, lag = 0.06) {
  const cycle = cycleSec(bpm, div)
  const phrase = cycle * bars
  const count_in = cycle * count
  const beat = lead + count_in
  const pre_bar = cycle
  const post_bar = cycle
  return {
    cycle,
    phrase,
    count_in,
    lead,
    pre: pre_bar,
    post: post_bar,
    lag,
    beat,
    origin: beat,
    start_at: Math.max(0, beat - pre_bar - lag),
    stop_at: Math.max(0, beat + phrase + post_bar - lag),
  }
}
