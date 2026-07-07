# AGENTS.md — Rules for AI agents working on TraceLayer

This file is binding for any AI agent (or human acting like one) contributing to this repo. Read it before changing anything.

## The concept — never break it

TraceLayer is **transparent tracing paper for the screen**: a standalone, universal Windows desktop overlay that floats above *all* other applications.

1. **Preserve the universal overlay concept.** The value is that it works over any app. Any change that ties TraceLayer to a specific host application is wrong.
2. **Do not build plugins.** No Revit plugin, no AutoCAD plugin, no browser extension, no Office add-in. TraceLayer is a standalone desktop app, full stop.
3. **Do not add backend, auth, or cloud.** No servers, no accounts, no sync, no telemetry, no analytics. All data stays in local files chosen by the user.
4. **Keep the UI minimal and paper-like.** One small floating toolbar, paper-textured sheets, no ribbons, no side panels, no settings mazes. When in doubt, leave it out.
5. **Windows first.** macOS is documented as future work in ROADMAP.md. Do not implement macOS support now; do not add platform abstraction layers "just in case".

## Scope discipline

- **Do not overbuild.** Implement only what MVP_SCOPE.md (or the task you were given) asks for.
- **Do not implement roadmap features early.** Ghost Mode click-through working reliably above other apps is the load-bearing feature; nothing else matters until it works.
- No AI features yet.
- New dependencies need a strong reason. Prefer the platform (Electron APIs, CSS, DOM) over libraries.

## Technical ground rules

- Stack: **Electron + React + TypeScript + Vite**. Do not swap frameworks.
- Main process code lives in `electron/`, renderer in `src/`. IPC goes through `electron/preload.ts` via `contextBridge` only — never enable `nodeIntegration`, never disable `contextIsolation`.
- Ghost Mode state is owned by the **main process** (`applyGhostMode` in `electron/main.ts`). The renderer mirrors it. Keep it that way: the global shortcut must keep working when the window is click-through.
- Project save files are plain JSON, versioned (`version: 1`). If you change the format, bump the version and keep loading old versions working.

## Workflow duties

- **Before finishing any task, run:**
  ```bash
  npm run typecheck
  npm run build
  ```
  Both must pass. If you changed runtime behavior, also launch with `npm run dev` and verify the affected flow manually if you can.
- **Update HANDOFF.md after every change**: what you did, what works, what doesn't, known issues, recommended next task.
- Update TASKS.md checkboxes when you complete or add tasks.
- Update ARCHITECTURE.md if you change the process model, IPC surface, or file format.
- Keep documentation truthful: never claim something works that you have not verified.
