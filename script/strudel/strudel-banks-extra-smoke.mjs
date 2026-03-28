import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const names = ["BossDR550", "KorgDDM110", "RolandMT32"];

function root() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function script() {
  return path.join(root(), "script", "strudel", "strudel-runtime-smoke.mjs");
}

function code(name) {
  return `stack(
  sound("bd hh sd hh").bank(${JSON.stringify(name)}),
  note("<c3 g3 bb3 g3>").slow(2).gain(.45)
)`;
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
  const list = await Promise.all(
    names.map(async (name) => ({
      sound: name,
      ...(await run(name).catch((err) => ({
        ok: false,
        summary: err instanceof Error ? err.message : String(err),
      }))),
    })),
  );
  const ok = list.every((item) => item.ok);
  console.log(`banks-extra: ${ok ? "passed" : "failed"}`);
  console.log("");
  for (const item of list) {
    console.log(`${item.ok ? "ok" : "fail"} ${item.sound}`);
    console.log(`  ${item.summary}`);
  }
  process.exitCode = ok ? 0 : 1;
}

await main();
