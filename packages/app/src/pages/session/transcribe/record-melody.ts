export async function record(opts: { start_at: number; stop_at: number; beat: number; origin: number; pre: number; lag: number }) {
  const type = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ].find((item) => MediaRecorder.isTypeSupported(item))
  const media = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })
  const rec = type ? new MediaRecorder(media, { mimeType: type }) : new MediaRecorder(media)
  const parts: BlobPart[] = []
  rec.ondataavailable = (event) => {
    if (!event.data.size) return
    parts.push(event.data)
  }
  const done = new Promise<Blob>((resolve, reject) => {
    rec.onerror = () => reject(new Error("Recording failed"))
    rec.onstop = () => resolve(new Blob(parts, { type: rec.mimeType || type || "audio/webm" }))
  })
  const start = Math.max(0, opts.start_at * 1000)
  const stop = Math.max(start + 1, opts.stop_at * 1000)
  window.setTimeout(() => rec.start(), start)
  window.setTimeout(() => rec.stop(), stop)
  const blob = await done.finally(() => media.getTracks().forEach((track) => track.stop()))
  return {
    blob,
    dur: Math.max(0, opts.stop_at - opts.start_at),
    beat: Math.max(0, opts.beat - opts.start_at),
    origin: Math.max(0, opts.origin - opts.start_at - opts.lag),
    pre: opts.pre,
    lag: opts.lag,
  }
}
