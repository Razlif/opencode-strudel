import { BasicPitch, addPitchBendsToNoteEvents, noteFramesToTime, outputToNotesPoly } from "@spotify/basic-pitch"
import type { NoteEventTime } from "@spotify/basic-pitch"
import type { NoteEvent, PitchOpts, PitchRaw } from "./types"

let mod: BasicPitch | undefined

const get = () => {
  if (!mod) mod = new BasicPitch("/basic-pitch/model.json")
  return mod
}

const map = (list: NoteEventTime[]): NoteEvent[] =>
  list.map((item) => ({
    midi: item.pitchMidi,
    startSec: item.startTimeSeconds,
    durationSec: item.durationSeconds,
    confidence: item.amplitude,
  }))

export async function analyze(buf: AudioBuffer): Promise<PitchRaw> {
  const frames: number[][] = []
  const onsets: number[][] = []
  const contours: number[][] = []
  await get().evaluateModel(
    buf,
    (f, o, c) => {
      frames.push(...f)
      onsets.push(...o)
      contours.push(...c)
    },
    () => {},
  )
  return {
    frames,
    onsets,
    contours,
  }
}

export function transcribe(raw: PitchRaw, opts: PitchOpts) {
  const frames = raw.frames.map((row) => [...row])
  const onsets = raw.onsets.map((row) => [...row])
  return map(
    noteFramesToTime(
      addPitchBendsToNoteEvents(
        raw.contours,
        outputToNotesPoly(
          frames,
          onsets,
          opts.onset,
          opts.frame,
          opts.min,
          opts.infer,
          opts.maxFreq ?? null,
          opts.minFreq ?? null,
          opts.melodia,
          opts.energy,
        ),
      ),
    ),
  )
}
