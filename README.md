# Strudel Studio

Strudel Studio is a desktop-style music coding app for making music with Strudel.

It combines:

- chat with an agent
- a canonical song file for each session
- a Strudel browser runtime
- a visual song UI built around sections and tracks

The goal is not to be a generic code editor with music on the side. The goal is to help the user write, hear, inspect, and evolve Strudel songs inside one focused workflow.

## Quick Start

The current setup path is local: run the server, run the app, then open the workspace template.

### 1. Download The Project

- Open this GitHub repository in your browser.
- Either:
  - clone it with Git
  - or click the green `Code` button and then click `Download ZIP`
- If you downloaded a ZIP, unzip it.
- Open a terminal inside the project folder.

### 2. Install Dependencies

- In the project folder, run:

```bash
bun install
```

### 3. Start The Server

- In the project folder, run:

```bash
npm run dev -- serve
```

- Leave that terminal open.

### 4. Start The App

- Open a second terminal.
- Go to the same project folder.
- Run:

```bash
bun run dev:web
```

- Leave that terminal open too.
- The command will print a local URL.
- Open that URL in your browser.

### 5. Get The Workspace Template

This repository includes a ready-made workspace template:

- `strudel-studio-workspace/`

If you cloned or downloaded the repository, you already have it.

You will use that folder as your music workspace.

### 6. Open The Workspace In The App

- In the app, click `Open project`.
- In the file picker, browse to this repository folder.
- Select the `strudel-studio-workspace` folder.
- Confirm the selection.
- The app will now open that folder as your music workspace.

### 7. Start Making Music

Inside the workspace you will find:

- `songs/` for song files
- `examples/` for musical examples
- `samples/` for sample-related references
- `resources/` for notes and supporting material

After opening the workspace:

- create a new session
- the app will create a song file for that session automatically
- type a message in chat such as:
  - `make me a dark synth groove`
  - `add a chorus section`
  - `turn this into a jazz trio`
- press Enter and let the agent build the song with you


## Current Direction

Strudel Studio is currently built from an OpenCode fork and adapted into a Strudel-first product.

Current focus:

- session-based canonical song files
- Strudel-specific validation tools
- browser playback and live evaluation
- workspace examples, resources, and teaching material
- agent workflows tuned for musical editing instead of generic coding

## Credits

- Built from [OpenCode](https://github.com/anomalyco/opencode)
- Uses [Strudel](https://strudel.cc/) for browser-based live coding and playback
- Strudel upstream: https://codeberg.org/uzu/strudel

## Licensing

Strudel Studio is distributed under:

- `AGPL-3.0-or-later`

It also includes and derives from upstream OpenCode code that was originally distributed under the MIT License. OpenCode attribution and third-party notices are preserved in this repository.

See:

- [LICENSE](./LICENSE)
- [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)

## Third-Party Notices

The app currently references these remote sample sources:

- TidalCycles dirt-samples
- Felix Roos dough-samples

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for attribution details.

## Workspace

The repo includes a Strudel Studio workspace template at:

- [strudel-studio-workspace](./strudel-studio-workspace)

This workspace is intended to contain:

- `songs/`
- `examples/`
- `samples/`
- `resources/`
- `.opencode/agent/` prompt files

## Status

The codebase still contains upstream OpenCode surfaces that are not part of the long-term Strudel Studio product. Those are being removed progressively as the app is reshaped into a cleaner Strudel-specific repository.
