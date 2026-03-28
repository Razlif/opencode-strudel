const unwrap = (map: unknown) => {
  if (map && typeof map === "object" && "get" in map && typeof (map as { get: () => unknown }).get === "function") {
    return (map as { get: () => unknown }).get()
  }
  return map
}

const has = (map: unknown, name: string) => {
  const value = unwrap(map)
  if (value instanceof Map) return value.has(name)
  if (typeof value === "object" && value !== null) return name in value
  return false
}

const size = (map: unknown) => {
  const value = unwrap(map)
  if (value instanceof Map) return value.size
  if (typeof value === "object" && value !== null) return Object.keys(value).length
  return 0
}

export const probe = (
  map: unknown,
  src: {
    banks: readonly string[]
    named: readonly string[]
    gm: readonly string[]
  },
) => {
  const banks = [...src.banks]
  const named = [...src.named]
  const gm = src.gm.filter((name) => has(map, name))
  return {
    size: size(map),
    banks,
    named,
    gm,
  }
}

export const report = (
  map: unknown,
  src: {
    banks: readonly string[]
    named: readonly string[]
    gm: readonly string[]
    ext: readonly string[]
  },
) => {
  const support = probe(map, src)
  return {
    registry: support.size,
    banks: {
      supported: support.banks,
      missing: [],
    },
    named: {
      supported: support.named,
      missing: [],
    },
    gm: {
      supported: support.gm,
      missing: src.gm.filter((name) => !support.gm.includes(name)),
    },
    ext: {
      supported: [...src.ext],
      missing: [],
    },
  }
}

export const groups = (
  src: {
    ext: readonly string[]
  },
  support: ReturnType<typeof probe>,
) =>
  [
    {
      id: "banks",
      name: "Drum Banks",
      tone: "bank",
      items: support.banks,
    },
    {
      id: "named",
      name: "Named Sounds",
      tone: "named",
      items: support.named,
    },
    {
      id: "gm",
      name: "GM",
      tone: "gm",
      items: support.gm,
    },
    {
      id: "ext",
      name: "External",
      tone: "remote",
      items: [...src.ext],
    },
  ] as const
