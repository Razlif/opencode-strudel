export const cycleSec = (bpm: number, div: number) => (60 / bpm) * div

export const stepSec = (bpm: number, div: number, steps: number) => cycleSec(bpm, div) / steps
