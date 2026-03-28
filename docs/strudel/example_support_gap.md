# Strudel Example Support Gap

## Purpose

Track runtime coverage status for the imported example library, while keeping clear that example files are reference material rather than the app-support contract.

This document compares:

- the current browser runtime baseline in `packages/app`
- the example set under `testing/examples`
- the imported `testing/ultimate_examples/ultimate_examples.js`

Current app-support contract lives in:

- `docs/strudel/runtime_support.md`
- `sound_samples_list/strudel-role-sample-whitelist.ts` via `APP_RUNTIME_BASELINE`
- `script/strudel/strudel-runtime-smoke.mjs`

Current browser runtime baseline:

- synth and note patterns
- dirt samples
- remote `samples({...}, url)`
- remote `samples('.../strudel.json')`
- `bank("RolandTR808")`
- `bank("RolandTR909")`

## Bank Coverage Status

The imported example-library bank names are now covered by the current browser runtime baseline, including:

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

Likely unsupported aliases or variants also found:

- `linn`
- `tr909`
- `9000`

Current note:

- `AkaiLinn`
- `AlesisHR16`
- `BossDR110`
- `Linn9000`
- `LinnDrum`
- `RolandTR606`
- `SequentialCircuitsDrumtracks`
- `YamahaRY30`

are now part of the intended browser runtime bank baseline

## GM Coverage Status

The imported example-library `gm_*` names are now covered by the enabled soundfont layer and the validated runtime smoke set.

## Helper And Alias Coverage Status

These example-library helper and alias forms now have explicit runtime-smoke coverage:

- `.piano()` helper usage
- `bank("linn")`
- `bank("linndrum")`
- `bank("linn9000")`
- `bank("9000")`
- `bank("tr909")`
- direct names like `linndrum_bd`, `linn9000_bd`, `9000_cb`

- `piano` is now part of the browser runtime baseline through the app-owned preload of `piano.json`
- `cajon`
- `harmonica_soft`
- `kawai`
- `ocarina`
- `psaltery_pluck`
- `recorder_bass_sus`
- `recorder_tenor_sus`
- `sax`

are now part of the browser runtime baseline through the app-owned preload of `vcsl.json`

## Sounds Likely Already Compatible

These appear in the example library and are broadly consistent with the current runtime direction:

- `sine`
- `triangle`
- `square`
- `sawtooth`
- `supersaw`
- `pulse`
- likely `saw` and `tri` if the underlying synth aliases resolve in the current Strudel runtime
- custom song-local names defined by each song through `samples({...})`, such as `vox` or `gtr`

## Product Implication

The imported example library now fits inside the current Strudel Studio runtime at the sound-family and alias/helper level.

That means:

- most imported examples can now be treated as runtime-supported from a sound-family and alias/helper perspective
- validators should prefer the browser runtime baseline over generic Strudel docs
- AI generation should stay inside the validated runtime baseline

## Next Uses

Use this document to:

- tighten `strudel_verify_samples`
- track any remaining song-level adaptation issues that are not caused by missing runtime sound support
- label example files as:
  - browser-runtime compatible
  - requires adaptation
  - requires musical or arrangement adaptation
