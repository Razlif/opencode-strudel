declare module "@spotify/basic-pitch" {
  export type NoteEventTime = {
    pitchMidi: number
    startTimeSeconds: number
    durationSeconds: number
    amplitude?: number
  }

  export class BasicPitch {
    constructor(modelPath: string)
    evaluateModel(
      audio: AudioBuffer,
      onResult: (frames: number[][], onsets: number[][], contours: number[][]) => void,
      onProgress?: (progress: number) => void,
    ): Promise<void>
  }

  export function outputToNotesPoly(
    frames: number[][],
    onsets: number[][],
    onsetThreshold: number,
    frameThreshold: number,
    minimumNoteLength: number,
    inferOnsets: boolean,
    maxFrequency: number | null,
    minFrequency: number | null,
    melodiaTrick: boolean,
    energyTolerance?: number,
  ): NoteEventTime[]

  export function addPitchBendsToNoteEvents(contours: number[][], notes: NoteEventTime[]): NoteEventTime[]

  export function noteFramesToTime(notes: NoteEventTime[]): NoteEventTime[]
}
