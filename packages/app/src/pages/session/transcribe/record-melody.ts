type RecordOpts = {
  start_at: number
  stop_at: number
  beat: number
  origin: number
  pre: number
  lag: number
}

const AudioContextCtor =
  typeof window !== "undefined" ? (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined

function mergeMono(input: AudioBuffer): Float32Array {
  const channels = input.numberOfChannels
  const frames = input.length
  if (channels <= 1) return new Float32Array(input.getChannelData(0))
  const out = new Float32Array(frames)
  for (let channel = 0; channel < channels; channel += 1) {
    const data = input.getChannelData(channel)
    for (let index = 0; index < frames; index += 1) out[index] += data[index] / channels
  }
  return out
}

function joinChunks(chunks: Float32Array[], total: number): Float32Array {
  const out = new Float32Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function clampSample(value: number) {
  return Math.max(-1, Math.min(1, value))
}

function encodeMonoWav(samples: Float32Array, sampleRate: number): Blob {
  const bytes = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(bytes)
  const write = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index))
  }
  write(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  write(8, "WAVE")
  write(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, "data")
  view.setUint32(40, samples.length * 2, true)
  for (let index = 0; index < samples.length; index += 1) {
    const hit = clampSample(samples[index])
    view.setInt16(44 + index * 2, hit < 0 ? hit * 0x8000 : hit * 0x7fff, true)
  }
  return new Blob([bytes], { type: "audio/wav" })
}

export async function record(opts: RecordOpts) {
  if (!AudioContextCtor) throw new Error("AudioContext is not available in this browser")

  const media = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  const ctx = new AudioContextCtor()
  const source = ctx.createMediaStreamSource(media)
  const processor = ctx.createScriptProcessor(4096, source.channelCount || 1, 1)
  const sink = ctx.createGain()
  sink.gain.value = 0

  const chunks: Float32Array[] = []
  let total = 0
  let capture = false

  processor.onaudioprocess = (event) => {
    if (!capture) return
    const mono = mergeMono(event.inputBuffer)
    chunks.push(mono)
    total += mono.length
  }

  source.connect(processor)
  processor.connect(sink)
  sink.connect(ctx.destination)
  await ctx.resume()

  const start = Math.max(0, opts.start_at * 1000)
  const stop = Math.max(start + 1, opts.stop_at * 1000)

  const done = new Promise<Blob>((resolve, reject) => {
    const begin = window.setTimeout(() => {
      capture = true
    }, start)

    const end = window.setTimeout(async () => {
      capture = false
      window.clearTimeout(begin)
      try {
        processor.disconnect()
        sink.disconnect()
        source.disconnect()
      } catch {}
      media.getTracks().forEach((track) => track.stop())
      await ctx.close()
      if (!total) {
        reject(new Error("Recording captured no audio"))
        return
      }
      resolve(encodeMonoWav(joinChunks(chunks, total), ctx.sampleRate))
    }, stop)

    processor.addEventListener?.("error", () => {
      window.clearTimeout(begin)
      window.clearTimeout(end)
      reject(new Error("Recording failed"))
    })
  })

  const blob = await done
  return {
    blob,
    dur: Math.max(0, opts.stop_at - opts.start_at),
    beat: Math.max(0, opts.beat - opts.start_at),
    origin: Math.max(0, opts.origin - opts.start_at - opts.lag),
    pre: opts.pre,
    lag: opts.lag,
  }
}
