# Features To Add

## 1. First-Run Workspace Creation Flow

Goal:
- Remove the need for the user to manually download or open the workspace template.

Detailed spec:
- `specs/strudel-workspace-onboarding.md`

Desired flow:
1. On app launch, if no Strudel workspace/project exists yet, show a first-run setup screen.
2. Ask the user where they want the Strudel workspace to be created.
3. Reuse the existing directory-picker flow to choose the parent location.
4. Create a new workspace folder there from the bundled `strudel-studio-workspace` template.
5. Open that new folder automatically as the project root.
6. On later launches, reopen that workspace automatically.

Notes:
- The user is choosing the destination path, not opening an existing project.
- The live workspace should be a user-writable copy of the template, not the bundled template folder itself.
- This should replace the current generic "open any project" first-run experience for Strudel Studio.

## 2. Song Selector Built On Sessions

Status:
- Partially completed

Completed:
- the sidebar is now song-backed from `songs/<sessionID>.js`
- songs are discoverable from canonical files
- selecting a song navigates by session id and loads the matching canonical song

Still open:
- song naming beyond raw session ids
- explicit song selector UI beyond the sidebar
- deciding whether file naming should remain `songs/<sessionID>.js` or evolve further

Notes:
- The core song-backed session sidebar is done.
- The remaining work is mostly naming and UX polish, not basic discovery/navigation.

## 3. Real Teaching Examples In `examples/`

Goal:
- Turn the `examples/` folder into a real teaching library instead of a placeholder.

Desired content:
- Actual Strudel example files the agent and user can learn from.
- Teaching comments inside the examples, not just bare code.
- Short lessons that explain:
  - timing and subdivision
  - swing usage
  - syncopation
  - layering with `stack(...)`
  - sample choice and bank usage
  - melodic phrasing
  - chord and pad writing
  - arrangement patterns

Notes:
- These examples should teach Strudel rules and good musical habits the agent can follow.
- The examples should be curated, small enough to study, and clearly commented.
- The goal is not just reference material. The goal is to shape future song-writing behavior from good local examples.

## 4. Stronger Research -> Plan -> Implement Prompt Flow

Goal:
- Make the agent follow a clearer working sequence before editing songs or workspace files.

Desired prompt guidance:
- Research first:
  - check relevant docs
  - check `resources/`
  - check `examples/`
  - inspect the current song when relevant
- Plan second:
  - form a short internal plan for the change
  - identify structure, constraints, and likely validation needs
- Implement third:
  - make the requested change in one coherent pass when possible
- Verify after implementation:
  - validate
  - test or debug if needed
  - fix only what the verification step reveals

Notes:
- This should be a clear operating rule in the agent prompts, not just an implied preference.
- The goal is to reduce random edits, weak musical assumptions, and avoidable rewrite churn.

## 5. Always Ask Relevant Questions

Goal:
- Encourage the agent to ask useful questions when musical intent, structure, or style is under-specified.

Desired behavior:
- Ask clarifying questions when the request is ambiguous in a way that affects the result.
- Prefer short, musically relevant questions.
- Use questions to narrow:
  - style
  - section role
  - instrumentation
  - energy level
  - harmonic direction
  - arrangement intent

Notes:
- Questions are good when they improve the song outcome.
- The agent should still act directly when the request is already clear enough.
- This should improve collaboration instead of making the agent passive.

## 6. MIDI Import Through A Symbolic Intermediate Form

Goal:
- Support importing MIDI into Strudel Studio without relying on raw event data directly inside the song file.

Desired approach:
1. Parse MIDI into a structured symbolic representation.
2. Normalize:
   - tempo
   - time signature
   - track separation
   - note start times
   - durations
   - rests
   - chords / simultaneous notes
   - drum hits
3. Convert that into a linguistic or readable intermediate display.
4. Translate that intermediate form into Strudel code with fixed deterministic rules.
5. Optionally add a second refinement step for more idiomatic or musical Strudel output.

Example intermediate form:
- track names
- bars
- note names
- durations
- drum lane hits
- chord groupings

Notes:
- MIDI to symbolic text should be treated as the deterministic core.
- Symbolic text to Strudel should use fixed rules first, with stylistic cleanup as a later pass.
- A first version can ignore advanced MIDI features like dense CC automation, tempo maps, or complex overlapping polyphony.
- This is likely the correct architecture for future MIDI-to-song import in Strudel Studio.

## 7. Clearer External Sample Mechanism

Goal:
- Replace the current ad hoc external sample setup with a clearer, safer, and more product-ready mechanism.

Desired direction:
- make external sample loading explicit in the UI and song flow
- distinguish clearly between:
  - built-in runtime support
  - user-loaded external sample packs
  - reference-only sample examples
- avoid shipping unclear default external sample dependencies in the runtime baseline
- make attribution and source visibility obvious when external samples are used

Notes:
- The current external sample model is temporary and should be redesigned.
- Future external sample support should fit the canonical song contract, validation flow, and workspace guidance cleanly.
- This should also make licensing and source attribution easier to reason about.

## 8. Tutorial Agent Or Tutorial Experience

Goal:
- Add a dedicated teaching path that helps users learn Strudel Studio and Strudel composition inside the app.

Possible directions:
- a separate tutorial agent focused on explanation, guided exercises, and musical coaching
- a tutorial mode or tutorial section in the app UI
- step-by-step onboarding lessons tied to the real workspace and canonical song flow

Desired behavior:
- teach the user how sections, tracks, and arrangement work in Strudel Studio
- explain supported sounds, samples, and runtime limits clearly
- guide the user through small practical exercises instead of only giving abstract explanations
- help the user learn by editing the canonical song in controlled steps

Notes:
- This should complement the build agent, not replace it.
- The tutorial path should be slower, clearer, and more pedagogical than normal build behavior.
- This can later connect to the `examples/` library and first-run onboarding flow.

## 9. Fix Chat UI Message Clipping

Goal:
- Fix message rendering issues in the chat UI so both user and agent messages display cleanly without clipping.

Current issues:
- user messages are clipped vertically
- agent messages are clipped horizontally

Desired behavior:
- user messages should size correctly to their content height
- agent messages should wrap and fit the available width correctly
- the chat timeline should remain readable without requiring refresh or awkward resizing

Notes:
- This is a UI polish and usability issue, but it directly affects core chat quality.
- The fix should be verified across both fresh sessions and longer message histories.

## 10. Strengthen Always-On Strudel Session Context

Goal:
- Improve the hidden per-turn Strudel system context so the agent reliably keeps important working habits in mind during normal use.

Desired additions:
- remind the agent to check whether relevant local examples or docs should be read before writing music
- remind the agent to ask a single focused selection question when uncertainty would materially change the result
- keep core session grounding always visible:
  - current canonical song
  - current focused section/card when available
  - current UI state when relevant

Notes:
- This should live in the app-injected hidden session context, not only in `build.md`.
- The goal is to reinforce high-value behaviors that tend to decay over longer sessions.
- This should stay short and operational, not become another large prompt block.

## 11. Export Audio

Goal:
- Let the user export the current Strudel song to a real audio file.

Desired behavior:
- export the current canonical song arrangement to an audio file such as `.wav`
- make the export flow clear in the UI
- ensure the exported result reflects the actual arranged song, not just a fragment

Possible implementation directions:
- offline render from the browser/runtime graph
- record the app playback output into an audio buffer, then save it
- later support additional formats such as mp3 if needed

Notes:
- A first version can target one reliable format, preferably `.wav`.
- Export should be based on the canonical song and current runtime behavior.
- This likely needs explicit handling for song duration, render completion, and offline capture.
