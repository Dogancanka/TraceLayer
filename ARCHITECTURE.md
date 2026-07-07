# ARCHITECTURE.md

## Overview

TraceLayer is an Electron app with two processes:

```
electron/main.ts      Main process: window, Ghost Mode, dialogs, file IO, global shortcut
electron/preload.ts   contextBridge API exposed to the renderer as window.traceLayer
src/                  Renderer: React + TypeScript, built by Vite
```

- Renderer is sandboxed: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. All privileged operations go through IPC.
- No backend, no network. All persistence is local files picked via native dialogs.

## The window

Created in `electron/main.ts`:

- `transparent: true, frame: false, hasShadow: false` — the OS window is invisible; everything the user sees (paper, toolbar) is DOM.
- `setAlwaysOnTop(true, 'screen-saver')` — stays above normal always-on-top windows.
- Frameless, so the renderer provides drag regions (`-webkit-app-region: drag` on the top strip and toolbar grip) and a quit button.

## Ghost Mode (the load-bearing feature)

Goal: overlay stays visible, clicks land on the app underneath.

- **Owned by the main process.** `applyGhostMode(ghost)` calls `win.setIgnoreMouseEvents(ghost, { forward: true })` and broadcasts `ghost-mode-changed` to the renderer. Both entry points — the toolbar button (IPC `set-ghost-mode`) and the global shortcut **Ctrl+Alt+G** — go through it, so state can never diverge.
- The global shortcut is required: in Ghost Mode the window ignores clicks, so a mouse-only exit would be impossible if the toolbar trick ever fails.
- **Toolbar stays clickable in Ghost Mode** via the `forward: true` option: mousemove events still reach the renderer, which checks (rAF-throttled, in `App.tsx`) whether the cursor is over `.toolbar` and calls `setIgnoreMouse(false)` / `(true)` accordingly. Main ignores these requests outside Ghost Mode.
- In Ghost Mode the renderer also sets `pointer-events: none` on the stage (`.stage.ghost`) so paper/images never intercept events when the window is temporarily interactive over the toolbar.

## IPC surface

All channels defined in `electron/main.ts`, exposed via `electron/preload.ts`:

| Channel | Type | Purpose |
| --- | --- | --- |
| `set-ghost-mode` | invoke | Renderer requests Ghost Mode on/off |
| `ghost-mode-changed` | main → renderer | Authoritative Ghost Mode state |
| `set-ignore-mouse` | send | Toolbar-hover exception while in Ghost Mode |
| `import-image` | invoke | Open dialog, read PNG/JPG, return data URL (or null) |
| `save-project` | invoke | Save dialog + write JSON string, returns success bool |
| `load-project` | invoke | Open dialog + read JSON string (or null) |
| `close-app` | send | Quit |

The preload's `api` object type (`TraceLayerApi`) is imported type-only by `src/global.d.ts`, so renderer and preload cannot drift.

## Renderer state

Plain React state in `src/App.tsx` — no state library (deliberate; do not add one for MVP):

- `papers: PaperSheet[]` — the stack; each sheet has a small random `tilt`. New sheets mount with the `paper-drop` CSS animation ("placed on top").
- `images: ImageItem[]` — imported images with `x/y/scale/rotation`, positioned relative to window center. Drag = move, wheel = scale, Shift+wheel = rotate, Delete = remove (see `src/components/ImageLayer.tsx`).
- `opacity` — CSS opacity on the stage (papers + images); the toolbar is outside the stage so it stays readable.
- `ghost` — mirror of main-process state.

## Project file format

`*.tracelayer.json`, versioned:

```json
{
  "version": 1,
  "opacity": 0.85,
  "papers": [{ "id": "…", "tilt": 0.4 }],
  "images": [
    { "id": "…", "dataUrl": "data:image/png;base64,…", "x": 0, "y": 0, "scale": 1, "rotation": 0 }
  ]
}
```

Images are embedded as data URLs so a project file is fully self-contained. Fine for MVP; large images make large files (see HANDOFF.md known issues).

## Build system

- **Renderer:** Vite (`vite.config.ts`, `base: './'` so the production build loads via `file://`). Output: `dist/`.
- **Main + preload:** plain `tsc -p tsconfig.electron.json` to CommonJS. Output: `dist-electron/`. No bundler needed — deliberately simple.
- **Dev:** `npm run dev` runs Vite and, once port 5173 is up, compiles the main process and launches Electron with `VITE_DEV_SERVER_URL` set. Renderer hot-reloads; main-process changes need a restart.
- No packaging/installer yet (electron-builder is a roadmap item).
