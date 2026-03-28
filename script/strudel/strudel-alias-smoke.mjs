import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const cases = [
  {
    name: "piano helper",
    code: `note("<c4 e4 g4 a4>").piano().gain(.45)`,
  },
  {
    name: "bank alias linn",
    code: `s("bd hh sd hh").bank("linn").gain(.5)`,
  },
  {
    name: "bank alias tr909",
    code: `s("bd hh sd hh").bank("tr909").gain(.5)`,
  },
  {
    name: "bank alias 9000",
    code: `s("bd hh sd hh").bank("9000").gain(.5)`,
  },
  {
    name: "bank alias linndrum",
    code: `s("bd hh sd hh").bank("linndrum").gain(.5)`,
  },
  {
    name: "bank alias linn9000",
    code: `s("bd hh sd hh").bank("linn9000").gain(.5)`,
  },
  {
    name: "direct alias linndrum_bd",
    code: `s("linndrum_bd").gain(.5)`,
  },
  {
    name: "direct alias linn9000_bd",
    code: `s("linn9000_bd").gain(.5)`,
  },
  {
    name: "direct alias 9000_cb",
    code: `s("9000_cb").gain(.5)`,
  },
];

function root() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function script() {
  return path.join(root(), "script", "strudel", "strudel-runtime-smoke.mjs");
}

function parse(text) {
  const body = text.trim();
  if (!body) throw new Error("runtime smoke produced no output");
  const start = body.lastIndexOf("\n{");
  return JSON.parse(start === -1 ? body : body.slice(start + 1));
}

async function run(code) {
  const proc = Bun.spawn([process.execPath, script(), "--stdin", "--json"], {
    cwd: root(),
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = new TextEncoder().encode(code);
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
  throw new Error(stderr.trim() || `alias smoke failed with exit ${done}`);
}

async function main() {
  const list = [];
  for (const item of cases) {
    list.push({
      name: item.name,
      ...(await run(item.code).catch((err) => ({
        ok: false,
        summary: err instanceof Error ? err.message : String(err),
      }))),
    });
  }
  const ok = list.every((item) => item.ok);
  console.log(`aliases: ${ok ? "passed" : "failed"}`);
  console.log("");
  console.log(`checked: ${list.length}`);
  if (ok) {
    console.log(`ok: ${list.length}`);
    process.exitCode = 0;
    return;
  }
  for (const item of list.filter((item) => !item.ok)) {
    console.log(`fail ${item.name}`);
    console.log(`  ${item.summary}`);
  }
  process.exitCode = 1;
}

await main();
