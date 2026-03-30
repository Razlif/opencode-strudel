import type { useGlobalSDK } from "@/context/global-sdk"

export type Song = {
  id: string
  path: string
  title: string
}

type SDK = {
  createClient: ReturnType<typeof useGlobalSDK>["createClient"]
}

type Row = {
  name: string
  path: string
  type: string
}

const file = (name: string) => /^ses_[^.]+\.js$/i.test(name)

const id = (name: string) => name.replace(/\.js$/i, "")

export function title(src: string, fallback: string) {
  const meta = /const\s+song_meta\s*=\s*\{[\s\S]*?\}/m.exec(src)?.[0] ?? src
  const hit = /title\s*:\s*["'`]([^"'`]+)["'`]/m.exec(meta)?.[1]?.trim()
  return hit || fallback
}

export async function list(sdk: SDK, dir: string) {
  const cli = sdk.createClient({ directory: dir, throwOnError: true })
  const rows = await cli.file
    .list({ path: "songs" })
    .then((x) => (x.data ?? []) as Row[])
    .catch((): Row[] => [])
  const songs = rows.filter((row) => row.type === "file" && file(row.name))
  const next = await Promise.all(
    songs.map(async (row) => {
      const sid = id(row.name)
      const src = await cli.file
        .read({ path: row.path })
        .then((x) => (x.data?.type === "text" ? x.data.content : ""))
        .catch(() => "")
      return {
        id: sid,
        path: row.path,
        title: title(src, sid),
      } satisfies Song
    }),
  )
  return next.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
}
