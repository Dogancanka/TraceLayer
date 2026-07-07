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
- [ ] Manual verification pass on Windows: Ghost Mode click-through over real apps (Notepad, browser, CAD) — **do this first**
- [ ] Verify frameless transparent window edge-resize behaves on Windows 11; add fallback (resize handles) if not

## Milestone 0.1.x — hardening (only after manual verification)

- [ ] Error toasts instead of `alert()` for load failures
- [ ] Remember window position/size between launches (local file, no cloud)
- [ ] Guard against huge imported images (warn on multi-MB data URLs)
- [ ] App icon
- [ ] Packaging with electron-builder (portable exe / NSIS installer)

## Later

See [ROADMAP.md](ROADMAP.md). Do not start roadmap items while 0.1 verification tasks are open.
