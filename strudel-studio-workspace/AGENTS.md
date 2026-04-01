# Workspace Guide

This workspace contains editable Strudel Studio project material.

Use this file as the entry point when you need examples, sample references, songs, or supporting resources.

## Folder Guide

- `songs/`
  song-shaped references and workspace song material
- `examples/`
  curated musical examples by instrument, groove, pair, or arrangement
- `samples/`
  external sample references, exact load snippets, and pack notes
- `resources/`
  links, notes, and short supporting reference material

## How To Use This Workspace

- Use `songs/` for song-shaped references and workspace song material.
- Use `examples/` when the user wants ideas, grooves, stylistic references, instrumental patterns, or arrangement examples.
- Use `samples/` when the task involves external sample packs or exact sample loading.
- Use `resources/` for extra context that does not belong in songs, examples, or samples.

## Strudel Gateway

Use this workspace to think about Strudel musically, not just syntactically.

### Cycle And Bar Thinking

- Decide what one cycle means before composing.
- A common and useful choice is:
  - `1 cycle = 1 measure`
- When one cycle represents one bar, section planning, phrase planning, and arrangement timing become much clearer.
- Think in terms of cycle length, subdivision, and event count.
- Event count can match the grid for stability or push against it for tension.

### Phrase Sequencing

- Use `cat(...)` when each cycle or bar should carry different note content.
- This is especially useful for:
  - bass root motion by phrase
  - bar-by-bar harmonic movement
  - evolving lead phrases
  - long melodic or harmonic ideas built from distinct cycles

### Track Roles

- Give each track a clear musical job.
- Common roles include:
  - percussion
  - bass
  - harmony
  - melody
  - counterline
  - accent
  - pedal
- Explain the function of the track in musical terms:
  - kick pulse
  - offbeat hat
  - root motion by phrase
  - harmonic bed
  - delayed lead entry
  - phrase punctuation

### Section Building

- Build sections from track roles, not from one giant expression.
- Use sections to divide the song into musical blocks with clear function.
- Good section thinking includes:
  - intro
  - main groove
  - lift
  - chorus
  - breakdown
  - ending gesture
- Not every section should introduce every layer at once.
- It is often better when:
  - the groove arrives first
  - the harmonic cycle, bass, and drum engine establish the section
  - top-line hooks or lead voices arrive later

### Arrangement

- Use `arrange([cycles, section])` to place sections in sequence.
- This is the clearest way to turn track materials into song form.
- Let the arrangement reflect musical structure rather than just repeating loops.

### House Style

- Use plain JavaScript strings for setup/config calls such as `samples('...')`.
- Use Strudel pattern strings for musical pattern calls such as `s("...")` and `note("...")`.
- Use mini-notation inside `s("...")` and `note("...")` for local rhythmic and melodic content.
- Use `cat(...)` for phrase-by-phrase or cycle-by-cycle sequencing at the JavaScript level.
- Use `stack(...)` for simultaneous musical layers at the JavaScript level.
- Use `arrange(...)` for section-level song form.
- Use `[]` inside pattern strings for subdivision.
- Verify loaded packs and manifests before trusting sample names.
- Keep structural composition in named JavaScript variables:
  - tracks
  - sections
  - final arrangement
- Write songs in the canonical Strudel Studio format with explicit track and section names.

### Sample Phrase Handling

- One longer sample can often be turned into multiple phrase moments.
- Use region-based thinking when working with a longer stem:
  - intro wash
  - phrase punctuation
  - chopped response
  - later hook fragment
- Treat these as musical roles inside sections, not just as random effects.

### Educational Use

- When reading examples, extract:
  - cycle logic
  - track roles
  - phrase sequencing
  - section purpose
  - arrangement logic
- Prefer clean, canonical, single-song examples over giant mixed reference files.
- Rebuild useful ideas into the canonical format used by Strudel Studio.

## Important Note

This workspace is editable project material.

The current session's canonical song file comes from app-provided context. That current canonical song file is the song-specific source of truth for edits.

Examples and references here are working material, not runtime guarantees.

Use the workspace when you need editable project material such as:

- examples
- sample references
- song-shaped references
- other music context

## User Customization

Users may customize this file with their own project guidance, preferences, and working style.

Good additions here include:

- preferred Strudel style or genre direction
- favorite sound families or sample packs
- arrangement preferences
- workflow preferences
- local project rules
