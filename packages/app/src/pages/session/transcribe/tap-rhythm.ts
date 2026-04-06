import { tapRhythmPlan } from "@/pages/session/transcribe/capture-timing"
import { splitTapRhythmBars } from "@/pages/session/transcribe/tap-rhythm-format"

export type TapRhythmSeed = {
  bars: number
  stepsPerBar: number
  hits: number[]
  sample: string
  bank?: string
  notes?: string
}

export type TapRhythmStage = "idle" | "count_in" | "recording" | "post_roll" | "done" | "cancelled"

export type TapRhythmUpdate = {
  stage: TapRhythmStage
  message: string
  countdown?: number | "GO"
  progress: number
}

export type TapRhythmAcceptedTap = {
  count: number
  phraseTime: number
}

export type TapRhythmCapture = TapRhythmSeed & {
  rawTapTimes: number[]
  key: string
  countBars: number
  postBars: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function quantizeTapHits(taps: number[], bpm: number, div: number, bars: number, stepsPerBar: number) {
  const step = (60 / bpm) * div / stepsPerBar
  const totalSteps = Math.max(1, bars * stepsPerBar)
  const out = new Set<number>()
  taps.forEach((tap) => {
    const index = Math.round(tap / step)
    if (index < 0 || index >= totalSteps) return
    out.add(index)
  })
  return [...out].sort((a, b) => a - b)
}

export function buildTapRhythmPrompt(seed: TapRhythmSeed) {
  const grouped = splitTapRhythmBars(seed)
  const lines = [
    "Use this tapped rhythm as the core motif for a drum groove in the current canonical song file.",
    "Before editing, read strudel-studio-workspace/composition_tutorial.md and strudel-studio-workspace/samples/sound-banks.md.",
    `Bars: ${seed.bars}`,
    `Steps per bar: ${seed.stepsPerBar}`,
    `Seed sample: ${seed.sample}`,
    `Hit steps: ${seed.hits.length ? seed.hits.join(", ") : "none"}`,
  ]
  grouped.forEach((bar, index) => lines.push(`Bar ${index + 1} seed: ${bar}`))
  if (seed.bank?.trim()) lines.push(`Bank: ${seed.bank.trim()}`)
  if (seed.notes?.trim()) lines.push(`User notes: ${seed.notes.trim()}`)
  lines.push("The tapped seed rhythm is the exact base-drum groove.")
  lines.push("Keep the base-drum pattern exactly as given: do not move, remove, add, or substitute any of its hits.")
  lines.push("Do not add any extra kick hits beyond the tapped pattern.")
  lines.push("Use the tapped seed as its own dedicated kick track, not as a generic timing suggestion.")
  lines.push("You may only layer an appropriate snare or clap track and an optional hi-hat track around it.")
  lines.push("Do not add extra percussion tracks, tom tracks, fills, or other drum-part embellishments unless the user explicitly asks for them.")
  lines.push("Follow the composition tutorial's canonical song style and readable track-role structure instead of guessing a groove shape.")
  lines.push("Preserve the pulse shape unless the user notes request a variation.")
  lines.push("Expand it into a fuller groove in the focused section of the canonical song.")
  return lines.join("\n")
}

export function startTapRhythmCapture(opts: {
  bpm: number
  div: number
  bars: number
  stepsPerBar: number
  key?: string
  countBars?: number
  postBars?: number
  lead?: number
  sample?: string
  bank?: string
  notes?: string
  onUpdate?: (update: TapRhythmUpdate) => void
  onTap?: (tap: TapRhythmAcceptedTap) => void
}) {
  const countBars = opts.countBars ?? 2
  const postBars = opts.postBars ?? 1
  const key = opts.key ?? "Space"
  const plan = tapRhythmPlan(opts.bpm, opts.div, opts.bars, opts.stepsPerBar, countBars, postBars, opts.lead ?? 0.12)
  const taps: number[] = []
  const startedAt = performance.now() + plan.lead * 1000
  const phraseStartMs = startedAt + plan.count_in * 1000
  const phraseEndMs = phraseStartMs + plan.phrase * 1000
  const doneMs = phraseEndMs + plan.post * 1000
  const beatMs = plan.beat * 1000
  let stage: TapRhythmStage = "idle"
  let settled = false
  let interval = 0
  let timer = 0
  let rejectPromise: ((reason?: unknown) => void) | undefined

  const emit = (next: TapRhythmStage, now = performance.now()) => {
    stage = next
    if (next === "count_in") {
      const finalBarStart = phraseStartMs - plan.cycle * 1000
      if (now >= finalBarStart) {
        const countdown = clamp(Math.ceil((phraseStartMs - now) / beatMs), 1, opts.div)
        opts.onUpdate?.({
          stage: next,
          message: `${countdown}`,
          countdown,
          progress: clamp((now - startedAt) / Math.max(1, phraseStartMs - startedAt), 0, 1),
        })
        return
      }
      opts.onUpdate?.({
        stage: next,
        message: `Get ready. Count-in started. Tap ${key === "Space" ? "Space" : key}.`,
        progress: clamp((now - startedAt) / Math.max(1, phraseStartMs - startedAt), 0, 1),
      })
      return
    }
    if (next === "recording") {
      const intro = now - phraseStartMs < Math.min(beatMs * 0.5, 300)
      opts.onUpdate?.({
        stage: next,
        message: `Tap ${key === "Space" ? "Space" : key} now.`,
        countdown: intro ? "GO" : undefined,
        progress: clamp((now - phraseStartMs) / Math.max(1, phraseEndMs - phraseStartMs), 0, 1),
      })
      return
    }
    if (next === "post_roll") {
      opts.onUpdate?.({
        stage: next,
        message: "Recording finished. Hold on while the post bar plays.",
        progress: clamp((now - phraseEndMs) / Math.max(1, doneMs - phraseEndMs), 0, 1),
      })
      return
    }
    opts.onUpdate?.({
      stage: next,
      message: next === "done" ? "Tap rhythm ready." : "Tap rhythm cancelled.",
      progress: 1,
    })
  }

  const finish = (value: TapRhythmCapture, resolve: (value: TapRhythmCapture) => void) => {
    if (settled) return
    settled = true
    window.removeEventListener("keydown", onKeyDown, true)
    if (interval) window.clearInterval(interval)
    if (timer) window.clearTimeout(timer)
    emit("done")
    resolve(value)
  }

  const cancel = () => {
    if (settled) return
    settled = true
    window.removeEventListener("keydown", onKeyDown, true)
    if (interval) window.clearInterval(interval)
    if (timer) window.clearTimeout(timer)
    emit("cancelled")
    rejectPromise?.(new Error("Tap rhythm cancelled"))
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code !== key) return
    event.preventDefault()
    event.stopPropagation()
    const now = performance.now()
    if (now < phraseStartMs || now >= phraseEndMs) return
    const phraseTime = (now - phraseStartMs) / 1000
    taps.push(phraseTime)
    opts.onTap?.({
      count: taps.length,
      phraseTime,
    })
  }

  const promise = new Promise<TapRhythmCapture>((resolve, reject) => {
    rejectPromise = reject
    window.addEventListener("keydown", onKeyDown, true)
    emit("count_in", performance.now())
    interval = window.setInterval(() => {
      if (settled) return
      const now = performance.now()
      const next =
        now < phraseStartMs ? "count_in" :
        now < phraseEndMs ? "recording" :
        now < doneMs ? "post_roll" :
        "done"
      if (next !== stage) emit(next, now)
      else emit(stage, now)
    }, 50)

    timer = window.setTimeout(() => {
      const hits = quantizeTapHits(taps, opts.bpm, opts.div, opts.bars, opts.stepsPerBar)
      finish(
        {
          bars: opts.bars,
          stepsPerBar: opts.stepsPerBar,
          hits,
          rawTapTimes: taps.slice(),
          key,
          countBars,
          postBars,
          sample: opts.sample?.trim() || "bd",
          bank: opts.bank?.trim() || undefined,
          notes: opts.notes?.trim() || undefined,
        },
        resolve,
      )
    }, Math.max(1, doneMs - performance.now()))
  })

  return {
    cancel,
    promise,
    plan,
  }
}
