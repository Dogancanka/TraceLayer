# TraceLayer

**Transparent tracing paper for your screen.**

TraceLayer is an open-source Windows desktop overlay. It puts a paper-like, semi-transparent, always-on-top window over whatever you are working on — a browser, Revit, AutoCAD, Photoshop, anything — so you can trace, compare, and reference without switching apps.

It is **not** a plugin, not a CAD app, not a PDF editor, and not a cloud service. It is a standalone desktop app that works over every other app.

## Two modes

- **Edit Mode** — interact with the overlay: place new sheets of paper, import a PNG/JPG, then move / scale / rotate it, adjust opacity, save/load your project.
- **Ghost Mode** — the overlay stays visible, but mouse clicks pass through to the application underneath. Toggle with the toolbar button or **Ctrl+Alt+G** (works globally, even when the window is click-through).

## MVP 0.1 features

- Transparent, always-on-top, frameless window with a paper-like look
- Ghost Mode click-through / Edit Mode toggle
- **New Paper** button with a "new sheet placed on top" animation
- Import PNG/JPG images
- Move (drag), scale (mouse wheel), rotate (Shift + mouse wheel) imported images
- Opacity slider
- Save / load project as a local JSON file
- Minimal floating toolbar

No backend, no auth, no cloud, no telemetry. Everything is local.

## Getting started

Requirements: Node.js 20+ on Windows 10/11.

```bash
npm install
npm run dev      # dev mode: Vite + Electron with hot reload for the renderer
```

Production-style run:

```bash
npm run start    # typecheck, build, launch Electron against the built files
```

Other scripts:

```bash
npm run build      # typecheck + build renderer and main process
npm run typecheck  # type-check only
```

## Controls

| Action | How |
| --- | --- |
| Toggle Ghost/Edit Mode | Toolbar **Ghost** button, or **Ctrl+Alt+G** (global) |
| Move window | Drag the top strip or the toolbar grip (⠿) |
| New sheet of paper | Toolbar **New Paper** |
| Import image | Toolbar **Import** (PNG/JPG) |
| Move image | Drag it |
| Scale image | Mouse wheel over it |
| Rotate image | Shift + mouse wheel over it |
| Delete image | Select it, press **Delete** |
| Deselect | **Escape** or click the paper |
| Opacity | Toolbar slider |
| Save / load project | Toolbar **Save** / **Load** (`.tracelayer.json`) |
| Quit | Toolbar **✕** |

## Project files

Projects are plain JSON (`*.tracelayer.json`) containing the paper stack, imported images (embedded as data URLs), and opacity. See [ARCHITECTURE.md](ARCHITECTURE.md) for the format.

## Documentation

- [MVP_SCOPE.md](MVP_SCOPE.md) — what 0.1 includes and explicitly excludes
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the app is built
- [ROADMAP.md](ROADMAP.md) — where it is going (macOS is future work; Windows only for now)
- [TASKS.md](TASKS.md) — task tracking
- [AGENTS.md](AGENTS.md) — rules for AI agents contributing to this repo
- [HANDOFF.md](HANDOFF.md) — current state, known issues, next steps

## License

[MIT](LICENSE)
