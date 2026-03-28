# Strudel Integration Decision

## Goal

Choose the first Strudel embedding approach for `Strudel Studio` before changing the session UI.

## Decision

For the first pass, use `@strudel/web` and make `packages/app` the runtime owner.

## Why

This project is not trying to embed the full Strudel REPL as-is. The current product direction is:

- keep the existing OpenCode session UI
- keep chat
- keep code editing
- add Strudel playback inside that workflow

That makes the first successful milestone:

- a hardcoded demo pattern plays from a button inside the session page

The official Strudel package guidance makes the first tradeoff fairly clear:

- `@strudel/repl` is the browser REPL, including its own editor-oriented UI
- `@strudel/web` is the browser library without UI
- `@strudel/embed` is an embeddable REPL web component

For `Strudel Studio`, the first pass should preserve the existing OpenCode session page rather than replacing it with Strudel's own editor UI. Because of that:

- do not start with `@strudel/repl`
- do not start with `@strudel/embed`
- start with `@strudel/web`

## Package-Level Ownership

### `packages/app`

`packages/app` should own the first playback runtime.

Reason:

- it already owns the active session workspace
- it already renders the session header, timeline, composer, side panel, and terminal composition
- browser playback is the final truth anyway

### `packages/desktop`

`packages/desktop` should stay thin for the first pass.

Reason:

- the first Strudel milestone is browser-runtime playback inside the app UI
- there is no confirmed Tauri-specific requirement yet
- adding desktop-specific ownership too early would increase complexity without helping the first milestone

Desktop-specific ownership should only be added later if required for:

- file-system sample loading
- native audio/device behavior
- OS integration that cannot live in the app layer

## First UI Target

The default first UI target is:

- `packages/app/src/pages/session.tsx`

This should be treated as the default unless inspection proves otherwise.

Current local evidence:

- `SessionHeader` is rendered in `packages/app/src/pages/session.tsx`
- the main session panel is rendered there
- `MessageTimeline` is rendered there
- `SessionComposerRegion` is rendered there
- `SessionSidePanel` is rendered there
- `TerminalPanel` is rendered there

That makes `session.tsx` the correct first integration surface for a minimal Strudel transport.

## First UI Shape

The first UI should be a small Strudel transport or Strudel toolbar, not a large custom music workspace.

Initial controls:

- play
- pause
- eval current code

Initial status:

- idle
- evaluating
- playing
- stopped
- error

## Editor Rule

For the first pass, prefer one of these:

- a dedicated Strudel buffer
- a clearly delimited Strudel region

Do not assume the whole existing editor buffer is Strudel unless the session page becomes explicitly Strudel-specific.

## Validation Rule

The validator scripts are internal tools for the AI and developer workflow first:

- `script/strudel/strudel-debug.mjs`
- `script/strudel/strudel-sample-inspect.mjs`

They do not need to be user-facing in the first milestone.

However, browser playback remains the final truth:

1. sample validation can pass
2. Strudel eval can pass
3. playback can still fail in the actual browser runtime

So the product loop should optimize for:

1. edit
2. eval or play
3. hear immediately
4. stop

## Known Follow-Up Items

These remain unresolved and should not be forgotten:

- `script/strudel/strudel-sample-inspect.mjs` still depends on `sound_samples_list/strudel-role-sample-whitelist.ts`
- imported docs still reference `scripts/...` instead of `script/strudel/...`
- licensing and notices for shipped Strudel packages and assets still need to be verified before distribution

## Sources

- Strudel package overview: https://strudel.cc/technical-manual/packages/
- Using Strudel in your project: https://strudel.cc/technical-manual/project-start/
- Strudel REPL internals: https://strudel.cc/technical-manual/repl
