import { describe, expect, test } from "bun:test"
import { blank, copyCard, copySect, make } from "./strudel-song-edit"

const base = {
  id: "a",
  name: "Verse",
  len: "8",
  cards: [
    {
      id: "card:1",
      name: "gm_piano",
      tone: "gm",
      code: `note("c4").s("gm_piano")`,
      x: 48,
      y: 48,
      color: "#3b82f6",
    },
  ],
}

describe("strudel song edit", () => {
  test("makes a blank section", () => {
    expect(blank(10)).toEqual({
      id: "s10",
      name: "Section A",
      len: "8",
      cards: [],
    })
  })

  test("makes the next section label from the current list", () => {
    expect(make([blank(1)], 11)).toEqual({
      id: "s11",
      name: "Section B",
      len: "8",
      cards: [],
    })
  })

  test("duplicates a card inside a section", () => {
    const next = copyCard(base, "card:1", 20)
    expect(next?.id).toBe("card:21")
    expect(next?.sect.cards).toHaveLength(2)
    expect(next?.sect.cards[1]).toEqual({
      id: "card:21",
      name: "gm_piano 2",
      tone: "gm",
      code: `note("c4").s("gm_piano")`,
      x: 72,
      y: 72,
      color: "#3b82f6",
    })
  })

  test("duplicates a section after the current one", () => {
    const next = copySect([base], "a", 30)
    expect(next?.id).toBe("s30")
    expect(next?.sects).toHaveLength(2)
    expect(next?.sects[1]?.name).toBe("Verse 2")
    expect(next?.sects[1]?.cards[0]).toEqual({
      id: "card:31",
      name: "gm_piano",
      tone: "gm",
      code: `note("c4").s("gm_piano")`,
      x: 72,
      y: 72,
      color: "#3b82f6",
    })
  })
})
