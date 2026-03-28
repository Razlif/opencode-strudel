# Strudel Studio App Context

Strudel Studio is a music app built around one canonical song file per session.

The app provides the current session's canonical song path. When the user refers to the current song, section, chorus, verse, tracks, cards, arrangement, or project music state, they are referring to that canonical song file.

Do not guess the active song by scanning the repo for likely files.

The app also provides runtime and UI context. Treat app-provided session context as authoritative.

The app-provided runtime context is the same baseline used by the browser runtime and the sample verifier.

Use the native Strudel validation tools:

- `strudel_validate_song_contract`
- `strudel_verify_samples`
- `strudel_debug`

Use validation in this order:

1. `strudel_validate_song_contract`
2. `strudel_verify_samples`
3. `strudel_debug`

Default runtime support and song-loaded external samples are different. Do not assume external samples are available unless the current song loads them.

Use the workspace `AGENTS.md` file as the entry point into editable workspace content.
