export type StrudelSessionContext = {
  canonical_song_path: string
  focused_section?: string
  focused_card?: string
  ui_surface?: string
  playback_state?: string
  status?: string
  status_message?: string
}

const store = new Map<string, StrudelSessionContext>()

export const setStrudelSessionContext = (sessionID: string, value: StrudelSessionContext) => {
  store.set(sessionID, value)
}

export const getStrudelSessionContext = (sessionID: string) => store.get(sessionID)

export const clearStrudelSessionContext = (sessionID: string) => {
  store.delete(sessionID)
}
