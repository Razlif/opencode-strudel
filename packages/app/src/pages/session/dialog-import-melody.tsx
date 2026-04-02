import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { createSignal, For, onCleanup, Show } from "solid-js"
import { clean } from "@/pages/session/transcribe/clean"
import { capturePlan } from "@/pages/session/transcribe/capture-timing"
import { decode } from "@/pages/session/transcribe/decode"
import { format } from "@/pages/session/transcribe/format"
import { transcribeTake } from "@/pages/session/transcribe/melody-api"
import { click } from "@/pages/session/transcribe/metronome"
import { record } from "@/pages/session/transcribe/record-melody"
import { analyze, transcribe } from "@/pages/session/transcribe/basic-pitch"
import type { GridNote, NoteEvent, PitchOpts, PitchRaw } from "@/pages/session/transcribe/types"

const names = ["c", "c#", "d", "eb", "e", "f", "f#", "g", "ab", "a", "bb", "b"]
const tone = (n: number) => `${names[n % 12]}${Math.floor(n / 12) - 1}`
const sec = (n: number) => n.toFixed(2)
const presets = {
  Balanced: { onset: 0.3, frame: 0.3, min: 8, infer: true, melodia: false, energy: 11, minFreq: 110, maxFreq: 900 },
  Strict: { onset: 0.35, frame: 0.35, min: 10, infer: true, melodia: false, energy: 9, minFreq: 130, maxFreq: 900 },
  Legato: { onset: 0.28, frame: 0.25, min: 8, infer: true, melodia: false, energy: 14, minFreq: 110, maxFreq: 900 },
} satisfies Record<string, PitchOpts>
const rawText = (list: NoteEvent[]) =>
  list
    .slice(0, 24)
    .map((item) => `${tone(item.midi)} start=${sec(item.startSec)} dur=${sec(item.durationSec)} conf=${(item.confidence ?? 0).toFixed(2)}`)
    .join("\n")
const gridText = (list: GridNote[]) =>
  list
    .slice(0, 24)
    .map((item) => `${tone(item.midi)} step=${item.start} len=${item.len} conf=${(item.confidence ?? 0).toFixed(2)}`)
    .join("\n")
type Mode = "record" | "upload"

export function DialogImportMelody(props: {
  bpm: number
  div: number
  start?: Mode
  onInsert: (
    code: string,
    meta: {
      raw: number
      kept: number
      dropped: number
      cropped: number
      collisions: number
    },
  ) => void
  onClose: () => void
}) {
  const [file, setFile] = createSignal<File>()
  const [mode, setMode] = createSignal<Mode>(props.start ?? "upload")
  const [busy, setBusy] = createSignal(false)
  const [err, setErr] = createSignal("")
  const [note, setNote] = createSignal("")
  const [code, setCode] = createSignal("")
  const [steps, setSteps] = createSignal("32")
  const [bars, setBars] = createSignal("2")
  const [count, setCount] = createSignal("1")
  const [monitor, setMonitor] = createSignal<"click" | "song" | "silent">("click")
  const [pick, setPick] = createSignal<keyof typeof presets>("Balanced")
  const [opts, setOpts] = createSignal<PitchOpts>(presets.Balanced)
  const [core, setCore] = createSignal<PitchRaw>()
  const [raw, setRaw] = createSignal<NoteEvent[]>([])
  const [grid, setGrid] = createSignal<GridNote[]>([])
  const [meta, setMeta] = createSignal({
    raw: 0,
    kept: 0,
    dropped: 0,
    cropped: 0,
    collisions: 0,
  })
  const [clip, setClip] = createSignal<{
    blob: Blob
    url: string
    size: number
    dur: number
    type: string
    beat: number
    origin: number
    pre: number
    lag: number
  }>()

  const dropClip = () => {
    const url = clip()?.url
    if (url) URL.revokeObjectURL(url)
    setClip()
  }

  onCleanup(dropClip)

  const build = (list: NoteEvent[], value = Number(steps()) || 32, span = Number(bars()) || 2) => {
    const next = clean(list, props.bpm, props.div, value, span)
    setGrid(next.notes)
    setMeta({
      raw: list.length,
      kept: next.notes.length,
      dropped: next.dropped,
      cropped: next.cropped,
      collisions: next.collisions,
    })
    if (!next.notes.length) {
      setCode("")
      setErr("No usable melody notes were found in the selected phrase length.")
      return
    }
    setErr("")
    setNote("")
    setCode(format(next.notes, value, span))
  }

  const retune = (raw: PitchRaw, next = opts()) => {
    const list = transcribe(raw, next)
    setRaw(list)
    build(list)
  }

  const load = (file: File) => {
    setBusy(true)
    setErr("")
    setNote("")
    setCode("")
    setCore()
    setRaw([])
    setGrid([])
    dropClip()
    decode(file)
      .then(analyze)
      .then((raw) => {
        setCore(raw)
        retune(raw)
      })
      .catch((err) => {
        setErr(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const take = () => {
    const span = Number(bars()) || 2
    const prep = Number(count()) || 1
    const plan = capturePlan(props.bpm, props.div, span, prep)
    const met = monitor() === "silent" ? undefined : click({ bpm: props.bpm, div: props.div, bars: span + 1, count: prep, lead: plan.lead })
    setBusy(true)
    setErr("")
    setNote(`Count-in started. Recording will begin in ${plan.count_in.toFixed(2)}s. Guard bars: ${plan.pre.toFixed(2)}s before and ${plan.post.toFixed(2)}s after. Phrase ${plan.phrase.toFixed(2)}s.`)
    setCode("")
    setCore()
    setRaw([])
    setGrid([])
    setFile()
    setMeta({
      raw: 0,
      kept: 0,
      dropped: 0,
      cropped: 0,
      collisions: 0,
    })
    dropClip()
    record(plan)
      .then((next) => {
        dropClip()
        setClip({
          blob: next.blob,
          url: URL.createObjectURL(next.blob),
          size: next.blob.size,
          dur: next.dur,
          type: next.blob.type || "audio/webm",
          beat: next.beat,
          origin: next.origin,
          pre: next.pre,
          lag: next.lag,
        })
        setErr("")
        setNote(`Recording captured. Beat 1 is ${next.beat.toFixed(2)}s into the clip. Review it, then click Send To Backend.`)
      })
      .catch((err) => {
        setErr(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        met?.stop()
        setBusy(false)
      })
  }

  const submitTake = () => {
    const item = clip()
    if (!item) return
    const span = Number(bars()) || 2
    setBusy(true)
    setErr("")
    setNote("Sending recorded clip to local melody backend...")
    transcribeTake(item.blob, {
      bpm: props.bpm,
      div: props.div,
      bars: span,
      steps: Number(steps()) || 32,
      origin: item.origin,
    })
      .then((hit) => {
        const list = hit.segmented_notes.map((item) => ({
          midi: item.midi,
          startSec: item.start_sec,
          durationSec: item.dur_sec,
          confidence: item.confidence,
        }))
        const grid = hit.quantized_notes.map((item) => ({
          midi: item.midi,
          start: item.start_step,
          len: item.len_steps,
          confidence: item.confidence,
        }))
        setRaw(list)
        setGrid(grid)
        setMeta({
          raw: hit.segmented_notes.length,
          kept: hit.quantized_notes.length,
          dropped: Math.max(0, hit.segmented_notes.length - hit.quantized_notes.length),
          cropped: hit.summary.cropped_notes,
          collisions: hit.summary.quantized_collisions_dropped,
        })
        setCode(hit.strudel)
        setErr("")
        setNote(
          monitor() === "song"
            ? `Backend ready. Contour: ${hit.contour.quantized || hit.contour.segmented}. JSON: ${hit.latest_json ?? hit.debug_json ?? "saved on server"}. CSV: ${hit.latest_csv ?? hit.debug_csv ?? "saved on server"}. Song monitor is not wired yet, so this take used click timing only.`
            : `Backend ready. Contour: ${hit.contour.quantized || hit.contour.segmented}. JSON: ${hit.latest_json ?? hit.debug_json ?? "saved on server"}. CSV: ${hit.latest_csv ?? hit.debug_csv ?? "saved on server"}`,
        )
      })
      .catch((err) => {
        setErr(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setBusy(false)
      })
  }

  return (
    <Dialog
      title="Import Melody"
      fit
      class="w-[min(calc(100vw-32px),960px)] [&_[data-slot=dialog-body]]:overflow-y-auto [&_[data-slot=dialog-body]]:overflow-x-hidden"
    >
      <div class="flex w-full min-w-0 flex-col gap-4 pl-6 pr-2.5 pb-3">
        <div class="flex flex-col gap-1">
          <span class="text-14-regular text-text-strong">
            {mode() === "record" ? "Record one monophonic melody take." : "Upload one monophonic melody clip."}
          </span>
          <span class="text-12-regular text-text-weak">
            {mode() === "record"
              ? "Recording uses the current BPM and beats-per-cycle, with a short pre-roll before beat 1 for cleaner onset detection."
              : "The import uses the current BPM and beats-per-cycle and maps the phrase into the selected bar length."}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button size="small" variant={mode() === "record" ? "primary" : "ghost"} onClick={() => setMode("record")}>
            Record
          </Button>
          <Button size="small" variant={mode() === "upload" ? "primary" : "ghost"} onClick={() => setMode("upload")}>
            Upload
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-12-regular text-text-weaker">Preset</span>
          <div class="flex flex-wrap gap-2">
            <For each={Object.keys(presets) as (keyof typeof presets)[]}>
              {(name) => (
                <Button
                  size="small"
                  variant={pick() === name ? "primary" : "ghost"}
                  onClick={() => {
                    setPick(name)
                    setOpts(presets[name])
                    const raw = core()
                    if (raw) retune(raw, presets[name])
                  }}
                >
                  {name}
                </Button>
              )}
            </For>
          </div>
        </div>
        <label class="flex items-center gap-2 text-12-regular text-text-weaker">
          <span>Grid/Bar</span>
          <input
            inputMode="numeric"
            value={steps()}
            onInput={(event) => setSteps(event.currentTarget.value)}
            onBlur={() => {
              if (!raw().length) return
              build(raw())
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.currentTarget.blur()
            }}
            class="h-8 w-12 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
          />
        </label>
        <label class="flex items-center gap-2 text-12-regular text-text-weaker">
          <span>Bars</span>
          <select
            value={bars()}
            onChange={(event) => {
              setBars(event.currentTarget.value)
              if (!raw().length) return
              build(raw())
            }}
            class="h-8 w-14 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
          </select>
        </label>
        <Show when={mode() === "record"}>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Count-in Bars</span>
              <select
                value={count()}
                onChange={(event) => setCount(event.currentTarget.value)}
                class="h-8 w-14 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Monitor</span>
              <select
                value={monitor()}
                onChange={(event) => setMonitor(event.currentTarget.value as "click" | "song" | "silent")}
                class="h-8 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
              >
                <option value="click">click</option>
                <option value="song">click + song</option>
                <option value="silent">silent</option>
              </select>
            </label>
          </div>
        </Show>
        <Show when={mode() === "upload"}>
          <label class="flex flex-col gap-2">
            <span class="text-12-regular text-text-weaker">Audio file</span>
            <input
              type="file"
              accept=".wav,.mp3,.ogg,.flac,audio/*"
              class="rounded-md border border-border-weak-base bg-background-base px-3 py-2 text-12-regular text-text-strong"
              onInput={(event) => {
                const file = event.currentTarget.files?.[0]
                setFile(file)
                if (!file) return
                load(file)
              }}
            />
          </label>
        </Show>
        <Show when={mode() === "record"}>
          <div class="flex flex-col gap-2 rounded-md border border-border-weak-base bg-background-base px-3 py-3">
            <div class="text-12-regular text-text-weaker">
              Use headphones if possible. Record mode quantizes from beat 1 inside the clip, not from the first detected note.
            </div>
            <div class="flex items-center justify-between gap-2">
              <div class="text-12-regular text-text-weaker">
                Phrase: {capturePlan(props.bpm, props.div, Number(bars()) || 2, Number(count()) || 1).phrase.toFixed(2)}s, guard bars:{" "}
                {capturePlan(props.bpm, props.div, Number(bars()) || 2, Number(count()) || 1).pre.toFixed(2)}s before,{" "}
                {capturePlan(props.bpm, props.div, Number(bars()) || 2, Number(count()) || 1).post.toFixed(2)}s after, count-in:{" "}
                {capturePlan(props.bpm, props.div, Number(bars()) || 2, Number(count()) || 1).count_in.toFixed(2)}s
              </div>
              <Button size="small" variant="primary" disabled={busy()} onClick={take}>
                {busy() ? "Recording..." : "Start Recording"}
              </Button>
            </div>
            <Show when={clip()}>
              {(item) => (
                <div class="min-w-0 overflow-hidden rounded-md border border-success-base/40 bg-success-base/10 px-3 py-2 text-12-regular text-success-base">
                  <div class="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div class="min-w-0">
                    <div class="break-all">
                      Clip captured: {(item().size / 1024).toFixed(1)} KB, {item().dur.toFixed(2)}s, {item().type || "audio blob"}
                    </div>
                    <audio controls src={item().url} class="mt-2 block w-full max-w-full min-w-0" />
                  </div>
                  <div class="flex min-w-0 flex-wrap justify-end gap-2 lg:self-end">
                    <Button size="small" variant="ghost" disabled={busy()} onClick={take}>
                      Retake
                    </Button>
                    <Button size="small" variant="primary" disabled={busy()} onClick={submitTake}>
                      {busy() ? "Sending..." : "Send To Backend"}
                    </Button>
                  </div>
                  </div>
                </div>
              )}
            </Show>
          </div>
        </Show>
        <Show when={mode() === "upload"}>
          <div class="grid grid-cols-4 gap-2">
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Onset</span>
              <input
                inputMode="decimal"
                value={String(opts().onset)}
                onBlur={(event) => {
                  const next = { ...opts(), onset: Number(event.currentTarget.value) || opts().onset }
                  setOpts(next)
                  const raw = core()
                  if (raw) retune(raw, next)
                }}
                class="h-8 w-14 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
              />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Frame</span>
              <input
                inputMode="decimal"
                value={String(opts().frame)}
                onBlur={(event) => {
                  const next = { ...opts(), frame: Number(event.currentTarget.value) || opts().frame }
                  setOpts(next)
                  const raw = core()
                  if (raw) retune(raw, next)
                }}
                class="h-8 w-14 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
              />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Min Frames</span>
              <input
                inputMode="numeric"
                value={String(opts().min)}
                onBlur={(event) => {
                  const next = { ...opts(), min: Number(event.currentTarget.value) || opts().min }
                  setOpts(next)
                  const raw = core()
                  if (raw) retune(raw, next)
                }}
                class="h-8 w-14 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
              />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Min Freq</span>
              <input
                inputMode="numeric"
                value={String(opts().minFreq ?? "")}
                onBlur={(event) => {
                  const next = { ...opts(), minFreq: Number(event.currentTarget.value) || undefined }
                  setOpts(next)
                  const raw = core()
                  if (raw) retune(raw, next)
                }}
                class="h-8 w-16 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
              />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Max Freq</span>
              <input
                inputMode="numeric"
                value={String(opts().maxFreq ?? "")}
                onBlur={(event) => {
                  const next = { ...opts(), maxFreq: Number(event.currentTarget.value) || undefined }
                  setOpts(next)
                  const raw = core()
                  if (raw) retune(raw, next)
                }}
                class="h-8 w-16 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
              />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Energy</span>
              <input
                inputMode="numeric"
                value={String(opts().energy ?? "")}
                onBlur={(event) => {
                  const next = { ...opts(), energy: Number(event.currentTarget.value) || undefined }
                  setOpts(next)
                  const raw = core()
                  if (raw) retune(raw, next)
                }}
                class="h-8 w-16 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
              />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <input
                type="checkbox"
                checked={opts().infer}
                onChange={(event) => {
                  const next = { ...opts(), infer: event.currentTarget.checked }
                  setOpts(next)
                  const raw = core()
                  if (raw) retune(raw, next)
                }}
              />
              <span>Infer Onsets</span>
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <input
                type="checkbox"
                checked={opts().melodia}
                onChange={(event) => {
                  const next = { ...opts(), melodia: event.currentTarget.checked }
                  setOpts(next)
                  const raw = core()
                  if (raw) retune(raw, next)
                }}
              />
              <span>Melodia Trick</span>
            </label>
          </div>
        </Show>
        <div class="grid grid-cols-5 gap-2 rounded-md border border-border-weak-base bg-background-base px-3 py-2 text-12-regular text-text-weaker">
          <div>Raw {meta().raw}</div>
          <div>Kept {meta().kept}</div>
          <div>Dropped {meta().dropped}</div>
          <div>Cropped {meta().cropped}</div>
          <div>Collisions {meta().collisions}</div>
        </div>
        <Show when={err()}>
          {(value) => <div class="rounded-md border border-danger-base/40 bg-danger-base/10 px-3 py-2 text-12-regular text-danger-base">{value()}</div>}
        </Show>
        <Show when={note()}>
          {(value) => <div class="rounded-md border border-success-base/40 bg-success-base/10 px-3 py-2 text-12-regular text-success-base">{value()}</div>}
        </Show>
        <Show when={busy()}>
          <div class="rounded-md border border-warning-base/40 bg-warning-base/10 px-3 py-2 text-12-regular text-warning-base">
            {mode() === "record" ? "Recording melody..." : "Transcribing audio..."}
          </div>
        </Show>
        <div class="grid gap-3 xl:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span class="text-12-regular text-text-weaker">Raw note events</span>
            <textarea
              readOnly
              value={rawText(raw())}
              class="h-48 w-full resize-y rounded-md border border-border-weak-base bg-background-base px-2 py-2 text-12-regular text-text-strong outline-none"
              style={{ "font-family": "var(--font-mono)" }}
            />
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-12-regular text-text-weaker">Cleaned grid notes</span>
            <textarea
              readOnly
              value={gridText(grid())}
              class="h-48 w-full resize-y rounded-md border border-border-weak-base bg-background-base px-2 py-2 text-12-regular text-text-strong outline-none"
              style={{ "font-family": "var(--font-mono)" }}
            />
          </label>
        </div>
        <label class="flex flex-col gap-2">
          <span class="text-12-regular text-text-weaker">Generated Strudel</span>
          <textarea
            readOnly
            value={code()}
            class="h-32 w-full resize-y rounded-md border border-border-weak-base bg-background-base px-2 py-2 text-12-regular text-text-strong outline-none"
            style={{ "font-family": "var(--font-mono)" }}
          />
        </label>
        <div class="flex justify-end gap-2">
          <Button variant="ghost" size="large" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="large"
            disabled={(!file() && mode() === "upload") || !code() || busy()}
            onClick={() => props.onInsert(code(), meta())}
          >
            Insert
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
