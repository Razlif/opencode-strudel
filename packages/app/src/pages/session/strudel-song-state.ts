import type { FileState } from "@/context/file"
import { check } from "./strudel-song-validate"

export const state = (file?: Pick<FileState, "loaded" | "loading" | "error" | "content">) => {
  if (file?.loading) {
    return {
      kind: "loading",
      label: "Song file loading",
      msg: "Reading canonical session song file.",
    } as const
  }

  if (file?.error) {
    return {
      kind: "missing",
      label: "Song file missing",
      msg: file.error,
    } as const
  }

  if (!file?.loaded) {
    return {
      kind: "idle",
      label: "Song file pending",
      msg: "Canonical session song file has not loaded yet.",
    } as const
  }

  const src = file.content?.content?.trim() ?? ""
  if (!src) {
    return {
      kind: "missing",
      label: "Song file empty",
      msg: "Canonical session song file is empty.",
    } as const
  }

  const hit = check(src)
  if (!hit.ok) {
    return {
      kind: "invalid",
      label: "Song file invalid",
      msg: hit.err[0] ?? "Canonical session song file failed validation.",
    } as const
  }

  return {
    kind: "ready",
    label: "Song file ready",
    msg: "Canonical session song file passed contract validation.",
  } as const
}
