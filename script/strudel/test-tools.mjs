import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./strudel-debug.mjs", import.meta.url));
const code = process.argv.slice(2).join(" ") || 'note("<c4 a3 f3 e3>(3,8)")';

const proc = spawn("node", [script, "--stdin", "--json"], {
  stdio: ["pipe", "pipe", "pipe"],
});

let out = "";
let err = "";
proc.stdout.on("data", (chunk) => {
  out += chunk.toString();
});
proc.stderr.on("data", (chunk) => {
  err += chunk.toString();
});

proc.stdin.write(code);
proc.stdin.end();

proc.on("close", (code) => {
  console.log("exit:", code);
  if (out.trim()) {
    console.log("stdout:");
    console.log(out.trim());
  }
  if (err.trim()) {
    console.log("stderr:");
    console.log(err.trim());
  }
});
