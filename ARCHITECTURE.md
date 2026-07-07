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

Plain React state in `src/App.tsx` — no state library (deliberate; do not add one):

- `papers: PaperSheet[]` — the stack; each sheet has a small random `tilt` and its own `strokes`, `textBoxes`, `callouts`, and a reserved `calibration` placeholder. New sheets mount with the `paper-drop` CSS animation ("placed on top").
- `images: ImageItem[]` — imported images with `x/y/scale/rotation/opacity` and a `paperId`. Positioned relative to window center. Drag = move, wheel = scale, Shift+wheel = rotate, Delete = remove (see `src/components/ImageView.tsx`).
- `opacity` — CSS opacity on the stage; the toolbar is outside the stage so it stays readable. Per-image opacity multiplies on top.
- `tool` — `select | pen | eraser | text | callout`. Pen/eraser mount `DrawingSurface`, a full-stage input layer; strokes commit to the **active** sheet on pointer-up, the eraser removes whole strokes it touches (active sheet only). Text/callout place a new item on the active sheet on the next stage click, then switch back to `select`.
- `activeSheetId` — which sheet in `papers` new strokes/text/callouts/imports land on. Independent of z-order: navigating with the sheet controller (prev/next, or Alt+Up/Down / PageUp/PageDown) does **not** reorder the stack, it only changes the target sheet. Self-heals to the top sheet if the id ever goes stale (e.g. after an undo removes that sheet). Not persisted in the project file — loading a project sets it to the top sheet.
- `selection: Selection | null` — `{ kind: 'image' | 'text' | 'callout', id }`. Replaces the old image-only `selectedId`; Delete/Backspace and the per-item drag/edit UI branch on `kind`.
- `ghost` — mirror of main-process state.

**Layering:** `LayerStack` renders sheets and their contents interleaved: sheet → its images → its strokes → its text boxes/callouts, next sheet on top of all of that. Sheets are slightly translucent, so lower layers show through dimmed (real tracing-paper behavior). Items under a newer sheet are automatically non-interactive because the sheet div hit-tests above them — this applies to text boxes and callouts exactly as it already did to images. The corner ruler stays above all of this (`.ruler` z-index 30); the toolbar is outside the stage entirely.

**Active sheet vs. top sheet:** the sheet stack's visual stacking order never changes — that is what makes the tracing-paper metaphor work. "Sheet navigation" instead moves an independent pointer (`activeSheetId`) to decide which existing sheet receives new content. When the active sheet isn't the topmost one, its own translucent-highlight ring (`.paper-sheet.active-sheet`) can be substantially covered by sheets above it; the toolbar's "Sheet i/N" label is the authoritative indicator of which sheet is active, not the on-canvas highlight.

**Undo/redo:** snapshot stacks (`past`/`future`, max 50) of `{ papers, images }` held in refs. Snapshots are cheap — image data URLs are shared by reference. Because `textBoxes` and `callouts` live inside `papers`, they are covered by the exact same snapshot mechanism as strokes with no changes to the history engine. One snapshot per discrete action or gesture: add paper, import, delete, stroke end, erase gesture (only if it removed something), image/text/callout drag start, wheel-gesture start (>400 ms gap = new gesture), text/callout edit session start (on focus — see `TextBoxView`/`CalloutView`). Live drags and keystrokes mutate state without additional history pushes. Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) are suppressed while a text box/callout has focus, so the browser's native in-field undo and Delete/Backspace-as-character take over instead of hijacking the document-level history.

**Stroke geometry** (`src/stroke.ts`): flat `[x0, y0, x1, y1, …]` arrays, window-center-relative px. Rendered as SVG paths smoothed with quadratic midpoints, via a centered zero-size `overflow: visible` svg — no resize handling needed. Eraser hit-test is point-to-segment distance.

**Text boxes** (`src/components/TextBoxView.tsx`): a small paper-like box with a drag grip (⠿) and a `contentEditable` body. Position (`x`/`y`) is window-center-relative, same convention as strokes/images; width is stored, height grows with content. Text is read back via `innerText` (not `textContent`) so multi-line notes round-trip through save/load correctly.

**Callouts** (`src/components/CalloutView.tsx` + the per-sheet `callout-arrow-layer` svg in `LayerStack`): a bubble (same grip + `contentEditable` pattern as text boxes) plus a separately draggable arrow-target handle. The arrow line itself is drawn once per sheet in a shared svg (like the stroke layer), from `bubble` to `target`, with an arrowhead marker. `style.color` drives the bubble border, arrow, and target-handle color.

## Project file format

`*.tracelayer.json`, versioned via `ProjectFile.version` (currently `SCHEMA_VERSION = 2` in `src/types.ts`). v1 files (papers with only `strokes`) and v2 files missing newer optional fields are both upgraded in memory by `normalizeProject()` when loading; a save always writes the current version. Do not remove an older version's normalization path when bumping the version further.

```json
{
  "version": 2,
  "opacity": 0.85,
  "papers": [
    {
      "id": "…",
      "tilt": 0.4,
      "strokes": [{ "id": "…", "points": [0, 0, 10, 12], "color": "#3a3630", "width": 2 }],
      "textBoxes": [{ "id": "…", "sheetId": "…", "x": 10, "y": -20, "width": 190, "text": "note" }],
      "callouts": [
        {
          "id": "…",
          "sheetId": "…",
          "text": "see this",
          "bubble": { "x": -60, "y": -80 },
          "target": { "x": 10, "y": 0 },
          "style": { "color": "#3a3630" }
        }
      ],
      "calibration": null
    }
  ],
  "images": [
    {
      "id": "…",
      "dataUrl": "data:image/png;base64,…",
      "x": 0, "y": 0, "scale": 1, "rotation": 0,
      "opacity": 1,
      "paperId": "…"
    }
  ]
}
```

Images are embedded as data URLs so a project file is fully self-contained. Fine for now; large images make large files (see HANDOFF.md known issues).

## Window state persistence

`electron/main.ts` saves window bounds to `window-state.json` in `app.getPath('userData')` on close and restores them on launch (with basic sanity checks). Local file only — no cloud.

## Build system

- **Renderer:** Vite (`vite.config.ts`, `base: './'` so the production build loads via `file://`). Output: `dist/`.
- **Main + preload:** plain `tsc -p tsconfig.electron.json` to CommonJS. Output: `dist-electron/`. No bundler needed — deliberately simple.
- **Dev:** `npm run dev` runs Vite and, once port 5173 is up, compiles the main process and launches Electron with `VITE_DEV_SERVER_URL` set. Renderer hot-reloads; main-process changes need a restart.
- No packaging/installer yet (electron-builder is a roadmap item).
