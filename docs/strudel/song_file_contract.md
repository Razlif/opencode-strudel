# Song File Contract

Use [`song.js`](/C:/Users/moked/OneDrive/%D7%A9%D7%95%D7%9C%D7%97%D7%9F%20%D7%94%D7%A2%D7%91%D7%95%D7%93%D7%94/opencode-strudel/testing/song.js) as the canonical shape.

## Rules

1. Keep the marker comments exactly:
- `@song_meta`
- `@song_imports`
- `@song_tracks`
- `@song_sections`
- `@song_arrangement`

2. Keep the top-level names stable:
- `song_meta`
- `final_song`

3. Track variables must use:
- `track_<section>_<role>`

4. Section variables must use:
- `section_<name>`

5. `section_<name>` must be a `stack(...)` of track vars only.

6. `final_song` must be one `arrange(...)` of section vars only.

7. End the file with:
- `final_song`

## Scope

This file is intentionally abstract.

It defines:
- structure
- marker comments
- stable names
- parse boundaries

It does not define:
- specific sounds
- specific banks
- specific samples
- specific musical roles beyond naming shape
- specific section names beyond naming shape

## Why

This gives the app and agent one deterministic file shape for:
- reading song meta
- reading shared imports
- locating tracks by section and role
- locating section blocks
- locating the final arrangement

## Parsing strategy

The safest parser order is:

1. read marker blocks
2. read `song_meta`
3. read `track_*` vars
4. read `section_*` vars
5. read `final_song`

Do not infer structure from arbitrary freeform code when the canonical names are present.
