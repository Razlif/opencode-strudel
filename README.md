# Strudel Studio

Strudel Studio is a desktop-style music coding app for making music with Strudel.

It combines:

- chat with an agent
- a canonical song file for each session
- a Strudel browser runtime
- a visual song UI built around sections and tracks

### 1. Download The Project

- Open this GitHub repository in your browser.
- Either:
  - clone it with Git
  - or click the green `Code` button and then click `Download ZIP`
- If you downloaded a ZIP, unzip it.
- Open a terminal inside the project folder.

### 2. Install Dependencies

- Bun is required.
- If you do not have Bun installed yet, install it first:
  - docs: https://bun.sh/docs/installation
  - Windows PowerShell:

```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

- After installing Bun, restart your terminal.
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

### 4.5 Optional: Melody Recording Backend

- `Record Melody` currently depends on an experimental local Python backend.
- The rest of the app runs without it.
- If you want melody transcription, install Python 3 first:
  - https://www.python.org/downloads/
- Then install the backend dependencies:

```bash
pip install -r script/strudel/requirements-melody-pyin.txt
```

- Start the melody backend in a separate terminal:

```bash
python script/strudel/melody-pyin-server.py
```

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

in the session screen say hello to the agent to start the session - this will open the strudel studio UI.

press play on the defualt built in template.

the sound banks are in the leftside bar- you can preview a sound back or add an empty track into the active section.

the agent and prompts have not been fully optimized yet so the agent will have a learning curve at the start of the conversation. he should be prompted to read the composition tutorial in the repo.

the agent can create a full arrangment with some earlier planning - but this is slower espcially on the free models.

ideally you can work with the agent on the track or section level.

a tutorial agent is in planning so will not need torely on the agent completly for strudel and you can patch the tracks with your own nuance.

- Guided melody recording / "Record Melody" is still in progress.
- It is experimental and not production-ready yet.
- It currently requires the optional local Python backend described above.


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
- `samples/`
- `resources/`
- `.opencode/agent/` prompt files

## Status

The codebase still contains upstream OpenCode surfaces that are not part of the long-term Strudel Studio product. Those are being removed progressively as the app is reshaped into a cleaner Strudel-specific repository.
