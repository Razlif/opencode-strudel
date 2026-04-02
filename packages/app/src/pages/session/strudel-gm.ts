// @ts-nocheck
import gm from "@strudel/soundfonts/gm.mjs"
import {
  freqToMidi,
  getADSRValues,
  getAudioContext,
  getParamADSR,
  getPitchEnvelope,
  getSoundIndex,
  getVibratoOscillator,
  noteToMidi,
  onceEnded,
  registerSound,
  releaseAudioNode,
} from "@strudel/web"

let url = "https://felixroos.github.io/webaudiofontdata/sound"
const loads: Record<string, Promise<any>> = {}
const bufs: Record<string, Promise<{ buffer: AudioBuffer; zone: any }>> = {}

const font = async (name: string) => {
  if (loads[name]) return loads[name]
  loads[name] = fetch(`${url}/${name}.js`)
    .then((res) => res.text())
    .then((text) => {
      const [, data] = text.split("={")
      return eval("{" + data)
    })
  return loads[name]
}

const zone = (preset: any[], pitch: number) => preset.find((item) => item.keyRangeLow <= pitch && item.keyRangeHigh + 1 >= pitch)

const buffer = async (item: any, ctx: AudioContext) => {
  if (item.sample) {
    const decoded = atob(item.sample)
    item.buffer = ctx.createBuffer(1, decoded.length / 2, item.sampleRate)
    const data = item.buffer.getChannelData(0)
    for (let i = 0; i < decoded.length / 2; i++) {
      let a = decoded.charCodeAt(i * 2)
      let b = decoded.charCodeAt(i * 2 + 1)
      if (a < 0) a = 256 + a
      if (b < 0) b = 256 + b
      let n = b * 256 + a
      if (n >= 65536 / 2) n -= 65536
      data[i] = n / 65536
    }
    return item.buffer as AudioBuffer
  }
  if (!item.file) throw new Error(`no soundfont buffer found`)
  const arr = new ArrayBuffer(item.file.length)
  const view = new Uint8Array(arr)
  const decoded = atob(item.file)
  for (let i = 0; i < decoded.length; i++) view[i] = decoded.charCodeAt(i)
  return new Promise<AudioBuffer>((resolve) => ctx.decodeAudioData(arr, resolve))
}

const pitch = async (name: string, note: number, ctx: AudioContext) => {
  const key = `${name}:${note}`
  if (bufs[key]) return bufs[key]
  bufs[key] = font(name).then(async (preset) => {
    const hit = zone(preset, note)
    if (!hit) throw new Error(`no soundfont zone found`)
    return {
      buffer: await buffer(hit, ctx),
      zone: hit,
    }
  })
  return bufs[key]
}

const source = async (name: string, value: any, ctx: AudioContext) => {
  const midi = value.freq
    ? freqToMidi(value.freq)
    : typeof value.note === "number"
      ? value.note
      : noteToMidi(value.note ?? "c3")
  const hit = await pitch(name, midi, ctx)
  const node = ctx.createBufferSource()
  node.buffer = hit.buffer
  const base = hit.zone.originalPitch - 100 * hit.zone.coarseTune - hit.zone.fineTune
  node.playbackRate.value = Math.pow(2, (100 * midi - base) / 1200)
  const loop = hit.zone.loopStart > 1 && hit.zone.loopStart < hit.zone.loopEnd
  if (loop) {
    node.loop = true
    node.loopStart = hit.zone.loopStart / hit.zone.sampleRate
    node.loopEnd = hit.zone.loopEnd / hit.zone.sampleRate
  }
  return node
}

export const registerGm = () => {
  Object.entries(gm).forEach(([name, fonts]) => {
    registerSound(
      name,
      async (time, value: any, done) => {
        const [attack, decay, sustain, release] = getADSRValues([
          value.attack,
          value.decay,
          value.sustain,
          value.release,
        ])
        const ctx = getAudioContext()
        const pick = fonts[getSoundIndex(value.n, fonts.length)]
        const node = await source(pick, value, ctx)
        node.start(time)
        const gain = ctx.createGain()
        const out = node.connect(gain)
        const hold = time + value.duration
        getParamADSR(out.gain, attack, decay, sustain, release, 0, 0.3, time, hold, "linear")
        const end = hold + release + 0.01
        const vibrato = getVibratoOscillator(node.detune, value, time)
        getPitchEnvelope(node.detune, value, time, hold)
        node.stop(end)
        onceEnded(node, () => {
          releaseAudioNode(node)
          vibrato?.stop()
          done()
        })
        return { node: out, stop() {}, nodes: { source: [node], ...vibrato?.nodes } }
      },
      { type: "soundfont", prebake: true, fonts },
    )
  })
}
