import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { createSignal, For, onCleanup, Show } from "solid-js"
import { capturePlan } from "@/pages/session/transcribe/capture-timing"
import { transcribeFile, transcribeTake, type BasicPitchOverrides, type MelodyResult, type TranscribePreset } from "@/pages/session/transcribe/melody-api"
import { click } from "@/pages/session/transcribe/metronome"
import { record } from "@/pages/session/transcribe/record-melody"
import type { GridNote, NoteEvent } from "@/pages/session/transcribe/types"

const names = ["c", "c#", "d", "eb", "e", "f", "f#", "g", "ab", "a", "bb", "b"]
const tone = (n: number) => `${names[n % 12]}${Math.floor(n / 12) - 1}`
const sec = (n: number) => n.toFixed(2)
const STEPS_PER_BAR = 16
const COUNT_IN_BARS = 2
const presets = {
  "Auto Analyze": "auto_analyze_audio",
  Balanced: "balanced",
  "Solo Vocals": "solo_vocals",
} satisfies Record<string, TranscribePreset>
const presetSettings: Record<keyof typeof presets, Required<BasicPitchOverrides>> = {
  "Auto Analyze": {
    onset_threshold: 0.5,
    frame_threshold: 0.3,
    minimum_note_length: 128,
    minimum_frequency: 60,
    maximum_frequency: 4000,
    infer_onsets: true,
    melodia_trick: true,
    multiple_pitch_bends: false,
  },
  Balanced: {
    onset_threshold: 0.5,
    frame_threshold: 0.3,
    minimum_note_length: 128,
    minimum_frequency: 60,
    maximum_frequency: 4000,
    infer_onsets: true,
    melodia_trick: true,
    multiple_pitch_bends: false,
  },
  "Solo Vocals": {
    onset_threshold: 0.4,
    frame_threshold: 0.3,
    minimum_note_length: 100,
    minimum_frequency: 80,
    maximum_frequency: 1200,
    infer_onsets: true,
    melodia_trick: true,
    multiple_pitch_bends: true,
  },
}
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
  const [bars, setBars] = createSignal("2")
  const [pick, setPick] = createSignal<keyof typeof presets>("Solo Vocals")
  const [separateVocals, setSeparateVocals] = createSignal(false)
  const [showAdvanced, setShowAdvanced] = createSignal(false)
  const [onsetThreshold, setOnsetThreshold] = createSignal(String(presetSettings["Solo Vocals"].onset_threshold))
  const [frameThreshold, setFrameThreshold] = createSignal(String(presetSettings["Solo Vocals"].frame_threshold))
  const [minimumNoteLength, setMinimumNoteLength] = createSignal(String(presetSettings["Solo Vocals"].minimum_note_length))
  const [minimumFrequency, setMinimumFrequency] = createSignal(String(presetSettings["Solo Vocals"].minimum_frequency))
  const [maximumFrequency, setMaximumFrequency] = createSignal(String(presetSettings["Solo Vocals"].maximum_frequency))
  const [inferOnsets, setInferOnsets] = createSignal(presetSettings["Solo Vocals"].infer_onsets)
  const [melodiaTrick, setMelodiaTrick] = createSignal(presetSettings["Solo Vocals"].melodia_trick)
  const [multiplePitchBends, setMultiplePitchBends] = createSignal(presetSettings["Solo Vocals"].multiple_pitch_bends)
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

  const resetResult = () => {
    setErr("")
    setNote("")
    setCode("")
    setRaw([])
    setGrid([])
    setMeta({
      raw: 0,
      kept: 0,
      dropped: 0,
      cropped: 0,
      collisions: 0,
    })
  }

  const dropClip = () => {
    const url = clip()?.url
    if (url) URL.revokeObjectURL(url)
    setClip()
  }

  onCleanup(dropClip)

  const applyPreset = (name: keyof typeof presets) => {
    const hit = presetSettings[name]
    setPick(name)
    setOnsetThreshold(String(hit.onset_threshold))
    setFrameThreshold(String(hit.frame_threshold))
    setMinimumNoteLength(String(hit.minimum_note_length))
    setMinimumFrequency(String(hit.minimum_frequency))
    setMaximumFrequency(String(hit.maximum_frequency))
    setInferOnsets(hit.infer_onsets)
    setMelodiaTrick(hit.melodia_trick)
    setMultiplePitchBends(hit.multiple_pitch_bends)
  }

  const basicPitch = (): BasicPitchOverrides => ({
    onset_threshold: Number(onsetThreshold()),
    frame_threshold: Number(frameThreshold()),
    minimum_note_length: Number(minimumNoteLength()),
    minimum_frequency: Number(minimumFrequency()),
    maximum_frequency: Number(maximumFrequency()),
    infer_onsets: inferOnsets(),
    melodia_trick: melodiaTrick(),
    multiple_pitch_bends: multiplePitchBends(),
  })

  const applyResult = (hit: MelodyResult) => {
    const list = hit.segmented_notes.map((item) => ({
      midi: item.midi,
      startSec: item.start_sec,
      durationSec: item.dur_sec,
      confidence: item.confidence,
    }))
    const nextGrid = hit.quantized_notes.map((item) => ({
      midi: item.midi,
      start: item.start_step,
      len: item.len_steps,
      confidence: item.confidence,
    }))
    setRaw(list)
    setGrid(nextGrid)
    setMeta({
      raw: hit.segmented_notes.length,
      kept: hit.quantized_notes.length,
      dropped: Math.max(0, hit.segmented_notes.length - hit.quantized_notes.length),
      cropped: hit.summary.cropped_notes,
      collisions: hit.summary.quantized_collisions_dropped,
    })
    if (!hit.quantized_notes.length) {
      setCode("")
      setErr("No usable melody notes were found in the selected phrase length.")
      return
    }
    setErr("")
    setCode(hit.strudel)
    setNote(
      `Backend ready. Preset: ${hit.used_config?.preset ?? presets[pick()]}. Contour: ${hit.contour.quantized || hit.contour.segmented}. JSON: ${hit.latest_json ?? hit.debug_json ?? "saved on server"}`,
    )
  }

  const submitFile = (file: File, origin = 0) => {
    setBusy(true)
    resetResult()
    setNote("Sending audio to local melody backend...")
    transcribeFile(file, {
      bpm: props.bpm,
      div: props.div,
      bars: Number(bars()) || 2,
      steps: STEPS_PER_BAR,
      origin,
      preset: presets[pick()],
      separateVocals: separateVocals(),
      basicPitch: basicPitch(),
    })
      .then(applyResult)
      .catch((err) => {
        setErr(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const take = () => {
    const span = Number(bars()) || 2
    const prep = COUNT_IN_BARS
    const plan = capturePlan(props.bpm, props.div, span, prep)
    const met = click({ bpm: props.bpm, div: props.div, bars: span + 1, count: prep, lead: plan.lead })
    setBusy(true)
    setErr("")
    setNote(`Count-in started. Recording will begin in ${plan.count_in.toFixed(2)}s. Guard bars: ${plan.pre.toFixed(2)}s before and ${plan.post.toFixed(2)}s after. Phrase ${plan.phrase.toFixed(2)}s.`)
    setCode("")
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
      steps: STEPS_PER_BAR,
      origin: item.origin,
      preset: presets[pick()],
      separateVocals: separateVocals(),
      basicPitch: basicPitch(),
    })
      .then(applyResult)
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
              ? "Recording uses the current BPM and beats-per-cycle, then sends the clip to the local Basic Pitch backend using the selected transcription profile."
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
                <Button size="small" variant={pick() === name ? "primary" : "ghost"} onClick={() => applyPreset(name)}>
                  {name}
                </Button>
              )}
            </For>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <label class="flex items-center gap-2 text-12-regular text-text-weaker">
            <input type="checkbox" checked={separateVocals()} onChange={(event) => setSeparateVocals(event.currentTarget.checked)} />
            <span>Separate vocals first</span>
          </label>
          <Button size="small" variant="ghost" onClick={() => setShowAdvanced((value) => !value)}>
            {showAdvanced() ? "Hide advanced" : "Show advanced"}
          </Button>
        </div>
        <Show when={showAdvanced()}>
          <div class="grid gap-3 rounded-md border border-border-weak-base bg-background-base px-3 py-3 xl:grid-cols-2">
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Onset</span>
              <input value={onsetThreshold()} onInput={(event) => setOnsetThreshold(event.currentTarget.value)} class="h-8 w-16 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none" />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Frame</span>
              <input value={frameThreshold()} onInput={(event) => setFrameThreshold(event.currentTarget.value)} class="h-8 w-16 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none" />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Min length ms</span>
              <input value={minimumNoteLength()} onInput={(event) => setMinimumNoteLength(event.currentTarget.value)} class="h-8 w-20 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none" />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Min freq</span>
              <input value={minimumFrequency()} onInput={(event) => setMinimumFrequency(event.currentTarget.value)} class="h-8 w-20 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none" />
            </label>
            <label class="flex items-center gap-2 text-12-regular text-text-weaker">
              <span>Max freq</span>
              <input value={maximumFrequency()} onInput={(event) => setMaximumFrequency(event.currentTarget.value)} class="h-8 w-20 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none" />
            </label>
            <div class="flex flex-wrap items-center gap-4 text-12-regular text-text-weaker">
              <label class="flex items-center gap-2">
                <input type="checkbox" checked={inferOnsets()} onChange={(event) => setInferOnsets(event.currentTarget.checked)} />
                <span>Infer onsets</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" checked={melodiaTrick()} onChange={(event) => setMelodiaTrick(event.currentTarget.checked)} />
                <span>Melodia</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" checked={multiplePitchBends()} onChange={(event) => setMultiplePitchBends(event.currentTarget.checked)} />
                <span>Pitch bends</span>
              </label>
            </div>
          </div>
        </Show>
        <div class="flex flex-wrap items-center gap-4">
          <label class="flex items-center gap-2 text-12-regular text-text-weaker">
            <span>Bars</span>
            <select
              value={bars()}
              onChange={(event) => setBars(event.currentTarget.value)}
              class="h-8 w-14 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
            </select>
          </label>
        </div>
        <Show when={mode() === "upload"}>
          <label class="flex flex-col gap-2">
            <span class="text-12-regular text-text-weaker">Audio file</span>
            <input
              type="file"
              accept=".wav,.mp3,.ogg,.flac,audio/*"
              class="rounded-md border border-border-weak-base bg-background-base px-3 py-2 text-12-regular text-text-strong"
              onInput={(event) => {
                const next = event.currentTarget.files?.[0]
                setFile(next)
                if (!next) return
                submitFile(next)
              }}
            />
          </label>
        </Show>
        <Show when={mode() === "record"}>
          <div class="flex flex-col gap-2 rounded-md border border-border-weak-base bg-background-base px-3 py-3">
            <div class="text-12-regular text-text-weaker">
              Use headphones if possible. Record mode uses a fixed two-bar count-in, always keeps one extra trailing bar, and quantizes to a fixed 16-step grid from beat 1 inside the clip.
            </div>
            <div class="flex items-center justify-between gap-2">
              <div class="text-12-regular text-text-weaker">
                Phrase: {capturePlan(props.bpm, props.div, Number(bars()) || 2, COUNT_IN_BARS).phrase.toFixed(2)}s, guard bars:{" "}
                {capturePlan(props.bpm, props.div, Number(bars()) || 2, COUNT_IN_BARS).pre.toFixed(2)}s before,{" "}
                {capturePlan(props.bpm, props.div, Number(bars()) || 2, COUNT_IN_BARS).post.toFixed(2)}s after, count-in:{" "}
                {capturePlan(props.bpm, props.div, Number(bars()) || 2, COUNT_IN_BARS).count_in.toFixed(2)}s, grid: {STEPS_PER_BAR} steps/bar
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
          <Button variant="primary" size="large" disabled={(!file() && mode() === "upload") || !code() || busy()} onClick={() => props.onInsert(code(), meta())}>
            Insert
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
