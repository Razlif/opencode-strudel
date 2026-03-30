import { createMemo, For, Match, Switch } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Logo } from "@opencode-ai/ui/logo"
import { useLayout } from "@/context/layout"
import { useNavigate } from "@solidjs/router"
import { base64Encode } from "@opencode-ai/util/encode"
import { Icon } from "@opencode-ai/ui/icon"
import { usePlatform } from "@/context/platform"
import { DateTime } from "luxon"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { DialogSelectDirectory } from "@/components/dialog-select-directory"
import { DialogSelectServer } from "@/components/dialog-select-server"
import { useServer } from "@/context/server"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"
import { useGlobalSDK } from "@/context/global-sdk"
import { resolveStrudelWorkspaceRoot } from "@/pages/strudel-workspace-root"

export default function Home() {
  const sync = useGlobalSync()
  const layout = useLayout()
  const platform = usePlatform()
  const dialog = useDialog()
  const navigate = useNavigate()
  const server = useServer()
  const language = useLanguage()
  const sdk = useGlobalSDK()
  const homedir = createMemo(() => sync.data.path.home)
  const recent = createMemo(() => {
    return sync.data.project
      .slice()
      .sort((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created))
      .slice(0, 5)
  })

  const serverDotClass = createMemo(() => {
    const healthy = server.healthy()
    if (healthy === true) return "bg-icon-success-base"
    if (healthy === false) return "bg-icon-critical-base"
    return "bg-border-weak-base"
  })

  async function openProject(directory: string) {
    const root = await resolveStrudelWorkspaceRoot(directory, async (target) => {
      const nodes =
        (
          await sdk
            .createClient({
              directory: target,
              throwOnError: true,
            })
            .file.list({ path: "" })
            .catch(() => ({ data: [] }))
        ).data ?? []
      return nodes.map((node) => (node.type === "directory" ? `${node.name}/` : node.name))
    })
    layout.projects.open(root)
    server.projects.touch(root)
    navigate(`/${base64Encode(root)}`)
  }

  async function chooseProject() {
    function resolve(result: string | string[] | null) {
      if (Array.isArray(result)) {
        for (const directory of result) {
          void openProject(directory)
        }
      } else if (result) {
        void openProject(result)
      }
    }

    if (platform.openDirectoryPickerDialog && server.isLocal()) {
      const result = await platform.openDirectoryPickerDialog?.({
        title: language.t("command.project.open"),
        multiple: true,
      })
      resolve(result)
    } else {
      dialog.show(
        () => <DialogSelectDirectory multiple={true} onSelect={resolve} />,
        () => resolve(null),
      )
    }
  }

  return (
    <div class="mx-auto mt-55 w-full md:w-auto px-4">
      <Logo class="md:w-xl opacity-12" />
      <Button
        size="large"
        variant="ghost"
        class="mt-4 mx-auto text-14-regular text-text-weak"
        onClick={() => dialog.show(() => <DialogSelectServer />)}
      >
        <div
          classList={{
            "size-2 rounded-full": true,
            [serverDotClass()]: true,
          }}
        />
        {server.name}
      </Button>
      <Switch>
        <Match when={sync.data.project.length > 0}>
          <div class="mt-20 w-full flex flex-col gap-4">
            <div class="flex gap-2 items-center justify-between pl-3">
              <div class="text-14-medium text-text-strong">{language.t("home.recentProjects")}</div>
              <Button icon="folder-add-left" size="normal" class="pl-2 pr-3" onClick={chooseProject}>
                {language.t("command.project.open")}
              </Button>
            </div>
            <ul class="flex flex-col gap-2">
              <For each={recent()}>
                {(project) => (
                  <Button
                    size="large"
                    variant="ghost"
                    class="text-14-mono text-left justify-between px-3"
                    onClick={() => void openProject(project.worktree)}
                  >
                    {project.worktree.replace(homedir(), "~")}
                    <div class="text-14-regular text-text-weak">
                      {DateTime.fromMillis(project.time.updated ?? project.time.created).toRelative()}
                    </div>
                  </Button>
                )}
              </For>
            </ul>
          </div>
        </Match>
        <Match when={true}>
          <div class="mt-30 mx-auto flex flex-col items-center gap-3">
            <Icon name="folder-add-left" size="large" />
            <div class="flex flex-col gap-1 items-center justify-center">
              <div class="text-14-medium text-text-strong">{language.t("home.empty.title")}</div>
              <div class="text-12-regular text-text-weak">{language.t("home.empty.description")}</div>
            </div>
            <Button class="px-3 mt-1" onClick={chooseProject}>
              {language.t("command.project.open")}
            </Button>
          </div>
        </Match>
      </Switch>
      <div class="mt-16 rounded-xl border border-border-weak-base bg-background-panel p-4">
        <div class="text-13-medium text-text-strong">Credits & licensing</div>
        <div class="mt-2 text-12-regular text-text-weak">
          Strudel Studio is built from OpenCode and uses Strudel for browser-based live coding and playback.
        </div>
        <div class="mt-3 flex flex-wrap gap-2 text-12-regular">
          <a
            class="rounded-md border border-border-weak-base px-2.5 py-1.5 text-text-strong hover:bg-background-base"
            href="https://github.com/anomalyco/opencode"
            target="_blank"
            rel="noreferrer"
          >
            OpenCode
          </a>
          <a
            class="rounded-md border border-border-weak-base px-2.5 py-1.5 text-text-strong hover:bg-background-base"
            href="https://strudel.cc/"
            target="_blank"
            rel="noreferrer"
          >
            Strudel
          </a>
          <a
            class="rounded-md border border-border-weak-base px-2.5 py-1.5 text-text-strong hover:bg-background-base"
            href="https://codeberg.org/uzu/strudel"
            target="_blank"
            rel="noreferrer"
          >
            Strudel license
          </a>
        </div>
        <div class="mt-3 text-12-regular text-text-weaker">
          Remote sample sources currently referenced by the app include TidalCycles dirt-samples and Felix Roos dough-samples.
        </div>
      </div>
    </div>
  )
}
