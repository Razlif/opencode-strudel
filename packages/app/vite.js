import solidPlugin from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "url"

const strudel = {
  core: fileURLToPath(new URL("../../node_modules/.bun/@strudel+core@1.2.6/node_modules/@strudel/core", import.meta.url)),
  draw: fileURLToPath(new URL("../../node_modules/.bun/@strudel+draw@1.2.6/node_modules/@strudel/draw", import.meta.url)),
  mini: fileURLToPath(new URL("../../node_modules/.bun/@strudel+mini@1.2.6/node_modules/@strudel/mini", import.meta.url)),
  tonal: fileURLToPath(new URL("../../node_modules/.bun/@strudel+tonal@1.2.6/node_modules/@strudel/tonal", import.meta.url)),
  transpiler: fileURLToPath(new URL("../../node_modules/.bun/@strudel+transpiler@1.2.6/node_modules/@strudel/transpiler", import.meta.url)),
  webaudio: fileURLToPath(new URL("../../node_modules/.bun/@strudel+webaudio@1.3.0/node_modules/@strudel/webaudio", import.meta.url)),
  web: fileURLToPath(new URL("../../node_modules/.bun/@strudel+web@1.3.0/node_modules/@strudel/web", import.meta.url)),
  soundfonts: fileURLToPath(new URL("../../node_modules/.bun/@strudel+soundfonts@1.3.0/node_modules/@strudel/soundfonts", import.meta.url)),
}

/**
 * @type {import("vite").PluginOption}
 */
export default [
  {
    name: "opencode-desktop:config",
    config() {
      return {
        resolve: {
          dedupe: [
            "@strudel/core",
            "@strudel/mini",
            "@strudel/tonal",
            "@strudel/transpiler",
            "@strudel/webaudio",
            "@strudel/web",
            "@strudel/soundfonts",
          ],
          alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "@strudel/core": strudel.core,
            "@strudel/draw": strudel.draw,
            "@strudel/mini": strudel.mini,
            "@strudel/tonal": strudel.tonal,
            "@strudel/transpiler": strudel.transpiler,
            "@strudel/webaudio": strudel.webaudio,
            "@strudel/web": strudel.web,
            "@strudel/soundfonts": strudel.soundfonts,
          },
        },
        optimizeDeps: {
          exclude: [
            "@strudel/core",
            "@strudel/draw",
            "@strudel/mini",
            "@strudel/tonal",
            "@strudel/transpiler",
            "@strudel/webaudio",
            "@strudel/web",
            "@strudel/soundfonts",
          ],
        },
        worker: {
          format: "es",
        },
      }
    },
  },
  tailwindcss(),
  solidPlugin(),
]
