# Strudel Studio Roadmap

## Objective

Turn this OpenCode fork into `Strudel Studio`:

- first as a browser-mode Strudel experience inside the OpenCode app
- for writing, learning, validating, and playing Strudel music
- initially developed through the browser app surface in `packages/app`
- with desktop kept as the next packaging and adaptation phase rather than the first delivery constraint
- later evolving toward a more music-native editing surface

This is not a generic AI code editor with a music feature. The product center should be:

- live musical feedback
- code-guided learning
- generation plus validation of Strudel code
- explicit teaching and explaining workflow

## Current Understanding

The current product framing is:

- `packages/app` is the primary near-term development surface
- `packages/desktop` is a later adaptation and packaging surface
- `packages/app/src/pages/session.tsx` is the default first mount point unless inspection proves otherwise
- chat stays
- code editing stays
- the first meaningful product moment is embedded Strudel playback inside the existing session workflow

The first successful loop should be:

1. edit
2. eval or play
3. hear immediately
4. stop

Do not start with a large architecture rewrite or a music-native redesign. First prove that this loop works inside the current session page.

## Guiding Principles

1. Preserve OpenCode as the host shell for the first pass.
2. Use the browser app in `packages/app` as the main development surface until desktop adaptation is needed.
3. Treat Strudel as the product core, not a side widget.
4. Keep teaching small and incremental.
5. Do not trust eval alone.
6. Treat sample manifests as source of truth.
7. Keep AGPL licensing implications in scope during integration and release planning.

## Phase 1: Import Strudel Context

Goal:

- bring the prototype knowledge into this repo as real project artifacts

Status:

- in progress

Current imported files:

- `docs/strudel/strudel_rules.md`
- `docs/strudel/strudel_tutorial.js`
- `script/strudel/strudel-debug.mjs`
- `script/strudel/strudel-sample-inspect.mjs`

Required follow-up work:

1. import or replace the missing whitelist dependency used by `script/strudel/strudel-sample-inspect.mjs`
2. normalize imported docs so script paths match this repo
3. decide whether the sample whitelist should be copied in full or reduced to only what the validator needs
4. add supporting Strudel notes under `docs/strudel/`
5. convert the most important Strudel rules into agent-readable guidance

Deliverable:

- this repo contains the Strudel domain context needed for implementation and agent behavior

### Phase 1 Notes To Preserve

- `script/strudel/strudel-sample-inspect.mjs` still has an unresolved dependency on `sound_samples_list/strudel-role-sample-whitelist.ts`
- imported docs still reference old `scripts/...` paths instead of `script/strudel/...`

## Phase 2: Review Strudel Integration Options

Goal:

- turn Strudel's official project-integration docs into concrete package-level decisions for this repo

Status:

- done

Questions to answer:

1. which Strudel package or packages should be embedded first
2. should the first runtime live directly in `packages/app`
3. what, if anything, should `packages/desktop` own later beyond hosting the app
4. what is the smallest reliable play, pause, and eval path

Current expectation:

- first playback runtime should likely live in `packages/app`
- `packages/desktop` should be deferred until browser-mode integration is working

Deliverable:

- one clear first-pass runtime ownership decision centered on `packages/app`
- one concrete Strudel package choice document, including the first-pass decision between options such as `@strudel/repl`, `@strudel/web`, and `@strudel/embed`

## Phase 3: Find the First UI Integration Point

Goal:

- locate the existing browser-app session workspace area where Strudel should first appear

Status:

- done

Most likely files:

- `packages/app/src/pages/session.tsx`
- `packages/app/src/pages/layout.tsx`
- related components in `packages/app/src/components/`

Questions to answer:

1. where is the editor pane defined
2. where is the chat pane defined
3. where can a small transport or toolbar be mounted with minimal disruption
4. where should runtime status live

Deliverable:

- one clear target component for mounting a Strudel transport or Strudel panel

Default assumption:

- start in `packages/app/src/pages/session.tsx` unless inspection shows a stronger integration point

## Phase 4: Add a Minimal Strudel Runtime

Goal:

- make Strudel playable inside the browser app session UI as fast as possible

Status:

- done

Initial scope:

1. embed Strudel runtime into the app UI
2. expose:
   - play
   - pause
   - eval current code
3. start with a hardcoded simple pattern
4. prove immediate auditory feedback works inside the existing session page

Important constraints:

- do not begin with a giant custom music UI
- do not redesign the editor first
- keep the first pass local and simple

Deliverable:

- a session page where a Strudel snippet can be played from inside the app

First milestone:

- a hardcoded demo pattern plays from a button inside the session page
- this milestone should be achieved in browser mode before any desktop-specific adaptation work

Current result:

- the hardcoded demo pattern now plays from the session page in browser mode

## Phase 5: Connect Editor Content to Strudel

Goal:

- use the existing browser-app code editor workflow rather than bypassing it

Status:

- next

Current result:

- the dedicated Strudel mini-editor now exists in the session bar
- direct pattern playback works
- remote sample declarations are now part of the active browser-runtime path
- the first official sound-family baseline is now documented
- the browser runtime now preloads dirt samples and the first drum-machine sample map
- curated known-good examples are now part of the Strudel panel workflow
- explicit preload state now exists in the Strudel panel
- the imported example library has been reviewed against the current runtime support boundary

Actions:

1. define what part of the editor is treated as Strudel code
2. connect editor content to eval and play
3. add visible state for:
   - idle
   - evaluating
   - playing
   - stopped
   - error

Important product decision:

- decide whether Strudel code comes from the whole editor buffer, a selected region, or a dedicated Strudel area

Initial preference:

- first pass should use a dedicated Strudel buffer or a clearly delimited Strudel region
- do not assume the whole editor buffer is Strudel unless the page is already Strudel-specific

Current decision:

- the next step is a dedicated mini-editor inside the Strudel bar or panel
- do not treat the existing file viewer as the first editable Strudel source

Runtime expansion order:

The next runtime work should proceed strictly by sound-family type, not by mixing categories.

Type 1: default named instruments

- start with `piano`
- finish this type before moving on

Reason:

- highest payoff across imported examples and docs
- narrower than GM support
- likely one shared upstream source or one app-owned sample-map addition

Type 2: drum banks

Order:

1. `LinnDrum`
2. `Linn9000`
3. `AkaiLinn`
4. `YamahaRY30`
5. `BossDR110`
6. `AlesisHR16`
7. `SequentialCircuitsDrumtracks`
8. `RolandTR606`

Reason:

- same architectural pattern as the current `RolandTR808` / `RolandTR909` support
- easier to validate than GM-style instrument families

Type 3: non-bank named sample families

Order:

1. `cajon`
2. `kawai`
3. `recorder_tenor_sus`
4. `recorder_bass_sus`
5. `harmonica_soft`
6. `sax`
7. `ocarina`
8. `psaltery_pluck`

Reason:

- useful but more fragmented than drum banks
- should be added only after the default named instrument tier and drum-bank tier are settled

Type 4: GM / soundfonts

Order:

1. `gm_piano`
2. `gm_electric_bass_finger`
3. `gm_oboe`
4. `gm_pad_warm`
5. `gm_string_ensemble_1`

Reason:

- broadest and heaviest runtime expansion
- should be treated as the last tier, not the first

Current next target:

- runtime expansion tiers complete through Type 4
- Type 1 first target `piano` is now part of the runtime baseline
- Type 2 drum-bank tier is now part of the runtime baseline
- Type 3 named-sound tier is now part of the runtime baseline
- Type 4 validated GM starter tier is now part of the runtime baseline
- remaining imported-example runtime coverage now continues through:
  - extra banks `BossDR550`, `KorgDDM110`, `RolandMT32`
  - broader validated `gm_*` names used in the example library
- lightweight smoke scripts now exist for:
  - base runtime
  - Type 2 banks
  - Type 3 named sounds
  - Type 4 GM starter set
  - extra banks
  - broader example-library `gm_*` names
- once these pass, runtime sound-family coverage for the imported examples can be treated as complete

Deliverable:

- the user edits Strudel code in the app and hears it through the embedded runtime

## Phase 6: Integrate Validation Tools For The Agent

Goal:

- preserve the prototype's most important engineering win: validation before trust

Status:

- in progress

Important clarification:

- these validator scripts are primarily internal tools for the AI and developer workflow
- the user does not need to run them directly
- they do not need to be exposed in the first UI
- they should be integrated against the browser-app workflow first

Integrations needed:

1. Strudel debug evaluator
2. sample-name and sample-pack validation

Actions:

1. adapt `script/strudel/strudel-debug.mjs`
2. adapt `script/strudel/strudel-sample-inspect.mjs`
3. make the agent use them before claiming code works
4. keep the outputs reliable enough for repeatable AI use

Current result:

- the default `build` agent now has dedicated Strudel-specific project instructions
- the intended Strudel agent flow is documented
- `strudel_debug` is now a native backend tool with passing package-level tests
- `strudel-debug.mjs` now supports stdin/json for easier agent-side validation
- `strudel_verify_samples` is now a native backend tool
- `strudel-sample-inspect.mjs` now supports stdin/json and reads the repo whitelist correctly

Validation rule:

- no Strudel code should be considered trustworthy until:
  - sample validation passes
  - Strudel eval passes
  - browser runtime playback works

Final truth rule:

- browser playback remains the final truth even if both validator scripts pass

Deliverable:

- the agent can explain:
  - syntax or eval failures
  - sample-resolution failures
  - suspicious pattern payloads
  - likely runtime issues

## Phase 7: Add Strudel-Aware Agent Behavior

Goal:

- make the AI useful for Strudel specifically, not generic

Status:

- in progress

Inputs the agent should know:

- `docs/strudel/strudel_rules.md`
- `docs/strudel/strudel_tutorial.js`
- validator outputs
- preferred teaching workflow
- manifest-first sample validation rule

Desired agent behaviors:

- explain tiny concepts in short steps
- generate valid Strudel code
- prefer known-valid sample names
- use validators before claiming code works
- teach incrementally
- preserve rhythm heuristics already discovered in the prototype

Deliverable:

- the agent behaves like a Strudel tutor and composer, not a generic coding assistant

Current result:

- the default `build` agent is now the intended Strudel-aware role
- deeper Strudel docs remain reference material instead of always-inline prompt content

## Phase 8: Refine The UX

Goal:

- move from "OpenCode browser app with a Strudel transport" toward "Strudel Studio"

Status:

- later

Possible additions:

1. sample browser
2. pattern snippets or tutorial cards
3. validation warnings panel
4. transport timeline
5. tutorial mode
6. section arranger

Important constraint:

- only do this after the base edit, play, hear, stop loop is solid

Deliverable:

- a coherent first-release UX for Strudel Studio

## Phase 9: Desktop Adaptation

Goal:

- adapt the working browser-app Strudel Studio experience into the Tauri desktop shell when the app-layer workflow is already proven

Status:

- later

Actions:

1. validate that the browser-mode Strudel integration behaves correctly inside `packages/desktop`
2. resolve any Tauri-specific runtime, file, audio, or sidecar issues
3. decide what desktop-specific behaviors are actually needed
4. keep `packages/desktop` thin unless a real desktop-only requirement appears

Deliverable:

- the browser-first Strudel Studio workflow runs correctly inside the desktop shell

## Phase 10: Later Architecture Choices

Only after the above works:

Status:

- later

1. replace or augment the generic code editor with a richer music-native UI
2. add track lanes, section blocks, or a visual timeline
3. add export and share workflows
4. consider remote or multi-host features if they become necessary

These are later-stage concerns. The current priority is:

- runtime
- play, pause, eval
- editor integration
- validation
- tutor workflow
- browser-app first implementation
- licensing compliance for integrated distribution

## Recommended Immediate Task Order

The next developer should do the following in order:

1. finish Phase 1 follow-up items for the imported Strudel files
2. review Strudel's project integration docs and choose the first embedding strategy
3. write down the first-pass Strudel package choice and runtime ownership decision
4. inspect `packages/app/src/pages/session.tsx`
5. identify the first place to mount Strudel controls
6. embed a minimal Strudel runtime in `packages/app`
7. hit the first milestone: hardcoded demo playback from the session page
8. add a dedicated Strudel mini-editor in the Strudel bar or panel
9. wire that editor content to eval and play
10. integrate the validator scripts into the agent workflow
11. add Strudel-specific agent guidance
12. adapt the finished workflow to `packages/desktop` later if and when needed
13. define the first official runtime sound-family support list

## Files And Folders Most Likely To Change First

- `packages/app/src/pages/session.tsx`
- `packages/app/src/pages/layout.tsx`
- `packages/app/src/components/...`
- new Strudel integration files under `packages/app/src/...`
- `script/strudel/...`
- `docs/strudel/...`

## Handoff Warning

Do not start by redesigning the whole application.

The shortest successful path is:

1. preserve the OpenCode app UI in browser mode
2. embed Strudel runtime in `packages/app`
3. add play, pause, eval
4. prove a hardcoded demo pattern plays in the session page
5. connect editor content
6. use the imported validators and rules in the agent workflow
7. iterate in browser mode
8. adapt to desktop later

## Licensing Reminder

Strudel integration must keep licensing visible during implementation and release planning.

Follow-up items:

1. verify which Strudel packages and assets are being shipped in the integrated app
2. determine what license texts, notices, and attribution files must ship with the desktop distribution
3. keep AGPL implications in scope before release packaging or distribution decisions
