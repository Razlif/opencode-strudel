import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { createMemo, createSignal, onCleanup, Show } from "solid-js"
import { banks } from "@/pages/session/strudel-runtime"
import { click } from "@/pages/session/transcribe/metronome"
import { formatTapRhythm, summarizeTapRhythm } from "@/pages/session/transcribe/tap-rhythm-format"
import { startTapRhythmCapture, type TapRhythmCapture } from "@/pages/session/transcribe/tap-rhythm"

const blip = (ctx: AudioContext, when: number, opts: { freq: number; gain: number; duration: number }) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "square"
  osc.frequency.value = opts.freq
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(opts.gain, when + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + opts.duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + opts.duration + 0.02)
}

export function DialogTapRhythm(props: {
  bpm: number
  div: number
  onInsert: (code: string, seed: TapRhythmCapture) => void
  onSendToAI: (seed: TapRhythmCapture, code: string) => void
  onClose: () => void
}) {
  const [barsCount, setBarsCount] = createSignal("2")
  const [subdivision, setSubdivision] = createSignal("4")
  const [sample, setSample] = createSignal("bd")
  const [bank, setBank] = createSignal("")
  const [notes, setNotes] = createSignal("")
  const [busy, setBusy] = createSignal(false)
  const [message, setMessage] = createSignal("Tap Space. The flow is always 2 bars count-in, your phrase, then 1 post bar.")
  const [countdown, setCountdown] = createSignal<number | "GO">()
  const [capture, setCapture] = createSignal<TapRhythmCapture>()
  const [err, setErr] = createSignal("")
  const [previewing, setPreviewing] = createSignal(false)
  const [tapCount, setTapCount] = createSignal(0)
  const [tapPulse, setTapPulse] = createSignal(false)
  let met: { stop(): void } | undefined
  let active: { cancel(): void } | undefined
  let tapPulseTimer: number | undefined
  let previewCtx: AudioContext | undefined
  let previewTimer: number | undefined

  const code = createMemo(() => {
    const hit = capture()
    if (!hit) return ""
    return formatTapRhythm(hit)
  })

  const stopPreview = () => {
    if (previewTimer) {
      window.clearTimeout(previewTimer)
      previewTimer = undefined
    }
    if (previewCtx) {
      void previewCtx.close()
      previewCtx = undefined
    }
    setPreviewing(false)
  }

  const pulseTap = () => {
    setTapPulse(true)
    if (tapPulseTimer) window.clearTimeout(tapPulseTimer)
    tapPulseTimer = window.setTimeout(() => setTapPulse(false), 110)
  }

  const stopAll = () => {
    active?.cancel()
    active = undefined
    met?.stop()
    met = undefined
  }

  onCleanup(() => {
    stopAll()
    stopPreview()
    if (tapPulseTimer) window.clearTimeout(tapPulseTimer)
  })

  const start = () => {
    stopAll()
    stopPreview()
    setBusy(true)
    setErr("")
    setCapture()
    setCountdown()
    setTapCount(0)
    setTapPulse(false)
    const bars = Number(barsCount()) || 2
    const stepsPerBar = props.div * (Number(subdivision()) || 4)
    const next = startTapRhythmCapture({
      bpm: props.bpm,
      div: props.div,
      bars,
      stepsPerBar,
      sample: sample(),
      bank: bank(),
      notes: notes(),
      onUpdate(update) {
        setMessage(update.message)
        setCountdown(update.countdown)
      },
      onTap(tap) {
        setTapCount(tap.count)
        pulseTap()
      },
    })
    active = next
    met = click({
      bpm: props.bpm,
      div: props.div,
      bars: bars + 1,
      count: 2,
      lead: next.plan.lead,
    })
    void next.promise
      .then((result) => {
        setCapture(result)
      })
      .catch((error) => {
        if (error instanceof Error && error.message === "Tap rhythm cancelled") return
        setErr(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        stopAll()
        setBusy(false)
        setCountdown()
      })
  }

  const togglePreview = async () => {
    const seed = capture()
    if (!seed || !code()) return
    if (previewing()) {
      stopPreview()
      return
    }
    try {
      setErr("")
      stopPreview()
      previewCtx = new AudioContext()
      if (previewCtx.state === "suspended") await previewCtx.resume()
      const beat = 60 / props.bpm
      const step = (beat * props.div) / seed.stepsPerBar
      const startAt = previewCtx.currentTime + 0.08
      seed.hits.forEach((hit) => {
        blip(previewCtx!, startAt + hit * step, {
          freq: 1480,
          gain: 0.14,
          duration: 0.07,
        })
      })
      previewTimer = window.setTimeout(() => {
        stopPreview()
      }, Math.ceil((seed.bars * props.div * beat + 0.2) * 1000))
      setPreviewing(true)
    } catch (error) {
      stopPreview()
      setErr(error instanceof Error ? error.message : "Could not start the seed preview.")
    }
  }

  return (
    <Dialog title="Tap Rhythm" fit class="w-[min(calc(100vw-32px),760px)]">
      <div class="flex flex-col gap-4 px-6 pb-4">
        <div class="text-12-regular text-text-weak">
          Tap one key only: <span class="font-medium text-text-strong">Space</span>. The app always gives a 2-bar count-in, records the chosen phrase length, then plays 1 extra metronome bar after recording ends.
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex items-center gap-2 text-12-regular text-text-weaker">
            <span>Bars</span>
            <select value={barsCount()} onChange={(event) => setBarsCount(event.currentTarget.value)} class="h-8 w-16 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-12-regular text-text-weaker">
            <span>Subdivisions/Beat</span>
            <select value={subdivision()} onChange={(event) => setSubdivision(event.currentTarget.value)} class="h-8 w-24 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none">
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="8">8</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-12-regular text-text-weaker">
            <span>Seed sample</span>
            <input value={sample()} onInput={(event) => setSample(event.currentTarget.value)} class="h-8 w-24 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none" />
          </label>
          <label class="flex items-center gap-2 text-12-regular text-text-weaker">
            <span>Bank</span>
            <select value={bank()} onChange={(event) => setBank(event.currentTarget.value)} class="h-8 min-w-0 flex-1 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none">
              <option value="">None</option>
              {banks.map((item) => (
                <option value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-12-regular text-text-weaker">Notes for AI</span>
          <textarea
            value={notes()}
            onInput={(event) => setNotes(event.currentTarget.value)}
            placeholder="Optional groove notes for the agent."
            class="h-24 w-full resize-y rounded-md border border-border-weak-base bg-background-base px-2 py-2 text-12-regular text-text-strong outline-none"
          />
        </label>

        <div
          class="rounded-md border px-4 py-4 text-center transition-all duration-100"
          classList={{
            "border-success-base bg-success-base/15 shadow-[0_0_28px_rgba(34,197,94,.2)]": tapPulse(),
            "border-border-weak-base bg-background-base": !tapPulse(),
          }}
        >
          <div class="text-12-medium uppercase tracking-[0.12em] text-text-weaker">Capture Status</div>
          <Show when={countdown() !== undefined} fallback={<div class="mt-2 text-14-regular text-text-strong">{message()}</div>}>
            <div class="mt-2 text-[2.5rem] font-semibold leading-none text-success-base">{countdown()}</div>
          </Show>
          <div class="mt-2 text-12-regular text-text-weaker">Tap Space only during the phrase window.</div>
          <div class="mt-1 text-12-regular text-text-weaker">Current grid: {props.div * (Number(subdivision()) || 4)} steps per bar ({props.div} beats x {subdivision()} subdivisions).</div>
          <div class="mt-3 rounded-md border px-3 py-2 transition-all duration-100"
            classList={{
              "border-success-base/60 bg-success-base/10 text-success-base": tapPulse(),
              "border-border-weak-base bg-background-stronger text-text-weaker": !tapPulse(),
            }}
          >
            <div class="text-11-medium uppercase tracking-[0.12em]">{tapPulse() ? "Tap Registered" : "Waiting For Tap"}</div>
            <div class="mt-1 text-12-regular">Accepted taps: <span class="text-text-strong">{tapCount()}</span></div>
          </div>
        </div>

        <Show when={err()}>
          {(value) => <div class="rounded-md border border-danger-base/40 bg-danger-base/10 px-3 py-2 text-12-regular text-danger-base">{value()}</div>}
        </Show>

        <Show when={capture()}>
          {(seed) => (
            <div class="flex flex-col gap-3 rounded-md border border-success-base/40 bg-success-base/10 px-3 py-3">
              <div class="text-12-regular text-success-base">{summarizeTapRhythm(seed())}</div>
              <label class="flex flex-col gap-2">
                <span class="text-12-regular text-text-weaker">Quantized hit steps</span>
                <textarea
                  readOnly
                  value={seed().hits.join(", ")}
                  class="h-16 w-full resize-none rounded-md border border-border-weak-base bg-background-base px-2 py-2 text-12-regular text-text-strong outline-none"
                  style={{ "font-family": "var(--font-mono)" }}
                />
              </label>
              <label class="flex flex-col gap-2">
                <span class="text-12-regular text-text-weaker">Generated scaffold</span>
                <textarea
                  readOnly
                  value={code()}
                  class="h-24 w-full resize-none rounded-md border border-border-weak-base bg-background-base px-2 py-2 text-12-regular text-text-strong outline-none"
                  style={{ "font-family": "var(--font-mono)" }}
                />
              </label>
              <div class="text-12-regular text-text-weaker">Preview plays the captured rhythm shape only. The default seed token is <span class="font-medium text-text-strong">bd</span> so the rhythm starts as a kick-first scaffold.</div>
            </div>
          )}
        </Show>

        <div class="flex justify-between gap-2">
          <Button variant="secondary" size="large" disabled={busy()} onClick={start}>
            {busy() ? "Capturing..." : "Start Tapping"}
          </Button>
          <div class="flex gap-2">
            <Button variant="ghost" size="large" onClick={props.onClose}>
              Cancel
            </Button>
            <Button variant="ghost" size="large" disabled={!capture() || !code() || busy()} onClick={() => void togglePreview()}>
              {previewing() ? "Stop Preview" : "Play Preview"}
            </Button>
            <Button variant="secondary" size="large" disabled={!capture() || busy()} onClick={() => capture() && props.onSendToAI(capture()!, code())}>
              Send To AI
            </Button>
            <Button variant="primary" size="large" disabled={!capture() || !code() || busy()} onClick={() => capture() && props.onInsert(code(), capture()!)}>
              Insert As Track
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
