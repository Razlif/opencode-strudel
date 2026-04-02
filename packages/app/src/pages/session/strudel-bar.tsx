import { Button } from "@opencode-ai/ui/button"
import { Accordion } from "@opencode-ai/ui/accordion"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { Tag } from "@opencode-ai/ui/tag"
import { initStrudel } from "@strudel/web"
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { useFile } from "@/context/file"
import { useGlobalSync } from "@/context/global-sync"
import { useLocal } from "@/context/local"
import { usePrompt } from "@/context/prompt"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { type FollowupDraft, sendFollowupDraft } from "@/components/prompt-input/submit"
import { showToast } from "@opencode-ai/ui/toast"
import { bootstrap as bootstrapSong } from "@/pages/session/strudel-song-bootstrap"
import { DialogImportMelody } from "@/pages/session/dialog-import-melody"
import { registerGm } from "@/pages/session/strudel-gm"
import { blank, copyCard, copySect, make, type Card, type Sect } from "@/pages/session/strudel-song-edit"
import { banks, ext, gm, named, packs } from "@/pages/session/strudel-runtime"
import { parse } from "@/pages/session/strudel-song-parse"
import { check } from "@/pages/session/strudel-song-validate"
import { write as writeSong } from "@/pages/session/strudel-song-write"
import { useSessionLayout } from "@/pages/session/session-layout"
import { clearStrudelSessionContext, setStrudelSessionContext } from "@/pages/session/strudel-session-context"
import { boot as songBoot, song as songPath } from "@/pages/session/strudel-song"
import { state as songState } from "@/pages/session/strudel-song-state"
import { hasExternalUpdate, needsHydrate } from "@/pages/session/strudel-song-sync"
import { groups as supportGroups, probe, report } from "@/pages/session/strudel-support"

type State = "idle" | "evaluating" | "needs preload" | "preloading" | "preloaded" | "playing" | "stopped" | "error"

const tone: Record<State, string> = {
  idle: "text-text-weak",
  evaluating: "text-warning-base",
  "needs preload": "text-warning-base",
  preloading: "text-warning-base",
  preloaded: "text-success-base",
  playing: "text-success-base",
  stopped: "text-text-base",
  error: "text-danger-base",
}

let boot: Promise<void> | undefined
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const keep = 120
const flash = 140
const debug = false

const load = () => {
  if (!boot) {
    boot = (async () => {
      await initStrudel()
      registerGm()
      await strudel().samples?.(packs.dirt)
      await strudel().samples?.(packs.drum)
      await strudel().samples?.(packs.piano)
      await strudel().samples?.(packs.vcsl)
      await wait(150)
    })()
  }
  return boot ?? Promise.resolve()
}

const strudel = () => window as Window & {
  hush?: () => void
  evaluate?: (code: string, autoplay?: boolean) => unknown
  samples?: (src: string) => unknown
  getCps?: () => number
  getPattern?: () => {
    queryArc: (
      from: number,
      to: number,
      opts: { _cps: number },
    ) => {
      hasOnset: () => boolean
      context: { pulse?: number }
    }[]
  }
  getTime?: () => number
  soundMap?: unknown
}

const demo = `note("<c4 a3 f3 e3>(3,8)")`
const mark = "samples("
const vocals = ["vocal", "vocals", "speech", "speechless", "yeah"]
const demos = [
  {
    name: "Basic groove",
    code: `stack(
  s("bd hh sd hh"),
  note("<c4 eb4 g4 bb4>").slow(2).gain(.6)
)`,
  },
  {
    name: "808 bank",
    code: `stack(
  sound("bd hh sd hh").bank("RolandTR808"),
  note("<c3 g3 bb3 g3>").slow(2).gain(.45)
)`,
  },
  {
    name: "909 bank",
    code: `stack(
  sound("bd ~ sd hh").bank("RolandTR909"),
  note("<c4 eb4 g4 bb4>").slow(2).gain(.45)
)`,
  },
  {
    name: "LinnDrum bank",
    code: `stack(
  sound("bd hh sd hh").bank("LinnDrum"),
  note("<c3 g3 bb3 g3>").slow(2).gain(.45)
)`,
  },
  {
    name: "MT32 bank",
    code: `stack(
  sound("bd hh sd hh").bank("RolandMT32"),
  note("<c3 g3 bb3 g3>").slow(2).gain(.45)
)`,
  },
  {
    name: "Type 3 mix",
    code: `stack(
  sound("bd hh sd hh").bank("RolandTR808").gain(.6),
  note("<c4 e4 g4 a4>").s("piano").gain(.45),
  note("<e5 d5 c5 a4>").s("piano").slow(2).gain(.25)
)`,
  },
  {
    name: "GM starter",
    code: `stack(
  note("<c4 e4 g4 a4>").s("gm_piano").gain(.45),
  note("<c2 g1 bb1 g1>").s("gm_electric_bass_finger").gain(.4),
  note("<g4 a4 g4 e4>").s("gm_oboe").gain(.3)
)`,
  },
  {
    name: "GM extended",
    code: `stack(
  note("<c4 e4 g4 b4>").s("gm_acoustic_guitar_steel").gain(.35),
  note("<c2 g1 bb1 g1>").s("gm_synth_bass_1").gain(.4),
  note("<g4 a4 g4 e4>").s("gm_lead_2_sawtooth").gain(.25),
  note("<[c4,e4,g4] [f4,a4,c5]>/2").s("gm_pad_poly").gain(.18)
)`,
  },
] as const

const clean = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n")
    .trim()

const timed = (src: string, bpm: number, div: number) => {
  if (!src.trim()) return src
  if (src.includes("setcps(") || src.includes(".cpm(") || src.includes(".cps(")) return src
  return `setcps((${bpm} / 60) / ${div});\n\n${src}`
}
const pad = (src: string) =>
  src
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n")
const swatch = [
  "#3b82f6",
  "#14b8a6",
  "#f97316",
  "#eab308",
  "#a855f7",
  "#ef4444",
  "#22c55e",
  "#ec4899",
]

const tint = (name: string, tone: string) => {
  const n = `${name}:${tone}`.split("").reduce((sum, item) => sum + item.charCodeAt(0), 0)
  return swatch[n % swatch.length]
}
const stamp = (text: string) =>
  text.split("").reduce((sum, item) => (sum * 33 + item.charCodeAt(0)) % 2147483647, 5381)

const heavy = (src: string) => vocals.some((item) => src.includes(`"${item}`) || src.includes(`'${item}`) || src.includes(` ${item}`))
const remote = (src: string) => src.includes(mark)
const match = (text: string) =>
  [
    "[pulse-hit]",
    "[pulse-scan]",
    "@strudel",
    "[sampler]",
    "[cyclist]",
    "[eval]",
    "skip query: too late",
    "loading sound",
    "sound ",
    "cannot use window: not in browser?",
  ].some((item) => text.includes(item))

const same = (a: string, b: string) => a.trim() === b.trim()
const gainOf = (src: string) => {
  const list = [...src.matchAll(/\.gain\s*\(\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*\)/g)]
  const hit = list.at(-1)?.[1]
  const n = hit ? Number(hit) : NaN
  return Number.isFinite(n) ? n : 0.7
}
const withGain = (src: string, value: number) => {
  const text = src.trim()
  const next = Number.isFinite(value) ? Math.max(0, value) : 0.7
  const list = [...text.matchAll(/\.gain\s*\(\s*([^)]+)\s*\)/g)]
  const hit = list.at(-1)
  if (hit?.index === undefined) return `${text}.gain(${next})`
  return `${text.slice(0, hit.index)}.gain(${next})${text.slice(hit.index + hit[0].length)}`
}

export function StrudelBar(props: {
  sessionID?: string
  tab?: () => "canvas" | "console"
  setTab?: (tab: "canvas" | "console") => void
  browse?: () => boolean
  setBrowse?: (open: boolean) => void
  setStatus?: (next: { state: string; ready: boolean; msg: string }) => void
}) {
  const dialog = useDialog()
  const file = useFile()
  const sdk = useSDK()
  const globalSync = useGlobalSync()
  const local = useLocal()
  const prompt = usePrompt()
  const sync = useSync()
  const { params } = useSessionLayout()
  const [state, setState] = createSignal<State>("idle")
  const [msg, setMsg] = createSignal("")
  const [ready, setReady] = createSignal(false)
  const [code, setCode] = createSignal(demo)
  const [bpm, setBpm] = createSignal("120")
  const [div, setDiv] = createSignal("4")
  const [pick, setPick] = createSignal<(typeof demos)[number]["name"]>(demos[0].name)
  const [pre, setPre] = createSignal("")
  const [logs, setLogs] = createSignal<string[]>([])
  const [innerBrowse, setInnerBrowse] = createSignal(true)
  const [open, setOpen] = createSignal(["banks", "named", "gm", "ext"])
  const [pickSound, setPickSound] = createSignal("")
  const [pickTone, setPickTone] = createSignal("")
  const [hear, setHear] = createSignal("")
  const [busy, setBusy] = createSignal("")
  const [loadmsg, setLoadmsg] = createSignal("")
  const [cache, setCache] = createSignal<string[]>([])
  const [sects, setSects] = createSignal<Sect[]>([{ id: "a", name: "Section A", len: "8", cards: [] }])
  const [part, setPart] = createSignal("a")
  const [openCard, setOpenCard] = createSignal("")
  const [innerTab, setInnerTab] = createSignal<"canvas" | "console">("canvas")
  const [playCard, setPlayCard] = createSignal("")
  const [playScope, setPlayScope] = createSignal<"track" | "section" | "song" | "">("")
  const [back, setBack] = createSignal<"section" | "song" | "">("")
  const [drag, setDrag] = createSignal<{ id: string; dx: number; dy: number } | undefined>()
  const [hot, setHot] = createSignal<string[]>([])
  const [loaded, setLoaded] = createSignal("")
  const [booting, setBooting] = createSignal(false)
  const [autofile, setAutofile] = createSignal("")
  const [sessionBusy, setSessionBusy] = createSignal(false)
  const [support, setSupport] = createSignal(
    probe(strudel().soundMap, {
      banks,
      named,
      gm,
    }),
  )
  let area: HTMLDivElement | undefined
  let timer = new Map<string, ReturnType<typeof setTimeout>>()
  let frame = 0
  let last = 0
  let run = 0
  const rate = () => {
    const a = Number(bpm())
    if (!Number.isFinite(a) || a <= 0) return 120
    return a
  }
  const tab = () => props.tab?.() ?? innerTab()
  const setTab = (tab: "canvas" | "console") => props.setTab?.(tab) ?? setInnerTab(tab)
  const browse = () => props.browse?.() ?? innerBrowse()
  const setBrowse = (open: boolean) => props.setBrowse?.(open) ?? setInnerBrowse(open)
  const beat = () => {
    const a = Number(div())
    if (!Number.isFinite(a) || a <= 0) return 4
    return a
  }
  const sid = () => {
    if (props.sessionID) return props.sessionID
    if (params.id) return params.id
    if (typeof window === "undefined") return ""
    return window.location.pathname.match(/\/session\/([^/?#]+)/)?.[1] ?? ""
  }
  const path = () => {
    const id = sid()
    return id ? songPath(id) : ""
  }
  const songfile = () => (path() ? file.get(path()) : undefined)
  const filestate = () => songState(songfile())
  const groups = createMemo(() =>
    supportGroups(
      {
        ext: ext.map((item) => item.name),
      },
      support(),
    ),
  )
  const scan = () => {
    const src = {
      banks,
      named,
      gm,
      ext: ext.map((item) => item.name),
    }
    const next = probe(strudel().soundMap, src)
    setSupport(next)
    if (debug) console.log("[strudel-support]", report(strudel().soundMap, src))
  }
  const save = () => {
    const p = path()
    if (!p) return Promise.resolve()
    const src = songfile()?.content?.content
    if (hasExternalUpdate(loaded(), filestate().kind, src)) {
      setMsg("Song file changed outside the canvas. Reloading latest song file.")
      showToast({
        title: "Song file changed",
        description: "Reloading the latest canonical song file from disk.",
      })
      void file.load(p, { force: true })
      return Promise.resolve()
    }
    const next = writeSong({
      bpm: String(rate()),
      div: String(beat()),
      sects: sects(),
    })
    const hit = check(next)
    if (!hit.ok) {
      const text = hit.err[0] ?? "Song file failed contract validation."
      setMsg(text)
      showToast({
        variant: "error",
        title: "Song file save failed",
        description: text,
      })
      return Promise.resolve()
    }
    if (same(songfile()?.content?.content ?? "", next)) return Promise.resolve()
    return sdk.client.file
      .write({
        path: p,
        content: next,
      })
      .then(() => {
        setMsg("Song file saved. Reloading from disk.")
        showToast({
          variant: "success",
          title: "Song file saved",
          description: "Reloading the canonical song file from disk.",
        })
        void file.load(p, { force: true })
      })
      .catch((err) => {
        const text = err instanceof Error ? err.message : String(err)
        setMsg(text)
        showToast({
          variant: "error",
          title: "Song file save failed",
          description: text,
        })
      })
  }
  const saveBpm = () => {
    setBpm(String(rate()))
    void save()
  }
  const saveDiv = () => {
    setDiv(String(beat()))
    void save()
  }
  const saveLen = () => {
    relen(String(len() && Number(len()) > 0 ? Number(len()) : 8))
    void save()
  }
  const saveName = () => {
    renameSect(name().trim() || "Section")
    void save()
  }
  const later = () => queueMicrotask(() => void save())

  createEffect(() => {
    props.setStatus?.({
      state: state(),
      ready: ready(),
      msg: msg(),
    })
  })

  createEffect(() => {
    const id = sid()
    const value = path()
    if (!id || !value) return
    setStrudelSessionContext(id, {
      canonical_song_path: value,
      focused_section: part() || undefined,
      focused_card: activeCard()?.name ?? undefined,
      ui_surface: browse() ? "samples" : tab() === "console" ? "console" : "canvas",
      playback_state: playScope() === "track" ? "track" : playScope() === "section" ? "section" : state(),
      status: state(),
      status_message: msg() || undefined,
    })
  })

  createEffect(() => {
    const value = path()
    if (!value) return
    void file.load(value)
  })

  createEffect(() => {
    const id = sid()
    const p = path()
    if (!id || !p) return
    const next = (sync.data.session_status[id] ?? { type: "idle" as const }).type !== "idle"
    const prev = sessionBusy()
    if (next === prev) return
    setSessionBusy(next)
    if (next) return
    setMsg("Agent run finished. Reloading canonical song file.")
    showToast({
      title: "Reloading song file",
      description: "The agent finished. Reloading the canonical song file from disk.",
    })
    void file.load(p, { force: true })
  })

  createEffect(() => {
    if (filestate().kind === "missing") return
    if (!autofile()) return
    setAutofile("")
  })

  createEffect(() => {
    const p = path()
    if (!p) return
    if (filestate().kind !== "missing") return
    if (autofile() === p) return
    const next = songBoot(songfile()?.content?.content)
    if (!next) return
    setAutofile(p)
    setMsg("Creating canonical song file...")
    void sdk.client.file
      .write({
        path: p,
        content: next,
      })
      .then(() => file.load(p, { force: true }))
      .catch((err) => {
        const text = err instanceof Error ? err.message : String(err)
        setMsg(text)
        setAutofile("")
        showToast({
          variant: "error",
          title: "Song file create failed",
          description: text,
        })
      })
  })

  createEffect(() => {
    const src = songfile()?.content?.content
    if (!src || !needsHydrate(loaded(), filestate().kind, src)) return
    const next = parse(src)
    setBpm(next.bpm)
    setDiv(next.div)
    setSects(next.sects)
    setPart(next.sects[0]?.id ?? "")
    setOpenCard("")
    const fresh = !!loaded()
    setMsg(fresh ? "Song file refreshed from disk." : "Song file loaded.")
    showToast({
      variant: "success",
      title: fresh ? "Song file refreshed" : "Song file loaded",
      description: fresh
        ? "The Strudel UI was rehydrated from the canonical song file on disk."
        : "The canonical song file was loaded into the Strudel UI.",
    })
    setLoaded(src ?? "")
  })

  onMount(() => {
    const ping = (id: string) => {
      if (!id) return
      setHot((list) => (list.includes(id) ? list : [...list, id]))
      const hit = timer.get(id)
      if (hit) clearTimeout(hit)
      timer.set(
        id,
        setTimeout(() => {
          setHot((list) => list.filter((item) => item !== id))
          timer.delete(id)
        }, flash),
      )
    }
    const tick = () => {
      frame = requestAnimationFrame(tick)
      const pat = strudel().getPattern?.()
      const now = strudel().getTime?.()
      if (!pat || typeof now !== "number") return
      const cps = strudel().getCps?.() ?? 1
      const from = Math.max(last || now, now - 1 / 10)
      last = now
      const ids = sects().flatMap((item) => item.cards.map((card) => card.id))
      const by = new Map(sects().flatMap((item) => item.cards.map((card) => [card.id, item.id] as const)))
      const haps = pat.queryArc(from, now, { _cps: cps }).filter((hap) => hap.hasOnset())
      const seen: string[] = []
      haps.forEach((hap) => {
        ids.filter((id) => hap.context.pulse === stamp(id)).forEach((id) => {
          ping(id)
          const sid = by.get(id)
          if (sid && !seen.includes(sid)) seen.push(sid)
        })
      })
      if ((playScope() === "song" || playScope() === "section" || playScope() === "track") && seen[0] && seen[0] !== part()) {
        take(seen[0])
      }
    }
    frame = requestAnimationFrame(tick)
    const push = (kind: string, args: unknown[]) => {
      const text = args
        .map((item) => {
          if (typeof item === "string") return item
          try {
            return JSON.stringify(item)
          } catch {
            return String(item)
          }
        })
        .join(" ")
      if (!match(text)) return
      setLogs((list) => [...list, `[${kind}] ${text}`].slice(-keep))
    }
    const old = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    }
    console.log = (...args) => {
      push("log", args)
      old.log(...args)
    }
    console.warn = (...args) => {
      push("warn", args)
      old.warn(...args)
    }
    console.error = (...args) => {
      push("error", args)
      old.error(...args)
    }
    void load()
      .then(async () => {
        scan()
        await wait(500)
        scan()
        setReady(true)
        setMsg("Runtime ready")
      })
      .catch((err) => {
        setState("error")
        setMsg(err instanceof Error ? err.message : String(err))
      })

    onCleanup(() => {
      cancelAnimationFrame(frame)
      timer.forEach((item) => clearTimeout(item))
      timer.clear()
      console.log = old.log
      console.warn = old.warn
      console.error = old.error
    })
  })

  onCleanup(() => {
    strudel().hush?.()
    const id = sid()
    if (id) clearStrudelSessionContext(id)
  })

  const src = () => clean(code())
  const bootfile = () => {
    const value = path()
    if (!value) {
      console.error("[strudel-bootstrap] missing-path", {
        param: params.id,
        url: typeof window === "undefined" ? "" : window.location.pathname,
      })
      setMsg("Bootstrap failed: session path is unavailable.")
      showToast({
        variant: "error",
        title: "Bootstrap failed",
        description: "Session song path is unavailable in this view.",
      })
      return
    }
    const next = bootstrapSong(value)
    const cursor = next[0]?.type === "text" ? next[0].content.length : 0
    const model = local.model.current()
    const agent = local.agent.current()
    const id = sid()
    if (!id || !model || !agent) {
      console.log("[strudel-bootstrap] draft", {
        sessionID: id,
        path: value,
        hasModel: !!model,
        hasAgent: !!agent,
      })
      console.log("[strudel-bootstrap] draft")
      prompt.set(next, cursor)
      setMsg("Bootstrap prompt prepared in chat.")
      showToast({
        title: "Bootstrap prompt ready",
        description: "The song-file bootstrap prompt was added to chat.",
      })
      return
    }
    const draft: FollowupDraft = {
      sessionID: id,
      sessionDirectory: sdk.directory,
      prompt: [...next],
      context: [],
      agent: agent.name,
      model: {
        providerID: model.provider.id,
        modelID: model.id,
      },
      variant: local.model.variant.current() ?? undefined,
    }
    setBooting(true)
    setMsg("Sending bootstrap task...")
    console.log("[strudel-bootstrap] send", {
      sessionID: id,
      path: value,
      agent: agent.name,
      model: `${model.provider.id}/${model.id}`,
    })
    showToast({
      title: "Bootstrap task",
      description: "Sending song-file bootstrap task to the agent.",
    })
    void sendFollowupDraft({
      client: sdk.client,
      globalSync,
      sync,
      draft,
      optimisticBusy: sdk.directory === draft.sessionDirectory,
    })
      .then((ok) => {
        if (ok === false) {
          console.log("[strudel-bootstrap] send-cancelled")
          prompt.set(next, cursor)
          setMsg("Bootstrap prompt prepared in chat.")
          showToast({
            title: "Bootstrap prompt ready",
            description: "Auto-send was skipped. The prompt was added to chat.",
          })
          return
        }
        console.log("[strudel-bootstrap] sent")
        setMsg("Bootstrap task sent.")
        showToast({
          title: "Bootstrap task sent",
          description: "The agent is creating the canonical song file.",
        })
      })
      .catch((err) => {
        console.error("[strudel-bootstrap] send-failed", err)
        prompt.set(next, cursor)
        setMsg("Bootstrap send failed. Prompt prepared in chat.")
        showToast({
          variant: "error",
          title: "Bootstrap send failed",
          description: "The bootstrap prompt was added to chat instead.",
        })
      })
      .finally(() => {
        setBooting(false)
      })
  }
  const curr = () => sects().find((item) => item.id === part()) ?? sects()[0]
  const name = () => curr()?.name ?? "Section A"
  const len = () => curr()?.len ?? "8"
  const cards = () => curr()?.cards ?? []
  const activeCard = () => cards().find((item) => item.id === openCard())
  const find = (id: string) => sects().flatMap((item) => item.cards).find((item) => item.id === id)
  const patch = (fn: (item: Sect) => Sect) => {
    const id = part()
    setSects((list) => list.map((item) => (item.id === id ? fn(item) : item)))
  }
  const renameSect = (value: string) => patch((item) => ({ ...item, name: value }))
  const relen = (value: string) => patch((item) => ({ ...item, len: value }))
  const take = (id: string) => {
    setPart(id)
    setOpenCard("")
  }
  const step = (dir: -1 | 1) => {
    const list = sects()
    const i = list.findIndex((item) => item.id === part())
    if (i === -1) return
    const next = list[i + dir]
    if (next) {
      take(next.id)
      return
    }
    const item = make(sects())
    setSects((list) => {
      const i = list.findIndex((row) => row.id === part())
      if (i === -1) return [...list, item]
      const at = dir < 0 ? i : i + 1
      return [...list.slice(0, at), item, ...list.slice(at)]
    })
    setPart(item.id)
    setOpenCard("")
    later()
  }
  const erase = () => {
    const list = sects()
    const i = list.findIndex((item) => item.id === part())
    if (i === -1) return
    if (list.length === 1) {
      const item = blank()
      setSects([item])
      setPart(item.id)
      setOpenCard("")
      later()
      return
    }
    const next = list[i + 1] ?? list[i - 1]
    setSects((list) => list.filter((item) => item.id !== part()))
    setPart(next?.id ?? "")
    setOpenCard("")
    later()
  }
  const clone = () => {
    const hit = copySect(sects(), part())
    if (!hit) return
    const label = curr()?.name ?? "section"
    setSects(hit.sects)
    setPart(hit.id)
    setOpenCard("")
    setMsg(`Duplicated ${label}.`)
    later()
  }
  const reset = () => {
    const item = blank()
    setSects([item])
    setPart(item.id)
    setOpenCard("")
    setMsg("Reset song to empty canonical state.")
    later()
  }
  const bars = (item: Sect) => {
    const n = Number(item.len)
    if (!Number.isFinite(n) || n <= 0) return 8
    return n
  }
  const extpack = (name: string) => ext.find((item) => item.name === name)?.pack
  const active = () => sects().filter((item) => item.cards.some((card) => track(card)))
  const whole = () => active().length > 1
  const scope = () => (whole() ? "arrangement" : name())
  const useSong = () => tab() === "canvas" && active().length > 0
  const imports = () =>
    [...new Set(active().flatMap((item) => item.cards.flatMap((card) => (card.tone === "remote" ? [extpack(card.name)].filter((row): row is string => !!row) : []))))].join("\n\n")
  const track = (card: Card) => clean(card.code)
  const pulse = (card: Card) => {
    const text = track(card)
    if (!text) return ""
    return `(${text}).withContext(ctx => ({
  ...ctx,
  pulse: ${stamp(card.id)}
}))`
  }
  const stack = () => {
    const list = cards().map(pulse).filter(Boolean)
    if (!list.length) return ""
    return `stack(\n${list.map(pad).join(",\n")}\n)`
  }
  const block = (item: Sect) => {
    const list = item.cards.map(pulse).filter(Boolean)
    if (!list.length) return ""
    return `stack(\n${list.map(pad).join(",\n")}\n)`
  }
  const section = (item = curr()) => {
    const body = item ? block(item) : ""
    if (!body) return ""
    return body
  }
  const arrange = () => {
    const list = active()
    if (!list.length) return ""
    const head = imports()
    if (list.length === 1) return timed([head, section(list[0])].filter(Boolean).join("\n\n"), rate(), beat())
    const vars = list.map((item, i) => `let p${i} = ${block(item)}`)
    const seq = list.map((item, i) => `  [${bars(item)}, p${i}]`).join(",\n")
    return timed([head, ...vars, `arrange(\n${seq}\n)`].filter(Boolean).join("\n\n"), rate(), beat())
  }
  const prog = () => (useSong() ? arrange() : timed(src(), rate(), beat()))
  const stale = () => remote(prog()) && prog() !== pre()

  const prime = async (id: number) => {
    await load()
    if (id !== run) return false
    setReady(true)
    const api = strudel()
    const text = prog()
    if (!text) throw new Error("Enter Strudel code first.")
    if (!remote(text)) {
      setPre(text)
      setState("preloaded")
      setMsg(useSong() ? `No remote samples to preload for ${scope()}.` : "No remote samples to preload for current code.")
      return true
    }
    setState("preloading")
    setMsg("Loading remote samples...")
    strudel().hush?.()
    await api.evaluate?.("hush", false)
    if (id !== run) return false
    await api.evaluate?.(text, false)
    if (id !== run) return false
    await wait(heavy(text) ? 900 : 300)
    if (id !== run) return false
    setPre(text)
    setState("preloaded")
    setMsg(
      heavy(text)
        ? useSong()
          ? `Samples loaded for ${scope()}. Large vocal samples may still start late on first play.`
          : "Samples loaded for current code. Large vocal samples may still start late on first play."
        : useSong()
          ? `Samples loaded for ${scope()}.`
          : "Samples loaded for current code.",
    )
    return true
  }

  const evalCode = async () => {
    const id = ++run
    setState("evaluating")
    setMsg("")
    try {
      await load()
      if (id !== run) return
      setReady(true)
      const text = prog()
      if (!text) throw new Error("Enter Strudel code first.")
      await strudel().evaluate?.(text, false)
      if (id !== run) return
      setState(remote(text) && stale() ? "needs preload" : "stopped")
      setMsg(useSong() ? `Evaluated ${scope()}.` : "Pattern evaluated.")
    } catch (err) {
      if (id !== run) return
      setState("error")
      setMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const preload = async () => {
    const id = ++run
    try {
      await prime(id)
    } catch (err) {
      if (id !== run) return
      setState("error")
      setMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const play = async () => {
    const id = ++run
    setBack("")
    setPlayCard("")
    setPlayScope("song")
    setState("evaluating")
    setMsg("")
    try {
      await load()
      if (id !== run) return
      setReady(true)
      const text = prog()
      if (!text) throw new Error("Enter Strudel code first.")
      if (remote(text) && stale()) {
        const ok = await prime(id)
        if (!ok || id !== run) return
      }
      await strudel().evaluate?.(text, true)
      if (id !== run) return
      setState("playing")
      setMsg(
        remote(text)
          ? heavy(text)
            ? useSong()
              ? `Playing ${scope()}. Large vocal samples can still ring out after pause.`
              : "Playing current code. Large vocal samples can still ring out after pause."
            : useSong()
              ? `Playing ${scope()}.`
              : "Playing current Strudel code."
          : useSong()
            ? `Playing ${scope()}.`
            : "Playing current Strudel code.",
      )
    } catch (err) {
      if (id !== run) return
      setPlayScope("")
      setState("error")
      setMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const pause = async () => {
    run++
    setBack("")
    setPlayCard("")
    setPlayScope("")
    await load()
    strudel().hush?.()
    await strudel().evaluate?.("hush", false)
    setState(remote(prog()) && stale() ? "needs preload" : "stopped")
    setMsg("Playback stopped.")
  }

  const fill = () => {
    const item = demos.find((item) => item.name === pick())
    if (!item) return
    setCode(item.code)
    const text = clean(item.code)
    setState(remote(text) && text !== pre() ? "needs preload" : "idle")
    setMsg(`Loaded example: ${item.name}.`)
  }

  const cached = (item: string) => {
    const entry = ext.find((row) => row.name === item)
    if (!entry) return false
    return cache().includes(entry.pack)
  }

  const seed = (name: string, tone: string) => {
    if (tone === "bank") return `s("bd hh sd hh").bank(${JSON.stringify(name)}).gain(.7)`
    if (tone === "remote") return `s(${JSON.stringify(name)}).gain(.7)`
    if (name === "cajon") return `s("cajon*4").gain(.7)`
    if (name.includes("bass")) return `note("<c2 g1>").s(${JSON.stringify(name)}).gain(.5)`
    if (name.includes("pad") || name.includes("ensemble") || name.includes("strings")) {
      return `note("<[c4,e4,g4] [f4,a4,c5]>/2").s(${JSON.stringify(name)}).gain(.3)`
    }
    return `note("<c4 e4 g4 a4>").s(${JSON.stringify(name)}).gain(.45)`
  }

  const plant = (name: string, tone: string, x?: number, y?: number) => {
    if (!name || !tone) return
    const id = `${name}:${Date.now()}`
    const n = cards().length
    patch((item) => ({
      ...item,
      cards: [
        ...item.cards,
        {
          id,
          name,
          tone,
          code: seed(name, tone),
          x: x ?? 48 + (n % 4) * 132,
          y: y ?? 48 + Math.floor(n / 4) * 108,
          color: tint(name, tone),
        },
      ],
    }))
    setOpenCard("")
    setMsg(`Added ${name} to ${curr()?.name ?? "section"}.`)
    later()
  }
  const plantCode = (name: string, tone: string, code: string, x?: number, y?: number) => {
    if (!name || !tone || !code.trim()) return
    const id = `${name}:${Date.now()}`
    const n = cards().length
    patch((item) => ({
      ...item,
      cards: [
        ...item.cards,
        {
          id,
          name,
          tone,
          code,
          x: x ?? 48 + (n % 4) * 132,
          y: y ?? 48 + Math.floor(n / 4) * 108,
          color: tint(name, tone),
        },
      ],
    }))
    setOpenCard("")
    setMsg(`Added ${name} to ${curr()?.name ?? "section"}.`)
    later()
  }
  const drop = (card: Card) => {
    patch((item) => ({
      ...item,
      cards: item.cards.filter((row) => row.id !== card.id),
    }))
    setOpenCard("")
    setMsg(`Removed ${card.name} from ${curr()?.name ?? "section"}.`)
    later()
  }
  const cloneCard = (card: Card) => {
    const sect = curr()
    if (!sect) return
    const hit = copyCard(sect, card.id)
    if (!hit) return
    patch(() => hit.sect)
    setOpenCard(hit.id)
    setMsg(`Duplicated track ${card.name}.`)
    later()
  }
  const tweak = (card: Card, fn: (code: string) => string) => {
    patch((item) => ({
      ...item,
      cards: item.cards.map((row) => (row.id === card.id ? { ...row, code: fn(row.code) } : row)),
    }))
    later()
    queueMicrotask(() => {
      if (state() !== "playing") return
      if (playScope() === "song") {
        void play()
        return
      }
      if (playScope() === "section") {
        void playSect()
        return
      }
      const next = find(card.id)
      if (!next || playScope() !== "track" || playCard() !== card.id) return
      void trackplay(next)
    })
  }
  const mute = (card: Card) => {
    const gain = gainOf(card.code)
    tweak(card, (code) => withGain(code, gain <= 0 ? 0.7 : 0))
  }
  const rename = (card: Card, value: string) => {
    const name = value.trim()
    if (!name || name === card.name) return
    patch((item) => ({
      ...item,
      cards: item.cards.map((row) => (row.id === card.id ? { ...row, name } : row)),
    }))
    setMsg(`Renamed track to ${name}.`)
    later()
  }
  const volume = (card: Card, value: string) => {
    const gain = Number(value)
    tweak(card, (code) => withGain(code, Number.isFinite(gain) ? gain : gainOf(code)))
  }

  function DialogResetSong() {
    return (
      <Dialog title="Reset Song" fit>
        <div class="flex flex-col gap-4 pl-6 pr-2.5 pb-3">
          <div class="flex flex-col gap-1">
            <span class="text-14-regular text-text-strong">
              Reset the current song to an empty canonical state?
            </span>
            <span class="text-12-regular text-text-weak">
              This keeps the current session and canonical song file, but clears the canvas back to one empty section.
            </span>
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="ghost" size="large" onClick={() => dialog.close()}>
              Cancel
            </Button>
            <Button
              data-testid="strudel-song-reset-confirm"
              variant="primary"
              size="large"
              onClick={() => {
                reset()
                dialog.close()
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }

  const trackplay = async (card: Card) => {
    const id = ++run
    setPlayCard(card.id)
    setPlayScope("track")
    setState("evaluating")
    setMsg("")
    try {
      await load()
      if (id !== run) return
      const head = imports()
      const text = timed([head, pulse(card)].filter(Boolean).join("\n\n"), rate(), beat())
      if (!text) throw new Error("Track has no code yet.")
      if (remote(text) && text !== pre()) {
        const ok = await prime(id)
        if (!ok || id !== run) return
      }
      await strudel().evaluate?.(text, true)
      if (id !== run) return
      setState("playing")
      setMsg(`Playing track ${card.name}.`)
    } catch (err) {
      if (id !== run) return
      setPlayCard("")
      setPlayScope("")
      setState("error")
      setMsg(err instanceof Error ? err.message : String(err))
    }
  }
  const solo = async (card: Card) => {
    if (playScope() === "track" && playCard() === card.id) {
      const prev = back()
      setBack("")
      if (prev === "song") {
        await play()
        return
      }
      if (prev === "section") {
        await playSect()
        return
      }
      await pause()
      return
    }
    {
      const prev = playScope()
      setBack(prev === "song" || prev === "section" ? prev : "")
    }
    await trackplay(card)
  }

  const playSect = async () => {
    const item = curr()
    if (!item) return
    const id = ++run
    setBack("")
    setPlayCard("")
    setPlayScope("section")
    setState("evaluating")
    setMsg("")
    try {
      await load()
      if (id !== run) return
      const body = section(item)
      const text = timed([imports(), body].filter(Boolean).join("\n\n"), rate(), beat())
      if (!text) throw new Error("Section has no track code yet.")
      if (remote(text) && text !== pre()) {
        const ok = await prime(id)
        if (!ok || id !== run) return
      }
      await strudel().evaluate?.(text, true)
      if (id !== run) return
      setState("playing")
      setMsg(`Playing ${item.name}.`)
    } catch (err) {
      if (id !== run) return
      setPlayScope("")
      setState("error")
      setMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const icon = (card: Card) => {
    if (card.tone === "bank") return "dot-grid"
    if (card.tone === "remote") return "cloud-upload"
    if (card.name.includes("piano") || card.name.includes("kawai")) return "keyboard"
    if (card.name.includes("bass")) return "sliders"
    if (card.name.includes("pad") || card.name.includes("strings") || card.name.includes("ensemble")) return "models"
    if (card.name.includes("sax") || card.name.includes("oboe") || card.name.includes("clarinet") || card.name.includes("trumpet")) {
      return "providers"
    }
    return "models"
  }

  const glow = (card: Card) => {
    return hot().includes(card.id)
  }

  const move = (id: string, x: number, y: number) =>
    patch((item) => ({
      ...item,
      cards: item.cards.map((row) =>
        row.id === id
          ? {
              ...row,
              x: Math.max(12, Math.min(x, Math.max(12, (area?.clientWidth ?? 720) - 144))),
              y: Math.max(12, Math.min(y, Math.max(12, (area?.clientHeight ?? 480) - 96))),
            }
          : row,
      ),
    }))

  const preview = (item: string, tone: string) => {
    if (busy() && busy() !== item) return
    if (hear() === item) {
      run++
      setHear("")
      setBusy("")
      void load().then(() => {
        strudel().hush?.()
        void strudel().evaluate?.("hush", false)
        setMsg("Preview stopped.")
      })
      return
    }

    const remoteItem = ext.find((entry) => entry.name === item)
    const text =
      tone === "bank"
        ? timed(`s("bd").bank(${JSON.stringify(item)}).gain(.8)`, rate(), beat())
        : tone === "remote" && remoteItem
          ? timed(`${remoteItem.pack}

${remoteItem.preview}`, rate(), beat())
        : item === "cajon"
          ? timed(`s("cajon").gain(.8)`, rate(), beat())
          : item.includes("bass")
            ? timed(`note("c2").s(${JSON.stringify(item)}).gain(.55)`, rate(), beat())
            : item.includes("pad") || item.includes("ensemble") || item.includes("strings")
              ? timed(`note("[c4,e4,g4]").s(${JSON.stringify(item)}).gain(.28)`, rate(), beat())
              : timed(`note("c4").s(${JSON.stringify(item)}).gain(.45)`, rate(), beat())

    const id = ++run
    setHear(item)
    setBusy(item)
    setMsg(`Previewing ${item}.`)
    setLoadmsg(tone === "remote" ? (cached(item) ? "Remote preview is cached." : "Remote preview may take longer on first load.") : "")
    void load()
      .then(async () => {
        if (id !== run) return
        strudel().hush?.()
        await strudel().evaluate?.("hush", false)
        if (id !== run) return
        await strudel().evaluate?.(text, true)
        if (id !== run) return
        if (remoteItem) {
          setCache((list) => (list.includes(remoteItem.pack) ? list : [...list, remoteItem.pack]))
          setLoadmsg("Remote preview cached for this pack.")
        }
        setBusy("")
      })
      .catch((err) => {
        if (id !== run) return
        setHear("")
        setLoadmsg("")
        setBusy("")
        setState("error")
        setMsg(err instanceof Error ? err.message : String(err))
      })
  }

  return (
    <div data-testid="strudel-bar" class="border-b border-border-weak-base bg-background-base px-4 py-3">
      <div class="flex flex-col gap-3">
        <div data-testid="strudel-editor-wrap" class="rounded-lg border border-border-weak-base bg-background-stronger">
          <div
            class="grid min-h-0 gap-0"
            style={{
              "grid-template-columns": tab() === "canvas" && browse() ? "12rem minmax(0,1fr)" : undefined,
            }}
          >
            <Show when={tab() === "canvas" && browse()}>
              <aside
                data-testid="strudel-browser"
                class="min-h-0 border-r border-border-weak-base bg-background-base"
              >
                <div class="flex h-full min-h-0 flex-col">
                  <Show when={loadmsg()}>
                    <div class="border-b border-border-weak-base px-2 py-2">
                      <Show when={loadmsg()}>
                        {(value) => <div class="text-12-regular text-text-weaker">{value()}</div>}
                      </Show>
                    </div>
                  </Show>
                  <div data-testid="strudel-browser-scroll" class="min-h-0 flex-1 overflow-auto px-1.5 py-1.5">
                    <Accordion data-testid="strudel-browser-groups" collapsible multiple value={open()} onChange={setOpen}>
                      <For each={groups()}>
                        {(group) => (
                          <Accordion.Item value={group.id} class="mb-1 rounded-md border border-border-weak-base bg-background-stronger/30">
                            <Accordion.Header>
                              <Accordion.Trigger class="flex w-full items-center justify-between px-1.5 py-1.5 text-left">
                                <div class="flex items-center gap-2">
                                  <span class="text-13-medium text-text-strong">{group.name}</span>
                                  <Tag>{group.items.length}</Tag>
                                </div>
                              </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content>
                              <div class="flex flex-col gap-1 px-1.5 pb-1.5">
                                <For each={group.items}>
                                  {(item) => (
                                    <div
                                      data-testid="strudel-browser-item"
                                      data-item={item}
                                      onClick={() => {
                                        setPickSound(item)
                                        setPickTone(group.tone)
                                      }}
                                      class="flex items-center justify-between rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-background-base"
                                      classList={{
                                        "bg-background-base": pickSound() === item,
                                        "ring-1 ring-success-base": hear() === item,
                                      }}
                                    >
                                      <div class="flex min-w-0 items-center gap-1.5">
                                        <span class="min-w-0 truncate text-12-regular text-text-strong">{item}</span>
                                        <Show when={hear() === item}>
                                          <Tag>playing</Tag>
                                        </Show>
                                        <Show when={group.tone === "remote" && cached(item)}>
                                          <Tag>cached</Tag>
                                        </Show>
                                      </div>
                                      <div class="flex shrink-0 items-center gap-1">
                                        <Button
                                          size="small"
                                          variant="secondary"
                                          class="h-7 w-7 px-0"
                                          onClick={(event: MouseEvent) => {
                                            event.preventDefault()
                                            event.stopPropagation()
                                            setPickSound(item)
                                            setPickTone(group.tone)
                                            plant(item, group.tone)
                                          }}
                                        >
                                          <span class="text-12-medium leading-none text-text-strong">+</span>
                                        </Button>
                                        <Button
                                          size="small"
                                          disabled={!!busy() && busy() !== item}
                                          variant={hear() === item ? "ghost" : "secondary"}
                                          class="h-7 w-7 px-0"
                                          onClick={(event: MouseEvent) => {
                                            event.preventDefault()
                                            event.stopPropagation()
                                            preview(item, group.tone)
                                          }}
                                        >
                                          <Show
                                            when={busy() === item}
                                            fallback={<span class="text-12-medium leading-none text-text-strong">{hear() === item ? "[]" : ">"}</span>}
                                          >
                                            <span class="text-12-medium leading-none text-text-strong">...</span>
                                          </Show>
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </For>
                              </div>
                            </Accordion.Content>
                          </Accordion.Item>
                        )}
                      </For>
                    </Accordion>
                  </div>
                </div>
              </aside>
            </Show>

            <div class="flex min-h-0 min-w-0 flex-1 flex-col">
              <div class="flex flex-col gap-3 border-b border-border-weak-base px-3 py-3">
                <div
                  class="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-2 text-12-regular"
                  classList={{
                    "border-border-weak-base bg-background-base text-text-weaker": filestate().kind === "idle" || filestate().kind === "loading",
                    "border-success-base/40 bg-success-base/10 text-success-base": filestate().kind === "ready",
                    "border-warning-base/40 bg-warning-base/10 text-warning-base": filestate().kind === "missing",
                    "border-danger-base/40 bg-danger-base/10 text-danger-base": filestate().kind === "invalid",
                  }}
                >
                  <span class="shrink-0 text-12-medium uppercase tracking-[0.12em]">{filestate().label}</span>
                  <span class="min-w-0 flex-1 truncate">{filestate().msg}</span>
                  <Show when={filestate().kind === "missing" || filestate().kind === "idle"}>
                    <button
                      type="button"
                      data-testid="strudel-bootstrap"
                      disabled={booting()}
                      class="relative z-10 h-7 shrink-0 rounded-md border border-border-weak-base bg-background-base px-2.5 text-12-medium text-text-strong transition-colors hover:bg-background-stronger disabled:opacity-50"
                      onClick={bootfile}
                    >
                      Create with AI
                    </button>
                  </Show>
                </div>
                <div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                  <div class="flex min-w-0 flex-wrap items-center gap-3">
                    <label class="flex items-center gap-2 text-12-regular text-text-weaker">
                      <span>BPM</span>
                      <input
                        data-testid="strudel-bpm"
                        inputMode="numeric"
                        value={bpm()}
                        onInput={(event) => setBpm(event.currentTarget.value)}
                        onBlur={saveBpm}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return
                          event.currentTarget.blur()
                        }}
                        class="h-8 w-12 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
                      />
                    </label>
                    <label class="flex items-center gap-2 text-12-regular text-text-weaker">
                      <span>Beats/Cycle</span>
                      <input
                        data-testid="strudel-div"
                        inputMode="numeric"
                        value={div()}
                        onInput={(event) => setDiv(event.currentTarget.value)}
                        onBlur={saveDiv}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return
                          event.currentTarget.blur()
                        }}
                        class="h-8 w-10 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
                      />
                    </label>
                    <label class="flex items-center gap-2 text-12-regular text-text-weaker">
                      <span>Bars</span>
                      <input
                        data-testid="strudel-section-len"
                        inputMode="numeric"
                        value={len()}
                        onInput={(event) => relen(event.currentTarget.value)}
                        onBlur={saveLen}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return
                          event.currentTarget.blur()
                        }}
                        class="h-8 w-10 rounded-md border border-border-weak-base bg-background-base px-2 text-12-regular text-text-strong outline-none"
                      />
                    </label>
                    <Show when={tab() === "canvas"}>
                      <div class="flex min-w-0 items-center gap-2 xl:ml-2">
                        <Button size="small" variant="secondary" onClick={() => step(-1)}>
                          <Icon name="chevron-left" />
                        </Button>
                        <label class="flex min-w-64 items-center gap-2 rounded-md border border-success-base bg-background-base px-3 py-1.5 text-12-regular text-text-strong">
                          <span class="shrink-0 text-text-weaker">Section</span>
                          <input
                            data-testid="strudel-section-display"
                            value={name()}
                            onInput={(event) => renameSect(event.currentTarget.value)}
                            onBlur={saveName}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return
                              event.currentTarget.blur()
                            }}
                            class="min-w-0 flex-1 bg-transparent text-center text-12-regular text-text-strong outline-none"
                          />
                        </label>
                        <Button size="small" variant="secondary" onClick={() => step(1)}>
                          <Icon name="chevron-right" />
                        </Button>
                        <Button data-testid="strudel-section-duplicate" size="small" variant="ghost" onClick={clone}>
                          Duplicate
                        </Button>
                        <Button data-testid="strudel-section-delete" size="small" variant="ghost" onClick={erase}>
                          Delete
                        </Button>
                      </div>
                    </Show>
                  </div>
                  <div class="flex shrink-0 flex-wrap items-center gap-2">
                    <Button data-testid="strudel-section-play" size="small" variant="secondary" onClick={() => void playSect()}>
                      Play Section
                    </Button>
                    <Button
                      data-testid="strudel-record-melody"
                      size="small"
                      variant="secondary"
                      onClick={() =>
                        dialog.show(() => (
                          <DialogImportMelody
                            bpm={rate()}
                            div={beat()}
                            start="record"
                            onClose={() => dialog.close()}
                            onInsert={(code, meta) => {
                              plantCode("Imported Melody", "gm", code)
                              dialog.close()
                              showToast({
                                title: "Melody imported",
                                description: `Raw ${meta.raw}, kept ${meta.kept}, dropped ${meta.dropped}, cropped ${meta.cropped}, collisions ${meta.collisions}.`,
                              })
                            }}
                          />
                        ))
                      }
                    >
                      Record Melody
                    </Button>
                    <Button
                      data-testid="strudel-import-melody"
                      size="small"
                      variant="secondary"
                      onClick={() =>
                        dialog.show(() => (
                          <DialogImportMelody
                            bpm={rate()}
                            div={beat()}
                            start="upload"
                            onClose={() => dialog.close()}
                            onInsert={(code, meta) => {
                              plantCode("Imported Melody", "gm", code)
                              dialog.close()
                              showToast({
                                title: "Melody imported",
                                description: `Raw ${meta.raw}, kept ${meta.kept}, dropped ${meta.dropped}, cropped ${meta.cropped}, collisions ${meta.collisions}.`,
                              })
                            }}
                          />
                        ))
                      }
                    >
                      Import Melody
                    </Button>
                    <Button data-testid="strudel-play" size="small" onClick={() => void play()}>
                      Play Song
                    </Button>
                    <Button data-testid="strudel-pause" size="small" variant="ghost" onClick={pause}>
                      Pause
                    </Button>
                    <Button
                      data-testid="strudel-song-reset"
                      size="small"
                      variant="ghost"
                      onClick={() => dialog.show(() => <DialogResetSong />)}
                    >
                      Reset Song
                    </Button>
                  </div>
                </div>

              </div>

              <div class="min-h-0 min-w-0 flex-1 p-3">
                <Show when={tab() === "canvas"}>
                  <div
                    data-testid="strudel-section"
                    ref={area}
                    class="relative flex h-full min-h-[30rem] flex-col overflow-hidden rounded-lg border border-border-weak-base bg-background-base"
                    onDragOver={(event) => {
                      event.preventDefault()
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (!area) return
                      const raw = event.dataTransfer?.getData("text/plain")
                      if (!raw) return
                      try {
                        const item = JSON.parse(raw) as { name?: string; tone?: string }
                        if (!item.name || !item.tone) return
                        const box = area.getBoundingClientRect()
                        plant(item.name, item.tone, event.clientX - box.left - 64, event.clientY - box.top - 40)
                      } catch {}
                    }}
                    onPointerMove={(event) => {
                      const item = drag()
                      if (!item || !area) return
                      const box = area.getBoundingClientRect()
                      move(item.id, event.clientX - box.left - item.dx, event.clientY - box.top - item.dy)
                    }}
                    onPointerUp={() => setDrag()}
                    onPointerLeave={() => setDrag()}
                  >
                    <div class="pointer-events-none absolute inset-0 opacity-50" style={{
                      background:
                        "radial-gradient(circle at 20% 20%, rgba(59,130,246,.12), transparent 24%), radial-gradient(circle at 80% 30%, rgba(168,85,247,.1), transparent 26%), radial-gradient(circle at 40% 80%, rgba(20,184,166,.12), transparent 24%)",
                    }} />
                    <For each={cards()}>
                      {(card) => (
                        <button
                          type="button"
                          data-testid="strudel-section-card"
                          class="absolute z-10 flex h-20 w-32 flex-col items-center justify-center rounded-[999px] border text-center transition-all shadow-[0_0_0_1px_rgba(255,255,255,.05)]"
                          classList={{
                            "scale-110 ring-4 ring-success-base bg-success-base/20 shadow-[0_0_48px_rgba(34,197,94,.45)]": glow(card),
                            "border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,.08),0_0_28px_rgba(255,255,255,.14)]": openCard() === card.id,
                          }}
                          style={{
                            left: `${card.x}px`,
                            top: `${card.y}px`,
                            "background-color": `${card.color}22`,
                            "border-color": `${card.color}99`,
                            color: card.color,
                          }}
                          onPointerDown={(event) => {
                            const box = event.currentTarget.getBoundingClientRect()
                            setDrag({ id: card.id, dx: event.clientX - box.left, dy: event.clientY - box.top })
                            event.currentTarget.setPointerCapture(event.pointerId)
                          }}
                          onClick={() => setOpenCard((item) => (item === card.id ? "" : card.id))}
                        >
                          <div class="max-w-[6.5rem] truncate text-12-medium text-text-strong">{card.name}</div>
                        </button>
                      )}
                    </For>
                    <Show when={activeCard()}>
                      {(card) => (
                        <div
                          data-testid="strudel-section-card-code"
                          class="absolute z-30 w-[22rem] rounded-xl border border-border-weak-base bg-background-stronger/95 p-3 shadow-2xl backdrop-blur"
                          style={{
                            left: `${Math.min((card().x ?? 24) + 108, Math.max(24, (area?.clientWidth ?? 720) - 376))}px`,
                            top: `${Math.max(16, Math.min((card().y ?? 24) - 12, Math.max(24, (area?.clientHeight ?? 480) - 320)))}px`,
                          }}
                        >
                          <div class="mb-2 flex items-center justify-between gap-2">
                            <div class="min-w-0 flex-1">
                              <input
                                value={card().name}
                                onBlur={(event) => rename(card(), event.currentTarget.value)}
                                onKeyDown={(event) => {
                                  if (event.key !== "Enter") return
                                  event.currentTarget.blur()
                                }}
                                class="h-8 w-full rounded-md border border-border-weak-base bg-background-base px-2 text-13-medium text-text-strong outline-none"
                              />
                              <div class="text-12-regular text-text-weaker">{card().tone}</div>
                            </div>
                            <Button size="small" variant="ghost" onClick={() => setOpenCard("")}>
                              Close
                            </Button>
                          </div>
                          <div class="mb-2 flex items-center gap-2">
                            <Button size="small" variant="ghost" onClick={() => void solo(card())}>
                              {playScope() === "track" && playCard() === card().id ? "Unsolo" : "Solo"}
                            </Button>
                            <Button data-testid="strudel-track-duplicate" size="small" variant="ghost" onClick={() => cloneCard(card())}>
                              Duplicate
                            </Button>
                            <Button size="small" variant="ghost" onClick={() => mute(card())}>
                              {gainOf(card().code) <= 0 ? "Unmute" : "Mute"}
                            </Button>
                            <Button size="small" variant="ghost" onClick={() => drop(card())}>
                              Remove
                            </Button>
                          </div>
                          <label class="mb-2 flex items-center gap-2 rounded-md border border-border-weak-base bg-background-base px-2 py-1 text-12-regular text-text-weaker">
                            <span>Volume</span>
                            <input
                              data-testid="strudel-track-volume"
                              inputMode="decimal"
                              value={String(gainOf(card().code))}
                              onBlur={(event) => volume(card(), event.currentTarget.value)}
                              onKeyDown={(event) => {
                                if (event.key !== "Enter") return
                                event.currentTarget.blur()
                              }}
                              class="h-8 w-16 rounded-md border border-border-weak-base bg-background-stronger px-2 text-12-regular text-text-strong outline-none"
                            />
                          </label>
                          <textarea
                            value={card().code}
                            onInput={(event) => {
                              const text = event.currentTarget.value
                              patch((item) => ({
                                ...item,
                                cards: item.cards.map((row) => (row.id === card().id ? { ...row, code: text } : row)),
                              }))
                            }}
                            onBlur={() => void save()}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return
                              if (!event.metaKey && !event.ctrlKey) return
                              event.preventDefault()
                              void save()
                            }}
                            spellcheck={false}
                            class="min-h-28 w-full resize-y rounded-md border border-border-weak-base bg-background-base px-2 py-2 text-12-regular text-text-strong outline-none"
                            style={{ "font-family": "var(--font-mono)" }}
                          />
                        </div>
                      )}
                    </Show>
                  </div>
                </Show>
                <Show when={tab() === "console"}>
                  <div data-testid="strudel-console-wrap" class="flex h-full min-h-[30rem] flex-col rounded-lg border border-border-weak-base bg-background-base p-3">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="text-12-medium uppercase tracking-[0.12em] text-text-weaker">Strudel Console</div>
                      <Button data-testid="strudel-eval" size="small" variant="secondary" onClick={() => void evalCode()}>
                        Eval
                      </Button>
                      <Button data-testid="strudel-preload" size="small" variant="secondary" onClick={() => void preload()}>
                        Preload
                      </Button>
                    </div>
                    <Button data-testid="strudel-console-clear" size="small" variant="ghost" onClick={() => setLogs([])}>
                      Clear
                    </Button>
                  </div>
                  <div
                    data-testid="strudel-console"
                    class="max-h-[32rem] overflow-auto rounded-md bg-background-stronger px-2 py-2 text-12-regular text-text-weak"
                    style={{ "font-family": "var(--font-mono)" }}
                  >
                    <Show
                      when={logs().length > 0}
                      fallback={
                        <div data-testid="strudel-console-empty" class="text-text-weaker">
                          No Strudel runtime logs yet.
                        </div>
                      }
                    >
                      <div data-testid="strudel-console-lines" class="flex flex-col gap-1">
                        {logs().map((item) => (
                          <div data-testid="strudel-console-line">{item}</div>
                        ))}
                      </div>
                    </Show>
                  </div>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
