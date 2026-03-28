# Prompt Control Audit

This note tracks which OpenCode prompt inputs must be controlled for Strudel Studio.

## File 1

File:
- `packages/opencode/src/session/llm.ts`

Current key lanes entering the final model call:

1. `input.agent.prompt`
2. `SystemPrompt.provider(input.model)` as fallback
3. `input.system`
4. `input.user.system`

## Current conclusions

### 1. `input.agent.prompt`

This should become the primary controlled prompt layer.

Action:
- define explicit prompts for all important agents
- at minimum: `build`, `plan`, `general`, `explore`

Goal:
- avoid accidental fallback to provider prompts during normal use

### 2. `SystemPrompt.provider(input.model)`

This is the fallback base prompt when `input.agent.prompt` is missing.

Action:
- review what each provider prompt contains
- reduce dependence on this fallback by always supplying agent prompts

Goal:
- make provider prompt fallback irrelevant for normal Strudel Studio sessions

### 3. `input.system`

This is the shared backend-added system layer.

Known sources to audit:
- environment block
- skills block
- `AGENTS.md`
- configured instruction files

Action:
- review each source file-by-file
- decide what should stay automatic
- decide what should move into explicit repo-owned context

Goal:
- keep automatic system context intentional and bounded

### 4. `input.user.system`

This is a per-message system override/addition channel.

Action:
- find all writers of `user.system`
- decide whether app features should be allowed to use it

Goal:
- prevent fragmented prompt policy

## Working policy

Preferred control model:

1. controlled agent prompts
2. audited backend system context
3. minimal or intentionally restricted `user.system`
4. provider prompt only as emergency fallback

## Next files

1. `packages/opencode/src/session/system.ts`
2. `packages/opencode/src/session/instruction.ts`

## File 2

File:
- `packages/opencode/src/session/system.ts`

This file defines:

1. `instructions()`
2. `provider(model)`
3. `environment(model)`
4. `skills(agent)`

### Current conclusions

#### 1. `provider(model)`

Current fallback mapping:

- `gpt-5*` -> `PROMPT_CODEX`
- other `gpt-*`, `o1`, `o3` -> `PROMPT_BEAST`
- `gemini-*` -> `PROMPT_GEMINI`
- `claude*` -> `PROMPT_ANTHROPIC`
- `trinity*` -> `PROMPT_TRINITY`
- otherwise -> `PROMPT_QWEN`

Action:
- avoid relying on this by always supplying `input.agent.prompt` for important agents

Goal:
- model switches should not silently change Strudel Studio behavior

#### 2. `environment(model)`

Current environment block includes:

- exact model id
- working directory
- workspace root
- git repo yes/no
- platform
- date

Current note:
- directory tree injection appears intentionally disabled

Action:
- review each field
- keep this block intentionally small

Goal:
- preserve useful runtime metadata without letting automatic environment context grow unchecked

#### 3. `skills(agent)`

Current behavior:
- if `skill` permission is enabled, the model sees a skills-discovery block
- this advertises available skills without loading their full content yet

Action:
- decide whether skills should be visible at all for Strudel Studio agents
- if visible, treat that as part of prompt policy

Goal:
- avoid accidental model behavior changes from unrelated skills

#### 4. `instructions()`

Current behavior:
- returns `PROMPT_CODEX.trim()`

Action:
- audit `packages/opencode/src/session/prompt/codex_header.txt`

Goal:
- understand the global built-in base instruction layer used in Codex-oriented flows

## Updated checklist

From `system.ts`, the main control actions are:

1. neutralize `provider(model)` by always supplying agent prompts
2. review `environment(model)` and keep it intentionally small
3. decide whether `skills(agent)` should be exposed for Strudel agents
4. audit `instructions()` via `codex_header.txt`

## File 3

File:
- `packages/opencode/src/session/instruction.ts`

This file controls the repo/config instruction layer that becomes part of `input.system`.

### What it currently does

1. discovers baseline instruction files
2. reads and returns their contents
3. tracks instruction files already loaded in prior messages
4. can auto-resolve nearby instruction files while working on a specific file

### Important current behaviors

#### 1. Baseline instruction discovery

Candidate local filenames:

- `AGENTS.md`
- `CLAUDE.md`
- `CONTEXT.md`

Other sources:

- global `~/.config/opencode/AGENTS.md`
- global Claude fallback `~/.claude/CLAUDE.md`
- configured `instructions` entries from config
- configured remote instruction URLs from config

#### 2. `system()`

This reads discovered files/URLs and returns literal instruction content blocks.

Current note:
- this is the main automatic instruction-ingestion point
- likely acceptable as a mechanism, but it should still be reviewed and bounded

#### 3. `loaded(messages)`

This tracks which instruction files were already loaded via prior `read` tool results so the backend avoids redundant reinjection later.

Current note:
- useful to know
- not a new instruction source by itself

#### 4. `resolve(messages, filepath, messageID)`

This can discover nearby instruction files while the agent is working on a specific file by walking upward from that file's directory.

Current note:
- subdirectory `AGENTS.md` files can be injected automatically
- this can be useful if designed intentionally
- this can also create accidental prompt complexity if left unmanaged

### Current conclusions

From `instruction.ts`, the main control actions are:

1. decide whether Claude compatibility should stay enabled
2. define which config `instructions` files are allowed
3. decide whether remote instruction URLs are allowed
4. decide whether subdirectory `AGENTS.md` files are part of the intended architecture
5. design the Strudel app folder so local rule discovery is deliberate, not accidental

### Architectural note

Potentially useful for the Strudel app template:

- keep one controlled root `AGENTS.md`
- optionally use local subdirectory `AGENTS.md` files intentionally inside the Strudel app/template area
- avoid accidental instruction discovery elsewhere

## File 4

File:
- `packages/opencode/src/agent/agent.ts`

This file controls agent definitions and therefore the source of `input.agent.prompt`.

### Important current behaviors

Built-in agents:

- `build`
- `plan`
- `general`
- `explore`
- `compaction`
- `title`
- `summary`

Prompt state today:

- `build` has no explicit built-in custom prompt
- `plan` has no explicit built-in custom prompt
- `general` has no explicit built-in custom prompt
- `explore` has `PROMPT_EXPLORE`
- `compaction`, `title`, `summary` have explicit internal prompts

Config can override:

- `prompt`
- `model`
- `variant`
- `description`
- `temperature`
- `topP`
- `mode`
- `color`
- `hidden`
- `steps`
- `options`
- `permission`

### Current conclusions

#### 1. Main user-facing agents are not fully prompt-controlled yet

Because `build`, `plan`, and `general` do not all have explicit built-in prompts, they can fall back to provider prompts unless overridden.

Action:
- define explicit prompts for `build` and `plan`
- likely also define one for `general`

#### 2. `explore` needs an explicit design decision

Current state:
- `explore` already has a custom prompt

Action:
- decide whether it stays generic or becomes Strudel-aware

#### 3. Agent prompt control and tool-surface control meet here

This file also merges:

- default permissions
- built-in agent-specific permission changes
- user/project config permission overrides

Action:
- review per-agent permissions
- especially `skill` and `task`

Architectural note:
- yes, this means Strudel-specific subagents are possible later
- for example, a narrow Strudel composition or validation subagent with tightly scoped permissions
- probably useful to note now, even if not implemented immediately

#### 4. Default agent matters

Action:
- confirm which primary agent should be the default in Strudel Studio

### Updated checklist

From `agent.ts`, the main control actions are:

1. define explicit prompts for `build` and `plan`
2. decide whether `general` should get a Strudel-aware custom prompt
3. decide whether `explore` stays generic or becomes Strudel-aware
4. review per-agent permissions, especially `skill` and `task`
5. confirm the intended default agent for Strudel Studio

## Current Strudel Studio State

This section captures the current app/runtime state before redesign decisions.

### Prompt/control state

Current Strudel-specific prompt steering is primarily coming from:

- root `AGENTS.md`
- `.opencode/opencode.jsonc`
- `docs/strudel/build_agent.md`

Current note:
- the repo currently injects `docs/strudel/build_agent.md` through `.opencode/opencode.jsonc` via the `instructions` field
- the main user-facing `build` agent is not yet controlled by a dedicated Strudel-specific `agent.prompt`
- normal browser-app prompt sending does not appear to use per-message `system`

### App/runtime state

The app already has a real Strudel-specific file and runtime workflow.

Current key pieces:

1. canonical per-session song files
- path shape: `songs/<sessionID>.js`
- file: `packages/app/src/pages/session/strudel-song.ts`

2. automatic song bootstrap template
- file: `packages/app/src/pages/session/strudel-song-bootstrap.ts`

3. canonical song parse/write/validate pipeline
- `packages/app/src/pages/session/strudel-song-parse.ts`
- `packages/app/src/pages/session/strudel-song-write.ts`
- `packages/app/src/pages/session/strudel-song-validate.ts`

4. browser Strudel runtime and transport surface
- file: `packages/app/src/pages/session/strudel-bar.tsx`

5. current runtime support manifest owned by app code
- file: `packages/app/src/pages/session/strudel-manifest.ts`

### Architectural takeaway

Current Strudel Studio is not just generic chat with a music widget.

It already uses:

- canonical song files on disk
- a browser Strudel runtime
- app-owned runtime support manifests
- instruction-file steering for Strudel-specific agent behavior

This means future design should treat the Strudel app/template area as a real canonical workspace, not just hidden context.

### Native Strudel tool state

Current native agent-facing Strudel tools are now:

1. `strudel_validate_song_contract`
2. `strudel_verify_samples`
3. `strudel_debug`

Current note:
- the canonical song contract validator was previously app-only
- it is now also exposed as a native backend tool so agent validation can match app validation
- test execution is still pending in this shell because `bun` is not currently available on PATH

### Runtime baseline vs whitelist

Current distinction:

- `APP_RUNTIME_BASELINE` in `sound_samples_list/strudel-role-sample-whitelist.ts` is the app/runtime baseline contract
- `STRUDEL_ROLE_SAMPLE_WHITELIST` in the same file is broader generation and validation reference material

Current implementation note:

- the app runtime manifest currently lives in `packages/app/src/pages/session/strudel-manifest.ts`
- the broader role whitelist is consumed by `script/strudel/strudel-sample-inspect.mjs`
- this means the broader whitelist is not the runtime loader itself; it is mostly validator and generation support

Current architectural implication:

- the split is meaningful only if we want a broader musical vocabulary for inspection/generation than the strict runtime baseline
- if that broader layer causes drift or confusion, it should eventually be reduced, moved, or removed
- runtime truth should stay app-owned and explicit

## Draft Build Prompt

Current working draft for the Strudel Studio `build` agent prompt:

```text
You are the Strudel Studio build agent. You help users create and edit Strudel music inside the Strudel Studio app.

At the start of Strudel work, read the Strudel Studio get-started file and use the canonical Strudel workspace as your main reference source.

Use the canonical Strudel workspace for:
- song files
- examples
- runtime rules
- external sample lists
- other Strudel app reference material

Non-negotiable rules:

- The canonical song file on disk is the source of truth.
- Always preserve the canonical song contract and file format.
- Use the app’s supported runtime as the truth for supported sounds and sample families.
- Before making strong claims that Strudel code works, validate it with:
  - strudel_debug
  - strudel_verify_samples
- If validation fails, fix the code and rerun validation before answering.
- If validator results and live app playback disagree, live app playback is the final truth.

Default Strudel workflow:

1. Read the relevant Strudel workspace files.
2. Read the current canonical song file.
3. Edit the song according to the user’s latest request.
4. Run the Strudel validation tools.
5. Fix any failures and rerun as needed.
6. Only then answer with the result.

When you need examples, runtime details, or sample information, read them from the canonical Strudel workspace instead of inventing assumptions.
```

## Legacy Strudel Doc Triage

### `docs/strudel/runtime_support.md`

Recommended status:
- keep as core truth for now
- later convert into canonical app-folder runtime contract content

Why:
- it is still the clearest prose description of supported runtime families
- it already explains the distinction between app runtime support and broader sample loading

### `docs/strudel/strudel_rules.md`

Recommended status:
- mine for useful pieces
- later split into hard rules vs optional guidance in canonical app-folder docs

Why:
- it contains valuable validation and syntax discipline
- it also contains a lot of workflow/tutorial/reference material that is too large for always-loaded prompt context

### `docs/strudel/strudel_tutorial.js`

Recommended status:
- convert into canonical app-folder example/reference content

Why:
- it contains usable syntax and rhythm examples
- it reads as reference/example material, not product truth

### `docs/strudel/agent_flow.md`

Recommended status:
- partially supersede
- mine any still-accurate policy lines

Why:
- parts of it are now stale relative to current runtime support and tool surface
- the core idea that browser playback is final truth is still useful
