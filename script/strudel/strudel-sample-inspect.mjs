import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { loadSupport } from "./strudel-sample-support.mjs";

function parseArgs(argv) {
  const options = {
    file: null,
    sample: null,
    stdin: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file" && argv[i + 1]) {
      options.file = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--sample" && argv[i + 1]) {
      options.sample = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--stdin") {
      options.stdin = true;
      options.file = null;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
    }
  }

  return options;
}

function result(input) {
  return {
    ok: input.ok,
    summary: input.summary,
    errors: input.errors ?? [],
    warnings: input.warnings ?? [],
    notes: input.notes ?? [],
    ...(input.used ? { used: input.used } : {}),
    ...(input.supported ? { supported: input.supported } : {}),
    ...(input.missing ? { missing: input.missing } : {}),
    ...(input.packs ? { packs: input.packs } : {}),
    ...(input.label ? { label: input.label } : {}),
  };
}

function fail(options, input) {
  const out = result({ ok: false, ...input });
  if (options.json) {
    console.log(JSON.stringify(out, null, 2));
    process.exitCode = 1;
    return null;
  }
  return out;
}

function buildIndex(support) {
  const index = new Map();

  for (const name of support.builtins) {
    index.set(name, { source: "builtin" });
  }
  for (const name of support.named) {
    index.set(name, { source: "named" });
  }
  for (const name of support.gm) {
    index.set(name, { source: "gm" });
  }
  for (const name of support.ext) {
    index.set(name, { source: "external" });
  }

  return index;
}

function normalizeSampleToken(token) {
  const trimmed = token.trim();
  if (!trimmed || trimmed === "~" || trimmed === "-") {
    return null;
  }

  let normalized = trimmed;
  normalized = normalized.replace(/^[<>\[\]\(\)\{\},]+|[<>\[\]\(\)\{\},]+$/g, "");
  normalized = normalized.replace(/[:/].*$/, "");
  normalized = normalized.replace(/[*!?@].*$/, "");

  if (!normalized || normalized === "~" || normalized === "-") {
    return null;
  }
  return normalized;
}

function extractSampleCalls(source) {
  const found = new Set();
  const callRegexes = [
    /\b(?:s|sound)\(\s*(['"`])([\s\S]*?)\1\s*\)/g,
    /\.s\(\s*(['"`])([\s\S]*?)\1\s*\)/g,
  ];

  for (const regex of callRegexes) {
    let match;
    while ((match = regex.exec(source)) !== null) {
      const contents = match[2];
      const tokens = contents.split(/[\s,\[\]<>]+/);
      for (const token of tokens) {
        const normalized = normalizeSampleToken(token);
        if (normalized) {
          found.add(normalized);
        }
      }
    }
  }

  return [...found].sort();
}

function extractSamplePackLoads(source) {
  const packs = [];
  const regex = /\bsamples\(\s*(['"`])([\s\S]*?)\1/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const value = match[2].trim();
    if (value.startsWith("github:") || value.startsWith("http")) {
      packs.push(value);
    }
  }
  return packs;
}

function githubShortcutToManifestUrl(pack) {
  if (!pack.startsWith("github:")) {
    return null;
  }

  const body = pack.slice("github:".length);
  const parts = body.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const [user, repo, ...branchParts] = parts;
  const branch = branchParts.length ? branchParts.join("/") : "main";
  return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/strudel.json`;
}

async function resolvePackManifest(pack) {
  const url = githubShortcutToManifestUrl(pack) ?? pack;
  if (!url) {
    return {
      pack,
      ok: false,
      error: "unsupported pack format",
      names: [],
    };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        pack,
        ok: false,
        error: `HTTP ${response.status} for ${url}`,
        names: [],
      };
    }
    const json = await response.json();
    const names = Object.keys(json).filter((key) => key !== "_base").sort();
    return {
      pack,
      ok: true,
      url,
      names,
    };
  } catch (error) {
    return {
      pack,
      ok: false,
      error: error?.message ?? String(error),
      names: [],
    };
  }
}

async function readStdin() {
  let text = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    text += chunk;
  }
  return text;
}

function printSampleInfo(name, info) {
  console.log(`${name}`);
  console.log(`  source: ${info?.source ?? "unknown"}`);
}

function deriveManifestFallbackInfo(name, manifestNames) {
  if (!manifestNames.has(name)) {
    return null;
  }
  return {
    source: "manifest",
  };
}

async function inspectFile(file, support, index) {
  const absFile = path.resolve(file);
  const source = await fs.readFile(absFile, "utf8");
  return inspectSource(source, support, index, absFile);
}

async function inspectSource(source, support, index, label) {
  const sampleNames = extractSampleCalls(source);
  const samplePacks = extractSamplePackLoads(source);
  const manifests = await Promise.all([...new Set([...support.packs, ...samplePacks])].map((pack) => resolvePackManifest(pack)));
  const manifestNames = new Set(manifests.flatMap((manifest) => manifest.names));
  const supported = [];
  const missing = [];
  const warnings = [];

  console.log(`file: ${label}`);
  console.log("");

  if (samplePacks.length) {
    console.log("loaded packs:");
    for (const pack of samplePacks) {
      console.log(`  - ${pack}`);
    }
    console.log("");
  }

  if (manifests.length) {
    console.log("pack manifests:");
    for (const manifest of manifests) {
      if (manifest.ok) {
        console.log(`  - ok: ${manifest.pack}`);
        console.log(`    names: ${manifest.names.length}`);
      } else {
        console.log(`  - failed: ${manifest.pack}`);
        console.log(`    reason: ${manifest.error}`);
      }
    }
    console.log("");
  }

  if (!sampleNames.length) {
    console.log("no sample calls found");
    return result({
      ok: true,
      summary: "No sample calls found",
      used: [],
      supported: [],
      missing: [],
      warnings: [],
      packs: samplePacks,
      label,
    });
  }

  const unknown = [];
  console.log("sample usage:");
  for (const name of sampleNames) {
    const info = index.get(name) ?? deriveManifestFallbackInfo(name, manifestNames);
    printSampleInfo(name, info);
    if (!info) {
      unknown.push(name);
      missing.push(name);
    } else {
      supported.push(name);
    }
  }

  console.log("");
  if (unknown.length) {
    console.log("warnings:");
    for (const name of unknown) {
      console.log(`  - ${name}: not found in runtime support or loaded pack manifests`);
    }
    warnings.push(...unknown.map((name) => `${name}: not found in runtime support or loaded pack manifests`));
  } else {
    console.log("all sample names were found in runtime support or loaded pack manifests");
  }

  return result({
    ok: unknown.length === 0,
    summary:
      unknown.length === 0
        ? `Verified ${sampleNames.length} sample name(s)`
        : `Found ${unknown.length} unknown sample name(s)`,
    used: sampleNames,
    supported,
    missing: [...new Set(missing)],
    warnings,
    packs: manifests.map((manifest) => ({
      pack: manifest.pack,
      ok: manifest.ok,
      ...(manifest.url ? { url: manifest.url } : {}),
      names: manifest.names.length,
      ...(manifest.error ? { error: manifest.error } : {}),
    })),
    label,
  });
}

async function inspectSingleSample(sample, index) {
  const normalized = normalizeSampleToken(sample);
  if (!normalized) {
    throw new Error(`Could not normalize sample name "${sample}"`);
  }

  const info = index.get(normalized);
  const fallbackInfo = info ?? null;
  printSampleInfo(normalized, fallbackInfo);
  if (!fallbackInfo) {
    console.log("warning: sample not found in runtime support");
  }
  return result({
    ok: Boolean(fallbackInfo),
    summary: fallbackInfo ? `Verified sample ${normalized}` : `Sample ${normalized} not found in runtime support`,
    used: [normalized],
    supported: fallbackInfo ? [normalized] : [],
    missing: fallbackInfo ? [] : [normalized],
    warnings: fallbackInfo ? [] : [`${normalized}: not found in runtime support`],
    label: "<sample>",
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const support = await loadSupport().catch((error) => {
    fail(options, {
      summary: "Failed to load runtime sample support",
      errors: [{ kind: "runtime", message: error?.stack ?? String(error) }],
    });
    if (!options.json) {
      console.error(error?.stack ?? error);
    }
    return null;
  });
  if (!support) {
    return;
  }
  const index = buildIndex(support);

  if (options.sample) {
    const out = await inspectSingleSample(options.sample, index);
    if (options.json) {
      console.log(JSON.stringify(out, null, 2));
    }
    return;
  }

  if (options.file) {
    const out = await inspectFile(options.file, support, index);
    if (options.json) {
      console.log(JSON.stringify(out, null, 2));
    }
    return;
  }

  if (options.stdin) {
    const out = await inspectSource(await readStdin(), support, index, "<stdin>");
    if (options.json) {
      console.log(JSON.stringify(out, null, 2));
    }
    return;
  }

  console.log("usage:");
  console.log("  node scripts/strudel-sample-inspect.mjs --file main.js");
  console.log("  node scripts/strudel-sample-inspect.mjs --sample amen");
}

await main();
