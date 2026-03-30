import { describe, expect, test } from "bun:test"
import { list, title } from "./strudel-workspace-songs"

describe("strudel workspace songs", () => {
  test("reads title from song_meta", () => {
    expect(
      title(
        `const song_meta = {
  title: "Neon Ritual",
  bpm: 142,
}`,
        "ses_1",
      ),
    ).toBe("Neon Ritual")
  })

  test("falls back to session id when title is missing", () => {
    expect(title("const song_meta = { bpm: 120 }", "ses_1")).toBe("ses_1")
  })

  test("lists only canonical session songs", async () => {
    const sdk = {
      createClient() {
        return {
          file: {
            list: async () => ({
              data: [
                { name: "ses_b.js", path: "songs/ses_b.js", absolute: "", type: "file", ignored: false },
                { name: "readme.md", path: "songs/readme.md", absolute: "", type: "file", ignored: false },
                { name: "ses_a.js", path: "songs/ses_a.js", absolute: "", type: "file", ignored: false },
              ],
            }),
            read: async (input: { path: string }) => ({
              data: {
                type: "text",
                content: input.path.includes("ses_b")
                  ? 'const song_meta = { title: "B" }'
                  : 'const song_meta = { title: "A" }',
              },
            }),
          },
        }
      },
    } as unknown as Parameters<typeof list>[0]

    const rows = await list(
      sdk,
      "dir",
    )

    expect(rows).toEqual([
      { id: "ses_b", path: "songs/ses_b.js", title: "B" },
      { id: "ses_a", path: "songs/ses_a.js", title: "A" },
    ])
  })
})
