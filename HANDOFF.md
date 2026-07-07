# HANDOFF.md

> Agents: rewrite the "Current state" section after every change. Keep history short — this file describes *now*, not a changelog.

**Last updated:** 2026-07-07 (New Paper fix + roadmap 0.2 features)

## Current state

MVP 0.1 + toolbar polish + most of roadmap 0.2. `npm run typecheck` and `npm run build` pass; app launches.

Latest changes:

- **New Paper fixed.** It looked like a no-op: all images rendered above all sheets and sheets were opaque. Now sheets and their images/strokes render interleaved (`LayerStack`), sheets are slightly translucent, and images belong to a sheet (`ImageItem.paperId`). A new sheet visibly covers and dims everything below it; covered content becomes non-interactive naturally. Old project files still load (`normalizeProject()` back-fills missing fields).
- **Pen + eraser** (0.2): draw on the top sheet with smoothed SVG strokes; eraser removes whole strokes it touches (top sheet only). `DrawingSurface` mounts only while a drawing tool is active in Edit Mode; Ghost Mode untouched.
- **Undo/redo** (0.2): snapshot history (max 50) covering papers/images/strokes; Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z + toolbar ↶ ↷. One step per action/gesture (drag start, wheel-gesture start, stroke end, erase gesture).
- **Per-image opacity** (0.2): "Img" slider appears in the toolbar when an image is selected.
- **Window position/size persistence** (0.2): saved to `userData/window-state.json` on close, restored at launch.
- Toolbar collapse pill still keeps the `.toolbar` class — the Ghost Mode hover check matches `.toolbar`; do not rename it. Opacity slider stays on the main bar (user preference — do not move into settings). Page controller ‹ 1/1 › remains a disabled placeholder (`pages?: DocumentPages` reserved in types).

## What works (implemented, typechecked, app launches)

- Electron + React + TS + Vite scaffold; dev (`npm run dev`) and prod-style (`npm run start`) flows
- Transparent, frameless, always-on-top window (`screen-saver` level)
- Ghost Mode: `setIgnoreMouseEvents(ghost, { forward: true })`, owned by main process; toggled via toolbar or global **Ctrl+Alt+G**; toolbar stays clickable in Ghost Mode via hover-based ignore toggling
- Edit Mode: New Paper (with drop-on-top animation), PNG/JPG import (native dialog → embedded data URL), image drag/wheel-scale/Shift+wheel-rotate, Delete to remove, opacity slider
- Save/load `.tracelayer.json` via native dialogs (versioned format, see ARCHITECTURE.md)
- Minimal floating beige toolbar (bottom-center): collapse/expand, settings popover with opacity + shortcuts, Hide (minimize) and ✕ (quit), disabled page-controller placeholder; window movable via top drag strip and toolbar grip

## What does not work yet / unverified

- **Ghost Mode click-through has NOT been manually verified over real apps.** The implementation is the standard Electron pattern, but nobody has clicked through onto Notepad/browser/CAD yet. This is the first thing to verify (TASKS.md).
- Drawing/eraser/undo not manually exercised in a real tracing workflow yet.
- Edge-resizing a transparent frameless window on Windows is historically finicky in Electron; unverified.
- Paper rotation (0.2 item): not implemented — needs pointer-coordinate mapping design so drawing works on a rotated stage.
- Pen pressure: not implemented (optional 0.2 item).
- No packaging/installer — runs via `npm run dev` / `npm run start` only.

## Known issues / sharp edges

- Strokes are not clipped to the sheet edge — drawing can extend past the paper border (cosmetic).
- Strokes/images are window-center-relative: resizing the window shifts content relative to the paper edges.
- Loading a project replaces the current document (it does push an undo snapshot first).
- Images are embedded in project JSON as base64 data URLs → large images make large project files.
- Load failure shows a plain `alert()`.
- Window position/size not persisted between launches.
- Opening DevTools docked can break window transparency — open detached if needed.
- `Backspace` also deletes the selected image (same handler as `Delete`).
- Global shortcut Ctrl+Alt+G is registered system-wide while the app runs; collides with any other app using it.

## How to run

```bash
npm install
npm run dev     # or: npm run start
```

## Next recommended task

**Manual verification of Ghost Mode on Windows 11** (top of TASKS.md): launch, put the window over Notepad/a browser, toggle Ghost Mode (button and Ctrl+Alt+G), confirm clicks land underneath, confirm the toolbar still responds to hover+click (also while collapsed), confirm Ctrl+Alt+G exits, confirm Hide→taskbar restore works. Fix whatever that surfaces before touching anything else.
