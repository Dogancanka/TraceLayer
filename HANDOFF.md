# HANDOFF.md

> Agents: rewrite the "Current state" section after every change. Keep history short — this file describes *now*, not a changelog.

**Last updated:** 2026-07-08 (branch `fix-annotation-anchors-and-sheet-nav`: single-column toolbox + fixed 800×500 start)

## Current state

Latest: **Toolbox reworked to a single compact column; window always starts centered at 800×500.**

- **Single-column toolbox**: the 2-column grid read poorly — now one compact 56px-wide column (13px icons, tight padding, same beige style/groups/tooltips). **No scrolling, ever**: the whole column fits (~460px worst case — image selected or tool option dots open) within the minimum window height. The disabled PDF page-controller placeholder row was removed from the toolbox to make the budget (multi-page stays reserved via `DocumentPages` in types.ts); the scale button no longer shows its inline label (value lives in the tooltip + popover). Adding any toolbox control requires re-checking the height budget — see the comment on `.toolbar` in styles.css.
- **Fixed startup geometry** (`electron/main.ts`): window always opens centered at 800×500. `window-state.json` persistence removed entirely. `minHeight: 500` is a hard floor tied to the toolbox budget (bar can never be clipped at any allowed window size); `minWidth: 360`; still freely resizable above that.
- Popovers unchanged in behavior (open right, `position: fixed`), repositioned for the narrower toolbox (left: 80px).
- **Verification**: `npm run typecheck` and `npm run build` pass. Ghost Mode untouched (`.toolbar` class contract intact). Not clicked through in a running window.

Earlier state:

Latest: **Sheet stack visibility fix + bottom toolbar replaced by a left toolbox.**

- **Sheet stack visibility**: two causes fixed. (1) Sheet background alpha was 0.84 — an image under two sheets kept only ~2.6% visibility, effectively disappearing; now 0.55, leaving ~20% show-through under two sheets. (2) The active-sheet z-index lift (navigating to Sheet 2 of 3 painted it *above* Sheet 3) scrambled the visual stack and buried lower content; removed entirely. New model: paint order never changes; sheets **above** the active one get `.sheet-group.above-active` — faded to 0.25 opacity and `pointer-events: none` — so the active sheet is clearly visible/editable and everything below it stays faintly visible, like lifting the upper sheets off a real stack. Fully reversible: activating the top sheet restores all sheets. See ARCHITECTURE.md "Sheet stack visibility".
- **Left toolbox** (`Toolbar.tsx` + `.toolbar` in styles.css): the bottom wrapping bar is gone. The toolbar is now a fixed left-side 2-column icon grid, grouped by separators: sheet/import/snapshot → pen/eraser/text/callout/undo/redo (option dots span the row while a tool is active) → sheet label/up/down/delete + the disabled PDF page placeholder → scale/save/load/settings → paper-opacity + image-opacity/lock + ghost/collapse/hide/close. Same beige style, icons and tooltips. Height caps at the viewport and scrolls vertically on very short windows; width is fixed and small, so nothing clips at any window size. Collapses to a small "TraceLayer ›" pill in the same corner. The root keeps the `toolbar` class (Ghost Mode hover contract — unchanged). Popovers (scale/settings) now open to the **right** as `position: fixed` elements — absolute children would be clipped by the toolbox's scroll overflow; this requires the toolbox to stay transform-free.
- **Paper margins**: sheets now sit at `inset: 18px 18px 18px 112px` — wide left margin so the toolbox never covers the left ruler; bottom margin shrank from 64px (old bottom bar) to 18px. `Ruler.tsx` constants (`LEFT/TOP/RIGHT/BOTTOM`) updated in sync, and the ruler corner badge is positioned inline from those constants.
- **Verification**: `npm run typecheck` and `npm run build` pass. Ghost Mode logic untouched. Not clicked through in a running window; manual check items added to TASKS.md (especially: image on Sheet 1 visible after adding Sheets 2–3 and navigating, and toolbox usability at small window sizes).

Earlier state:

Latest: **Toolbar responsiveness fix.** The toolbar was a fixed, centered, single-row flexbox with no width cap — a window narrower than the row clipped both ends off-screen (html/body have `overflow: hidden`). CSS-only fix in `.toolbar`: `max-width: calc(100vw - 16px)`, `flex-wrap: wrap`, `justify-content: center`; it stays bottom-center and grows upward into extra rows when the window is narrow, so every control (New Sheet, tools, sheet nav, Ghost, settings, …) stays visible and clickable at any window size. Popovers got `max-width: calc(100vw - 12px)` for the same reason. No markup/logic changes; Ghost Mode's `.toolbar` hover contract untouched. A new **UI chrome rule** is documented in ARCHITECTURE.md: toolbar, rulers and window controls are chrome — never clipped, transformed or hidden by sheet content (chrome z-order: sheets/active group ≤ 10, drawing surface 20, ruler 30, toolbar 50). `npm run typecheck` and `npm run build` pass.

Earlier state:

Latest: **Annotation anchoring + image lock + sheet-nav direction fix + New Sheet sound.**

- **Annotation anchoring** (`src/anchor.ts`, `Anchor` in `src/types.ts`, resolved in `LayerStack`): text boxes and callouts store coordinates in an *anchor space* — the sheet (default) or an imported image. Image-anchored annotations follow the image's move/scale/rotate automatically, because rendering always resolves through the live image transform. Placement default: image selected → new annotation anchors to it; otherwise sheet. Selecting the text/callout tool now deliberately keeps an image selection alive (it's the anchor target). Views work purely in screen space (`position`/`bubblePosition`/`targetPosition` + `onMove`); all conversion lives in `LayerStack`. Deleting an image (directly or via Delete Sheet) bakes anchored annotations' screen positions and re-anchors them to the sheet (`detachAnnotationsFromImage`). Old files migrate to sheet anchors. Future shapes must reuse this pattern — see ARCHITECTURE.md "Annotation anchoring".
- **Schema v3** (`SCHEMA_VERSION = 3`): adds `anchor` on text boxes/callouts and `locked` on images; `normalizeProject()` upgrades v1/v2 with sheet anchors and `locked: false`. Loader accepts versions 1–3.
- **Image lock** (lock button in the toolbar while an image is selected): locked images ignore drag/wheel/Shift+wheel and the Delete key, stay selectable (to unlock), show a solid (not dashed) selection outline and no grab cursor. Lock state persists in the project file and is undoable.
- **Sheet navigation direction fixed**: Up (button, Alt+Up, PageUp) = sheet *above* (later in the stack); Down (button, Alt+Down, PageDown) = sheet *underneath*. Previously inverted. Tooltips updated; disabled states follow (Up disabled on the top sheet, Down on the bottom one).
- **New Sheet sound** (`src/assets/audio/new_sheet_sound.wav`, imported as a Vite asset URL — see `src/assets.d.ts`): plays only on the New Sheet button, wrapped so any audio failure is silent. Toggle in the settings popover ("New Sheet sound: On/Off"), persisted in `localStorage` (`tracelayer.newSheetSound`), default on.
- **Verification**: `npm run typecheck` and `npm run build` pass. Ghost Mode untouched. Not manually clicked through — the anchor math (translate → rotate → scale, matching ImageView's CSS transform order) and lock/sound paths need a human pass (see TASKS.md).

Earlier state:

Latest: **Bugfix pass over the markup + sheet-navigation work.** Six fixes, no new features:

- **Reversed typing in notes/callouts fixed** (`TextBoxView.tsx`, `CalloutView.tsx`): the `contentEditable` divs rendered `{text}` as a React child, so every keystroke re-rendered the node and reset the caret to the start ("door" → "rood"). They are now uncontrolled: React renders no children; an effect writes `box.text`/`callout.text` into `el.innerText` only when the element is **not** focused (covers mount, undo/redo, project load). `onInput` still reads back via `innerText`. Do not reintroduce a text child there.
- **Random sheet tilt removed** (`App.tsx`, `types.ts`): random per-sheet rotation misaligned sheet edges with the fixed corner rulers after New Sheet. `newSheet()` always creates `tilt: 0` and `normalizeProject()` flattens older files' tilts to 0 on load. The `tilt` field stays in the schema and the `--tilt` CSS var still works — re-enable only together with real paper rotation (pointer mapping). Rulers remain `z-index: 30`, above all sheet content.
- **Sheet navigation is now visible** (`LayerStack.tsx`, `.sheet-group` in `styles.css`): each sheet plus its images/strokes/notes/callouts is wrapped in one absolutely-positioned full-window group div; the active sheet's group gets `z-index: 10`, lifting the whole sheet above later sheets. Purely visual — the `papers` array and save format never reorder. Side effect (intended): a navigated-to lower sheet's content is interactive again while active. The `.drawing-surface` gained `z-index: 20` so pen/eraser input stays above the lifted group; ruler (30) and toolbar (50) unchanged.
- **Delete sheet** (trash button next to the sheet controller): deletes the active sheet and everything on it (its images are filtered out of `images` too). Confirms first only when the sheet has content; disabled (with explanatory tooltip) when a single sheet remains; afterwards the sheet underneath becomes active. Undoable via the normal snapshot history.
- **Scale popover widened** (224px, presets row wraps) so 1:50/1:100/1:200/Clear all fit; still centered on its button.
- **Settings icon is a real gear** (feather `settings` cog outline in `icons.tsx`; old one read as a sun/brightness icon). Added `TrashIcon` in the same style; still no icon dependency.
- **Verification**: `npm run typecheck` and `npm run build` pass. Ghost Mode logic untouched (the new `.sheet-group` divs set no `pointer-events`, so they inherit `none` from `.stage.ghost` like everything else). Not yet manually clicked through in a running window — the standing manual-verification pass in TASKS.md still applies and now includes these fixes.

Earlier state:

Latest: **Text notes, callout bubbles with arrows, and sheet up/down navigation.**

- **Text/Note tool** (`src/components/TextBoxView.tsx`): toolbar "Note" tool, click the active sheet to place a small beige, editable, movable note. Drag its grip (⠿) to move; click its text to edit (a `contentEditable` div, read back via `innerText` so multi-line notes round-trip). Belongs to a sheet (`TextBox.sheetId`) and renders/hit-tests within that sheet's layer, same covered-by-newer-sheet rule as images.
- **Callout tool** (`src/components/CalloutView.tsx`): toolbar "Callout" tool (with color dots, like the pen), click the active sheet to place a bubble with an arrow pointing at the click point (bubble spawns offset up-left of the target). Drag the bubble's grip to move the bubble; select it and drag the small circular handle to re-aim the arrow target independently. The arrow itself is one shared per-sheet SVG line layer (`callout-arrow-layer` in `LayerStack`) with an arrowhead marker, rendered above that sheet's images/strokes.
- **Sheet navigation**: toolbar ⌃/⌄ buttons + a "Sheet i/N" label, plus **Alt+Up/Down** and **PageUp/PageDown**. This introduces `activeSheetId` — which sheet new strokes/text/callouts/imports land on — decoupled from the sheet stack's z-order (the stack itself never reorders; see ARCHITECTURE.md "Active sheet vs. top sheet"). New Sheet still adds on top and makes that sheet active, matching prior behavior when you never navigate away. Not a PDF page control — the existing disabled "1/1" page-controller placeholder is untouched and visually separated from this.
- **Data model / schema version bump**: `PaperSheet` now carries `textBoxes`, `callouts`, and a reserved (unused) `calibration` placeholder alongside `strokes`. `ProjectFile.version` is a real schema version now (`SCHEMA_VERSION = 2` in `src/types.ts`); `normalizeProject()` upgrades v1 files (and older/partial v2 files) with safe defaults — verified with a standalone script exercising v1 input, partial-v2 input, and an empty-papers edge case (all pass; see TASKS.md).
- **Selection generalized**: the old image-only `selectedId` became `selection: { kind: 'image'|'text'|'callout', id } | null`, threaded through `LayerStack`/`Toolbar`/the Delete-key handler.
- **Undo/redo**: text box/callout create, delete, drag, and "start editing" all push a history snapshot exactly like image drags already did. No changes were needed to the history engine itself — `textBoxes`/`callouts` live inside `papers`, which was already fully snapshotted. Ctrl+Z/Ctrl+Y and the Delete/Backspace shortcut are now suppressed while a text box/callout has focus (`document.activeElement.isContentEditable`), so typing and native in-field undo aren't hijacked by the app-level history.
- **Verification**: `npm run typecheck` and `npm run build` pass. No test framework exists in this repo (no test script, no test files), so the schema-normalization logic was additionally checked with a standalone esbuild-compiled script exercising `normalizeProject()` against v1/v2/edge-case inputs (all assertions passed). **Not manually verified in a running Electron window** — this pass was done from a phone-only session per instructions; the interaction code (drag via pointer capture, contentEditable focus/read-back, stage click routing) follows the same patterns already used and verified for images/strokes, but placing/editing/dragging text boxes and callouts and the sheet-nav buttons have not been clicked through by a human yet. Recommend a manual pass on Windows before considering this fully done (see TASKS.md).

Earlier state:

Latest: **Snapshot (screenshot-and-trace)** — camera button in the toolbar captures the screen *under* the overlay and drops it on the top sheet as a normal image, aligned 1:1 with the screen. Flow: IPC `capture-under` → main sets `win.setOpacity(0)`, waits 150 ms for the compositor, grabs the matching display via `desktopCapturer` at physical resolution, crops to the window bounds, restores opacity, returns `{dataUrl, scaleFactor}`; renderer inserts an ImageItem at center with `scale = 1/scaleFactor`. Local only, user-triggered, nothing persisted or sent anywhere. Verified end-to-end via CDP (captured desktop visible on the sheet, natural size = window × scaleFactor). Known edge: a window straddling two monitors captures only the best-matching display (TASKS.md).

Latest: **toolbar is now icon-based** (`src/components/icons.tsx`, inline feather-style SVGs, no icon dependency added). All primary actions are compact icon buttons with tooltips; separators group sheet/import, tools, pages/scale, view, and window controls. Buttons that open popovers (scale, settings) show a tiny drop arrow. Active tool gets a clear highlight (`.active-tool`: darker bg + inset ring). Collapsed pill = chevron-up + "TraceLayer". Also fixed: ruler now renders above images/strokes (`.ruler` z-index 30) and the scale popover is compact and centered on its button so it cannot be pushed off-window. Verified via CDP screenshots. UI-only pass; Ghost Mode logic untouched.

**Pen bug found and fixed for real this time.** Strokes were committed to the DOM but never painted: `.stroke-layer` was a zero-size (`width:0;height:0`) svg relying on `overflow: visible`, and **Chromium does not paint the content of a zero-size svg at all**. Earlier "pen works" verification only counted DOM paths — lesson: verify pixels (screenshots), not DOM. Strokes now render in a full-size svg with a centered `<g transform>` (window size via `src/useWindowSize.ts`). Verified visually via CDP screenshots: grey and red strokes visible on the sheet.

Also added in this pass:

- **Pen color + width**: 4 color dots and 3 width buttons appear in the toolbar while the pen tool is active. Per-stroke `color`/`width` persist in project files (older files normalize to graphite/2px). Note: per-stroke SVG attributes are used — do not reintroduce `stroke`/`stroke-width` in `.stroke-layer path` CSS, it would override them.
- **Corner ruler** (`src/components/Ruler.tsx`): minimal rulers along the paper's top and left edges, responsive to window resize. Uncalibrated → CSS px ticks with a "px" corner badge. With a scale preset (e.g. 1:100) → real-world labels ("2 m, 4 m, …") computed from CSS reference DPI (96/25.4 px per mm), corner badge "≈1:100" — approximate until measured calibration exists. Ruler constants must stay in sync with `.paper-sheet` inset (18px margins, 64px bottom).
- **Click-through failsafe**: main re-asserts `setIgnoreMouseEvents` on window focus/restore/show, so Edit Mode can never stay stuck ignoring the mouse after a race.

Earlier state:

MVP 0.1 + toolbar polish + most of roadmap 0.2 + a UX/bugfix pass. `npm run typecheck` and `npm run build` pass; app launches.

Latest changes (UX/bugfix pass):

- **"New Paper" renamed to "New Sheet"** — adds a translucent sheet on top, never clears anything. A separate **"New Project (clear workspace)"** action lives in the ⚙ settings popover (confirm dialog, undoable — it pushes a history snapshot first).
- **Pen investigated and verified working end-to-end** via CDP trusted input (live preview during drag, committed path in DOM, correct coordinates). The reported "pen does not work" was almost certainly **two app instances stacked on top of each other** (both always-on-top; input landed in the stale one). Fixed the root cause: `app.requestSingleInstanceLock()` in `electron/main.ts` — a second launch quits itself and focuses the existing window.
- **Grey top bar removed**: the drag strip is now fully transparent; a small grip dot hint fades in on hover only. Still draggable.
- **Toolbar now sits below the paper**: sheets keep a 64 px bottom margin (`.paper-sheet` inset — keep in sync with `.toolbar` bottom offset), so the bar floats in the transparent band under the sheet, not on top of it. Collapse pill behavior unchanged (`.toolbar` class contract with the Ghost Mode hover check still holds).
- **Scale (målestok) UI placeholder**: toolbar button shows the scale label ("Scale: –" / "1:100"); its popover has "Scale: Uncalibrated", presets 1:50 / 1:100 / 1:200 (label-only, no measurement), Clear, and a disabled "Calibrate…" button. Data model `ScaleCalibration` (`unit`, `drawingScale`, `pixelsPerUnit`, `calibrationPoints`) is saved/loaded as optional `scale` on `ProjectFile`; older files normalize to uncalibrated.

Earlier changes:

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
- Edit Mode: New Paper (with drop-on-top animation), PNG/JPG import (native dialog → embedded data URL) onto the active sheet, image drag/wheel-scale/Shift+wheel-rotate, Delete to remove, opacity slider
- Sheet navigation: prev/next toolbar buttons + "Sheet i/N" label, Alt+Up/Down and PageUp/PageDown
- Text notes and callout bubbles with arrows: place, drag, edit, delete; scoped to a sheet
- Save/load `.tracelayer.json` via native dialogs (versioned format, see ARCHITECTURE.md), including text boxes/callouts, with safe defaults for older files
- Minimal floating beige toolbar (bottom-center): collapse/expand, settings popover with opacity + shortcuts, Hide (minimize) and ✕ (quit), disabled page-controller placeholder (PDF, unrelated to sheet nav); window movable via top drag strip and toolbar grip

## What does not work yet / unverified

- **Ghost Mode click-through has NOT been manually verified over real apps.** The implementation is the standard Electron pattern, but nobody has clicked through onto Notepad/browser/CAD yet. This is the first thing to verify (TASKS.md).
- **Text boxes, callouts, and sheet navigation have not been manually clicked through in a running window** — this pass was implemented and verified via typecheck/build plus a standalone script exercising `normalizeProject()`, from a phone-only session. Recommend a manual pass (place/edit/drag a note and a callout, navigate sheets, save/reload) before fully trusting it.
- Scale UI sets labels and drives the ruler, but real measured calibration (pick two points, enter distance → `pixelsPerUnit`) does not exist yet; ruler lengths are approximate (assume 96 dpi CSS px). The new per-sheet `calibration` field is a placeholder only — nothing reads or writes it yet.
- Eraser verified in code review only; pen verified visually via CDP screenshots.
- Edge-resizing a transparent frameless window on Windows is historically finicky in Electron; unverified.
- Paper rotation (0.2 item): not implemented — needs pointer-coordinate mapping design so drawing works on a rotated stage.
- Pen pressure: not implemented (optional 0.2 item).
- No packaging/installer — runs via `npm run dev` / `npm run start` only.

## Known issues / sharp edges

- Strokes are not clipped to the sheet edge — drawing can extend past the paper border (cosmetic).
- Strokes/images/text boxes/callouts are window-center-relative: resizing the window shifts content relative to the paper edges.
- Loading a project replaces the current document (it does push an undo snapshot first).
- Images are embedded in project JSON as base64 data URLs → large images make large project files.
- Load failure shows a plain `alert()`.
- Window position/size deliberately not persisted (removed 2026-07-08): every launch starts centered at 800×500, minimum 360×500.
- Opening DevTools docked can break window transparency — open detached if needed.
- `Backspace` also deletes the selected image/text box/callout (same handler as `Delete`), but only when a text field doesn't have focus (so backspacing inside a note edits its text instead of deleting the note).
- Global shortcut Ctrl+Alt+G is registered system-wide while the app runs; collides with any other app using it.
- While a lower sheet is active, the sheets above it are faded (opacity 0.25) and click-through; their content is not clickable until they're active again — navigate to a sheet to edit its content. The stack's paint order itself never changes.
- Deleting a sheet does not restore which sheet was active on undo (the document comes back; the active-sheet pointer self-heals to the top sheet if its sheet vanished).
- Text box/callout resizing is not implemented (height grows with content; width is fixed at creation).
- Sheets no longer get a random tilt (it misaligned them with the corner rulers); the paper stack looks perfectly aligned until real paper rotation lands.
- An image-anchored annotation scales its *position* with the image but not its own box size/text — zooming an image far out leaves its notes full-size at converging positions. Acceptable for now.
- There is no UI to change an existing annotation's anchor; it's chosen at placement (image selected → image anchor) and only changes automatically when the anchor image is deleted.
- A locked image's opacity can still be changed via the toolbar slider while selected — deliberate (opacity is a conscious act, not an accidental drag).

## How to run

```bash
npm install
npm run dev     # or: npm run start
```

## Next recommended task

**Manual verification of Ghost Mode on Windows 11** (top of TASKS.md): launch, put the window over Notepad/a browser, toggle Ghost Mode (button and Ctrl+Alt+G), confirm clicks land underneath, confirm the toolbar still responds to hover+click (also while collapsed), confirm Ctrl+Alt+G exits, confirm Hide→taskbar restore works. Fix whatever that surfaces before touching anything else.

Once a human is at a keyboard, also do a manual pass on this session's markup/navigation work (see "What does not work yet" above): place a text note and a callout, drag/edit/delete each, navigate sheets with the toolbar buttons and with Alt+Up/Down + PageUp/PageDown, save the project, reload it, and confirm everything comes back. Also try loading a pre-existing (older) `.tracelayer.json` project file to confirm it still opens cleanly.
