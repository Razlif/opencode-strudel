import { stub } from "./strudel-song"

export const bootstrap = (path: string) => {
  const text = [
    `Create the canonical Strudel session song file at "${path}" inside the current workspace root.`,
    "Use the existing songs directory in the workspace root.",
    "Write that session file exactly once if it does not exist yet.",
    "The task is not complete until the file exists and contains the full template text below.",
    "Do not stop after creating only the directory or an empty file.",
    "Preserve the contract markers and top-level names.",
    "After writing it, validate the file structure and Strudel runtime compatibility before finishing.",
    "Before replying, read the file back and confirm it is non-empty and still contains all required markers.",
    "Reply briefly only after the file content is fully written and verified.",
    "",
    "Use this exact template:",
    "```js",
    stub.trim(),
    "```",
  ].join("\n")

  return [{ type: "text", content: text, start: 0, end: text.length }]
}
