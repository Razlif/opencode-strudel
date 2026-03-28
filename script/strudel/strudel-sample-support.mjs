import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const builtins = {
  abbreviations: ["bd", "sd", "rim", "cp", "hh", "oh", "cr", "rd", "ht", "mt", "lt", "sh", "cb", "tb", "perc", "misc", "fx"],
  synths: ["sine", "triangle", "square", "sawtooth", "supersaw", "pulse"],
  dirt: ["amen", "apache", "funkydrummer", "impeach", "think", "groove", "breaks", "breaks-gated", "breaks-noquant"],
};

function root() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

async function loadRuntime() {
  const file = path.join(root(), "packages", "app", "src", "pages", "session", "strudel-runtime.ts");
  const source = await fs.readFile(file, "utf8");
  const marker = "export const runtime =";
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error("Could not locate runtime object in strudel-runtime.ts");
  }

  const body = source.slice(start + marker.length);
  const end = body.indexOf("} as const");
  if (end === -1) {
    throw new Error("Could not locate runtime object terminator in strudel-runtime.ts");
  }

  const objectSource = `${body.slice(0, end + 1).trim()}`;
  return Function(`return (${objectSource});`)();
}

export async function loadSupport() {
  const runtime = await loadRuntime();
  return {
    packs: Object.values(runtime.packs),
    banks: [...runtime.banks],
    named: [...runtime.named],
    gm: [...runtime.gm],
    ext: runtime.ext.map((item) => item.name),
    builtins: [...builtins.abbreviations, ...builtins.synths, ...builtins.dirt],
  };
}
