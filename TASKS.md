# TASKS.md

Task tracking for TraceLayer. Agents: mark tasks done as you complete them, add new ones at the bottom of the relevant section, keep this honest.

## Milestone 0.1 — MVP

- [x] Repo foundation: README, AGENTS, ARCHITECTURE, MVP_SCOPE, TASKS, ROADMAP, HANDOFF, LICENSE (MIT)
- [x] Electron + React + TypeScript + Vite scaffold (dev + build scripts)
- [x] Transparent, frameless, always-on-top window
- [x] Ghost Mode click-through (`setIgnoreMouseEvents` + `forward: true`)
- [x] Global shortcut Ctrl+Alt+G to toggle Ghost Mode
- [x] Toolbar stays clickable in Ghost Mode (hover-based ignore toggle)
- [x] Edit Mode interactions
- [x] Paper-like visual style
- [x] New Paper button with "sheet placed on top" animation
- [x] Import PNG/JPG (native dialog → data URL)
- [x] Move / scale / rotate imported image (drag / wheel / Shift+wheel)
- [x] Delete selected image (Delete key)
- [x] Opacity slider
- [x] Save/load project as local JSON
- [x] Minimal floating toolbar + window drag regions
- [x] Toolbar UI polish: beige paper theme, bottom-center, collapse/expand pill, settings popover (opacity + shortcuts), Hide (minimize) beside ✕, page-controller placeholder for future PDF pages
- [ ] Manual verification pass on Windows: Ghost Mode click-through over real apps (Notepad, browser, CAD) — **do this first**; include collapsed-toolbar hover in Ghost Mode and Hide→restore
- [ ] Verify frameless transparent window edge-resize behaves on Windows 11; add fallback (resize handles) if not

## Milestone 0.2 — Make tracing pleasant

- [x] Fix New Paper: sheets/images interleaved in z-order, translucent sheets (tracing-paper behavior)
- [x] Pen drawing on the top sheet (smoothed strokes, committed on pointer-up)
- [x] Eraser (removes whole strokes, top sheet only)
- [x] Undo/redo (snapshot history, Ctrl+Z / Ctrl+Y, toolbar buttons)
- [x] Per-image opacity (Img slider appears when an image is selected)
- [x] Window position/size persistence (userData/window-state.json)
- [ ] Paper rotation (rotate paper *content*, not the OS window) — needs pointer-coordinate mapping for drawing on a rotated stage; design before building
- [ ] Manual verification: draw/erase/undo over a real workflow; strokes are not clipped to the sheet edge (known cosmetic issue)

## Milestone 0.1.x — hardening (only after manual verification)

- [ ] Error toasts instead of `alert()` for load failures
- [ ] Remember window position/size between launches (local file, no cloud)
- [ ] Guard against huge imported images (warn on multi-MB data URLs)
- [ ] App icon
- [ ] Packaging with electron-builder (portable exe / NSIS installer)

## Later

See [ROADMAP.md](ROADMAP.md). Do not start roadmap items while 0.1 verification tasks are open.
