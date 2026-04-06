const clean = (text: string) =>
  text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/;\s*$/, "")

const block = (text?: string) => text?.replace(/\r\n/g, "\n").trim() ?? ""

const snake = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_") || "item"

const uniq = (list: string[], value: string) => {
  if (!list.includes(value)) return value
  let n = 2
  while (list.includes(`${value}_${n}`)) n++
  return `${value}_${n}`
}

const empty = `s("~").gain(0)`

type Card = {
  id: string
  name: string
  tone: string
  code: string
}

type Sect = {
  id: string
  name: string
  len: string
  cards: Card[]
}

export const write = (state: {
  bpm: string
  div: string
  sects: Sect[]
  title?: string
  titleLiteral?: string
  metaExtra?: string
  imports?: string
}) => {
  const bpm = Number(state.bpm) > 0 ? Number(state.bpm) : 120
  const div = Number(state.div) > 0 ? Number(state.div) : 4
  const title = state.titleLiteral?.trim() || JSON.stringify(state.title ?? "")
  const metaExtra = block(state.metaExtra)
  const imports = block(state.imports)
  const sections: string[] = []
  const tracks = state.sects.flatMap((sect) => {
    const sid = uniq(sections, snake(sect.name))
    sections.push(sid)
    const roles: string[] = []
    const cards = sect.cards.length
      ? sect.cards.map((card) => {
          const role = uniq(roles, snake(card.name))
          roles.push(role)
          return {
            ...card,
            var: `track_${sid}_${role}`,
          }
        })
      : [
          {
            id: `${sid}:placeholder`,
            name: "placeholder",
            tone: "named",
            code: empty,
            var: `track_${sid}_placeholder`,
          },
        ]
    return [{ sid, sect, cards }] as const
  })

  const trackLines = tracks.flatMap((item) =>
    item.cards.map((card) => `let ${card.var} = ${clean(card.code)}`),
  )

  const sectionLines = tracks.map(
    (item) =>
      `let section_${item.sid} = stack(\n${item.cards.map((card) => `  ${card.var},`).join("\n")}\n)`,
  )

  const arrangeLines = tracks
    .map((item) => {
      const len = Number(item.sect.len) > 0 ? Number(item.sect.len) : 8
      return `  [${len}, section_${item.sid}],`
    })
    .join("\n")

  return `// Strudel Studio canonical song file
// Keep marker comments and top-level names stable.

// @song_meta
const song_meta = {
  title: ${title},
  bpm: ${bpm},
  beats_per_cycle: ${div},
${metaExtra ? `${metaExtra}\n` : ""}}

setcps((song_meta.bpm / 60) / song_meta.beats_per_cycle)

// @song_imports
${imports || "// Shared setup only."}

// @song_tracks
// Track naming:
// track_<section>_<role>

${trackLines.join("\n\n")}

// @song_sections
// Section naming:
// section_<name>
// Each section must stack track vars only.

${sectionLines.join("\n\n")}

// @song_arrangement
// Final arrangement naming:
// final_song
// Only section vars belong here.

let final_song = arrange(
${arrangeLines}
)

final_song
`
}
