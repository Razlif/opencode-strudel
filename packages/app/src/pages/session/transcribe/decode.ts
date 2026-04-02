let ctx: AudioContext | undefined

export async function decode(file: File) {
  if (!ctx) ctx = new AudioContext()
  const src = await ctx.decodeAudioData(await file.arrayBuffer())
  const len = Math.ceil(src.duration * 22050)
  const out = new OfflineAudioContext(1, Math.max(1, len), 22050)
  const node = out.createBufferSource()
  const buf = out.createBuffer(1, src.length, src.sampleRate)
  const mono = buf.getChannelData(0)
  const n = src.numberOfChannels
  Array.from({ length: src.length }, (_, i) => i).forEach((i) => {
    mono[i] = Array.from({ length: n }, (_, j) => src.getChannelData(j)[i] ?? 0).reduce((sum, item) => sum + item, 0) / n
  })
  node.buffer = buf
  node.connect(out.destination)
  node.start()
  return out.startRendering()
}
