# Features To Add

## 1. First-Run Workspace Creation Flow

Goal:
- Remove the need for the user to manually download or open the workspace template.

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
- This should replace the current generic “open any project” first-run experience for Strudel Studio.

## 2. Song Selector Built On Sessions

Goal:
- Make songs feel explicit and selectable in the UI while still riding on the existing session-based architecture.

Desired flow:
1. Add a song name input in the UI.
2. Keep the real canonical file naming scheme session-based, but change it to:
   - `<session_id>_<song_name>.js`
3. Show a song selector dropdown in the UI that displays song names, not raw file names.
4. Load all existing songs into the current session sidebar so the user can switch between them.
5. Reuse the current “new session” action to create a new session song.
6. Treat the selected song as the active canonical file for the current session context.

Notes:
- This should merge the concept of song and session more tightly instead of introducing a separate parallel object model.
- The UI should expose human-readable song names while the file layer keeps stable session-backed identifiers.
- The sidebar should behave like a song list, even if the implementation still rides on session records underneath.

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

## 4. Stronger Research → Plan → Implement Prompt Flow

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
