export type MelodyResult = {
  used_config?: {
    preset: string
    adaptive: boolean
    separate_vocals: boolean
    separation_model: string
    basic_pitch: Record<string, unknown>
  }
  debug_json?: string
  latest_json?: string
  debug_csv?: string
  latest_csv?: string
  summary: {
    segmented_notes: number
    quantized_notes: number
    quantized_collisions_dropped: number
    cropped_notes: number
  }
  contour: {
    segmented: string
    quantized: string
    segmented_relative: number[]
    quantized_relative: number[]
  }
  timing?: {
    grid_origin: string
    origin_sec: number
    bpm: number
    beats_per_cycle: number
    bars: number
    steps_per_bar: number
    anchored_to_first_note: boolean
  }
  segmented_notes: {
    midi: number
    note: string
    start_sec: number
    dur_sec: number
    confidence: number
  }[]
  quantized_notes: {
    midi: number
    note: string
    start_step: number
    len_steps: number
    confidence: number
  }[]
  strudel: string
}

export type BasicPitchOverrides = {
  onset_threshold?: number
  frame_threshold?: number
  minimum_note_length?: number
  minimum_frequency?: number
  maximum_frequency?: number
  infer_onsets?: boolean
  melodia_trick?: boolean
  multiple_pitch_bends?: boolean
}

export type TranscribePreset =
  | "auto_analyze_audio"
  | "balanced"
  | "solo_vocals"
  | "solo_piano"
  | "acoustic_guitar"
  | "bass_guitar"
  | "percussion_drums"
  | "rock_metal"
  | "jazz_multi_instrument"
  | "classical_orchestral"
  | "electronic_synth"
  | "anime_j_pop"

async function postAudio(
  file: File,
  opts: {
    bpm: number
    div: number
    bars: number
    steps: number
    origin: number
    preset?: TranscribePreset
    adaptive?: boolean
    separateVocals?: boolean
    separationModel?: string
    basicPitch?: BasicPitchOverrides
  },
) {
  const form = new FormData()
  form.set("audio", file)
  form.set("bpm", String(opts.bpm))
  form.set("beats_per_cycle", String(opts.div))
  form.set("bars", String(opts.bars))
  form.set("steps_per_bar", String(opts.steps))
  form.set("origin_sec", String(opts.origin))
  form.set("preset", opts.preset ?? "solo_vocals")
  form.set("adaptive", String(opts.adaptive ?? true))
  form.set("separate_vocals", String(opts.separateVocals ?? false))
  form.set("separation_model", opts.separationModel ?? "none")
  const bp = opts.basicPitch
  if (bp?.onset_threshold !== undefined) form.set("onset_threshold", String(bp.onset_threshold))
  if (bp?.frame_threshold !== undefined) form.set("frame_threshold", String(bp.frame_threshold))
  if (bp?.minimum_note_length !== undefined) form.set("minimum_note_length", String(bp.minimum_note_length))
  if (bp?.minimum_frequency !== undefined) form.set("minimum_frequency", String(bp.minimum_frequency))
  if (bp?.maximum_frequency !== undefined) form.set("maximum_frequency", String(bp.maximum_frequency))
  if (bp?.infer_onsets !== undefined) form.set("infer_onsets", String(bp.infer_onsets))
  if (bp?.melodia_trick !== undefined) form.set("melodia_trick", String(bp.melodia_trick))
  if (bp?.multiple_pitch_bends !== undefined) form.set("multiple_pitch_bends", String(bp.multiple_pitch_bends))
  const res = await fetch("http://127.0.0.1:8765/transcribe-melody", {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return (await res.json()) as MelodyResult
}

export async function transcribeTake(
  blob: Blob,
  opts: {
    bpm: number
    div: number
    bars: number
    steps: number
    origin: number
    preset?: TranscribePreset
    adaptive?: boolean
    separateVocals?: boolean
    separationModel?: string
    basicPitch?: BasicPitchOverrides
  },
) {
  const type = blob.type || "audio/webm"
  const ext = type.includes("wav") ? "wav" : type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm"
  return postAudio(new File([blob], `melody.${ext}`, { type }), opts)
}

export async function transcribeFile(
  file: File,
  opts: {
    bpm: number
    div: number
    bars: number
    steps: number
    origin: number
    preset?: TranscribePreset
    adaptive?: boolean
    separateVocals?: boolean
    separationModel?: string
    basicPitch?: BasicPitchOverrides
  },
) {
  return postAudio(file, opts)
}
