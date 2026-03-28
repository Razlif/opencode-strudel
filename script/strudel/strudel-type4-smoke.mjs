import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const sounds = [
  "gm_piano",
  "gm_electric_bass_finger",
  "gm_oboe",
  "gm_pad_warm",
  "gm_string_ensemble_1",
];

function root() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function script() {
  return path.join(root(), "script", "strudel", "strudel-runtime-smoke.mjs");
}

function code(name) {
  if (name === "gm_electric_bass_finger") {
    return `note("<c2 g1 bb1 g1>").s(${JSON.stringify(name)}).gain(.5)`;
  }
  if (name === "gm_pad_warm" || name === "gm_string_ensemble_1") {
    return `note("<[c4,e4,g4] [f4,a4,c5]>/2").s(${JSON.stringify(name)}).gain(.35)`;
  }
  return `note("<c4 e4 g4 a4>").s(${JSON.stringify(name)}).gain(.45)`;
}

function parse(text) {
  const body = text.trim();
  if (!body) throw new Error("runtime smoke produced no output");
  const start = body.lastIndexOf("\n{");
  return JSON.parse(start === -1 ? body : body.slice(start + 1));
}

async function run(name) {
  const proc = Bun.spawn([process.execPath, script(), "--stdin", "--json"], {
    cwd: root(),
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = new TextEncoder().encode(code(name));
  if ("write" in proc.stdin && typeof proc.stdin.write === "function") {
    await proc.stdin.write(text);
    await proc.stdin.end();
  } else {
    const writer = proc.stdin.getWriter();
    await writer.write(text);
    await writer.close();
  }
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const done = await proc.exited;
  const json = stdout.trim() ? parse(stdout) : null;
  if (json) return json;
  throw new Error(stderr.trim() || `${name} smoke failed with exit ${done}`);
}

async function main() {
  const results = [];
  for (const name of sounds) {
    const result = await run(name).catch((err) => ({
      ok: false,
      summary: err instanceof Error ? err.message : String(err),
    }));
    results.push({ sound: name, ...result });
  }

  const ok = results.every((item) => item.ok);
  console.log(`type4: ${ok ? "passed" : "failed"}`);
  console.log("");
  for (const item of results) {
    console.log(`${item.ok ? "ok" : "fail"} ${item.sound}`);
    console.log(`  ${item.summary}`);
  }
  process.exitCode = ok ? 0 : 1;
}

await main();
