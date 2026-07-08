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

## UX/bugfix pass (2026-07-07)

- [x] Rename "New Paper" → "New Sheet"; clarify tooltip (adds sheet, clears nothing)
- [x] "New Project (clear workspace)" action in settings popover (confirm + undoable)
- [x] Pen verified end-to-end via CDP trusted input; root cause of "pen not working" was stacked duplicate instances → added single-instance lock in main
- [x] Remove grey top bar (transparent drag strip, grip hint on hover only)
- [x] Toolbar visually below the sheet (64 px bottom paper margin)
- [x] Scale/målestok UI placeholder (Uncalibrated label, 1:50/1:100/1:200 presets, disabled Calibrate…) + `ScaleCalibration` data model in project files
- [ ] Real scale calibration flow (pick two points, enter distance → pixelsPerUnit) — later, see ROADMAP

## Pen rendering fix + ruler (2026-07-07)

- [x] Fix invisible strokes: zero-size svg is never painted by Chromium; use full-size svg + centered `<g transform>` (verify pixels, not DOM!)
- [x] Pen color (4 presets) + width (1/2/4 px), per-stroke, persisted in project files
- [x] Responsive corner ruler (top + left) with px ticks, or approximate real-world units when a scale preset is set
- [x] Click-through failsafe: re-assert ignoreMouseEvents on focus/restore/show

## Snapshot / screenshot-and-trace (2026-07-07)

- [x] Camera button: capture the screen under the overlay (`desktopCapturer`, overlay `setOpacity(0)` during grab), crop to window bounds, insert as image on the top sheet aligned 1:1 with the screen (scale = 1/displayScaleFactor)
- [ ] Multi-monitor edge case: window straddling two displays captures only the best-matching display

## Milestone 0.1.x — hardening (only after manual verification)

- [ ] Error toasts instead of `alert()` for load failures
- [ ] Remember window position/size between launches (local file, no cloud)
- [ ] Guard against huge imported images (warn on multi-MB data URLs)
- [ ] App icon
- [ ] Packaging with electron-builder (portable exe / NSIS installer)

## Markup + sheet navigation (2026-07-07)

- [x] Text/Note tool: click the active sheet to place an editable, movable note bubble (`src/components/TextBoxView.tsx`); minimal beige/paper style, drag by grip, edit by clicking the text
- [x] Callout tool: click the active sheet to place a bubble with an arrow pointing at the click point; drag the bubble (grip) and the arrow target (small handle, when selected) independently; per-callout `style.color` (toolbar color dots while the tool is active)
- [x] Callouts render above images/strokes, below the ruler/toolbar/selection outlines (see ARCHITECTURE.md layering)
- [x] Text boxes and callouts belong to a single sheet (`sheetId`) and save/load with the project
- [x] Sheet previous/next navigation: toolbar buttons + "Sheet i/N" label, Alt+Up/Down and PageUp/PageDown shortcuts; introduces `activeSheetId` as the target for new strokes/text/callouts/imports, independent of the sheet stack's fixed z-order (see ARCHITECTURE.md "Active sheet vs. top sheet")
- [x] Data model: `PaperSheet` gained `textBoxes`, `callouts`, and a reserved (unused) `calibration` placeholder; `ProjectFile.version` bumped to a real schema version (`SCHEMA_VERSION = 2`); `normalizeProject()` upgrades v1 files and older/partial v2 files with safe defaults
- [x] Undo/redo: text box/callout create, delete, drag, and edit-session-start all push history the same way image drags already did — no changes needed to the history engine since the new arrays live inside `papers` (already snapshotted). Ctrl+Z/Y are suppressed while a text field has focus so native in-field text undo isn't hijacked.
- [x] Known simplification: when the active sheet isn't the topmost one, its highlight ring can be mostly covered by sheets stacked above it — **resolved in the 2026-07-08 bugfix pass**: the active sheet's group is lifted with a visual z-index (data order unchanged).
- [ ] Not done (out of scope for this pass): resizing text boxes/callouts, per-textbox color/style, multiple callout arrow targets, per-sheet calibration UI (the `calibration` field is a placeholder only)

## Bugfix pass (2026-07-08)

- [x] Fix reversed typing in text boxes/callouts: contentEditable divs are now uncontrolled (no React text child; external changes sync to `innerText` only while unfocused) — re-rendering the child on every keystroke reset the caret to the start
- [x] Rulers stay visible/aligned after New Sheet: random per-sheet tilt disabled (`newSheet()` → tilt 0; `normalizeProject()` flattens old tilts); `tilt` stays in the schema for future paper rotation
- [x] Sheet navigation visibly switches sheets: per-sheet `.sheet-group` wrapper; active group lifted with z-index 10 (visual only, stack order/data unchanged); drawing surface raised to z 20, ruler stays 30
- [x] Delete-sheet trash button next to the sheet controller: confirm only when the sheet has content, disabled for the last remaining sheet, sheet underneath becomes active, sheet's images removed too, undoable
- [x] Scale popover fits all buttons (width 224px, wrapping preset row)
- [x] Settings icon replaced with a real gear (feather cog outline, inline SVG, no dependency); TrashIcon added in the same style
- [ ] Manual click-through of these fixes in a running window (typing in a note/callout, New Sheet + rulers, sheet nav visual lift, delete sheet, popover layout)

## Anchoring + image lock + nav direction + sheet sound (2026-07-08, branch fix-annotation-anchors-and-sheet-nav)

- [x] New Sheet sound: `src/assets/audio/new_sheet_sound.wav` plays on the New Sheet button only; settings-popover toggle, persisted in localStorage (`tracelayer.newSheetSound`), fails silently
- [x] Sheet navigation direction: Up = sheet above, Down = sheet underneath (was inverted); tooltips + Alt+Up/Down / PageUp/PageDown match; disabled states follow
- [x] Annotation anchoring (`src/anchor.ts`): text boxes/callouts anchor to the sheet (default) or to an imported image; image-anchored annotations follow the image's move/scale/rotate; placement anchors to the selected image if any; deleting an image (or its sheet) re-anchors its annotations to the sheet in place; old files migrate to sheet anchors; future shapes reuse the same `Anchor` type
- [x] Schema v3: `anchor` on annotations, `locked` on images; `normalizeProject()` upgrade path kept for v1/v2
- [x] Image lock/pin: toolbar lock toggle on the selected image; locked images can't be moved/scaled/rotated/deleted (still selectable/unlockable); state saves/loads; undoable
- [ ] Manual pass: anchor a note + callout to an image, move/scale/rotate the image and confirm they follow; delete the image and confirm annotations stay put on the sheet; lock an image and try to drag/wheel/delete it; toggle the sheet sound off/on and confirm persistence across restarts; save a v3 project and reload it; load an old v1/v2 file

## Sheet stack visibility + left toolbox (2026-07-08, branch fix-annotation-anchors-and-sheet-nav)

- [x] Sheet translucency: background alpha 0.84 → 0.55 so lower-sheet content stays faintly visible through stacked sheets (~20% under two sheets, was ~2.6%)
- [x] Removed the active-sheet z-index lift (it reordered the visual stack and buried lower content); sheets above the active one now fade (opacity 0.25) + become click-through instead — paint order never changes
- [x] Bottom wrapping toolbar replaced by a collapsible left-side 2-column icon toolbox: grouped (sheet/import/snapshot, drawing/text/callout+undo/redo, navigation/delete, scale/save/load/settings, view/window), beige style + tooltips kept, `toolbar` class kept for the Ghost Mode hover contract, viewport-capped height with vertical scroll, popovers open right as position: fixed
- [x] Paper left margin 112px (toolbox chrome doesn't cover the left ruler); bottom margin back to 18px; Ruler.tsx constants synced
- [x] ARCHITECTURE.md: UI chrome rule updated (toolbox independent of sheet content) + new "Sheet stack visibility" rule (never reorder the paint order)
- [ ] Manual pass: image on Sheet 1 → add Sheets 2–3 → image still faintly visible; navigate down → uppers fade, image clear; toolbox usable at small window sizes; collapse/expand pill; popovers open right; Ghost Mode hover still works over the toolbox

## Single-column toolbox + fixed startup size (2026-07-08, branch fix-annotation-anchors-and-sheet-nav)

- [x] Toolbox reworked from 2 columns to one compact 56px column (13px icons); all controls fit without scrolling at the minimum window height — height budget documented on `.toolbar` in styles.css
- [x] Removed the disabled PDF page-controller placeholder from the toolbox (kept reserved in types/ROADMAP) and the inline scale label (tooltip + popover still show the value) to fit the budget
- [x] Window always starts centered at fixed 800×500; window-state persistence removed; minHeight 500 hard floor so the toolbox can never be clipped; minWidth 360
- [ ] Manual pass: resize to minimum and confirm the full toolbox is visible without scroll; restart and confirm centered 800×500

## Later

See [ROADMAP.md](ROADMAP.md). Do not start roadmap items while 0.1 verification tasks are open.
