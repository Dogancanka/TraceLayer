# ROADMAP.md

Direction only — nothing here is committed work. **Do not implement roadmap items before the current milestone's verification tasks in TASKS.md are done.** Ghost Mode working reliably above other apps is the foundation for everything below.

## 0.1 (current) — Prove the overlay

Transparent always-on-top paper window, Ghost Mode click-through, image tracing basics, local save/load. See MVP_SCOPE.md.

## 0.2 — Make tracing pleasant (in progress)

- [x] Pen drawing on the paper, eraser (pressure not implemented — optional, still open)
- [x] Undo/redo
- [ ] Paper rotation (rotate the paper *content*, not the OS window; random sheet tilt is disabled until this lands)
- [x] Image opacity per layer (separate from global paper opacity)
- ~~Window position/size persistence~~ Replaced 2026-07-08: window always starts centered at 800×500; project files remember the sheet size instead

Shipped beyond the original 0.2 list (2026-07-07/08): text notes, callout bubbles with arrows, sheet navigation (fade-above-active stacking), annotation anchoring to images, per-image lock, delete sheet, corner rulers + scale label presets, snapshot-under-overlay, New Sheet sound.

## 0.3 — Reference workflows

- PDF page import (rendered to image, still no PDF editing)
- Multiple monitors: move overlay between screens cleanly
- Snap window to a target app's bounds (still overlay-based — not a plugin)
- Simple layer list (reorder, hide, lock) — per-image **lock** already shipped early (2026-07-08, toolbar lock button); the list UI with reorder/hide remains
- Anchor management UI (re-anchor an existing annotation to a different image/sheet) — anchoring itself shipped 2026-07-08; only placement-time defaults exist so far

## 0.4 — Distribution

- electron-builder packaging: portable exe + installer
- Auto-update via GitHub Releases (download-and-run only; no telemetry)
- Code signing (if feasible for an OSS project)

## Future / research

- **macOS support** — documented intent, not started. Needs its own click-through and always-on-top verification (`setIgnoreMouseEvents` exists but window-level behavior differs). Windows remains the primary platform until 1.0.
- ~~Screenshot-and-trace: capture the screen under the overlay as a reference layer~~ **Done** (Snapshot button, 2026-07-07): `desktopCapturer` in main, overlay hidden for one frame, crop to window bounds, placed 1:1 on the top sheet.
- Grid/guide overlays (architectural scales)
- Reference/compare workflows: before/after comparison, visual diff / "Compare Anything" mode
- Computer vision alignment of reference images
- Local AI-assisted review notes (local-only — no cloud AI; would need the "no AI features yet" rule in AGENTS.md revisited first)
- Exportable review packages (still plain local files)

## Explicitly not planned — ever

These conflict with the project's identity (see AGENTS.md):

- Plugins for Revit/AutoCAD/browsers/Office
- Backend services, accounts, auth, cloud sync, telemetry
- Becoming a CAD app, PDF editor, or general image editor
