export type NoteEvent = {
  midi: number
  startSec: number
  durationSec: number
  confidence?: number
}

export type PitchOpts = {
  onset: number
  frame: number
  min: number
  infer: boolean
  melodia: boolean
  energy?: number
  minFreq?: number
  maxFreq?: number
}

export type PitchRaw = {
  frames: number[][]
  onsets: number[][]
  contours: number[][]
}

export type GridNote = {
  midi: number
  start: number
  len: number
  confidence?: number
}

export type CleanResult = {
  notes: GridNote[]
  dropped: number
  cropped: number
  collisions: number
}
