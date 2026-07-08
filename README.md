# TraceLayer

**Transparent tracing paper for your screen.**

TraceLayer is an open-source Windows desktop overlay that floats above any application. It gives you a paper-like, semi-transparent layer on top of whatever you are working on — a browser, Revit, AutoCAD, Photoshop, Figma, maps, stock charts, PDFs, screenshots, or anything else visible on screen.

Use it to trace, compare, annotate, review, and reference visual information without switching tools or building plugins.

TraceLayer is **not** a plugin, not a CAD app, not a PDF editor, not a browser extension, and not a cloud service. It is a standalone desktop app that works over every other app.

No backend. No auth. No cloud. No telemetry. Everything stays local.

---

## The idea

TraceLayer started as **transparent tracing paper for CAD drawings**, but the core idea is broader:

> A universal visual layer for your computer.

Instead of integrating with every app, TraceLayer sits above all of them. If you can see it on your screen, you can trace it, compare it, annotate it, and save your own review layer on top.

---

## Status

Early but functional. The 0.1 MVP plus most of the 0.2 "make tracing pleasant" milestone is implemented: sheets, Ghost Mode, image import/snapshot, pen/eraser, undo/redo, text notes and callouts (with image anchoring), sheet navigation, image lock, and save/load — see the feature list below. `npm run typecheck` and `npm run build` pass; the app runs via `npm run dev` / `npm run start`, and a Windows portable `.exe` can be built with `npm run dist:win` (no installer yet).

The main outstanding work is **manual verification on Windows** — especially Ghost Mode click-through over real applications — plus measured scale calibration and paper rotation. See [TASKS.md](TASKS.md) for the honest checklist and [HANDOFF.md](HANDOFF.md) for the current state and known issues.

---

## Two modes

### Edit Mode

Interact with the overlay:

* Add new sheets of tracing paper
* Import PNG/JPG reference images
* Take a snapshot of the screen under the overlay
* Move, scale, rotate, lock, and adjust image opacity
* Draw with pen and erase strokes
* Add text notes and callouts with arrows
* Navigate between sheets
* Save/load local TraceLayer project files

### Ghost Mode

The overlay stays visible, but mouse clicks pass through to the application underneath.

Toggle Ghost Mode with the toolbar button or **Ctrl+Alt+G**. The shortcut works globally, even when the window is click-through.

---

## Features

* Transparent, always-on-top, frameless Windows overlay
* Ghost Mode click-through / Edit Mode toggle
* Global **Ctrl+Alt+G** failsafe
* Paper-like sheets with translucent stacking
* Active sheet navigation (sheets above the active one fade while you work below)
* Import PNG/JPG images
* Snapshot the screen underneath the overlay
* Move, scale, rotate, lock, and adjust opacity of imported images
* Pen drawing (colors and widths) and eraser
* Undo/redo
* Text notes
* Callout bubbles with arrows
* Notes/callouts can anchor to images and follow them when moved/scaled/rotated
* Paper opacity and per-image opacity
* Drawing scale label (1:50 / 1:100 / 1:200) with corner rulers
* Optional paper sound when adding a sheet (toggle in settings)
* Save/load local `.tracelayer.json` project files (remembers the sheet size)
* Minimal floating toolbar
* Local-first: no backend, accounts, sync, telemetry, or cloud

---

## Getting started

Requirements:

* Windows 10/11
* Node.js 20+

Install and run in development mode:

```bash
npm install
npm run dev
```

Production-style run:

```bash
npm run start
```

Other scripts:

```bash
npm run build      # typecheck + build renderer and main process
npm run typecheck  # type-check only
npm run dist:win   # build Windows portable .exe into release/
```

---

## Controls

| Action                        | How                                                         |
| ----------------------------- | ----------------------------------------------------------- |
| Toggle Ghost/Edit Mode        | Toolbar **Ghost** button, or **Ctrl+Alt+G**                 |
| Move window                   | Drag the top strip or toolbar grip                          |
| New sheet                     | Toolbar **New Sheet**                                       |
| Sheet above / underneath      | Toolbar sheet controls, **Alt+↑/↓**, or **PageUp/PageDown** |
| Import image                  | Toolbar **Import**                                          |
| Snapshot screen under overlay | Toolbar **camera** button                                   |
| Draw / erase                  | Toolbar **Pen** / **Erase**                                 |
| Add text note                 | Toolbar **Note**, then click the active sheet               |
| Add callout                   | Toolbar **Callout**, then click the active sheet            |
| Anchor note/callout to image  | Select the image first, then place the note/callout         |
| Move note/callout             | Drag its grip                                               |
| Edit note/callout text        | Click the text and type                                     |
| Re-aim callout arrow          | Select it, then drag the target handle                      |
| Undo / redo                   | **Ctrl+Z** / **Ctrl+Y**, or toolbar buttons                 |
| Move image                    | Drag it                                                     |
| Scale image                   | Mouse wheel                                                 |
| Rotate image                  | Shift + mouse wheel                                         |
| Image opacity                 | Image opacity slider when an image is selected              |
| Lock image                    | Lock button when an image is selected                       |
| Delete current sheet          | Toolbar **trash** button                                    |
| Delete selected item          | Select it, then press **Delete**                            |
| Deselect                      | **Escape** or click the paper                               |
| Paper opacity                 | Toolbar opacity slider                                      |
| Save / load project           | Toolbar **Save** / **Load**                                 |
| Quit                          | Toolbar **✕**                                               |

---

## Project files

TraceLayer projects are plain local JSON files:

```txt
*.tracelayer.json
```

A project file contains the paper stack, strokes, notes, callouts (including their sheet/image anchors), imported images, image transforms and lock state, opacity settings, drawing scale, and window/sheet size information.

Images are embedded as data URLs, so project files are self-contained.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the project file format.

---

## What TraceLayer is not

TraceLayer should stay universal, minimal, and local-first.

It is not:

* A Revit plugin
* An AutoCAD plugin
* A browser extension
* A CAD application
* A PDF editor
* A cloud review platform
* A sync service
* A telemetry product

The core value is that TraceLayer works above **any** application.

---

## Roadmap direction

TraceLayer is currently focused on making the universal overlay workflow reliable and useful.

Near-term ideas:

* Better PDF page import
* Measured scale calibration
* Reference/compare workflows
* Before/after visual comparison
* Better multi-monitor behavior
* NSIS installer packaging (portable `.exe` exists)

Future research:

* Computer vision alignment
* Visual diff / "Compare Anything" mode
* Local AI-assisted review notes
* Exportable review packages
* macOS support

See [ROADMAP.md](ROADMAP.md) for direction. Roadmap items are not guaranteed work.

---

## Contributing

Contributions are welcome.

Good contributions include:

* Bug fixes
* Windows testing
* Ghost Mode reliability improvements
* Small UI polish
* PDF/image import improvements
* Local-only reference workflows
* Better save/load reliability
* Documentation and examples
* "Compare anything" workflow experiments

Please keep pull requests small and focused.

TraceLayer core should remain:

* Standalone
* Universal across apps
* Local-first
* Minimal and paper-like
* Free of backend services, accounts, telemetry, and cloud dependencies
* Free of host-app plugins

Experimental ideas are welcome, but features that tie TraceLayer to one specific app or platform should live outside the core project.

---

## Documentation

* [MVP_SCOPE.md](MVP_SCOPE.md) — original MVP scope
* [ARCHITECTURE.md](ARCHITECTURE.md) — how the app is built
* [ROADMAP.md](ROADMAP.md) — where it is going
* [TASKS.md](TASKS.md) — task tracking
* [AGENTS.md](AGENTS.md) — rules for AI agents contributing to this repo
* [HANDOFF.md](HANDOFF.md) — current state, known issues, next steps

---

## License

TraceLayer is released under the [MIT License](LICENSE).

You are free to use it, fork it, modify it, distribute it, and build your own version. Please keep the license/copyright notice and give credit to the original project.
