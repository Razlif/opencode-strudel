export type Card = {
  id: string
  name: string
  tone: string
  code: string
  x: number
  y: number
  color: string
}

export type Sect = {
  id: string
  name: string
  len: string
  cards: Card[]
}

const split = (text: string) => {
  const hit = text.trim().match(/^(.*?)(?:\s+(\d+))?$/)
  return {
    head: hit?.[1]?.trim() || text.trim() || "Item",
    tail: hit?.[2] ? Number(hit[2]) : Number.NaN,
  }
}

const next = (list: string[], text: string) => {
  const seed = split(text)
  const nums = list
    .map(split)
    .filter((item) => item.head.toLowerCase() === seed.head.toLowerCase())
    .map((item) => (Number.isFinite(item.tail) ? item.tail : 1))
  const top = nums.length ? Math.max(...nums) : 1
  return `${seed.head} ${top + 1}`
}

const sid = (at: number) => `s${at}`
const cid = (at: number, n: number) => `card:${at + n}`

export const make = (list: Sect[], at = Date.now()): Sect => {
  const n = list.length + 1
  return {
    id: sid(at),
    name: `Section ${String.fromCharCode(64 + Math.min(n, 26))}`,
    len: "8",
    cards: [],
  }
}

export const blank = (at = Date.now()) => make([], at)

export const copyCard = (sect: Sect, cardID: string, at = Date.now()) => {
  const card = sect.cards.find((item) => item.id === cardID)
  if (!card) return
  const name = next(
    sect.cards.map((item) => item.name),
    card.name,
  )
  const copy = {
    ...card,
    id: cid(at, 1),
    name,
    x: card.x + 24,
    y: card.y + 24,
  }
  return {
    id: copy.id,
    sect: {
      ...sect,
      cards: [...sect.cards, copy],
    },
  }
}

export const copySect = (list: Sect[], sectID: string, at = Date.now()) => {
  const i = list.findIndex((item) => item.id === sectID)
  if (i === -1) return
  const sect = list[i]
  if (!sect) return
  const name = next(
    list.map((item) => item.name),
    sect.name,
  )
  const copy = {
    ...sect,
    id: sid(at),
    name,
    cards: sect.cards.map((card, idx) => ({
      ...card,
      id: cid(at, idx + 1),
      x: card.x + 24,
      y: card.y + 24,
    })),
  }
  return {
    id: copy.id,
    sects: [...list.slice(0, i + 1), copy, ...list.slice(i + 1)],
  }
}
