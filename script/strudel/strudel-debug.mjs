import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

function parseArgs(argv) {
  const options = {
    file: "main.js",
    start: 0,
    end: 1,
    showTranspiled: false,
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
    if (arg === "--start" && argv[i + 1]) {
      options.start = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--end" && argv[i + 1]) {
      options.end = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--cycles" && argv[i + 1]) {
      options.end = options.start + Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--show-transpiled") {
      options.showTranspiled = true;
      continue;
    }
    if (arg === "--stdin") {
      options.stdin = true;
      options.file = null;
    }
    if (arg === "--json") {
      options.json = true;
    }
  }

  return options;
}

function makeNoop(name) {
  return (...args) => {
    console.log(`[shim] ${name}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`);
    return undefined;
  };
}

function formatEvent(event) {
  if (typeof event?.show === "function") {
    return event.show();
  }
  try {
    return JSON.stringify(event);
  } catch {
    return String(event);
  }
}

function collectEventWarnings(events) {
  const warnings = [];
  const suspiciousMiniNotation = /[\[\]<>~]/;

  for (const event of events) {
    const value = event?.value;
    if (!value || typeof value !== "object") {
      continue;
    }

    if (typeof value.note === "string" && suspiciousMiniNotation.test(value.note)) {
      warnings.push(
        `suspicious note payload remained unparsed: ${JSON.stringify(value.note)}`
      );
    }

    if (typeof value.s === "string" && /[<>\[\],~\s]/.test(value.s)) {
      warnings.push(
        `suspicious sound payload remained unparsed: ${JSON.stringify(value.s)}`
      );
    }
  }

  return [...new Set(warnings)];
}

function result(input) {
  return {
    ok: input.ok,
    summary: input.summary,
    errors: input.errors ?? [],
    warnings: input.warnings ?? [],
    notes: input.notes ?? [],
    ...(input.events !== undefined ? { events: input.events } : {}),
    ...(input.arc ? { arc: input.arc } : {}),
    ...(input.label ? { label: input.label } : {}),
    ...(input.transpiled ? { transpiled: input.transpiled } : {}),
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

async function loadRuntime(options) {
  const req = createRequire(import.meta.url);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const paths = [path.join(root, "packages", "app"), path.join(root, "node_modules", ".bun", "node_modules")];
  const load = async (name) => {
    try {
      return await import(name);
    } catch {
      const resolved = req.resolve(name, { paths });
      return import(pathToFileURL(resolved).href);
    }
  };

  try {
    const core = await load("@strudel/core");
    const transpilerPkg = await load("@strudel/transpiler");
    const mini = await load("@strudel/mini");
    return {
      core,
      transpiler: transpilerPkg.transpiler,
      mini,
    };
  } catch (error) {
    fail(options, {
      summary: "Failed to load Strudel runtime",
      errors: [{ kind: "runtime", message: error?.stack ?? String(error) }],
    });
    if (!options.json) {
      console.error("[runtime] failed to load Strudel packages");
      console.error(error?.stack ?? error);
    }
    return null;
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const runtime = await loadRuntime(options);
  if (!runtime) {
    return;
  }

  const { core, transpiler, mini } = runtime;
  const { evaluate, evalScope } = core;

  const debugScope = {
    hush: makeNoop("hush"),
    samples: makeNoop("samples"),
    setcps: makeNoop("setcps"),
    setcpm: makeNoop("setcpm"),
    setbpm: makeNoop("setbpm"),
    soundAlias: makeNoop("soundAlias"),
    setDefaultVoicings: makeNoop("setDefaultVoicings"),
  };

  await evalScope(core, mini, debugScope);

  const source = options.stdin
    ? await readStdin()
    : await fs.readFile(path.resolve(options.file), "utf8");
  const label = options.stdin ? "<stdin>" : path.resolve(options.file);

  let evaluated;
  try {
    evaluated = await evaluate(source, transpiler);
  } catch (error) {
    fail(options, {
      summary: "Evaluation failed",
      label,
      errors: [{ kind: "eval", message: error?.stack ?? String(error) }],
    });
    if (!options.json) {
      console.error(`[eval] failed for ${label}`);
      console.error(error?.stack ?? error);
    }
    return;
  }

  const transpiled = options.showTranspiled ? evaluated.meta.output : undefined;
  console.log(`[eval] ok: ${label}`);
  if (options.showTranspiled) {
    console.log("");
    console.log("=== Transpiled Output ===");
    console.log(evaluated.meta.output);
  }

  const pattern = evaluated?.pattern;
  if (!pattern || typeof pattern.queryArc !== "function") {
    fail(options, {
      summary: "Evaluation returned no queryable pattern",
      label,
      errors: [{ kind: "query", message: "evaluate succeeded, but no queryable pattern was returned" }],
      ...(transpiled ? { transpiled } : {}),
    });
    if (!options.json) {
      console.error("[query] evaluate succeeded, but no queryable pattern was returned");
      console.error(evaluated);
    }
    return;
  }

  let events;
  try {
    events = pattern.queryArc(options.start, options.end);
  } catch (error) {
    fail(options, {
      summary: "Pattern query failed",
      label,
      errors: [{ kind: "query", message: error?.stack ?? String(error) }],
      arc: { start: options.start, end: options.end },
      ...(transpiled ? { transpiled } : {}),
    });
    if (!options.json) {
      console.error(`[query] failed for arc ${options.start} -> ${options.end}`);
      console.error(error?.stack ?? error);
    }
    return;
  }

  console.log(`[query] arc ${options.start} -> ${options.end}`);
  console.log(`[query] events: ${events.length}`);
  if (events.length) {
    console.log("");
    for (const event of events) {
      console.log(formatEvent(event));
    }
  }

  const warnings = collectEventWarnings(events);
  const out = result({
    ok: true,
    summary: `Evaluated successfully with ${events.length} event(s) on arc ${options.start} -> ${options.end}`,
    label,
    warnings,
    events: events.length,
    arc: { start: options.start, end: options.end },
    ...(transpiled ? { transpiled } : {}),
  });
  if (options.json) {
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  if (warnings.length) {
    console.log("");
    console.log("[warnings]");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }
}

await main();
