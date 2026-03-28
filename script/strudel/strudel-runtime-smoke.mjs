import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packs = [
  "github:tidalcycles/dirt-samples/master",
  "https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json",
  "https://raw.githubusercontent.com/felixroos/dough-samples/main/vcsl.json",
  "https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json",
];
const builtins = new Set([
  "bd",
  "sd",
  "rim",
  "cp",
  "hh",
  "oh",
  "cr",
  "rd",
  "ht",
  "mt",
  "lt",
  "sh",
  "cb",
  "tb",
  "perc",
  "misc",
  "fx",
  "sine",
  "triangle",
  "square",
  "sawtooth",
  "supersaw",
  "pulse",
  "piano",
  "cajon",
  "kawai",
  "recorder_tenor_sus",
  "recorder_bass_sus",
  "harmonica_soft",
  "sax",
  "ocarina",
  "psaltery_pluck",
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
  "gm_ocarina",
  "gm_overdriven_guitar",
  "gm_pad_bowed",
  "gm_pad_choir",
  "gm_pad_halo",
  "gm_pad_metallic",
  "gm_pad_poly",
  "gm_percussive_organ",
  "gm_piccolo",
  "gm_pizzicato_strings",
  "gm_piano",
  "gm_recorder",
  "gm_reed_organ",
  "gm_rock_organ",
  "gm_electric_bass_finger",
  "gm_oboe",
  "gm_pad_warm",
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
]);
const banks = [
  "RolandTR808",
  "RolandTR909",
  "LinnDrum",
  "Linn9000",
  "AkaiLinn",
  "YamahaRY30",
  "BossDR110",
  "BossDR550",
  "AlesisHR16",
  "KorgDDM110",
  "RolandMT32",
  "SequentialCircuitsDrumtracks",
  "RolandTR606",
];
const alias = {
  linn: "LinnDrum",
  linndrum: "LinnDrum",
  linn9000: "Linn9000",
  "9000": "Linn9000",
  tr808: "RolandTR808",
  tr909: "RolandTR909",
};

function root() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function parseArgs(argv) {
  const opts = {
    file: null,
    sample: null,
    stdin: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file" && argv[i + 1]) {
      opts.file = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--sample" && argv[i + 1]) {
      opts.sample = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--stdin") {
      opts.stdin = true;
      continue;
    }
    if (arg === "--json") {
      opts.json = true;
    }
  }

  return opts;
}

function parse(text) {
  const body = text.trim();
  if (!body) throw new Error("script produced no output");
  const start = body.lastIndexOf("\n{");
  return JSON.parse(start === -1 ? body : body.slice(start + 1));
}

async function readStdin() {
  let text = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    text += chunk;
  }
  return text;
}

function script(name) {
  return path.join(root(), "script", "strudel", name);
}

async function run(name, code) {
  const proc = Bun.spawn([process.execPath, script(name), "--stdin", "--json"], {
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
  const codeExit = await proc.exited;
  const json = stdout.trim() ? parse(stdout) : null;
  if (codeExit === 0 && json) return json;
  if (json) return json;
  throw new Error(stderr.trim() || `${name} failed`);
}

function wrap(code) {
  const head = packs.map((item) => `samples(${JSON.stringify(item)})`).join("\n");
  return `${head}\n\n${code.trim()}\n`;
}

function probe(name) {
  if (name.startsWith("gm_") || name === "piano") {
    return `note("c4 e4 g4").s(${JSON.stringify(name)})`;
  }
  return `s(${JSON.stringify(name)})`;
}

function normalize(code) {
  return code.replace(/\.piano\(\)/g, `.s("piano")`);
}

function manifestMiss(warnings) {
  return warnings
    .filter((item) => item.includes(": not found in the currently loaded pack manifests"))
    .map((item) => map(item.split(":")[0]?.trim() ?? ""))
    .filter(Boolean);
}

function map(name) {
  const text = name.trim();
  if (text in alias) return alias[text];
  const hit = text.match(/^([a-z0-9]+)_(.+)$/i);
  if (!hit) return text;
  const head = hit[1]?.toLowerCase();
  if (!head || !(head in alias)) return text;
  return `${alias[head]}_${hit[2]}`;
}

function helper(code) {
  const used = [];
  if (/\.piano\(\)/.test(code)) used.push("piano");
  return used;
}

function builtinMiss(used, code) {
  return [...new Set([...used, ...helper(code)].map(map))].filter((item) => !builtins.has(item) && !banks.some((bank) => item.startsWith(`${bank}_`)));
}

function supported(name) {
  return builtins.has(name) || banks.some((bank) => name.startsWith(`${bank}_`));
}

function bankMiss(code) {
  const miss = [];
  const regex = /\.bank\(\s*(['"`])([^'"`]+)\1\s*\)/g;
  let hit;
  while ((hit = regex.exec(code)) !== null) {
    const name = hit[2]?.trim();
    const item = name ? map(name) : "";
    if (item && !banks.includes(item)) miss.push(item);
  }
  return miss;
}

async function source(opts) {
  if (opts.sample) return probe(opts.sample);
  if (opts.stdin) return readStdin();
  if (opts.file) return fs.readFile(path.resolve(opts.file), "utf8");
  throw new Error("pass --file, --stdin, or --sample");
}

function result(debug, samples, label, code) {
  const missing = [
    ...new Set([
      ...((samples.missing ?? []).map(map)),
      ...manifestMiss(samples.warnings ?? []),
      ...builtinMiss(samples.used ?? [], code),
      ...bankMiss(code),
    ]),
  ].filter((item) => !supported(item));
  return {
    ok: Boolean(debug.ok) && missing.length === 0,
    label,
    summary:
      debug.ok && missing.length === 0
        ? "Runtime smoke passed"
        : `Runtime smoke failed${missing.length ? `: ${missing.join(", ")}` : ""}`,
    baseline: packs,
    debug: {
      ok: Boolean(debug.ok),
      summary: debug.summary,
      warnings: debug.warnings ?? [],
      errors: debug.errors ?? [],
    },
    samples: {
      ok: Boolean(samples.ok),
      summary: samples.summary,
      used: samples.used ?? [],
      supported: samples.supported ?? [],
      missing,
      warnings: samples.warnings ?? [],
      packs: samples.packs ?? [],
    },
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const src = await source(opts);
  const code = normalize(src);
  const full = wrap(code);
  const [debug, samples] = await Promise.all([
    run("strudel-debug.mjs", code),
    run("strudel-sample-inspect.mjs", full),
  ]);
  const out = result(debug, samples, opts.sample ?? opts.file ?? "<stdin>", code);

  if (opts.json) {
    console.log(JSON.stringify(out, null, 2));
    process.exitCode = out.ok ? 0 : 1;
    return;
  }

  console.log(`label: ${out.label}`);
  console.log(`summary: ${out.summary}`);
  console.log("");
  console.log("baseline packs:");
  for (const item of out.baseline) {
    console.log(`  - ${item}`);
  }
  console.log("");
  console.log(`debug: ${out.debug.ok ? "ok" : "failed"}`);
  console.log(`  ${out.debug.summary}`);
  if (out.debug.warnings.length) {
    for (const item of out.debug.warnings) {
      console.log(`  warning: ${item}`);
    }
  }
  console.log("");
  console.log(`samples: ${out.samples.ok ? "ok" : "failed"}`);
  console.log(`  ${out.samples.summary}`);
  if (out.samples.used.length) {
    console.log(`  used: ${out.samples.used.join(", ")}`);
  }
  if (out.samples.missing.length) {
    for (const item of out.samples.missing) {
      console.log(`  missing: ${item}`);
    }
  }
  process.exitCode = out.ok ? 0 : 1;
}

await main();
