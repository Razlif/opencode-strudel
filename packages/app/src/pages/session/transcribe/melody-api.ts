export type MelodyResult = {
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

let ctx: AudioContext | undefined

const audio = () => {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

const mono = async (blob: Blob) => {
  const src = await audio().decodeAudioData(await blob.arrayBuffer())
  const len = Math.ceil(src.duration * 22050)
  const out = new OfflineAudioContext(1, Math.max(1, len), 22050)
  const node = out.createBufferSource()
  const buf = out.createBuffer(1, src.length, src.sampleRate)
  const data = buf.getChannelData(0)
  const n = src.numberOfChannels
  Array.from({ length: src.length }, (_, i) => i).forEach((i) => {
    data[i] = Array.from({ length: n }, (_, j) => src.getChannelData(j)[i] ?? 0).reduce((sum, item) => sum + item, 0) / n
  })
  node.buffer = buf
  node.connect(out.destination)
  node.start()
  return out.startRendering()
}

const wav = (buf: AudioBuffer) => {
  const data = buf.getChannelData(0)
  const out = new ArrayBuffer(44 + data.length * 2)
  const view = new DataView(out)
  const put = (i: number, text: string) => Array.from(text).forEach((c, j) => view.setUint8(i + j, c.charCodeAt(0)))
  put(0, "RIFF")
  view.setUint32(4, 36 + data.length * 2, true)
  put(8, "WAVE")
  put(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, buf.sampleRate, true)
  view.setUint32(28, buf.sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  put(36, "data")
  view.setUint32(40, data.length * 2, true)
  data.forEach((item, i) => {
    const hit = Math.max(-1, Math.min(1, item))
    view.setInt16(44 + i * 2, hit < 0 ? hit * 0x8000 : hit * 0x7fff, true)
  })
  return new Blob([out], { type: "audio/wav" })
}

export async function transcribeTake(
  blob: Blob,
  opts: {
    bpm: number
    div: number
    bars: number
    steps: number
    origin: number
  },
) {
  const form = new FormData()
  form.set("audio", new File([wav(await mono(blob))], "melody.wav", { type: "audio/wav" }))
  form.set("bpm", String(opts.bpm))
  form.set("beats_per_cycle", String(opts.div))
  form.set("bars", String(opts.bars))
  form.set("steps_per_bar", String(opts.steps))
  form.set("origin_sec", String(opts.origin))
  form.set("trim", "false")
  form.set("min_note_ms", "60")
  form.set("min_voiced_prob", "0.4")
  const res = await fetch("http://127.0.0.1:8765/transcribe-melody", {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return (await res.json()) as MelodyResult
}
