# Strudel Workspace Onboarding

## Goal

Add a Strudel-first entry flow that lets the user:

- create a new Strudel workspace from a parent folder
- open an existing Strudel workspace
- land directly in the session screen after success

This feature should use the existing app-driven file write path and should not use the OpenCode worktree workspace feature.

## Product Behavior

### Empty state

If no project exists, show a Strudel-first empty state:

- title: `Start a Strudel workspace`
- description: `Create a Strudel workspace or open an existing one.`
- actions:
  - `Create workspace`
  - `Open workspace`

### Create workspace

1. User chooses a parent directory.
2. App computes:
   - `<parent>/Strudel Studio`
3. If that target already exists and is a valid Strudel workspace:
   - open it
4. Otherwise:
   - initialize it
   - open it
5. After opening:
   - navigate to `/<slug>/session`
6. Existing new-session boot logic creates the canonical session song file if it is missing.

### Open workspace

1. User chooses an existing directory directly.
2. App validates it as a Strudel workspace.
3. If valid:
   - open it
   - navigate to `/<slug>/session`
4. If invalid:
   - show an error toast

## Validation Rule

A directory counts as a valid Strudel workspace if:

- it exists
- it is a directory
- `songs/` exists inside it

This matches the current Strudel workspace root rule.

## Technical Approach

Use the existing app file API:

- `sdk.createClient({ directory, throwOnError: true })`
- `client.file.write({ path, content })`

Do not use:

- OpenCode worktree workspace creation
- agent bootstrap prompts

The app should initialize the Strudel workspace directly by writing starter files.

## Starter Workspace Contents

The created workspace should contain:

- `AGENTS.md`
- `songs/.gitkeep`
- `examples/README.md`
- `examples/drums/drums.md`
- `examples/bass/README.md`
- `examples/harmony/README.md`
- `examples/melody/README.md`
- `examples/arrangement/README.md`
- `samples/README.md`
- `resources/README.md`

The source content should come from the current `strudel-studio-workspace/` starter content, but the runtime implementation should use a bundled template module, not repo file copying.

## File-by-File Implementation Checklist

### 1. Starter template module

Create:

- `packages/app/src/pages/strudel-workspace-template.ts`

Responsibilities:

- export a deterministic file map for starter files
- keep runtime initialization self-contained

Notes:

- use current `strudel-studio-workspace/` content as the authoring source
- do not read repo files dynamically at runtime

### 2. Strudel workspace helper

Create:

- `packages/app/src/pages/strudel-workspace.ts`

Functions:

- `workspaceTarget(parent)`
- `isStrudelWorkspace(sdk, dir)`
- `initStrudelWorkspace(sdk, dir)`
- `ensureStrudelWorkspace(sdk, parent)`

Responsibilities:

- compute `<parent>/Strudel Studio`
- validate a workspace by checking for `songs/`
- initialize starter files with direct file writes
- reuse an existing valid target instead of recreating it

### 3. Helper tests

Create:

- `packages/app/src/pages/strudel-workspace.test.ts`

Test:

- target path generation
- valid workspace detection
- invalid workspace detection
- initialization writes expected files
- existing valid target is reused

### 4. Root detection tests

Patch:

- `packages/app/src/pages/strudel-workspace-root.test.ts`

Update expectations so:

- `songs/` is the required qualifier
- `AGENTS.md` is not required for validity

### 5. Home screen actions

Patch:

- `packages/app/src/pages/home.tsx`

Add actions:

- `Create workspace`
- `Open workspace`

Behavior:

- reuse the existing directory picker
- keep the existing project open flow after validation/init succeeds

### 6. Create workspace flow

Patch:

- `packages/app/src/pages/home.tsx`

Behavior:

- select parent folder
- compute `<parent>/Strudel Studio`
- call `ensureStrudelWorkspace(...)`
- open the resulting directory
- navigate to `/<slug>/session`

### 7. Open workspace flow

Patch:

- `packages/app/src/pages/home.tsx`

Behavior:

- select existing directory directly
- validate with `isStrudelWorkspace(...)`
- open if valid
- show toast if invalid

### 8. Empty state copy

Patch:

- `packages/app/src/pages/home.tsx`

Behavior:

- if no projects exist, show Strudel-first empty state
- if projects exist, keep recent projects and also expose Create/Open workspace actions

### 9. Strings

Patch:

- `packages/app/src/i18n/en.ts`

Add keys for:

- start a Strudel workspace
- create workspace
- open workspace
- invalid workspace
- failed workspace initialization

### 10. Remove deprecated AI bootstrap UI

Patch:

- `packages/app/src/pages/session/strudel-bar.tsx`

Remove:

- `Create with AI` button
- deprecated bootstrap-only UI path if unused

Then delete if unused:

- `packages/app/src/pages/session/strudel-song-bootstrap.ts`
- `packages/app/src/pages/session/strudel-song-bootstrap.test.ts`

Note:

- keep canonical song creation on the existing app-driven missing-file path in `strudel-bar.tsx`

### 11. E2E coverage

Create:

- `packages/app/e2e/strudel/strudel-onboarding.spec.ts`

Test:

- no projects -> Strudel empty state appears
- create workspace from parent folder
- target folder is `<parent>/Strudel Studio`
- starter files exist
- app opens workspace
- app lands on session screen
- new-session boot creates the canonical session song file
- open existing valid workspace works

### 12. Manual verification

Verify:

- no `songs/songs` nesting issue
- created workspace opens correctly
- first session creates canonical song automatically
- song-backed sidebar shows created session songs

## Implementation Order

1. `strudel-workspace-template.ts`
2. `strudel-workspace.ts`
3. `strudel-workspace.test.ts`
4. `strudel-workspace-root.test.ts`
5. `home.tsx` create/open actions
6. `home.tsx` empty state
7. `en.ts`
8. remove deprecated bootstrap UI
9. e2e test
10. manual verification

## Out of Scope For This Phase

- remembering the last Strudel workspace on startup
- auto-opening a saved workspace
- integrating with the OpenCode worktree workspace system
- adding a new backend route for workspace initialization

