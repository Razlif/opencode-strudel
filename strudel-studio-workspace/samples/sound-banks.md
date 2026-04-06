# Strudel Studio Supported Sounds

This file is the workspace-facing whitelist for Strudel Studio sounds.

Use it before writing or editing sample choices in canonical song files.

If this file ever drifts, treat [`packages/app/src/pages/session/strudel-runtime.ts`](../../packages/app/src/pages/session/strudel-runtime.ts) as the runtime source of truth.

## Usage Rules

- Do not assume a sound is supported unless it is listed here or explicitly loaded.
- For session song edits, prefer the built-in sounds listed here over adding new external packs.
- If you need a remote named entry, include its required `samples("...")` load in the canonical song imports area.
- When uncertain, verify against the runtime file rather than guessing.

## Built-In Drum Banks

These are the supported drum-bank names exposed by the runtime.

Use bank names like:

```js
s("bd hh sd hh").bank("RolandTR909")
```

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

## Built-In Named Instruments

These are directly supported named sounds.

Use named sounds like:

```js
s("piano")
```

Supported named instruments:

- `piano`
- `cajon`
- `kawai`
- `sax`
- `ocarina`
- `harmonica_soft`
- `recorder_tenor_sus`
- `recorder_bass_sus`
- `psaltery_pluck`

## Built-In GM Sounds

These GM-style names are available directly in the runtime.

Use GM sounds like:

```js
s("gm_piano")
```

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

## Remote Named Entries

These names are supported only when their backing sample pack is loaded.

- `vox`
  Required load:
  ```js
  samples("https://raw.githubusercontent.com/felixroos/dough-samples/main/vcsl.json")
  ```
  Example:
  ```js
  s("vox").gain(.7)
  ```

## Runtime Pack Aliases

These are the pack references configured by Strudel Studio.

- `dirt`
  `github:tidalcycles/dirt-samples`
- `drum`
  `https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json`
- `piano`
  `https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json`
- `vcsl`
  `https://raw.githubusercontent.com/felixroos/dough-samples/main/vcsl.json`

## Practical Guidance

- For drum grooves, prefer supported drum banks plus drum tokens.
- For pitched writing, prefer named instruments or GM sounds listed above.
- For melody imports and rhythm seeds, keep generated sounds inside this whitelist unless the user explicitly requests otherwise.
- If a sound is not listed here, do not claim it will work.
