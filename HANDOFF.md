# HANDOFF.md

> Agents: rewrite the "Current state" section after every change. Keep history short — this file describes *now*, not a changelog.

**Last updated:** 2026-07-07 (toolbar UI polish)

## Current state

MVP 0.1 vertical slice + toolbar UI polish pass. `npm run typecheck` and `npm run build` pass.

Latest change (UI polish only, no architecture changes):

- Toolbar restyled to a warm beige paper-like theme (rounded, soft shadow, subtle border); stays bottom-centered and compact.
- **Collapse**: ▾ button collapses the bar to a small "▲ TraceLayer" pill; clicking it restores the bar. The collapsed pill keeps the `.toolbar` class — the Ghost Mode hover check in `App.tsx` matches `.toolbar`, so the pill stays clickable in Ghost Mode and Ghost Mode remains exitable (plus Ctrl+Alt+G always works). Do not rename that class without updating the hover check.
- **Settings popover** (⚙): shortcuts reference. Popover closes automatically when Ghost Mode starts. Opacity slider stays on the main bar (user preference — do not move it into settings). Primary bar: New Paper, Import, page controller, Ghost, Opacity, Save, Load, Settings, Collapse, Hide, ✕.
- **Hide button** (–) beside ✕: minimizes the window via IPC `hide-window` → `win.minimize()`; restore from taskbar. Does not quit.
- **Page controller placeholder**: disabled ‹ 1 / 1 › in the bar. Data model reserved as optional `pages?: DocumentPages` on `ProjectFile` (`src/types.ts`) — not populated, no version bump needed; future PDF pages should render to images and reuse the ImageItem pipeline.

## What works (implemented, typechecked, app launches)

- Electron + React + TS + Vite scaffold; dev (`npm run dev`) and prod-style (`npm run start`) flows
- Transparent, frameless, always-on-top window (`screen-saver` level)
- Ghost Mode: `setIgnoreMouseEvents(ghost, { forward: true })`, owned by main process; toggled via toolbar or global **Ctrl+Alt+G**; toolbar stays clickable in Ghost Mode via hover-based ignore toggling
- Edit Mode: New Paper (with drop-on-top animation), PNG/JPG import (native dialog → embedded data URL), image drag/wheel-scale/Shift+wheel-rotate, Delete to remove, opacity slider
- Save/load `.tracelayer.json` via native dialogs (versioned format, see ARCHITECTURE.md)
- Minimal floating beige toolbar (bottom-center): collapse/expand, settings popover with opacity + shortcuts, Hide (minimize) and ✕ (quit), disabled page-controller placeholder; window movable via top drag strip and toolbar grip

## What does not work yet / unverified

- **Ghost Mode click-through has NOT been manually verified over real apps.** The implementation is the standard Electron pattern, but nobody has clicked through onto Notepad/browser/CAD yet. This is the first thing to verify (TASKS.md).
- Edge-resizing a transparent frameless window on Windows is historically finicky in Electron; unverified.
- Paper (window) rotation: not implemented, deliberately out of MVP scope.
- No packaging/installer — runs via `npm run dev` / `npm run start` only.

## Known issues / sharp edges

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
