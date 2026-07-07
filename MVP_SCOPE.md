# MVP_SCOPE.md — TraceLayer 0.1

The MVP proves one thing: **a transparent paper-like window can stay above all other Windows apps and pass clicks through in Ghost Mode.** Everything else exists to make that demonstrable and minimally useful.

## In scope (0.1)

- Windows desktop app (Electron + React + TypeScript + Vite)
- Transparent, frameless, always-on-top window
- **Ghost Mode**: click-through to the app underneath; toolbar remains usable; global shortcut Ctrl+Alt+G
- **Edit Mode**: interact with the overlay
- Paper-like visual style (textured sheet, soft shadow)
- **New Paper** button with a subtle "new sheet placed on top" animation
- Import PNG/JPG
- Move / scale / rotate the imported image (drag / wheel / Shift+wheel)
- Opacity slider
- Save/load project as a local JSON file (native file dialogs)
- Minimal floating toolbar
- Move/resize the overlay window in Edit Mode (drag strip + OS edge resize)

## Explicitly out of scope (0.1)

Do not build these, even partially:

- Drawing/pen/annotation tools
- PDF or DWG/DXF import
- Rotating the paper/window itself (window rotation is not feasible; paper rotation is a roadmap item)
- Plugins of any kind (Revit, AutoCAD, browser, Office)
- Backend, auth, accounts, cloud sync, telemetry
- AI features
- macOS/Linux support (documented as future only)
- Packaging/installer, auto-update
- Multi-window / multi-monitor management
- Settings screens, theming, keyboard shortcut customization

## Acceptance criteria

1. App launches and shows a paper-like transparent window above other apps (stays on top when other windows are focused).
2. Toggling Ghost Mode makes clicks land in the app underneath; the overlay stays visible; Ctrl+Alt+G exits Ghost Mode from anywhere.
3. In Edit Mode: New Paper animates a sheet onto the stack; a PNG/JPG can be imported and moved/scaled/rotated; opacity slider works.
4. Save produces a JSON file; loading it restores papers, image transforms, and opacity.
5. `npm run typecheck` and `npm run build` pass.
