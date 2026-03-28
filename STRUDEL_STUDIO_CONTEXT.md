# Strudel Studio Context

## Goal

`Strudel Studio` is intended to be a Strudel-based AI music coding desktop app built on top of the `anomalyco/opencode` desktop application.

The current product direction is:

- keep the existing OpenCode-style desktop UI for now
- keep chat
- keep code editing
- add an embedded Strudel player/runtime with play/pause/eval
- later, possibly replace part of the generic code editor area with a more music-specific Strudel UI while keeping chat

This is not meant to be a generic "AI code editor with music as a side feature". The center of the product should be:

- live musical feedback
- code-guided learning
- generation + validation of Strudel code
- explicit teaching/explaining workflow

## Why OpenCode

We compared `OpenCode` and `OpenWork`.

Current conclusion:

- `OpenCode` is the better base because it already gives the desktop shell, app UI, chat/editor workflow, and agent runtime in one coherent codebase
- `OpenWork` is more of an orchestration/product shell around OpenCode and is less direct for a Strudel-first product

Important verified OpenCode stack:

- desktop shell: `Tauri v2`
- frontend UI: `SolidJS`
- build: `Vite`
- monorepo/runtime: `Bun`
- main packages:
  - `packages/app`
  - `packages/desktop`
  - `packages/ui`
  - `packages/opencode`

Most likely first integration target:

- `packages/app/src/pages/session.tsx`

because that appears to be the active session/chat/editor workspace page.

## Licensing

Strudel's docs say the license is `AGPL-3.0`.

Practical takeaway:

- if Strudel is embedded/integrated into the distributed app, the integrated project must comply with AGPL-compatible licensing expectations
- the current intended direction is open-source, free, with proper attribution, and compatible licensing

This should be verified carefully during implementation and release planning, but the product direction was chosen with this in mind.

## What We Learned About Strudel

These points are important enough to preserve as project knowledge.

### 1. Two different validation layers are required

You cannot rely on "the code evaluates" as proof that it will run correctly in Strudel.

There are at least two distinct layers:

- Strudel evaluation / pattern generation
- sample resolution / sampler runtime

That is why two local tools were built in the prototype repo:

- `strudel-debug.mjs`
- `strudel-sample-inspect.mjs`

### 2. String handling matters

We repeatedly hit bugs caused by mixing:

- raw JS strings
- Strudel mini-notation strings

Examples:

- `samples('github:...')` should be plain JS strings
- `s("amen/4")`, `note("c4 eb4 g4")`, `.slice(..., "0 1 2 3")` should be Strudel pattern strings

### 3. Sample names must be validated against actual pack manifests

We had runtime failures because some names looked valid but were not actually present in loaded sample packs.

Examples of prior failures:

- `breaks-gated`
- `breaks-noquant`
- `pads`

The rule established in the prototype:

- whitelist != source of truth
- pack manifest = source of truth

### 4. Rhythm teaching is working best in very small chunks

The most successful tutorial style was:

- 1-2 line explanations
- one runnable code snippet at a time
- very incremental concept progression

This should directly influence the product UX.

### 5. The user found strong musical heuristics that should be preserved

Important rhythm heuristics discovered during the tutorial work:

- event count inside `s("...")` interacts strongly with the final division in `setcps(... / N)`
- even/odd mismatch can create strong rhythmic tension
- mismatch works best when the counts are not too far apart
- swing only feels correct when applied to a clean pair subdivision
- bossa-like feel came from:
  - a stable underlying grid
  - a straight-feeling first section
  - a syncopated second section
  - delayed accents via rests-before-hits

These are captured in the prototype rules file and should be preserved into the new product.

## What Was Built In the Prototype Repo

Prototype repo location:

- `C:\Users\moked\OneDrive\שולחן העבודה\testing_bundle`

Useful files already created there:

- `strudel_rules.md`
- `strudel_tutorial.js`
- `scripts/strudel-debug.mjs`
- `scripts/strudel-sample-inspect.mjs`

Supporting context folders:

- `strudel_docs/`
- `sound_samples_list/`
- `ultimate_examples/`
- `examples/`

These should be treated as the initial Strudel domain context for Strudel Studio.

## Current State In This Repo

Repo:

- `C:\Users\moked\OneDrive\שולחן העבודה\opencode-strudel`

Git remotes:

- `origin` -> `https://github.com/Razlif/opencode-strudel.git`
- `upstream` -> `https://github.com/anomalyco/opencode.git`

Current branch:

- `strudel-studio`

The repo is currently a clean fork base with no significant Strudel Studio code integrated yet.

## What The Next Developer Should Understand

This project is not starting from zero conceptually.

The correct framing is:

- OpenCode desktop app is the host shell
- Strudel runtime/player is the music engine
- the prototype repo already contains:
  - rules
  - validators
  - tutorial content
  - domain-specific examples

The next developer should import and preserve that knowledge instead of rediscovering it.
