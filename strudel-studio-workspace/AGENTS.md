# Strudel Studio Workspace Guide

This workspace supports composition inside Strudel Studio.

Use this file as the agent entry point for workspace-specific guidance. It is intentionally practical:

- where to learn the canonical song format
- where to look up supported sounds
- which files are references versus editable song material
- how to stay aligned with the actual Strudel Studio runtime

## First Read Order

When working in a Strudel Studio session:

1. Read the current canonical song file from app-provided session context first.
2. Read [`composition_tutorial.md`](./composition_tutorial.md) before making non-trivial music edits.
3. Read [`samples/sound-banks.md`](./samples/sound-banks.md) before choosing sounds or claiming a sound is supported.

Do not guess the active song by scanning the workspace. The current canonical song file comes from session context and is the source of truth for edits.

## Workspace Layout

- `songs/`
  Workspace song material and song-shaped references.
- `samples/`
  Supported sound references, pack notes, and exact sample-loading snippets.
- `resources/`
  Extra notes and supporting reference material.
- `composition_tutorial.md`
  Main composition tutorial for Strudel Studio canonical song writing.

Note:
- The old `examples/` folder is not part of the current workspace structure and should not be assumed.

## What To Use For What

- Use [`composition_tutorial.md`](./composition_tutorial.md) for:
  - canonical song structure
  - composition approach
  - track, section, and arrangement patterns
  - safe Strudel idioms for this project
- Use [`samples/sound-banks.md`](./samples/sound-banks.md) for:
  - built-in drum banks
  - named instruments
  - GM sounds
  - runtime pack references
  - remote named entries such as `vox`
- Use `songs/` for:
  - editable song-shaped references
  - local examples that already follow project conventions
- Use `resources/` only for supporting context that does not belong in songs or sample references.

## Canonical Song Rules

Keep song work in canonical Strudel Studio song format.

The minimum structure is:

- `song_meta`
- track vars
- section vars
- `final_song = arrange(...)`
- end the file with `final_song`

The composition tutorial is the teaching source for this format. Follow it instead of inventing alternate top-level structures.

## Sound Rules

Use only supported runtime sounds unless the user explicitly asks to add a new external sample source.

Before writing or editing sound choices:

1. Check [`samples/sound-banks.md`](./samples/sound-banks.md).
2. If there is any drift, treat [`packages/app/src/pages/session/strudel-runtime.ts`](../packages/app/src/pages/session/strudel-runtime.ts) as runtime source of truth.

Do not claim a sound is available unless it is listed there or explicitly loaded.

## Composition Rules

Compose musically, not just syntactically.

Prefer:

- clear track roles
- named track variables
- sections built from layered tracks
- arrangement through `arrange(...)`
- simple and readable pattern strings
- `cat(...)` for phrase-to-phrase change
- `stack(...)` for simultaneous layers

Avoid:

- giant monolithic one-expression songs
- unsupported sample names
- guessing the file contract
- drifting outside the current canonical song file for session edits

## Editing Discipline

- Stay inside the current canonical song file for user-requested song edits.
- Use workspace files as references unless the user explicitly wants them edited.
- When making musical claims, ground them in:
  - the actual canonical song file
  - the composition tutorial
  - the supported sound list

## Practical Goal

This workspace exists to help agents make better Strudel Studio edits:

- correct canonical structure
- musically coherent tracks and sections
- valid supported sounds
- better use of the local tutorial/reference material
