# Strudel Studio Test Checklist

This checklist is for the first embedded Strudel runtime milestone inside the OpenCode fork.

It focuses on tests an AI developer can actually run without relying on visual UI inspection.

## First Milestone

The first milestone is:

- a Strudel runtime is embedded in the app
- a hardcoded Strudel snippet can be played
- playback can be stopped
- replay works
- invalid code fails safely

## Required Non-UI Tests

### 1. Build or Typecheck Test

Goal:

- confirm imports, types, and app wiring are still valid

Pass condition:

- no compile or type errors caused by the Strudel integration

## 2. Runtime Smoke Test

Goal:

- prove the embedded runtime can evaluate and play a hardcoded snippet

Example pattern:

- a very small built-in sample pattern such as a kick drum loop

Pass condition:

- runtime initializes
- play action does not throw
- stop action does not throw

## 3. Replay Lifecycle Test

Goal:

- confirm the runtime survives repeated use

Sequence:

1. create runtime
2. play
3. stop
4. play again
5. dispose or cleanup

Pass condition:

- no duplicate-instance problems
- no cleanup failures
- no repeated-play crash

## 4. Invalid Code Test

Goal:

- confirm bad Strudel code fails safely

Pass condition:

- eval failure is caught
- app logic does not crash
- runtime state moves to an error state or equivalent safe result

## 5. Headless Eval Test

Goal:

- verify the code also passes the existing Strudel evaluator tool

Tool:

- `script/strudel/strudel-debug.mjs`

Pass condition:

- Strudel code evaluates into events without runtime-eval failure

## 6. Sample Validation Test

Goal:

- verify sample names used by the snippet are valid

Tool:

- `script/strudel/strudel-sample-inspect.mjs`

Pass condition:

- no unresolved sample-name errors for the snippet under test

## 7. Status Transition Test

Goal:

- confirm runtime state transitions are coherent

Expected states:

- `idle`
- `playing`
- `stopped`
- `error`

Pass condition:

- play changes state correctly
- stop changes state correctly
- invalid code reaches error state correctly

## 8. Session Integration Safety Test

Goal:

- confirm the session-page integration does not break component mounting

Pass condition:

- the session page logic can instantiate the Strudel integration module without throwing
- no mount-time crash
- no teardown crash

## 9. Audio Environment Guard Test

Goal:

- confirm unsupported or partially mocked audio environments fail safely

Pass condition:

- missing browser audio capability does not crash the whole app unexpectedly
- the failure is handled in a bounded way

## Working Definition Of Done For The First Strudel Transport

The first embedded transport milestone is done only when:

1. the app builds successfully
2. a hardcoded Strudel snippet can be played
3. playback can be stopped
4. replay works
5. invalid code is handled safely
6. headless eval passes
7. sample validation passes

Visual UI quality is a separate concern. This checklist is only for runtime and integration correctness.
