export const needsHydrate = (prev: string, kind: string, src?: string) => {
  if (kind !== "ready") return false
  if (!src) return false
  return src !== prev
}

export const hasExternalUpdate = (prev: string, kind: string, src?: string) => {
  if (kind !== "ready") return false
  if (!src) return false
  if (!prev) return false
  return src !== prev
}
