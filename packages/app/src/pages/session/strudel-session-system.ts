import { song as songPath } from "@/pages/session/strudel-song"
import { getStrudelSessionContext } from "@/pages/session/strudel-session-context"

export function buildStrudelSessionSystem(sessionID: string, first: boolean) {
  const value = getStrudelSessionContext(sessionID)
  const lines = [
    "Current Strudel session context:",
    "",
    `- session_id: ${sessionID}`,
    `- canonical_song_path: ${value?.canonical_song_path ?? songPath(sessionID)}`,
    "- workspace_agents_path: strudel-studio-workspace/AGENTS.md",
    "- composition_tutorial_path: strudel-studio-workspace/composition_tutorial.md",
    "- supported_sounds_path: strudel-studio-workspace/samples/sound-banks.md",
    "- When the user refers to the current song, section, chorus, verse, tracks, cards, or project music state, they are referring to this canonical song file.",
    "- Read and edit that file directly instead of guessing the active song by scanning the repo.",
    "- For music generation or song edits, read the composition tutorial and supported sound reference before making edits.",
    "- Do not guess Strudel Studio composition style from memory when those workspace files are available.",
  ]
  if (value?.focused_section) lines.push(`- focused_section: ${value.focused_section}`)
  if (value?.focused_card) lines.push(`- focused_card: ${value.focused_card}`)
  if (value?.ui_surface) lines.push(`- ui_surface: ${value.ui_surface}`)
  if (value?.playback_state) lines.push(`- playback_state: ${value.playback_state}`)
  if (value?.status) lines.push(`- ui_status: ${value.status}`)
  if (value?.status_message) lines.push(`- ui_status_message: ${value.status_message}`)
  if (first) {
    lines.push("")
    lines.push("First-turn Strudel instructions:")
    lines.push("- Read `strudel-studio-workspace/AGENTS.md` before planning or editing.")
    lines.push("- Read the canonical song file before making music claims or edits.")
    lines.push("- Read `strudel-studio-workspace/composition_tutorial.md` before writing or restructuring music.")
    lines.push("- Read `strudel-studio-workspace/samples/sound-banks.md` before choosing or claiming supported sounds.")
    lines.push("- Do not send a greeting, welcome message, or generic assistant introduction before doing those reads.")
    lines.push("- After those reads, begin with a short grounded status line that mentions the current song or section context you actually found.")
    lines.push("- The first response must reflect the files you read, not a generic offer to help.")
    lines.push("- Stay inside the current canonical song file.")
  }
  return lines.join("\n")
}
