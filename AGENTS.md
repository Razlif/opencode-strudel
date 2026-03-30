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

Do not assume `bank(...)` names are supported unless they are in the runtime baseline.

## Rhythm Planning

In Strudel, rhythm should be planned in terms of cycle length, subdivision, and event count.

Event count can match the grid for stability or push against it for tension.

Use asymmetry intentionally for styles such as bossa, tresillo-based grooves, swung patterns, and cross-rhythms.

## Sample Family Guidance

Treat sample families differently:

- breaks and loops: slicing, fitting, scrubbing, careful cut control
- drums and one-shots: cut, clip, timing, density, accent
- pitched instruments: note clarity, register, phrase shape, filtering
- pads and textures: slower motion, space, blend, restraint

## Runtime Baseline

Supported preloaded packs:

- dirt
- drum-machine map
- piano map
- VCSL map

Supported drum banks:

- `RolandTR808`
- `RolandTR909`
- `LinnDrum`
- `Linn9000`
- `AkaiLinn`
- `YamahaRY30`
- `BossDR110`
- `BossDR550`
- `AlesisHR16`
- `KorgDDM110`
- `RolandMT32`
- `SequentialCircuitsDrumtracks`
- `RolandTR606`

Supported named sounds:

- `piano`
- `cajon`
- `kawai`
- `sax`
- `ocarina`
- `harmonica_soft`
- `recorder_tenor_sus`
- `recorder_bass_sus`
- `psaltery_pluck`

Supported GM sounds:

- `gm_accordion`
- `gm_acoustic_guitar_nylon`
- `gm_acoustic_guitar_steel`
- `gm_applause`
- `gm_baritone_sax`
- `gm_bassoon`
- `gm_bird_tweet`
- `gm_brass_section`
- `gm_choir_aahs`
- `gm_church_organ`
- `gm_clarinet`
- `gm_distortion_guitar`
- `gm_drawbar_organ`
- `gm_dulcimer`
- `gm_electric_bass_finger`
- `gm_electric_bass_pick`
- `gm_electric_guitar_clean`
- `gm_electric_guitar_jazz`
- `gm_flute`
- `gm_fretless_bass`
- `gm_fx_brightness`
- `gm_gunshot`
- `gm_harmonica`
- `gm_lead_1_square`
- `gm_lead_2_sawtooth`
- `gm_lead_8_bass_lead`
- `gm_marimba`
- `gm_oboe`
- `gm_ocarina`
- `gm_overdriven_guitar`
- `gm_pad_bowed`
- `gm_pad_choir`
- `gm_pad_halo`
- `gm_pad_metallic`
- `gm_pad_poly`
- `gm_pad_warm`
- `gm_percussive_organ`
- `gm_piano`
- `gm_piccolo`
- `gm_pizzicato_strings`
- `gm_recorder`
- `gm_reed_organ`
- `gm_rock_organ`
- `gm_string_ensemble_1`
- `gm_string_ensemble_2`
- `gm_synth_bass_1`
- `gm_synth_bass_2`
- `gm_synth_strings_1`
- `gm_synth_strings_2`
- `gm_tenor_sax`
- `gm_trombone`
- `gm_trumpet`
- `gm_tuba`
- `gm_vibraphone`
- `gm_violin`
- `gm_epiano1`
- `gm_epiano2`
