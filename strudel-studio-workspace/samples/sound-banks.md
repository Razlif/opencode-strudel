# Sound Banks

This file lists the current Strudel Studio runtime sound sources for workspace reference.

Treat [packages/app/src/pages/session/strudel-runtime.ts](/abs/path/c:/Users/moked/OneDrive/שולחן העבודה/opencode-strudel/packages/app/src/pages/session/strudel-runtime.ts) as the source of truth if this file drifts.

## Built-In Sample Banks

Use these directly in patterns like:

```js
s("RolandTR909")
```

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

## Named Instruments

Use these directly in patterns like:

```js
s("piano")
```

- `piano`
- `cajon`
- `kawai`
- `sax`
- `ocarina`
- `harmonica_soft`
- `recorder_tenor_sus`
- `recorder_bass_sus`
- `psaltery_pluck`

## GM Sounds

Use these directly in patterns like:

```js
s("gm_piano")
```

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

These are named sounds backed by explicit sample loads.

- `vox`
  load:
  ```js
  samples("https://raw.githubusercontent.com/felixroos/dough-samples/main/vcsl.json")
  ```
  preview:
  ```js
  s("vox").gain(.7)
  ```

## Runtime Pack References

These are the runtime pack aliases currently configured by Strudel Studio.

- `dirt`
  `github:tidalcycles/dirt-samples`
- `drum`
  `https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json`
- `piano`
  `https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json`
- `vcsl`
  `https://raw.githubusercontent.com/felixroos/dough-samples/main/vcsl.json`
