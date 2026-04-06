export const cycleSec = (bpm: number, div: number) => (60 / bpm) * div

export const phraseSec = (bpm: number, div: number, bars: number) => cycleSec(bpm, div) * bars

export const stepSec = (bpm: number, div: number, steps: number) => cycleSec(bpm, div) / steps

export function tapRhythmPlan(
  bpm: number,
  div: number,
  bars: number,
  stepsPerBar: number,
  countBars = 2,
  postBars = 1,
  lead = 0.12,
) {
  const beat = 60 / bpm
  const cycle = cycleSec(bpm, div)
  const phrase = cycle * bars
  const count_in = cycle * countBars
  const post = cycle * postBars
  const phrase_start = lead + count_in
  const phrase_end = phrase_start + phrase
  const stop_at = phrase_end + post
  return {
    beat,
    cycle,
    phrase,
    count_in,
    post,
    lead,
    bars,
    countBars,
    postBars,
    stepsPerBar,
    phrase_start,
    phrase_end,
    stop_at,
  }
}

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
