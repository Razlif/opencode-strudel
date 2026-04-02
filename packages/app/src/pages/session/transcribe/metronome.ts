const pulse = (ctx: AudioContext, when: number, accent: boolean) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "square"
  osc.frequency.value = accent ? 1760 : 1320
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(accent ? 0.18 : 0.1, when + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.055)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + 0.07)
}

export function click(opts: { bpm: number; div: number; bars: number; count: number; lead?: number }) {
  const ctx = new AudioContext()
  const lead = opts.lead ?? 0.12
  const beat = 60 / opts.bpm
  const total = opts.div * (opts.bars + opts.count)
  const base = ctx.currentTime + lead
  Array.from({ length: total }).forEach((_, i) => pulse(ctx, base + beat * i, i % opts.div === 0))
  return {
    stop() {
      void ctx.close()
    },
  }
}
