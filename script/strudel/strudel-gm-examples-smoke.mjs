import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const names = [
  "gm_accordion",
  "gm_acoustic_guitar_nylon",
  "gm_acoustic_guitar_steel",
  "gm_applause",
  "gm_baritone_sax",
  "gm_bassoon",
  "gm_bird_tweet",
  "gm_brass_section",
  "gm_choir_aahs",
  "gm_church_organ",
  "gm_clarinet",
  "gm_distortion_guitar",
  "gm_drawbar_organ",
  "gm_dulcimer",
  "gm_electric_bass_finger",
  "gm_electric_bass_pick",
  "gm_electric_guitar_clean",
  "gm_electric_guitar_jazz",
  "gm_flute",
  "gm_fretless_bass",
  "gm_fx_brightness",
  "gm_gunshot",
  "gm_harmonica",
  "gm_lead_1_square",
  "gm_lead_2_sawtooth",
  "gm_lead_8_bass_lead",
  "gm_marimba",
  "gm_oboe",
  "gm_ocarina",
  "gm_overdriven_guitar",
  "gm_pad_bowed",
  "gm_pad_choir",
  "gm_pad_halo",
  "gm_pad_metallic",
  "gm_pad_poly",
  "gm_pad_warm",
  "gm_percussive_organ",
  "gm_piano",
  "gm_piccolo",
  "gm_pizzicato_strings",
  "gm_recorder",
  "gm_reed_organ",
  "gm_rock_organ",
  "gm_string_ensemble_1",
  "gm_string_ensemble_2",
  "gm_synth_bass_1",
  "gm_synth_bass_2",
  "gm_synth_strings_1",
  "gm_synth_strings_2",
  "gm_tenor_sax",
  "gm_trombone",
  "gm_trumpet",
  "gm_tuba",
  "gm_vibraphone",
  "gm_violin",
];

function root() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function script() {
  return path.join(root(), "script", "strudel", "strudel-runtime-smoke.mjs");
}

function parseArgs(argv) {
  return {
    verbose: argv.includes("--verbose"),
    json: argv.includes("--json"),
  };
}

function code(name) {
  if (name.includes("bass")) {
    return `note("<c2 g1 bb1 g1>").s(${JSON.stringify(name)}).gain(.45)`;
  }
  if (name.includes("pad") || name.includes("ensemble") || name.includes("strings")) {
    return `note("<[c4,e4,g4] [f4,a4,c5]>/2").s(${JSON.stringify(name)}).gain(.28)`;
  }
  if (name === "gm_applause" || name === "gm_gunshot" || name === "gm_bird_tweet" || name === "gm_fx_brightness") {
    return `s(${JSON.stringify(name)}).gain(.45)`;
  }
  return `note("<c4 e4 g4 a4>").s(${JSON.stringify(name)}).gain(.4)`;
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
  const opts = parseArgs(process.argv.slice(2));
  const list = [];
  for (const name of names) {
    list.push({
      sound: name,
      ...(await run(name).catch((err) => ({
        ok: false,
        summary: err instanceof Error ? err.message : String(err),
      }))),
    });
  }
  const ok = list.every((item) => item.ok);
  if (opts.json) {
    console.log(JSON.stringify({ ok, count: list.length, results: list }, null, 2));
    process.exitCode = ok ? 0 : 1;
    return;
  }
  const fail = list.filter((item) => !item.ok);
  console.log(`gm-examples: ${ok ? "passed" : "failed"}`);
  console.log("");
  console.log(`checked: ${list.length}`);
  if (!opts.verbose && ok) {
    console.log(`ok: ${list.length}`);
    process.exitCode = 0;
    return;
  }
  for (const item of opts.verbose ? list : fail) {
    console.log(`${item.ok ? "ok" : "fail"} ${item.sound}`);
    console.log(`  ${item.summary}`);
  }
  process.exitCode = ok ? 0 : 1;
}

await main();
